import { Page, Route } from '@playwright/test'
import { testConfig } from '../config/test-env'

export interface OAuthMockConfig {
  provider: 'google'
  success: boolean
  error?: 'access_denied' | 'invalid_request' | 'server_error' | 'invalid_grant'
  latency?: number
  userData?: {
    id: string
    email: string
    name: string
    picture?: string
  }
}

export class OAuthMockProvider {
  constructor(private page: Page) {}

  async setupMockOAuth(config: OAuthMockConfig) {
    const { provider, success, error, latency = 0, userData } = config

    if (success) {
      await this.setupSuccessfulOAuth(provider, userData, latency)
    } else {
      await this.setupFailedOAuth(provider, error!, latency)
    }
  }

  private async setupSuccessfulOAuth(
    provider: 'google',
    userData?: OAuthMockConfig['userData'],
    latency: number = 0
  ) {
    const user = userData || testConfig.oauth.mockUserInfo

    // Mock the OAuth authorization endpoint
    await this.page.route('**/auth/v1/authorize**', async (route) => {
      if (latency > 0) {
        await new Promise(resolve => setTimeout(resolve, latency))
      }

      const url = new URL(route.request().url())
      const redirectUri = url.searchParams.get('redirect_uri')
      const state = url.searchParams.get('state')

      // Redirect to callback with authorization code
      const callbackUrl = new URL(redirectUri!)
      callbackUrl.searchParams.set('code', 'mock_auth_code_12345')
      callbackUrl.searchParams.set('state', state!)

      await route.fulfill({
        status: 302,
        headers: {
          'Location': callbackUrl.toString()
        }
      })
    })

    // Mock the token exchange endpoint
    await this.page.route('**/auth/v1/token**', async (route) => {
      if (latency > 0) {
        await new Promise(resolve => setTimeout(resolve, latency))
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: testConfig.oauth.mockSuccessResponse.access_token,
          refresh_token: testConfig.oauth.mockSuccessResponse.refresh_token,
          expires_in: testConfig.oauth.mockSuccessResponse.expires_in,
          token_type: testConfig.oauth.mockSuccessResponse.token_type,
          user: user
        })
      })
    })

    // Mock the user info endpoint
    await this.page.route('**/auth/v1/user**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: user.id,
          email: user.email,
          name: user.name,
          picture: user.picture,
          app_metadata: {
            provider: provider,
            providers: [provider]
          },
          user_metadata: {}
        })
      })
    })
  }

  private async setupFailedOAuth(
    provider: 'google',
    error: 'access_denied' | 'invalid_request' | 'server_error' | 'invalid_grant',
    latency: number = 0
  ) {
    // Mock OAuth authorization endpoint failure
    await this.page.route('**/auth/v1/authorize**', async (route) => {
      if (latency > 0) {
        await new Promise(resolve => setTimeout(resolve, latency))
      }

      const url = new URL(route.request().url())
      const redirectUri = url.searchParams.get('redirect_uri')
      const state = url.searchParams.get('state')

      // Redirect to callback with error
      const callbackUrl = new URL(redirectUri!)
      callbackUrl.searchParams.set('error', error)
      callbackUrl.searchParams.set('error_description', this.getErrorDescription(error))
      callbackUrl.searchParams.set('state', state!)

      await route.fulfill({
        status: 302,
        headers: {
          'Location': callbackUrl.toString()
        }
      })
    })

    // Mock token endpoint failure (for invalid_grant errors)
    if (error === 'invalid_grant') {
      await this.page.route('**/auth/v1/token**', async (route) => {
        if (latency > 0) {
          await new Promise(resolve => setTimeout(resolve, latency))
        }

        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'invalid_grant',
            error_description: 'The provided authorization grant is invalid, expired, revoked, or was issued to another client.'
          })
        })
      })
    }
  }

  private getErrorDescription(error: string): string {
    const descriptions = {
      'access_denied': 'The user denied the request',
      'invalid_request': 'The request is missing required parameters',
      'server_error': 'The authorization server encountered an unexpected condition',
      'invalid_grant': 'The provided authorization grant is invalid'
    }
    return descriptions[error] || 'Unknown error'
  }

  async setupPKCEValidation() {
    let capturedCodeChallenge = ''
    let capturedCodeVerifier = ''

    // Capture PKCE parameters during authorization
    await this.page.route('**/auth/v1/authorize**', async (route) => {
      const url = new URL(route.request().url())
      capturedCodeChallenge = url.searchParams.get('code_challenge') || ''
      const challengeMethod = url.searchParams.get('code_challenge_method')

      // Validate PKCE parameters
      if (!capturedCodeChallenge || challengeMethod !== 'S256') {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'invalid_request',
            error_description: 'PKCE parameters are required'
          })
        })
        return
      }

      await route.continue()
    })

    // Validate code verifier during token exchange
    await this.page.route('**/auth/v1/token**', async (route) => {
      const body = route.request().postData()
      const params = new URLSearchParams(body)
      capturedCodeVerifier = params.get('code_verifier') || ''

      // In a real implementation, we would validate the code verifier against the challenge
      // For mocking, we just ensure it's present
      if (!capturedCodeVerifier) {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'invalid_grant',
            error_description: 'PKCE code verifier is required'
          })
        })
        return
      }

      await route.continue()
    })

    return {
      getCodeChallenge: () => capturedCodeChallenge,
      getCodeVerifier: () => capturedCodeVerifier
    }
  }

  async simulateNetworkFailure(endpoint: 'authorize' | 'token' | 'user' = 'token') {
    const routePattern = {
      authorize: '**/auth/v1/authorize**',
      token: '**/auth/v1/token**',
      user: '**/auth/v1/user**'
    }[endpoint]

    await this.page.route(routePattern, async (route) => {
      await route.abort('failed')
    })
  }

  async simulateSlowNetwork(delayMs: number = 5000) {
    await this.page.route('**/auth/v1/**', async (route) => {
      await new Promise(resolve => setTimeout(resolve, delayMs))
      await route.continue()
    })
  }

  async clearMocks() {
    await this.page.unrouteAll()
  }

  // Utility method to create common OAuth test scenarios
  static createTestScenarios(): Record<string, OAuthMockConfig> {
    return {
      successfulLogin: {
        provider: 'google',
        success: true
      },
      userDeniedAccess: {
        provider: 'google',
        success: false,
        error: 'access_denied'
      },
      invalidRequest: {
        provider: 'google',
        success: false,
        error: 'invalid_request'
      },
      serverError: {
        provider: 'google',
        success: false,
        error: 'server_error'
      },
      invalidGrant: {
        provider: 'google',
        success: false,
        error: 'invalid_grant'
      },
      slowNetwork: {
        provider: 'google',
        success: true,
        latency: 5000
      },
      customUser: {
        provider: 'google',
        success: true,
        userData: {
          id: 'custom_user_123',
          email: 'custom.user@example.com',
          name: 'Custom Test User',
          picture: 'https://example.com/custom-avatar.jpg'
        }
      }
    }
  }
}

// Helper function to get OAuth test user
export function getOAuthTestUser(type: 'default' | 'custom' = 'default') {
  if (type === 'custom') {
    return OAuthMockProvider.createTestScenarios().customUser.userData!
  }
  return testConfig.oauth.mockUserInfo
}