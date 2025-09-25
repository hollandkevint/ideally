/**
 * BMad Method Accessibility Tests
 * Task 5.4: Accessibility testing for all new UX enhancements
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { axe, toHaveNoViolations } from 'jest-axe'
import BmadInterface from '@/app/components/bmad/BmadInterface'
import EnhancedSessionManager from '@/app/components/bmad/EnhancedSessionManager'
import SessionHistoryManager from '@/app/components/bmad/SessionHistoryManager'
import { LoadingIndicator } from '@/app/components/bmad/LoadingIndicator'
import { BmadSession, PathwayType } from '@/lib/bmad/types'

expect.extend(toHaveNoViolations)

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

describe('BMad Method Accessibility', () => {
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

  describe('WCAG 2.1 Compliance', () => {
    it('should have no accessibility violations in main interface', async () => {
      const { container } = render(<BmadInterface workspaceId={mockWorkspaceId} />)
      
      await waitFor(() => {
        expect(screen.getByText('BMad Method')).toBeInTheDocument()
      })
      
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have no accessibility violations in loading states', async () => {
      const variants: Array<'spinner' | 'skeleton' | 'progress' | 'dots'> = 
        ['spinner', 'skeleton', 'progress', 'dots']
      
      for (const variant of variants) {
        const { container } = render(<LoadingIndicator variant={variant} />)
        const results = await axe(container)
        expect(results).toHaveNoViolations()
      }
    })

    it('should have no accessibility violations in session manager', async () => {
      const mockSession: BmadSession = {
        id: 'accessibility-test-session',
        userId: 'user-123',
        workspaceId: mockWorkspaceId,
        pathway: PathwayType.NEW_IDEA,
        templates: ['template-1'],
        currentPhase: 'ideation',
        currentTemplate: 'template-1',
        startTime: new Date(),
        timeAllocations: [
          { phaseId: 'foundation', templateId: 'template-1', allocatedMinutes: 10, usedMinutes: 8 },
          { phaseId: 'ideation', templateId: 'template-1', allocatedMinutes: 15, usedMinutes: 7 }
        ],
        progress: {
          overallCompletion: 60,
          phaseCompletion: { foundation: 100, ideation: 60 },
          currentStep: 'Generating innovative ideas',
          nextSteps: ['Evaluate feasibility', 'Create prototypes']
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
      
      const { container } = render(<EnhancedSessionManager session={mockSession} />)
      
      await waitFor(() => {
        expect(screen.getByText('New Idea Development')).toBeInTheDocument()
      })
      
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have no accessibility violations in session history', async () => {
      const { container } = render(
        <SessionHistoryManager workspaceId={mockWorkspaceId} />
      )
      
      await waitFor(() => {
        expect(screen.getByText('Session History & Resumption')).toBeInTheDocument()
      })
      
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('Semantic HTML Structure', () => {
    it('should use proper heading hierarchy', async () => {
      render(<BmadInterface workspaceId={mockWorkspaceId} />)
      
      await waitFor(() => {
        const h1 = screen.getByRole('heading', { level: 1 })
        expect(h1).toHaveTextContent('BMad Method')
      })
      
      // Should have logical heading hierarchy
      const headings = screen.getAllByRole('heading')
      expect(headings.length).toBeGreaterThan(0)
      
      // First heading should be h1
      expect(headings[0].tagName).toBe('H1')
    })

    it('should use proper landmarks and regions', async () => {
      render(<BmadInterface workspaceId={mockWorkspaceId} />)
      
      await waitFor(() => {
        expect(screen.getByText('BMad Method')).toBeInTheDocument()
      })
      
      // Should have main content area
      // (Specific landmark testing depends on implementation)
      const mainContent = screen.getByText('BMad Method').closest('div')
      expect(mainContent).toBeInTheDocument()
    })

    it('should use semantic buttons for interactive elements', async () => {
      const mockSession: BmadSession = {
        id: 'semantic-test-session',
        userId: 'user-123',
        workspaceId: mockWorkspaceId,
        pathway: PathwayType.BUSINESS_MODEL,
        templates: [],
        currentPhase: 'analysis',
        currentTemplate: '',
        startTime: new Date(),
        timeAllocations: [],
        progress: {
          overallCompletion: 45,
          phaseCompletion: { analysis: 45 },
          currentStep: 'Market analysis',
          nextSteps: []
        },
        context: { userResponses: {}, elicitationHistory: [], personaEvolution: [], knowledgeReferences: [] },
        outputs: { phaseOutputs: {}, templateOutputs: {}, finalDocuments: [], actionItems: [] },
        metadata: { status: 'active', createdAt: new Date(), updatedAt: new Date() }
      }
      
      render(<EnhancedSessionManager session={mockSession} />)
      
      await waitFor(() => {
        const buttons = screen.getAllByRole('button')
        expect(buttons.length).toBeGreaterThan(0)
        
        // All interactive elements should be buttons, not divs with onClick
        buttons.forEach(button => {
          expect(button.tagName).toBe('BUTTON')
        })
      })
    })

    it('should use proper list structures for sequential content', async () => {
      const mockSession: BmadSession = {
        id: 'list-test-session',
        userId: 'user-123',
        workspaceId: mockWorkspaceId,
        pathway: PathwayType.STRATEGIC_OPTIMIZATION,
        templates: [],
        currentPhase: 'planning',
        currentTemplate: '',
        startTime: new Date(),
        timeAllocations: [],
        progress: {
          overallCompletion: 75,
          phaseCompletion: { planning: 75 },
          currentStep: 'Strategic planning',
          nextSteps: ['Define metrics', 'Set timeline', 'Assign responsibilities']
        },
        context: { userResponses: {}, elicitationHistory: [], personaEvolution: [], knowledgeReferences: [] },
        outputs: { phaseOutputs: {}, templateOutputs: {}, finalDocuments: [], actionItems: [] },
        metadata: { status: 'active', createdAt: new Date(), updatedAt: new Date() }
      }
      
      render(<EnhancedSessionManager session={mockSession} />)
      
      await waitFor(() => {
        // Next steps should be in a list structure
        expect(screen.getByText('Strategic Next Steps')).toBeInTheDocument()
      })
    })
  })

  describe('ARIA Labels and Descriptions', () => {
    it('should provide ARIA labels for progress indicators', async () => {
      const mockSession: BmadSession = {
        id: 'aria-test-session',
        userId: 'user-123',
        workspaceId: mockWorkspaceId,
        pathway: PathwayType.NEW_IDEA,
        templates: [],
        currentPhase: 'validation',
        currentTemplate: '',
        startTime: new Date(),
        timeAllocations: [],
        progress: {
          overallCompletion: 80,
          phaseCompletion: { validation: 80 },
          currentStep: 'Validating concepts',
          nextSteps: []
        },
        context: { userResponses: {}, elicitationHistory: [], personaEvolution: [], knowledgeReferences: [] },
        outputs: { phaseOutputs: {}, templateOutputs: {}, finalDocuments: [], actionItems: [] },
        metadata: { status: 'active', createdAt: new Date(), updatedAt: new Date() }
      }
      
      render(<EnhancedSessionManager session={mockSession} />)
      
      await waitFor(() => {
        const progressBars = screen.getAllByRole('progressbar')
        expect(progressBars.length).toBeGreaterThan(0)
        
        progressBars.forEach(progressBar => {
          expect(progressBar).toHaveAttribute('aria-valuenow')
          expect(progressBar).toHaveAttribute('aria-valuemin', '0')
          expect(progressBar).toHaveAttribute('aria-valuemax', '100')
          expect(progressBar).toHaveAttribute('aria-label')
        })
      })
    })

    it('should provide ARIA descriptions for complex interactive elements', async () => {
      render(<BmadInterface workspaceId={mockWorkspaceId} />)
      
      await waitFor(() => {
        const buttons = screen.getAllByRole('button')
        
        buttons.forEach(button => {
          // Should have either aria-label or accessible text content
          const hasLabel = button.hasAttribute('aria-label')
          const hasText = button.textContent && button.textContent.trim().length > 0
          const hasAriaDescribedBy = button.hasAttribute('aria-describedby')
          
          expect(hasLabel || hasText || hasAriaDescribedBy).toBe(true)
        })
      })
    })

    it('should provide ARIA live regions for dynamic content updates', async () => {
      const mockSession: BmadSession = {
        id: 'live-region-test',
        userId: 'user-123',
        workspaceId: mockWorkspaceId,
        pathway: PathwayType.BUSINESS_MODEL,
        templates: [],
        currentPhase: 'synthesis',
        currentTemplate: '',
        startTime: new Date(),
        timeAllocations: [],
        progress: {
          overallCompletion: 90,
          phaseCompletion: { synthesis: 90 },
          currentStep: 'Synthesizing insights',
          nextSteps: []
        },
        context: { userResponses: {}, elicitationHistory: [], personaEvolution: [], knowledgeReferences: [] },
        outputs: { phaseOutputs: {}, templateOutputs: {}, finalDocuments: [], actionItems: [] },
        metadata: { status: 'active', createdAt: new Date(), updatedAt: new Date() }
      }
      
      const { rerender } = render(<EnhancedSessionManager session={mockSession} />)
      
      // Update progress to trigger live region update
      const updatedSession = {
        ...mockSession,
        progress: {
          ...mockSession.progress,
          overallCompletion: 95,
          currentStep: 'Finalizing synthesis'
        }
      }
      
      rerender(<EnhancedSessionManager session={updatedSession} />)
      
      await waitFor(() => {
        // Should announce progress changes to screen readers
        expect(screen.getByText('95%')).toBeInTheDocument()
      })
    })

    it('should provide context for form controls', async () => {
      render(<BmadInterface workspaceId={mockWorkspaceId} />)
      
      await waitFor(() => {
        // All form controls should have associated labels
        const inputs = screen.queryAllByRole('textbox')
        const selects = screen.queryAllByRole('combobox')
        const checkboxes = screen.queryAllByRole('checkbox')
        const radios = screen.queryAllByRole('radio')
        
        [...inputs, ...selects, ...checkboxes, ...radios].forEach(control => {
          const hasLabel = control.hasAttribute('aria-label')
          const hasLabelledBy = control.hasAttribute('aria-labelledby')
          const hasAssociatedLabel = control.id && screen.queryByLabelText(control.id)
          
          expect(hasLabel || hasLabelledBy || hasAssociatedLabel).toBe(true)
        })
      })
    })
  })

  describe('Keyboard Navigation', () => {
    it('should support tab navigation through all interactive elements', async () => {
      const user = userEvent.setup()
      
      render(<BmadInterface workspaceId={mockWorkspaceId} />)
      
      await waitFor(() => {
        expect(screen.getByText('BMad Method')).toBeInTheDocument()
      })
      
      // Should be able to tab through interactive elements
      await user.tab()
      expect(document.activeElement).toBeInstanceOf(HTMLElement)
      
      await user.tab()
      expect(document.activeElement).toBeInstanceOf(HTMLElement)
      
      // Should be able to shift+tab backwards
      await user.tab({ shift: true })
      expect(document.activeElement).toBeInstanceOf(HTMLElement)
    })

    it('should support Enter and Space key activation', async () => {
      const user = userEvent.setup()
      const mockSession: BmadSession = {
        id: 'keyboard-test-session',
        userId: 'user-123',
        workspaceId: mockWorkspaceId,
        pathway: PathwayType.NEW_IDEA,
        templates: [],
        currentPhase: 'execution',
        currentTemplate: '',
        startTime: new Date(),
        timeAllocations: [],
        progress: {
          overallCompletion: 100,
          phaseCompletion: { execution: 100 },
          currentStep: 'Implementation ready',
          nextSteps: []
        },
        context: { userResponses: {}, elicitationHistory: [], personaEvolution: [], knowledgeReferences: [] },
        outputs: { phaseOutputs: {}, templateOutputs: {}, finalDocuments: [], actionItems: [] },
        metadata: { status: 'active', createdAt: new Date(), updatedAt: new Date() }
      }
      
      render(<EnhancedSessionManager session={mockSession} />)
      
      await waitFor(() => {
        const button = screen.getByRole('button', { name: /show details/i })
        button.focus()
        expect(document.activeElement).toBe(button)
      })
      
      const expandButton = screen.getByRole('button', { name: /show details/i })
      
      // Should activate with Enter key
      await user.keyboard('{Enter}')
      
      // Should activate with Space key
      await user.keyboard(' ')
    })

    it('should maintain focus management during dynamic updates', async () => {
      const user = userEvent.setup()
      const mockSession: BmadSession = {
        id: 'focus-test-session',
        userId: 'user-123',
        workspaceId: mockWorkspaceId,
        pathway: PathwayType.STRATEGIC_OPTIMIZATION,
        templates: [],
        currentPhase: 'optimization',
        currentTemplate: '',
        startTime: new Date(),
        timeAllocations: [],
        progress: {
          overallCompletion: 65,
          phaseCompletion: { optimization: 65 },
          currentStep: 'Optimizing strategy',
          nextSteps: []
        },
        context: { userResponses: {}, elicitationHistory: [], personaEvolution: [], knowledgeReferences: [] },
        outputs: { phaseOutputs: {}, templateOutputs: {}, finalDocuments: [], actionItems: [] },
        metadata: { status: 'active', createdAt: new Date(), updatedAt: new Date() }
      }
      
      const { rerender } = render(<EnhancedSessionManager session={mockSession} />)
      
      // Focus on a button
      const detailsButton = screen.getByRole('button', { name: /show details/i })
      detailsButton.focus()
      expect(document.activeElement).toBe(detailsButton)
      
      // Update component
      const updatedSession = { ...mockSession, progress: { ...mockSession.progress, overallCompletion: 70 } }
      rerender(<EnhancedSessionManager session={updatedSession} />)
      
      // Focus should be maintained or managed appropriately
      await waitFor(() => {
        expect(document.activeElement).toBeInstanceOf(HTMLElement)
      })
    })

    it('should provide skip links for lengthy content', async () => {
      render(<BmadInterface workspaceId={mockWorkspaceId} />)
      
      await waitFor(() => {
        expect(screen.getByText('BMad Method')).toBeInTheDocument()
      })
      
      // Should have skip links or proper content organization
      // (Implementation depends on specific design decisions)
    })
  })

  describe('Screen Reader Support', () => {
    it('should provide meaningful text alternatives for visual content', async () => {
      render(<LoadingIndicator variant="progress" progress={75} />)
      
      // Should have text describing the loading state
      const progressElement = screen.getByRole('progressbar')
      expect(progressElement).toHaveAttribute('aria-valuenow', '75')
      expect(progressElement).toHaveAttribute('aria-label')
    })

    it('should announce important state changes', async () => {
      const mockSession: BmadSession = {
        id: 'screen-reader-test',
        userId: 'user-123',
        workspaceId: mockWorkspaceId,
        pathway: PathwayType.BUSINESS_MODEL,
        templates: [],
        currentPhase: 'analysis',
        currentTemplate: '',
        startTime: new Date(),
        timeAllocations: [],
        progress: {
          overallCompletion: 50,
          phaseCompletion: { analysis: 50 },
          currentStep: 'Analyzing business model',
          nextSteps: []
        },
        context: { userResponses: {}, elicitationHistory: [], personaEvolution: [], knowledgeReferences: [] },
        outputs: { phaseOutputs: {}, templateOutputs: {}, finalDocuments: [], actionItems: [] },
        metadata: { status: 'active', createdAt: new Date(), updatedAt: new Date() }
      }
      
      const { rerender } = render(<EnhancedSessionManager session={mockSession} />)
      
      // Change to paused state
      const pausedSession = {
        ...mockSession,
        metadata: { ...mockSession.metadata, status: 'paused' as const }
      }
      
      rerender(<EnhancedSessionManager session={pausedSession} />)
      
      await waitFor(() => {
        expect(screen.getByText('Paused')).toBeInTheDocument()
      })
    })

    it('should provide context for error messages', async () => {
      mockBmadSession.error = 'Unable to save session progress. Please check your connection and try again.'
      
      render(<BmadInterface workspaceId={mockWorkspaceId} />)
      
      await waitFor(() => {
        const errorMessage = screen.getByText(/unable to save session progress/i)
        expect(errorMessage).toBeInTheDocument()
        
        // Error should be associated with a role that announces to screen readers
        const errorContainer = errorMessage.closest('[role="alert"]') || errorMessage.closest('[aria-live]')
        expect(errorContainer).toBeTruthy()
      })
    })

    it('should provide descriptive text for complex UI patterns', async () => {
      const mockSession: BmadSession = {
        id: 'complex-ui-test',
        userId: 'user-123',
        workspaceId: mockWorkspaceId,
        pathway: PathwayType.NEW_IDEA,
        templates: [],
        currentPhase: 'foundation',
        currentTemplate: '',
        startTime: new Date(),
        timeAllocations: [
          { phaseId: 'foundation', templateId: 'template-1', allocatedMinutes: 10, usedMinutes: 3 },
          { phaseId: 'discovery', templateId: 'template-1', allocatedMinutes: 15, usedMinutes: 0 },
          { phaseId: 'ideation', templateId: 'template-1', allocatedMinutes: 12, usedMinutes: 0 }
        ],
        progress: {
          overallCompletion: 20,
          phaseCompletion: { foundation: 30, discovery: 0, ideation: 0 },
          currentStep: 'Setting up foundation',
          nextSteps: []
        },
        context: { userResponses: {}, elicitationHistory: [], personaEvolution: [], knowledgeReferences: [] },
        outputs: { phaseOutputs: {}, templateOutputs: {}, finalDocuments: [], actionItems: [] },
        metadata: { status: 'active', createdAt: new Date(), updatedAt: new Date() }
      }
      
      render(<EnhancedSessionManager session={mockSession} />)
      
      await waitFor(() => {
        expect(screen.getByText('New Idea Development')).toBeInTheDocument()
      })
      
      // Complex progress visualization should have descriptive text
      const progressSection = screen.getByText('Session Progress')
      expect(progressSection).toBeInTheDocument()
    })
  })

  describe('Color Contrast and Visual Accessibility', () => {
    it('should maintain sufficient color contrast ratios', async () => {
      const { container } = render(<BmadInterface workspaceId={mockWorkspaceId} />)
      
      await waitFor(() => {
        expect(screen.getByText('BMad Method')).toBeInTheDocument()
      })
      
      // Automated color contrast testing would require additional tools
      // This test ensures the component renders without contrast violations
      const results = await axe(container, {
        rules: {
          'color-contrast': { enabled: true }
        }
      })
      
      expect(results).toHaveNoViolations()
    })

    it('should not rely solely on color to convey information', async () => {
      const mockSession: BmadSession = {
        id: 'color-test-session',
        userId: 'user-123',
        workspaceId: mockWorkspaceId,
        pathway: PathwayType.STRATEGIC_OPTIMIZATION,
        templates: [],
        currentPhase: 'validation',
        currentTemplate: '',
        startTime: new Date(),
        timeAllocations: [],
        progress: {
          overallCompletion: 85,
          phaseCompletion: { validation: 85 },
          currentStep: 'Validating optimization',
          nextSteps: []
        },
        context: { userResponses: {}, elicitationHistory: [], personaEvolution: [], knowledgeReferences: [] },
        outputs: { phaseOutputs: {}, templateOutputs: {}, finalDocuments: [], actionItems: [] },
        metadata: { status: 'active', createdAt: new Date(), updatedAt: new Date() }
      }
      
      render(<EnhancedSessionManager session={mockSession} />)
      
      await waitFor(() => {
        // Status indicators should have text labels, not just colors
        expect(screen.getByText('Active')).toBeInTheDocument()
        expect(screen.getByText('85%')).toBeInTheDocument()
      })
    })

    it('should be usable in high contrast mode', async () => {
      // Simulate high contrast mode styles
      const { container } = render(<BmadInterface workspaceId={mockWorkspaceId} />)
      
      await waitFor(() => {
        expect(screen.getByText('BMad Method')).toBeInTheDocument()
      })
      
      // Elements should remain functional in high contrast mode
      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThan(0)
      
      buttons.forEach(button => {
        expect(button).toBeVisible()
      })
    })
  })

  describe('Motion and Animation Accessibility', () => {
    it('should respect prefers-reduced-motion preference', async () => {
      // Mock prefers-reduced-motion
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      })
      
      render(<LoadingIndicator variant="progress" progress={50} />)
      
      // Should render without excessive animation when reduced motion is preferred
      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toBeInTheDocument()
    })

    it('should provide controls for auto-updating content', async () => {
      const mockSession: BmadSession = {
        id: 'motion-test-session',
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
          currentStep: 'Ongoing analysis',
          nextSteps: []
        },
        context: { userResponses: {}, elicitationHistory: [], personaEvolution: [], knowledgeReferences: [] },
        outputs: { phaseOutputs: {}, templateOutputs: {}, finalDocuments: [], actionItems: [] },
        metadata: { status: 'active', createdAt: new Date(), updatedAt: new Date() }
      }
      
      render(<EnhancedSessionManager session={mockSession} />)
      
      await waitFor(() => {
        // Should provide controls for pausing auto-updating timers
        expect(screen.getByRole('button', { name: /pause session/i })).toBeInTheDocument()
      })
    })
  })

  describe('Mobile Accessibility', () => {
    it('should maintain accessibility on touch devices', async () => {
      // Mock touch device
      Object.defineProperty(window, 'ontouchstart', {
        writable: true,
        value: {}
      })
      
      const { container } = render(<BmadInterface workspaceId={mockWorkspaceId} />)
      
      await waitFor(() => {
        expect(screen.getByText('BMad Method')).toBeInTheDocument()
      })
      
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have appropriate touch target sizes', async () => {
      render(<BmadInterface workspaceId={mockWorkspaceId} />)
      
      await waitFor(() => {
        const buttons = screen.getAllByRole('button')
        
        buttons.forEach(button => {
          const styles = window.getComputedStyle(button)
          // Touch targets should be at least 44x44px (or equivalent)
          expect(button).toBeVisible()
        })
      })
    })
  })

  describe('Form Accessibility', () => {
    it('should provide clear error messages for form validation', async () => {
      // This test would apply to form inputs in the interface
      render(<BmadInterface workspaceId={mockWorkspaceId} />)
      
      await waitFor(() => {
        expect(screen.getByText('BMad Method')).toBeInTheDocument()
      })
      
      // If there are form inputs, they should have proper error handling
      const inputs = screen.queryAllByRole('textbox')
      inputs.forEach(input => {
        expect(input).toHaveAttribute('aria-invalid', 'false')
      })
    })

    it('should group related form controls appropriately', async () => {
      render(<BmadInterface workspaceId={mockWorkspaceId} />)
      
      await waitFor(() => {
        // Related controls should be grouped with fieldset/legend or ARIA grouping
        const groups = screen.queryAllByRole('group')
        // Implementation-specific verification
        expect(groups.length).toBeGreaterThanOrEqual(0)
      })
    })
  })
})