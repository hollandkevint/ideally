import { test, expect } from '@playwright/test'
import { AuthHelper } from '../helpers/auth.helper'
import { testUsers } from '../fixtures/users'

test.describe('Pricing Page', () => {
  let authHelper: AuthHelper

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page)
  })

  test.describe('Public Pricing Display', () => {
    test('should display pricing page with three tiers', async ({ page }) => {
      await page.goto('/pricing')

      // Check page header
      await expect(page.locator('h1:has-text("Unlock Strategic Thinking")')).toBeVisible()

      // Check all three pricing tiers are displayed
      await expect(page.locator('text=Starter')).toBeVisible()
      await expect(page.locator('text=Professional')).toBeVisible()
      await expect(page.locator('text=Business')).toBeVisible()

      // Check prices are displayed
      await expect(page.locator('text=$10')).toBeVisible()
      await expect(page.locator('text=$30')).toBeVisible()
      await expect(page.locator('text=$100')).toBeVisible()
    })

    test('should display credit amounts for each tier', async ({ page }) => {
      await page.goto('/pricing')

      // Check credit amounts
      await expect(page.locator('text=5 credits')).toBeVisible()
      await expect(page.locator('text=10 credits')).toBeVisible()
      await expect(page.locator('text=20 credits')).toBeVisible()
    })

    test('should highlight Professional as most popular', async ({ page }) => {
      await page.goto('/pricing')

      // Check for "MOST POPULAR" badge
      await expect(page.locator('text=MOST POPULAR')).toBeVisible()

      // The Professional card should have distinct styling (border-blue-500)
      const professionalCard = page.locator('text=Professional').locator('..')
      await expect(professionalCard).toBeVisible()
    })

    test('should display feature lists for each tier', async ({ page }) => {
      await page.goto('/pricing')

      // Common features should appear
      await expect(page.locator('text=AI-powered BMad Method')).toBeVisible()
      await expect(page.locator('text=Canvas visual workspace')).toBeVisible()
      await expect(page.locator('text=PDF & Markdown exports')).toBeVisible()
    })

    test('should display trust indicators', async ({ page }) => {
      await page.goto('/pricing')

      // Check trust indicators at bottom
      await expect(page.locator('text=Secure payment via Stripe')).toBeVisible()
      await expect(page.locator('text=Credits never expire')).toBeVisible()
      await expect(page.locator('text=All major cards accepted')).toBeVisible()
    })

    test('should display FAQ section', async ({ page }) => {
      await page.goto('/pricing')

      // Check FAQ section
      await expect(page.locator('h2:has-text("Frequently Asked Questions")')).toBeVisible()
      await expect(page.locator('text=What is a credit?')).toBeVisible()
      await expect(page.locator('text=Do credits expire?')).toBeVisible()
    })
  })

  test.describe('Purchase Flow - Unauthenticated', () => {
    test('should require login when clicking purchase button', async ({ page }) => {
      await page.goto('/pricing')

      // Click on a purchase button
      await page.click('button:has-text("Get 5 Credits")')

      // Should get an error or redirect to login
      // The API returns 401 for unauthenticated users
      await expect(
        page.locator('text=/must be logged in|unauthorized|login/i')
      ).toBeVisible({ timeout: 10000 })
    })
  })

  test.describe('Purchase Flow - Authenticated', () => {
    test.beforeEach(async ({ page }) => {
      await authHelper.login(testUsers.default.email, testUsers.default.password)
    })

    test('should initiate Stripe checkout for Starter package', async ({ page }) => {
      await page.goto('/pricing')

      // Click Starter purchase button
      const starterButton = page.locator('button:has-text("Get 5 Credits")')
      await expect(starterButton).toBeVisible()

      // Start intercepting navigation to Stripe
      const [response] = await Promise.all([
        page.waitForResponse(resp => resp.url().includes('/api/credits/purchase')),
        starterButton.click()
      ])

      // API should return success with checkout URL
      expect(response.status()).toBe(200)
      const data = await response.json()
      expect(data.checkoutUrl).toContain('checkout.stripe.com')
    })

    test('should initiate Stripe checkout for Professional package', async ({ page }) => {
      await page.goto('/pricing')

      // Click Professional purchase button
      const proButton = page.locator('button:has-text("Get 10 Credits")')
      await expect(proButton).toBeVisible()

      const [response] = await Promise.all([
        page.waitForResponse(resp => resp.url().includes('/api/credits/purchase')),
        proButton.click()
      ])

      expect(response.status()).toBe(200)
      const data = await response.json()
      expect(data.checkoutUrl).toContain('checkout.stripe.com')
      expect(data.package.credits).toBe(10)
    })

    test('should initiate Stripe checkout for Business package', async ({ page }) => {
      await page.goto('/pricing')

      // Click Business purchase button
      const bizButton = page.locator('button:has-text("Get 20 Credits")')
      await expect(bizButton).toBeVisible()

      const [response] = await Promise.all([
        page.waitForResponse(resp => resp.url().includes('/api/credits/purchase')),
        bizButton.click()
      ])

      expect(response.status()).toBe(200)
      const data = await response.json()
      expect(data.checkoutUrl).toContain('checkout.stripe.com')
      expect(data.package.credits).toBe(20)
    })

    test('should show loading state while creating checkout session', async ({ page }) => {
      await page.goto('/pricing')

      // Click purchase and check for loading state
      const starterButton = page.locator('button:has-text("Get 5 Credits")')
      await starterButton.click()

      // Should show "Processing..." text
      await expect(page.locator('text=Processing...')).toBeVisible({ timeout: 2000 })
    })
  })

  test.describe('Cancelled Checkout', () => {
    test('should display cancelled message when returning from Stripe', async ({ page }) => {
      await page.goto('/pricing?cancelled=true')

      // Should show cancellation message
      await expect(
        page.locator('text=Checkout was cancelled')
      ).toBeVisible()
    })
  })

  test.describe('Navigation', () => {
    test('should have back to dashboard button', async ({ page }) => {
      await authHelper.login(testUsers.default.email, testUsers.default.password)
      await page.goto('/pricing')

      // Check for back button
      const backButton = page.locator('button:has-text("Back to Dashboard")')
      await expect(backButton).toBeVisible()

      // Click and verify navigation
      await backButton.click()
      await expect(page).toHaveURL('/dashboard')
    })
  })
})

test.describe('Purchase Success Page', () => {
  let authHelper: AuthHelper

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page)
    await authHelper.login(testUsers.default.email, testUsers.default.password)
  })

  test('should display success page elements', async ({ page }) => {
    await page.goto('/pricing/success?session_id=cs_test_123')

    // Check success message
    await expect(page.locator('text=Purchase Successful')).toBeVisible()
    await expect(page.locator('text=credits have been added')).toBeVisible()

    // Check for action buttons
    await expect(page.locator('button:has-text("Go to Dashboard")')).toBeVisible()
    await expect(page.locator('button:has-text("Start New Session")')).toBeVisible()

    // Check for "What's Next" section
    await expect(page.locator("text=What's Next")).toBeVisible()
  })

  test('should display credit balance on success page', async ({ page }) => {
    await page.goto('/pricing/success?session_id=cs_test_123')

    // Should show credits available (from API fetch)
    await expect(page.locator('text=credits available')).toBeVisible({ timeout: 10000 })
  })

  test('should navigate to dashboard from success page', async ({ page }) => {
    await page.goto('/pricing/success')

    await page.click('text=Go to Dashboard')
    await expect(page).toHaveURL('/dashboard')
  })

  test('should navigate to workspace from success page', async ({ page }) => {
    await page.goto('/pricing/success')

    await page.click('text=Start New Session')
    await expect(page).toHaveURL('/workspace')
  })
})
