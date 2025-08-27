'use client'

import { useState } from 'react'
import { NumberedOption, UserResponse } from '@/lib/bmad/types'

interface ElicitationPanelProps {
  sessionId: string
  phaseId: string
  phaseTitle: string
  prompt: string
  options: NumberedOption[]
  onSubmit: (response: UserResponse) => void
  allowCustomInput?: boolean
  customInputPlaceholder?: string
  className?: string
}

export default function ElicitationPanel({
  sessionId,
  phaseId,
  phaseTitle,
  prompt,
  options,
  onSubmit,
  allowCustomInput = true,
  customInputPlaceholder = "Or describe your own approach...",
  className = ''
}: ElicitationPanelProps) {
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [customInput, setCustomInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showCustomInput, setShowCustomInput] = useState(false)

  const handleOptionSelect = (optionNumber: number) => {
    setSelectedOption(optionNumber)
    setShowCustomInput(false)
    setCustomInput('')
  }

  const handleCustomInputToggle = () => {
    setShowCustomInput(!showCustomInput)
    setSelectedOption(null)
  }

  const handleSubmit = async () => {
    if (isSubmitting) return

    let responseData: UserResponse

    if (selectedOption !== null) {
      const selectedOptionData = options.find(opt => opt.number === selectedOption)
      responseData = {
        elicitationChoice: selectedOption,
        text: selectedOptionData?.text || '',
        data: {
          category: selectedOptionData?.category,
          estimatedTime: selectedOptionData?.estimatedTime
        },
        timestamp: new Date()
      }
    } else if (customInput.trim()) {
      responseData = {
        text: customInput.trim(),
        data: {
          customResponse: true
        },
        timestamp: new Date()
      }
    } else {
      return // No selection made
    }

    setIsSubmitting(true)
    
    try {
      await onSubmit(responseData)
    } catch (error) {
      console.error('Error submitting response:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const canSubmit = selectedOption !== null || (showCustomInput && customInput.trim().length > 0)

  const getCategoryColor = (category: string): string => {
    const colors: Record<string, string> = {
      'analysis': 'bg-blue-100 text-blue-800 border-blue-200',
      'strategy': 'bg-purple-100 text-purple-800 border-purple-200',
      'validation': 'bg-green-100 text-green-800 border-green-200',
      'optimization': 'bg-orange-100 text-orange-800 border-orange-200',
      'innovation': 'bg-pink-100 text-pink-800 border-pink-200',
      'execution': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      'default': 'bg-gray-100 text-gray-800 border-gray-200'
    }
    
    return colors[category.toLowerCase()] || colors.default
  }

  const formatEstimatedTime = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes}m`
    } else {
      const hours = Math.floor(minutes / 60)
      const remainingMinutes = minutes % 60
      return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
    }
  }

  return (
    <div className={`bg-white rounded-lg border border-divider ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-divider">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-primary mb-2">{phaseTitle}</h3>
            <p className="text-secondary leading-relaxed">{prompt}</p>
          </div>
          <div className="ml-4 text-right">
            <div className="text-sm text-secondary">Phase</div>
            <div className="text-xs font-mono text-primary">
              {phaseId.replace(/_/g, '-').toUpperCase()}
            </div>
          </div>
        </div>
      </div>

      {/* Options */}
      <div className="p-6">
        <div className="mb-6">
          <h4 className="text-lg font-medium text-primary mb-4">Choose your approach:</h4>
          
          <div className="grid gap-3">
            {options.map((option) => (
              <div
                key={option.number}
                className={`
                  border rounded-lg p-4 cursor-pointer transition-all hover:shadow-sm
                  ${selectedOption === option.number 
                    ? 'border-primary bg-primary/5 shadow-sm' 
                    : 'border-divider hover:border-primary/50'
                  }
                  ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}
                `}
                onClick={() => !isSubmitting && handleOptionSelect(option.number)}
              >
                <div className="flex items-start gap-4">
                  {/* Number Circle */}
                  <div className={`
                    flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm
                    ${selectedOption === option.number 
                      ? 'bg-primary text-white' 
                      : 'bg-gray-100 text-gray-600'
                    }
                  `}>
                    {option.number}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <p className="text-foreground leading-relaxed">{option.text}</p>
                      
                      {/* Time Estimate */}
                      <div className="flex-shrink-0 text-right">
                        <div className="text-xs text-secondary mb-1">Est. Time</div>
                        <div className="text-sm font-medium text-primary">
                          {formatEstimatedTime(option.estimatedTime)}
                        </div>
                      </div>
                    </div>
                    
                    {/* Category Badge */}
                    <div className="flex items-center gap-2">
                      <span className={`
                        px-2 py-1 text-xs rounded-full border
                        ${getCategoryColor(option.category)}
                      `}>
                        {option.category}
                      </span>
                    </div>
                  </div>

                  {/* Selection Indicator */}
                  <div className="flex-shrink-0">
                    {selectedOption === option.number && (
                      <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Custom Input Option */}
        {allowCustomInput && (
          <div className="border-t border-divider pt-6">
            <div className="flex items-center gap-2 mb-3">
              <button
                onClick={handleCustomInputToggle}
                disabled={isSubmitting}
                className={`
                  flex items-center gap-2 text-sm font-medium transition-colors
                  ${showCustomInput ? 'text-primary' : 'text-secondary hover:text-primary'}
                  ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <div className={`
                  w-4 h-4 rounded border flex items-center justify-center
                  ${showCustomInput ? 'bg-primary border-primary' : 'border-divider'}
                `}>
                  {showCustomInput && (
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 12l2 2 4-4"/>
                    </svg>
                  )}
                </div>
                Custom Response
              </button>
            </div>

            {showCustomInput && (
              <div className="mt-3">
                <textarea
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  placeholder={customInputPlaceholder}
                  rows={3}
                  disabled={isSubmitting}
                  className="w-full px-4 py-3 border border-divider rounded-lg focus:border-primary focus:outline-none resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <div className="flex justify-between items-center mt-2">
                  <div className="text-xs text-secondary">
                    {customInput.length}/500 characters
                  </div>
                  {customInput.length > 500 && (
                    <div className="text-xs text-error">
                      Response too long
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end mt-6 pt-6 border-t border-divider">
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting || (showCustomInput && customInput.length > 500)}
            className={`
              px-6 py-3 rounded-lg font-medium transition-all
              ${canSubmit && !isSubmitting && !(showCustomInput && customInput.length > 500)
                ? 'bg-primary text-white hover:bg-primary-hover shadow-sm' 
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }
            `}
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Processing...
              </div>
            ) : (
              'Continue'
            )}
          </button>
        </div>

        {/* Progress Indicator */}
        <div className="mt-4 text-center">
          <div className="text-xs text-secondary">
            Session ID: {sessionId.slice(-8)}
          </div>
        </div>
      </div>
    </div>
  )
}