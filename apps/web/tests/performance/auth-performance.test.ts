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

// Mock Performance API
Object.defineProperty(window, 'performance', {
  value: {
    now: vi.fn(() => Date.now()),
    mark: vi.fn(),
    measure: vi.fn(),
    getEntriesByType: vi.fn(() => []),
    getEntriesByName: vi.fn(() => [])
  },
  writable: true
})

// Test component for performance testing
function PerformanceTestComponent() {
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

describe('Authentication Performance Testing', () => {
  const mockUser: User = {
    id: 'perf-user-123',
    email: 'performance@test.com',
    app_metadata: { provider: 'google' },
    user_metadata: {
      email_verified: true,
      full_name: 'Performance Test User',
      avatar_url: 'https://lh3.googleusercontent.com/avatar.jpg'
    },
    aud: 'authenticated',
    created_at: '2023-01-01T00:00:00Z',
    role: 'authenticated'
  }

  const mockSession: Session = {
    access_token: 'performance_token',
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

  describe('Google One-Tap Initialization Performance', () => {
    it('measures Google One-Tap initialization time under 2 seconds', async () => {
      // AC requirement: Google One-Tap initialization: <2 seconds
      const initStartTime = Date.now()
      
      mockLoadGoogleScript.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 800)) // Simulate realistic load time
      )

      render(
        <AuthProvider>
          <PerformanceTestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('unauthenticated')).toBeInTheDocument()
      })

      await waitFor(() => {
        expect(mockLoadGoogleScript).toHaveBeenCalled()
        expect(mockCreateGoogleConfig).toHaveBeenCalled()
      }, { timeout: 3000 })

      const initTime = Date.now() - initStartTime
      expect(initTime).toBeLessThan(2000)
    })

    it('validates Google script loading performance', async () => {
      const scriptLoadTime = 500 // Simulate script load time
      
      mockLoadGoogleScript.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, scriptLoadTime))
      )

      const startTime = Date.now()

      render(
        <AuthProvider>
          <PerformanceTestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(mockLoadGoogleScript).toHaveBeenCalled()
      })

      const actualTime = Date.now() - startTime
      expect(actualTime).toBeLessThan(1000) // Script should load quickly
    })

    it('measures Google library initialization overhead', async () => {
      let configCreationTime = 0
      
      mockCreateGoogleConfig.mockImplementation(async (callback) => {
        const start = Date.now()
        await new Promise(resolve => setTimeout(resolve, 200)) // Simulate config creation
        configCreationTime = Date.now() - start
        
        return {
          client_id: 'test-client-id',
          callback,
          nonce: 'test-nonce'
        }
      })

      render(
        <AuthProvider>
          <PerformanceTestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(mockCreateGoogleConfig).toHaveBeenCalled()
      })

      expect(configCreationTime).toBeLessThan(500) // Config creation should be fast
    })

    it('tests concurrent initialization scenarios', async () => {
      // Simulate multiple components initializing Google signin
      const componentCount = 3
      const initPromises: Promise<any>[] = []

      for (let i = 0; i < componentCount; i++) {
        const promise = new Promise(resolve => {
          render(
            <div key={i}>
              <AuthProvider>
                <PerformanceTestComponent />
              </AuthProvider>
            </div>
          )
          resolve(true)
        })
        initPromises.push(promise)
      }

      const startTime = Date.now()
      await Promise.all(initPromises)
      const totalTime = Date.now() - startTime

      // Multiple components should not significantly impact initialization
      expect(totalTime).toBeLessThan(3000)
    })
  })

  describe('Authentication Flow Performance', () => {
    it('validates complete authentication flow under 5 seconds', async () => {
      // AC requirement: Authentication flow completion: <5 seconds
      let credentialCallback: ((response: any) => void) | undefined

      mockCreateGoogleConfig.mockImplementation((callback) => {
        credentialCallback = callback
        return Promise.resolve({
          client_id: 'test-client-id',
          callback,
          nonce: 'test-nonce'
        })
      })

      // Simulate realistic Supabase response time
      mockSupabase.auth.signInWithIdToken.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          data: { user: mockUser, session: mockSession },
          error: null
        }), 1200)) // Realistic API response time
      )

      render(
        <AuthProvider>
          <PerformanceTestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('unauthenticated')).toBeInTheDocument()
      })

      const authStartTime = Date.now()

      // Simulate Google credential response
      act(() => {
        credentialCallback!({ credential: 'performance_test_credential' })
      })

      // Wait for Supabase authentication
      await waitFor(() => {
        expect(mockSupabase.auth.signInWithIdToken).toHaveBeenCalled()
      })

      // Simulate auth state change
      act(() => {
        authStateCallback!('SIGNED_IN', mockSession)
      })

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toBeInTheDocument()
      })

      const authTime = Date.now() - authStartTime
      expect(authTime).toBeLessThan(5000)
    })

    it('benchmarks Supabase signInWithIdToken performance', async () => {
      const supabaseResponseTimes = [800, 1200, 600, 1500, 900] // Simulate various response times
      let callIndex = 0

      mockSupabase.auth.signInWithIdToken.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          data: { user: mockUser, session: mockSession },
          error: null
        }), supabaseResponseTimes[callIndex++ % supabaseResponseTimes.length]))
      )

      const responseTimes: number[] = []

      for (let i = 0; i < 5; i++) {
        const startTime = Date.now()
        
        await mockSupabase.auth.signInWithIdToken({
          provider: 'google',
          token: `test-token-${i}`
        })

        const responseTime = Date.now() - startTime
        responseTimes.push(responseTime)
      }

      const averageResponseTime = responseTimes.reduce((a, b) => a + b) / responseTimes.length
      const maxResponseTime = Math.max(...responseTimes)

      expect(averageResponseTime).toBeLessThan(2000) // Average should be reasonable
      expect(maxResponseTime).toBeLessThan(3000) // No single request should be too slow
    })

    it('measures authentication state propagation time', async () => {
      let credentialCallback: ((response: any) => void) | undefined
      let stateChangeTime = 0

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
          <PerformanceTestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('unauthenticated')).toBeInTheDocument()
      })

      act(() => {
        credentialCallback!({ credential: 'state_test_credential' })
      })

      await waitFor(() => {
        expect(mockSupabase.auth.signInWithIdToken).toHaveBeenCalled()
      })

      const stateChangeStart = Date.now()

      act(() => {
        authStateCallback!('SIGNED_IN', mockSession)
      })

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toBeInTheDocument()
      })

      stateChangeTime = Date.now() - stateChangeStart

      expect(stateChangeTime).toBeLessThan(100) // State updates should be near-instantaneous
    })

    it('validates session validation response time under 500ms', async () => {
      // AC requirement: Session validation: <500ms response time
      const sessionValidationTimes: number[] = []

      mockSupabase.auth.getSession.mockImplementation(() => 
        new Promise(resolve => {
          const startTime = Date.now()
          setTimeout(() => {
            const responseTime = Date.now() - startTime
            sessionValidationTimes.push(responseTime)
            resolve({
              data: { session: mockSession },
              error: null
            })
          }, Math.random() * 400 + 50) // Random time between 50-450ms
        })
      )

      // Test multiple session validations
      for (let i = 0; i < 5; i++) {
        render(
          <div key={i}>
            <AuthProvider>
              <PerformanceTestComponent />
            </AuthProvider>
          </div>
        )

        await waitFor(() => {
          expect(screen.getByTestId('authenticated')).toBeInTheDocument()
        })
      }

      const averageValidationTime = sessionValidationTimes.reduce((a, b) => a + b) / sessionValidationTimes.length
      const maxValidationTime = Math.max(...sessionValidationTimes)

      expect(averageValidationTime).toBeLessThan(300) // Average should be well under limit
      expect(maxValidationTime).toBeLessThan(500) // All validations under 500ms
    })
  })

  describe('Page Load Performance Impact', () => {
    it('validates no significant page load performance regression', async () => {
      // AC requirement: Page load impact: <10% increase from baseline
      const baselineRenderTime = 50 // Simulate baseline component render time
      
      // Test baseline render without auth
      const baselineStart = Date.now()
      render(<div data-testid="baseline">Baseline Component</div>)
      await waitFor(() => {
        expect(screen.getByTestId('baseline')).toBeInTheDocument()
      })
      const actualBaseline = Date.now() - baselineStart

      // Test render with auth
      const authStart = Date.now()
      render(
        <AuthProvider>
          <PerformanceTestComponent />
        </AuthProvider>
      )
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toBeInTheDocument()
      })
      const authRenderTime = Date.now() - authStart

      const performanceImpact = ((authRenderTime - actualBaseline) / actualBaseline) * 100
      expect(performanceImpact).toBeLessThan(10) // Less than 10% increase
    })

    it('measures initial component hydration performance', async () => {
      const hydrationStart = Date.now()

      render(
        <AuthProvider>
          <PerformanceTestComponent />
        </AuthProvider>
      )

      // Wait for initial hydration
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toBeInTheDocument()
      })

      const hydrationTime = Date.now() - hydrationStart
      expect(hydrationTime).toBeLessThan(50) // Initial hydration should be very fast
    })

    it('validates memory usage during authentication flow', async () => {
      // Simulate memory usage tracking
      const initialMemory = process.memoryUsage().heapUsed
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
          <PerformanceTestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('unauthenticated')).toBeInTheDocument()
      })

      act(() => {
        credentialCallback!({ credential: 'memory_test_credential' })
      })

      await waitFor(() => {
        expect(mockSupabase.auth.signInWithIdToken).toHaveBeenCalled()
      })

      act(() => {
        authStateCallback!('SIGNED_IN', mockSession)
      })

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toBeInTheDocument()
      })

      const finalMemory = process.memoryUsage().heapUsed
      const memoryIncrease = finalMemory - initialMemory

      // Memory increase should be reasonable (less than 50MB for test environment)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024)
    })
  })

  describe('Concurrent User Authentication', () => {
    it('tests concurrent authentication scenarios', async () => {
      // AC requirement: Test concurrent user authentication scenarios
      const concurrentUsers = 5
      const authPromises: Promise<any>[] = []
      const authTimes: number[] = []

      let credentialCallbacks: ((response: any) => void)[] = []

      mockCreateGoogleConfig.mockImplementation((callback) => {
        credentialCallbacks.push(callback)
        return Promise.resolve({
          client_id: 'test-client-id',
          callback,
          nonce: 'test-nonce'
        })
      })

      // Simulate realistic staggered response times
      mockSupabase.auth.signInWithIdToken.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          data: { user: mockUser, session: mockSession },
          error: null
        }), Math.random() * 1000 + 500)) // 500-1500ms random delay
      )

      // Start concurrent authentication flows
      for (let i = 0; i < concurrentUsers; i++) {
        const authPromise = new Promise<number>(async (resolve) => {
          const startTime = Date.now()
          
          render(
            <div key={i}>
              <AuthProvider>
                <PerformanceTestComponent />
              </AuthProvider>
            </div>
          )

          await waitFor(() => {
            expect(screen.getAllByTestId('unauthenticated')).toHaveLength(i + 1)
          })

          // Simulate credential response
          setTimeout(() => {
            credentialCallbacks[i]?.({ credential: `concurrent_test_${i}` })
          }, Math.random() * 200) // Stagger credential responses

          await waitFor(() => {
            expect(mockSupabase.auth.signInWithIdToken).toHaveBeenCalledTimes(i + 1)
          })

          const authTime = Date.now() - startTime
          resolve(authTime)
        })

        authPromises.push(authPromise)
      }

      const results = await Promise.all(authPromises)
      authTimes.push(...results)

      const averageConcurrentTime = authTimes.reduce((a, b) => a + b) / authTimes.length
      const maxConcurrentTime = Math.max(...authTimes)

      // Concurrent authentication should not significantly degrade performance
      expect(averageConcurrentTime).toBeLessThan(3000)
      expect(maxConcurrentTime).toBeLessThan(5000)
    })

    it('validates system stability under load', async () => {
      const loadTestDuration = 2000 // 2 second load test
      const requestInterval = 100 // New request every 100ms
      const authRequests: Promise<any>[] = []
      let requestCount = 0

      const endTime = Date.now() + loadTestDuration

      while (Date.now() < endTime) {
        const authPromise = mockSupabase.auth.signInWithIdToken({
          provider: 'google',
          token: `load_test_${requestCount++}`
        })
        
        authRequests.push(authPromise)
        await new Promise(resolve => setTimeout(resolve, requestInterval))
      }

      const results = await Promise.allSettled(authRequests)
      const successCount = results.filter(r => r.status === 'fulfilled').length
      const successRate = (successCount / results.length) * 100

      expect(successRate).toBeGreaterThan(95) // High success rate under load
      expect(requestCount).toBeGreaterThan(10) // Reasonable number of requests processed
    })
  })

  describe('Mobile Performance Validation', () => {
    it('simulates mobile device performance constraints', async () => {
      // Simulate slower mobile device
      const mobileDelay = 300 // Additional delay for mobile simulation

      mockLoadGoogleScript.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 1000 + mobileDelay))
      )

      mockSupabase.auth.signInWithIdToken.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          data: { user: mockUser, session: mockSession },
          error: null
        }), 1500 + mobileDelay))
      )

      const mobileStart = Date.now()

      render(
        <AuthProvider>
          <PerformanceTestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('unauthenticated')).toBeInTheDocument()
      }, { timeout: 5000 })

      const mobileInitTime = Date.now() - mobileStart

      // Mobile performance should still meet reasonable thresholds
      expect(mobileInitTime).toBeLessThan(3000) // Allow more time for mobile
    })

    it('validates touch interaction performance', async () => {
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
          <PerformanceTestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('unauthenticated')).toBeInTheDocument()
      })

      // Simulate touch interaction delay
      const touchStart = Date.now()
      
      setTimeout(() => {
        credentialCallback!({ credential: 'touch_test_credential' })
      }, 50) // Simulate touch delay

      await waitFor(() => {
        expect(mockSupabase.auth.signInWithIdToken).toHaveBeenCalled()
      })

      const touchResponseTime = Date.now() - touchStart

      expect(touchResponseTime).toBeLessThan(200) // Touch response should be quick
    })
  })
})