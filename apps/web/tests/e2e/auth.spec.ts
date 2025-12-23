import { test, expect } from '@playwright/test'
import { AuthHelper } from '../helpers/auth.helper'
import { OAuthMockProvider, OAuthMockConfig } from '../helpers/oauth-mock'
import { SessionVerifier } from '../helpers/session-verifier'
import { testUsers, generateRandomUser } from '../fixtures/users'
import { testConfig } from '../config/test-env'

test.describe('Authentication Flow', () => {
  let authHelper: AuthHelper

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page)
    await authHelper.ensureLoggedOut()
  })

  test.describe('User Login', () => {
    test('should successfully login with valid credentials', async ({ page }) => {
      await authHelper.login(testUsers.default.email, testUsers.default.password)

      // Verify redirect to dashboard (using default 30s timeout from authHelper)
      await expect(page).toHaveURL('/dashboard')
      await expect(page.locator('h1:has-text("Welcome back")')).toBeVisible({ timeout: 30000 })

      // Verify user email is displayed
      await expect(page.locator(`text=${testUsers.default.email}`)).toBeVisible({ timeout: 10000 })
    })

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto('/login')

      await page.fill('input[type="email"]', 'invalid@email.com')
      await page.fill('input[type="password"]', 'wrongpassword')
      await page.click('button[type="submit"]')

      // Check for error message
      await expect(page.locator('text=/invalid.*credentials|incorrect.*password/i')).toBeVisible({ timeout: 5000 })
    })

    test('should redirect to login when accessing protected route', async ({ page }) => {
      // Try to access dashboard without login
      await page.goto('/dashboard')

      // Should redirect to login
      await expect(page).toHaveURL('/login')
    })
  })

  test.describe('OAuth Authentication Flow', () => {
    let oauthMock: OAuthMockProvider
    let sessionVerifier: SessionVerifier
    let authHelper: AuthHelper

    test.beforeEach(async ({ page }) => {
      // Initialize helpers
      oauthMock = new OAuthMockProvider(page)
      sessionVerifier = new SessionVerifier(page)
      authHelper = new AuthHelper(page)

      // Navigate to a page first (required for localStorage access)
      await page.goto('/')

      // Clear state BEFORE each test
      await page.context().clearCookies()
      await page.evaluate(() => {
        localStorage.clear()
        sessionStorage.clear()
      })
      await authHelper.ensureLoggedOut()
    })

    test.afterEach(async ({ page }) => {
      // Clear mocks to prevent leakage
      await oauthMock.clearMocks()
      await page.unrouteAll()
      await page.context().clearCookies()
    })

    test('should display Google OAuth option', async ({ page }) => {
      await page.goto('/login')

      // Check for Google sign-in button
      const googleButton = page.locator('button:has-text("Continue with Google"), button:has-text("Sign in with Google")')
      await expect(googleButton).toBeVisible()
    })

    test('should successfully complete OAuth login flow', async ({ page }) => {
      // Set up successful OAuth mock
      await oauthMock.setupMockOAuth({
        provider: 'google',
        success: true
      })

      // Start OAuth login
      const result = await authHelper.loginWithOAuth('google')

      // Verify successful login
      expect(result.mock).toBe(true)
      expect(result.provider).toBe('google')
      expect(result.method).toBe('oauth')

      // Verify redirect to dashboard
      await expect(page).toHaveURL('/dashboard')

      // Verify session is established
      const sessionInfo = await sessionVerifier.verifyAuthenticatedState()
      expect(sessionInfo.isAuthenticated).toBe(true)
    })

    test('should handle OAuth callback with authorization code', async ({ page }) => {
      // Set up OAuth mock
      await oauthMock.setupMockOAuth({
        provider: 'google',
        success: true
      })

      await page.goto('/login')

      // Click OAuth button
      const googleButton = page.locator('button:has-text("Continue with Google"), button:has-text("Sign in with Google")')
      await googleButton.click()

      // Verify callback parameters
      const callbackData = await authHelper.verifyOAuthCallback()
      expect(callbackData.code).toBeTruthy()
      expect(callbackData.state).toBeTruthy()
    })

    test('should verify PKCE flow implementation', async ({ page }) => {
      // Set up PKCE validation
      const pkceData = await oauthMock.setupPKCEValidation()

      await page.goto('/login')

      // Initiate OAuth flow
      const googleButton = page.locator('button:has-text("Continue with Google"), button:has-text("Sign in with Google")')
      await googleButton.click()

      // Verify PKCE parameters were captured
      expect(pkceData.getCodeChallenge()).toBeTruthy()
      expect(pkceData.getCodeVerifier()).toBeTruthy()
    })

    test('should persist session across page refreshes', async ({ page }) => {
      // Login with OAuth
      await oauthMock.setupMockOAuth({
        provider: 'google',
        success: true
      })

      await authHelper.loginWithOAuth('google')

      // Verify session persistence
      const persistenceResult = await sessionVerifier.verifySessionPersistence()
      expect(persistenceResult.sessionPersisted).toBe(true)
      expect(persistenceResult.beforeRefresh.isAuthenticated).toBe(true)
      expect(persistenceResult.afterRefresh.isAuthenticated).toBe(true)
    })

    test('should handle user denied access error', async ({ page }) => {
      // Set up OAuth error
      await oauthMock.setupMockOAuth({
        provider: 'google',
        success: false,
        error: 'access_denied'
      })

      await page.goto('/login')

      // Click OAuth button
      const googleButton = page.locator('button:has-text("Continue with Google"), button:has-text("Sign in with Google")')
      await googleButton.click()

      // Should redirect to login with error
      await expect(page).toHaveURL(/\/login/)
      await expect(page.locator('text=/denied|error/i')).toBeVisible()

      // Verify user is not authenticated
      await sessionVerifier.verifyUnauthenticatedState()
    })

    test('should handle invalid OAuth request error', async ({ page }) => {
      await oauthMock.setupMockOAuth({
        provider: 'google',
        success: false,
        error: 'invalid_request'
      })

      await page.goto('/login')

      const googleButton = page.locator('button:has-text("Continue with Google"), button:has-text("Sign in with Google")')
      await googleButton.click()

      // Should show error message
      await expect(page.locator('text=/invalid.*request|error/i')).toBeVisible()
      await sessionVerifier.verifyUnauthenticatedState()
    })

    test('should handle OAuth server error', async ({ page }) => {
      await oauthMock.setupMockOAuth({
        provider: 'google',
        success: false,
        error: 'server_error'
      })

      await page.goto('/login')

      const googleButton = page.locator('button:has-text("Continue with Google"), button:has-text("Sign in with Google")')
      await googleButton.click()

      // Should show server error message
      await expect(page.locator('text=/server.*error|unexpected/i')).toBeVisible()
      await sessionVerifier.verifyUnauthenticatedState()
    })

    test('should measure OAuth authentication latency', async ({ page }) => {
      await oauthMock.setupMockOAuth({
        provider: 'google',
        success: true,
        latency: 100 // 100ms simulated latency
      })

      const latencyResult = await authHelper.measureAuthLatency()

      // Verify reasonable latency (should include our 100ms delay)
      expect(latencyResult.latencyMs).toBeGreaterThan(50)
      expect(latencyResult.latencyMs).toBeLessThan(testConfig.timeouts.oauth)
      expect(latencyResult.latencySeconds).toBeGreaterThan(0)
    })

    test('should handle network failures gracefully', async ({ page }) => {
      // Simulate network failure on token endpoint
      await oauthMock.simulateNetworkFailure('token')

      await page.goto('/login')

      const googleButton = page.locator('button:has-text("Continue with Google"), button:has-text("Sign in with Google")')
      await googleButton.click()

      // Should show network error or timeout
      await expect(page.locator('text=/network.*error|timeout|failed/i')).toBeVisible({ timeout: 10000 })
      await sessionVerifier.verifyUnauthenticatedState()
    })

    test('should handle slow network conditions', async ({ page }) => {
      // Set up slow network (3 second delay)
      await oauthMock.simulateSlowNetwork(3000)

      await oauthMock.setupMockOAuth({
        provider: 'google',
        success: true
      })

      const startTime = Date.now()
      await authHelper.loginWithOAuth('google')
      const endTime = Date.now()

      // Should complete but take longer than 3 seconds
      expect(endTime - startTime).toBeGreaterThan(2500)
      await sessionVerifier.verifyAuthenticatedState()
    })

    test('should properly logout after OAuth login', async ({ page }) => {
      // Login with OAuth
      await oauthMock.setupMockOAuth({
        provider: 'google',
        success: true
      })

      await authHelper.loginWithOAuth('google')
      await sessionVerifier.verifyAuthenticatedState()

      // Logout
      await authHelper.logout()

      // Verify logout
      await expect(page).toHaveURL('/login')
      await sessionVerifier.verifyUnauthenticatedState()
    })

    test('should handle session cleanup properly', async ({ page }) => {
      // Login with OAuth
      await oauthMock.setupMockOAuth({
        provider: 'google',
        success: true
      })

      await authHelper.loginWithOAuth('google')

      // Clean up session
      await authHelper.cleanupOAuthSession()

      // Verify session is cleared
      const sessionInfo = await sessionVerifier.getSessionInfo()
      expect(sessionInfo.isAuthenticated).toBe(false)
      expect(sessionInfo.cookieData.authCookie).toBeFalsy()
    })

    test('should verify OAuth provider data in session', async ({ page }) => {
      // Login with OAuth using custom user data
      await oauthMock.setupMockOAuth({
        provider: 'google',
        success: true,
        userData: {
          id: 'oauth_test_123',
          email: 'oauth.test@example.com',
          name: 'OAuth Test User',
          picture: 'https://example.com/avatar.jpg'
        }
      })

      await authHelper.loginWithOAuth('google')

      // Verify OAuth provider data
      const providerData = await sessionVerifier.verifyOAuthProviderData('google')
      expect(providerData.provider).toBe('google')
      expect(providerData.email).toBe('oauth.test@example.com')
      expect(providerData.userId).toBe('oauth_test_123')
    })
  })

  test.describe('Session Management', () => {
    test('should persist session across page refreshes', async ({ page }) => {
      // Login
      await authHelper.login(testUsers.default.email, testUsers.default.password)

      // Refresh page
      await page.reload()

      // Should still be on dashboard
      await expect(page).toHaveURL('/dashboard')
      await expect(page.locator('h1:has-text("Your Strategic Workspaces")')).toBeVisible()
    })

    test('should successfully logout', async ({ page }) => {
      // Login first
      await authHelper.login(testUsers.default.email, testUsers.default.password)

      // Logout
      await authHelper.logout()

      // Verify redirect to login
      await expect(page).toHaveURL('/login')

      // Try to access dashboard - should redirect to login
      await page.goto('/dashboard')
      await expect(page).toHaveURL('/login')
    })

    test('should handle session expiry gracefully', async ({ page, context }) => {
      // Login
      await authHelper.login(testUsers.default.email, testUsers.default.password)

      // Clear session cookies to simulate expiry
      await context.clearCookies()

      // Try to perform an action that requires auth
      await page.reload()

      // Should redirect to login
      await expect(page).toHaveURL('/login')
    })
  })

  test.describe('Password Reset', () => {
    test('should display password reset flow', async ({ page }) => {
      await page.goto('/login')

      // Click forgot password link
      const forgotLink = page.locator('a:has-text("Forgot password"), a:has-text("Reset password")')
      if (await forgotLink.isVisible()) {
        await forgotLink.click()

        // Should show reset form
        await expect(page.locator('input[type="email"]')).toBeVisible()
        await expect(page.locator('button:has-text("Send Reset"), button:has-text("Reset Password")')).toBeVisible()
      }
    })

    test('should handle password reset request', async ({ page }) => {
      await page.goto('/reset-password')

      // Fill email
      await page.fill('input[type="email"]', testUsers.default.email)
      await page.click('button[type="submit"]')

      // Should show confirmation message
      await expect(page.locator('text=/check.*email|sent.*reset/i')).toBeVisible({ timeout: 10000 })
    })
  })

  test.describe('Account Security', () => {
    test('should handle concurrent login attempts', async ({ page, context }) => {
      // Login in first tab
      await authHelper.login(testUsers.default.email, testUsers.default.password)

      // Open second tab and login
      const page2 = await context.newPage()
      const authHelper2 = new AuthHelper(page2)
      await authHelper2.login(testUsers.default.email, testUsers.default.password)

      // Both tabs should have valid sessions
      await page.reload()
      await expect(page).toHaveURL('/dashboard')

      await page2.reload()
      await expect(page2).toHaveURL('/dashboard')

      await page2.close()
    })
  })
})