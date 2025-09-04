'use client'

import { useState, useEffect } from 'react'
import { BmadSession } from '@/lib/bmad/types'

interface SessionHistoryEntry {
  id: string
  sessionId: string
  timestamp: Date
  action: 'created' | 'resumed' | 'paused' | 'completed' | 'phase_advanced' | 'input_submitted' | 'exited'
  phase: string
  progress: number
  details?: string
  userInput?: string
}

interface SessionHistoryManagerProps {
  workspaceId: string
  currentSession?: BmadSession
  onResumeSession?: (sessionId: string) => void
  className?: string
}

export default function SessionHistoryManager({
  workspaceId,
  currentSession,
  onResumeSession,
  className = ''
}: SessionHistoryManagerProps) {
  const [sessions, setSessions] = useState<BmadSession[]>([])
  const [sessionHistory, setSessionHistory] = useState<SessionHistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showHistory, setShowHistory] = useState(false)
  const [selectedSession, setSelectedSession] = useState<string | null>(null)

  // Load session history on mount
  useEffect(() => {
    loadSessionHistory()
  }, [workspaceId])

  // Update history when current session changes
  useEffect(() => {
    if (currentSession) {
      addHistoryEntry({
        sessionId: currentSession.id,
        action: 'resumed',
        phase: currentSession.currentPhase,
        progress: currentSession.progress.overallCompletion,
        details: `Session resumed in ${currentSession.currentPhase} phase`
      })
    }
  }, [currentSession?.id, currentSession?.progress.overallCompletion])

  const loadSessionHistory = async () => {
    try {
      setLoading(true)
      
      // Load all sessions for this workspace
      const response = await fetch(`/api/bmad?action=sessions&workspaceId=${workspaceId}`)
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data.sessions) {
          setSessions(result.data.sessions)
        }
      }

      // Load session history from localStorage as backup
      const storedHistory = localStorage.getItem(`bmad-history-${workspaceId}`)
      if (storedHistory) {
        const parsed = JSON.parse(storedHistory)
        setSessionHistory(parsed.map((entry: any) => ({
          ...entry,
          timestamp: new Date(entry.timestamp)
        })))
      }
    } catch (error) {
      console.error('Error loading session history:', error)
    } finally {
      setLoading(false)
    }
  }

  const addHistoryEntry = (entry: Omit<SessionHistoryEntry, 'id' | 'timestamp'>) => {
    const newEntry: SessionHistoryEntry = {
      id: `${entry.sessionId}-${Date.now()}`,
      timestamp: new Date(),
      ...entry
    }

    setSessionHistory(prev => {
      const updated = [...prev.slice(-49), newEntry] // Keep last 50 entries
      
      // Persist to localStorage
      localStorage.setItem(`bmad-history-${workspaceId}`, JSON.stringify(updated))
      
      return updated
    })
  }

  const formatTimeAgo = (date: Date): string => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMinutes / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMinutes < 1) return 'Just now'
    if (diffMinutes < 60) return `${diffMinutes}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  const getPathwayName = (pathway: string): string => {
    const pathwayNames: Record<string, string> = {
      'new-idea': 'New Idea Development',
      'business-model': 'Business Model Analysis',
      'strategic-optimization': 'Strategic Optimization'
    }
    return pathwayNames[pathway] || pathway
  }

  const getActionIcon = (action: SessionHistoryEntry['action']): string => {
    switch (action) {
      case 'created': return '🚀'
      case 'resumed': return '▶️'
      case 'paused': return '⏸️'
      case 'completed': return '✅'
      case 'phase_advanced': return '📈'
      case 'input_submitted': return '💬'
      case 'exited': return '🚪'
      default: return '📝'
    }
  }

  const getActionDescription = (action: SessionHistoryEntry['action']): string => {
    switch (action) {
      case 'created': return 'Session created'
      case 'resumed': return 'Session resumed'
      case 'paused': return 'Session paused'
      case 'completed': return 'Session completed'
      case 'phase_advanced': return 'Advanced to next phase'
      case 'input_submitted': return 'User input submitted'
      case 'exited': return 'Session exited'
      default: return 'Session activity'
    }
  }

  const getResumableSessions = () => {
    return sessions.filter(session => 
      session.metadata.status === 'active' || session.metadata.status === 'paused'
    ).slice(0, 5) // Show last 5 resumable sessions
  }

  const handleResumeSession = (sessionId: string) => {
    if (onResumeSession) {
      onResumeSession(sessionId)
      addHistoryEntry({
        sessionId,
        action: 'resumed',
        phase: 'resuming',
        progress: 0,
        details: 'Session resumed from history'
      })
    }
  }

  const getSessionHistory = (sessionId: string) => {
    return sessionHistory.filter(entry => entry.sessionId === sessionId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10) // Last 10 entries for this session
  }

  if (loading) {
    return (
      <div className={`bg-white rounded-lg border border-divider p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4 w-1/3"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg border border-divider ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-divider">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13 3a9 9 0 0 0-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.954 8.954 0 0 0 13 21a9 9 0 0 0 0-18zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/>
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-primary">Session History & Resumption</h3>
              <p className="text-sm text-secondary">Track and resume your strategic sessions</p>
            </div>
          </div>
          
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="px-4 py-2 text-sm border border-divider rounded-lg hover:bg-gray-50 transition-colors"
          >
            {showHistory ? 'Hide History' : 'Show History'}
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Resumable Sessions */}
        {getResumableSessions().length > 0 && (
          <div>
            <h4 className="font-semibold text-primary mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
              Resume Active Sessions
            </h4>
            <div className="grid gap-3">
              {getResumableSessions().map((session, index) => (
                <div key={session.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-3 h-3 rounded-full ${
                          session.metadata.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'
                        }`}></div>
                        <h5 className="font-medium text-primary">
                          {getPathwayName(session.pathway)}
                        </h5>
                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                          {Math.round(session.progress.overallCompletion)}% complete
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-secondary">
                        <span>Phase: {session.currentPhase.replace(/_/g, ' ')}</span>
                        <span>Started: {formatTimeAgo(new Date(session.startTime))}</span>
                        <span>Status: {session.metadata.status}</span>
                      </div>
                      
                      {/* Progress bar */}
                      <div className="mt-3">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${session.progress.overallCompletion}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => setSelectedSession(selectedSession === session.id ? null : session.id)}
                        className="px-3 py-1 text-xs border border-gray-300 text-gray-600 rounded hover:bg-gray-100 transition-colors"
                      >
                        Details
                      </button>
                      <button
                        onClick={() => handleResumeSession(session.id)}
                        className="px-4 py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white text-sm rounded-lg hover:shadow-md transition-all"
                      >
                        Resume
                      </button>
                    </div>
                  </div>
                  
                  {/* Session Details */}
                  {selectedSession === session.id && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-secondary">Current Step:</span>
                          <p className="text-primary">{session.progress.currentStep}</p>
                        </div>
                        <div>
                          <span className="font-medium text-secondary">Next Steps:</span>
                          <ul className="text-primary space-y-1">
                            {session.progress.nextSteps.slice(0, 2).map((step, idx) => (
                              <li key={idx} className="flex items-center gap-2">
                                <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
                                <span className="truncate">{step}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Session Activity History */}
        {showHistory && (
          <div>
            <h4 className="font-semibold text-primary mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              Activity Timeline
            </h4>
            
            {sessionHistory.length === 0 ? (
              <div className="text-center py-8 text-secondary">
                <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M13 3a9 9 0 0 0-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.954 8.954 0 0 0 13 21a9 9 0 0 0 0-18zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/>
                </svg>
                <p>No session history available</p>
                <p className="text-sm">Start a new session to begin tracking your progress</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {sessionHistory.slice(-20).reverse().map((entry, index) => (
                  <div key={entry.id} className="flex items-start gap-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0 w-8 h-8 bg-white rounded-full flex items-center justify-center text-sm border border-gray-200">
                      {getActionIcon(entry.action)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-primary text-sm">
                          {getActionDescription(entry.action)}
                        </span>
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                          {entry.progress.toFixed(0)}%
                        </span>
                      </div>
                      <p className="text-xs text-secondary mb-1">
                        Session: {entry.sessionId.slice(-8)} • Phase: {entry.phase.replace(/_/g, ' ')}
                      </p>
                      {entry.details && (
                        <p className="text-xs text-gray-600 italic">{entry.details}</p>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 whitespace-nowrap">
                      {formatTimeAgo(entry.timestamp)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Current Session Quick Stats */}
        {currentSession && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              Current Session Overview
            </h4>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="font-bold text-lg text-blue-900">{Math.round(currentSession.progress.overallCompletion)}%</div>
                <div className="text-blue-700 text-xs">Progress</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-lg text-blue-900">
                  {Object.values(currentSession.progress.phaseCompletion).filter(p => p === 100).length}
                </div>
                <div className="text-blue-700 text-xs">Phases Done</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-lg text-blue-900">
                  {getSessionHistory(currentSession.id).length}
                </div>
                <div className="text-blue-700 text-xs">Activities</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-lg text-blue-900">
                  {formatTimeAgo(new Date(currentSession.startTime))}
                </div>
                <div className="text-blue-700 text-xs">Started</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Export types for use in other components
export type { SessionHistoryEntry }