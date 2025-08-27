'use client'

import { useState, useEffect, useCallback } from 'react'
import { PathwayType, UserResponse, NumberedOption } from '@/lib/bmad/types'
import { useBmadSession } from './useBmadSession'
import PathwaySelector from './PathwaySelector'
import SessionManager from './SessionManager'
import ElicitationPanel from './ElicitationPanel'

interface BmadInterfaceProps {
  workspaceId: string
  className?: string
}

type BMadStep = 'pathway-selection' | 'session-active' | 'session-completed'

export default function BmadInterface({ workspaceId, className = '' }: BmadInterfaceProps) {
  const [currentStep, setCurrentStep] = useState<BMadStep>('pathway-selection')
  const [mockElicitationData, setMockElicitationData] = useState<{
    options: NumberedOption[]
    phaseTitle: string
    prompt: string
  } | null>(null)

  const {
    currentSession,
    isLoading,
    error,
    createSession,
    advanceSession,
    getSession,
    pauseSession,
    resumeSession,
    exitSession
  } = useBmadSession()

  const checkForActiveSessions = useCallback(async () => {
    try {
      const response = await fetch(`/api/bmad?action=sessions&workspaceId=${workspaceId}&status=active`)
      
      if (response.ok) {
        const result = await response.json()
        
        if (result.success && result.data.sessions && result.data.sessions.length > 0) {
          // Load the most recent active session
          const activeSession = result.data.sessions[0]
          await getSession(activeSession.id)
          setCurrentStep('session-active')
          generateMockElicitationData()
        }
      }
    } catch (error) {
      console.error('Error checking for active sessions:', error)
    }
  }, [workspaceId, getSession])

  // Check for existing active sessions on mount
  useEffect(() => {
    checkForActiveSessions()
  }, [workspaceId, checkForActiveSessions])

  const handlePathwaySelected = async (pathway: PathwayType, userInput?: string) => {
    try {
      await createSession(workspaceId, pathway, userInput)
      setCurrentStep('session-active')
      generateMockElicitationData()
    } catch (error) {
      console.error('Error creating session:', error)
      // Error handling is done in the hook
    }
  }

  const handleSessionExit = () => {
    exitSession()
    setCurrentStep('pathway-selection')
    setMockElicitationData(null)
  }

  const handleElicitationSubmit = async (response: UserResponse) => {
    if (!currentSession) return

    try {
      const userInput = response.text || `Selected option ${response.elicitationChoice}`
      await advanceSession(currentSession.id, userInput)
      
      // Generate new mock data for next phase
      generateMockElicitationData()
      
      // Check if session is completed
      if (currentSession.progress.overallCompletion >= 100) {
        setCurrentStep('session-completed')
      }
    } catch (error) {
      console.error('Error advancing session:', error)
    }
  }

  // Generate mock elicitation data since backend may not be fully ready
  const generateMockElicitationData = () => {
    const mockOptions: NumberedOption[] = [
      {
        number: 1,
        text: "Focus on market research and competitive analysis to understand the landscape",
        category: "analysis",
        estimatedTime: 15
      },
      {
        number: 2, 
        text: "Develop a minimum viable product (MVP) to test core assumptions",
        category: "validation",
        estimatedTime: 30
      },
      {
        number: 3,
        text: "Create detailed user personas and journey maps",
        category: "strategy",
        estimatedTime: 20
      },
      {
        number: 4,
        text: "Build financial models and revenue projections",
        category: "analysis",
        estimatedTime: 25
      },
      {
        number: 5,
        text: "Design a strategic partnership framework",
        category: "strategy", 
        estimatedTime: 18
      },
      {
        number: 6,
        text: "Establish key performance indicators (KPIs) and success metrics",
        category: "optimization",
        estimatedTime: 12
      },
      {
        number: 7,
        text: "Conduct stakeholder interviews and feedback sessions",
        category: "validation",
        estimatedTime: 35
      },
      {
        number: 8,
        text: "Develop a comprehensive go-to-market strategy",
        category: "execution",
        estimatedTime: 28
      },
      {
        number: 9,
        text: "Create a risk assessment and mitigation plan",
        category: "analysis",
        estimatedTime: 22
      }
    ]

    setMockElicitationData({
      options: mockOptions,
      phaseTitle: "Strategic Direction Setting",
      prompt: "Based on your pathway selection, what would be the most valuable next step to move your initiative forward? Choose the approach that best aligns with your current priorities and available resources."
    })
  }

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'pathway-selection':
        return (
          <div className="space-y-6">
            <PathwaySelector
              workspaceId={workspaceId}
              onPathwaySelected={handlePathwaySelected}
              className="w-full"
            />
            
            {error && (
              <div className="bg-error/5 border border-error/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-error" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                  <span className="text-error font-medium">Error</span>
                </div>
                <p className="text-error text-sm">{error}</p>
              </div>
            )}
          </div>
        )

      case 'session-active':
        if (!currentSession) {
          return (
            <div className="text-center py-8">
              <div className="loading-shimmer h-8 w-48 rounded mb-4 mx-auto"></div>
              <p className="text-secondary">Loading your session...</p>
            </div>
          )
        }

        return (
          <div className="space-y-6">
            <SessionManager
              session={currentSession}
              onPause={pauseSession}
              onResume={resumeSession}
              onExit={handleSessionExit}
              className="w-full"
            />

            {mockElicitationData && (
              <ElicitationPanel
                sessionId={currentSession.id}
                phaseId={currentSession.currentPhase}
                phaseTitle={mockElicitationData.phaseTitle}
                prompt={mockElicitationData.prompt}
                options={mockElicitationData.options}
                onSubmit={handleElicitationSubmit}
                className="w-full"
              />
            )}

            {error && (
              <div className="bg-error/5 border border-error/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-error" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                  </svg>
                  <span className="text-error font-medium">Session Error</span>
                </div>
                <p className="text-error text-sm">{error}</p>
              </div>
            )}
          </div>
        )

      case 'session-completed':
        return (
          <div className="bg-white rounded-lg border border-divider p-8 text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-success" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-primary mb-2">Session Completed!</h2>
              <p className="text-secondary">
                Your strategic session has been completed successfully. Your insights and outputs have been saved.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => setCurrentStep('pathway-selection')}
                className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
              >
                Start New Session
              </button>
              <button
                onClick={handleSessionExit}
                className="px-6 py-3 border border-divider text-secondary rounded-lg hover:bg-primary/5 transition-colors"
              >
                Return to Workspace
              </button>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className={`bmad-interface ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">B</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-primary">BMad Method</h1>
            <p className="text-secondary text-sm">Strategic frameworks for breakthrough thinking</p>
          </div>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
            currentStep === 'pathway-selection' 
              ? 'bg-primary text-white' 
              : 'bg-gray-100 text-gray-600'
          }`}>
            1. Pathway
          </div>
          <div className="w-8 h-px bg-divider"></div>
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
            currentStep === 'session-active' 
              ? 'bg-primary text-white' 
              : 'bg-gray-100 text-gray-600'
          }`}>
            2. Session
          </div>
          <div className="w-8 h-px bg-divider"></div>
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
            currentStep === 'session-completed' 
              ? 'bg-success text-white' 
              : 'bg-gray-100 text-gray-600'
          }`}>
            3. Results
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={isLoading ? 'opacity-50' : ''}>
        {renderCurrentStep()}
      </div>
    </div>
  )
}