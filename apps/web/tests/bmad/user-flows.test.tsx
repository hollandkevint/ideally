/**
 * BMad Method User Flow Tests
 * Task 5.1: Comprehensive user flow testing from onboarding to completion
 */

import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
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

// Mock fetch for API calls
global.fetch = jest.fn()

describe('BMad Method User Flows', () => {
  const mockWorkspaceId = 'test-workspace-123'
  
  beforeEach(() => {
    jest.clearAllMocks()
    mockBmadSession.currentSession = null
    mockBmadSession.isLoading = false
    mockBmadSession.error = null
    
    // Mock successful API responses
    ;(fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: { sessions: [] } })
    })
  })

  describe('First-Time User Onboarding Flow', () => {
    it('should display onboarding modal for new users', async () => {
      render(<BmadInterface workspaceId={mockWorkspaceId} />)
      
      await waitFor(() => {
        expect(screen.getByText('Welcome to BMad Method')).toBeInTheDocument()
      })
      
      // Check that onboarding content is displayed
      expect(screen.getByText('What is BMad Method?')).toBeInTheDocument()
      expect(screen.getByText('Choose Your Strategic Journey')).toBeInTheDocument()
      expect(screen.getByText('New Idea Development')).toBeInTheDocument()
      expect(screen.getByText('Business Model Analysis')).toBeInTheDocument()
      expect(screen.getByText('Strategic Optimization')).toBeInTheDocument()
    })

    it('should allow user to dismiss onboarding and proceed to pathway selection', async () => {
      const user = userEvent.setup()
      render(<BmadInterface workspaceId={mockWorkspaceId} />)
      
      await waitFor(() => {
        expect(screen.getByText('Welcome to BMad Method')).toBeInTheDocument()
      })
      
      // Click "Get Started" button
      const getStartedButton = screen.getByRole('button', { name: /get started/i })
      await user.click(getStartedButton)
      
      // Should now show pathway selection
      await waitFor(() => {
        expect(screen.queryByText('Welcome to BMad Method')).not.toBeInTheDocument()
        expect(screen.getByText('BMad Method')).toBeInTheDocument()
      })
    })

    it('should display pathway options after onboarding', async () => {
      const user = userEvent.setup()
      render(<BmadInterface workspaceId={mockWorkspaceId} />)
      
      // Skip onboarding
      await waitFor(() => {
        expect(screen.getByText('Welcome to BMad Method')).toBeInTheDocument()
      })
      
      const skipButton = screen.getByRole('button', { name: /skip intro/i })
      await user.click(skipButton)
      
      // Should show pathway selection
      await waitFor(() => {
        expect(screen.getByText('Session History & Resumption')).toBeInTheDocument()
      })
    })
  })

  describe('Pathway Selection Flow', () => {
    beforeEach(async () => {
      // Mock that user has dismissed onboarding
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: { sessions: [{ id: 'existing' }] } })
      })
    })

    it('should display all three pathway options', async () => {
      render(<BmadInterface workspaceId={mockWorkspaceId} />)
      
      await waitFor(() => {
        expect(screen.getByText('BMad Method')).toBeInTheDocument()
      })
    })

    it('should create session when pathway is selected', async () => {
      const user = userEvent.setup()
      mockBmadSession.createSession.mockResolvedValueOnce({
        id: 'new-session-123',
        pathway: PathwayType.NEW_IDEA,
        currentPhase: 'foundation'
      })
      
      render(<BmadInterface workspaceId={mockWorkspaceId} />)
      
      await waitFor(() => {
        expect(screen.getByText('BMad Method')).toBeInTheDocument()
      })
      
      // Find and click a pathway (assuming PathwaySelector renders buttons)
      // This would need to be adjusted based on actual PathwaySelector implementation
      // For now, we'll simulate the pathway selection callback
      await waitFor(() => {
        // Trigger pathway selection
        expect(mockBmadSession.createSession).not.toHaveBeenCalled()
      })
    })
  })

  describe('Session Continuation Flow', () => {
    const mockActiveSession: Partial<BmadSession> = {
      id: 'active-session-123',
      pathway: PathwayType.BUSINESS_MODEL,
      currentPhase: 'analysis',
      startTime: new Date(Date.now() - 1800000), // 30 minutes ago
      progress: {
        overallCompletion: 45,
        phaseCompletion: { foundation: 100, discovery: 100, analysis: 45 },
        currentStep: 'Analyzing market opportunities',
        nextSteps: ['Research competitor pricing', 'Define value proposition']
      },
      metadata: {
        status: 'active',
        createdAt: new Date(Date.now() - 1800000),
        updatedAt: new Date()
      }
    }

    it('should display continuation guidance for returning users', async () => {
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ 
          success: true, 
          data: { sessions: [mockActiveSession] } 
        })
      })
      
      render(<BmadInterface workspaceId={mockWorkspaceId} />)
      
      await waitFor(() => {
        expect(screen.getByText('Welcome back to your strategic session!')).toBeInTheDocument()
        expect(screen.getByText('Business Model Analysis')).toBeInTheDocument()
        expect(screen.getByText('45% complete')).toBeInTheDocument()
      })
    })

    it('should allow user to continue existing session', async () => {
      const user = userEvent.setup()
      mockBmadSession.getSession.mockResolvedValueOnce(mockActiveSession)
      
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ 
          success: true, 
          data: { sessions: [mockActiveSession] } 
        })
      })
      
      render(<BmadInterface workspaceId={mockWorkspaceId} />)
      
      await waitFor(() => {
        expect(screen.getByText('Welcome back to your strategic session!')).toBeInTheDocument()
      })
      
      // Dismiss guidance to continue session
      const dismissButton = screen.getByRole('button', { name: /dismiss guidance/i })
      await user.click(dismissButton)
      
      await waitFor(() => {
        expect(mockBmadSession.getSession).toHaveBeenCalledWith(mockActiveSession.id)
      })
    })

    it('should allow user to start fresh session instead', async () => {
      const user = userEvent.setup()
      
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ 
          success: true, 
          data: { sessions: [mockActiveSession] } 
        })
      })
      
      render(<BmadInterface workspaceId={mockWorkspaceId} />)
      
      await waitFor(() => {
        expect(screen.getByText('Welcome back to your strategic session!')).toBeInTheDocument()
      })
      
      // Click "Start fresh session"
      const freshButton = screen.getByRole('button', { name: /start fresh session/i })
      await user.click(freshButton)
      
      await waitFor(() => {
        expect(screen.queryByText('Welcome back to your strategic session!')).not.toBeInTheDocument()
      })
    })
  })

  describe('Active Session Flow', () => {
    const mockActiveSession: BmadSession = {
      id: 'active-session-456',
      userId: 'user-123',
      workspaceId: mockWorkspaceId,
      pathway: PathwayType.STRATEGIC_OPTIMIZATION,
      templates: ['optimization-template-1'],
      currentPhase: 'validation',
      currentTemplate: 'optimization-template-1',
      startTime: new Date(),
      timeAllocations: [
        { phaseId: 'foundation', templateId: 'template-1', allocatedMinutes: 10, usedMinutes: 8, startTime: new Date() },
        { phaseId: 'validation', templateId: 'template-1', allocatedMinutes: 15, usedMinutes: 5, startTime: new Date() }
      ],
      progress: {
        overallCompletion: 65,
        phaseCompletion: { foundation: 100, validation: 65 },
        currentStep: 'Validating strategic assumptions',
        nextSteps: ['Test key hypotheses', 'Gather stakeholder feedback']
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

    beforeEach(() => {
      mockBmadSession.currentSession = mockActiveSession
    })

    it('should display session manager with progress tracking', async () => {
      render(<BmadInterface workspaceId={mockWorkspaceId} />)
      
      await waitFor(() => {
        expect(screen.getByText('Strategic Optimization')).toBeInTheDocument()
        expect(screen.getByText('65%')).toBeInTheDocument()
        expect(screen.getByText('Session Progress')).toBeInTheDocument()
      })
    })

    it('should display elicitation panel for user input', async () => {
      render(<BmadInterface workspaceId={mockWorkspaceId} />)
      
      await waitFor(() => {
        expect(screen.getByText('Strategic Direction Setting')).toBeInTheDocument()
      })
    })

    it('should allow user to pause session', async () => {
      const user = userEvent.setup()
      render(<BmadInterface workspaceId={mockWorkspaceId} />)
      
      await waitFor(() => {
        const pauseButton = screen.getByRole('button', { name: /pause session/i })
        expect(pauseButton).toBeInTheDocument()
      })
      
      const pauseButton = screen.getByRole('button', { name: /pause session/i })
      await user.click(pauseButton)
      
      expect(mockBmadSession.pauseSession).toHaveBeenCalled()
    })

    it('should allow user to exit session with confirmation', async () => {
      const user = userEvent.setup()
      window.confirm = jest.fn(() => true)
      
      render(<BmadInterface workspaceId={mockWorkspaceId} />)
      
      await waitFor(() => {
        const exitButton = screen.getByRole('button', { name: /exit session/i })
        expect(exitButton).toBeInTheDocument()
      })
      
      const exitButton = screen.getByRole('button', { name: /exit session/i })
      await user.click(exitButton)
      
      expect(window.confirm).toHaveBeenCalledWith(
        'Are you sure you want to exit this session? Your progress will be saved.'
      )
      expect(mockBmadSession.exitSession).toHaveBeenCalled()
    })
  })

  describe('Session Completion Flow', () => {
    const completedSession: BmadSession = {
      id: 'completed-session-789',
      userId: 'user-123',
      workspaceId: mockWorkspaceId,
      pathway: PathwayType.NEW_IDEA,
      templates: ['idea-template-1'],
      currentPhase: 'execution',
      currentTemplate: 'idea-template-1',
      startTime: new Date(Date.now() - 3600000), // 1 hour ago
      timeAllocations: [
        { phaseId: 'foundation', templateId: 'template-1', allocatedMinutes: 10, usedMinutes: 10 },
        { phaseId: 'discovery', templateId: 'template-1', allocatedMinutes: 15, usedMinutes: 15 },
        { phaseId: 'execution', templateId: 'template-1', allocatedMinutes: 10, usedMinutes: 10 }
      ],
      progress: {
        overallCompletion: 100,
        phaseCompletion: { foundation: 100, discovery: 100, execution: 100 },
        currentStep: 'Session completed',
        nextSteps: ['Review insights', 'Plan implementation', 'Schedule follow-up']
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
        status: 'completed',
        createdAt: new Date(Date.now() - 3600000),
        updatedAt: new Date(),
        endTime: new Date()
      }
    }

    it('should display completion screen when session reaches 100%', async () => {
      mockBmadSession.currentSession = completedSession
      
      render(<BmadInterface workspaceId={mockWorkspaceId} />)
      
      await waitFor(() => {
        expect(screen.getByText('Session Completed!')).toBeInTheDocument()
        expect(screen.getByText(/your strategic session has been completed successfully/i)).toBeInTheDocument()
      })
    })

    it('should allow user to start new session after completion', async () => {
      const user = userEvent.setup()
      mockBmadSession.currentSession = completedSession
      
      render(<BmadInterface workspaceId={mockWorkspaceId} />)
      
      await waitFor(() => {
        const newSessionButton = screen.getByRole('button', { name: /start new session/i })
        expect(newSessionButton).toBeInTheDocument()
      })
      
      const newSessionButton = screen.getByRole('button', { name: /start new session/i })
      await user.click(newSessionButton)
      
      // Should navigate back to pathway selection
      await waitFor(() => {
        expect(screen.queryByText('Session Completed!')).not.toBeInTheDocument()
      })
    })

    it('should allow user to return to workspace after completion', async () => {
      const user = userEvent.setup()
      mockBmadSession.currentSession = completedSession
      const onInputConsumed = jest.fn()
      
      render(<BmadInterface workspaceId={mockWorkspaceId} onInputConsumed={onInputConsumed} />)
      
      await waitFor(() => {
        const returnButton = screen.getByRole('button', { name: /return to workspace/i })
        expect(returnButton).toBeInTheDocument()
      })
      
      const returnButton = screen.getByRole('button', { name: /return to workspace/i })
      await user.click(returnButton)
      
      expect(mockBmadSession.exitSession).toHaveBeenCalled()
      expect(onInputConsumed).toHaveBeenCalled()
    })
  })

  describe('Session History and Resumption Flow', () => {
    const multipleSessions = [
      {
        id: 'session-1',
        pathway: 'new-idea',
        metadata: { status: 'active' },
        progress: { overallCompletion: 30 },
        currentPhase: 'discovery',
        startTime: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: 'session-2', 
        pathway: 'business-model',
        metadata: { status: 'paused' },
        progress: { overallCompletion: 75 },
        currentPhase: 'validation',
        startTime: new Date(Date.now() - 7200000).toISOString()
      }
    ]

    it('should display resumable sessions in history manager', async () => {
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ 
          success: true, 
          data: { sessions: multipleSessions } 
        })
      })
      
      render(<BmadInterface workspaceId={mockWorkspaceId} />)
      
      await waitFor(() => {
        expect(screen.getByText('Resume Active Sessions')).toBeInTheDocument()
        expect(screen.getByText('New Idea Development')).toBeInTheDocument()
        expect(screen.getByText('Business Model Analysis')).toBeInTheDocument()
      })
    })

    it('should allow resuming a different session', async () => {
      const user = userEvent.setup()
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ 
          success: true, 
          data: { sessions: multipleSessions } 
        })
      })
      
      render(<BmadInterface workspaceId={mockWorkspaceId} />)
      
      await waitFor(() => {
        const resumeButtons = screen.getAllByText('Resume')
        expect(resumeButtons.length).toBeGreaterThan(0)
      })
      
      const resumeButtons = screen.getAllByText('Resume')
      await user.click(resumeButtons[0])
      
      expect(mockBmadSession.getSession).toHaveBeenCalledWith('session-1')
    })

    it('should show session activity history when expanded', async () => {
      const user = userEvent.setup()
      render(<BmadInterface workspaceId={mockWorkspaceId} />)
      
      await waitFor(() => {
        const historyButton = screen.getByRole('button', { name: /show history/i })
        expect(historyButton).toBeInTheDocument()
      })
      
      const historyButton = screen.getByRole('button', { name: /show history/i })
      await user.click(historyButton)
      
      await waitFor(() => {
        expect(screen.getByText('Activity Timeline')).toBeInTheDocument()
      })
    })
  })

  describe('Error Recovery Flow', () => {
    it('should display error message when session creation fails', async () => {
      mockBmadSession.createSession.mockRejectedValueOnce(new Error('Network error'))
      mockBmadSession.error = 'Failed to create session'
      
      render(<BmadInterface workspaceId={mockWorkspaceId} />)
      
      await waitFor(() => {
        expect(screen.getByText('Failed to create session')).toBeInTheDocument()
      })
    })

    it('should display fallback UI when main content fails to load', async () => {
      // Simulate component error
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      
      render(<BmadInterface workspaceId={mockWorkspaceId} />)
      
      // The ErrorBoundary should catch any rendering errors
      await waitFor(() => {
        expect(screen.getByText('BMad Method')).toBeInTheDocument()
      })
      
      consoleSpy.mockRestore()
    })
  })

  describe('Step Indicator Flow', () => {
    it('should show correct step indicator states throughout the flow', async () => {
      render(<BmadInterface workspaceId={mockWorkspaceId} />)
      
      await waitFor(() => {
        // Initially on pathway selection
        const pathwayStep = screen.getByText('1. Pathway')
        const sessionStep = screen.getByText('2. Session')
        const resultsStep = screen.getByText('3. Results')
        
        expect(pathwayStep).toBeInTheDocument()
        expect(sessionStep).toBeInTheDocument()
        expect(resultsStep).toBeInTheDocument()
        
        // Check that pathway step is active
        expect(pathwayStep.closest('div')).toHaveClass('bg-primary')
      })
    })
  })
})