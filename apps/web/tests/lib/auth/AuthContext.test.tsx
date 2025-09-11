import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import { AuthProvider, useAuth } from '../../../lib/auth/AuthContext'
import { supabase } from '../../../lib/supabase/client'
import type { User, AuthResponse, Session } from '@supabase/supabase-js'

// Mock Supabase client
vi.mock('../../../lib/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
      signOut: vi.fn(),
      signInWithIdToken: vi.fn(),
      signInWithPassword: vi.fn()
    }
  }
}))

const mockSupabase = vi.mocked(supabase)

// Test component that uses the Auth hook
function TestComponent() {
  const { user, loading, signOut, signInWithGoogle, signInWithEmail } = useAuth()
  
  if (loading) {
    return <div data-testid="loading">Loading...</div>
  }
  
  return (
    <div data-testid="auth-component">
      {user ? (
        <div>
          <span data-testid="user-email">{user.email}</span>
          <button data-testid="signout-btn" onClick={signOut}>
            Sign Out
          </button>
        </div>
      ) : (
        <div>
          <span data-testid="no-user">No user</span>
          <button 
            data-testid="google-signin-btn" 
            onClick={() => signInWithGoogle('mock-token')}
          >
            Sign In with Google
          </button>
          <button 
            data-testid="email-signin-btn" 
            onClick={() => signInWithEmail('test@example.com', 'password')}
          >
            Sign In with Email
          </button>
        </div>
      )}
    </div>
  )
}

describe('AuthContext', () => {
  const mockUser: User = {
    id: 'test-user-id',
    email: 'test@example.com',
    app_metadata: { provider: 'google' },
    user_metadata: {
      full_name: 'Test User',
      avatar_url: 'https://example.com/avatar.jpg'
    },
    aud: 'authenticated',
    created_at: '2023-01-01T00:00:00Z',
    role: 'authenticated'
  }

  const mockSession: Session = {
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    expires_in: 3600,
    token_type: 'bearer',
    user: mockUser,
    expires_at: Date.now() + 3600000
  }

  const mockAuthResponse: AuthResponse = {
    data: { user: mockUser, session: mockSession },
    error: null
  }

  let mockSubscription: { unsubscribe: vi.Mock }

  beforeEach(() => {
    vi.clearAllMocks()
    
    mockSubscription = { unsubscribe: vi.fn() }
    
    // Default mocks
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null
    })
    
    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: mockSubscription }
    })
    
    mockSupabase.auth.signOut.mockResolvedValue({ error: null })
    mockSupabase.auth.signInWithIdToken.mockResolvedValue(mockAuthResponse)
    mockSupabase.auth.signInWithPassword.mockResolvedValue(mockAuthResponse)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Provider Initialization', () => {
    it('renders children and initializes with loading state', async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      expect(screen.getByTestId('loading')).toBeInTheDocument()
      expect(mockSupabase.auth.getSession).toHaveBeenCalled()
      expect(mockSupabase.auth.onAuthStateChange).toHaveBeenCalled()
    })

    it('sets initial session when user is authenticated', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com')
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument()
      })
    })

    it('sets null user when no session exists', async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('no-user')).toBeInTheDocument()
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument()
      })
    })
  })

  describe('Authentication State Changes', () => {
    it('handles SIGNED_IN event', async () => {
      let authCallback: ((event: string, session: Session | null) => void) | undefined

      mockSupabase.auth.onAuthStateChange.mockImplementation((callback) => {
        authCallback = callback
        return { data: { subscription: mockSubscription } }
      })

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      // Wait for initialization
      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument()
      })

      // Simulate SIGNED_IN event
      act(() => {
        authCallback!('SIGNED_IN', mockSession)
      })

      await waitFor(() => {
        expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com')
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('User signed in successfully:'),
          expect.objectContaining({
            provider: 'google',
            email: 'test@example.com'
          })
        )
      })

      consoleSpy.mockRestore()
    })

    it('handles SIGNED_OUT event', async () => {
      let authCallback: ((event: string, session: Session | null) => void) | undefined

      mockSupabase.auth.onAuthStateChange.mockImplementation((callback) => {
        authCallback = callback
        return { data: { subscription: mockSubscription } }
      })

      // Start with user signed in
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      })

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      // Wait for initialization with user
      await waitFor(() => {
        expect(screen.getByTestId('user-email')).toBeInTheDocument()
      })

      // Simulate SIGNED_OUT event
      act(() => {
        authCallback!('SIGNED_OUT', null)
      })

      await waitFor(() => {
        expect(screen.getByTestId('no-user')).toBeInTheDocument()
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('User signed out:'),
          expect.objectContaining({
            timestamp: expect.any(String)
          })
        )
      })

      consoleSpy.mockRestore()
    })

    it('handles TOKEN_REFRESHED event', async () => {
      let authCallback: ((event: string, session: Session | null) => void) | undefined

      mockSupabase.auth.onAuthStateChange.mockImplementation((callback) => {
        authCallback = callback
        return { data: { subscription: mockSubscription } }
      })

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument()
      })

      // Simulate TOKEN_REFRESHED event
      act(() => {
        authCallback!('TOKEN_REFRESHED', mockSession)
      })

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('Token refreshed for user:'),
          expect.objectContaining({
            email: 'test@example.com'
          })
        )
      })

      consoleSpy.mockRestore()
    })
  })

  describe('Google Sign In', () => {
    it('handles successful Google signin', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('google-signin-btn')).toBeInTheDocument()
      })

      act(() => {
        screen.getByTestId('google-signin-btn').click()
      })

      await waitFor(() => {
        expect(mockSupabase.auth.signInWithIdToken).toHaveBeenCalledWith({
          provider: 'google',
          token: 'mock-token'
        })
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('Google signin successful:'),
          expect.objectContaining({
            email: 'test@example.com',
            provider: 'google'
          })
        )
      })

      consoleSpy.mockRestore()
    })

    it('handles Google signin with invalid token error', async () => {
      const mockError = {
        message: 'Invalid token signature',
        status: 401,
        name: 'AuthInvalidTokenSignature'
      }

      mockSupabase.auth.signInWithIdToken.mockResolvedValue({
        data: { user: null, session: null },
        error: mockError
      })

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('google-signin-btn')).toBeInTheDocument()
      })

      await expect(async () => {
        act(() => {
          screen.getByTestId('google-signin-btn').click()
        })
        
        await waitFor(() => {
          expect(consoleErrorSpy).toHaveBeenCalledWith(
            expect.stringContaining('Google ID token signin error:'),
            expect.objectContaining({
              message: 'Invalid token signature',
              status: 401
            })
          )
        })
      }).rejects.toThrow('Google signin token is invalid or expired')

      consoleErrorSpy.mockRestore()
    })

    it('handles Google signin network error', async () => {
      const mockError = {
        message: 'Network request failed',
        status: 500,
        name: 'NetworkError'
      }

      mockSupabase.auth.signInWithIdToken.mockResolvedValue({
        data: { user: null, session: null },
        error: mockError
      })

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('google-signin-btn')).toBeInTheDocument()
      })

      await expect(async () => {
        act(() => {
          screen.getByTestId('google-signin-btn').click()
        })
        
        await waitFor(() => {
          expect(consoleErrorSpy).toHaveBeenCalled()
        })
      }).rejects.toThrow('Network error during Google signin. Please try again.')

      consoleErrorSpy.mockRestore()
    })

    it('handles Google signin provider configuration error', async () => {
      const mockError = {
        message: 'Provider not configured',
        status: 400,
        name: 'ProviderError'
      }

      mockSupabase.auth.signInWithIdToken.mockResolvedValue({
        data: { user: null, session: null },
        error: mockError
      })

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('google-signin-btn')).toBeInTheDocument()
      })

      await expect(async () => {
        act(() => {
          screen.getByTestId('google-signin-btn').click()
        })
        
        await waitFor(() => {
          expect(consoleErrorSpy).toHaveBeenCalled()
        })
      }).rejects.toThrow('Google signin is not properly configured')

      consoleErrorSpy.mockRestore()
    })

    it('handles missing user data in response', async () => {
      mockSupabase.auth.signInWithIdToken.mockResolvedValue({
        data: { user: null, session: null },
        error: null
      })

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('google-signin-btn')).toBeInTheDocument()
      })

      await expect(async () => {
        act(() => {
          screen.getByTestId('google-signin-btn').click()
        })
        
        await waitFor(() => {
          expect(consoleErrorSpy).toHaveBeenCalledWith(
            expect.stringContaining('No user data received from Google signin')
          )
        })
      }).rejects.toThrow('No user information received from Google')

      consoleErrorSpy.mockRestore()
    })

    it('handles unexpected errors during Google signin', async () => {
      mockSupabase.auth.signInWithIdToken.mockRejectedValue(new Error('Unexpected error'))

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('google-signin-btn')).toBeInTheDocument()
      })

      await expect(async () => {
        act(() => {
          screen.getByTestId('google-signin-btn').click()
        })
        
        await waitFor(() => {
          expect(consoleErrorSpy).toHaveBeenCalledWith(
            expect.stringContaining('Unexpected error during Google signin:'),
            expect.objectContaining({
              error: expect.any(Error)
            })
          )
        })
      }).rejects.toThrow('Unexpected error')

      consoleErrorSpy.mockRestore()
    })
  })

  describe('Email Sign In', () => {
    it('handles successful email signin', async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('email-signin-btn')).toBeInTheDocument()
      })

      act(() => {
        screen.getByTestId('email-signin-btn').click()
      })

      await waitFor(() => {
        expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password'
        })
      })
    })

    it('returns error for failed email signin', async () => {
      const mockError = { message: 'Invalid credentials' }

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: mockError
      })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('email-signin-btn')).toBeInTheDocument()
      })

      act(() => {
        screen.getByTestId('email-signin-btn').click()
      })

      await waitFor(() => {
        expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password'
        })
      })
    })
  })

  describe('Sign Out', () => {
    it('handles successful sign out', async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      // Start with user signed in
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      })

      await waitFor(() => {
        expect(screen.getByTestId('signout-btn')).toBeInTheDocument()
      })

      act(() => {
        screen.getByTestId('signout-btn').click()
      })

      await waitFor(() => {
        expect(mockSupabase.auth.signOut).toHaveBeenCalled()
      })
    })
  })

  describe('Component Cleanup', () => {
    it('unsubscribes from auth state changes on unmount', async () => {
      const { unmount } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(mockSupabase.auth.onAuthStateChange).toHaveBeenCalled()
      })

      unmount()

      expect(mockSubscription.unsubscribe).toHaveBeenCalled()
    })
  })

  describe('Hook Usage Outside Provider', () => {
    it('throws error when useAuth is used outside AuthProvider', () => {
      // Mock console.error to prevent error output in tests
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      expect(() => {
        render(<TestComponent />)
      }).toThrow('useAuth must be used within an AuthProvider')

      consoleErrorSpy.mockRestore()
    })
  })

  describe('Logging and Debugging', () => {
    it('logs initial session information', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('Initial session:'),
          'test@example.com'
        )
      })

      consoleSpy.mockRestore()
    })

    it('logs auth state changes with proper metadata', async () => {
      let authCallback: ((event: string, session: Session | null) => void) | undefined

      mockSupabase.auth.onAuthStateChange.mockImplementation((callback) => {
        authCallback = callback
        return { data: { subscription: mockSubscription } }
      })

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(mockSupabase.auth.onAuthStateChange).toHaveBeenCalled()
      })

      // Simulate auth state change
      act(() => {
        authCallback!('SIGNED_IN', mockSession)
      })

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('Auth state change:'),
          expect.objectContaining({
            event: 'SIGNED_IN',
            user: 'test@example.com',
            provider: 'google',
            timestamp: expect.any(String)
          })
        )
      })

      consoleSpy.mockRestore()
    })
  })
})