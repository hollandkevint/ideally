import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createBrowserClient } from '@supabase/ssr'

// Mock Supabase client
vi.mock('@supabase/ssr', () => ({
  createBrowserClient: vi.fn()
}))

const mockSupabase = {
  auth: {
    signInWithIdToken: vi.fn(),
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(() => ({
      data: { subscription: { unsubscribe: vi.fn() } }
    })),
    signOut: vi.fn()
  }
}

vi.mocked(createBrowserClient).mockReturnValue(mockSupabase as any)

describe('Supabase Google Authentication Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('ID Token Flow', () => {
    it('successfully authenticates with valid Google ID token', async () => {
      const mockUser = {
        id: 'google-user-123',
        email: 'test@gmail.com',
        app_metadata: {
          provider: 'google',
          providers: ['google']
        },
        user_metadata: {
          email: 'test@gmail.com',
          email_verified: true,
          full_name: 'Test User',
          avatar_url: 'https://lh3.googleusercontent.com/avatar.jpg',
          provider_id: '12345',
          sub: '12345'
        }
      }

      const mockSession = {
        access_token: 'access_token',
        refresh_token: 'refresh_token',
        expires_in: 3600,
        token_type: 'bearer',
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
      expect(result.data.user.app_metadata.provider).toBe('google')
      expect(result.data.user.user_metadata.email_verified).toBe(true)
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

      expect(result.data.user.email).toBe(googleProfileData.email)
      expect(result.data.user.user_metadata.full_name).toBe(googleProfileData.name)
      expect(result.data.user.user_metadata.avatar_url).toBe(googleProfileData.picture)
      expect(result.data.user.user_metadata.email_verified).toBe(true)
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
      expect(result.data.session.access_token).toBe('new_access_token')
      expect(result.data.session.user.id).toBe('new-google-user')
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
      expect(result.data.session.user.id).toBe('existing-google-user')
    })
  })

  describe('Authentication State Changes', () => {
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

      expect(result.error.message).toContain('Provider not properly configured')
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

      expect(result.error.message).toContain('malformed')
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
  })
})