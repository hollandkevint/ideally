import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import GoogleOneTapSignin from '../../../app/components/auth/GoogleOneTapSignin'
import { useAuth } from '../../../lib/auth/AuthContext'
import { loadGoogleScript, createGoogleConfig, isGoogleLoaded } from '../../../lib/auth/google-config'
import type { GoogleCredentialResponse } from '../../../types/google'

// Mock dependencies
vi.mock('../../../lib/auth/AuthContext')
vi.mock('../../../lib/auth/google-config')
vi.mock('next/script', () => ({
  default: ({ onLoad, onError, ...props }: any) => {
    return <script {...props} />
  }
}))

const mockUseAuth = vi.mocked(useAuth)
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

const mockSignInWithGoogle = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  
  mockUseAuth.mockReturnValue({
    user: null,
    loading: false,
    signInWithGoogle: mockSignInWithGoogle,
    signOut: vi.fn(),
    signInWithEmail: vi.fn()
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

describe('GoogleOneTapSignin', () => {
  const mockOnSuccess = vi.fn()
  const mockOnError = vi.fn()

  describe('Component Rendering', () => {
    it('renders signin container with proper structure', () => {
      render(<GoogleOneTapSignin />)
      
      const container = screen.getByTestId('google-signin-container')
      expect(container).toBeInTheDocument()
      expect(screen.getByRole('script')).toBeInTheDocument()
    })

    it('does not render when user is already signed in', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'test-user', email: 'test@example.com' } as any,
        loading: false,
        signInWithGoogle: mockSignInWithGoogle,
        signOut: vi.fn(),
        signInWithEmail: vi.fn()
      })

      const { container } = render(<GoogleOneTapSignin />)
      expect(container.firstChild).toBeNull()
    })

    it('applies custom className when provided', () => {
      render(<GoogleOneTapSignin className="custom-signin-class" />)
      
      const container = screen.getByTestId('google-signin-container')
      expect(container).toHaveClass('custom-signin-class')
    })

    it('renders loading state during signin process', async () => {
      const mockCredential = 'mock-jwt-token'
      let credentialCallback: (response: GoogleCredentialResponse) => void
      let resolveSignin: () => void

      mockCreateGoogleConfig.mockImplementation((callback) => {
        credentialCallback = callback
        return Promise.resolve({
          client_id: 'test-client-id',
          callback,
          nonce: 'test-nonce'
        })
      })

      const signinPromise = new Promise<void>((resolve) => {
        resolveSignin = resolve
      })
      mockSignInWithGoogle.mockReturnValue(signinPromise)

      render(<GoogleOneTapSignin />)
      
      await waitFor(() => {
        expect(mockCreateGoogleConfig).toHaveBeenCalled()
      })

      credentialCallback!({ credential: mockCredential })

      await waitFor(() => {
        expect(screen.getByText('Signing in with Google...')).toBeInTheDocument()
        expect(screen.getByRole('status')).toBeInTheDocument()
      })

      resolveSignin!()
    })
  })

  describe('Google Script Loading and Initialization', () => {
    it('initializes Google signin when component mounts', async () => {
      render(<GoogleOneTapSignin />)
      
      await waitFor(() => {
        expect(mockLoadGoogleScript).toHaveBeenCalled()
        expect(mockCreateGoogleConfig).toHaveBeenCalled()
        expect(mockGoogleInitialize).toHaveBeenCalled()
        expect(mockGooglePrompt).toHaveBeenCalled()
      })
    })

    it('handles script loading failure gracefully', async () => {
      mockLoadGoogleScript.mockRejectedValue(new Error('Script load failed'))
      
      render(<GoogleOneTapSignin onError={mockOnError} />)
      
      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith('Script load failed')
        expect(screen.getByText('Google Sign-in Error')).toBeInTheDocument()
        expect(screen.getByText('Script load failed')).toBeInTheDocument()
      })
    })

    it('handles Google services unavailable', async () => {
      mockIsGoogleLoaded.mockReturnValue(false)
      
      render(<GoogleOneTapSignin onError={mockOnError} />)
      
      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith('Google Identity Services not available')
      })
    })

    it('does not initialize when user is loading', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: true,
        signInWithGoogle: mockSignInWithGoogle,
        signOut: vi.fn(),
        signInWithEmail: vi.fn()
      })

      render(<GoogleOneTapSignin />)
      
      expect(mockLoadGoogleScript).not.toHaveBeenCalled()
    })
  })

  describe('Authentication Flow', () => {
    it('handles successful credential response', async () => {
      const mockCredential = 'mock-jwt-token'
      let credentialCallback: (response: GoogleCredentialResponse) => void

      mockCreateGoogleConfig.mockImplementation((callback) => {
        credentialCallback = callback
        return Promise.resolve({
          client_id: 'test-client-id',
          callback,
          nonce: 'test-nonce'
        })
      })

      mockSignInWithGoogle.mockResolvedValue(undefined)

      render(<GoogleOneTapSignin onSuccess={mockOnSuccess} />)
      
      await waitFor(() => {
        expect(mockCreateGoogleConfig).toHaveBeenCalled()
      })

      await credentialCallback!({ credential: mockCredential })

      await waitFor(() => {
        expect(mockSignInWithGoogle).toHaveBeenCalledWith(mockCredential)
        expect(mockOnSuccess).toHaveBeenCalled()
      })
    })

    it('handles missing credential in response', async () => {
      let credentialCallback: (response: GoogleCredentialResponse) => void

      mockCreateGoogleConfig.mockImplementation((callback) => {
        credentialCallback = callback
        return Promise.resolve({
          client_id: 'test-client-id',
          callback,
          nonce: 'test-nonce'
        })
      })

      render(<GoogleOneTapSignin onError={mockOnError} />)
      
      await waitFor(() => {
        expect(mockCreateGoogleConfig).toHaveBeenCalled()
      })

      await credentialCallback!({ credential: '' })

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith('No credential received from Google')
        expect(screen.getByText('No credential received from Google')).toBeInTheDocument()
      })
    })

    it('handles signin authentication error', async () => {
      const mockCredential = 'mock-jwt-token'
      let credentialCallback: (response: GoogleCredentialResponse) => void

      mockCreateGoogleConfig.mockImplementation((callback) => {
        credentialCallback = callback
        return Promise.resolve({
          client_id: 'test-client-id',
          callback,
          nonce: 'test-nonce'
        })
      })

      mockSignInWithGoogle.mockRejectedValue(new Error('Authentication failed'))

      render(<GoogleOneTapSignin onError={mockOnError} />)
      
      await waitFor(() => {
        expect(mockCreateGoogleConfig).toHaveBeenCalled()
      })

      await credentialCallback!({ credential: mockCredential })

      await waitFor(() => {
        expect(mockSignInWithGoogle).toHaveBeenCalledWith(mockCredential)
        expect(mockOnError).toHaveBeenCalledWith('Authentication failed')
        expect(screen.getByText('Authentication failed')).toBeInTheDocument()
      })
    })
  })

  describe('Google One-Tap Prompt Behavior', () => {
    it('handles One-Tap not displayed due to browser support', async () => {
      const mockNotification = {
        isNotDisplayed: () => true,
        getNotDisplayedReason: () => 'browser_not_supported'
      }

      mockGooglePrompt.mockImplementation((callback) => {
        callback(mockNotification)
      })

      render(<GoogleOneTapSignin />)
      
      await waitFor(() => {
        expect(mockGooglePrompt).toHaveBeenCalled()
        expect(screen.getByText('Your browser does not support Google One-Tap signin')).toBeInTheDocument()
      })
    })

    it('handles One-Tap displayed successfully', async () => {
      const mockNotification = {
        isNotDisplayed: () => false,
        getNotDisplayedReason: () => null
      }

      mockGooglePrompt.mockImplementation((callback) => {
        callback(mockNotification)
      })

      render(<GoogleOneTapSignin />)
      
      await waitFor(() => {
        expect(mockGooglePrompt).toHaveBeenCalled()
      })

      expect(screen.queryByText('Your browser does not support Google One-Tap signin')).not.toBeInTheDocument()
    })

    it('logs other One-Tap display reasons without showing error', async () => {
      const mockNotification = {
        isNotDisplayed: () => true,
        getNotDisplayedReason: () => 'user_cancelled'
      }

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      mockGooglePrompt.mockImplementation((callback) => {
        callback(mockNotification)
      })

      render(<GoogleOneTapSignin />)
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Google One-Tap not displayed:', 'user_cancelled')
      })

      expect(screen.queryByText('Your browser does not support Google One-Tap signin')).not.toBeInTheDocument()
      
      consoleSpy.mockRestore()
    })
  })

  describe('Component Lifecycle', () => {
    it('cancels Google signin on component unmount', () => {
      const { unmount } = render(<GoogleOneTapSignin />)
      
      unmount()
      
      expect(mockGoogleCancel).toHaveBeenCalled()
    })

    it('does not cancel if Google is not loaded on unmount', () => {
      mockIsGoogleLoaded.mockReturnValue(false)
      
      const { unmount } = render(<GoogleOneTapSignin />)
      
      unmount()
      
      expect(mockGoogleCancel).not.toHaveBeenCalled()
    })

    it('prevents re-initialization when already initialized', async () => {
      const { rerender } = render(<GoogleOneTapSignin />)
      
      await waitFor(() => {
        expect(mockLoadGoogleScript).toHaveBeenCalledTimes(1)
      })

      rerender(<GoogleOneTapSignin />)
      
      // Should not be called again
      expect(mockLoadGoogleScript).toHaveBeenCalledTimes(1)
    })
  })

  describe('Error State Management', () => {
    it('clears error state on successful signin attempt', async () => {
      const mockCredential = 'mock-jwt-token'
      let credentialCallback: (response: GoogleCredentialResponse) => void

      mockCreateGoogleConfig.mockImplementation((callback) => {
        credentialCallback = callback
        return Promise.resolve({
          client_id: 'test-client-id',
          callback,
          nonce: 'test-nonce'
        })
      })

      mockSignInWithGoogle
        .mockRejectedValueOnce(new Error('First attempt failed'))
        .mockResolvedValueOnce(undefined)

      render(<GoogleOneTapSignin onError={mockOnError} onSuccess={mockOnSuccess} />)
      
      await waitFor(() => {
        expect(mockCreateGoogleConfig).toHaveBeenCalled()
      })

      // First attempt - should show error
      await credentialCallback!({ credential: mockCredential })
      await waitFor(() => {
        expect(screen.getByText('First attempt failed')).toBeInTheDocument()
      })

      // Second attempt - should clear error and succeed
      await credentialCallback!({ credential: mockCredential })
      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled()
        expect(screen.queryByText('First attempt failed')).not.toBeInTheDocument()
      })
    })

    it('handles unknown errors gracefully', async () => {
      const mockCredential = 'mock-jwt-token'
      let credentialCallback: (response: GoogleCredentialResponse) => void

      mockCreateGoogleConfig.mockImplementation((callback) => {
        credentialCallback = callback
        return Promise.resolve({
          client_id: 'test-client-id',
          callback,
          nonce: 'test-nonce'
        })
      })

      mockSignInWithGoogle.mockRejectedValue('Unknown error')

      render(<GoogleOneTapSignin onError={mockOnError} />)
      
      await waitFor(() => {
        expect(mockCreateGoogleConfig).toHaveBeenCalled()
      })

      await credentialCallback!({ credential: mockCredential })

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith('Google signin failed')
      })
    })
  })

  describe('Nonce Generation and Credential Handling', () => {
    it('passes nonce to Google configuration', async () => {
      render(<GoogleOneTapSignin />)
      
      await waitFor(() => {
        expect(mockCreateGoogleConfig).toHaveBeenCalled()
      })

      const configCall = mockCreateGoogleConfig.mock.calls[0]
      expect(configCall[0]).toBeInstanceOf(Function) // callback function
      expect(configCall[1]).toBeDefined() // nonce parameter
    })

    it('handles credential processing correctly', async () => {
      const mockCredential = 'eyJhbGciOiJSUzI1NiIs...' // Mock JWT
      let credentialCallback: (response: GoogleCredentialResponse) => void

      mockCreateGoogleConfig.mockImplementation((callback) => {
        credentialCallback = callback
        return Promise.resolve({
          client_id: 'test-client-id',
          callback,
          nonce: 'test-nonce-123'
        })
      })

      mockSignInWithGoogle.mockResolvedValue(undefined)

      render(<GoogleOneTapSignin />)
      
      await waitFor(() => {
        expect(mockCreateGoogleConfig).toHaveBeenCalled()
      })

      await credentialCallback!({ credential: mockCredential })

      await waitFor(() => {
        expect(mockSignInWithGoogle).toHaveBeenCalledWith(mockCredential)
      })
    })
  })
})