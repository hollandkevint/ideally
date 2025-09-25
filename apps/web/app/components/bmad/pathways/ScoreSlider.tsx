'use client'

import { useState } from 'react'
import { ScoringGuidance, getScoreLabel, getScoreColor } from '@/lib/bmad/utils/scoring-guidance'

interface ScoreSliderProps {
  label: string
  value: number
  onChange: (value: number) => void
  guidance: ScoringGuidance
  className?: string
}

export default function ScoreSlider({
  label,
  value,
  onChange,
  guidance,
  className = ''
}: ScoreSliderProps) {
  const [showGuidance, setShowGuidance] = useState(false)

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(parseInt(e.target.value))
  }

  return (
    <div className={`score-slider ${className}`}>
      <div className="mb-4">
        <div className="flex items-center gap-3 mb-2">
          <label className="text-lg font-semibold text-gray-800">
            {label}
          </label>
          <button
            type="button"
            onClick={() => setShowGuidance(!showGuidance)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            {showGuidance ? 'Hide' : 'Show'} guidance
          </button>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600 min-w-[3rem]">1 (Low)</span>
          <div className="flex-1 relative">
            <input
              type="range"
              min="1"
              max="10"
              value={value}
              onChange={handleSliderChange}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              {Array.from({ length: 10 }, (_, i) => (
                <span key={i + 1}>{i + 1}</span>
              ))}
            </div>
          </div>
          <span className="text-sm text-gray-600 min-w-[4rem]">10 (High)</span>
        </div>

        <div className="mt-2 text-center">
          <span className={`text-lg font-bold ${getScoreColor(value)}`}>
            {value} - {getScoreLabel(value)}
          </span>
        </div>
      </div>

      {showGuidance && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <h4 className="font-semibold text-blue-900 mb-2">{guidance.title}</h4>
          <p className="text-blue-800 text-sm mb-3">{guidance.scale}</p>

          <div className="space-y-2">
            {guidance.examples.map((example, index) => (
              <div
                key={index}
                className={`flex items-start gap-3 p-2 rounded ${
                  value === example.score ? 'bg-blue-100 border border-blue-300' : 'bg-white'
                }`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                  value === example.score ? 'bg-blue-600' : 'bg-gray-400'
                }`}>
                  {example.score}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-800">{example.label}</div>
                  <div className="text-sm text-gray-600">{example.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }

        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
      `}</style>
    </div>
  )
}