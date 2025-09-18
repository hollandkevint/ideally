'use client'

import { useState, useEffect } from 'react'
import ScoreSlider from './ScoreSlider'
import PriorityMatrix from './PriorityMatrix'
import { EFFORT_SCORING_GUIDANCE, IMPACT_SCORING_GUIDANCE } from '@/lib/bmad/utils/scoring-guidance'
import { calculatePriority } from '@/lib/bmad/pathways/priority-scoring'
import { PriorityScoring } from '@/lib/bmad/types'

interface PriorityScoringProps {
  onScoreChange?: (scoring: PriorityScoring) => void
  className?: string
}

export default function PriorityScoring({
  onScoreChange,
  className = ''
}: PriorityScoringProps) {
  const [effortScore, setEffortScore] = useState(5)
  const [impactScore, setImpactScore] = useState(5)
  const [priorityScore, setPriorityScore] = useState<PriorityScoring | null>(null)

  // Calculate priority whenever scores change
  useEffect(() => {
    const calculated = calculatePriority(impactScore, effortScore)
    setPriorityScore(calculated)
    onScoreChange?.(calculated)
  }, [effortScore, impactScore, onScoreChange])

  const getPriorityCategoryColor = (category: string) => {
    switch (category) {
      case 'Critical': return 'text-red-600 bg-red-50 border-red-200'
      case 'High': return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'Medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'Low': return 'text-gray-600 bg-gray-50 border-gray-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getQuadrantColor = (quadrant: string) => {
    switch (quadrant) {
      case 'Quick Wins': return 'text-green-700 bg-green-50 border-green-200'
      case 'Major Projects': return 'text-blue-700 bg-blue-50 border-blue-200'
      case 'Fill-ins': return 'text-yellow-700 bg-yellow-50 border-yellow-200'
      case 'Time Wasters': return 'text-red-700 bg-red-50 border-red-200'
      default: return 'text-gray-700 bg-gray-50 border-gray-200'
    }
  }

  return (
    <div className={`priority-scoring-container ${className}`}>
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Priority Scoring
          </h2>
          <p className="text-gray-600">
            Rate your feature on effort and impact to determine its priority level.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Effort Scoring */}
          <div className="space-y-4">
            <ScoreSlider
              label="Development Effort"
              value={effortScore}
              onChange={setEffortScore}
              guidance={EFFORT_SCORING_GUIDANCE}
            />
          </div>

          {/* Impact Scoring */}
          <div className="space-y-4">
            <ScoreSlider
              label="User & Business Impact"
              value={impactScore}
              onChange={setImpactScore}
              guidance={IMPACT_SCORING_GUIDANCE}
            />
          </div>
        </div>

        {/* Priority Results and Matrix */}
        {priorityScore && (
          <div className="space-y-6">
            {/* Priority Matrix Visualization */}
            <PriorityMatrix priorityScoring={priorityScore} />

            {/* Priority Summary */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">
                Priority Assessment Results
              </h3>

              <div className="grid md:grid-cols-3 gap-4 mb-4">
                {/* Priority Score */}
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-1">
                    {priorityScore.calculated_priority}
                  </div>
                  <div className="text-sm text-blue-800">Priority Score</div>
                  <div className="text-xs text-blue-600">(Impact ÷ Effort)</div>
                </div>

                {/* Priority Category */}
                <div className="text-center">
                  <div className={`inline-block px-3 py-1 rounded-full text-sm font-semibold border ${getPriorityCategoryColor(priorityScore.priority_category)}`}>
                    {priorityScore.priority_category}
                  </div>
                  <div className="text-sm text-blue-800 mt-1">Priority Level</div>
                </div>

                {/* Quadrant */}
                <div className="text-center">
                  <div className={`inline-block px-3 py-1 rounded-full text-sm font-semibold border ${getQuadrantColor(priorityScore.quadrant)}`}>
                    {priorityScore.quadrant}
                  </div>
                  <div className="text-sm text-blue-800 mt-1">Quadrant</div>
                </div>
              </div>

              {/* Recommendations */}
              <div className="pt-4 border-t border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-2">Recommendation</h4>
                <p className="text-blue-800 text-sm">
                  {priorityScore.quadrant === 'Quick Wins' &&
                    "🎯 High priority! This feature offers maximum value for minimal investment. Consider implementing immediately."}
                  {priorityScore.quadrant === 'Major Projects' &&
                    "📋 Strategic initiative. High impact but requires significant planning and resources. Schedule for upcoming quarters."}
                  {priorityScore.quadrant === 'Fill-ins' &&
                    "⏰ Nice-to-have improvement. Low effort and impact - good for filling development capacity when available."}
                  {priorityScore.quadrant === 'Time Wasters' &&
                    "⚠️ Question this feature. High effort with low impact may not justify the investment. Consider alternatives."}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Progress Indicator */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Step 2 of 4 - Priority Scoring</span>
            <span>Time remaining: ~4 minutes</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: '50%' }}></div>
          </div>
        </div>
      </div>
    </div>
  )
}