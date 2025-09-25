import { test, expect } from '@playwright/test'
import { AuthHelper } from '../helpers/auth.helper'
import { OAuthMockProvider } from '../helpers/oauth-mock'
import { SessionVerifier } from '../helpers/session-verifier'
import { testConfig } from '../config/test-env'
import { testUsers } from '../fixtures/users'

test.describe('OAuth Error Scenarios', () => {
  let authHelper: AuthHelper
  let oauthMock: OAuthMockProvider
  let sessionVerifier: SessionVerifier

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page)
    oauthMock = new OAuthMockProvider(page)
    sessionVerifier = new SessionVerifier(page)

    // Ensure clean state
    await authHelper.ensureLoggedOut()
  })

  test.afterEach(async () => {
    await oauthMock.clearMocks()
  })

  test.describe('Invalid OAuth Code Handling', () => {
    test('should handle invalid OAuth authorization code', async ({ page }) => {
      // Set up to return invalid grant error during token exchange
      await oauthMock.setupMockOAuth({
        provider: 'google',
        success: false,
        error: 'invalid_grant'
      })

      await page.goto('/login')

      const googleButton = page.locator('button:has-text("Continue with Google"), button:has-text("Sign in with Google")')
      await googleButton.click()

      // Should handle invalid grant error
      await expect(page.locator('text=/invalid.*grant|authorization.*invalid/i')).toBeVisible({ timeout: 10000 })
      await sessionVerifier.verifyUnauthenticatedState()
    })

    test('should handle expired OAuth authorization code', async ({ page }) => {
      // Simulate callback with expired code by going directly to callback with error
      await page.goto('/auth/callback?error=invalid_grant&error_description=Authorization%20code%20expired')

      // Should redirect to login with error message
      await expect(page).toHaveURL(/\/login/)
      await expect(page.locator('text=/expired|invalid/i')).toBeVisible()
      await sessionVerifier.verifyUnauthenticatedState()
    })

    test('should handle malformed callback URL', async ({ page }) => {
      // Test callback with missing required parameters
      await page.goto('/auth/callback?code=&state=')

      // Should handle gracefully and redirect to login
      await expect(page).toHaveURL(/\/login/)
      await expect(page.locator('text=/error|invalid/i')).toBeVisible()
    })
  })

  test.describe('Network Failure Recovery', () => {
    test('should handle authorization endpoint network failure', async ({ page }) => {
      await oauthMock.simulateNetworkFailure('authorize')

      await page.goto('/login')

      const googleButton = page.locator('button:has-text("Continue with Google"), button:has-text("Sign in with Google")')
      await googleButton.click()

      // Should show network error
      await expect(page.locator('text=/network.*error|connection.*failed|timeout/i')).toBeVisible({ timeout: 15000 })
      await sessionVerifier.verifyUnauthenticatedState()
    })

    test('should handle token endpoint network failure', async ({ page }) => {
      await oauthMock.simulateNetworkFailure('token')

      await page.goto('/login')

      const googleButton = page.locator('button:has-text("Continue with Google"), button:has-text("Sign in with Google")')
      await googleButton.click()

      // Should show token exchange error
      await expect(page.locator('text=/token.*error|authentication.*failed/i')).toBeVisible({ timeout: 15000 })
      await sessionVerifier.verifyUnauthenticatedState()
    })

    test('should handle user info endpoint network failure', async ({ page }) => {
      await oauthMock.simulateNetworkFailure('user')

      await page.goto('/login')

      const googleButton = page.locator('button:has-text("Continue with Google"), button:has-text("Sign in with Google")')
      await googleButton.click()

      // Should handle user info failure gracefully
      await expect(page.locator('text=/user.*info.*error|profile.*unavailable/i')).toBeVisible({ timeout: 15000 })
    })

    test('should retry on temporary network failures', async ({ page }) => {
      let attemptCount = 0

      // Set up mock that fails first attempt, succeeds on retry
      await page.route('**/auth/v1/token**', async (route) => {
        attemptCount++

        if (attemptCount === 1) {
          // First attempt fails
          await route.abort('failed')
        } else {
          // Second attempt succeeds
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(testConfig.oauth.mockSuccessResponse)
          })
        }
      })

      await page.goto('/login')

      const googleButton = page.locator('button:has-text("Continue with Google"), button:has-text("Sign in with Google")')
      await googleButton.click()

      // Should eventually succeed after retry
      await expect(page).toHaveURL('/dashboard', { timeout: 20000 })
      expect(attemptCount).toBeGreaterThan(1)
    })
  })

  test.describe('Cookie/Session Mismatch Scenarios', () => {
    test('should handle OAuth state mismatch', async ({ page }) => {
      // Set up OAuth flow with mismatched state parameter
      await page.route('**/auth/v1/authorize**', async (route) => {
        const url = new URL(route.request().url())
        const redirectUri = url.searchParams.get('redirect_uri')

        // Return with different state than sent
        const callbackUrl = new URL(redirectUri!)
        callbackUrl.searchParams.set('code', 'valid_code_123')
        callbackUrl.searchParams.set('state', 'mismatched_state')

        await route.fulfill({
          status: 302,
          headers: {
            'Location': callbackUrl.toString()
          }
        })
      })

      await page.goto('/login')

      const googleButton = page.locator('button:has-text("Continue with Google"), button:has-text("Sign in with Google")')
      await googleButton.click()

      // Should reject due to state mismatch
      await expect(page.locator('text=/state.*mismatch|security.*error|invalid.*request/i')).toBeVisible()
      await sessionVerifier.verifyUnauthenticatedState()
    })

    test('should handle corrupted session cookies', async ({ page, context }) => {
      // First login successfully
      await oauthMock.setupMockOAuth({
        provider: 'google',
        success: true
      })

      await authHelper.loginWithOAuth('google')
      await sessionVerifier.verifyAuthenticatedState()

      // Corrupt the session cookies
      const cookies = await context.cookies()
      for (const cookie of cookies) {
        if (cookie.name.includes('auth') || cookie.name.includes('session')) {
          await context.addCookies([{
            ...cookie,
            value: 'corrupted_' + cookie.value
          }])
        }
      }

      // Try to access protected route
      await page.goto('/dashboard')

      // Should redirect to login due to invalid session
      await expect(page).toHaveURL('/login')
      await sessionVerifier.verifyUnauthenticatedState()
    })

    test('should handle session expiry during OAuth flow', async ({ page, context }) => {
      // Start OAuth flow
      await page.goto('/login')

      const googleButton = page.locator('button:has-text("Continue with Google"), button:has-text("Sign in with Google")')
      await googleButton.click()

      // Clear cookies to simulate session expiry during flow
      await context.clearCookies()

      // Complete OAuth callback
      await page.goto('/auth/callback?code=test_code&state=test_state')

      // Should handle gracefully - either re-authenticate or show error
      await expect(page).toHaveURL(/\/(login|auth)/)
    })
  })

  test.describe('PKCE Error Scenarios', () => {
    test('should handle missing PKCE code verifier', async ({ page }) => {
      // Set up OAuth flow that doesn't include code_verifier in token request
      await page.route('**/auth/v1/token**', async (route) => {
        const body = route.request().postData()

        // Remove code_verifier from request
        const params = new URLSearchParams(body)
        params.delete('code_verifier')

        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'invalid_request',
            error_description: 'PKCE code verifier is required'
          })
        })
      })

      await page.goto('/login')

      const googleButton = page.locator('button:has-text("Continue with Google"), button:has-text("Sign in with Google")')
      await googleButton.click()

      // Should show PKCE error
      await expect(page.locator('text=/pkce.*required|code.*verifier.*required/i')).toBeVisible()
      await sessionVerifier.verifyUnauthenticatedState()
    })

    test('should handle invalid PKCE code challenge method', async ({ page }) => {
      // Set up OAuth that rejects non-S256 challenge method
      await page.route('**/auth/v1/authorize**', async (route) => {
        const url = new URL(route.request().url())
        const challengeMethod = url.searchParams.get('code_challenge_method')

        if (challengeMethod !== 'S256') {
          await route.fulfill({
            status: 400,
            contentType: 'application/json',
            body: JSON.stringify({
              error: 'invalid_request',
              error_description: 'Unsupported code challenge method'
            })
          })
          return
        }

        await route.continue()
      })

      await page.goto('/login')

      const googleButton = page.locator('button:has-text("Continue with Google"), button:has-text("Sign in with Google")')
      await googleButton.click()

      // Should handle PKCE method error
      await expect(page.locator('text=/unsupported.*method|challenge.*method/i')).toBeVisible()
    })
  })

  test.describe('Rate Limiting and Throttling', () => {
    test('should handle OAuth rate limiting', async ({ page }) => {
      // Simulate rate limiting response
      await page.route('**/auth/v1/**', async (route) => {
        await route.fulfill({
          status: 429,
          contentType: 'application/json',
          headers: {
            'Retry-After': '60'
          },
          body: JSON.stringify({
            error: 'rate_limit_exceeded',
            error_description: 'Too many requests. Please try again later.'
          })
        })
      })

      await page.goto('/login')

      const googleButton = page.locator('button:has-text("Continue with Google"), button:has-text("Sign in with Google")')
      await googleButton.click()

      // Should show rate limiting message
      await expect(page.locator('text=/rate.*limit|too.*many.*requests|try.*again.*later/i')).toBeVisible()
      await sessionVerifier.verifyUnauthenticatedState()
    })

    test('should handle gradual slowdown before rate limit', async ({ page }) => {
      let requestCount = 0

      // Simulate increasing delays to test throttling behavior
      await page.route('**/auth/v1/**', async (route) => {
        requestCount++
        const delay = Math.min(requestCount * 1000, 5000) // Increase delay up to 5s

        await new Promise(resolve => setTimeout(resolve, delay))
        await route.continue()
      })

      const startTime = Date.now()

      await page.goto('/login')

      const googleButton = page.locator('button:has-text("Continue with Google"), button:has-text("Sign in with Google")')
      await googleButton.click()

      const endTime = Date.now()

      // Should show some delay due to throttling simulation
      expect(endTime - startTime).toBeGreaterThan(1000)
    })
  })

  test.describe('Browser Compatibility and Edge Cases', () => {
    test('should handle popup blocked scenarios', async ({ page }) => {
      // Block popup windows
      await page.evaluate(() => {
        // Override window.open to simulate popup blocking
        window.open = () => null
      })

      await page.goto('/login')

      const googleButton = page.locator('button:has-text("Continue with Google"), button:has-text("Sign in with Google")')
      await googleButton.click()

      // Should show popup blocked message or use redirect fallback
      const popupMessage = page.locator('text=/popup.*blocked|allow.*popups|enable.*popups/i')
      const redirectFlow = page.locator('text=/redirect|continue/i')

      await expect(popupMessage.or(redirectFlow)).toBeVisible({ timeout: 10000 })
    })

    test('should handle third-party cookies disabled', async ({ page, context }) => {
      // Simulate third-party cookies being blocked
      await context.route('**/*.googleapis.com/**', async (route) => {
        const response = await route.fetch()
        const headers = Object.fromEntries(Object.entries(response.headers()))

        // Remove Set-Cookie headers to simulate cookie blocking
        delete headers['set-cookie']

        await route.fulfill({
          response,
          headers
        })
      })

      await page.goto('/login')

      const googleButton = page.locator('button:has-text("Continue with Google"), button:has-text("Sign in with Google")')
      await googleButton.click()

      // Should handle gracefully or show cookie requirement message
      await expect(page.locator('text=/cookies.*required|enable.*cookies|third.*party.*cookies/i')).toBeVisible({ timeout: 15000 })
    })

    test('should handle JavaScript disabled scenarios', async ({ page }) => {
      // Disable JavaScript
      await page.context().addInitScript(() => {
        Object.defineProperty(window, 'crypto', {
          value: undefined
        })
      })

      await page.goto('/login')

      // Should show fallback or graceful degradation
      const googleButton = page.locator('button:has-text("Continue with Google"), button:has-text("Sign in with Google")')
      await expect(googleButton).toBeVisible()

      // If PKCE requires JavaScript, should show appropriate message
      await googleButton.click()

      const errorMessage = page.locator('text=/javascript.*required|enable.*javascript|crypto.*unavailable/i')
      const fallbackForm = page.locator('form[action*="oauth"], form[action*="auth"]')

      await expect(errorMessage.or(fallbackForm)).toBeVisible({ timeout: 10000 })
    })
  })

  test.describe('Concurrent Session Handling', () => {
    test('should handle multiple OAuth attempts in different tabs', async ({ page, context }) => {
      // Start OAuth in first tab
      await page.goto('/login')

      const googleButton1 = page.locator('button:has-text("Continue with Google"), button:has-text("Sign in with Google")')
      await googleButton1.click()

      // Open second tab and start OAuth
      const page2 = await context.newPage()
      await page2.goto('/login')

      const googleButton2 = page2.locator('button:has-text("Continue with Google"), button:has-text("Sign in with Google")')
      await googleButton2.click()

      // Both should handle gracefully without conflict
      await Promise.all([
        expect(page).toHaveURL(/\/(dashboard|login|auth)/, { timeout: 15000 }),
        expect(page2).toHaveURL(/\/(dashboard|login|auth)/, { timeout: 15000 })
      ])

      await page2.close()
    })

    test('should handle OAuth with existing session', async ({ page }) => {
      // First, login with regular auth
      await authHelper.login(testUsers.default.email, testUsers.default.password)
      await sessionVerifier.verifyAuthenticatedState()

      // Then try OAuth login
      await page.goto('/login')

      const googleButton = page.locator('button:has-text("Continue with Google"), button:has-text("Sign in with Google")')

      if (await googleButton.isVisible()) {
        await googleButton.click()

        // Should either link accounts or handle existing session gracefully
        await expect(page).toHaveURL(/\/(dashboard|login|account|profile)/, { timeout: 15000 })
      }
    })
  })
})