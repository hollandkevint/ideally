'use client';

import { FileText, Target, Lightbulb } from 'lucide-react';

interface OutputSuggestionBarProps {
  questionCount: number;
  onGenerateSummary: () => void;
  onGenerateLeanCanvas: () => void;
  onStartBMad: () => void;
  isGenerating?: boolean;
}

/**
 * OutputSuggestionBar - Suggestion buttons for generating structured outputs
 *
 * Features:
 * - Generate Summary (always available)
 * - Generate Lean Canvas (available after 5 questions)
 * - Start BMad Session (agent recommends structured pathways)
 * - Progress indicator showing path to full canvas
 */
export default function OutputSuggestionBar({
  questionCount,
  onGenerateSummary,
  onGenerateLeanCanvas,
  onStartBMad,
  isGenerating = false
}: OutputSuggestionBarProps) {
  const canGenerateLeanCanvas = questionCount >= 5;

  const getProgressMessage = (): string => {
    if (questionCount >= 10) {
      return 'Ready for full Lean Canvas';
    } else if (questionCount >= 5) {
      return `${10 - questionCount} more questions for complete Lean Canvas`;
    } else {
      return `${questionCount}/10 questions - keep exploring`;
    }
  };

  return (
    <div className="output-suggestion-bar border-t border-divider bg-surface px-4 py-3">
      <div className="flex items-center justify-between">
        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onGenerateSummary}
            disabled={isGenerating}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Generate a summary of your strategic session"
          >
            <FileText className="w-4 h-4" />
            Generate Summary
          </button>

          <button
            onClick={onGenerateLeanCanvas}
            disabled={!canGenerateLeanCanvas || isGenerating}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded transition-colors ${
              canGenerateLeanCanvas
                ? 'text-primary hover:bg-primary/10'
                : 'text-secondary cursor-not-allowed opacity-50'
            }`}
            title={
              canGenerateLeanCanvas
                ? 'Generate a Lean Canvas from your session'
                : `Ask ${5 - questionCount} more questions to generate Lean Canvas`
            }
          >
            <Lightbulb className="w-4 h-4" />
            Generate Lean Canvas
            {!canGenerateLeanCanvas && (
              <span className="text-xs bg-secondary/20 px-2 py-0.5 rounded">
                {5 - questionCount} more Q's
              </span>
            )}
          </button>

          <button
            onClick={onStartBMad}
            disabled={isGenerating}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-accent hover:bg-accent/10 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Start a structured BMad strategic pathway"
          >
            <Target className="w-4 h-4" />
            Start BMad Session
          </button>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center gap-3">
          <div className="text-xs text-secondary">
            {getProgressMessage()}
          </div>
          <div className="flex items-center gap-1">
            {[...Array(10)].map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full ${
                  i < questionCount ? 'bg-primary' : 'bg-divider'
                }`}
                title={`Question ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Generating indicator */}
      {isGenerating && (
        <div className="mt-2 text-xs text-primary flex items-center gap-2">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
          Generating structured output...
        </div>
      )}
    </div>
  );
}
