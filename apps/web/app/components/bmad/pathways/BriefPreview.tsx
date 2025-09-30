'use client'

import { FeatureBrief } from '@/lib/bmad/types'

interface BriefPreviewProps {
  brief: FeatureBrief
  className?: string
}

export default function BriefPreview({ brief, className = '' }: BriefPreviewProps) {
  return (
    <div className={`brief-preview ${className}`}>
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="p-6 space-y-6">
          {/* Title */}
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">{brief.title}</h3>
            <p className="text-sm text-gray-500">
              Generated {new Date(brief.generatedAt).toLocaleString()}
              {brief.version > 1 && ` • Version ${brief.version}`}
            </p>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Description
            </h4>
            <p className="text-gray-700 leading-relaxed">{brief.description}</p>
          </div>

          {/* Priority Context */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-blue-900 uppercase tracking-wider mb-3">
              Priority Context
            </h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {brief.priorityContext.score}
                </div>
                <div className="text-xs text-blue-700 mt-1">Priority Score</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-semibold text-blue-900 px-2 py-1 bg-white rounded">
                  {brief.priorityContext.category}
                </div>
                <div className="text-xs text-blue-700 mt-1">Category</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-semibold text-blue-900 px-2 py-1 bg-white rounded">
                  {brief.priorityContext.quadrant}
                </div>
                <div className="text-xs text-blue-700 mt-1">Quadrant</div>
              </div>
            </div>
          </div>

          {/* User Stories */}
          <div>
            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              User Stories
            </h4>
            <div className="space-y-3">
              {brief.userStories.map((story, idx) => (
                <div
                  key={idx}
                  className="pl-4 border-l-3 border-l-blue-400 py-2 bg-blue-50/50 rounded-r"
                >
                  <div className="flex items-start">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold mr-3 flex-shrink-0">
                      {idx + 1}
                    </span>
                    <p className="text-gray-700 leading-relaxed">{story}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Acceptance Criteria */}
          <div>
            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Acceptance Criteria
            </h4>
            <div className="space-y-2">
              {brief.acceptanceCriteria.map((ac, idx) => (
                <div key={idx} className="flex items-start">
                  <span className="flex items-center justify-center w-6 h-6 rounded bg-green-100 text-green-700 text-xs font-bold mr-3 flex-shrink-0 mt-0.5">
                    ✓
                  </span>
                  <p className="text-gray-700 leading-relaxed">
                    <span className="font-medium text-gray-900">{idx + 1}.</span> {ac}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Success Metrics */}
          <div>
            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Success Metrics
            </h4>
            <div className="grid md:grid-cols-2 gap-3">
              {brief.successMetrics.map((metric, idx) => (
                <div
                  key={idx}
                  className="flex items-start p-3 bg-green-50 rounded-lg border border-green-200"
                >
                  <span className="text-green-600 text-xl mr-3 flex-shrink-0">📊</span>
                  <p className="text-gray-700 text-sm leading-relaxed">{metric}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Implementation Notes */}
          <div>
            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Implementation Notes
            </h4>
            <div className="space-y-3">
              {brief.implementationNotes.map((note, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-amber-50 rounded-lg border border-amber-200"
                >
                  <div className="flex items-start">
                    <span className="text-amber-600 text-lg mr-3 flex-shrink-0">💡</span>
                    <p className="text-gray-700 leading-relaxed">{note}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Metadata Footer */}
          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div>
                Last edited: {new Date(brief.lastEditedAt).toLocaleString()}
              </div>
              <div>
                Brief ID: <span className="font-mono">{brief.id.slice(0, 8)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}