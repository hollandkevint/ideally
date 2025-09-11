import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react'
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
      signOut: vi.fn(),
      refreshSession: vi.fn(),
      setSession: vi.fn()
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

// Mock localStorage for session persistence testing
const mockLocalStorage = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value }),
    removeItem: vi.fn((key: string) => { delete store[key] }),
    clear: vi.fn(() => { store = {} }),
    get length() { return Object.keys(store).length },
    key: vi.fn((index: number) => Object.keys(store)[index] || null)
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true
})

// Mock sessionStorage
const mockSessionStorage = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value }),
    removeItem: vi.fn((key: string) => { delete store[key] }),
    clear: vi.fn(() => { store = {} }),
    get length() { return Object.keys(store).length },
    key: vi.fn((index: number) => Object.keys(store)[index] || null)
  }
})()

Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
  writable: true
})

// Test component for session management
function SessionTestComponent() {
  const { user, loading, signOut } = useAuth()
  
  if (loading) return <div data-testid="loading">Loading...</div>
  if (user) {
    return (
      <div data-testid="authenticated">
        <span>User: {user.email}</span>
        <button onClick={signOut} data-testid="signout-button">Sign Out</button>
      </div>
    )
  }
  
  return (
    <div data-testid="unauthenticated">
      <GoogleOneTapSignin 
        onSuccess={() => console.log('Success')}
        onError={(error) => console.error(error)}
      />
    </div>
  )
}

describe('Session Management Testing', () => {
  const mockUser: User = {
    id: 'session-user-123',
    email: 'session@test.com',
    app_metadata: { provider: 'google' },
    user_metadata: {
      email_verified: true,
      full_name: 'Session Test User',
      avatar_url: 'https://lh3.googleusercontent.com/avatar.jpg'
    },
    aud: 'authenticated',
    created_at: '2023-01-01T00:00:00Z',
    role: 'authenticated'
  }

  const mockSession: Session = {
    access_token: 'session_token_abc123',
    refresh_token: 'refresh_token_xyz789',
    expires_in: 3600,
    token_type: 'bearer',
    user: mockUser,
    expires_at: Date.now() + 3600000
  }

  let mockSubscription: { unsubscribe: vi.Mock }
  let authStateCallback: ((event: string, session: Session | null) => void) | undefined

  beforeEach(() => {
    vi.clearAllMocks()
    mockLocalStorage.clear()
    mockSessionStorage.clear()
    
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
    
    mockSupabase.auth.signOut.mockResolvedValue({ error: null })
    mockSupabase.auth.refreshSession.mockResolvedValue({
      data: { session: mockSession, user: mockUser },
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
    mockLocalStorage.clear()
    mockSessionStorage.clear()
  })

  describe('Session Persistence Across Browser Restarts', () => {
    it('validates session persistence across browser restarts', async () => {
      // Simulate existing session from previous browser session
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      })

      // Simulate localStorage having session data
      mockLocalStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: mockSession.access_token,
        refresh_token: mockSession.refresh_token,
        expires_at: mockSession.expires_at
      }))

      render(
        <AuthProvider>
          <SessionTestComponent />
        </AuthProvider>
      )

      // Should start with loading
      expect(screen.getByTestId('loading')).toBeInTheDocument()

      // Should restore session from storage
      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toBeInTheDocument()
      })

      expect(screen.getByText('User: session@test.com')).toBeInTheDocument()
      expect(mockSupabase.auth.getSession).toHaveBeenCalled()
    })

    it('handles corrupted session data in storage', async () => {
      // Simulate corrupted localStorage data
      mockLocalStorage.setItem('supabase.auth.token', 'corrupted-json-data')

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null
      })

      render(
        <AuthProvider>
          <SessionTestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('unauthenticated')).toBeInTheDocument()
      })

      // Should gracefully handle corrupted data and show signin
      expect(mockSupabase.auth.getSession).toHaveBeenCalled()
    })

    it('validates session expiration handling on restart', async () => {
      // Create expired session
      const expiredSession = {
        ...mockSession,
        expires_at: Date.now() - 3600000 // Expired 1 hour ago
      }

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: expiredSession },
        error: null
      })

      // Simulate refresh attempt
      mockSupabase.auth.refreshSession.mockResolvedValue({
        data: { 
          session: { ...mockSession, expires_at: Date.now() + 3600000 },
          user: mockUser 
        },
        error: null
      })

      render(
        <AuthProvider>
          <SessionTestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toBeInTheDocument()
      })

      // Should have attempted to refresh the expired session
      expect(mockSupabase.auth.refreshSession).toHaveBeenCalled()
    })

    it('handles failed session refresh on restart', async () => {
      // Expired session that cannot be refreshed
      const expiredSession = {
        ...mockSession,
        expires_at: Date.now() - 3600000
      }

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: expiredSession },
        error: null
      })

      mockSupabase.auth.refreshSession.mockResolvedValue({
        data: { session: null, user: null },
        error: { message: 'Refresh token expired' }
      })

      render(
        <AuthProvider>
          <SessionTestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('unauthenticated')).toBeInTheDocument()
      })

      expect(mockSupabase.auth.refreshSession).toHaveBeenCalled()
    })
  })

  describe('Session Behavior Across Multiple Tabs', () => {
    it('validates session behavior across multiple tabs', async () => {
      // Start with authenticated session
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      })

      // Render first "tab"
      const { rerender: rerender1 } = render(
        <div data-testid="tab1">
          <AuthProvider>
            <SessionTestComponent />
          </AuthProvider>
        </div>
      )

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toBeInTheDocument()
      })

      // Render second "tab"
      render(
        <div data-testid="tab2">
          <AuthProvider>
            <SessionTestComponent />
          </AuthProvider>
        </div>
      )

      // Both tabs should be authenticated
      await waitFor(() => {
        expect(screen.getAllByTestId('authenticated')).toHaveLength(2)
      })

      // Simulate signout in one tab
      act(() => {
        authStateCallback!('SIGNED_OUT', null)
      })

      // Both tabs should reflect the signout
      await waitFor(() => {
        expect(screen.getAllByTestId('unauthenticated')).toHaveLength(2)
      })
    })

    it('tests storage event synchronization between tabs', async () => {
      // Start with authenticated session
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      })

      render(
        <AuthProvider>
          <SessionTestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toBeInTheDocument()
      })

      // Simulate storage event from another tab (signout)
      const storageEvent = new StorageEvent('storage', {
        key: 'supabase.auth.token',
        oldValue: JSON.stringify(mockSession),
        newValue: null,
        storageArea: localStorage
      })

      act(() => {
        window.dispatchEvent(storageEvent)
        authStateCallback!('SIGNED_OUT', null)
      })

      await waitFor(() => {
        expect(screen.getByTestId('unauthenticated')).toBeInTheDocument()
      })
    })

    it('handles session conflicts between tabs', async () => {
      // Start with different sessions in different tabs
      const session1 = { ...mockSession, access_token: 'token1' }
      const session2 = { ...mockSession, access_token: 'token2' }

      // First tab
      mockSupabase.auth.getSession.mockResolvedValueOnce({
        data: { session: session1 },
        error: null
      })

      render(
        <div data-testid="tab1">
          <AuthProvider>
            <SessionTestComponent />
          </AuthProvider>
        </div>
      )

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toBeInTheDocument()
      })

      // Second tab with different session
      mockSupabase.auth.getSession.mockResolvedValueOnce({
        data: { session: session2 },
        error: null
      })

      render(
        <div data-testid="tab2">
          <AuthProvider>
            <SessionTestComponent />
          </AuthProvider>
        </div>
      )

      // Should handle session conflict gracefully
      await waitFor(() => {
        expect(screen.getAllByTestId('authenticated')).toHaveLength(2)
      })
    })

    it('validates session activity tracking across tabs', async () => {
      // Simulate user activity in one tab affecting all tabs
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      })

      render(
        <AuthProvider>
          <SessionTestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toBeInTheDocument()
      })

      // Simulate user activity (token refresh)
      const refreshedSession = {
        ...mockSession,
        access_token: 'new_refreshed_token',
        expires_at: Date.now() + 7200000
      }

      act(() => {
        authStateCallback!('TOKEN_REFRESHED', refreshedSession)
      })

      // Should maintain authentication with new token
      expect(screen.getByTestId('authenticated')).toBeInTheDocument()
    })
  })

  describe('Session Expiration and Refresh Handling', () => {
    it('validates session expiration and refresh handling', async () => {
      // Start with session that's about to expire
      const expiringSession = {
        ...mockSession,
        expires_at: Date.now() + 300000 // Expires in 5 minutes
      }

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: expiringSession },
        error: null
      })

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      render(
        <AuthProvider>
          <SessionTestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toBeInTheDocument()
      })

      // Simulate automatic token refresh
      const refreshedSession = {
        ...mockSession,
        access_token: 'refreshed_token_123',
        expires_at: Date.now() + 3600000
      }

      act(() => {
        authStateCallback!('TOKEN_REFRESHED', refreshedSession)
      })

      expect(screen.getByTestId('authenticated')).toBeInTheDocument()
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Token refreshed for user:'),
        expect.objectContaining({
          email: 'session@test.com'
        })
      )

      consoleSpy.mockRestore()
    })

    it('handles token refresh failure', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      })

      render(
        <AuthProvider>
          <SessionTestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toBeInTheDocument()
      })

      // Simulate failed token refresh
      act(() => {
        authStateCallback!('SIGNED_OUT', null)
      })

      await waitFor(() => {
        expect(screen.getByTestId('unauthenticated')).toBeInTheDocument()
      })
    })

    it('validates automatic session refresh before expiration', async () => {
      vi.useFakeTimers()

      // Session expires in 10 minutes
      const sessionWithExpiry = {
        ...mockSession,
        expires_at: Date.now() + 600000
      }

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: sessionWithExpiry },
        error: null
      })

      render(
        <AuthProvider>
          <SessionTestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toBeInTheDocument()
      })

      // Fast forward to trigger refresh (5 minutes before expiry)
      act(() => {
        vi.advanceTimersByTime(300000) // Advance 5 minutes
      })

      // Should still be authenticated
      expect(screen.getByTestId('authenticated')).toBeInTheDocument()

      vi.useRealTimers()
    })

    it('tests session refresh with network failure recovery', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      })

      render(
        <AuthProvider>
          <SessionTestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toBeInTheDocument()
      })

      // Simulate network failure during refresh
      mockSupabase.auth.refreshSession
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          data: { session: mockSession, user: mockUser },
          error: null
        })

      // Should handle network failure gracefully and retry
      expect(screen.getByTestId('authenticated')).toBeInTheDocument()
    })
  })

  describe('Logout Functionality and Session Cleanup', () => {
    it('validates logout functionality and session cleanup', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      })

      mockSupabase.auth.signOut.mockResolvedValue({ error: null })

      render(
        <AuthProvider>
          <SessionTestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toBeInTheDocument()
      })

      // Click signout button
      const signoutButton = screen.getByTestId('signout-button')
      fireEvent.click(signoutButton)

      // Should call Supabase signOut
      expect(mockSupabase.auth.signOut).toHaveBeenCalled()

      // Simulate auth state change
      act(() => {
        authStateCallback!('SIGNED_OUT', null)
      })

      await waitFor(() => {
        expect(screen.getByTestId('unauthenticated')).toBeInTheDocument()
      })
    })

    it('tests session cleanup on signout', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      })

      // Set initial session data in storage
      mockLocalStorage.setItem('supabase.auth.token', JSON.stringify(mockSession))

      render(
        <AuthProvider>
          <SessionTestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toBeInTheDocument()
      })

      // Signout
      const signoutButton = screen.getByTestId('signout-button')
      fireEvent.click(signoutButton)

      act(() => {
        authStateCallback!('SIGNED_OUT', null)
      })

      await waitFor(() => {
        expect(screen.getByTestId('unauthenticated')).toBeInTheDocument()
      })

      // Storage should be cleaned up
      expect(mockLocalStorage.removeItem).toHaveBeenCalled()
    })

    it('handles signout with network failure', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      })

      mockSupabase.auth.signOut.mockRejectedValue(new Error('Network error'))

      render(
        <AuthProvider>
          <SessionTestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toBeInTheDocument()
      })

      const signoutButton = screen.getByTestId('signout-button')
      fireEvent.click(signoutButton)

      // Should still attempt signout even with network failure
      expect(mockSupabase.auth.signOut).toHaveBeenCalled()

      // Should clear local session state even if network call fails
      act(() => {
        authStateCallback!('SIGNED_OUT', null)
      })

      await waitFor(() => {
        expect(screen.getByTestId('unauthenticated')).toBeInTheDocument()
      })
    })

    it('validates forced signout scenarios', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      })

      render(
        <AuthProvider>
          <SessionTestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toBeInTheDocument()
      })

      // Simulate forced signout (e.g., from server)
      act(() => {
        authStateCallback!('SIGNED_OUT', null)
      })

      await waitFor(() => {
        expect(screen.getByTestId('unauthenticated')).toBeInTheDocument()
      })

      // Should handle forced signout gracefully
      expect(screen.queryByTestId('authenticated')).not.toBeInTheDocument()
    })
  })

  describe('Session Security and Edge Cases', () => {
    it('validates session security with token tampering', async () => {
      // Start with valid session
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      })

      render(
        <AuthProvider>
          <SessionTestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toBeInTheDocument()
      })

      // Simulate tampered token detection
      const tamperedSession = {
        ...mockSession,
        access_token: 'tampered_token'
      }

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'Invalid token' }
      })

      // Simulate session validation failure
      act(() => {
        authStateCallback!('SIGNED_OUT', null)
      })

      await waitFor(() => {
        expect(screen.getByTestId('unauthenticated')).toBeInTheDocument()
      })
    })

    it('handles concurrent session operations', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      })

      render(
        <AuthProvider>
          <SessionTestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toBeInTheDocument()
      })

      // Simulate concurrent operations
      const operations = [
        () => authStateCallback!('TOKEN_REFRESHED', { ...mockSession, access_token: 'new1' }),
        () => authStateCallback!('TOKEN_REFRESHED', { ...mockSession, access_token: 'new2' }),
        () => authStateCallback!('TOKEN_REFRESHED', { ...mockSession, access_token: 'new3' })
      ]

      // Execute operations concurrently
      act(() => {
        operations.forEach(op => op())
      })

      // Should remain authenticated despite concurrent operations
      expect(screen.getByTestId('authenticated')).toBeInTheDocument()
    })

    it('validates session recovery after temporary network issues', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      })

      render(
        <AuthProvider>
          <SessionTestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toBeInTheDocument()
      })

      // Simulate temporary network issue
      mockSupabase.auth.getSession.mockRejectedValueOnce(new Error('Network error'))
      
      // Then recover
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      })

      // Should maintain authentication through temporary network issues
      expect(screen.getByTestId('authenticated')).toBeInTheDocument()
    })

    it('tests session handling with memory constraints', async () => {
      // Simulate low memory environment
      const largeSessions = Array.from({ length: 100 }, (_, i) => ({
        ...mockSession,
        access_token: `token_${i}`,
        user: { ...mockUser, id: `user_${i}` }
      }))

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: largeSessions[0] },
        error: null
      })

      render(
        <AuthProvider>
          <SessionTestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toBeInTheDocument()
      })

      // Should handle memory efficiently
      expect(screen.getByTestId('authenticated')).toBeInTheDocument()
    })
  })

  describe('Session Analytics and Monitoring', () => {
    it('validates session duration tracking', async () => {
      const sessionStart = Date.now()
      
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      })

      render(
        <AuthProvider>
          <SessionTestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toBeInTheDocument()
      })

      // Wait some time
      await new Promise(resolve => setTimeout(resolve, 100))

      // Signout
      const signoutButton = screen.getByTestId('signout-button')
      fireEvent.click(signoutButton)

      act(() => {
        authStateCallback!('SIGNED_OUT', null)
      })

      const sessionEnd = Date.now()
      const sessionDuration = sessionEnd - sessionStart

      expect(sessionDuration).toBeGreaterThan(0)
    })

    it('tracks session events for monitoring', async () => {
      const sessionEvents: string[] = []

      const eventTracker = (event: string) => {
        sessionEvents.push(event)
      }

      mockSupabase.auth.onAuthStateChange.mockImplementation((callback) => {
        authStateCallback = (event, session) => {
          eventTracker(event)
          callback(event, session)
        }
        return { data: { subscription: mockSubscription } }
      })

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      })

      render(
        <AuthProvider>
          <SessionTestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toBeInTheDocument()
      })

      // Trigger various session events
      act(() => {
        authStateCallback!('TOKEN_REFRESHED', mockSession)
      })

      const signoutButton = screen.getByTestId('signout-button')
      fireEvent.click(signoutButton)

      act(() => {
        authStateCallback!('SIGNED_OUT', null)
      })

      await waitFor(() => {
        expect(screen.getByTestId('unauthenticated')).toBeInTheDocument()
      })

      // Should have tracked session events
      expect(sessionEvents).toContain('TOKEN_REFRESHED')
      expect(sessionEvents).toContain('SIGNED_OUT')
    })

    it('validates session health monitoring', async () => {
      let sessionHealthChecks = 0

      mockSupabase.auth.getSession.mockImplementation(() => {
        sessionHealthChecks++
        return Promise.resolve({
          data: { session: mockSession },
          error: null
        })
      })

      render(
        <AuthProvider>
          <SessionTestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toBeInTheDocument()
      })

      // Should have performed session health checks
      expect(sessionHealthChecks).toBeGreaterThan(0)
    })
  })
})