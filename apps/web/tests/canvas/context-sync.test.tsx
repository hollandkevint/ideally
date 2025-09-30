/**
 * E2E Tests for Canvas Context Synchronization
 *
 * Tests the bidirectional sync between AI conversation and canvas workspace
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { VisualSuggestionParser } from '@/lib/canvas/visual-suggestion-parser'
import { useCanvasSync } from '@/lib/canvas/useCanvasSync'
import { renderHook, act } from '@testing-library/react'

describe('Context Synchronization E2E', () => {
  describe('AI → Canvas: Visual Suggestion Detection', () => {
    it('should detect explicit Mermaid flowchart in AI response', () => {
      const messageId = 'msg-1'
      const content = `Here's the workflow:

\`\`\`mermaid
flowchart TD
  Start --> Process --> End
\`\`\`

Let me know if you need changes.`

      const result = VisualSuggestionParser.parseMessage(messageId, content, 'assistant')

      expect(result.hasVisualContent).toBe(true)
      expect(result.suggestions.length).toBeGreaterThanOrEqual(1)
      expect(result.suggestions[0].type).toBe('flowchart')
      expect(result.suggestions[0].confidence).toBe(1.0)
      expect(result.suggestions[0].diagramCode).toContain('flowchart TD')
    })

    it('should detect implicit flowchart from numbered list', () => {
      const content = `Here are the steps:
1. User signs up with email
2. System sends verification email
3. User clicks verification link
4. Account is activated
5. User is redirected to dashboard`

      const result = VisualSuggestionParser.parseMessage('msg-2', content, 'assistant')

      expect(result.hasVisualContent).toBe(true)
      const flowchartSuggestion = result.suggestions.find(s => s.type === 'flowchart')
      expect(flowchartSuggestion).toBeDefined()
      expect(flowchartSuggestion?.confidence).toBeGreaterThanOrEqual(0.5)
      expect(flowchartSuggestion?.diagramCode).toContain('Start([Start])')
      expect(flowchartSuggestion?.diagramCode).toContain('End([End])')
    })

    it('should detect sequence diagram from interaction language', () => {
      const content = `The API flow works as follows:
- User sends POST request to /api/login
- API receives request and validates credentials
- System communicates with database to verify user
- Database responds with user data
- API sends JWT token back to user`

      const result = VisualSuggestionParser.parseMessage('msg-3', content, 'assistant')

      expect(result.hasVisualContent).toBe(true)
      const sequenceSuggestion = result.suggestions.find(s => s.type === 'sequence')
      expect(sequenceSuggestion).toBeDefined()
      expect(sequenceSuggestion?.confidence).toBeGreaterThanOrEqual(0.5)
    })

    it('should detect Gantt chart from timeline language', () => {
      const content = `Our project timeline:
- Q1 2025: Discovery and research phase
- Q2 2025: Development sprint with 3 milestones
- Q3 2025: Testing and QA schedule
- Q4 2025: Deployment and launch timeline`

      const result = VisualSuggestionParser.parseMessage('msg-4', content, 'assistant')

      expect(result.hasVisualContent).toBe(true)
      const ganttSuggestion = result.suggestions.find(s => s.type === 'gantt')
      expect(ganttSuggestion).toBeDefined()
    })

    it('should detect state diagram from lifecycle language', () => {
      const content = `Orders transition through these states:
- Pending: Initial state after creation
- Processing: Active order being fulfilled
- Shipped: Order in transit
- Delivered: Final completed state
- Cancelled: User cancelled the order
Transitions occur based on user actions.`

      const result = VisualSuggestionParser.parseMessage('msg-5', content, 'assistant')

      expect(result.hasVisualContent).toBe(true)
      const stateSuggestion = result.suggestions.find(s => s.type === 'state')
      expect(stateSuggestion).toBeDefined()
    })

    it('should not parse user messages', () => {
      const content = `Can you create a flowchart showing the onboarding process?`

      const result = VisualSuggestionParser.parseMessage('msg-6', content, 'user')

      expect(result.hasVisualContent).toBe(false)
      expect(result.suggestions.length).toBe(0)
    })

    it('should handle multiple diagrams in single message', () => {
      const content = `Here are two diagrams:

\`\`\`mermaid
flowchart LR
  A --> B
\`\`\`

And the sequence:

\`\`\`mermaid
sequenceDiagram
  A->>B: Message
\`\`\``

      const result = VisualSuggestionParser.parseMessage('msg-7', content, 'assistant')

      expect(result.suggestions.length).toBeGreaterThanOrEqual(2)
      expect(result.suggestions.some(s => s.type === 'flowchart')).toBe(true)
      expect(result.suggestions.some(s => s.type === 'sequence')).toBe(true)
    })
  })

  describe('Canvas Sync Hook', () => {
    const mockOptions = {
      workspaceId: 'test-workspace',
      minConfidence: 0.5,
      autoPopulate: false,
    }

    beforeEach(() => {
      localStorage.clear()
    })

    it('should parse messages and create suggestions', () => {
      const { result } = renderHook(() => useCanvasSync(mockOptions))

      act(() => {
        result.current.parseMessage(
          'msg-1',
          '```mermaid\nflowchart TD\n  Start --> End\n```',
          'assistant'
        )
      })

      expect(result.current.suggestions.length).toBeGreaterThanOrEqual(1)
      expect(result.current.totalSuggestions).toBeGreaterThanOrEqual(1)
    })

    it('should apply suggestion and move to active', () => {
      const { result } = renderHook(() => useCanvasSync(mockOptions))

      act(() => {
        result.current.parseMessage(
          'msg-1',
          '```mermaid\nflowchart TD\n  Start --> End\n```',
          'assistant'
        )
      })

      const suggestionId = result.current.suggestions[0]?.id
      expect(suggestionId).toBeDefined()

      act(() => {
        result.current.applySuggestion(suggestionId!)
      })

      expect(result.current.activeSuggestion).toBeDefined()
      expect(result.current.activeSuggestion?.id).toBe(suggestionId)
      expect(result.current.suggestions).not.toContainEqual(
        expect.objectContaining({ id: suggestionId })
      )
      expect(result.current.appliedCount).toBe(1)
    })

    it('should dismiss suggestion', () => {
      const { result } = renderHook(() => useCanvasSync(mockOptions))

      act(() => {
        result.current.parseMessage(
          'msg-1',
          '```mermaid\nflowchart TD\n  Start --> End\n```',
          'assistant'
        )
      })

      const initialCount = result.current.suggestions.length
      const suggestionId = result.current.suggestions[0]?.id

      act(() => {
        result.current.dismissSuggestion(suggestionId!)
      })

      expect(result.current.suggestions.length).toBe(initialCount - 1)
      expect(result.current.dismissedCount).toBe(1)
    })

    it('should auto-populate high-confidence suggestions', () => {
      const onSuggestionApplied = vi.fn()
      const { result } = renderHook(() =>
        useCanvasSync({
          ...mockOptions,
          autoPopulate: true,
          onSuggestionApplied,
        })
      )

      act(() => {
        result.current.parseMessage(
          'msg-1',
          '```mermaid\nflowchart TD\n  Start --> End\n```',
          'assistant'
        )
      })

      // Explicit Mermaid should have 1.0 confidence and auto-apply
      waitFor(() => {
        expect(result.current.activeSuggestion).toBeDefined()
        expect(onSuggestionApplied).toHaveBeenCalled()
      })
    })

    it('should filter by confidence threshold', () => {
      const { result } = renderHook(() =>
        useCanvasSync({
          ...mockOptions,
          minConfidence: 0.8, // High threshold
        })
      )

      act(() => {
        // Low-confidence suggestion (implicit)
        result.current.parseMessage(
          'msg-1',
          'The process has steps and a workflow',
          'assistant'
        )
      })

      // Should filter out low-confidence suggestions
      expect(result.current.suggestions.length).toBe(0)
    })

    it('should not parse duplicate messages', () => {
      const { result } = renderHook(() => useCanvasSync(mockOptions))

      act(() => {
        result.current.parseMessage(
          'msg-1',
          '```mermaid\nflowchart TD\n  Start --> End\n```',
          'assistant'
        )
      })

      const initialCount = result.current.suggestions.length

      act(() => {
        // Parse same message again
        result.current.parseMessage(
          'msg-1',
          '```mermaid\nflowchart TD\n  Start --> End\n```',
          'assistant'
        )
      })

      // Should not add duplicate
      expect(result.current.suggestions.length).toBe(initialCount)
    })

    it('should persist state to localStorage', () => {
      const { result } = renderHook(() => useCanvasSync(mockOptions))

      act(() => {
        result.current.toggleAutoPopulate()
        result.current.toggleSync()
      })

      const stored = localStorage.getItem(`canvas-sync-${mockOptions.workspaceId}`)
      expect(stored).toBeDefined()

      const state = JSON.parse(stored!)
      expect(state.autoPopulateEnabled).toBe(true)
      expect(state.syncEnabled).toBe(false)
    })

    it('should restore state from localStorage', () => {
      localStorage.setItem(
        `canvas-sync-${mockOptions.workspaceId}`,
        JSON.stringify({
          autoPopulateEnabled: true,
          syncEnabled: false,
        })
      )

      const { result } = renderHook(() => useCanvasSync(mockOptions))

      waitFor(() => {
        expect(result.current.autoPopulateEnabled).toBe(true)
        expect(result.current.syncEnabled).toBe(false)
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty message', () => {
      const result = VisualSuggestionParser.parseMessage('msg-1', '', 'assistant')

      expect(result.hasVisualContent).toBe(false)
      expect(result.suggestions.length).toBe(0)
    })

    it('should handle malformed Mermaid code', () => {
      const content = '```mermaid\nINVALID DIAGRAM CODE\n```'

      const result = VisualSuggestionParser.parseMessage('msg-1', content, 'assistant')

      // Should still extract it, validation happens on render
      expect(result.hasVisualContent).toBe(true)
      expect(result.suggestions[0].diagramCode).toContain('INVALID')
    })

    it('should handle very long messages', () => {
      const longContent = 'Step '.repeat(1000) + '\n1. First\n2. Second\n3. Third\n4. Fourth'

      const result = VisualSuggestionParser.parseMessage('msg-1', longContent, 'assistant')

      // Should still work without performance issues
      expect(result).toBeDefined()
    })

    it('should handle special characters in content', () => {
      const content = `Process: User → System → Database
Steps: {1} → {2} → {3}
Result: Success ✓`

      const result = VisualSuggestionParser.parseMessage('msg-1', content, 'assistant')

      expect(result).toBeDefined()
      // Should not crash on special chars
    })
  })

  describe('Integration Scenarios', () => {
    it('should handle full conversation flow', () => {
      const { result } = renderHook(() => useCanvasSync(mockOptions))

      // User asks question
      act(() => {
        result.current.parseMessage('msg-1', 'How does the login flow work?', 'user')
      })

      expect(result.current.suggestions.length).toBe(0)

      // AI responds with process
      act(() => {
        result.current.parseMessage(
          'msg-2',
          `The login flow has these steps:
1. User enters credentials
2. System validates input
3. API authenticates with database
4. Token is generated
5. User is redirected to dashboard`,
          'assistant'
        )
      })

      expect(result.current.suggestions.length).toBeGreaterThanOrEqual(1)

      // User applies suggestion
      const suggestionId = result.current.suggestions[0]?.id
      act(() => {
        result.current.applySuggestion(suggestionId!)
      })

      expect(result.current.activeSuggestion).toBeDefined()
      expect(result.current.appliedCount).toBe(1)
    })

    it('should handle multiple AI responses in sequence', () => {
      const { result } = renderHook(() => useCanvasSync(mockOptions))

      // First response with flowchart
      act(() => {
        result.current.parseMessage(
          'msg-1',
          '```mermaid\nflowchart TD\n  A --> B\n```',
          'assistant'
        )
      })

      const firstCount = result.current.suggestions.length

      // Second response with sequence
      act(() => {
        result.current.parseMessage(
          'msg-2',
          '```mermaid\nsequenceDiagram\n  A->>B: Msg\n```',
          'assistant'
        )
      })

      expect(result.current.suggestions.length).toBe(firstCount + 1)
    })
  })
})
