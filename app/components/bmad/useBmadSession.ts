'use client'

import { useState, useCallback } from 'react'
import { BmadSession, PathwayType } from '@/lib/bmad/types'

interface UseBmadSessionReturn {
  currentSession: BmadSession | null
  isLoading: boolean
  error: string | null
  createSession: (workspaceId: string, pathway: PathwayType, userInput?: string) => Promise<void>
  advanceSession: (sessionId: string, userInput: string) => Promise<void>
  getSession: (sessionId: string) => Promise<void>
  pauseSession: () => void
  resumeSession: () => void
  exitSession: () => void
}

export function useBmadSession(): UseBmadSessionReturn {
  const [currentSession, setCurrentSession] = useState<BmadSession | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createSession = useCallback(async (
    workspaceId: string, 
    pathway: PathwayType, 
    userInput?: string
  ) => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/bmad', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create_session',
          workspaceId,
          pathway,
          initialContext: userInput ? { userInput } : undefined
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (result.success && result.data.session) {
        setCurrentSession(result.data.session)
      } else {
        throw new Error(result.error || 'Failed to create session')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      console.error('Error creating BMad session:', err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const advanceSession = useCallback(async (sessionId: string, userInput: string) => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/bmad', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'advance_session',
          sessionId,
          userInput
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (result.success && result.data) {
        // Update the current session with the advancement result
        setCurrentSession(prev => {
          if (!prev) return null
          
          return {
            ...prev,
            currentPhase: result.data.nextPhase || prev.currentPhase,
            progress: result.data.updatedProgress || prev.progress,
            context: {
              ...prev.context,
              userResponses: {
                ...prev.context.userResponses,
                [sessionId]: {
                  text: userInput,
                  timestamp: new Date()
                }
              }
            }
          }
        })
      } else {
        throw new Error(result.error || 'Failed to advance session')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      console.error('Error advancing BMad session:', err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const getSession = useCallback(async (sessionId: string) => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/bmad', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'get_session',
          sessionId
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (result.success && result.data.session) {
        setCurrentSession(result.data.session)
      } else {
        throw new Error(result.error || 'Failed to get session')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      console.error('Error getting BMad session:', err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const pauseSession = useCallback(() => {
    setCurrentSession(prev => {
      if (!prev) return null
      return {
        ...prev,
        metadata: {
          ...prev.metadata,
          status: 'paused' as const,
          updatedAt: new Date()
        }
      }
    })
  }, [])

  const resumeSession = useCallback(() => {
    setCurrentSession(prev => {
      if (!prev) return null
      return {
        ...prev,
        metadata: {
          ...prev.metadata,
          status: 'active' as const,
          updatedAt: new Date()
        }
      }
    })
  }, [])

  const exitSession = useCallback(() => {
    setCurrentSession(null)
    setError(null)
  }, [])

  return {
    currentSession,
    isLoading,
    error,
    createSession,
    advanceSession,
    getSession,
    pauseSession,
    resumeSession,
    exitSession
  }
}