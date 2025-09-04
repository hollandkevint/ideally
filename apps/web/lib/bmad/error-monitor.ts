// Error monitoring and logging system for BMad Method

export interface ErrorReport {
  id: string
  timestamp: Date
  error: Error | string
  context: {
    component?: string
    action?: string
    userId?: string
    sessionId?: string
    workspaceId?: string
    pathway?: string
    phaseId?: string
    userAgent?: string
    url?: string
    stack?: string
  }
  severity: 'low' | 'medium' | 'high' | 'critical'
  resolved?: boolean
  userImpact: 'none' | 'minor' | 'major' | 'blocking'
}

export interface ErrorMetrics {
  totalErrors: number
  criticalErrors: number
  errorsByComponent: Record<string, number>
  errorsByAction: Record<string, number>
  errorTrends: Array<{
    date: string
    count: number
    criticalCount: number
  }>
}

class ErrorMonitor {
  private static instance: ErrorMonitor
  private errorLog: ErrorReport[] = []
  private maxLogSize: number = 1000
  private isProduction: boolean = process.env.NODE_ENV === 'production'

  private constructor() {
    this.setupGlobalErrorHandling()
  }

  static getInstance(): ErrorMonitor {
    if (!ErrorMonitor.instance) {
      ErrorMonitor.instance = new ErrorMonitor()
    }
    return ErrorMonitor.instance
  }

  private setupGlobalErrorHandling() {
    // Handle unhandled promise rejections
    if (typeof window !== 'undefined') {
      window.addEventListener('unhandledrejection', (event) => {
        this.captureError(event.reason, {
          component: 'global',
          action: 'unhandled-promise-rejection',
        }, 'high', 'major')
      })

      // Handle JavaScript errors
      window.addEventListener('error', (event) => {
        this.captureError(event.error || event.message, {
          component: 'global',
          action: 'javascript-error',
          url: event.filename,
          stack: event.error?.stack,
        }, 'high', 'major')
      })
    }
  }

  captureError(
    error: Error | string,
    context: Partial<ErrorReport['context']> = {},
    severity: ErrorReport['severity'] = 'medium',
    userImpact: ErrorReport['userImpact'] = 'minor'
  ): string {
    const errorReport: ErrorReport = {
      id: this.generateErrorId(),
      timestamp: new Date(),
      error,
      context: {
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        url: typeof window !== 'undefined' ? window.location.href : undefined,
        stack: error instanceof Error ? error.stack : undefined,
        ...context
      },
      severity,
      userImpact,
      resolved: false
    }

    // Add to local log
    this.errorLog.unshift(errorReport)
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(0, this.maxLogSize)
    }

    // Console logging based on severity
    this.logToConsole(errorReport)

    // Send to monitoring service in production
    if (this.isProduction) {
      this.sendToMonitoringService(errorReport)
    }

    return errorReport.id
  }

  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private logToConsole(errorReport: ErrorReport) {
    const { error, context, severity, userImpact } = errorReport
    
    const logData = {
      id: errorReport.id,
      timestamp: errorReport.timestamp.toISOString(),
      error: error instanceof Error ? error.message : error,
      context,
      severity,
      userImpact,
      stack: context.stack
    }

    switch (severity) {
      case 'critical':
        console.error('🚨 CRITICAL ERROR:', logData)
        break
      case 'high':
        console.error('❌ HIGH SEVERITY ERROR:', logData)
        break
      case 'medium':
        console.warn('⚠️ MEDIUM SEVERITY ERROR:', logData)
        break
      case 'low':
        console.info('ℹ️ LOW SEVERITY ERROR:', logData)
        break
    }
  }

  private async sendToMonitoringService(errorReport: ErrorReport) {
    try {
      // In a real application, this would send to your monitoring service
      // (e.g., Sentry, DataDog, custom endpoint)
      await fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: errorReport.id,
          timestamp: errorReport.timestamp.toISOString(),
          message: errorReport.error instanceof Error ? errorReport.error.message : errorReport.error,
          stack: errorReport.context.stack,
          context: errorReport.context,
          severity: errorReport.severity,
          userImpact: errorReport.userImpact
        })
      })
    } catch (sendError) {
      // Fallback logging if monitoring service is unavailable
      console.error('Failed to send error to monitoring service:', sendError)
    }
  }

  getErrorMetrics(): ErrorMetrics {
    const now = new Date()
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    
    const recentErrors = this.errorLog.filter(error => error.timestamp >= last7Days)
    
    const errorsByComponent: Record<string, number> = {}
    const errorsByAction: Record<string, number> = {}
    let criticalErrors = 0

    recentErrors.forEach(error => {
      if (error.context.component) {
        errorsByComponent[error.context.component] = (errorsByComponent[error.context.component] || 0) + 1
      }
      if (error.context.action) {
        errorsByAction[error.context.action] = (errorsByAction[error.context.action] || 0) + 1
      }
      if (error.severity === 'critical') {
        criticalErrors++
      }
    })

    // Generate daily error trends
    const errorTrends: ErrorMetrics['errorTrends'] = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate())
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)
      
      const dayErrors = this.errorLog.filter(error => 
        error.timestamp >= dayStart && error.timestamp < dayEnd
      )
      
      errorTrends.push({
        date: date.toISOString().split('T')[0],
        count: dayErrors.length,
        criticalCount: dayErrors.filter(e => e.severity === 'critical').length
      })
    }

    return {
      totalErrors: recentErrors.length,
      criticalErrors,
      errorsByComponent,
      errorsByAction,
      errorTrends
    }
  }

  getRecentErrors(limit: number = 50): ErrorReport[] {
    return this.errorLog.slice(0, limit)
  }

  markErrorResolved(errorId: string): boolean {
    const error = this.errorLog.find(e => e.id === errorId)
    if (error) {
      error.resolved = true
      return true
    }
    return false
  }

  clearErrorLog(): void {
    this.errorLog = []
  }
}

// Specialized error capture functions for BMad components
export class BmadErrorMonitor {
  private static monitor = ErrorMonitor.getInstance()

  static capturePathwayError(
    error: Error | string,
    context: {
      workspaceId?: string
      pathway?: string
      userInput?: string
      action?: 'fetch-pathways' | 'analyze-intent' | 'select-pathway'
    }
  ) {
    return this.monitor.captureError(error, {
      component: 'PathwaySelector',
      ...context
    }, 'medium', 'major')
  }

  static captureSessionError(
    error: Error | string,
    context: {
      sessionId?: string
      workspaceId?: string
      pathway?: string
      phaseId?: string
      action?: 'create-session' | 'advance-session' | 'get-session' | 'pause-session' | 'resume-session'
    }
  ) {
    const severity = context.action === 'create-session' ? 'high' : 'medium'
    const userImpact = context.action === 'create-session' ? 'blocking' : 'major'
    
    return this.monitor.captureError(error, {
      component: 'SessionManager',
      ...context
    }, severity, userImpact)
  }

  static captureElicitationError(
    error: Error | string,
    context: {
      sessionId?: string
      phaseId?: string
      selectedOption?: number
      customInput?: string
      action?: 'submit-response' | 'load-options' | 'validate-input'
    }
  ) {
    return this.monitor.captureError(error, {
      component: 'ElicitationPanel',
      ...context
    }, 'medium', 'major')
  }

  static captureApiError(
    error: Error | string,
    context: {
      endpoint?: string
      method?: string
      statusCode?: number
      requestBody?: unknown
      responseBody?: unknown
      action?: string
    }
  ) {
    const severity = context.statusCode && context.statusCode >= 500 ? 'high' : 'medium'
    const userImpact = context.statusCode === 503 ? 'blocking' : 'major'
    
    return this.monitor.captureError(error, {
      component: 'API',
      ...context
    }, severity, userImpact)
  }

  static captureBoundaryError(
    error: Error,
    errorInfo: React.ErrorInfo,
    component: string
  ) {
    return this.monitor.captureError(error, {
      component: `ErrorBoundary-${component}`,
      action: 'component-crash',
      stack: errorInfo.componentStack
    }, 'high', 'major')
  }

  static getMetrics() {
    return this.monitor.getErrorMetrics()
  }

  static getRecentErrors(limit?: number) {
    return this.monitor.getRecentErrors(limit)
  }

  static markResolved(errorId: string) {
    return this.monitor.markErrorResolved(errorId)
  }
}

// Export singleton instance
export const errorMonitor = ErrorMonitor.getInstance()