'use client';

import React, { useState } from 'react';
import { NewIdeaPhaseData } from '@/lib/bmad/templates/new-idea-templates';

interface IdeationPhaseProps {
  sessionData: NewIdeaPhaseData;
  onPhaseComplete: (data: Partial<NewIdeaPhaseData>) => void;
  isLoading: boolean;
}

interface AIAnalysisResult {
  insights: string[];
  followUpQuestions: string[];
  suggestedFocus: string;
  strengths?: string[];
  concerns?: string[];
}

export default function IdeationPhase({
  sessionData,
  onPhaseComplete,
  isLoading
}: IdeationPhaseProps) {
  const [rawIdea, setRawIdea] = useState(sessionData.rawIdea || '');
  const [insights, setInsights] = useState<string[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AIAnalysisResult | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!rawIdea.trim()) return;

    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      // Call AI analysis API
      const response = await fetch('/api/bmad', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'analyze_idea',
          rawIdea: rawIdea.trim(),
          pathway: 'new-idea',
          phase: 'ideation'
        })
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        setAnalysisResult(result.data);

        // Pass AI-generated insights to parent
        const phaseData = {
          rawIdea: rawIdea.trim(),
          ideationInsights: result.data.insights,
          followUpQuestions: result.data.followUpQuestions,
          suggestedFocus: result.data.suggestedFocus
        };

        onPhaseComplete(phaseData);
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Ideation analysis error:', error);
      setAnalysisError(error instanceof Error ? error.message : 'Failed to analyze idea');

      // Fallback to basic analysis if AI fails
      const fallbackInsights = [
        `Core concept: ${rawIdea.slice(0, 100)}...`,
        'Consider validating this idea with potential customers',
        'Identify your unique value proposition',
        'Map out the competitive landscape'
      ];

      const phaseData = {
        rawIdea: rawIdea.trim(),
        ideationInsights: fallbackInsights
      };

      onPhaseComplete(phaseData);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const addCustomInsight = (insight: string) => {
    if (insight.trim()) {
      setInsights(prev => [...prev, insight.trim()]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Phase Description */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-purple-900 mb-2">
          Creative Expansion Phase
        </h3>
        <p className="text-purple-700 text-sm">
          Explore and expand your raw business idea through structured ideation.
          Describe your concept in detail and we'll help you uncover opportunities and variations.
        </p>
      </div>

      {/* Main Input */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Describe your business idea in detail *
          </label>
          <textarea
            data-testid="user-input"
            value={rawIdea}
            onChange={(e) => setRawIdea(e.target.value)}
            className="w-full p-4 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 min-h-[120px]"
            placeholder="What problem does your idea solve? Who would use it? What inspired this concept? Be as specific as possible about your vision..."
            disabled={isLoading}
          />
          <div className="mt-2 text-sm text-gray-500">
            Minimum 50 characters recommended for best analysis
          </div>
        </div>

        {/* Guided Questions */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3">💡 Guided Questions</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-start space-x-2">
              <span className="text-purple-600 font-bold">1.</span>
              <span>What specific problem are you solving?</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-purple-600 font-bold">2.</span>
              <span>Who experiences this problem most acutely?</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-purple-600 font-bold">3.</span>
              <span>What inspired this idea?</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-purple-600 font-bold">4.</span>
              <span>How are people currently solving this problem?</span>
            </div>
          </div>
        </div>

        {/* Advanced Options */}
        <div>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-purple-600 hover:text-purple-800 flex items-center"
          >
            {showAdvanced ? '▼' : '▶'} Advanced ideation options
          </button>

          {showAdvanced && (
            <div className="mt-4 space-y-4 bg-gray-50 p-4 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional insights or variations
                </label>
                <div className="space-y-2">
                  {insights.map((insight, index) => (
                    <div key={index} className="flex items-center space-x-2 text-sm">
                      <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                      <span>{insight}</span>
                    </div>
                  ))}
                  <input
                    type="text"
                    placeholder="Add your own insight..."
                    className="w-full p-2 border border-gray-300 rounded text-sm"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addCustomInsight(e.currentTarget.value);
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Analysis Error Display */}
      {analysisError && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <div className="text-sm text-amber-800">
            <strong>Note:</strong> AI analysis encountered an issue. Using basic analysis instead.
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-4 border-t">
        <div className="text-sm text-gray-500">
          Phase 1 of 4 • ~8 minutes
        </div>

        <button
          data-testid="submit-response"
          onClick={handleSubmit}
          disabled={isLoading || isAnalyzing || rawIdea.trim().length < 10}
          className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading || isAnalyzing ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>{isAnalyzing ? 'Analyzing with AI...' : 'Processing...'}</span>
            </div>
          ) : (
            'Continue to Market Analysis'
          )}
        </button>
      </div>

      {/* Real-time Feedback */}
      {rawIdea.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="text-sm text-blue-800">
            <strong>Quick feedback:</strong> {
              rawIdea.length < 50
                ? 'Add more detail for better analysis'
                : rawIdea.length < 100
                ? 'Good start! Consider adding more context'
                : 'Excellent detail level for comprehensive analysis'
            }
          </div>
        </div>
      )}
    </div>
  );
}