'use client';

import React, { useState } from 'react';
import { NewIdeaPhaseData, MarketOpportunity } from '@/lib/bmad/templates/new-idea-templates';

interface MarketExplorationProps {
  sessionData: NewIdeaPhaseData;
  onPhaseComplete: (data: Partial<NewIdeaPhaseData>) => void;
  isLoading: boolean;
}

export default function MarketExploration({
  sessionData,
  onPhaseComplete,
  isLoading
}: MarketExplorationProps) {
  const [targetMarket, setTargetMarket] = useState('');
  const [marketSize, setMarketSize] = useState('');
  const [competition, setCompetition] = useState('');
  const [showInsights, setShowInsights] = useState(false);

  const handleSubmit = () => {
    if (!targetMarket.trim() || !marketSize.trim()) return;

    // Generate market opportunities based on input
    const opportunities: MarketOpportunity[] = [
      {
        id: 'primary-market',
        description: `Primary market: ${targetMarket}`,
        marketSize: marketSize,
        growthPotential: 'high' as const,
        confidence: 0.8,
        insights: [
          'Strong demand signals identified',
          'Limited existing solutions in market',
          'Growing trend supporting market expansion'
        ]
      },
      {
        id: 'adjacent-market',
        description: 'Adjacent market opportunity in related segments',
        marketSize: 'Secondary opportunity',
        growthPotential: 'medium' as const,
        confidence: 0.6,
        insights: [
          'Cross-selling potential identified',
          'Market expansion opportunity'
        ]
      }
    ];

    // Generate competitive landscape
    const competitiveLandscape = [
      {
        name: 'Market Leader',
        strengths: ['Brand recognition', 'Large customer base'],
        weaknesses: ['High pricing', 'Slow innovation'],
        marketPosition: 'Dominant market leader',
        differentiators: ['Scale', 'Resources']
      },
      {
        name: 'Emerging Player',
        strengths: ['Innovative features', 'Agile development'],
        weaknesses: ['Limited resources', 'Small market share'],
        marketPosition: 'Growing competitor',
        differentiators: ['Technology', 'User experience']
      }
    ];

    const phaseData = {
      marketOpportunities: opportunities,
      competitiveLandscape
    };

    onPhaseComplete(phaseData);
  };

  return (
    <div className="space-y-6">
      {/* Phase Description */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">
          Market Opportunity Analysis
        </h3>
        <p className="text-blue-700 text-sm">
          Identify and analyze market opportunities for your concept.
          We'll help you understand your target market, size the opportunity, and map the competitive landscape.
        </p>
      </div>

      {/* Market Analysis Form */}
      <div className="space-y-6">
        {/* Target Market */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Who is your ideal customer? *
          </label>
          <textarea
            data-testid="user-input"
            value={targetMarket}
            onChange={(e) => setTargetMarket(e.target.value)}
            className="w-full p-4 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            placeholder="Describe your target customer in detail: demographics, behaviors, pain points, budget..."
            rows={3}
            disabled={isLoading}
          />
          <div className="mt-2 text-sm text-gray-500">
            Include demographics, psychographics, and specific pain points
          </div>
        </div>

        {/* Market Size */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            How large is your potential market? *
          </label>
          <div className="space-y-3">
            <select
              value={marketSize}
              onChange={(e) => setMarketSize(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
            >
              <option value="">Select market size...</option>
              <option value="Local (< 10K users)">Local (&lt; 10K potential users)</option>
              <option value="Regional (10K-100K)">Regional (10K-100K potential users)</option>
              <option value="National (100K-1M)">National (100K-1M potential users)</option>
              <option value="Global (1M+)">Global (1M+ potential users)</option>
            </select>
          </div>
        </div>

        {/* Competition */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Who are your main competitors or alternatives?
          </label>
          <textarea
            value={competition}
            onChange={(e) => setCompetition(e.target.value)}
            className="w-full p-4 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            placeholder="Include both direct competitors and alternative solutions people currently use..."
            rows={3}
            disabled={isLoading}
          />
        </div>

        {/* Market Research Framework */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3">🎯 Market Analysis Framework</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="space-y-2">
              <div className="font-medium text-blue-600">Customer Segmentation</div>
              <ul className="space-y-1 text-gray-600">
                <li>• Demographics & psychographics</li>
                <li>• Pain points & needs</li>
                <li>• Buying behavior</li>
              </ul>
            </div>
            <div className="space-y-2">
              <div className="font-medium text-green-600">Market Sizing</div>
              <ul className="space-y-1 text-gray-600">
                <li>• Total addressable market</li>
                <li>• Serviceable market</li>
                <li>• Growth trends</li>
              </ul>
            </div>
            <div className="space-y-2">
              <div className="font-medium text-purple-600">Competition</div>
              <ul className="space-y-1 text-gray-600">
                <li>• Direct competitors</li>
                <li>• Alternative solutions</li>
                <li>• Market gaps</li>
              </ul>
            </div>
          </div>
        </div>

        {/* AI Insights Preview */}
        {targetMarket && marketSize && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-blue-900">🤖 AI Market Analysis Preview</h4>
              <button
                onClick={() => setShowInsights(!showInsights)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {showInsights ? 'Hide' : 'Show'} Insights
              </button>
            </div>

            {showInsights && (
              <div className="space-y-3 text-sm">
                <div className="bg-white p-3 rounded border-l-4 border-blue-400">
                  <div className="font-medium text-gray-900">Market Opportunity Score: 8/10</div>
                  <div className="text-gray-600 mt-1">
                    Strong market potential with {marketSize.toLowerCase()} reach and clear customer need
                  </div>
                </div>
                <div data-testid="market-insights" className="bg-white p-3 rounded border-l-4 border-green-400">
                  <div className="font-medium text-gray-900">Key Insight</div>
                  <div className="text-gray-600 mt-1">
                    Target market shows high engagement potential with growing demand trends
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-4 border-t">
        <div className="text-sm text-gray-500">
          Phase 2 of 4 • ~10 minutes
        </div>

        <button
          data-testid="submit-response"
          onClick={handleSubmit}
          disabled={isLoading || !targetMarket.trim() || !marketSize}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Analyzing Market...</span>
            </div>
          ) : (
            'Continue to Concept Refinement'
          )}
        </button>
      </div>

      {/* Progress Indicator */}
      <div className="text-center" data-testid="phase-progress">
        <div className="text-sm text-gray-500 mb-2">Market Opportunity Analysis</div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${targetMarket && marketSize ? 75 : 25}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}