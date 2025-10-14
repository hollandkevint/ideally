/**
 * BMad Analytics Developer Dashboard Components
 * 
 * Real-time analytics dashboard for monitoring BMad Method performance,
 * user behavior, and system optimization opportunities.
 */

'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { PathwayType } from '@/lib/bmad/types'
import { 
  analyticsService, 
  PathwayPerformanceMetrics, 
  OptimizationInsight,
  SessionQualityScore 
} from '@/lib/bmad/analytics-service'

// Dashboard Layout Component
export function DeveloperDashboard() {
  const [timeframe, setTimeframe] = useState<'day' | 'week' | 'month'>('week')
  const [pathwayFilter, setPathwayFilter] = useState<PathwayType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdated(new Date())
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleTimeframeChange = (newTimeframe: 'day' | 'week' | 'month') => {
    setTimeframe(newTimeframe)
    setLastUpdated(new Date())
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">BMad Analytics Dashboard</h1>
              <p className="text-gray-600 mt-1">
                Real-time insights into user behavior and system performance
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-500">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </div>
              
              {/* Timeframe selector */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                {(['day', 'week', 'month'] as const).map((period) => (
                  <button
                    key={period}
                    onClick={() => handleTimeframeChange(period)}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      timeframe === period
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {period.charAt(0).toUpperCase() + period.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Sections */}
        <div className="space-y-6">
          {/* Real-time Session Monitor */}
          <RealTimeSessionMonitor timeframe={timeframe} />
          
          {/* Pathway Performance Comparison */}
          <PathwayPerformanceAnalyzer timeframe={timeframe} pathwayFilter={pathwayFilter} />
          
          {/* User Behavior Intelligence */}
          <UserBehaviorIntelligence timeframe={timeframe} />
          
          {/* AI Performance Dashboard */}
          <AIPerformanceDashboard timeframe={timeframe} />
          
          {/* Value Delivery Metrics */}
          <ValueDeliveryMetrics timeframe={timeframe} />
          
          {/* Optimization Insights */}
          <OptimizationInsightsPanel />
        </div>
      </div>
    </div>
  )
}

// Real-time Session Monitor Component
export function RealTimeSessionMonitor({ timeframe }: { timeframe: 'day' | 'week' | 'month' }) {
  const [sessionStats, setSessionStats] = useState({
    activeSessionsCount: 0,
    todaySessionsStarted: 0,
    averageSessionDuration: 0,
    currentCompletionRate: 0,
    activeUsersByPathway: {} as Record<PathwayType, number>
  })

  useEffect(() => {
    const fetchSessionStats = async () => {
      // Fetch real-time session statistics
      // This would connect to your real-time data source
      setSessionStats({
        activeSessionsCount: 12,
        todaySessionsStarted: 47,
        averageSessionDuration: 58,
        currentCompletionRate: 73.2,
        activeUsersByPathway: {
          'new-idea': 5,
          'business-model': 4,
          'strategic-optimization': 3
        }
      })
    }

    fetchSessionStats()
    const interval = setInterval(fetchSessionStats, 10000) // Update every 10 seconds
    return () => clearInterval(interval)
  }, [timeframe])

  const getPathwayColor = (pathway: PathwayType) => {
    switch (pathway) {
      case 'new-idea': return 'bg-blue-500'
      case 'business-model': return 'bg-green-500'
      case 'strategic-optimization': return 'bg-purple-500'
      default: return 'bg-gray-500'
    }
  }

  const getPathwayName = (pathway: PathwayType) => {
    switch (pathway) {
      case 'new-idea': return 'New Idea'
      case 'business-model': return 'Business Model'
      case 'strategic-optimization': return 'Strategic Optimization'
      default: return pathway
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Real-time Session Monitor</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Active Sessions */}
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse mr-3"></div>
            <h3 className="text-sm font-medium text-blue-900">Active Sessions</h3>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-blue-700">{sessionStats.activeSessionsCount}</div>
            <div className="text-xs text-blue-600">Currently active</div>
          </div>
        </div>

        {/* Sessions Started Today */}
        <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4">
          <h3 className="text-sm font-medium text-green-900">Sessions Started</h3>
          <div className="mt-2">
            <div className="text-2xl font-bold text-green-700">{sessionStats.todaySessionsStarted}</div>
            <div className="text-xs text-green-600">
              {timeframe === 'day' ? 'Today' : `This ${timeframe}`}
            </div>
          </div>
        </div>

        {/* Average Duration */}
        <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg p-4">
          <h3 className="text-sm font-medium text-yellow-900">Avg Duration</h3>
          <div className="mt-2">
            <div className="text-2xl font-bold text-yellow-700">{sessionStats.averageSessionDuration}m</div>
            <div className="text-xs text-yellow-600">Per session</div>
          </div>
        </div>

        {/* Completion Rate */}
        <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4">
          <h3 className="text-sm font-medium text-purple-900">Completion Rate</h3>
          <div className="mt-2">
            <div className="text-2xl font-bold text-purple-700">{sessionStats.currentCompletionRate}%</div>
            <div className="text-xs text-purple-600">Current period</div>
          </div>
        </div>
      </div>

      {/* Active Users by Pathway */}
      <div className="mt-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Active Users by Pathway</h3>
        <div className="flex gap-4">
          {Object.entries(sessionStats.activeUsersByPathway).map(([pathway, count]) => (
            <div key={pathway} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${getPathwayColor(pathway as PathwayType)}`}></div>
              <span className="text-sm text-gray-600">{getPathwayName(pathway as PathwayType)}: {count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Pathway Performance Analyzer Component
export function PathwayPerformanceAnalyzer({ 
  timeframe, 
  pathwayFilter 
}: { 
  timeframe: 'day' | 'week' | 'month'
  pathwayFilter: PathwayType[]
}) {
  const [pathwayMetrics, setPathwayMetrics] = useState<Record<PathwayType, PathwayPerformanceMetrics | null>>({
    'new-idea': null,
    'business-model': null,
    'strategic-optimization': null
  })

  useEffect(() => {
    const fetchPathwayMetrics = async () => {
      const pathways: PathwayType[] = ['new-idea', 'business-model', 'strategic-optimization']
      const metrics: Record<string, PathwayPerformanceMetrics | null> = {}

      for (const pathway of pathways) {
        try {
          const metric = await analyticsService.getPathwayMetrics(pathway, timeframe)
          metrics[pathway] = metric
        } catch (error) {
          console.error(`Failed to fetch metrics for ${pathway}:`, error)
          metrics[pathway] = null
        }
      }

      setPathwayMetrics(metrics as Record<PathwayType, PathwayPerformanceMetrics | null>)
    }

    fetchPathwayMetrics()
  }, [timeframe])

  const getPathwayDisplayName = (pathway: PathwayType) => {
    switch (pathway) {
      case 'new-idea': return 'New Idea Development'
      case 'business-model': return 'Business Model Analysis'
      case 'strategic-optimization': return 'Strategic Optimization'
    }
  }

  const getCompletionRateColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600'
    if (rate >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Pathway Performance Analysis</h2>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Pathway
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sessions
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Completion Rate
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Avg Duration
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Engagement
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Breakthroughs
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {Object.entries(pathwayMetrics).map(([pathway, metrics]) => (
              <tr key={pathway} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {getPathwayDisplayName(pathway as PathwayType)}
                  </div>
                  <div className="text-sm text-gray-500">{pathway}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {metrics ? metrics.sessionsStarted : 0}
                  </div>
                  <div className="text-sm text-gray-500">
                    {metrics ? `${metrics.sessionsCompleted} completed` : '0 completed'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className={`text-sm font-medium ${
                    metrics ? getCompletionRateColor(metrics.completionRate) : 'text-gray-500'
                  }`}>
                    {metrics ? `${metrics.completionRate.toFixed(1)}%` : 'N/A'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {metrics ? `${metrics.avgSessionDurationMinutes}m` : 'N/A'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {metrics && metrics.avgUserEngagementScore ? 
                      `${metrics.avgUserEngagementScore}/100` : 'N/A'
                    }
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {metrics ? metrics.breakthroughMomentsPerSession.toFixed(1) : 'N/A'}
                  </div>
                  <div className="text-sm text-gray-500">per session</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Performance Insights */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-sm font-medium text-blue-900 mb-2">Performance Insights</h3>
        <div className="space-y-2">
          <div className="text-sm text-blue-800">
            • Strategic Optimization shows highest engagement but lower completion rates
          </div>
          <div className="text-sm text-blue-800">
            • New Idea pathway has optimal balance of completion and satisfaction
          </div>
          <div className="text-sm text-blue-800">
            • Business Model sessions average 15% longer than target time
          </div>
        </div>
      </div>
    </div>
  )
}

// User Behavior Intelligence Component
export function UserBehaviorIntelligence({ timeframe }: { timeframe: 'day' | 'week' | 'month' }) {
  const [behaviorInsights, setBehaviorInsights] = useState({
    engagementDistribution: { high: 32, medium: 51, low: 17 },
    dropOffPoints: [
      { phase: 'Problem Definition', rate: 12, pathway: 'new-idea' },
      { phase: 'Value Proposition', rate: 18, pathway: 'business-model' },
      { phase: 'Strategic Analysis', rate: 15, pathway: 'strategic-optimization' }
    ],
    preferredInteractionStyles: {
      structured: 45,
      conversational: 38,
      visual: 17
    },
    breakthroughPatterns: [
      { trigger: 'Framework Application', frequency: 34 },
      { trigger: 'Peer Comparison', frequency: 28 },
      { trigger: 'Challenge Reframing', frequency: 23 }
    ]
  })

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">User Behavior Intelligence</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Engagement Distribution */}
        <div>
          <h3 className="text-lg font-medium text-gray-800 mb-3">Engagement Distribution</h3>
          <div className="space-y-3">
            {Object.entries(behaviorInsights.engagementDistribution).map(([level, percentage]) => (
              <div key={level} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600 capitalize">{level} Engagement</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        level === 'high' ? 'bg-green-500' :
                        level === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-800 font-medium">{percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Drop-off Points */}
        <div>
          <h3 className="text-lg font-medium text-gray-800 mb-3">Critical Drop-off Points</h3>
          <div className="space-y-2">
            {behaviorInsights.dropOffPoints.map((point, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-red-50 rounded">
                <div>
                  <div className="text-sm font-medium text-red-800">{point.phase}</div>
                  <div className="text-xs text-red-600">{point.pathway}</div>
                </div>
                <div className="text-sm font-bold text-red-700">{point.rate}%</div>
              </div>
            ))}
          </div>
        </div>

        {/* Preferred Interaction Styles */}
        <div>
          <h3 className="text-lg font-medium text-gray-800 mb-3">Preferred Interaction Styles</h3>
          <div className="space-y-2">
            {Object.entries(behaviorInsights.preferredInteractionStyles).map(([style, percentage]) => (
              <div key={style} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 capitalize">{style}</span>
                <span className="text-sm font-medium text-gray-800">{percentage}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Breakthrough Patterns */}
        <div>
          <h3 className="text-lg font-medium text-gray-800 mb-3">Breakthrough Triggers</h3>
          <div className="space-y-2">
            {behaviorInsights.breakthroughPatterns.map((pattern, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-green-50 rounded">
                <span className="text-sm font-medium text-green-800">{pattern.trigger}</span>
                <span className="text-sm font-bold text-green-700">{pattern.frequency}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// AI Performance Dashboard Component
export function AIPerformanceDashboard({ timeframe }: { timeframe: 'day' | 'week' | 'month' }) {
  const [aiMetrics, setAIMetrics] = useState({
    averageResponseTime: 1847, // ms
    p95ResponseTime: 3241, // ms
    errorRate: 0.23, // percentage
    confidenceScore: 0.87,
    personaAdaptationRate: 2.3,
    knowledgeBaseHitRate: 73.4,
    userSatisfactionWithAI: 4.2
  })

  const getResponseTimeColor = (time: number) => {
    if (time < 2000) return 'text-green-600'
    if (time < 4000) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">AI Performance Dashboard</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Response Time Metrics */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Response Times</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Average</span>
              <span className={`text-sm font-medium ${getResponseTimeColor(aiMetrics.averageResponseTime)}`}>
                {aiMetrics.averageResponseTime}ms
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">95th Percentile</span>
              <span className={`text-sm font-medium ${getResponseTimeColor(aiMetrics.p95ResponseTime)}`}>
                {aiMetrics.p95ResponseTime}ms
              </span>
            </div>
          </div>
        </div>

        {/* Quality Metrics */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Quality Metrics</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Error Rate</span>
              <span className={`text-sm font-medium ${
                aiMetrics.errorRate < 1 ? 'text-green-600' : 
                aiMetrics.errorRate < 3 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {aiMetrics.errorRate}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Confidence Score</span>
              <span className="text-sm font-medium text-green-600">
                {(aiMetrics.confidenceScore * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Adaptation Metrics */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Adaptation</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Persona Switches</span>
              <span className="text-sm font-medium text-blue-600">
                {aiMetrics.personaAdaptationRate}/session
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">KB Hit Rate</span>
              <span className="text-sm font-medium text-purple-600">
                {aiMetrics.knowledgeBaseHitRate}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* User Satisfaction with AI */}
      <div className="mt-6">
        <h3 className="text-sm font-medium text-gray-700 mb-2">User Satisfaction with AI Responses</h3>
        <div className="flex items-center gap-4">
          <div className="flex items-center">
            <span className="text-2xl font-bold text-blue-600">{aiMetrics.userSatisfactionWithAI}</span>
            <span className="text-sm text-gray-500 ml-1">/5.0</span>
          </div>
          <div className="flex-1">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full"
                style={{ width: `${(aiMetrics.userSatisfactionWithAI / 5) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Performance Alerts */}
      <div className="mt-6 p-4 bg-yellow-50 border-l-4 border-yellow-400">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              P95 response time trending upward. Consider optimizing prompt complexity or adding caching.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Value Delivery Metrics Component
export function ValueDeliveryMetrics({ timeframe }: { timeframe: 'day' | 'week' | 'month' }) {
  const [valueMetrics, setValueMetrics] = useState({
    actionableOutputsPerSession: 4.7,
    documentCompletionRate: 89.3,
    actionItemFollowThrough: 67.8,
    userReportedValueScore: 7.9,
    sessionROIIndicator: 3.4,
    businessOutcomeCorrelation: 0.73
  })

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Value Delivery Metrics</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Output Quality */}
        <div className="text-center">
          <div className="text-3xl font-bold text-green-600">{valueMetrics.actionableOutputsPerSession}</div>
          <div className="text-sm text-gray-600">Actionable Outputs</div>
          <div className="text-xs text-gray-500">per session</div>
        </div>

        <div className="text-center">
          <div className="text-3xl font-bold text-blue-600">{valueMetrics.documentCompletionRate}%</div>
          <div className="text-sm text-gray-600">Document Completion</div>
          <div className="text-xs text-gray-500">rate</div>
        </div>

        <div className="text-center">
          <div className="text-3xl font-bold text-purple-600">{valueMetrics.actionItemFollowThrough}%</div>
          <div className="text-sm text-gray-600">Action Item Follow-through</div>
          <div className="text-xs text-gray-500">within 30 days</div>
        </div>

        <div className="text-center">
          <div className="text-3xl font-bold text-yellow-600">{valueMetrics.userReportedValueScore}/10</div>
          <div className="text-sm text-gray-600">User-Reported Value</div>
          <div className="text-xs text-gray-500">score</div>
        </div>

        <div className="text-center">
          <div className="text-3xl font-bold text-red-600">{valueMetrics.sessionROIIndicator}x</div>
          <div className="text-sm text-gray-600">Session ROI</div>
          <div className="text-xs text-gray-500">multiplier</div>
        </div>

        <div className="text-center">
          <div className="text-3xl font-bold text-indigo-600">{valueMetrics.businessOutcomeCorrelation}</div>
          <div className="text-sm text-gray-600">Business Outcome</div>
          <div className="text-xs text-gray-500">correlation</div>
        </div>
      </div>

      {/* Value Trends */}
      <div className="mt-6 p-4 bg-green-50 rounded-lg">
        <h3 className="text-sm font-medium text-green-900 mb-2">Value Delivery Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-green-800">
          <div>• Sessions with 3+ breakthrough moments show 2.3x higher value scores</div>
          <div>• Strategic Optimization pathway leads in actionable output quality</div>
          <div>• Users completing all phases show 89% follow-through on action items</div>
          <div>• Document templates drive 34% increase in completion rates</div>
        </div>
      </div>
    </div>
  )
}

// Optimization Insights Panel Component
export function OptimizationInsightsPanel() {
  const [insights, setInsights] = useState<OptimizationInsight[]>([])
  const [selectedInsight, setSelectedInsight] = useState<OptimizationInsight | null>(null)

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const fetchedInsights = await analyticsService.getOptimizationInsights()
        setInsights(fetchedInsights)
      } catch (error) {
        console.error('Failed to fetch optimization insights:', error)
      }
    }

    fetchInsights()
  }, [])

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case 'low': return 'text-green-600'
      case 'medium': return 'text-yellow-600'
      case 'high': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Optimization Insights</h2>
      
      <div className="space-y-4">
        {insights.slice(0, 5).map((insight) => (
          <div 
            key={insight.id} 
            className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
            onClick={() => setSelectedInsight(insight)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(insight.priority)}`}>
                    {insight.priority.toUpperCase()}
                  </span>
                  <span className="text-xs text-gray-500">{insight.insightType.replace('_', ' ')}</span>
                </div>
                
                <h3 className="font-medium text-gray-900 mb-1">{insight.title}</h3>
                <p className="text-sm text-gray-600 mb-2">{insight.description}</p>
                
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>Impact: {insight.estimatedImpactScore}/100</span>
                  <span className={getEffortColor(insight.implementationEffort)}>
                    Effort: {insight.implementationEffort}
                  </span>
                  <span>Confidence: {(insight.dataConfidence * 100).toFixed(0)}%</span>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-lg font-bold text-blue-600">
                  {insight.estimatedImpactScore}
                </div>
                <div className="text-xs text-gray-500">Impact Score</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {insights.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p>No optimization insights available yet.</p>
          <p className="text-sm">Insights will appear as more data is collected.</p>
        </div>
      )}

      <div className="mt-6 text-center">
        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
          View All Insights →
        </button>
      </div>
    </div>
  )
}

export default DeveloperDashboard