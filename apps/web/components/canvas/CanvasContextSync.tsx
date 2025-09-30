/**
 * Canvas Context Synchronization Component
 *
 * Bidirectional sync between canvas and conversation:
 * - AI → Canvas: Parse messages for visual suggestions
 * - Canvas → AI: Share canvas state with conversation context
 */

'use client'

import { useEffect, useCallback, useRef } from 'react'
import { VisualSuggestion } from '@/lib/canvas/visual-suggestion-parser'
import { useCanvasSync } from '@/lib/canvas/useCanvasSync'
import VisualSuggestionIndicator from './VisualSuggestionIndicator'

export interface CanvasState {
  mode: 'draw' | 'diagram'
  diagramCode?: string
  diagramType?: string
  drawingSnapshot?: string // tldraw snapshot JSON
  lastModified: Date
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface CanvasContextSyncProps {
  workspaceId: string
  messages: Message[]
  canvasState: CanvasState | null
  onCanvasUpdate?: (diagramCode: string, type: string) => void
  onContextShare?: (context: string) => void
  autoPopulate?: boolean
  className?: string
}

/**
 * Main synchronization component
 */
export default function CanvasContextSync({
  workspaceId,
  messages,
  canvasState,
  onCanvasUpdate,
  onContextShare,
  autoPopulate = false,
  className = '',
}: CanvasContextSyncProps) {
  const lastProcessedMessageId = useRef<string | null>(null)
  const canvasUpdateDebounce = useRef<NodeJS.Timeout | null>(null)

  // Canvas sync hook
  const {
    suggestions,
    activeSuggestion,
    autoPopulateEnabled,
    syncEnabled,
    parseMessage,
    applySuggestion,
    dismissSuggestion,
    toggleAutoPopulate,
    toggleSync,
  } = useCanvasSync({
    workspaceId,
    minConfidence: 0.5,
    autoPopulate,
    onSuggestionApplied: handleSuggestionApplied,
  })

  /**
   * DIRECTION 1: AI → Canvas
   * Parse new assistant messages for visual suggestions
   */
  useEffect(() => {
    if (!syncEnabled || messages.length === 0) return

    // Get the latest message
    const latestMessage = messages[messages.length - 1]

    // Only process if:
    // 1. It's a new message (different from last processed)
    // 2. It's from the assistant
    if (
      latestMessage.id !== lastProcessedMessageId.current &&
      latestMessage.role === 'assistant'
    ) {
      parseMessage(latestMessage.id, latestMessage.content, latestMessage.role)
      lastProcessedMessageId.current = latestMessage.id
    }
  }, [messages, syncEnabled, parseMessage])

  /**
   * DIRECTION 2: Canvas → AI
   * Share canvas state changes with conversation context
   */
  useEffect(() => {
    if (!syncEnabled || !canvasState || !onContextShare) return

    // Debounce canvas updates (only share every 5 seconds)
    if (canvasUpdateDebounce.current) {
      clearTimeout(canvasUpdateDebounce.current)
    }

    canvasUpdateDebounce.current = setTimeout(() => {
      const context = buildCanvasContext(canvasState)
      onContextShare(context)
    }, 5000)

    return () => {
      if (canvasUpdateDebounce.current) {
        clearTimeout(canvasUpdateDebounce.current)
      }
    }
  }, [canvasState, syncEnabled, onContextShare])

  /**
   * Handle suggestion application
   */
  function handleSuggestionApplied(suggestion: VisualSuggestion) {
    if (suggestion.diagramCode && onCanvasUpdate) {
      onCanvasUpdate(suggestion.diagramCode, suggestion.type)
    }
  }

  /**
   * Handle apply button click
   */
  const handleApply = useCallback(
    (suggestionId: string) => {
      applySuggestion(suggestionId)
    },
    [applySuggestion]
  )

  /**
   * Handle dismiss button click
   */
  const handleDismiss = useCallback(
    (suggestionId: string) => {
      dismissSuggestion(suggestionId)
    },
    [dismissSuggestion]
  )

  return (
    <div className={`canvas-context-sync ${className}`}>
      {/* Sync Controls */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              syncEnabled ? 'bg-green-500' : 'bg-gray-400'
            }`}
            title={syncEnabled ? 'Sync enabled' : 'Sync disabled'}
          />
          <span className="text-xs text-secondary">
            Canvas Sync {syncEnabled ? 'On' : 'Off'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Auto-populate toggle */}
          <button
            onClick={toggleAutoPopulate}
            className={`text-xs px-2 py-1 rounded transition-colors ${
              autoPopulateEnabled
                ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title="Auto-apply high-confidence suggestions"
          >
            ✨ Auto-apply
          </button>

          {/* Sync toggle */}
          <button
            onClick={toggleSync}
            className={`text-xs px-2 py-1 rounded transition-colors ${
              syncEnabled
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title="Toggle canvas synchronization"
          >
            {syncEnabled ? '🔗 Synced' : '🔌 Sync Off'}
          </button>
        </div>
      </div>

      {/* Visual Suggestions */}
      {suggestions.length > 0 && (
        <VisualSuggestionIndicator
          suggestions={suggestions}
          onApply={handleApply}
          onDismiss={handleDismiss}
        />
      )}

      {/* Active Suggestion Indicator */}
      {activeSuggestion && (
        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700">
          ✅ Applied: {activeSuggestion.title}
        </div>
      )}
    </div>
  )
}

/**
 * Build canvas context string for AI
 */
function buildCanvasContext(canvasState: CanvasState): string {
  const parts: string[] = []

  // Mode
  parts.push(`Canvas Mode: ${canvasState.mode}`)

  // Diagram info
  if (canvasState.mode === 'diagram' && canvasState.diagramCode) {
    parts.push(`Diagram Type: ${canvasState.diagramType || 'unknown'}`)
    parts.push(`Diagram Code:\n\`\`\`mermaid\n${canvasState.diagramCode}\n\`\`\``)
  }

  // Drawing info
  if (canvasState.mode === 'draw' && canvasState.drawingSnapshot) {
    const snapshot = JSON.parse(canvasState.drawingSnapshot)
    const shapeCount = snapshot.shapes?.length || 0
    parts.push(`Drawing Elements: ${shapeCount} shapes`)
  }

  // Last modified
  parts.push(`Last Modified: ${canvasState.lastModified.toLocaleString()}`)

  return parts.join('\n')
}

/**
 * Lightweight version for inline display
 */
export function CanvasSyncIndicator({ syncEnabled }: { syncEnabled: boolean }) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-secondary">
      <div
        className={`w-1.5 h-1.5 rounded-full ${
          syncEnabled ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
        }`}
      />
      <span>{syncEnabled ? 'Canvas synced' : 'Canvas sync off'}</span>
    </div>
  )
}
