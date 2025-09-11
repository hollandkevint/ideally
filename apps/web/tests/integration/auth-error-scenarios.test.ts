import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import { AuthProvider, useAuth } from '../../lib/auth/AuthContext'
import GoogleOneTapSignin from '../../app/components/auth/GoogleOneTapSignin'
import { supabase } from '../../lib/supabase/client'
import { loadGoogleScript, createGoogleConfig, isGoogleLoaded } from '../../lib/auth/google-config'

// Mock dependencies
vi.mock('../../lib/supabase/client')
vi.mock('../../lib/auth/google-config')
vi.mock('next/script', () => ({
  default: ({ onLoad, onError, ...props }: any) => <script {...props} />
}))

const mockSupabase = vi.mocked(supabase)
const mockLoadGoogleScript = vi.mocked(loadGoogleScript)
const mockCreateGoogleConfig = vi.mocked(createGoogleConfig)
const mockIsGoogleLoaded = vi.mocked(isGoogleLoaded)

// Mock Google Identity Services
const mockGooglePrompt = vi.fn()
const mockGoogleInitialize = vi.fn()
const mockGoogleCancel = vi.fn()

Object.defineProperty(window, 'google', {
  value: {
    accounts: {
      id: {
        initialize: mockGoogleInitialize,
        prompt: mockGooglePrompt,
        cancel: mockGoogleCancel
      }
    }
  },
  writable: true
})

// Test component for error scenarios
function ErrorTestComponent() {
  const { user, loading, signInWithGoogle } = useAuth()
  
  if (loading) return <div data-testid="loading">Loading...</div>
  
  if (user) {
    return (
      <div data-testid="authenticated">
        <span data-testid="user-email">{user.email}</span>
        <button data-testid="signout" onClick={() => {}}>Sign Out</button>
      </div>
    )
  }
  
  return (
    <div data-testid="unauthenticated">
      <GoogleOneTapSignin 
        onSuccess={() => console.log('Success')}
        onError={(error) => console.error('Error:', error)}
      />
      <button 
        data-testid="manual-signin"
        onClick={() => signInWithGoogle('test-token')}
      >
        Manual Sign In
      </button>
    </div>
  )
}

describe('Authentication Error Scenarios', () => {
  let mockSubscription: { unsubscribe: vi.Mock }
  let authStateCallback: ((event: string, session: any) => void) | undefined

  beforeEach(() => {
    vi.clearAllMocks()
    
    mockSubscription = { unsubscribe: vi.fn() }
    
    // Default mocks
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null
    })
    
    mockSupabase.auth.onAuthStateChange.mockImplementation((callback) => {
      authStateCallback = callback
      return { data: { subscription: mockSubscription } }
    })
    
    mockLoadGoogleScript.mockResolvedValue(undefined)
    mockIsGoogleLoaded.mockReturnValue(true)
    mockCreateGoogleConfig.mockResolvedValue({
      client_id: 'test-client-id',
      callback: vi.fn(),
      nonce: 'test-nonce'
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Invalid Google Credentials Handling', () => {
    it('handles invalid ID token signature', async () => {
      let credentialCallback: ((response: any) => void) | undefined

      mockCreateGoogleConfig.mockImplementation((callback) => {
        credentialCallback = callback
        return Promise.resolve({
          client_id: 'test-client-id',
          callback,
          nonce: 'test-nonce'
        })
      })

      const tokenError = {
        message: 'Invalid token signature',
        status: 401,
        name: 'AuthInvalidTokenSignature'
      }

      mockSupabase.auth.signInWithIdToken.mockResolvedValue({
        data: { user: null, session: null },
        error: tokenError
      })

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      render(
        <AuthProvider>
          <ErrorTestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('unauthenticated')).toBeInTheDocument()
      })

      act(() => {
        credentialCallback!({ credential: 'invalid.token.signature' })
      })

      await waitFor(() => {
        expect(screen.getByText('Google signin token is invalid or expired')).toBeInTheDocument()
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          expect.stringContaining('Google ID token signin error:'),
          expect.objectContaining({
            message: 'Invalid token signature',
            status: 401
          })
        )
      })

      expect(screen.getByTestId('unauthenticated')).toBeInTheDocument()
      
      consoleErrorSpy.mockRestore()
    })

    it('handles expired Google ID token', async () => {
      let credentialCallback: ((response: any) => void) | undefined

      mockCreateGoogleConfig.mockImplementation((callback) => {
        credentialCallback = callback
        return Promise.resolve({
          client_id: 'test-client-id',
          callback,
          nonce: 'test-nonce'
        })
      })

      const expiredTokenError = {
        message: 'Token has expired',
        status: 401,
        name: 'AuthTokenExpiredError'
      }

      mockSupabase.auth.signInWithIdToken.mockResolvedValue({
        data: { user: null, session: null },
        error: expiredTokenError
      })

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      render(
        <AuthProvider>
          <ErrorTestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('unauthenticated')).toBeInTheDocument()
      })

      act(() => {
        credentialCallback!({ credential: 'expired.token.value' })
      })

      await waitFor(() => {
        expect(screen.getByText('Google signin token is invalid or expired')).toBeInTheDocument()
      })

      consoleErrorSpy.mockRestore()
    })

    it('handles malformed JWT token', async () => {
      let credentialCallback: ((response: any) => void) | undefined

      mockCreateGoogleConfig.mockImplementation((callback) => {
        credentialCallback = callback
        return Promise.resolve({
          client_id: 'test-client-id',
          callback,
          nonce: 'test-nonce'
        })
      })

      const malformedTokenError = {
        message: 'JWT token is malformed',
        status: 400,
        name: 'AuthMalformedTokenError'
      }

      mockSupabase.auth.signInWithIdToken.mockResolvedValue({
        data: { user: null, session: null },
        error: malformedTokenError
      })

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      render(
        <AuthProvider>
          <ErrorTestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('unauthenticated')).toBeInTheDocument()
      })

      act(() => {
        credentialCallback!({ credential: 'malformed-jwt' })
      })

      await waitFor(() => {
        expect(screen.getByText('Google signin token is invalid or expired')).toBeInTheDocument()
      })

      consoleErrorSpy.mockRestore()
    })

    it('handles missing credential in response', async () => {
      let credentialCallback: ((response: any) => void) | undefined

      mockCreateGoogleConfig.mockImplementation((callback) => {
        credentialCallback = callback
        return Promise.resolve({
          client_id: 'test-client-id',
          callback,
          nonce: 'test-nonce'
        })
      })

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      render(
        <AuthProvider>
          <ErrorTestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('unauthenticated')).toBeInTheDocument()
      })

      // Simulate empty credential response
      act(() => {
        credentialCallback!({ credential: '' })
      })

      await waitFor(() => {
        expect(screen.getByText('No credential received from Google')).toBeInTheDocument()
      })

      consoleErrorSpy.mockRestore()
    })
  })

  describe('Network Failure Scenarios', () => {
    it('handles network timeout during authentication', async () => {
      mockSupabase.auth.signInWithIdToken.mockRejectedValue(
        new Error('Network request timeout')
      )

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      render(
        <AuthProvider>
          <ErrorTestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('unauthenticated')).toBeInTheDocument()
      })

      act(() => {
        screen.getByTestId('manual-signin').click()
      })

      await waitFor(() => {
        expect(screen.getByText('Network error during Google signin. Please try again.')).toBeInTheDocument()
      })

      consoleErrorSpy.mockRestore()
    })

    it('handles network connection lost', async () => {
      mockSupabase.auth.signInWithIdToken.mockRejectedValue(
        new Error('Network connection lost')
      )

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      render(
        <AuthProvider>
          <ErrorTestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('unauthenticated')).toBeInTheDocument()
      })

      act(() => {
        screen.getByTestId('manual-signin').click()
      })

      await waitFor(() => {
        expect(screen.getByText('Network error during Google signin. Please try again.')).toBeInTheDocument()
      })

      consoleErrorSpy.mockRestore()
    })

    it('handles server unavailable (503)', async () => {
      const serverError = {
        message: 'Service temporarily unavailable',
        status: 503,
        name: 'ServiceUnavailableError'
      }

      mockSupabase.auth.signInWithIdToken.mockResolvedValue({
        data: { user: null, session: null },
        error: serverError
      })

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      render(
        <AuthProvider>
          <ErrorTestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('unauthenticated')).toBeInTheDocument()
      })

      act(() => {
        screen.getByTestId('manual-signin').click()
      })

      await waitFor(() => {
        expect(screen.getByText('Google signin failed')).toBeInTheDocument()
      })

      consoleErrorSpy.mockRestore()
    })

    it('handles rate limiting (429)', async () => {
      const rateLimitError = {
        message: 'Rate limit exceeded',
        status: 429,
        name: 'RateLimitError'
      }

      mockSupabase.auth.signInWithIdToken.mockResolvedValue({
        data: { user: null, session: null },
        error: rateLimitError
      })

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      render(
        <AuthProvider>
          <ErrorTestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('unauthenticated')).toBeInTheDocument()
      })

      act(() => {
        screen.getByTestId('manual-signin').click()
      })

      await waitFor(() => {
        expect(screen.getByText('Google signin failed')).toBeInTheDocument()
      })

      consoleErrorSpy.mockRestore()
    })
  })

  describe('Browser Compatibility Issues', () => {
    it('handles browser that does not support Google One-Tap', async () => {
      const mockNotification = {
        isNotDisplayed: () => true,
        getNotDisplayedReason: () => 'browser_not_supported'
      }

      mockGooglePrompt.mockImplementation((callback) => {
        callback(mockNotification)
      })

      render(
        <AuthProvider>
          <ErrorTestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('unauthenticated')).toBeInTheDocument()
      })

      await waitFor(() => {
        expect(screen.getByText('Your browser does not support Google One-Tap signin')).toBeInTheDocument()
      })
    })

    it('handles Google script loading failure', async () => {
      mockLoadGoogleScript.mockRejectedValue(new Error('Failed to load Google Identity Services'))

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      render(
        <AuthProvider>
          <ErrorTestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('unauthenticated')).toBeInTheDocument()
      })

      await waitFor(() => {
        expect(screen.getByText('Google Sign-in Error')).toBeInTheDocument()
        expect(screen.getByText('Failed to load Google Identity Services')).toBeInTheDocument()
      })

      consoleErrorSpy.mockRestore()
    })

    it('handles Google services not available', async () => {
      mockIsGoogleLoaded.mockReturnValue(false)
      mockLoadGoogleScript.mockRejectedValue(new Error('Google Identity Services not available'))

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      render(
        <AuthProvider>
          <ErrorTestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('unauthenticated')).toBeInTheDocument()
      })

      await waitFor(() => {
        expect(screen.getByText('Google Identity Services not available')).toBeInTheDocument()
      })

      consoleErrorSpy.mockRestore()
    })

    it('handles Cross-Site Request Forgery protection blocking', async () => {
      const mockNotification = {
        isNotDisplayed: () => true,
        getNotDisplayedReason: () => 'suppressed_by_user'
      }

      mockGooglePrompt.mockImplementation((callback) => {
        callback(mockNotification)
      })

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      render(
        <AuthProvider>
          <ErrorTestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('unauthenticated')).toBeInTheDocument()
      })

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Google One-Tap not displayed:', 'suppressed_by_user')
      })

      // Should not show browser error message for user suppression
      expect(screen.queryByText('Your browser does not support Google One-Tap signin')).not.toBeInTheDocument()

      consoleSpy.mockRestore()
    })
  })

  describe('Configuration and Setup Errors', () => {
    it('handles missing Google Client ID configuration', async () => {
      // Mock environment variable missing
      const originalEnv = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
      delete process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

      mockCreateGoogleConfig.mockRejectedValue(
        new Error('NEXT_PUBLIC_GOOGLE_CLIENT_ID environment variable is not set')
      )

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      render(
        <AuthProvider>
          <ErrorTestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('unauthenticated')).toBeInTheDocument()
      })

      await waitFor(() => {
        expect(screen.getByText('NEXT_PUBLIC_GOOGLE_CLIENT_ID environment variable is not set')).toBeInTheDocument()
      })

      // Restore environment
      if (originalEnv) {
        process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = originalEnv
      }

      consoleErrorSpy.mockRestore()
    })

    it('handles incorrect Google Client ID configuration', async () => {
      const configError = {
        message: 'Invalid client ID',
        status: 400,
        name: 'AuthConfigError'
      }

      mockSupabase.auth.signInWithIdToken.mockResolvedValue({
        data: { user: null, session: null },
        error: configError
      })

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      render(
        <AuthProvider>
          <ErrorTestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('unauthenticated')).toBeInTheDocument()
      })

      act(() => {
        screen.getByTestId('manual-signin').click()
      })

      await waitFor(() => {
        expect(screen.getByText('Google signin failed')).toBeInTheDocument()
      })

      consoleErrorSpy.mockRestore()
    })

    it('handles Supabase provider not configured', async () => {
      const providerError = {
        message: 'Provider not properly configured',
        status: 400,
        name: 'AuthProviderError'
      }

      mockSupabase.auth.signInWithIdToken.mockResolvedValue({
        data: { user: null, session: null },
        error: providerError
      })

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      render(
        <AuthProvider>
          <ErrorTestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('unauthenticated')).toBeInTheDocument()
      })

      act(() => {
        screen.getByTestId('manual-signin').click()
      })

      await waitFor(() => {
        expect(screen.getByText('Google signin is not properly configured')).toBeInTheDocument()
      })

      consoleErrorSpy.mockRestore()
    })
  })

  describe('Session and State Management Errors', () => {
    it('handles session corruption', async () => {
      // Mock corrupted session data
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'Session corrupted', status: 500 }
      })

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      render(
        <AuthProvider>
          <ErrorTestComponent />
        </AuthProvider>
      )

      // Should handle gracefully and show unauthenticated state
      await waitFor(() => {
        expect(screen.getByTestId('unauthenticated')).toBeInTheDocument()
      })

      consoleErrorSpy.mockRestore()
    })

    it('handles concurrent authentication attempts', async () => {
      let credentialCallback: ((response: any) => void) | undefined
      let resolveFirstAuth: () => void
      let resolveSecondAuth: () => void

      mockCreateGoogleConfig.mockImplementation((callback) => {
        credentialCallback = callback
        return Promise.resolve({
          client_id: 'test-client-id',
          callback,
          nonce: 'test-nonce'
        })
      })

      // Create controlled promises for concurrent requests
      const firstAuthPromise = new Promise(resolve => { resolveFirstAuth = resolve as any })
      const secondAuthPromise = new Promise(resolve => { resolveSecondAuth = resolve as any })

      mockSupabase.auth.signInWithIdToken
        .mockReturnValueOnce(firstAuthPromise as any)
        .mockReturnValueOnce(secondAuthPromise as any)

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      render(
        <AuthProvider>
          <ErrorTestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('unauthenticated')).toBeInTheDocument()
      })

      // Trigger two rapid signin attempts
      act(() => {
        credentialCallback!({ credential: 'first_attempt' })
        credentialCallback!({ credential: 'second_attempt' })
      })

      // Both requests should be made
      expect(mockSupabase.auth.signInWithIdToken).toHaveBeenCalledTimes(2)

      // Should handle concurrent requests gracefully
      resolveFirstAuth!()
      resolveSecondAuth!()

      consoleErrorSpy.mockRestore()
    })

    it('handles unexpected authentication state changes', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null
      })

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      render(
        <AuthProvider>
          <ErrorTestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('unauthenticated')).toBeInTheDocument()
      })

      // Simulate unexpected auth event
      act(() => {
        authStateCallback!('UNKNOWN_EVENT' as any, null)
      })

      // Should log the event but not crash
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Auth state change:'),
        expect.objectContaining({
          event: 'UNKNOWN_EVENT'
        })
      )

      expect(screen.getByTestId('unauthenticated')).toBeInTheDocument()

      consoleSpy.mockRestore()
    })
  })

  describe('Error Recovery Scenarios', () => {
    it('allows retry after network failure', async () => {
      let credentialCallback: ((response: any) => void) | undefined

      mockCreateGoogleConfig.mockImplementation((callback) => {
        credentialCallback = callback
        return Promise.resolve({
          client_id: 'test-client-id',
          callback,
          nonce: 'test-nonce'
        })
      })

      // First attempt fails, second succeeds
      mockSupabase.auth.signInWithIdToken
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          data: { 
            user: { id: 'retry-user', email: 'retry@example.com' }, 
            session: { user: { id: 'retry-user', email: 'retry@example.com' } }
          },
          error: null
        })

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      render(
        <AuthProvider>
          <ErrorTestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('unauthenticated')).toBeInTheDocument()
      })

      // First attempt - should fail
      act(() => {
        credentialCallback!({ credential: 'retry_credential' })
      })

      await waitFor(() => {
        expect(screen.getByText('Network error during Google signin. Please try again.')).toBeInTheDocument()
      })

      // Second attempt - should succeed
      act(() => {
        credentialCallback!({ credential: 'retry_credential' })
      })

      // Simulate successful auth state change
      act(() => {
        authStateCallback!('SIGNED_IN', { 
          user: { id: 'retry-user', email: 'retry@example.com' },
          access_token: 'retry_token'
        })
      })

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toBeInTheDocument()
        expect(screen.getByText('retry@example.com')).toBeInTheDocument()
      })

      consoleErrorSpy.mockRestore()
    })

    it('clears error state on successful authentication', async () => {
      let credentialCallback: ((response: any) => void) | undefined

      mockCreateGoogleConfig.mockImplementation((callback) => {
        credentialCallback = callback
        return Promise.resolve({
          client_id: 'test-client-id',
          callback,
          nonce: 'test-nonce'
        })
      })

      const tokenError = {
        message: 'Invalid token',
        status: 401,
        name: 'AuthInvalidTokenError'
      }

      // First fails with error, second succeeds
      mockSupabase.auth.signInWithIdToken
        .mockResolvedValueOnce({
          data: { user: null, session: null },
          error: tokenError
        })
        .mockResolvedValueOnce({
          data: { 
            user: { id: 'success-user', email: 'success@example.com' }, 
            session: { user: { id: 'success-user', email: 'success@example.com' } }
          },
          error: null
        })

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      render(
        <AuthProvider>
          <ErrorTestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('unauthenticated')).toBeInTheDocument()
      })

      // First attempt - show error
      act(() => {
        credentialCallback!({ credential: 'invalid_credential' })
      })

      await waitFor(() => {
        expect(screen.getByText('Google signin token is invalid or expired')).toBeInTheDocument()
      })

      // Second attempt - clear error and succeed
      act(() => {
        credentialCallback!({ credential: 'valid_credential' })
      })

      // Simulate successful auth
      act(() => {
        authStateCallback!('SIGNED_IN', {
          user: { id: 'success-user', email: 'success@example.com' },
          access_token: 'success_token'
        })
      })

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toBeInTheDocument()
        expect(screen.queryByText('Google signin token is invalid or expired')).not.toBeInTheDocument()
      })

      consoleErrorSpy.mockRestore()
    })
  })
})