'use client'

import { useState, useEffect, useCallback } from 'react'
import { PathwayType, BmadPathway } from '@/lib/bmad/types'

interface PathwayRecommendation {
  recommendedPathway: PathwayType
  confidence: number
  reasoning: string
  alternativePathways: PathwayType[]
}

interface PathwaySelectorProps {
  onPathwaySelected: (pathway: PathwayType, userInput?: string) => void
  workspaceId: string
  className?: string
}

export default function PathwaySelector({ 
  onPathwaySelected, 
  workspaceId: _workspaceId, 
  className = '' 
}: PathwaySelectorProps) {
  const [userInput, setUserInput] = useState('')
  const [pathways, setPathways] = useState<BmadPathway[]>([])
  const [recommendation, setRecommendation] = useState<PathwayRecommendation | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingPathways, setLoadingPathways] = useState(true)
  const [analysisLoading, setAnalysisLoading] = useState(false)
  const [selectedPathway, setSelectedPathway] = useState<PathwayType | null>(null)
  const [showRecommendation, setShowRecommendation] = useState(false)

  const fetchPathways = useCallback(async () => {
    try {
      setLoadingPathways(true)
      const response = await fetch('/api/bmad?action=pathways')
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      
      if (result.success && result.data.pathways) {
        setPathways(result.data.pathways)
      } else {
        console.error('Failed to load pathways:', result)
        // Fallback to default pathways if API fails
        setPathways(getDefaultPathways())
      }
    } catch (error) {
      console.error('Error fetching pathways:', error)
      // Fallback to default pathways
      setPathways(getDefaultPathways())
    } finally {
      setLoadingPathways(false)
    }
  }, [])

  // Load available pathways on component mount
  useEffect(() => {
    fetchPathways()
  }, [fetchPathways])

  // Fallback default pathways in case API is not ready
  const getDefaultPathways = (): BmadPathway[] => [
    {
      id: PathwayType.NEW_IDEA,
      name: 'New Idea Development',
      description: 'Transform your early-stage idea into a structured concept with clear value propositions and market validation.',
      targetUser: 'Entrepreneurs and innovators with new concepts',
      expectedOutcome: 'Validated business concept with clear next steps',
      timeCommitment: 45,
      templateSequence: [],
      maryPersonaConfig: {
        primaryPersona: 'coach',
        adaptationTriggers: [],
        communicationStyle: {
          questioningStyle: 'curious',
          responseLength: 'moderate',
          frameworkEmphasis: 'moderate'
        }
      }
    },
    {
      id: PathwayType.BUSINESS_MODEL,
      name: 'Business Model Analysis',
      description: 'Deep dive into your existing business model to identify optimization opportunities and strategic pivots.',
      targetUser: 'Business owners and product managers',
      expectedOutcome: 'Comprehensive business model assessment and improvement roadmap',
      timeCommitment: 60,
      templateSequence: [],
      maryPersonaConfig: {
        primaryPersona: 'analyst',
        adaptationTriggers: [],
        communicationStyle: {
          questioningStyle: 'challenging',
          responseLength: 'detailed',
          frameworkEmphasis: 'heavy'
        }
      }
    },
    {
      id: PathwayType.STRATEGIC_OPTIMIZATION,
      name: 'Strategic Optimization',
      description: 'Optimize your existing strategy with data-driven insights and strategic framework applications.',
      targetUser: 'Strategic leaders and consultants',
      expectedOutcome: 'Actionable strategic optimization plan with prioritized initiatives',
      timeCommitment: 75,
      templateSequence: [],
      maryPersonaConfig: {
        primaryPersona: 'advisor',
        adaptationTriggers: [],
        communicationStyle: {
          questioningStyle: 'supportive',
          responseLength: 'detailed',
          frameworkEmphasis: 'heavy'
        }
      }
    }
  ]

  const analyzeIntent = async () => {
    if (!userInput.trim()) return

    try {
      setAnalysisLoading(true)
      const response = await fetch('/api/bmad', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'analyze_intent',
          userInput: userInput.trim()
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (result.success && result.data.recommendation) {
        setRecommendation(result.data.recommendation)
        setShowRecommendation(true)
      } else {
        console.error('Intent analysis failed:', result)
      }
    } catch (error) {
      console.error('Error analyzing intent:', error)
    } finally {
      setAnalysisLoading(false)
    }
  }

  const handlePathwaySelect = async (pathway: PathwayType) => {
    setLoading(true)
    setSelectedPathway(pathway)
    
    try {
      await onPathwaySelected(pathway, userInput.trim() || undefined)
    } catch (error) {
      console.error('Error selecting pathway:', error)
      setSelectedPathway(null)
    } finally {
      setLoading(false)
    }
  }

  const getPathwayIcon = (pathwayId: PathwayType) => {
    switch (pathwayId) {
      case PathwayType.NEW_IDEA:
        return (
          <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        )
      case PathwayType.BUSINESS_MODEL:
        return (
          <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        )
      case PathwayType.STRATEGIC_OPTIMIZATION:
        return (
          <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        )
      default:
        return (
          <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
    }
  }

  if (loadingPathways) {
    return (
      <div className={`bg-white rounded-lg border border-divider p-6 ${className}`}>
        <div className="text-center">
          <div className="loading-shimmer h-8 w-64 rounded mb-4 mx-auto"></div>
          <div className="loading-shimmer h-4 w-48 rounded mb-6 mx-auto"></div>
          <div className="grid gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="loading-shimmer h-32 w-full rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg border border-divider p-6 ${className}`}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-primary mb-2">Choose Your Strategic Pathway</h2>
        <p className="text-secondary">
          Select the pathway that best matches your current challenge, or describe your situation for a personalized recommendation.
        </p>
      </div>

      {/* Intent Analysis Input */}
      <div className="mb-6">
        <label htmlFor="intentInput" className="block text-sm font-medium text-primary mb-2">
          Describe your challenge or goal (optional)
        </label>
        <div className="flex gap-2">
          <input
            id="intentInput"
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="e.g., I have a new app idea but don't know if it's viable..."
            className="flex-1 px-4 py-2 border border-divider rounded-lg focus:border-primary focus:outline-none"
            disabled={loading || analysisLoading}
          />
          <button
            onClick={analyzeIntent}
            disabled={!userInput.trim() || loading || analysisLoading}
            className="px-4 py-2 bg-accent text-white font-medium rounded-lg hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {analysisLoading ? 'Analyzing...' : 'Analyze'}
          </button>
        </div>
      </div>

      {/* AI Recommendation */}
      {showRecommendation && recommendation && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-semibold text-sm">M</span>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-1">Mary&apos;s Recommendation</h3>
              <p className="text-blue-800 text-sm mb-2">{recommendation.reasoning}</p>
              <p className="text-blue-700 text-xs">
                Confidence: {Math.round(recommendation.confidence * 100)}%
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Pathway Cards */}
      <div className="grid gap-4">
        {pathways.map((pathway) => {
          const isRecommended = recommendation?.recommendedPathway === pathway.id
          const isSelected = selectedPathway === pathway.id
          const isLoading = loading && isSelected

          return (
            <div
              key={pathway.id}
              className={`border rounded-lg p-4 transition-all cursor-pointer hover:shadow-md ${
                isRecommended 
                  ? 'border-blue-300 bg-blue-50' 
                  : isSelected 
                    ? 'border-primary bg-primary/5' 
                    : 'border-divider hover:border-primary/50'
              } ${loading && !isSelected ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => !loading && handlePathwaySelect(pathway.id)}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  {getPathwayIcon(pathway.id)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-primary">{pathway.name}</h3>
                        {isRecommended && (
                          <span className="px-2 py-1 text-xs bg-blue-500 text-white rounded-full">
                            Recommended
                          </span>
                        )}
                      </div>
                      <p className="text-secondary text-sm mb-3">{pathway.description}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-secondary">Target User:</span>
                          <p className="text-foreground">{pathway.targetUser}</p>
                        </div>
                        <div>
                          <span className="text-secondary">Time Commitment:</span>
                          <p className="text-foreground">{pathway.timeCommitment} minutes</p>
                        </div>
                      </div>
                      
                      <div className="mt-3">
                        <span className="text-secondary text-sm">Expected Outcome:</span>
                        <p className="text-foreground text-sm">{pathway.expectedOutcome}</p>
                      </div>
                    </div>
                    
                    <div className="flex-shrink-0">
                      {isLoading ? (
                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <svg className="w-5 h-5 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {loading && (
        <div className="mt-4 text-center text-secondary">
          <p className="text-sm">Starting your strategic session...</p>
        </div>
      )}
    </div>
  )
}