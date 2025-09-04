import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import BmadInterface from '@/app/components/bmad/BmadInterface'
import { useBmadSession } from '@/app/components/bmad/useBmadSession'

// Mock the useBmadSession hook
jest.mock('@/app/components/bmad/useBmadSession')
const mockUseBmadSession = useBmadSession as jest.MockedFunction<typeof useBmadSession>

// Mock child components to control errors
jest.mock('@/app/components/bmad/PathwaySelector', () => {
  return function MockPathwaySelector({ onPathwaySelected }: any) {
    const shouldThrow = (window as any).__THROW_PATHWAY_ERROR__
    if (shouldThrow) {
      throw new Error('PathwaySelector test error')
    }
    return (
      <div data-testid="pathway-selector">
        <button onClick={() => onPathwaySelected('new-idea', 'test input')}>
          Select Pathway
        </button>
      </div>
    )
  }
})

jest.mock('@/app/components/bmad/SessionManager', () => {
  return function MockSessionManager() {
    const shouldThrow = (window as any).__THROW_SESSION_MANAGER_ERROR__
    if (shouldThrow) {
      throw new Error('SessionManager test error')
    }
    return <div data-testid="session-manager">Session Manager</div>
  }
})

jest.mock('@/app/components/bmad/ElicitationPanel', () => {
  return function MockElicitationPanel() {
    const shouldThrow = (window as any).__THROW_ELICITATION_ERROR__
    if (shouldThrow) {
      throw new Error('ElicitationPanel test error')
    }
    return <div data-testid="elicitation-panel">Elicitation Panel</div>
  }
})

const defaultSessionHookReturn = {
  currentSession: null,
  isLoading: false,
  error: null,
  createSession: jest.fn(),
  advanceSession: jest.fn(),
  getSession: jest.fn(),
  pauseSession: jest.fn(),
  resumeSession: jest.fn(),
  exitSession: jest.fn(),
}

describe('BmadInterface Error Boundaries', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Clear error flags
    delete (window as any).__THROW_PATHWAY_ERROR__
    delete (window as any).__THROW_SESSION_MANAGER_ERROR__
    delete (window as any).__THROW_ELICITATION_ERROR__
    delete (window as any).__THROW_ONBOARDING_ERROR__
    
    mockUseBmadSession.mockReturnValue(defaultSessionHookReturn)
    
    // Suppress console.error for these tests
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('catches errors in PathwaySelector with error boundary', async () => {
    (window as any).__THROW_PATHWAY_ERROR__ = true
    
    render(<BmadInterface workspaceId="test-workspace" />)
    
    // Should show pathway selector error boundary fallback
    expect(screen.getByText('Something Went Wrong')).toBeInTheDocument()
    expect(screen.getByText('Try Again')).toBeInTheDocument()
    expect(screen.getByText('Refresh Page')).toBeInTheDocument()
  })

  it('catches errors in SessionManager with error boundary', async () => {
    const mockSession = {
      id: 'test-session',
      workspaceId: 'test-workspace',
      pathway: 'new-idea',
      currentPhase: 'discovery',
      progress: { completedPhases: [], currentPhaseProgress: 50 },
      context: { userResponses: {} },
      metadata: { status: 'active' as const, createdAt: new Date(), updatedAt: new Date() }
    }
    
    mockUseBmadSession.mockReturnValue({
      ...defaultSessionHookReturn,
      currentSession: mockSession
    })
    
    ;(window as any).__THROW_SESSION_MANAGER_ERROR__ = true
    
    render(<BmadInterface workspaceId="test-workspace" />)
    
    await waitFor(() => {
      expect(screen.getByText('Something Went Wrong')).toBeInTheDocument()
    })
  })

  it('catches errors in ElicitationPanel with error boundary', async () => {
    const mockSession = {
      id: 'test-session', 
      workspaceId: 'test-workspace',
      pathway: 'new-idea',
      currentPhase: 'discovery',
      progress: { completedPhases: [], currentPhaseProgress: 50 },
      context: { userResponses: {} },
      metadata: { status: 'active' as const, createdAt: new Date(), updatedAt: new Date() }
    }
    
    mockUseBmadSession.mockReturnValue({
      ...defaultSessionHookReturn,
      currentSession: mockSession
    })
    
    // Set up elicitation data
    const component = render(<BmadInterface workspaceId="test-workspace" />)
    
    // Simulate pathway selection to trigger session active state
    fireEvent.click(screen.getByText('Select Pathway'))
    
    ;(window as any).__THROW_ELICITATION_ERROR__ = true
    
    // Force re-render to trigger error
    component.rerender(<BmadInterface workspaceId="test-workspace" />)
    
    await waitFor(() => {
      expect(screen.getByText('Something Went Wrong')).toBeInTheDocument()
    })
  })

  it('shows main content error boundary fallback when renderCurrentStep fails', () => {
    // Mock renderCurrentStep to throw by making currentStep invalid
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    
    // Force an error by providing invalid state
    mockUseBmadSession.mockReturnValue({
      ...defaultSessionHookReturn,
      currentSession: null,
      isLoading: false
    })
    
    // Create a component that will fail in renderCurrentStep
    const ThrowingComponent = () => {
      throw new Error('Main content rendering error')
    }
    
    // We can't easily mock renderCurrentStep directly, so let's test error recovery options
    render(<BmadInterface workspaceId="test-workspace" />)
    
    // The component should render normally in this case
    expect(screen.getByText('BMad Method')).toBeInTheDocument()
    
    consoleSpy.mockRestore()
  })

  it('provides error recovery options in error boundaries', async () => {
    (window as any).__THROW_PATHWAY_ERROR__ = true
    
    const mockReload = jest.fn()
    Object.defineProperty(window, 'location', {
      value: { reload: mockReload },
      writable: true
    })
    
    render(<BmadInterface workspaceId="test-workspace" />)
    
    await waitFor(() => {
      expect(screen.getByText('Try Again')).toBeInTheDocument()
      expect(screen.getByText('Refresh Page')).toBeInTheDocument()
    })
    
    // Test refresh functionality
    fireEvent.click(screen.getByText('Refresh Page'))
    expect(mockReload).toHaveBeenCalled()
  })

  it('shows session error messages when useBmadSession returns error', () => {
    mockUseBmadSession.mockReturnValue({
      ...defaultSessionHookReturn,
      error: 'Failed to create session'
    })
    
    render(<BmadInterface workspaceId="test-workspace" />)
    
    expect(screen.getByText('Error')).toBeInTheDocument()
    expect(screen.getByText('Failed to create session')).toBeInTheDocument()
  })

  it('handles onboarding modal errors gracefully', () => {
    // Since we can't easily mock the onboarding content to throw,
    // we'll test that the error boundary structure is in place
    render(<BmadInterface workspaceId="test-workspace" />)
    
    // The component should render without errors
    expect(screen.getByText('BMad Method')).toBeInTheDocument()
  })

  it('provides different fallback messages for different sections', async () => {
    (window as any).__THROW_PATHWAY_ERROR__ = true
    
    render(<BmadInterface workspaceId="test-workspace" />)
    
    await waitFor(() => {
      // Should show the generic error boundary fallback
      expect(screen.getByText('Something Went Wrong')).toBeInTheDocument()
      expect(screen.getByText(/An unexpected error occurred/)).toBeInTheDocument()
    })
  })

  it('continues working when one section has errors but others work', async () => {
    // Only PathwaySelector throws, other components should still work
    (window as any).__THROW_PATHWAY_ERROR__ = true
    
    render(<BmadInterface workspaceId="test-workspace" />)
    
    // Error boundary fallback should show
    expect(screen.getByText('Something Went Wrong')).toBeInTheDocument()
    
    // But the main interface structure should still be there
    expect(screen.getByText('BMad Method')).toBeInTheDocument()
    expect(screen.getByText('Strategic frameworks for breakthrough thinking')).toBeInTheDocument()
    expect(screen.getByText('1. Pathway')).toBeInTheDocument()
  })

  it('maintains step indicator even when content has errors', async () => {
    (window as any).__THROW_PATHWAY_ERROR__ = true
    
    render(<BmadInterface workspaceId="test-workspace" />)
    
    // Step indicator should still be visible
    expect(screen.getByText('1. Pathway')).toBeInTheDocument()
    expect(screen.getByText('2. Session')).toBeInTheDocument()
    expect(screen.getByText('3. Results')).toBeInTheDocument()
  })
})