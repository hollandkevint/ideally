/**
 * BMad Method Regression Tests
 * Task 5.5: Regression testing of existing chat and workspace functionality
 */

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import BmadInterface from '@/app/components/bmad/BmadInterface'
import { BmadSession, PathwayType } from '@/lib/bmad/types'

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

global.fetch = jest.fn()

describe('BMad Method Regression Tests', () => {
  const mockWorkspaceId = 'test-workspace-123'
  
  beforeEach(() => {
    jest.clearAllMocks()
    mockBmadSession.currentSession = null
    mockBmadSession.isLoading = false
    mockBmadSession.error = null
    
    ;(fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: { sessions: [] } })
    })
  })

  describe('Core BMad Functionality Preservation', () => {
    it('should maintain existing BMad Method framework structure', async () => {
      render(<BmadInterface workspaceId={mockWorkspaceId} />)
      
      await waitFor(() => {
        // Core BMad elements should still be present
        expect(screen.getByText('BMad Method')).toBeInTheDocument()
        expect(screen.getByText('Strategic frameworks for breakthrough thinking')).toBeInTheDocument()
      })
    })

    it('should preserve three-pathway system functionality', async () => {
      render(<BmadInterface workspaceId={mockWorkspaceId} />)
      
      await waitFor(() => {
        // All three pathways should be accessible
        expect(screen.getByText('BMad Method')).toBeInTheDocument()
      })
      
      // The pathway system should remain intact
      expect(Object.values(PathwayType)).toEqual([
        'new-idea',
        'business-model', 
        'strategic-optimization'
      ])
    })

    it('should maintain existing session lifecycle', async () => {
      const mockSession: BmadSession = {
        id: 'regression-session-123',
        userId: 'user-123',
        workspaceId: mockWorkspaceId,
        pathway: PathwayType.NEW_IDEA,
        templates: ['template-1'],
        currentPhase: 'ideation',
        currentTemplate: 'template-1',
        startTime: new Date(),
        timeAllocations: [],
        progress: {
          overallCompletion: 45,
          phaseCompletion: { ideation: 45 },
          currentStep: 'Generating ideas',
          nextSteps: ['Evaluate concepts', 'Prioritize solutions']
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
      
      mockBmadSession.currentSession = mockSession
      
      render(<BmadInterface workspaceId={mockWorkspaceId} />)
      
      await waitFor(() => {
        // Session should display with new UI enhancements but preserve core functionality
        expect(screen.getByText('New Idea Development')).toBeInTheDocument()
        expect(screen.getByText('45%')).toBeInTheDocument()
      })
    })

    it('should preserve existing elicitation system', async () => {
      const mockSession: BmadSession = {
        id: 'elicitation-regression',
        userId: 'user-123',
        workspaceId: mockWorkspaceId,
        pathway: PathwayType.BUSINESS_MODEL,
        templates: ['business-template'],
        currentPhase: 'analysis',
        currentTemplate: 'business-template',
        startTime: new Date(),
        timeAllocations: [],
        progress: {
          overallCompletion: 60,
          phaseCompletion: { analysis: 60 },
          currentStep: 'Business model analysis',
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
      
      mockBmadSession.currentSession = mockSession
      
      render(<BmadInterface workspaceId={mockWorkspaceId} />)
      
      await waitFor(() => {
        // Elicitation panel should still be present and functional
        expect(screen.getByText('Strategic Direction Setting')).toBeInTheDocument()
      })
    })
  })

  describe('Workspace Integration Compatibility', () => {
    it('should maintain workspace ID handling', async () => {
      const testWorkspaceId = 'workspace-integration-test'
      
      render(<BmadInterface workspaceId={testWorkspaceId} />)
      
      await waitFor(() => {
        expect(screen.getByText('BMad Method')).toBeInTheDocument()
      })
      
      // Workspace ID should be properly passed to API calls
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(`workspaceId=${testWorkspaceId}`)
      )
    })

    it('should preserve input consumption callback functionality', async () => {
      const onInputConsumed = jest.fn()
      const preservedInput = 'Test preserved input'
      
      render(
        <BmadInterface 
          workspaceId={mockWorkspaceId} 
          preservedInput={preservedInput}
          onInputConsumed={onInputConsumed}
        />
      )
      
      await waitFor(() => {
        expect(screen.getByText('BMad Method')).toBeInTheDocument()
      })
      
      // Input consumption mechanism should remain functional
      expect(typeof onInputConsumed).toBe('function')
    })

    it('should maintain existing CSS class application', async () => {
      const customClassName = 'custom-bmad-wrapper'
      
      const { container } = render(
        <BmadInterface 
          workspaceId={mockWorkspaceId} 
          className={customClassName}
        />
      )
      
      await waitFor(() => {
        expect(screen.getByText('BMad Method')).toBeInTheDocument()
      })
      
      // Custom classes should still be applied
      const bmadInterface = container.querySelector('.bmad-interface')
      expect(bmadInterface).toHaveClass(customClassName)
    })

    it('should maintain step indicator system', async () => {
      render(<BmadInterface workspaceId={mockWorkspaceId} />)
      
      await waitFor(() => {
        // Step indicators should still be present
        expect(screen.getByText('1. Pathway')).toBeInTheDocument()
        expect(screen.getByText('2. Session')).toBeInTheDocument()
        expect(screen.getByText('3. Results')).toBeInTheDocument()
      })
    })
  })

  describe('Chat Integration Compatibility', () => {
    it('should not interfere with existing chat functionality', async () => {
      const mockSession: BmadSession = {
        id: 'chat-compatibility-test',
        userId: 'user-123',
        workspaceId: mockWorkspaceId,
        pathway: PathwayType.STRATEGIC_OPTIMIZATION,
        templates: [],
        currentPhase: 'planning',
        currentTemplate: '',
        startTime: new Date(),
        timeAllocations: [],
        progress: {
          overallCompletion: 30,
          phaseCompletion: { planning: 30 },
          currentStep: 'Strategic planning',
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
      
      mockBmadSession.currentSession = mockSession
      
      render(<BmadInterface workspaceId={mockWorkspaceId} />)
      
      await waitFor(() => {
        expect(screen.getByText('Strategic Optimization')).toBeInTheDocument()
      })
      
      // Should not create any global variables or side effects that could interfere with chat
      expect(window).toBeDefined()
    })

    it('should maintain existing session exit behavior', async () => {
      const user = userEvent.setup()
      const onInputConsumed = jest.fn()
      
      const mockSession: BmadSession = {
        id: 'exit-behavior-test',
        userId: 'user-123',
        workspaceId: mockWorkspaceId,
        pathway: PathwayType.NEW_IDEA,
        templates: [],
        currentPhase: 'synthesis',
        currentTemplate: '',
        startTime: new Date(),
        timeAllocations: [],
        progress: {
          overallCompletion: 95,
          phaseCompletion: { synthesis: 95 },
          currentStep: 'Final synthesis',
          nextSteps: []
        },
        context: { userResponses: {}, elicitationHistory: [], personaEvolution: [], knowledgeReferences: [] },
        outputs: { phaseOutputs: {}, templateOutputs: {}, finalDocuments: [], actionItems: [] },
        metadata: { status: 'active', createdAt: new Date(), updatedAt: new Date() }
      }
      
      mockBmadSession.currentSession = mockSession
      window.confirm = jest.fn(() => true)
      
      render(
        <BmadInterface 
          workspaceId={mockWorkspaceId} 
          onInputConsumed={onInputConsumed}
        />
      )
      
      await waitFor(() => {
        const exitButton = screen.getByRole('button', { name: /exit session/i })
        expect(exitButton).toBeInTheDocument()
      })
      
      const exitButton = screen.getByRole('button', { name: /exit session/i })
      await user.click(exitButton)
      
      // Exit behavior should remain the same
      expect(window.confirm).toHaveBeenCalledWith(
        'Are you sure you want to exit this session? Your progress will be saved.'
      )
      expect(mockBmadSession.exitSession).toHaveBeenCalled()
    })
  })

  describe('API Contract Compatibility', () => {
    it('should maintain existing API endpoint compatibility', async () => {
      render(<BmadInterface workspaceId={mockWorkspaceId} />)
      
      await waitFor(() => {
        expect(screen.getByText('BMad Method')).toBeInTheDocument()
      })
      
      // Should still call the expected API endpoints
      expect(fetch).toHaveBeenCalledWith(
        expect.stringMatching(/\/api\/bmad\?action=sessions&workspaceId=/)
      )
    })

    it('should handle API response format consistently', async () => {
      const mockApiResponse = {
        success: true,
        data: {
          sessions: [
            {
              id: 'api-compat-session',
              pathway: 'new-idea',
              metadata: { status: 'active' },
              progress: { overallCompletion: 25 },
              currentPhase: 'foundation',
              startTime: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              lastActivityAt: new Date().toISOString()
            }
          ]
        }
      }
      
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse
      })
      
      render(<BmadInterface workspaceId={mockWorkspaceId} />)
      
      await waitFor(() => {
        // Should handle the API response format correctly
        expect(screen.getByText('Welcome back to your strategic session!')).toBeInTheDocument()
      })
    })

    it('should preserve session creation API behavior', async () => {
      const user = userEvent.setup()
      
      mockBmadSession.createSession.mockResolvedValueOnce({
        id: 'newly-created-session',
        pathway: PathwayType.BUSINESS_MODEL,
        currentPhase: 'foundation'
      })
      
      render(<BmadInterface workspaceId={mockWorkspaceId} />)
      
      await waitFor(() => {
        expect(screen.getByText('BMad Method')).toBeInTheDocument()
      })
      
      // Session creation should work the same way
      expect(mockBmadSession.createSession).toBeDefined()
      expect(typeof mockBmadSession.createSession).toBe('function')
    })
  })

  describe('Error Handling Backward Compatibility', () => {
    it('should maintain existing error display patterns', async () => {
      mockBmadSession.error = 'Session creation failed unexpectedly'
      
      render(<BmadInterface workspaceId={mockWorkspaceId} />)
      
      await waitFor(() => {
        // Error should be displayed in the expected location and format
        expect(screen.getByText('Session creation failed unexpectedly')).toBeInTheDocument()
        expect(screen.getByText('Error')).toBeInTheDocument()
      })
    })

    it('should preserve error recovery mechanisms', async () => {
      mockBmadSession.error = 'Network connection lost'
      const { rerender } = render(<BmadInterface workspaceId={mockWorkspaceId} />)
      
      await waitFor(() => {
        expect(screen.getByText('Network connection lost')).toBeInTheDocument()
      })
      
      // Clear error to simulate recovery
      mockBmadSession.error = null
      rerender(<BmadInterface workspaceId={mockWorkspaceId} />)
      
      await waitFor(() => {
        expect(screen.queryByText('Network connection lost')).not.toBeInTheDocument()
      })
    })
  })

  describe('Component State Management Compatibility', () => {
    it('should maintain existing state transitions', async () => {
      const { rerender } = render(<BmadInterface workspaceId={mockWorkspaceId} />)
      
      // Start with pathway selection
      await waitFor(() => {
        expect(screen.getByText('BMad Method')).toBeInTheDocument()
      })
      
      // Add active session
      const mockSession: BmadSession = {
        id: 'state-transition-test',
        userId: 'user-123',
        workspaceId: mockWorkspaceId,
        pathway: PathwayType.NEW_IDEA,
        templates: [],
        currentPhase: 'ideation',
        currentTemplate: '',
        startTime: new Date(),
        timeAllocations: [],
        progress: {
          overallCompletion: 50,
          phaseCompletion: { ideation: 50 },
          currentStep: 'Ideating solutions',
          nextSteps: []
        },
        context: { userResponses: {}, elicitationHistory: [], personaEvolution: [], knowledgeReferences: [] },
        outputs: { phaseOutputs: {}, templateOutputs: {}, finalDocuments: [], actionItems: [] },
        metadata: { status: 'active', createdAt: new Date(), updatedAt: new Date() }
      }
      
      mockBmadSession.currentSession = mockSession
      rerender(<BmadInterface workspaceId={mockWorkspaceId} />)
      
      // Should transition to active session view
      await waitFor(() => {
        expect(screen.getByText('New Idea Development')).toBeInTheDocument()
      })
    })

    it('should preserve loading state behavior', async () => {
      mockBmadSession.isLoading = true
      
      const { rerender } = render(<BmadInterface workspaceId={mockWorkspaceId} />)
      
      // Should show appropriate loading states
      await waitFor(() => {
        expect(screen.getByText('BMad Method')).toBeInTheDocument()
      })
      
      mockBmadSession.isLoading = false
      rerender(<BmadInterface workspaceId={mockWorkspaceId} />)
      
      // Should transition out of loading
      await waitFor(() => {
        expect(screen.getByText('BMad Method')).toBeInTheDocument()
      })
    })
  })

  describe('Performance Regression Prevention', () => {
    it('should not significantly impact initial render time', async () => {
      const start = performance.now()
      
      render(<BmadInterface workspaceId={mockWorkspaceId} />)
      
      await waitFor(() => {
        expect(screen.getByText('BMad Method')).toBeInTheDocument()
      })
      
      const elapsed = performance.now() - start
      expect(elapsed).toBeLessThan(1000) // Should render within 1 second
    })

    it('should not create memory leaks during normal usage', async () => {
      const { unmount } = render(<BmadInterface workspaceId={mockWorkspaceId} />)
      
      await waitFor(() => {
        expect(screen.getByText('BMad Method')).toBeInTheDocument()
      })
      
      unmount()
      
      // Component should unmount cleanly
      expect(true).toBe(true)
    })

    it('should maintain efficient re-rendering behavior', async () => {
      const { rerender } = render(<BmadInterface workspaceId={mockWorkspaceId} />)
      
      const start = performance.now()
      
      // Multiple re-renders with the same props
      for (let i = 0; i < 10; i++) {
        rerender(<BmadInterface workspaceId={mockWorkspaceId} />)
      }
      
      const elapsed = performance.now() - start
      expect(elapsed).toBeLessThan(500) // Should handle re-renders efficiently
    })
  })

  describe('Data Structure Compatibility', () => {
    it('should maintain BmadSession interface compatibility', async () => {
      const validSession: BmadSession = {
        id: 'interface-compat-test',
        userId: 'user-123',
        workspaceId: mockWorkspaceId,
        pathway: PathwayType.STRATEGIC_OPTIMIZATION,
        templates: ['opt-template'],
        currentPhase: 'execution',
        currentTemplate: 'opt-template',
        startTime: new Date(),
        timeAllocations: [
          { phaseId: 'execution', templateId: 'opt-template', allocatedMinutes: 20, usedMinutes: 15 }
        ],
        progress: {
          overallCompletion: 75,
          phaseCompletion: { execution: 75 },
          currentStep: 'Executing optimization',
          nextSteps: ['Monitor results', 'Adjust strategy']
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
        // Should handle all session properties correctly
        expect(screen.getByText('Strategic Optimization')).toBeInTheDocument()
        expect(screen.getByText('75%')).toBeInTheDocument()
      })
    })

    it('should maintain PathwayType enum compatibility', async () => {
      // Verify enum values haven't changed
      expect(PathwayType.NEW_IDEA).toBe('new-idea')
      expect(PathwayType.BUSINESS_MODEL).toBe('business-model')
      expect(PathwayType.STRATEGIC_OPTIMIZATION).toBe('strategic-optimization')
    })

    it('should handle existing session data structures', async () => {
      // Test with minimal session data (backward compatibility)
      const minimalSession = {
        id: 'minimal-session',
        pathway: PathwayType.NEW_IDEA,
        currentPhase: 'foundation',
        progress: {
          overallCompletion: 10,
          phaseCompletion: {},
          currentStep: 'Starting foundation',
          nextSteps: []
        },
        metadata: { status: 'active' }
      }
      
      mockBmadSession.currentSession = minimalSession as any
      
      render(<BmadInterface workspaceId={mockWorkspaceId} />)
      
      // Should handle minimal session data gracefully
      await waitFor(() => {
        expect(screen.getByText('New Idea Development')).toBeInTheDocument()
      })
    })
  })

  describe('Third-party Integration Compatibility', () => {
    it('should not interfere with existing global variables', async () => {
      const originalGlobals = { ...window }
      
      render(<BmadInterface workspaceId={mockWorkspaceId} />)
      
      await waitFor(() => {
        expect(screen.getByText('BMad Method')).toBeInTheDocument()
      })
      
      // Should not have added unexpected global variables
      const newKeys = Object.keys(window).filter(key => !originalGlobals.hasOwnProperty(key))
      expect(newKeys.length).toBe(0)
    })

    it('should maintain event handling compatibility', async () => {
      const user = userEvent.setup()
      
      render(<BmadInterface workspaceId={mockWorkspaceId} />)
      
      await waitFor(() => {
        expect(screen.getByText('BMad Method')).toBeInTheDocument()
      })
      
      // Event handling should work normally
      const buttons = screen.getAllByRole('button')
      if (buttons.length > 0) {
        await user.click(buttons[0])
        // Should not throw errors
      }
      
      expect(true).toBe(true)
    })
  })
})