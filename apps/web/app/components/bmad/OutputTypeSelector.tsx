'use client'

import { useState } from 'react'
import { FileText, Layout, Lightbulb, FolderKanban, Download, ChevronDown } from 'lucide-react'

export type OutputType = 'lean-canvas' | 'brainstorm-summary' | 'product-brief' | 'project-brief'

interface OutputTypeOption {
  id: OutputType
  name: string
  description: string
  icon: React.ReactNode
  estimatedTime: string
}

interface OutputTypeSelectorProps {
  onSelect: (type: OutputType) => void
  selectedType?: OutputType
  isGenerating?: boolean
  className?: string
}

const outputTypes: OutputTypeOption[] = [
  {
    id: 'lean-canvas',
    name: 'Lean Canvas',
    description: 'A one-page business model overview with problem, solution, metrics, and revenue streams',
    icon: <Layout className="w-5 h-5" />,
    estimatedTime: '~30 seconds'
  },
  {
    id: 'brainstorm-summary',
    name: 'Brainstorm Summary',
    description: 'Key insights, action items, and decisions from your conversation',
    icon: <Lightbulb className="w-5 h-5" />,
    estimatedTime: '~20 seconds'
  },
  {
    id: 'product-brief',
    name: 'Product Brief',
    description: 'Complete product definition with features, users, success criteria, and timeline',
    icon: <FileText className="w-5 h-5" />,
    estimatedTime: '~45 seconds'
  },
  {
    id: 'project-brief',
    name: 'Project Brief',
    description: 'Formal project documentation with scope, deliverables, milestones, and stakeholders',
    icon: <FolderKanban className="w-5 h-5" />,
    estimatedTime: '~45 seconds'
  }
]

export default function OutputTypeSelector({
  onSelect,
  selectedType,
  isGenerating = false,
  className = ''
}: OutputTypeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleSelect = (type: OutputType) => {
    onSelect(type)
    setIsOpen(false)
  }

  const selectedOption = outputTypes.find(t => t.id === selectedType)

  return (
    <div className={`relative ${className}`}>
      {/* Dropdown trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isGenerating}
        className={`
          w-full flex items-center justify-between gap-3 p-4
          bg-white border border-gray-200 rounded-lg
          hover:border-blue-300 hover:bg-blue-50/50
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
          transition-all disabled:opacity-50 disabled:cursor-not-allowed
          ${isOpen ? 'border-blue-400 ring-2 ring-blue-100' : ''}
        `}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
            <Download className="w-5 h-5" />
          </div>
          <div className="text-left">
            <p className="font-medium text-gray-900">
              {selectedOption ? selectedOption.name : 'Generate Output'}
            </p>
            <p className="text-sm text-gray-500">
              {selectedOption ? selectedOption.estimatedTime : 'Choose a format to export'}
            </p>
          </div>
        </div>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Options */}
          <div className="absolute z-20 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
            <div className="p-2">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide px-3 py-2">
                Choose Output Format
              </p>

              {outputTypes.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleSelect(option.id)}
                  className={`
                    w-full flex items-start gap-3 p-3 rounded-lg text-left
                    hover:bg-gray-50 transition-colors
                    ${selectedType === option.id ? 'bg-blue-50' : ''}
                  `}
                >
                  <div className={`
                    p-2 rounded-lg flex-shrink-0
                    ${selectedType === option.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}
                  `}>
                    {option.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={`font-medium ${selectedType === option.id ? 'text-blue-900' : 'text-gray-900'}`}>
                        {option.name}
                      </p>
                      <span className="text-xs text-gray-400">{option.estimatedTime}</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">
                      {option.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// Hook to track message count and suggest output generation
export function useOutputSuggestion(messageCount: number) {
  const shouldSuggest = messageCount >= 20 && messageCount % 10 === 0
  const threshold = 20
  const progress = Math.min((messageCount / threshold) * 100, 100)

  return {
    shouldSuggest,
    threshold,
    progress,
    messageCount,
    suggestMessage: shouldSuggest
      ? "You've had a productive session! Would you like to generate a structured output from this conversation?"
      : null
  }
}

// Compact inline version for workspace header
export function OutputTypeSelectorCompact({
  onSelect,
  isGenerating = false,
  className = ''
}: Omit<OutputTypeSelectorProps, 'selectedType'>) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isGenerating}
        className={`
          flex items-center gap-2 px-3 py-2
          bg-gradient-to-r from-blue-600 to-indigo-600
          text-white text-sm font-medium rounded-lg
          hover:from-blue-700 hover:to-indigo-700
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          transition-all disabled:opacity-50 disabled:cursor-not-allowed
          shadow-sm hover:shadow
        `}
      >
        <FileText className="w-4 h-4" />
        Generate Output
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 z-20 w-72 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
            <div className="p-2">
              {outputTypes.map((option) => (
                <button
                  key={option.id}
                  onClick={() => {
                    onSelect(option.id)
                    setIsOpen(false)
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-lg text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="p-1.5 bg-gray-100 rounded text-gray-600">
                    {option.icon}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">{option.name}</p>
                    <p className="text-xs text-gray-500">{option.estimatedTime}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
