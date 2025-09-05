'use client'

import { useState, useCallback, useEffect } from 'react'

interface SharedInputState {
  initialInput: string
  isPreserved: boolean
  workspaceId: string | null
}

// Global state for shared input across components
let sharedInputState: SharedInputState = {
  initialInput: '',
  isPreserved: false,
  workspaceId: null
}

// Subscribers for state changes
const subscribers = new Set<() => void>()

/**
 * Custom hook for sharing input state between Mary Chat and BMad Method interfaces
 * Preserves user input when switching tabs and provides it to session creation
 */
export function useSharedInput(workspaceId: string) {
  const [state, setState] = useState(sharedInputState)

  // Subscribe to state changes
  useEffect(() => {
    const updateState = () => setState({ ...sharedInputState })
    subscribers.add(updateState)
    
    return () => {
      subscribers.delete(updateState)
    }
  }, [])

  const notifySubscribers = useCallback(() => {
    subscribers.forEach(callback => callback())
  }, [])

  // Initialize or reset state for new workspace
  useEffect(() => {
    if (sharedInputState.workspaceId !== workspaceId) {
      sharedInputState = {
        initialInput: '',
        isPreserved: false,
        workspaceId
      }
      notifySubscribers()
    }
  }, [workspaceId, notifySubscribers])

  /**
   * Preserve input from Mary Chat when switching to BMad Method
   * @param input - The current input text to preserve
   */
  const preserveInput = useCallback((input: string) => {
    if (input.trim()) {
      sharedInputState.initialInput = input.trim()
      sharedInputState.isPreserved = true
      notifySubscribers()
    }
  }, [notifySubscribers])

  /**
   * Consume the preserved input (typically called by BMad Method)
   * @returns The preserved input text
   */
  const consumePreservedInput = useCallback((): string => {
    const input = sharedInputState.initialInput
    sharedInputState.initialInput = ''
    sharedInputState.isPreserved = false
    notifySubscribers()
    return input
  }, [notifySubscribers])

  /**
   * Clear preserved input without consuming it
   */
  const clearPreservedInput = useCallback(() => {
    sharedInputState.initialInput = ''
    sharedInputState.isPreserved = false
    notifySubscribers()
  }, [notifySubscribers])

  /**
   * Check if there is preserved input available
   */
  const hasPreservedInput = useCallback((): boolean => {
    return sharedInputState.isPreserved && sharedInputState.initialInput.length > 0
  }, [])

  /**
   * Get the preserved input without consuming it
   */
  const peekPreservedInput = useCallback((): string => {
    return sharedInputState.isPreserved ? sharedInputState.initialInput : ''
  }, [])

  return {
    preserveInput,
    consumePreservedInput,
    clearPreservedInput,
    hasPreservedInput,
    peekPreservedInput,
    isPreserved: state.isPreserved,
    initialInput: state.initialInput
  }
}