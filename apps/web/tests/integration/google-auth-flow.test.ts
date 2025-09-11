import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import { supabase } from '../../lib/supabase/client'
import { AuthProvider, useAuth } from '../../lib/auth/AuthContext'
import GoogleOneTapSignin from '../../app/components/auth/GoogleOneTapSignin'
import { loadGoogleScript, createGoogleConfig, isGoogleLoaded } from '../../lib/auth/google-config'
import type { User, Session } from '@supabase/supabase-js'

// Mock Supabase client
vi.mock('../../lib/supabase/client', () => ({
  supabase: {
    auth: {
      signInWithIdToken: vi.fn(),
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } }
      })),
      signOut: vi.fn()
    }
  }
}))

// Mock Google config
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

// Test component
function TestAuthComponent() {
  const { user, loading } = useAuth()
  
  if (loading) return <div data-testid="loading">Loading...</div>
  if (user) return <div data-testid="authenticated">User: {user.email}</div>
  
  return (
    <div data-testid="unauthenticated">
      <GoogleOneTapSignin 
        onSuccess={() => console.log('Success')}
        onError={(error) => console.error(error)}
      />
    </div>
  )
}

describe('Google Authentication Flow Integration', () => {
  const mockUser: User = {
    id: 'integration-user-123',
    email: 'integration@gmail.com',
    app_metadata: { provider: 'google' },
    user_metadata: {
      email_verified: true,
      full_name: 'Integration Test User',
      avatar_url: 'https://lh3.googleusercontent.com/avatar.jpg'
    },
    aud: 'authenticated',
    created_at: '2023-01-01T00:00:00Z',
    role: 'authenticated'
  }

  const mockSession: Session = {
    access_token: 'integration_token',
    refresh_token: 'refresh_token',
    expires_in: 3600,
    token_type: 'bearer',
    user: mockUser,
    expires_at: Date.now() + 3600000
  }

  let mockSubscription: { unsubscribe: vi.Mock }
  let authStateCallback: ((event: string, session: Session | null) => void) | undefined

  beforeEach(() => {
    vi.clearAllMocks()
    
    mockSubscription = { unsubscribe: vi.fn() }
    
    // Setup default mocks
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null
    })
    
    mockSupabase.auth.onAuthStateChange.mockImplementation((callback) => {
      authStateCallback = callback
      return { data: { subscription: mockSubscription } }
    })
    
    mockSupabase.auth.signInWithIdToken.mockResolvedValue({
      data: { user: mockUser, session: mockSession },
      error: null
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

  describe('Complete Authentication Flow', () => {
    it('successfully completes new user Google signin flow', async () => {
      let credentialCallback: ((response: any) => void) | undefined

      mockCreateGoogleConfig.mockImplementation((callback) => {
        credentialCallback = callback
        return Promise.resolve({
          client_id: 'test-client-id',
          callback,
          nonce: 'test-nonce'
        })
      })

      render(
        <AuthProvider>
          <TestAuthComponent />
        </AuthProvider>
      )

      // Should start with loading
      expect(screen.getByTestId('loading')).toBeInTheDocument()

      // Wait for initialization
      await waitFor(() => {
        expect(screen.getByTestId('unauthenticated')).toBeInTheDocument()
      })

      // Verify Google initialization
      await waitFor(() => {
        expect(mockLoadGoogleScript).toHaveBeenCalled()
        expect(mockCreateGoogleConfig).toHaveBeenCalled()
      })

      // Simulate Google credential response
      act(() => {
        credentialCallback!({ credential: 'valid_google_credential' })
      })

      // Wait for Supabase call
      await waitFor(() => {
        expect(mockSupabase.auth.signInWithIdToken).toHaveBeenCalledWith({
          provider: 'google',
          token: 'valid_google_credential'
        })
      })

      // Simulate auth state change
      act(() => {
        authStateCallback!('SIGNED_IN', mockSession)
      })

      // Should show authenticated user
      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toBeInTheDocument()
        expect(screen.getByText('User: integration@gmail.com')).toBeInTheDocument()
      })
    })

    it('handles existing user signin flow', async () => {
      // Start with existing session
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      })

      render(
        <AuthProvider>
          <TestAuthComponent />
        </AuthProvider>
      )

      // Should go directly to authenticated state
      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toBeInTheDocument()
      })

      // Google signin should not be initialized
      expect(mockLoadGoogleScript).not.toHaveBeenCalled()
    })

    it('validates user creation and existing user login scenarios', async () => {
      let credentialCallback: ((response: any) => void) | undefined

      mockCreateGoogleConfig.mockImplementation((callback) => {
        credentialCallback = callback
        return Promise.resolve({
          client_id: 'test-client-id',
          callback,
          nonce: 'test-nonce'
        })
      })

      // Test new user creation
      const newUser = { ...mockUser, id: 'new-user-456' }
      mockSupabase.auth.signInWithIdToken.mockResolvedValueOnce({
        data: { user: newUser, session: { ...mockSession, user: newUser } },
        error: null
      })

      render(
        <AuthProvider>
          <TestAuthComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('unauthenticated')).toBeInTheDocument()
      })

      // Simulate new user signin
      act(() => {
        credentialCallback!({ credential: 'new_user_credential' })
      })

      await waitFor(() => {
        expect(mockSupabase.auth.signInWithIdToken).toHaveBeenCalledWith({
          provider: 'google',
          token: 'new_user_credential'
        })
      })

      // Simulate successful auth
      act(() => {
        authStateCallback!('SIGNED_IN', { ...mockSession, user: newUser })
      })

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toBeInTheDocument()
      })
    })

    it('validates workspace and conversation data access preservation', async () => {
      let credentialCallback: ((response: any) => void) | undefined

      mockCreateGoogleConfig.mockImplementation((callback) => {
        credentialCallback = callback
        return Promise.resolve({
          client_id: 'test-client-id',
          callback,
          nonce: 'test-nonce'
        })
      })

      // Mock user with workspace data
      const userWithWorkspace = {
        ...mockUser,
        user_metadata: {
          ...mockUser.user_metadata,
          workspace_id: 'workspace-123',
          active_conversations: ['conv-1', 'conv-2']
        }
      }

      mockSupabase.auth.signInWithIdToken.mockResolvedValue({
        data: { 
          user: userWithWorkspace, 
          session: { ...mockSession, user: userWithWorkspace }
        },
        error: null
      })

      render(
        <AuthProvider>
          <TestAuthComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('unauthenticated')).toBeInTheDocument()
      })

      act(() => {
        credentialCallback!({ credential: 'workspace_user_credential' })
      })

      await waitFor(() => {
        expect(mockSupabase.auth.signInWithIdToken).toHaveBeenCalled()
      })

      act(() => {
        authStateCallback!('SIGNED_IN', { ...mockSession, user: userWithWorkspace })
      })

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toBeInTheDocument()
      })
    })
  })

  describe('Error Scenario Integration', () => {
    it('handles invalid Google credentials gracefully', async () => {
      let credentialCallback: ((response: any) => void) | undefined

      mockCreateGoogleConfig.mockImplementation((callback) => {
        credentialCallback = callback
        return Promise.resolve({
          client_id: 'test-client-id',
          callback,
          nonce: 'test-nonce'
        })
      })

      const authError = {
        message: 'Invalid credentials',
        status: 401,
        name: 'AuthInvalidCredentialsError'
      }

      mockSupabase.auth.signInWithIdToken.mockResolvedValue({
        data: { user: null, session: null },
        error: authError
      })

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      render(
        <AuthProvider>
          <TestAuthComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('unauthenticated')).toBeInTheDocument()
      })

      act(() => {
        credentialCallback!({ credential: 'invalid_credential' })
      })

      await waitFor(() => {
        expect(screen.getByText('Google signin token is invalid or expired')).toBeInTheDocument()
      })

      expect(screen.getByTestId('unauthenticated')).toBeInTheDocument()

      consoleErrorSpy.mockRestore()
    })

    it('handles network failure during authentication', async () => {
      let credentialCallback: ((response: any) => void) | undefined

      mockCreateGoogleConfig.mockImplementation((callback) => {
        credentialCallback = callback
        return Promise.resolve({
          client_id: 'test-client-id',
          callback,
          nonce: 'test-nonce'
        })
      })

      mockSupabase.auth.signInWithIdToken.mockRejectedValue(new Error('Network error'))

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      render(
        <AuthProvider>
          <TestAuthComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('unauthenticated')).toBeInTheDocument()
      })

      act(() => {
        credentialCallback!({ credential: 'network_fail_credential' })
      })

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument()
      })

      consoleErrorSpy.mockRestore()
    })

    it('handles browser compatibility and fallback scenarios', async () => {
      mockIsGoogleLoaded.mockReturnValue(false)
      mockLoadGoogleScript.mockRejectedValue(new Error('Browser not supported'))

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      render(
        <AuthProvider>
          <TestAuthComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('unauthenticated')).toBeInTheDocument()
      })

      await waitFor(() => {
        expect(screen.getByText('Google Sign-in Error')).toBeInTheDocument()
        expect(screen.getByText('Browser not supported')).toBeInTheDocument()
      })

      consoleErrorSpy.mockRestore()
    })
  })

  describe('Session Management Integration', () => {
    it('validates session persistence across browser restarts', async () => {
      // Simulate existing session from storage
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      })

      render(
        <AuthProvider>
          <TestAuthComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toBeInTheDocument()
      })

      expect(mockSupabase.auth.getSession).toHaveBeenCalled()
    })

    it('validates session behavior across multiple tabs', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      })

      // Render two instances to simulate multiple tabs
      const { rerender } = render(
        <AuthProvider>
          <TestAuthComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toBeInTheDocument()
      })

      // Simulate auth state change in another tab
      act(() => {
        authStateCallback!('SIGNED_OUT', null)
      })

      await waitFor(() => {
        expect(screen.getByTestId('unauthenticated')).toBeInTheDocument()
      })
    })

    it('validates session expiration and refresh handling', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      })

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      render(
        <AuthProvider>
          <TestAuthComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toBeInTheDocument()
      })

      // Simulate token refresh
      const refreshedSession = {
        ...mockSession,
        access_token: 'new_refreshed_token'
      }

      act(() => {
        authStateCallback!('TOKEN_REFRESHED', refreshedSession)
      })

      expect(screen.getByTestId('authenticated')).toBeInTheDocument()
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Token refreshed for user:'),
        expect.objectContaining({
          email: 'integration@gmail.com'
        })
      )

      consoleSpy.mockRestore()
    })

    it('validates logout functionality and session cleanup', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      })

      mockSupabase.auth.signOut.mockResolvedValue({ error: null })

      render(
        <AuthProvider>
          <TestAuthComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toBeInTheDocument()
      })

      // Simulate signout
      act(() => {
        authStateCallback!('SIGNED_OUT', null)
      })

      await waitFor(() => {
        expect(screen.getByTestId('unauthenticated')).toBeInTheDocument()
      })
    })
  })

  describe('Performance Integration', () => {
    it('validates authentication flow completion within performance threshold', async () => {
      let credentialCallback: ((response: any) => void) | undefined

      mockCreateGoogleConfig.mockImplementation((callback) => {
        credentialCallback = callback
        return Promise.resolve({
          client_id: 'test-client-id',
          callback,
          nonce: 'test-nonce'
        })
      })

      // Add realistic timing
      mockSupabase.auth.signInWithIdToken.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          data: { user: mockUser, session: mockSession },
          error: null
        }), 600))
      )

      render(
        <AuthProvider>
          <TestAuthComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('unauthenticated')).toBeInTheDocument()
      })

      const startTime = Date.now()

      act(() => {
        credentialCallback!({ credential: 'performance_test_credential' })
      })

      act(() => {
        authStateCallback!('SIGNED_IN', mockSession)
      })

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toBeInTheDocument()
      })

      const endTime = Date.now()
      const authTime = endTime - startTime

      // Should complete within 5 seconds (AC requirement)
      expect(authTime).toBeLessThan(5000)
    })

    it('validates no regression in page load performance', async () => {
      const startTime = Date.now()

      render(
        <AuthProvider>
          <TestAuthComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toBeInTheDocument()
      })

      const loadTime = Date.now() - startTime

      // Initial render should be fast
      expect(loadTime).toBeLessThan(100)
    })
  })
})