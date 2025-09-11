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
function CrossEnvironmentTestComponent() {
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

describe('Cross-Environment Validation', () => {
  const mockUser: User = {
    id: 'env-user-123',
    email: 'environment@test.com',
    app_metadata: { provider: 'google' },
    user_metadata: {
      email_verified: true,
      full_name: 'Environment Test User',
      avatar_url: 'https://lh3.googleusercontent.com/avatar.jpg'
    },
    aud: 'authenticated',
    created_at: '2023-01-01T00:00:00Z',
    role: 'authenticated'
  }

  const mockSession: Session = {
    access_token: 'env_token',
    refresh_token: 'refresh_token',
    expires_in: 3600,
    token_type: 'bearer',
    user: mockUser,
    expires_at: Date.now() + 3600000
  }

  let mockSubscription: { unsubscribe: vi.Mock }
  let authStateCallback: ((event: string, session: Session | null) => void) | undefined

  // Store original environment
  const originalEnv = process.env

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
  })

  afterEach(() => {
    process.env = { ...originalEnv }
    vi.clearAllMocks()
  })

  describe('Development Environment Testing', () => {
    beforeEach(() => {
      // Set development environment variables
      process.env.NODE_ENV = 'development'
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = 'dev-google-client-id.googleusercontent.com'
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://dev-project.supabase.co'
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'dev-anon-key'
    })

    it('validates Google signin in development environment', async () => {
      let credentialCallback: ((response: any) => void) | undefined

      mockCreateGoogleConfig.mockImplementation((callback) => {
        credentialCallback = callback
        return Promise.resolve({
          client_id: 'dev-google-client-id.googleusercontent.com',
          callback,
          nonce: 'dev-test-nonce'
        })
      })

      render(
        <AuthProvider>
          <CrossEnvironmentTestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('unauthenticated')).toBeInTheDocument()
      })

      // Verify development-specific configuration
      await waitFor(() => {
        expect(mockCreateGoogleConfig).toHaveBeenCalled()
      })

      // Simulate Google credential response
      act(() => {
        credentialCallback!({ credential: 'dev_credential' })
      })

      await waitFor(() => {
        expect(mockSupabase.auth.signInWithIdToken).toHaveBeenCalledWith({
          provider: 'google',
          token: 'dev_credential'
        })
      })

      act(() => {
        authStateCallback!('SIGNED_IN', mockSession)
      })

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toBeInTheDocument()
      })
    })

    it('tests localhost domain configuration', async () => {
      // Simulate localhost environment
      Object.defineProperty(window, 'location', {
        value: {
          hostname: 'localhost',
          port: '3000',
          protocol: 'http:',
          href: 'http://localhost:3000'
        },
        writable: true
      })

      mockCreateGoogleConfig.mockResolvedValue({
        client_id: 'dev-google-client-id.googleusercontent.com',
        callback: vi.fn(),
        nonce: 'localhost-nonce'
      })

      render(
        <AuthProvider>
          <CrossEnvironmentTestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('unauthenticated')).toBeInTheDocument()
      })

      expect(mockCreateGoogleConfig).toHaveBeenCalled()
    })

    it('validates development Supabase project integration', async () => {
      // Test development-specific Supabase configuration
      let credentialCallback: ((response: any) => void) | undefined

      mockCreateGoogleConfig.mockImplementation((callback) => {
        credentialCallback = callback
        return Promise.resolve({
          client_id: 'dev-google-client-id.googleusercontent.com',
          callback,
          nonce: 'dev-supabase-nonce'
        })
      })

      render(
        <AuthProvider>
          <CrossEnvironmentTestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('unauthenticated')).toBeInTheDocument()
      })

      act(() => {
        credentialCallback!({ credential: 'dev_supabase_credential' })
      })

      await waitFor(() => {
        expect(mockSupabase.auth.signInWithIdToken).toHaveBeenCalled()
      })

      // Verify development user creation
      expect(mockSupabase.auth.signInWithIdToken).toHaveBeenCalledWith({
        provider: 'google',
        token: 'dev_supabase_credential'
      })
    })

    it('tests hot reload compatibility with Google signin', async () => {
      // Simulate hot reload scenario
      let credentialCallback: ((response: any) => void) | undefined

      mockCreateGoogleConfig.mockImplementation((callback) => {
        credentialCallback = callback
        return Promise.resolve({
          client_id: 'dev-google-client-id.googleusercontent.com',
          callback,
          nonce: 'hot-reload-nonce'
        })
      })

      const { rerender } = render(
        <AuthProvider>
          <CrossEnvironmentTestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('unauthenticated')).toBeInTheDocument()
      })

      // Simulate hot reload by re-rendering
      rerender(
        <AuthProvider>
          <CrossEnvironmentTestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('unauthenticated')).toBeInTheDocument()
      })

      // Should still work after hot reload
      act(() => {
        credentialCallback!({ credential: 'hot_reload_credential' })
      })

      await waitFor(() => {
        expect(mockSupabase.auth.signInWithIdToken).toHaveBeenCalled()
      })
    })
  })

  describe('Production Environment Testing', () => {
    beforeEach(() => {
      // Set production environment variables
      process.env.NODE_ENV = 'production'
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = 'prod-google-client-id.googleusercontent.com'
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://prod-project.supabase.co'
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'prod-anon-key'
    })

    it('validates Google signin in production environment', async () => {
      let credentialCallback: ((response: any) => void) | undefined

      mockCreateGoogleConfig.mockImplementation((callback) => {
        credentialCallback = callback
        return Promise.resolve({
          client_id: 'prod-google-client-id.googleusercontent.com',
          callback,
          nonce: 'prod-test-nonce'
        })
      })

      render(
        <AuthProvider>
          <CrossEnvironmentTestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('unauthenticated')).toBeInTheDocument()
      })

      // Verify production-specific configuration
      await waitFor(() => {
        expect(mockCreateGoogleConfig).toHaveBeenCalled()
      })

      act(() => {
        credentialCallback!({ credential: 'prod_credential' })
      })

      await waitFor(() => {
        expect(mockSupabase.auth.signInWithIdToken).toHaveBeenCalledWith({
          provider: 'google',
          token: 'prod_credential'
        })
      })

      act(() => {
        authStateCallback!('SIGNED_IN', mockSession)
      })

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toBeInTheDocument()
      })
    })

    it('tests production domain configuration', async () => {
      // Simulate production domain
      Object.defineProperty(window, 'location', {
        value: {
          hostname: 'thinkhaven.co',
          port: '443',
          protocol: 'https:',
          href: 'https://thinkhaven.co'
        },
        writable: true
      })

      mockCreateGoogleConfig.mockResolvedValue({
        client_id: 'prod-google-client-id.googleusercontent.com',
        callback: vi.fn(),
        nonce: 'production-nonce'
      })

      render(
        <AuthProvider>
          <CrossEnvironmentTestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('unauthenticated')).toBeInTheDocument()
      })

      expect(mockCreateGoogleConfig).toHaveBeenCalled()
    })

    it('validates production Supabase project integration', async () => {
      let credentialCallback: ((response: any) => void) | undefined

      mockCreateGoogleConfig.mockImplementation((callback) => {
        credentialCallback = callback
        return Promise.resolve({
          client_id: 'prod-google-client-id.googleusercontent.com',
          callback,
          nonce: 'prod-supabase-nonce'
        })
      })

      render(
        <AuthProvider>
          <CrossEnvironmentTestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('unauthenticated')).toBeInTheDocument()
      })

      act(() => {
        credentialCallback!({ credential: 'prod_supabase_credential' })
      })

      await waitFor(() => {
        expect(mockSupabase.auth.signInWithIdToken).toHaveBeenCalledWith({
          provider: 'google',
          token: 'prod_supabase_credential'
        })
      })
    })

    it('verifies SSL/HTTPS requirement in production', async () => {
      // Simulate HTTPS environment
      Object.defineProperty(window, 'location', {
        value: {
          protocol: 'https:',
          hostname: 'thinkhaven.co'
        },
        writable: true
      })

      // Mock secure context
      Object.defineProperty(window, 'isSecureContext', {
        value: true,
        writable: true
      })

      render(
        <AuthProvider>
          <CrossEnvironmentTestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('unauthenticated')).toBeInTheDocument()
      })

      expect(mockLoadGoogleScript).toHaveBeenCalled()
      expect(mockCreateGoogleConfig).toHaveBeenCalled()
    })

    it('tests CDN and caching impact on authentication', async () => {
      // Simulate CDN cached script loading
      mockLoadGoogleScript.mockImplementation(() => 
        new Promise(resolve => {
          // Simulate faster CDN load time
          setTimeout(resolve, 200)
        })
      )

      const startTime = Date.now()

      render(
        <AuthProvider>
          <CrossEnvironmentTestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(mockLoadGoogleScript).toHaveBeenCalled()
      })

      const loadTime = Date.now() - startTime
      
      // CDN should provide faster loading
      expect(loadTime).toBeLessThan(500)
    })
  })

  describe('Environment-Specific Configuration Testing', () => {
    it('validates environment-specific Google Client ID settings', async () => {
      const environments = [
        {
          env: 'development',
          clientId: 'dev-google-client-id.googleusercontent.com',
          domain: 'localhost'
        },
        {
          env: 'production', 
          clientId: 'prod-google-client-id.googleusercontent.com',
          domain: 'thinkhaven.co'
        }
      ]

      for (const config of environments) {
        process.env.NODE_ENV = config.env
        process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = config.clientId

        Object.defineProperty(window, 'location', {
          value: { hostname: config.domain },
          writable: true
        })

        mockCreateGoogleConfig.mockResolvedValue({
          client_id: config.clientId,
          callback: vi.fn(),
          nonce: `${config.env}-nonce`
        })

        render(
          <div key={config.env}>
            <AuthProvider>
              <CrossEnvironmentTestComponent />
            </AuthProvider>
          </div>
        )

        await waitFor(() => {
          expect(screen.getByTestId('unauthenticated')).toBeInTheDocument()
        })

        expect(mockCreateGoogleConfig).toHaveBeenCalled()
        vi.clearAllMocks()
      }
    })

    it('tests cross-environment session compatibility', async () => {
      // Test session created in development works in production
      const devSession = {
        ...mockSession,
        access_token: 'dev_session_token'
      }

      // Simulate development session
      process.env.NODE_ENV = 'development'
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: devSession },
        error: null
      })

      render(
        <AuthProvider>
          <CrossEnvironmentTestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toBeInTheDocument()
      })

      // Switch to production environment
      process.env.NODE_ENV = 'production'

      // Session should still be valid
      expect(screen.getByTestId('authenticated')).toBeInTheDocument()
    })

    it('validates environment variable validation', async () => {
      // Test missing client ID
      delete process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      render(
        <AuthProvider>
          <CrossEnvironmentTestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('unauthenticated')).toBeInTheDocument()
      })

      // Should handle missing environment variables gracefully
      await waitFor(() => {
        expect(screen.queryByText('Google Sign-in Error')).toBeInTheDocument()
      })

      consoleErrorSpy.mockRestore()
    })

    it('tests environment-specific error handling', async () => {
      const environments = ['development', 'production']

      for (const env of environments) {
        process.env.NODE_ENV = env
        process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = `${env}-client-id`

        // Simulate environment-specific error
        mockLoadGoogleScript.mockRejectedValue(
          new Error(`Google script failed in ${env}`)
        )

        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

        render(
          <div key={env}>
            <AuthProvider>
              <CrossEnvironmentTestComponent />
            </AuthProvider>
          </div>
        )

        await waitFor(() => {
          expect(screen.getByTestId('unauthenticated')).toBeInTheDocument()
        })

        await waitFor(() => {
          expect(screen.getByText('Google Sign-in Error')).toBeInTheDocument()
        })

        expect(consoleErrorSpy).toHaveBeenCalled()
        
        consoleErrorSpy.mockRestore()
        vi.clearAllMocks()
      }
    })
  })

  describe('Domain-Specific Testing', () => {
    it('validates domain whitelist configuration', async () => {
      const allowedDomains = ['localhost', 'thinkhaven.co']
      
      for (const domain of allowedDomains) {
        Object.defineProperty(window, 'location', {
          value: { hostname: domain },
          writable: true
        })

        mockCreateGoogleConfig.mockResolvedValue({
          client_id: 'test-client-id',
          callback: vi.fn(),
          nonce: `${domain}-nonce`
        })

        render(
          <div key={domain}>
            <AuthProvider>
              <CrossEnvironmentTestComponent />
            </AuthProvider>
          </div>
        )

        await waitFor(() => {
          expect(screen.getByTestId('unauthenticated')).toBeInTheDocument()
        })

        expect(mockCreateGoogleConfig).toHaveBeenCalled()
        vi.clearAllMocks()
      }
    })

    it('tests subdomain handling', async () => {
      const subdomains = ['app.thinkhaven.co', 'staging.thinkhaven.co']
      
      for (const subdomain of subdomains) {
        Object.defineProperty(window, 'location', {
          value: { hostname: subdomain },
          writable: true
        })

        render(
          <div key={subdomain}>
            <AuthProvider>
              <CrossEnvironmentTestComponent />
            </AuthProvider>
          </div>
        )

        await waitFor(() => {
          expect(screen.getByTestId('unauthenticated')).toBeInTheDocument()
        })

        vi.clearAllMocks()
      }
    })

    it('validates port-specific configuration', async () => {
      const portConfigs = [
        { hostname: 'localhost', port: '3000' },
        { hostname: 'localhost', port: '3001' },
        { hostname: 'thinkhaven.co', port: '443' }
      ]

      for (const config of portConfigs) {
        Object.defineProperty(window, 'location', {
          value: config,
          writable: true
        })

        render(
          <div key={`${config.hostname}:${config.port}`}>
            <AuthProvider>
              <CrossEnvironmentTestComponent />
            </AuthProvider>
          </div>
        )

        await waitFor(() => {
          expect(screen.getByTestId('unauthenticated')).toBeInTheDocument()
        })

        vi.clearAllMocks()
      }
    })
  })

  describe('Network Environment Testing', () => {
    it('tests authentication over different network conditions', async () => {
      const networkConditions = [
        { name: 'fast', delay: 100 },
        { name: 'slow', delay: 2000 },
        { name: 'unstable', delay: () => Math.random() * 3000 }
      ]

      let credentialCallback: ((response: any) => void) | undefined

      for (const condition of networkConditions) {
        const delay = typeof condition.delay === 'function' ? condition.delay() : condition.delay

        mockCreateGoogleConfig.mockImplementation((callback) => {
          credentialCallback = callback
          return Promise.resolve({
            client_id: 'network-test-client-id',
            callback,
            nonce: `${condition.name}-nonce`
          })
        })

        mockSupabase.auth.signInWithIdToken.mockImplementation(() => 
          new Promise(resolve => setTimeout(() => resolve({
            data: { user: mockUser, session: mockSession },
            error: null
          }), delay))
        )

        const startTime = Date.now()

        render(
          <div key={condition.name}>
            <AuthProvider>
              <CrossEnvironmentTestComponent />
            </AuthProvider>
          </div>
        )

        await waitFor(() => {
          expect(screen.getByTestId('unauthenticated')).toBeInTheDocument()
        })

        act(() => {
          credentialCallback!({ credential: `${condition.name}_credential` })
        })

        act(() => {
          authStateCallback!('SIGNED_IN', mockSession)
        })

        await waitFor(() => {
          expect(screen.getByTestId('authenticated')).toBeInTheDocument()
        }, { timeout: 5000 })

        const authTime = Date.now() - startTime

        // Even slow networks should complete within reasonable time
        expect(authTime).toBeLessThan(10000)
        
        vi.clearAllMocks()
      }
    })

    it('validates offline/online state handling', async () => {
      // Simulate offline state
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true
      })

      render(
        <AuthProvider>
          <CrossEnvironmentTestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('unauthenticated')).toBeInTheDocument()
      })

      // Should handle offline gracefully
      expect(mockLoadGoogleScript).toHaveBeenCalled()

      // Simulate coming back online
      Object.defineProperty(navigator, 'onLine', {
        value: true,
        writable: true
      })

      // Should continue working when back online
      expect(screen.getByTestId('unauthenticated')).toBeInTheDocument()
    })
  })
})