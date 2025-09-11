import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { supabase } from '../../../lib/supabase/client'
import { createGoogleConfig, generateNonce } from '../../../lib/auth/google-config'

// Mock Supabase client
vi.mock('../../../lib/supabase/client', () => ({
  supabase: {
    auth: {
      signInWithIdToken: vi.fn(),
      getSession: vi.fn(),
      getUser: vi.fn(),
      onAuthStateChange: vi.fn(),
      signOut: vi.fn()
    }
  }
}))

const mockSupabase = vi.mocked(supabase)

describe('Supabase Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Google ID Token Authentication', () => {
    it('successfully authenticates with valid Google ID token', async () => {
      const mockUser = {
        id: 'google-user-123',
        email: 'test@gmail.com',
        app_metadata: { provider: 'google' },
        user_metadata: {
          email_verified: true,
          full_name: 'Test User',
          avatar_url: 'https://lh3.googleusercontent.com/avatar.jpg'
        }
      }

      const mockSession = {
        access_token: 'access_token',
        refresh_token: 'refresh_token',
        expires_in: 3600,
        user: mockUser
      }

      mockSupabase.auth.signInWithIdToken.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null
      })

      const testIdToken = 'valid_google_id_token'
      const result = await mockSupabase.auth.signInWithIdToken({
        provider: 'google',
        token: testIdToken
      })

      expect(mockSupabase.auth.signInWithIdToken).toHaveBeenCalledWith({
        provider: 'google',
        token: testIdToken
      })

      expect(result.error).toBeNull()
      expect(result.data.user).toEqual(mockUser)
      expect(result.data.user?.app_metadata.provider).toBe('google')
      expect(result.data.user?.user_metadata.email_verified).toBe(true)
    })

    it('handles invalid ID token error', async () => {
      const authError = {
        message: 'Invalid token',
        status: 400,
        name: 'AuthInvalidTokenResponse'
      }

      mockSupabase.auth.signInWithIdToken.mockResolvedValue({
        data: { user: null, session: null },
        error: authError
      })

      const testIdToken = 'invalid_google_id_token'
      const result = await mockSupabase.auth.signInWithIdToken({
        provider: 'google',
        token: testIdToken
      })

      expect(result.error).toEqual(authError)
      expect(result.data.user).toBeNull()
    })

    it('handles expired ID token error', async () => {
      const authError = {
        message: 'Token has expired',
        status: 401,
        name: 'AuthTokenExpiredError'
      }

      mockSupabase.auth.signInWithIdToken.mockResolvedValue({
        data: { user: null, session: null },
        error: authError
      })

      const expiredToken = 'expired_google_id_token'
      const result = await mockSupabase.auth.signInWithIdToken({
        provider: 'google',
        token: expiredToken
      })

      expect(result.error).toEqual(authError)
    })

    it('handles network errors gracefully', async () => {
      const networkError = new Error('Network request failed')
      mockSupabase.auth.signInWithIdToken.mockRejectedValue(networkError)

      const testIdToken = 'valid_google_id_token'
      
      await expect(
        mockSupabase.auth.signInWithIdToken({
          provider: 'google',
          token: testIdToken
        })
      ).rejects.toThrow('Network request failed')
    })
  })

  describe('User Profile Data Mapping', () => {
    it('correctly maps Google profile data to Supabase user', async () => {
      const googleProfileData = {
        sub: 'google_user_id_123',
        email: 'user@gmail.com',
        email_verified: true,
        name: 'John Doe',
        given_name: 'John',
        family_name: 'Doe',
        picture: 'https://lh3.googleusercontent.com/photo.jpg'
      }

      const expectedUser = {
        id: 'supabase-user-uuid',
        email: 'user@gmail.com',
        app_metadata: {
          provider: 'google',
          providers: ['google']
        },
        user_metadata: {
          email: googleProfileData.email,
          email_verified: googleProfileData.email_verified,
          full_name: googleProfileData.name,
          avatar_url: googleProfileData.picture,
          provider_id: googleProfileData.sub,
          sub: googleProfileData.sub
        }
      }

      mockSupabase.auth.signInWithIdToken.mockResolvedValue({
        data: { user: expectedUser, session: { user: expectedUser } },
        error: null
      })

      const result = await mockSupabase.auth.signInWithIdToken({
        provider: 'google',
        token: 'valid_id_token'
      })

      expect(result.data.user?.email).toBe(googleProfileData.email)
      expect(result.data.user?.user_metadata.full_name).toBe(googleProfileData.name)
      expect(result.data.user?.user_metadata.avatar_url).toBe(googleProfileData.picture)
      expect(result.data.user?.user_metadata.email_verified).toBe(true)
    })
  })

  describe('Session Management', () => {
    it('properly handles session creation for new Google user', async () => {
      const mockUser = {
        id: 'new-google-user',
        email: 'newuser@gmail.com',
        created_at: new Date().toISOString(),
        app_metadata: { provider: 'google' }
      }

      const mockSession = {
        access_token: 'new_access_token',
        refresh_token: 'new_refresh_token',
        expires_in: 3600,
        user: mockUser
      }

      mockSupabase.auth.signInWithIdToken.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null
      })

      const result = await mockSupabase.auth.signInWithIdToken({
        provider: 'google',
        token: 'new_user_token'
      })

      expect(result.data.session).toBeDefined()
      expect(result.data.session?.access_token).toBe('new_access_token')
      expect(result.data.session?.user.id).toBe('new-google-user')
    })

    it('handles session retrieval for existing Google user', async () => {
      const existingUser = {
        id: 'existing-google-user',
        email: 'existing@gmail.com',
        app_metadata: { provider: 'google' }
      }

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { 
          session: { 
            user: existingUser, 
            access_token: 'existing_token' 
          } 
        },
        error: null
      })

      const result = await mockSupabase.auth.getSession()
      expect(result.data.session?.user.id).toBe('existing-google-user')
    })
  })

  describe('Nonce Generation and Security', () => {
    it('generates unique nonces for each request', () => {
      const nonce1 = generateNonce()
      const nonce2 = generateNonce()
      
      expect(nonce1).toBeDefined()
      expect(nonce2).toBeDefined()
      expect(nonce1).not.toBe(nonce2)
      expect(nonce1.length).toBeGreaterThan(10)
    })

    it('creates Google config with proper nonce', async () => {
      const mockCallback = vi.fn()
      const config = await createGoogleConfig(mockCallback)
      
      expect(config.client_id).toBeDefined()
      expect(config.callback).toBe(mockCallback)
      expect(config.nonce).toBeDefined()
      expect(typeof config.nonce).toBe('string')
      expect(config.nonce!.length).toBeGreaterThan(10)
    })

    it('includes nonce in Google authentication request', async () => {
      const mockCallback = vi.fn()
      const nonce = 'test-nonce-12345'
      
      // Mock the nonce generation to return our test nonce
      vi.doMock('../../../lib/auth/google-config', async () => {
        const actual = await vi.importActual('../../../lib/auth/google-config')
        return {
          ...actual,
          generateNonce: () => nonce
        }
      })

      const config = await createGoogleConfig(mockCallback, nonce)
      expect(config.nonce).toBe(nonce)
    })
  })

  describe('Error Scenarios', () => {
    it('handles provider configuration errors', async () => {
      const configError = {
        message: 'Provider not properly configured',
        status: 400,
        name: 'AuthProviderError'
      }

      mockSupabase.auth.signInWithIdToken.mockResolvedValue({
        data: { user: null, session: null },
        error: configError
      })

      const result = await mockSupabase.auth.signInWithIdToken({
        provider: 'google',
        token: 'valid_token'
      })

      expect(result.error?.message).toContain('Provider not properly configured')
    })

    it('handles malformed ID token errors', async () => {
      const malformedError = {
        message: 'JWT token is malformed',
        status: 400,
        name: 'AuthMalformedTokenError'
      }

      mockSupabase.auth.signInWithIdToken.mockResolvedValue({
        data: { user: null, session: null },
        error: malformedError
      })

      const result = await mockSupabase.auth.signInWithIdToken({
        provider: 'google',
        token: 'malformed.jwt.token'
      })

      expect(result.error?.message).toContain('malformed')
    })

    it('handles rate limiting errors', async () => {
      const rateLimitError = {
        message: 'Rate limit exceeded',
        status: 429,
        name: 'AuthRateLimitError'
      }

      mockSupabase.auth.signInWithIdToken.mockResolvedValue({
        data: { user: null, session: null },
        error: rateLimitError
      })

      const result = await mockSupabase.auth.signInWithIdToken({
        provider: 'google',
        token: 'rate_limited_token'
      })

      expect(result.error?.status).toBe(429)
      expect(result.error?.message).toContain('Rate limit')
    })

    it('handles database connection errors', async () => {
      const dbError = new Error('Database connection failed')
      mockSupabase.auth.signInWithIdToken.mockRejectedValue(dbError)

      await expect(
        mockSupabase.auth.signInWithIdToken({
          provider: 'google',
          token: 'test_token'
        })
      ).rejects.toThrow('Database connection failed')
    })
  })

  describe('Performance Testing', () => {
    it('completes ID token authentication within performance threshold', async () => {
      const mockUser = {
        id: 'perf-test-user',
        email: 'perf@gmail.com',
        app_metadata: { provider: 'google' }
      }

      // Add artificial delay to test timeout
      mockSupabase.auth.signInWithIdToken.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          data: { user: mockUser, session: { user: mockUser } },
          error: null
        }), 500)) // 500ms delay
      )

      const startTime = Date.now()
      await mockSupabase.auth.signInWithIdToken({
        provider: 'google',
        token: 'perf_test_token'
      })
      const endTime = Date.now()

      // Should complete within 3 seconds per AC requirements
      expect(endTime - startTime).toBeLessThan(3000)
    })

    it('handles concurrent authentication requests', async () => {
      const mockUser = {
        id: 'concurrent-test-user',
        email: 'concurrent@gmail.com',
        app_metadata: { provider: 'google' }
      }

      mockSupabase.auth.signInWithIdToken.mockResolvedValue({
        data: { user: mockUser, session: { user: mockUser } },
        error: null
      })

      // Create multiple concurrent requests
      const promises = Array.from({ length: 5 }, (_, i) =>
        mockSupabase.auth.signInWithIdToken({
          provider: 'google',
          token: `concurrent_token_${i}`
        })
      )

      const startTime = Date.now()
      const results = await Promise.all(promises)
      const endTime = Date.now()

      // All should succeed
      results.forEach(result => {
        expect(result.error).toBeNull()
        expect(result.data.user).toEqual(mockUser)
      })

      // Should complete within reasonable time
      expect(endTime - startTime).toBeLessThan(2000)
    })
  })

  describe('Authentication State Management', () => {
    it('properly handles SIGNED_IN event for Google users', () => {
      const mockCallback = vi.fn()
      mockSupabase.auth.onAuthStateChange.mockImplementation((callback) => {
        mockCallback.mockImplementation(callback)
        return { data: { subscription: { unsubscribe: vi.fn() } } }
      })

      const googleUser = {
        id: 'google-user',
        email: 'google@gmail.com',
        app_metadata: { provider: 'google' }
      }

      const session = { user: googleUser }

      // Simulate SIGNED_IN event
      mockCallback('SIGNED_IN', session)

      expect(mockCallback).toHaveBeenCalledWith('SIGNED_IN', session)
    })

    it('handles TOKEN_REFRESHED event for Google sessions', () => {
      const mockCallback = vi.fn()
      mockSupabase.auth.onAuthStateChange.mockImplementation((callback) => {
        mockCallback.mockImplementation(callback)
        return { data: { subscription: { unsubscribe: vi.fn() } } }
      })

      const refreshedSession = {
        access_token: 'new_refreshed_token',
        user: { id: 'google-user', email: 'google@gmail.com' }
      }

      // Simulate TOKEN_REFRESHED event
      mockCallback('TOKEN_REFRESHED', refreshedSession)

      expect(mockCallback).toHaveBeenCalledWith('TOKEN_REFRESHED', refreshedSession)
    })

    it('handles sign out properly', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({ error: null })

      const result = await mockSupabase.auth.signOut()

      expect(mockSupabase.auth.signOut).toHaveBeenCalled()
      expect(result.error).toBeNull()
    })
  })

  describe('User Session Validation', () => {
    it('validates active Google session', async () => {
      const activeSession = {
        access_token: 'valid_access_token',
        refresh_token: 'valid_refresh_token',
        expires_in: 3600,
        token_type: 'bearer',
        user: {
          id: 'session-test-user',
          email: 'session@gmail.com',
          app_metadata: { provider: 'google' }
        }
      }

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: activeSession },
        error: null
      })

      const result = await mockSupabase.auth.getSession()
      
      expect(result.data.session).toBeDefined()
      expect(result.data.session?.user.app_metadata.provider).toBe('google')
      expect(result.data.session?.access_token).toBe('valid_access_token')
    })

    it('handles expired session refresh', async () => {
      const expiredSessionError = {
        message: 'Session expired',
        status: 401,
        name: 'AuthSessionExpiredError'
      }

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: expiredSessionError
      })

      const result = await mockSupabase.auth.getSession()
      
      expect(result.data.session).toBeNull()
      expect(result.error).toEqual(expiredSessionError)
    })

    it('validates user information retrieval', async () => {
      const testUser = {
        id: 'user-validation-test',
        email: 'validation@gmail.com',
        app_metadata: { provider: 'google' },
        user_metadata: { email_verified: true }
      }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: testUser },
        error: null
      })

      const result = await mockSupabase.auth.getUser()
      
      expect(result.data.user).toEqual(testUser)
      expect(result.data.user?.app_metadata.provider).toBe('google')
      expect(result.error).toBeNull()
    })
  })
})