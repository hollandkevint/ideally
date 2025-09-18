import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useRouter } from 'next/navigation'

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

// Import after mocks
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Home from '../../app/page'
import { useAuth } from '../../lib/auth/AuthContext'

describe('Landing Page Navigation', () => {
  const mockPush = vi.fn()
  const mockUseRouter = useRouter as any
  const mockUseAuth = useAuth as any

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseRouter.mockReturnValue({
      push: mockPush
    })
  })

  describe('Unauthenticated User Navigation', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false
      })
    })

    it('should navigate to /login when Email & Password Login button is clicked', () => {
      render(<Home />)
      const loginButton = screen.getByText('Email & Password Login')

      fireEvent.click(loginButton)

      expect(mockPush).toHaveBeenCalledWith('/login')
    })

    it('should navigate to /demo when "View Live Demo - No Signup Required" button is clicked', () => {
      render(<Home />)
      const demoButton = screen.getByText('🎯 View Live Demo - No Signup Required')

      fireEvent.click(demoButton)

      expect(mockPush).toHaveBeenCalledWith('/demo')
    })

    it('should navigate to /method-demo when "Watch Method Demo" button is clicked (first occurrence)', () => {
      render(<Home />)
      const methodDemoButtons = screen.getAllByText('🎬 Watch Method Demo')

      fireEvent.click(methodDemoButtons[0])

      expect(mockPush).toHaveBeenCalledWith('/method-demo')
    })

    it('should navigate to /demo when "Try Before You Buy - View Demo" button is clicked', () => {
      render(<Home />)
      const tryDemoButton = screen.getByText('🎯 Try Before You Buy - View Demo')

      fireEvent.click(tryDemoButton)

      expect(mockPush).toHaveBeenCalledWith('/demo')
    })

    it('should navigate to /method-demo when "Watch Method Demo" button is clicked (second occurrence)', () => {
      render(<Home />)
      const methodDemoButtons = screen.getAllByText('🎬 Watch Method Demo')

      fireEvent.click(methodDemoButtons[1])

      expect(mockPush).toHaveBeenCalledWith('/method-demo')
    })
  })

  describe('Authenticated User Navigation', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: { id: 'test-user', email: 'test@example.com' },
        loading: false
      })
    })

    it('should navigate to /dashboard when "Go to Dashboard" button is clicked', () => {
      render(<Home />)
      const dashboardButton = screen.getByText('🚀 Go to Dashboard')

      fireEvent.click(dashboardButton)

      expect(mockPush).toHaveBeenCalledWith('/dashboard')
    })

    it('should navigate to /demo when "View Demo" button is clicked (first occurrence)', () => {
      render(<Home />)
      const viewDemoButtons = screen.getAllByText('🎯 View Demo')

      fireEvent.click(viewDemoButtons[0])

      expect(mockPush).toHaveBeenCalledWith('/demo')
    })

    it('should navigate to /dashboard when "Start Strategic Analysis" button is clicked', () => {
      render(<Home />)
      const startAnalysisButton = screen.getByText('🚀 Start Strategic Analysis')

      fireEvent.click(startAnalysisButton)

      expect(mockPush).toHaveBeenCalledWith('/dashboard')
    })

    it('should navigate to /demo when "View Demo" button is clicked (second occurrence)', () => {
      render(<Home />)
      const viewDemoButtons = screen.getAllByText('🎯 View Demo')

      fireEvent.click(viewDemoButtons[1])

      expect(mockPush).toHaveBeenCalledWith('/demo')
    })
  })

  describe('Email Form Functionality', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false
      })
    })

    it('should show success message when email form is submitted', async () => {
      render(<Home />)

      const emailInput = screen.getByPlaceholderText('Enter your email address')
      const submitButton = screen.getByText('🧠 Get Notified When Available')

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByTestId('success-message')).toBeInTheDocument()
        expect(screen.getByText('✅ Thank you!')).toBeInTheDocument()
      })
    })

    it('should reset form after successful submission', async () => {
      vi.useFakeTimers()

      render(<Home />)

      const emailInput = screen.getByPlaceholderText('Enter your email address') as HTMLInputElement
      const submitButton = screen.getByText('🧠 Get Notified When Available')

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.click(submitButton)

      // Fast-forward 3 seconds to trigger form reset
      vi.advanceTimersByTime(3000)

      await waitFor(() => {
        expect(emailInput.value).toBe('')
        expect(screen.getByText('🧠 Get Notified When Available')).toBeInTheDocument()
      })

      vi.useRealTimers()
    })
  })

  describe('Conditional Rendering', () => {
    it('should show authenticated user buttons when user is logged in', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'test-user', email: 'test@example.com' },
        loading: false
      })

      render(<Home />)

      expect(screen.getByText('🚀 Go to Dashboard')).toBeInTheDocument()
      expect(screen.getByText('🚀 Start Strategic Analysis')).toBeInTheDocument()
      expect(screen.getAllByText('🎯 View Demo')).toHaveLength(2)
    })

    it('should show unauthenticated user buttons when user is not logged in', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false
      })

      render(<Home />)

      expect(screen.getByText('🎯 View Live Demo - No Signup Required')).toBeInTheDocument()
      expect(screen.getByText('🎯 Try Before You Buy - View Demo')).toBeInTheDocument()
      expect(screen.getAllByText('🎬 Watch Method Demo')).toHaveLength(2)
      expect(screen.getByText('Email & Password Login')).toBeInTheDocument()
    })
  })

  describe('Google Signin Integration', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false
      })
    })

    it('should navigate to dashboard when Google signin succeeds', () => {
      render(<Home />)

      const googleSigninButton = screen.getByTestId('google-signin')
      fireEvent.click(googleSigninButton)

      expect(mockPush).toHaveBeenCalledWith('/dashboard')
    })
  })
})