'use client'

import { PriorityScoring } from '@/lib/bmad/types'

interface PriorityMatrixProps {
  priorityScoring?: PriorityScoring
  className?: string
}

export default function PriorityMatrix({
  priorityScoring,
  className = ''
}: PriorityMatrixProps) {
  const getQuadrantConfig = (quadrant: string) => {
    switch (quadrant) {
      case 'Quick Wins':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          text: 'text-green-800',
          dotColor: '#10b981'
        }
      case 'Major Projects':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          text: 'text-blue-800',
          dotColor: '#3b82f6'
        }
      case 'Fill-ins':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          text: 'text-yellow-800',
          dotColor: '#f59e0b'
        }
      case 'Time Wasters':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          text: 'text-red-800',
          dotColor: '#ef4444'
        }
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          text: 'text-gray-800',
          dotColor: '#6b7280'
        }
    }
  }

  const calculateDotPosition = (effort: number, impact: number) => {
    const effortPercent = ((effort - 1) / 9) * 100
    const impactPercent = ((10 - impact) / 9) * 100
    return {
      left: `${effortPercent}%`,
      top: `${impactPercent}%`
    }
  }

  return (
    <div className={`priority-matrix ${className}`}>
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          Priority Matrix
        </h3>
        <p className="text-gray-600 mb-6">
          Visual representation of your feature's position based on effort and impact scores.
        </p>

        <div className="relative">
          {/* Matrix Grid */}
          <div className="grid grid-cols-2 gap-2 h-96 border-2 border-gray-300 rounded-lg overflow-hidden">
            {/* Top Left: Fill-ins (Low Impact, Low Effort) */}
            <div className="bg-yellow-50 border-yellow-200 border-r border-b p-4 relative">
              <div className="absolute top-2 left-2">
                <h4 className="font-semibold text-yellow-800 text-sm">Fill-ins</h4>
                <p className="text-xs text-yellow-600">Low Impact, Low Effort</p>
              </div>
              <div className="absolute bottom-2 right-2">
                <span className="text-xs text-yellow-600">⏰ Nice-to-have</span>
              </div>
            </div>

            {/* Top Right: Quick Wins (High Impact, Low Effort) */}
            <div className="bg-green-50 border-green-200 border-b p-4 relative">
              <div className="absolute top-2 left-2">
                <h4 className="font-semibold text-green-800 text-sm">Quick Wins</h4>
                <p className="text-xs text-green-600">High Impact, Low Effort</p>
              </div>
              <div className="absolute bottom-2 right-2">
                <span className="text-xs text-green-600">🎯 Do First</span>
              </div>
            </div>

            {/* Bottom Left: Time Wasters (Low Impact, High Effort) */}
            <div className="bg-red-50 border-red-200 border-r p-4 relative">
              <div className="absolute top-2 left-2">
                <h4 className="font-semibold text-red-800 text-sm">Time Wasters</h4>
                <p className="text-xs text-red-600">Low Impact, High Effort</p>
              </div>
              <div className="absolute bottom-2 right-2">
                <span className="text-xs text-red-600">⚠️ Avoid</span>
              </div>
            </div>

            {/* Bottom Right: Major Projects (High Impact, High Effort) */}
            <div className="bg-blue-50 border-blue-200 p-4 relative">
              <div className="absolute top-2 left-2">
                <h4 className="font-semibold text-blue-800 text-sm">Major Projects</h4>
                <p className="text-xs text-blue-600">High Impact, High Effort</p>
              </div>
              <div className="absolute bottom-2 right-2">
                <span className="text-xs text-blue-600">📋 Plan Well</span>
              </div>
            </div>

            {/* Feature Position Dot */}
            {priorityScoring && (
              <div
                className="absolute w-4 h-4 rounded-full shadow-lg border-2 border-white z-10 transform -translate-x-2 -translate-y-2"
                style={{
                  ...calculateDotPosition(priorityScoring.effort_score, priorityScoring.impact_score),
                  backgroundColor: getQuadrantConfig(priorityScoring.quadrant).dotColor
                }}
                title={`Your Feature: ${priorityScoring.quadrant} (Impact: ${priorityScoring.impact_score}, Effort: ${priorityScoring.effort_score})`}
              />
            )}
          </div>

          {/* Axis Labels */}
          <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">Low Effort</span>
              <div className="w-24 h-0.5 bg-gray-300"></div>
              <span className="text-sm text-gray-600">High Effort</span>
            </div>
          </div>
          <div className="absolute -left-16 top-1/2 transform -translate-y-1/2 -rotate-90">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">Low Impact</span>
              <div className="w-16 h-0.5 bg-gray-300"></div>
              <span className="text-sm text-gray-600">High Impact</span>
            </div>
          </div>
        </div>

        {/* Current Position Summary */}
        {priorityScoring && (
          <div className="mt-8 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-gray-900">Your Feature Position</h4>
                <p className="text-sm text-gray-600">
                  Impact: {priorityScoring.impact_score}/10 • Effort: {priorityScoring.effort_score}/10
                </p>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-semibold border ${getQuadrantConfig(priorityScoring.quadrant).bg} ${getQuadrantConfig(priorityScoring.quadrant).border} ${getQuadrantConfig(priorityScoring.quadrant).text}`}>
                {priorityScoring.quadrant}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}