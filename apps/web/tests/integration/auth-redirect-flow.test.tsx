import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import Dashboard from '../../app/dashboard/page'
import { useAuth } from '../../lib/auth/AuthContext'
import { supabase } from '../../lib/supabase/client'

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn()
}))

// Mock auth context
vi.mock('../../lib/auth/AuthContext', () => ({
  useAuth: vi.fn()
}))

// Mock Supabase
vi.mock('../../lib/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            // Return mock data by default
            then: vi.fn((callback) => callback({ data: [], error: null }))
          }))
        }))
      }))
    }))
  }
}))

// Mock UI components
vi.mock('../../app/components/ui/ErrorState', () => ({
  default: ({ error, onRetry }: any) => (
    <div data-testid="error-state">
      <p>{error}</p>
      <button onClick={onRetry}>Retry</button>
    </div>
  )
}))

vi.mock('../../app/components/ui/OfflineNotice', () => ({
  default: () => <div data-testid="offline-notice">Offline</div>
}))

vi.mock('../../app/components/ui/ErrorBoundary', () => ({
  default: ({ children }: any) => <div>{children}</div>
}))

describe('Authentication and Dashboard Integration', () => {
  const mockPush = vi.fn()
  const mockUseRouter = useRouter as any
  const mockUseAuth = useAuth as any
  const mockSupabase = supabase as any

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseRouter.mockReturnValue({
      push: mockPush
    })
  })

  describe('Dashboard Authentication Gating', () => {
    it('should redirect to login when user is not authenticated', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false
      })

      render(<Dashboard />)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login')
      })
    })

    it('should not redirect when auth is still loading', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: true
      })

      render(<Dashboard />)

      expect(mockPush).not.toHaveBeenCalled()
      expect(screen.getByText('Verifying authentication...')).toBeInTheDocument()
    })

    it('should load dashboard when user is authenticated', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'test-user', email: 'test@example.com' },
        loading: false
      })

      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: [], error: null }))
          }))
        }))
      })

      render(<Dashboard />)

      await waitFor(() => {
        expect(screen.getByText('Your Strategic Sessions')).toBeInTheDocument()
      })

      expect(mockPush).not.toHaveBeenCalledWith('/login')
    })
  })

  describe('Database Error Handling', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: { id: 'test-user', email: 'test@example.com' },
        loading: false
      })
    })

    it('should handle PGRST205 schema errors', async () => {
      const mockError = {
        code: 'PGRST205',
        message: 'column "dual_pane_state" does not exist',
        details: 'schema error'
      }

      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: null, error: mockError }))
          }))
        }))
      })

      render(<Dashboard />)

      await waitFor(() => {
        expect(screen.getByTestId('error-state')).toBeInTheDocument()
        expect(screen.getByText(/Database schema mismatch detected/)).toBeInTheDocument()
      })
    })

    it('should handle authentication errors', async () => {
      const mockError = {
        code: 'PGRST001',
        message: 'JWT expired'
      }

      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: null, error: mockError }))
          }))
        }))
      })

      render(<Dashboard />)

      await waitFor(() => {
        expect(screen.getByTestId('error-state')).toBeInTheDocument()
        expect(screen.getByText(/Authentication error/)).toBeInTheDocument()
      })
    })

    it('should handle network errors with retry', async () => {
      const mockError = new Error('Network error')

      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => Promise.reject(mockError))
          }))
        }))
      })

      render(<Dashboard />)

      await waitFor(() => {
        expect(screen.getByTestId('error-state')).toBeInTheDocument()
        expect(screen.getByText(/Network error/)).toBeInTheDocument()
      })
    })
  })

  describe('Retry Mechanism', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: { id: 'test-user', email: 'test@example.com' },
        loading: false
      })
    })

    it('should retry failed requests with exponential backoff', async () => {
      const mockError = {
        code: 'PGRST001',
        message: 'Connection timeout'
      }

      let callCount = 0
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => {
              callCount++
              if (callCount <= 2) {
                return Promise.resolve({ data: null, error: mockError })
              }
              return Promise.resolve({ data: [], error: null })
            })
          }))
        }))
      })

      render(<Dashboard />)

      // Wait for retries to complete
      await waitFor(() => {
        expect(callCount).toBeGreaterThan(1)
      }, { timeout: 5000 })

      // Should eventually succeed
      await waitFor(() => {
        expect(screen.getByText('Your Strategic Sessions')).toBeInTheDocument()
      }, { timeout: 10000 })
    })
  })

  describe('Workspace Loading', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: { id: 'test-user', email: 'test@example.com' },
        loading: false
      })
    })

    it('should load and display workspaces', async () => {
      const mockWorkspaces = [
        {
          id: '1',
          name: 'Test Workspace',
          description: 'Test Description',
          dual_pane_state: { left_width: 50 },
          created_at: '2025-01-01'
        }
      ]

      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: mockWorkspaces, error: null }))
          }))
        }))
      })

      render(<Dashboard />)

      await waitFor(() => {
        expect(screen.getByText('Test Workspace')).toBeInTheDocument()
      })
    })

    it('should handle empty workspace list', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: [], error: null }))
          }))
        }))
      })

      render(<Dashboard />)

      await waitFor(() => {
        expect(screen.getByText(/You haven't created any strategic sessions yet/)).toBeInTheDocument()
      })
    })
  })
})