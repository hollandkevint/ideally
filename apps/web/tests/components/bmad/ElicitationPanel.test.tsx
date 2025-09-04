import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ElicitationPanel from '@/app/components/bmad/ElicitationPanel'
import { NumberedOption } from '@/lib/bmad/types'
import { GracefulDegradation } from '@/lib/bmad/service-status'

// Mock the GracefulDegradation module
jest.mock('@/lib/bmad/service-status', () => ({
  GracefulDegradation: {
    withFallback: jest.fn(),
    cacheSessionData: jest.fn(),
  }
}))

const mockOptions: NumberedOption[] = [
  {
    number: 1,
    text: "Research the competitive landscape",
    category: "analysis",
    estimatedTime: 20
  },
  {
    number: 2,
    text: "Define target users",
    category: "strategy", 
    estimatedTime: 15
  }
]

const defaultProps = {
  sessionId: 'test-session-123',
  phaseId: 'discovery',
  phaseTitle: 'Discovery Phase',
  prompt: 'Choose your approach for this discovery phase',
  options: mockOptions,
  onSubmit: jest.fn(),
}

describe('ElicitationPanel Error Recovery', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders error message when submission fails', async () => {
    const mockOnSubmit = jest.fn().mockRejectedValue(new Error('Network error'))
    ;(GracefulDegradation.withFallback as jest.Mock).mockRejectedValue(new Error('Network error'))

    render(<ElicitationPanel {...defaultProps} onSubmit={mockOnSubmit} />)
    
    // Select an option
    fireEvent.click(screen.getByText('Research the competitive landscape'))
    
    // Submit
    fireEvent.click(screen.getByText('Continue Strategic Session'))
    
    await waitFor(() => {
      expect(screen.getByText('Connection Issue')).toBeInTheDocument()
      expect(screen.getByText(/Unable to submit your response/)).toBeInTheDocument()
      expect(screen.getByText('Try Again')).toBeInTheDocument()
    })
  })

  it('shows retry functionality after first failure', async () => {
    const mockOnSubmit = jest.fn().mockRejectedValue(new Error('Network error'))
    ;(GracefulDegradation.withFallback as jest.Mock).mockRejectedValue(new Error('Network error'))

    render(<ElicitationPanel {...defaultProps} onSubmit={mockOnSubmit} />)
    
    // Select option and submit
    fireEvent.click(screen.getByText('Research the competitive landscape'))
    fireEvent.click(screen.getByText('Continue Strategic Session'))
    
    // Wait for error
    await waitFor(() => {
      expect(screen.getByText('Try Again')).toBeInTheDocument()
    })
    
    // Click retry
    fireEvent.click(screen.getByText('Try Again'))
    
    await waitFor(() => {
      expect(screen.getByText(/Still having trouble connecting/)).toBeInTheDocument()
      expect(screen.getByText('Continue Offline')).toBeInTheDocument()
    })
  })

  it('enters offline mode when user chooses to continue offline', async () => {
    const mockOnSubmit = jest.fn().mockRejectedValue(new Error('Network error'))
    ;(GracefulDegradation.withFallback as jest.Mock).mockRejectedValue(new Error('Network error'))

    render(<ElicitationPanel {...defaultProps} onSubmit={mockOnSubmit} />)
    
    // Select option and submit to trigger first error
    fireEvent.click(screen.getByText('Research the competitive landscape'))
    fireEvent.click(screen.getByText('Continue Strategic Session'))
    
    await waitFor(() => {
      expect(screen.getByText('Try Again')).toBeInTheDocument()
    })
    
    // Retry to trigger second error
    fireEvent.click(screen.getByText('Try Again'))
    
    await waitFor(() => {
      expect(screen.getByText('Continue Offline')).toBeInTheDocument()
    })
    
    // Enter offline mode
    fireEvent.click(screen.getByText('Continue Offline'))
    
    expect(screen.getByText('Offline Mode Active')).toBeInTheDocument()
    expect(screen.getByText(/Data saved locally/)).toBeInTheDocument()
    expect(screen.getByText('Continue Offline Session')).toBeInTheDocument()
  })

  it('uses graceful degradation for submission', async () => {
    const mockWithFallback = GracefulDegradation.withFallback as jest.Mock
    mockWithFallback.mockResolvedValue(true)

    render(<ElicitationPanel {...defaultProps} />)
    
    // Select option and submit
    fireEvent.click(screen.getByText('Research the competitive landscape'))
    fireEvent.click(screen.getByText('Continue Strategic Session'))
    
    await waitFor(() => {
      expect(mockWithFallback).toHaveBeenCalledWith(
        expect.any(Function), // primary operation
        expect.any(Function), // fallback operation  
        ['sessionManagement']
      )
    })
  })

  it('caches session data in fallback mode', async () => {
    const mockWithFallback = GracefulDegradation.withFallback as jest.Mock
    const mockCacheSessionData = GracefulDegradation.cacheSessionData as jest.Mock
    
    // Mock the fallback function to be called
    mockWithFallback.mockImplementation(async (primary, fallback) => {
      return fallback()
    })

    render(<ElicitationPanel {...defaultProps} />)
    
    // Select option and submit
    fireEvent.click(screen.getByText('Research the competitive landscape'))
    fireEvent.click(screen.getByText('Continue Strategic Session'))
    
    await waitFor(() => {
      expect(mockCacheSessionData).toHaveBeenCalledWith(
        'test-session-123',
        expect.objectContaining({
          responseData: expect.objectContaining({
            elicitationChoice: 1,
            text: 'Research the competitive landscape'
          }),
          phaseId: 'discovery',
          offline: true
        })
      )
    })
  })

  it('clears error when selecting new option', async () => {
    const mockOnSubmit = jest.fn().mockRejectedValue(new Error('Network error'))
    ;(GracefulDegradation.withFallback as jest.Mock).mockRejectedValue(new Error('Network error'))

    render(<ElicitationPanel {...defaultProps} onSubmit={mockOnSubmit} />)
    
    // Select option and submit to create error
    fireEvent.click(screen.getByText('Research the competitive landscape'))
    fireEvent.click(screen.getByText('Continue Strategic Session'))
    
    await waitFor(() => {
      expect(screen.getByText('Connection Issue')).toBeInTheDocument()
    })
    
    // Select different option
    fireEvent.click(screen.getByText('Define target users'))
    
    expect(screen.queryByText('Connection Issue')).not.toBeInTheDocument()
  })

  it('shows refresh page option in error recovery', async () => {
    const mockOnSubmit = jest.fn().mockRejectedValue(new Error('Network error'))
    ;(GracefulDegradation.withFallback as jest.Mock).mockRejectedValue(new Error('Network error'))
    
    // Mock window.location.reload
    const mockReload = jest.fn()
    Object.defineProperty(window, 'location', {
      value: { reload: mockReload },
      writable: true
    })

    render(<ElicitationPanel {...defaultProps} onSubmit={mockOnSubmit} />)
    
    // Trigger error
    fireEvent.click(screen.getByText('Research the competitive landscape'))
    fireEvent.click(screen.getByText('Continue Strategic Session'))
    
    await waitFor(() => {
      expect(screen.getByText('Refresh Page')).toBeInTheDocument()
    })
    
    // Click refresh
    fireEvent.click(screen.getByText('Refresh Page'))
    
    expect(mockReload).toHaveBeenCalled()
  })

  it('shows different error messages based on retry count', async () => {
    const mockOnSubmit = jest.fn().mockRejectedValue(new Error('Network error'))
    ;(GracefulDegradation.withFallback as jest.Mock).mockRejectedValue(new Error('Network error'))

    render(<ElicitationPanel {...defaultProps} onSubmit={mockOnSubmit} />)
    
    // First error
    fireEvent.click(screen.getByText('Research the competitive landscape'))
    fireEvent.click(screen.getByText('Continue Strategic Session'))
    
    await waitFor(() => {
      expect(screen.getByText(/Unable to submit your response/)).toBeInTheDocument()
    })
    
    // Second error (retry)
    fireEvent.click(screen.getByText('Try Again'))
    
    await waitFor(() => {
      expect(screen.getByText(/Still having trouble connecting/)).toBeInTheDocument()
    })
    
    // Third error (second retry)
    fireEvent.click(screen.getByText('Try Again'))
    
    await waitFor(() => {
      expect(screen.getByText(/Multiple connection attempts failed/)).toBeInTheDocument()
    })
  })

  it('updates submit button appearance in offline mode', async () => {
    const mockWithFallback = GracefulDegradation.withFallback as jest.Mock
    
    // Mock fallback to trigger offline mode
    mockWithFallback.mockImplementation(async (primary, fallback) => {
      return fallback()
    })

    render(<ElicitationPanel {...defaultProps} />)
    
    // Select option and submit to trigger offline mode
    fireEvent.click(screen.getByText('Research the competitive landscape'))
    fireEvent.click(screen.getByText('Continue Strategic Session'))
    
    await waitFor(() => {
      expect(screen.getByText('Continue Offline Session')).toBeInTheDocument()
    })
  })
})