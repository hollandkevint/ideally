import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import Home from '../../app/page'
import { useAuth } from '../../lib/auth/AuthContext'

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn()
}))

// Mock auth context
vi.mock('../../lib/auth/AuthContext', () => ({
  useAuth: vi.fn()
}))

// Mock UI components to avoid rendering issues
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  )
}))

vi.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardHeader: ({ children, ...props }: any) => <div {...props}>{children}</div>
}))

vi.mock('@/components/ui/input', () => ({
  Input: (props: any) => <input {...props} />
}))

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, ...props }: any) => <span {...props}>{children}</span>
}))

// Mock Google One Tap component
vi.mock('../../app/components/auth/GoogleOneTapSignin', () => ({
  default: ({ onSuccess }: { onSuccess: () => void }) => (
    <button onClick={onSuccess} data-testid="google-signin">
      Sign in with Google
    </button>
  )
}))

describe('Landing Page Redirect Logic', () => {
  const mockPush = vi.fn()
  const mockUseRouter = useRouter as any
  const mockUseAuth = useAuth as any

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseRouter.mockReturnValue({
      push: mockPush
    })
  })

  describe('Authenticated User Redirect', () => {
    it('should redirect authenticated user to dashboard when auth is loaded', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'test-user', email: 'test@example.com' },
        loading: false
      })

      render(<Home />)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard')
      }, { timeout: 1000 })
    })

    it('should not redirect when auth is still loading', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'test-user', email: 'test@example.com' },
        loading: true
      })

      render(<Home />)

      expect(mockPush).not.toHaveBeenCalled()
    })

    it('should not redirect when user exists but auth is loading', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'test-user', email: 'test@example.com' },
        loading: true
      })

      render(<Home />)

      // Wait a bit to ensure no delayed redirect
      setTimeout(() => {
        expect(mockPush).not.toHaveBeenCalled()
      }, 200)
    })
  })

  describe('Unauthenticated User Behavior', () => {
    it('should not redirect unauthenticated user', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false
      })

      render(<Home />)

      expect(mockPush).not.toHaveBeenCalled()
    })

    it('should not redirect when no user and auth is loading', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: true
      })

      render(<Home />)

      expect(mockPush).not.toHaveBeenCalled()
    })

    it('should show landing page content for unauthenticated users', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false
      })

      render(<Home />)

      expect(screen.getByText(/Transform Strategic Analysis/)).toBeInTheDocument()
    })
  })

  describe('Loading State Handling', () => {
    it('should show loading state when auth is loading', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: true
      })

      render(<Home />)

      expect(screen.getByText('Loading Thinkhaven...')).toBeInTheDocument()
    })

    it('should not show main content during loading', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: true
      })

      render(<Home />)

      expect(screen.queryByText(/Transform Strategic Analysis/)).not.toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle auth state changes correctly', async () => {
      const { rerender } = render(<Home />)

      // Initially loading
      mockUseAuth.mockReturnValue({
        user: null,
        loading: true
      })

      rerender(<Home />)
      expect(mockPush).not.toHaveBeenCalled()

      // Auth completes with user
      mockUseAuth.mockReturnValue({
        user: { id: 'test-user', email: 'test@example.com' },
        loading: false
      })

      rerender(<Home />)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard')
      })
    })

    it('should handle null user with loaded auth correctly', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false
      })

      render(<Home />)

      expect(mockPush).not.toHaveBeenCalled()
      expect(screen.getByText(/Transform Strategic Analysis/)).toBeInTheDocument()
    })
  })
})