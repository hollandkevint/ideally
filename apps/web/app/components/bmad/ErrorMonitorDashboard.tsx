'use client'

import { useState, useEffect } from 'react'
import { BmadErrorMonitor, ErrorReport, ErrorMetrics } from '@/lib/bmad/error-monitor'

interface ErrorMonitorDashboardProps {
  className?: string
}

export default function ErrorMonitorDashboard({ className = '' }: ErrorMonitorDashboardProps) {
  const [metrics, setMetrics] = useState<ErrorMetrics | null>(null)
  const [recentErrors, setRecentErrors] = useState<ErrorReport[]>([])
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    const loadData = () => {
      setMetrics(BmadErrorMonitor.getMetrics())
      setRecentErrors(BmadErrorMonitor.getRecentErrors(10))
    }

    loadData()
    
    // Refresh every 30 seconds
    const interval = setInterval(loadData, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'blocking':
        return 'bg-red-500'
      case 'major':
        return 'bg-orange-500'
      case 'minor':
        return 'bg-yellow-500'
      case 'none':
        return 'bg-green-500'
      default:
        return 'bg-gray-500'
    }
  }

  if (!metrics) {
    return null
  }

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      {/* Collapsed Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium text-gray-700">
            Error Monitor ({metrics.totalErrors} errors, {metrics.criticalErrors} critical)
          </span>
        </div>
        <div className="flex items-center gap-2">
          {metrics.criticalErrors > 0 && (
            <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
              {metrics.criticalErrors} critical
            </span>
          )}
          <svg 
            className={`w-4 h-4 text-gray-400 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-gray-200 p-4 space-y-4">
          {/* Metrics Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs text-gray-500">Total Errors (7 days)</div>
              <div className="text-lg font-semibold text-gray-900">{metrics.totalErrors}</div>
            </div>
            <div className="bg-red-50 rounded-lg p-3">
              <div className="text-xs text-red-600">Critical Errors</div>
              <div className="text-lg font-semibold text-red-800">{metrics.criticalErrors}</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="text-xs text-blue-600">Components Affected</div>
              <div className="text-lg font-semibold text-blue-800">
                {Object.keys(metrics.errorsByComponent).length}
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <div className="text-xs text-green-600">Actions Affected</div>
              <div className="text-lg font-semibold text-green-800">
                {Object.keys(metrics.errorsByAction).length}
              </div>
            </div>
          </div>

          {/* Errors by Component */}
          {Object.keys(metrics.errorsByComponent).length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Errors by Component</h4>
              <div className="space-y-2">
                {Object.entries(metrics.errorsByComponent)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 5)
                  .map(([component, count]) => (
                    <div key={component} className="flex items-center justify-between py-1">
                      <span className="text-sm text-gray-600">{component}</span>
                      <span className="text-sm font-medium text-gray-900">{count}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Recent Errors */}
          {recentErrors.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Recent Errors</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {recentErrors.map((error) => (
                  <div key={error.id} className="bg-gray-50 rounded p-2">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-gray-900 truncate">
                          {error.error instanceof Error ? error.error.message : error.error}
                        </div>
                        <div className="text-xs text-gray-500">
                          {error.context.component} • {error.context.action}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <span className={`px-2 py-1 text-xs rounded border ${getSeverityColor(error.severity)}`}>
                          {error.severity}
                        </span>
                        <div className={`w-2 h-2 rounded-full ${getImpactColor(error.userImpact)}`} title={`Impact: ${error.userImpact}`}></div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-400">
                      {error.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error Trends */}
          {metrics.errorTrends.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Error Trends (Last 7 Days)</h4>
              <div className="flex items-end gap-1 h-16">
                {metrics.errorTrends.map((trend) => {
                  const maxCount = Math.max(...metrics.errorTrends.map(t => t.count))
                  const height = maxCount > 0 ? (trend.count / maxCount) * 100 : 0
                  
                  return (
                    <div key={trend.date} className="flex-1 flex flex-col items-center">
                      <div 
                        className={`w-full rounded-t ${trend.criticalCount > 0 ? 'bg-red-400' : 'bg-blue-400'} transition-all`}
                        style={{ height: `${height}%` }}
                        title={`${trend.date}: ${trend.count} errors (${trend.criticalCount} critical)`}
                      ></div>
                      <div className="text-xs text-gray-400 mt-1">
                        {new Date(trend.date).getDate()}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-200">
            <div className="text-xs text-gray-500">
              Last updated: {new Date().toLocaleTimeString()}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setMetrics(BmadErrorMonitor.getMetrics())
                  setRecentErrors(BmadErrorMonitor.getRecentErrors(10))
                }}
                className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}