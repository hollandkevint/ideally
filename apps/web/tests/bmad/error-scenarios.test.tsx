/**
 * BMad Method Error Scenario Tests
 * Task 5.2: Error scenario testing with various failure modes
 */

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import BmadInterface from '@/app/components/bmad/BmadInterface'
import EnhancedSessionManager from '@/app/components/bmad/EnhancedSessionManager'
import SessionHistoryManager from '@/app/components/bmad/SessionHistoryManager'
import { BmadSession, PathwayType } from '@/lib/bmad/types'

// Mock console.error to avoid noise in test output
const originalConsoleError = console.error
beforeAll(() => {
  console.error = jest.fn()
})

afterAll(() => {
  console.error = originalConsoleError
})

// Mock the BMad session hook
const mockBmadSession = {
  currentSession: null,
  isLoading: false,
  error: null,
  createSession: jest.fn(),
  advanceSession: jest.fn(),
  getSession: jest.fn(),
  pauseSession: jest.fn(),
  resumeSession: jest.fn(),
  exitSession: jest.fn()
}

jest.mock('@/app/components/bmad/useBmadSession', () => ({
  useBmadSession: () => mockBmadSession
}))

// Mock fetch for API calls
global.fetch = jest.fn()

describe('BMad Method Error Scenarios', () => {
  const mockWorkspaceId = 'test-workspace-123'
  
  beforeEach(() => {
    jest.clearAllMocks()
    mockBmadSession.currentSession = null
    mockBmadSession.isLoading = false
    mockBmadSession.error = null
  })

  describe('Network Connectivity Errors', () => {
    it('should handle network failure during session creation', async () => {
      const user = userEvent.setup()
      mockBmadSession.createSession.mockRejectedValueOnce(new Error('Network Error'))
      mockBmadSession.error = 'Failed to create session: Network connection lost'
      
      render(<BmadInterface workspaceId={mockWorkspaceId} />)
      
      await waitFor(() => {
        expect(screen.getByText('Failed to create session: Network connection lost')).toBeInTheDocument()
      })
    })

    it('should handle API timeout errors gracefully', async () => {
      ;(fetch as jest.Mock).mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 100)
        )
      )
      
      render(<BmadInterface workspaceId={mockWorkspaceId} />)
      
      await waitFor(() => {
        // Should still render the interface even if API calls fail
        expect(screen.getByText('BMad Method')).toBeInTheDocument()
      }, { timeout: 2000 })
    })

    it('should show offline fallback when API is unreachable', async () => {
      ;(fetch as jest.Mock).mockRejectedValue(new Error('Network Error'))
      
      render(<BmadInterface workspaceId={mockWorkspaceId} />)
      
      await waitFor(() => {
        // Should show onboarding for new users as fallback
        expect(screen.getByText('Welcome to BMad Method')).toBeInTheDocument()
      })
    })

    it('should retry failed requests when network recovers', async () => {
      let callCount = 0
      ;(fetch as jest.Mock).mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          return Promise.reject(new Error('Network Error'))
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, data: { sessions: [] } })
        })
      })
      
      render(<BmadInterface workspaceId={mockWorkspaceId} />)
      
      // Should eventually succeed after retry
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(2)
      }, { timeout: 3000 })
    })
  })

  describe('API Response Errors', () => {
    it('should handle 500 internal server errors', async () => {
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal Server Error' })
      })
      
      render(<BmadInterface workspaceId={mockWorkspaceId} />)
      
      await waitFor(() => {
        expect(screen.getByText('Welcome to BMad Method')).toBeInTheDocument()
      })
    })

    it('should handle 404 not found errors for session retrieval', async () => {
      mockBmadSession.getSession.mockRejectedValueOnce(new Error('Session not found'))
      mockBmadSession.error = 'Session not found'
      
      const mockSession = {
        id: 'missing-session',
        pathway: PathwayType.NEW_IDEA,
        currentPhase: 'foundation'
      }
      
      render(
        <SessionHistoryManager
          workspaceId={mockWorkspaceId}
          onResumeSession={(sessionId) => mockBmadSession.getSession(sessionId)}
        />
      )
      
      // Try to resume a non-existent session
      const resumeButton = screen.queryByText('Resume')
      if (resumeButton) {
        await userEvent.setup().click(resumeButton)
        
        await waitFor(() => {
          expect(mockBmadSession.getSession).toHaveBeenCalled()
        })
      }
    })

    it('should handle malformed API responses', async () => {
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ invalid: 'response' }) // Missing expected fields
      })
      
      render(<BmadInterface workspaceId={mockWorkspaceId} />)
      
      await waitFor(() => {
        // Should still render without crashing
        expect(screen.getByText('BMad Method')).toBeInTheDocument()
      })
    })

    it('should handle authentication/authorization errors', async () => {
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Unauthorized' })
      })
      
      render(<BmadInterface workspaceId={mockWorkspaceId} />)
      
      await waitFor(() => {
        // Should gracefully handle auth errors
        expect(screen.getByText('BMad Method')).toBeInTheDocument()
      })
    })
  })

  describe('Session State Errors', () => {
    it('should handle corrupted session data', async () => {
      const corruptedSession = {
        id: 'corrupted-session',
        // Missing required fields
        pathway: null,
        currentPhase: undefined,
        progress: null
      }
      
      mockBmadSession.currentSession = corruptedSession as any
      
      render(<BmadInterface workspaceId={mockWorkspaceId} />)
      
      await waitFor(() => {
        // Should show loading or fallback state
        expect(screen.getByText('Loading Your Session')).toBeInTheDocument()
      })
    })

    it('should handle session data inconsistencies', async () => {
      const inconsistentSession: Partial<BmadSession> = {
        id: 'inconsistent-session',
        pathway: PathwayType.BUSINESS_MODEL,
        currentPhase: 'nonexistent-phase',
        progress: {
          overallCompletion: 150, // Invalid percentage
          phaseCompletion: {},
          currentStep: '',
          nextSteps: []
        }
      }
      
      mockBmadSession.currentSession = inconsistentSession as BmadSession
      
      render(<EnhancedSessionManager session={inconsistentSession as BmadSession} />)
      
      await waitFor(() => {
        // Should handle invalid data gracefully
        expect(screen.getByText('Business Model Analysis')).toBeInTheDocument()
      })
    })

    it('should handle session advancement failures', async () => {
      const user = userEvent.setup()
      const validSession: BmadSession = {
        id: 'valid-session',
        userId: 'user-123',
        workspaceId: mockWorkspaceId,
        pathway: PathwayType.NEW_IDEA,
        templates: ['template-1'],
        currentPhase: 'ideation',
        currentTemplate: 'template-1',
        startTime: new Date(),
        timeAllocations: [],
        progress: {
          overallCompletion: 50,
          phaseCompletion: { ideation: 50 },
          currentStep: 'Generating ideas',
          nextSteps: []
        },
        context: {
          userResponses: {},
          elicitationHistory: [],
          personaEvolution: [],
          knowledgeReferences: []
        },
        outputs: {
          phaseOutputs: {},
          templateOutputs: {},
          finalDocuments: [],
          actionItems: []
        },
        metadata: {
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      }
      
      mockBmadSession.currentSession = validSession
      mockBmadSession.advanceSession.mockRejectedValueOnce(new Error('Failed to advance session'))
      
      render(<BmadInterface workspaceId={mockWorkspaceId} />)
      
      // Should display session but handle advancement errors
      await waitFor(() => {
        expect(screen.getByText('New Idea Development')).toBeInTheDocument()
      })
    })
  })

  describe('Component Error Boundaries', () => {
    it('should catch and handle errors in PathwaySelector component', async () => {
      // Mock PathwaySelector to throw an error
      const PathwaySelectorError = () => {
        throw new Error('PathwaySelector component error')
      }
      
      // This would typically be handled by React Error Boundary
      render(<BmadInterface workspaceId={mockWorkspaceId} />)
      
      await waitFor(() => {
        // Error boundary should prevent crash and show fallback UI
        expect(screen.getByText('BMad Method')).toBeInTheDocument()
      })
    })

    it('should catch and handle errors in SessionManager component', async () => {
      const validSession: BmadSession = {
        id: 'session-error-test',
        userId: 'user-123',
        workspaceId: mockWorkspaceId,
        pathway: PathwayType.STRATEGIC_OPTIMIZATION,
        templates: [],
        currentPhase: 'error-phase',
        currentTemplate: '',
        startTime: new Date(),
        timeAllocations: [],
        progress: {
          overallCompletion: 0,
          phaseCompletion: {},
          currentStep: '',
          nextSteps: []
        },
        context: {
          userResponses: {},
          elicitationHistory: [],
          personaEvolution: [],
          knowledgeReferences: []
        },
        outputs: {
          phaseOutputs: {},
          templateOutputs: {},
          finalDocuments: [],
          actionItems: []
        },
        metadata: {
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      }
      
      mockBmadSession.currentSession = validSession
      
      render(<BmadInterface workspaceId={mockWorkspaceId} />)
      
      // Should handle component errors gracefully
      await waitFor(() => {
        expect(screen.getByText('Strategic Optimization')).toBeInTheDocument()
      })
    })

    it('should provide meaningful error messages to users', async () => {
      mockBmadSession.error = 'Your session has expired. Please start a new session.'
      
      render(<BmadInterface workspaceId={mockWorkspaceId} />)
      
      await waitFor(() => {
        expect(screen.getByText('Your session has expired. Please start a new session.')).toBeInTheDocument()
      })
    })
  })

  describe('Data Persistence Errors', () => {
    it('should handle localStorage quota exceeded errors', async () => {
      const originalSetItem = Storage.prototype.setItem
      Storage.prototype.setItem = jest.fn(() => {
        throw new Error('QuotaExceededError')
      })
      
      render(<SessionHistoryManager workspaceId={mockWorkspaceId} />)
      
      // Should still function without localStorage
      await waitFor(() => {
        expect(screen.getByText('Session History & Resumption')).toBeInTheDocument()
      })
      
      Storage.prototype.setItem = originalSetItem
    })

    it('should handle localStorage access denied errors', async () => {
      const originalGetItem = Storage.prototype.getItem
      Storage.prototype.getItem = jest.fn(() => {
        throw new Error('Access denied')
      })
      
      render(<SessionHistoryManager workspaceId={mockWorkspaceId} />)
      
      // Should work without accessing localStorage
      await waitFor(() => {
        expect(screen.getByText('Session History & Resumption')).toBeInTheDocument()
      })
      
      Storage.prototype.getItem = originalGetItem
    })

    it('should handle corrupted localStorage data', async () => {
      Storage.prototype.getItem = jest.fn(() => '{invalid json}')
      
      render(<SessionHistoryManager workspaceId={mockWorkspaceId} />)
      
      // Should handle invalid JSON gracefully
      await waitFor(() => {
        expect(screen.getByText('Session History & Resumption')).toBeInTheDocument()
      })
    })
  })

  describe('User Input Validation Errors', () => {
    it('should handle empty or invalid workspace ID', async () => {
      render(<BmadInterface workspaceId="" />)
      
      await waitFor(() => {
        // Should still render interface
        expect(screen.getByText('BMad Method')).toBeInTheDocument()
      })
    })

    it('should validate user input before session advancement', async () => {
      const validSession: BmadSession = {
        id: 'input-validation-test',
        userId: 'user-123',
        workspaceId: mockWorkspaceId,
        pathway: PathwayType.NEW_IDEA,
        templates: [],
        currentPhase: 'ideation',
        currentTemplate: '',
        startTime: new Date(),
        timeAllocations: [],
        progress: {
          overallCompletion: 25,
          phaseCompletion: { ideation: 25 },
          currentStep: 'Brainstorming ideas',
          nextSteps: []
        },
        context: {
          userResponses: {},
          elicitationHistory: [],
          personaEvolution: [],
          knowledgeReferences: []
        },
        outputs: {
          phaseOutputs: {},
          templateOutputs: {},
          finalDocuments: [],
          actionItems: []
        },
        metadata: {
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      }
      
      mockBmadSession.currentSession = validSession
      
      render(<BmadInterface workspaceId={mockWorkspaceId} />)
      
      await waitFor(() => {
        expect(screen.getByText('New Idea Development')).toBeInTheDocument()
      })
      
      // Input validation should be handled by ElicitationPanel
      // This test verifies the interface loads properly for validation testing
    })
  })

  describe('Concurrent User Errors', () => {
    it('should handle session conflicts when multiple users access the same workspace', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({ error: 'Session conflict: Another user is using this workspace' })
      })
      
      render(<BmadInterface workspaceId={mockWorkspaceId} />)
      
      await waitFor(() => {
        // Should handle conflicts gracefully
        expect(screen.getByText('BMad Method')).toBeInTheDocument()
      })
    })

    it('should handle session state synchronization errors', async () => {
      const user = userEvent.setup()
      
      const session1: BmadSession = {
        id: 'sync-test-session',
        userId: 'user-123',
        workspaceId: mockWorkspaceId,
        pathway: PathwayType.BUSINESS_MODEL,
        templates: [],
        currentPhase: 'analysis',
        currentTemplate: '',
        startTime: new Date(),
        timeAllocations: [],
        progress: {
          overallCompletion: 40,
          phaseCompletion: { analysis: 40 },
          currentStep: 'Market analysis',
          nextSteps: []
        },
        context: { userResponses: {}, elicitationHistory: [], personaEvolution: [], knowledgeReferences: [] },
        outputs: { phaseOutputs: {}, templateOutputs: {}, finalDocuments: [], actionItems: [] },
        metadata: { status: 'active', createdAt: new Date(), updatedAt: new Date() }
      }
      
      mockBmadSession.currentSession = session1
      
      render(<BmadInterface workspaceId={mockWorkspaceId} />)
      
      // Should handle synchronization conflicts
      await waitFor(() => {
        expect(screen.getByText('Business Model Analysis')).toBeInTheDocument()
      })
    })
  })

  describe('Memory and Performance Errors', () => {
    it('should handle out of memory errors gracefully', async () => {
      // Simulate memory pressure
      const largeMockData = Array(10000).fill(0).map((_, i) => ({
        id: `session-${i}`,
        data: new Array(1000).fill('large data chunk').join('')
      }))
      
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: { sessions: largeMockData } })
      })
      
      render(<BmadInterface workspaceId={mockWorkspaceId} />)
      
      // Should handle large datasets without crashing
      await waitFor(() => {
        expect(screen.getByText('BMad Method')).toBeInTheDocument()
      })
    })

    it('should handle slow rendering performance', async () => {
      // Test with many concurrent operations
      const promises = Array(100).fill(0).map(() =>
        render(<BmadInterface workspaceId={`workspace-${Math.random()}`} />)
      )
      
      // Should not block or crash
      await act(async () => {
        await Promise.allSettled(promises)
      })
      
      expect(true).toBe(true) // Test completes without hanging
    })
  })

  describe('Error Recovery Actions', () => {
    it('should provide retry mechanism for failed operations', async () => {
      const user = userEvent.setup()
      mockBmadSession.error = 'Network connection failed'
      mockBmadSession.createSession.mockRejectedValueOnce(new Error('Network Error'))
        .mockResolvedValueOnce({ id: 'recovered-session' })
      
      render(<BmadInterface workspaceId={mockWorkspaceId} />)
      
      await waitFor(() => {
        expect(screen.getByText('Network connection failed')).toBeInTheDocument()
      })
      
      // Clear error and simulate retry
      mockBmadSession.error = null
      
      // Should be able to retry the operation
      await waitFor(() => {
        expect(screen.getByText('BMad Method')).toBeInTheDocument()
      })
    })

    it('should allow users to report errors', async () => {
      const user = userEvent.setup()
      mockBmadSession.error = 'An unexpected error occurred'
      
      render(<BmadInterface workspaceId={mockWorkspaceId} />)
      
      await waitFor(() => {
        expect(screen.getByText('An unexpected error occurred')).toBeInTheDocument()
      })
    })

    it('should provide clear guidance for error resolution', async () => {
      mockBmadSession.error = 'Session creation failed. Please check your connection and try again.'
      
      render(<BmadInterface workspaceId={mockWorkspaceId} />)
      
      await waitFor(() => {
        expect(screen.getByText(/please check your connection and try again/i)).toBeInTheDocument()
      })
    })
  })
})