'use client'

import { useState, useEffect } from 'react'
import { FeatureBrief, FeatureSessionData, ExportFormat, BriefQualityValidation } from '@/lib/bmad/types'
import BriefPreview from './BriefPreview'
import BriefEditor from './BriefEditor'
import ExportOptions from './ExportOptions'

interface FeatureBriefGeneratorProps {
  sessionId: string
  sessionData: FeatureSessionData
  onComplete?: () => void
  className?: string
}

export default function FeatureBriefGenerator({
  sessionId,
  sessionData,
  onComplete,
  className = ''
}: FeatureBriefGeneratorProps) {
  const [brief, setBrief] = useState<FeatureBrief | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validation, setValidation] = useState<BriefQualityValidation | null>(null)
  const [editMode, setEditMode] = useState(false)

  // Generate brief on mount if not already generated
  useEffect(() => {
    if (!brief && sessionData.featureBrief) {
      setBrief(sessionData.featureBrief)
    } else if (!brief && !isGenerating) {
      generateBrief()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const generateBrief = async () => {
    setIsGenerating(true)
    setError(null)

    try {
      const response = await fetch('/api/bmad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_feature_brief',
          sessionId
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate feature brief')
      }

      const data = await response.json()
      setBrief(data.brief)
      setValidation(data.validation)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate brief')
    } finally {
      setIsGenerating(false)
    }
  }

  const regenerateBrief = async () => {
    setIsRegenerating(true)
    setError(null)

    try {
      const response = await fetch('/api/bmad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'regenerate_feature_brief',
          sessionId
        })
      })

      if (!response.ok) {
        throw new Error('Failed to regenerate feature brief')
      }

      const data = await response.json()
      setBrief(data.brief)
      setValidation(data.validation)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to regenerate brief')
    } finally {
      setIsRegenerating(false)
    }
  }

  const updateBrief = async (updates: Partial<FeatureBrief>) => {
    if (!brief) return

    try {
      const response = await fetch('/api/bmad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_feature_brief',
          sessionId,
          briefId: brief.id,
          updates
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update feature brief')
      }

      const data = await response.json()
      setBrief(data.brief)
      setValidation(data.validation)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update brief')
    }
  }


  const getQualityScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-50 border-green-200'
    if (score >= 70) return 'text-blue-600 bg-blue-50 border-blue-200'
    if (score >= 50) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    return 'text-red-600 bg-red-50 border-red-200'
  }

  return (
    <div className={`feature-brief-generator ${className}`}>
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Feature Brief
          </h2>
          <p className="text-gray-600">
            Professional feature brief ready for development team handoff
          </p>
        </div>

        {/* Loading State */}
        {isGenerating && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600 text-center">
              Generating your feature brief...
              <br />
              <span className="text-sm text-gray-500">This may take up to 10 seconds</span>
            </p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Brief Content */}
        {brief && !isGenerating && (
          <div className="space-y-6">
            {/* Quality Score */}
            {validation && (
              <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">Brief Quality Score</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <div className={`inline-block px-3 py-1 rounded-full text-sm font-semibold border ${getQualityScoreColor(validation.qualityScore)}`}>
                        {validation.qualityScore}/100
                      </div>
                      {validation.qualityScore >= 90 && (
                        <span className="text-sm text-green-600">✓ Excellent</span>
                      )}
                      {validation.qualityScore >= 70 && validation.qualityScore < 90 && (
                        <span className="text-sm text-blue-600">✓ Good</span>
                      )}
                      {validation.qualityScore >= 50 && validation.qualityScore < 70 && (
                        <span className="text-sm text-yellow-600">⚠ Needs improvement</span>
                      )}
                      {validation.qualityScore < 50 && (
                        <span className="text-sm text-red-600">✗ Poor quality</span>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditMode(!editMode)}
                      className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      {editMode ? 'View Mode' : 'Edit Mode'}
                    </button>
                    <button
                      onClick={regenerateBrief}
                      disabled={isRegenerating}
                      className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isRegenerating ? 'Regenerating...' : '↻ Regenerate'}
                    </button>
                  </div>
                </div>

                {/* Validation Messages */}
                {(validation.errors.length > 0 || validation.warnings.length > 0) && (
                  <div className="mt-4 space-y-2">
                    {validation.errors.map((error, idx) => (
                      <div key={`error-${idx}`} className="text-sm text-red-600">
                        ✗ {error}
                      </div>
                    ))}
                    {validation.warnings.map((warning, idx) => (
                      <div key={`warning-${idx}`} className="text-sm text-yellow-600">
                        ⚠ {warning}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Brief Preview/Editor */}
            {editMode ? (
              <BriefEditor
                brief={brief}
                onUpdate={updateBrief}
                onCancel={() => setEditMode(false)}
              />
            ) : (
              <BriefPreview brief={brief} />
            )}

            {/* Export Options */}
            <ExportOptions
              brief={brief}
              sessionId={sessionId}
            />

            {/* Complete Button */}
            {onComplete && (
              <div className="flex justify-end pt-4 border-t border-gray-200">
                <button
                  onClick={onComplete}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-sm font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm"
                >
                  Complete Feature Refinement →
                </button>
              </div>
            )}
          </div>
        )}

        {/* Progress Indicator */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Step 4 of 4 - Feature Brief</span>
            <span>Time remaining: ~6 minutes</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: '100%' }}></div>
          </div>
        </div>
      </div>
    </div>
  )
}