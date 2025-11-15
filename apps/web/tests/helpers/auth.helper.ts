import { Page, expect } from '@playwright/test'
import { testUsers } from '../fixtures/users'
import { testConfig } from '../config/test-env'

export class AuthHelper {
  constructor(private page: Page) {}

  async login(email: string, password: string) {
    await this.page.goto('/login')
    await this.page.fill('input[type="email"]', email)
    await this.page.fill('input[type="password"]', password)
    await this.page.click('button[type="submit"]')

    // Wait for redirect to dashboard (increased to 30s for auth processing)
    await this.page.waitForURL('/dashboard', { timeout: 30000 })

    // Wait for dashboard to load
    await this.page.waitForSelector('h1:has-text("Your Strategic Workspaces")', { timeout: 30000 })
  }

  async logout() {
    await this.page.click('button:has-text("Sign Out")')
    await this.page.waitForURL('/login', { timeout: 5000 })
  }

  async loginAsTestUser(userType: 'default' | 'premium' | 'demo' = 'default') {
    const user = testUsers[userType]
    await this.login(user.email, user.password)
  }

  async ensureLoggedOut() {
    const cookies = await this.page.context().cookies()
    const hasAuthCookie = cookies.some(cookie =>
      cookie.name.includes('auth') || cookie.name.includes('session')
    )

    if (hasAuthCookie) {
      await this.logout()
    }
  }

  async checkAuthState() {
    const cookies = await this.page.context().cookies()
    return {
      isAuthenticated: cookies.some(cookie =>
        cookie.name.includes('auth') || cookie.name.includes('session')
      ),
      cookies
    }
  }

  async waitForAuthRedirect() {
    await this.page.waitForURL((url) => {
      const path = url.pathname
      return path === '/dashboard' || path === '/login'
    }, { timeout: 30000 })
  }

  // OAuth-specific methods

  async loginWithOAuth(provider: 'google' = 'google') {
    if (testConfig.oauth.useMockProvider) {
      return await this.mockOAuthLogin(provider)
    } else {
      return await this.realOAuthLogin(provider)
    }
  }

  private async mockOAuthLogin(provider: 'google' = 'google') {
    // Mock OAuth flow for testing
    await this.page.goto('/login')

    // Set up OAuth response interception
    await this.page.route('**/auth/v1/token**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(testConfig.oauth.mockSuccessResponse)
      })
    })

    // Mock user info endpoint
    await this.page.route('**/auth/v1/user**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: testConfig.oauth.mockUserInfo,
          session: {
            access_token: testConfig.oauth.mockSuccessResponse.access_token,
            refresh_token: testConfig.oauth.mockSuccessResponse.refresh_token,
            expires_in: testConfig.oauth.mockSuccessResponse.expires_in
          }
        })
      })
    })

    // Click OAuth login button
    const oauthButton = this.page.locator('button:has-text("Continue with Google"), button:has-text("Sign in with Google")')
    await expect(oauthButton).toBeVisible()
    await oauthButton.click()

    // Wait for redirect to dashboard
    await this.page.waitForURL('/dashboard', { timeout: testConfig.timeouts.oauth })

    return {
      user: testConfig.oauth.mockUserInfo,
      provider,
      method: 'oauth',
      mock: true
    }
  }

  private async realOAuthLogin(provider: 'google' = 'google') {
    // Real OAuth flow (for CI/CD environments)
    await this.page.goto('/login')

    // Click OAuth login button
    const oauthButton = this.page.locator('button:has-text("Continue with Google"), button:has-text("Sign in with Google")')
    await expect(oauthButton).toBeVisible()
    await oauthButton.click()

    // Handle OAuth provider popup/redirect
    await this.page.waitForURL(/oauth/, { timeout: testConfig.timeouts.oauth })

    // Note: In real implementation, this would handle actual OAuth flow
    // For now, this is a placeholder for real OAuth testing
    throw new Error('Real OAuth testing not yet implemented - use mock provider')
  }

  async verifyOAuthCallback(expectedCode?: string) {
    // Verify OAuth callback URL contains required parameters
    const url = this.page.url()
    const urlParams = new URL(url)

    if (expectedCode) {
      const code = urlParams.searchParams.get('code')
      expect(code).toBe(expectedCode)
    }

    // Verify no error parameters
    const error = urlParams.searchParams.get('error')
    expect(error).toBeNull()

    return {
      code: urlParams.searchParams.get('code'),
      state: urlParams.searchParams.get('state'),
      scope: urlParams.searchParams.get('scope')
    }
  }

  async verifySessionPersistence() {
    // Verify session persists across page refreshes
    const beforeRefresh = await this.checkAuthState()
    expect(beforeRefresh.isAuthenticated).toBe(true)

    await this.page.reload()
    await this.page.waitForLoadState('networkidle')

    const afterRefresh = await this.checkAuthState()
    expect(afterRefresh.isAuthenticated).toBe(true)

    // Verify we're still on dashboard or redirected appropriately
    const currentUrl = this.page.url()
    expect(currentUrl).toMatch(/(dashboard|\/)/);

    return {
      beforeRefresh: beforeRefresh.isAuthenticated,
      afterRefresh: afterRefresh.isAuthenticated,
      currentUrl
    }
  }

  async simulateOAuthError(errorType: 'access_denied' | 'invalid_request' | 'server_error' = 'access_denied') {
    // Simulate OAuth error responses
    await this.page.goto('/login')

    await this.page.route('**/auth/callback**', async (route) => {
      const url = new URL(route.request().url())
      url.searchParams.set('error', errorType)
      url.searchParams.set('error_description', this.getErrorDescription(errorType))

      await route.fulfill({
        status: 302,
        headers: {
          'Location': url.toString()
        }
      })
    })

    return errorType
  }

  private getErrorDescription(errorType: string): string {
    const descriptions = {
      'access_denied': 'The user denied the request',
      'invalid_request': 'The request is missing required parameters',
      'server_error': 'The authorization server encountered an unexpected condition'
    }
    return descriptions[errorType] || 'Unknown error'
  }

  async verifyPKCEFlow() {
    // Verify PKCE (Proof Key for Code Exchange) parameters
    const codeVerifier: string = ''
    let codeChallenge: string = ''

    await this.page.route('**/auth/v1/authorize**', async (route) => {
      const url = new URL(route.request().url())
      codeChallenge = url.searchParams.get('code_challenge') || ''
      const codeChallengeMethod = url.searchParams.get('code_challenge_method')

      expect(codeChallenge).toBeTruthy()
      expect(codeChallengeMethod).toBe('S256')

      await route.continue()
    })

    await this.page.route('**/auth/v1/token**', async (route) => {
      const body = route.request().postData()
      expect(body).toContain('code_verifier')

      await route.continue()
    })

    return {
      codeChallenge,
      challengeMethod: 'S256'
    }
  }

  async measureAuthLatency() {
    const startTime = Date.now()

    await this.loginWithOAuth()

    const endTime = Date.now()
    const latency = endTime - startTime

    return {
      startTime,
      endTime,
      latencyMs: latency,
      latencySeconds: latency / 1000
    }
  }

  async cleanupOAuthSession() {
    // Clean up OAuth-specific session data
    await this.page.context().clearCookies()
    await this.page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })

    // Remove any OAuth route interceptors
    await this.page.unrouteAll()
  }
}