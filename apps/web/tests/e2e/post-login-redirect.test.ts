import { test, expect } from '@playwright/test'

test.describe('Post-Login Redirect Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Start from landing page
    await page.goto('/')
  })

  test.describe('Authenticated User Redirect', () => {
    test('should redirect authenticated user from landing page to dashboard', async ({ page }) => {
      // Mock authenticated user state
      await page.addInitScript(() => {
        // Mock localStorage token to simulate authenticated state
        localStorage.setItem('supabase.auth.token', JSON.stringify({
          access_token: 'mock-token',
          refresh_token: 'mock-refresh',
          expires_at: Date.now() + 3600000
        }))
      })

      // Navigate to landing page
      await page.goto('/')

      // Should redirect to dashboard automatically
      await expect(page).toHaveURL('/dashboard')

      // Should show dashboard content
      await expect(page.locator('h1')).toContainText('Thinkhaven')
      await expect(page.locator('text=Your Strategic Sessions')).toBeVisible()
    })

    test('should not create redirect loop between landing and dashboard', async ({ page }) => {
      // Mock authenticated user
      await page.addInitScript(() => {
        localStorage.setItem('supabase.auth.token', JSON.stringify({
          access_token: 'mock-token',
          refresh_token: 'mock-refresh',
          expires_at: Date.now() + 3600000
        }))
      })

      // Monitor navigation events
      const navigationPromises: Promise<any>[] = []
      page.on('framenavigated', (frame) => {
        if (frame === page.mainFrame()) {
          navigationPromises.push(Promise.resolve(frame.url()))
        }
      })

      await page.goto('/')

      // Wait for navigation to stabilize
      await page.waitForURL('/dashboard')

      // Should not have excessive redirects (more than 3 would indicate a loop)
      expect(navigationPromises.length).toBeLessThan(4)

      // Page should be stable on dashboard
      await page.waitForTimeout(1000)
      expect(page.url()).toContain('/dashboard')
    })
  })

  test.describe('Unauthenticated User Flow', () => {
    test('should redirect unauthenticated user from dashboard to login', async ({ page }) => {
      // Ensure no auth token
      await page.addInitScript(() => {
        localStorage.clear()
        sessionStorage.clear()
      })

      // Try to access dashboard directly
      await page.goto('/dashboard')

      // Should redirect to login
      await expect(page).toHaveURL('/login')

      // Should show login page
      await expect(page.locator('text=Sign in')).toBeVisible()
    })

    test('should stay on landing page when unauthenticated', async ({ page }) => {
      // Ensure no auth token
      await page.addInitScript(() => {
        localStorage.clear()
        sessionStorage.clear()
      })

      await page.goto('/')

      // Should stay on landing page
      expect(page.url()).toContain('/')

      // Should show landing page content
      await expect(page.locator('text=Transform Strategic Analysis')).toBeVisible()
      await expect(page.locator('text=View Live Demo')).toBeVisible()
    })
  })

  test.describe('Error Handling', () => {
    test('should handle database errors gracefully without crashing', async ({ page }) => {
      // Mock authenticated user
      await page.addInitScript(() => {
        localStorage.setItem('supabase.auth.token', JSON.stringify({
          access_token: 'mock-token',
          refresh_token: 'mock-refresh',
          expires_at: Date.now() + 3600000
        }))

        // Mock Supabase to return database error
        window.mockDatabaseError = true
      })

      // Intercept database requests and return errors
      await page.route('**/rest/v1/workspaces*', async (route) => {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 'PGRST205',
            message: 'column "dual_pane_state" does not exist',
            details: 'schema mismatch'
          })
        })
      })

      await page.goto('/dashboard')

      // Should show error state instead of crashing
      await expect(page.locator('text=Database Error')).toBeVisible()
      await expect(page.locator('text=Retry')).toBeVisible()

      // Page should remain functional
      expect(page.url()).toContain('/dashboard')
    })

    test('should provide retry functionality for network errors', async ({ page }) => {
      // Mock authenticated user
      await page.addInitScript(() => {
        localStorage.setItem('supabase.auth.token', JSON.stringify({
          access_token: 'mock-token',
          refresh_token: 'mock-refresh',
          expires_at: Date.now() + 3600000
        }))
      })

      let requestCount = 0

      await page.route('**/rest/v1/workspaces*', async (route) => {
        requestCount++
        if (requestCount === 1) {
          // First request fails
          await route.abort('internetdisconnected')
        } else {
          // Subsequent requests succeed
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([])
          })
        }
      })

      await page.goto('/dashboard')

      // Should show error initially
      await expect(page.locator('text=Connection Problem')).toBeVisible()

      // Click retry
      await page.click('text=Retry')

      // Should eventually load successfully
      await expect(page.locator('text=Your Strategic Sessions')).toBeVisible()
      expect(requestCount).toBeGreaterThan(1)
    })
  })

  test.describe('Loading States', () => {
    test('should show appropriate loading states during authentication', async ({ page }) => {
      // Delay auth loading to test loading state
      await page.addInitScript(() => {
        // Mock slow auth loading
        const originalFetch = window.fetch
        window.fetch = function(...args) {
          if (args[0]?.toString().includes('auth')) {
            return new Promise(resolve => {
              setTimeout(() => resolve(originalFetch.apply(this, args)), 1000)
            })
          }
          return originalFetch.apply(this, args)
        }
      })

      await page.goto('/')

      // Should show loading state
      await expect(page.locator('text=Loading Thinkhaven')).toBeVisible()

      // Should not show main content during loading
      await expect(page.locator('text=Transform Strategic Analysis')).not.toBeVisible()
    })

    test('should show loading state on dashboard before workspace data loads', async ({ page }) => {
      // Mock authenticated user
      await page.addInitScript(() => {
        localStorage.setItem('supabase.auth.token', JSON.stringify({
          access_token: 'mock-token',
          refresh_token: 'mock-refresh',
          expires_at: Date.now() + 3600000
        }))
      })

      // Delay workspace loading
      await page.route('**/rest/v1/workspaces*', async (route) => {
        await new Promise(resolve => setTimeout(resolve, 1000))
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([])
        })
      })

      await page.goto('/dashboard')

      // Should show loading state initially
      await expect(page.locator('text=Loading your strategic workspaces')).toBeVisible()

      // Should eventually show dashboard content
      await expect(page.locator('text=Your Strategic Sessions')).toBeVisible()
    })
  })

  test.describe('Performance and Reliability', () => {
    test('should complete redirect flow within reasonable time', async ({ page }) => {
      const startTime = Date.now()

      await page.addInitScript(() => {
        localStorage.setItem('supabase.auth.token', JSON.stringify({
          access_token: 'mock-token',
          refresh_token: 'mock-refresh',
          expires_at: Date.now() + 3600000
        }))
      })

      await page.goto('/')
      await page.waitForURL('/dashboard')
      await expect(page.locator('text=Your Strategic Sessions')).toBeVisible()

      const endTime = Date.now()
      const duration = endTime - startTime

      // Should complete within 5 seconds
      expect(duration).toBeLessThan(5000)
    })

    test('should handle rapid navigation without errors', async ({ page }) => {
      await page.addInitScript(() => {
        localStorage.setItem('supabase.auth.token', JSON.stringify({
          access_token: 'mock-token',
          refresh_token: 'mock-refresh',
          expires_at: Date.now() + 3600000
        }))
      })

      // Navigate rapidly between pages
      await page.goto('/')
      await page.goto('/login')
      await page.goto('/dashboard')
      await page.goto('/')

      // Should end up in correct state
      await page.waitForURL('/dashboard')
      await expect(page.locator('text=Your Strategic Sessions')).toBeVisible()

      // Check for any console errors
      const errors = await page.evaluate(() => {
        return window.console?.errors || []
      })
      expect(errors.filter(e => e.includes('redirect'))).toHaveLength(0)
    })
  })
})