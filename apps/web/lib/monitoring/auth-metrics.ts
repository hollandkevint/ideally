import { AuthEvent, AuthMetrics } from './auth-logger'

export interface MetricsWindow {
  windowStart: Date
  windowEnd: Date
  windowSizeMs: number
  label: string
}

export interface AuthMetricsCollection {
  '1h': AuthMetrics
  '24h': AuthMetrics
  '7d': AuthMetrics
  current: AuthMetrics
}

export interface DetailedAuthMetrics extends AuthMetrics {
  geographic_distribution?: Record<string, number>
  device_distribution?: Record<string, number>
  browser_distribution?: Record<string, number>
  hourly_pattern?: Record<string, number>
  error_trends?: Array<{
    hour: string
    error_type: string
    count: number
  }>
}

class AuthMetricsCollector {
  private events: AuthEvent[] = []
  private maxEventAge = 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds

  constructor() {
    // Initialize with any persisted events if available
    this.loadPersistedEvents()

    // Set up periodic cleanup
    setInterval(() => this.cleanupOldEvents(), 60 * 60 * 1000) // Every hour
  }

  private loadPersistedEvents(): void {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('auth_events')
        if (stored) {
          const parsed = JSON.parse(stored)
          this.events = parsed.filter((event: AuthEvent) =>
            new Date(event.timestamp).getTime() > Date.now() - this.maxEventAge
          )
        }
      } catch (error) {
        console.warn('Failed to load persisted auth events:', error)
      }
    }
  }

  private persistEvents(): void {
    if (typeof window !== 'undefined') {
      try {
        // Only persist recent events to avoid storage bloat
        const recentEvents = this.events.filter(event =>
          new Date(event.timestamp).getTime() > Date.now() - this.maxEventAge
        )
        localStorage.setItem('auth_events', JSON.stringify(recentEvents))
      } catch (error) {
        console.warn('Failed to persist auth events:', error)
      }
    }
  }

  private cleanupOldEvents(): void {
    const cutoff = new Date(Date.now() - this.maxEventAge)
    this.events = this.events.filter(event => new Date(event.timestamp) > cutoff)
    this.persistEvents()
  }

  addEvent(event: AuthEvent): void {
    this.events.push(event)
    this.persistEvents()

    // Trigger alert checking for recent metrics
    this.checkAlertsAsync()
  }

  private async checkAlertsAsync(): Promise<void> {
    try {
      // Import alert service dynamically to avoid circular dependencies
      const { alertService } = await import('./alert-service')

      // Check alerts based on 1-hour metrics
      const currentMetrics = this.calculateMetrics(60 * 60 * 1000)
      alertService.checkAndTriggerAlerts(currentMetrics)
      alertService.autoResolveAlerts(currentMetrics)
    } catch (error) {
      console.warn('Failed to check alerts:', error)
    }
  }

  getMetricsWindows(): MetricsWindow[] {
    const now = new Date()
    return [
      {
        windowStart: new Date(now.getTime() - 60 * 60 * 1000),
        windowEnd: now,
        windowSizeMs: 60 * 60 * 1000,
        label: '1h'
      },
      {
        windowStart: new Date(now.getTime() - 24 * 60 * 60 * 1000),
        windowEnd: now,
        windowSizeMs: 24 * 60 * 60 * 1000,
        label: '24h'
      },
      {
        windowStart: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        windowEnd: now,
        windowSizeMs: 7 * 24 * 60 * 60 * 1000,
        label: '7d'
      }
    ]
  }

  calculateMetrics(windowSizeMs: number): AuthMetrics {
    const now = new Date()
    const windowStart = new Date(now.getTime() - windowSizeMs)

    const recentEvents = this.events.filter(event =>
      new Date(event.timestamp) >= windowStart
    )

    const initiationEvents = recentEvents.filter(e => e.event_type === 'auth_initiation')
    const successEvents = recentEvents.filter(e => e.event_type === 'auth_success')
    const failureEvents = recentEvents.filter(e => e.event_type === 'auth_failure')

    // Total attempts = initiations or success + failures (whichever is higher for accuracy)
    const totalAttempts = Math.max(
      initiationEvents.length,
      successEvents.length + failureEvents.length
    )

    const errorDistribution = failureEvents.reduce((acc, event) => {
      const errorType = event.error_type || 'unknown'
      acc[errorType] = (acc[errorType] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const methodDistribution = [...successEvents, ...failureEvents].reduce((acc, event) => {
      acc[event.auth_method] = (acc[event.auth_method] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Calculate average latency for events that have latency data
    const eventsWithLatency = recentEvents.filter(e => e.latency_ms !== undefined)
    const avgLatency = eventsWithLatency.length > 0
      ? eventsWithLatency.reduce((sum, e) => sum + (e.latency_ms || 0), 0) / eventsWithLatency.length
      : 0

    return {
      success_count: successEvents.length,
      failure_count: failureEvents.length,
      total_attempts: totalAttempts,
      success_rate: totalAttempts > 0 ? (successEvents.length / totalAttempts) * 100 : 0,
      avg_latency_ms: Math.round(avgLatency),
      error_distribution: errorDistribution,
      method_distribution: methodDistribution,
      time_window: `${windowSizeMs / 1000 / 60}min`
    }
  }

  calculateDetailedMetrics(windowSizeMs: number): DetailedAuthMetrics {
    const baseMetrics = this.calculateMetrics(windowSizeMs)
    const now = new Date()
    const windowStart = new Date(now.getTime() - windowSizeMs)

    const recentEvents = this.events.filter(event =>
      new Date(event.timestamp) >= windowStart
    )

    // Geographic distribution (simplified - based on rough IP geolocation if available)
    const geographicDistribution = recentEvents.reduce((acc, event) => {
      // This would normally use actual geolocation data
      const region = this.extractRegionFromUserAgent(event.user_agent) || 'unknown'
      acc[region] = (acc[region] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Device/Browser distribution
    const deviceDistribution = recentEvents.reduce((acc, event) => {
      const device = this.extractDeviceFromUserAgent(event.user_agent) || 'unknown'
      acc[device] = (acc[device] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const browserDistribution = recentEvents.reduce((acc, event) => {
      const browser = this.extractBrowserFromUserAgent(event.user_agent) || 'unknown'
      acc[browser] = (acc[browser] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Hourly pattern
    const hourlyPattern = recentEvents.reduce((acc, event) => {
      const hour = new Date(event.timestamp).getHours().toString().padStart(2, '0')
      acc[hour] = (acc[hour] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Error trends by hour
    const errorTrends = this.calculateErrorTrends(recentEvents)

    return {
      ...baseMetrics,
      geographic_distribution: geographicDistribution,
      device_distribution: deviceDistribution,
      browser_distribution: browserDistribution,
      hourly_pattern: hourlyPattern,
      error_trends: errorTrends
    }
  }

  private calculateErrorTrends(events: AuthEvent[]): Array<{ hour: string; error_type: string; count: number }> {
    const errorsByHour = events
      .filter(e => e.event_type === 'auth_failure')
      .reduce((acc, event) => {
        const hour = new Date(event.timestamp).getHours().toString().padStart(2, '0')
        const errorType = event.error_type || 'unknown'
        const key = `${hour}-${errorType}`
        acc[key] = (acc[key] || 0) + 1
        return acc
      }, {} as Record<string, number>)

    return Object.entries(errorsByHour).map(([key, count]) => {
      const [hour, errorType] = key.split('-')
      return { hour, error_type: errorType, count }
    })
  }

  private extractRegionFromUserAgent(userAgent?: string): string {
    // Simplified region detection - in production, use proper geolocation
    if (!userAgent) return 'unknown'

    // Basic heuristics - this is very simplified
    if (userAgent.includes('Mobile')) return 'mobile'
    if (userAgent.includes('Windows')) return 'desktop_windows'
    if (userAgent.includes('Mac')) return 'desktop_mac'
    if (userAgent.includes('Linux')) return 'desktop_linux'

    return 'unknown'
  }

  private extractDeviceFromUserAgent(userAgent?: string): string {
    if (!userAgent) return 'unknown'

    if (userAgent.includes('Mobile') || userAgent.includes('Android')) return 'mobile'
    if (userAgent.includes('iPad') || userAgent.includes('Tablet')) return 'tablet'
    return 'desktop'
  }

  private extractBrowserFromUserAgent(userAgent?: string): string {
    if (!userAgent) return 'unknown'

    if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) return 'chrome'
    if (userAgent.includes('Firefox')) return 'firefox'
    if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'safari'
    if (userAgent.includes('Edg')) return 'edge'

    return 'other'
  }

  getAllMetrics(): AuthMetricsCollection {
    const windows = this.getMetricsWindows()

    return {
      '1h': this.calculateMetrics(windows[0].windowSizeMs),
      '24h': this.calculateMetrics(windows[1].windowSizeMs),
      '7d': this.calculateMetrics(windows[2].windowSizeMs),
      current: this.calculateMetrics(5 * 60 * 1000) // Last 5 minutes for "current"
    }
  }

  // Alert threshold checking
  checkAlerts(metrics: AuthMetrics): Array<{ level: 'warning' | 'critical'; message: string; value: number }> {
    const alerts: Array<{ level: 'warning' | 'critical'; message: string; value: number }> = []

    // Success rate alerts
    if (metrics.success_rate < 90) {
      alerts.push({
        level: 'critical',
        message: 'Authentication success rate below 90%',
        value: metrics.success_rate
      })
    } else if (metrics.success_rate < 95) {
      alerts.push({
        level: 'warning',
        message: 'Authentication success rate below 95%',
        value: metrics.success_rate
      })
    }

    // Latency alerts
    if (metrics.avg_latency_ms > 10000) {
      alerts.push({
        level: 'critical',
        message: 'Average authentication latency above 10 seconds',
        value: metrics.avg_latency_ms
      })
    } else if (metrics.avg_latency_ms > 5000) {
      alerts.push({
        level: 'warning',
        message: 'Average authentication latency above 5 seconds',
        value: metrics.avg_latency_ms
      })
    }

    // Error rate alerts for specific error types
    const totalAttempts = metrics.total_attempts
    Object.entries(metrics.error_distribution).forEach(([errorType, count]) => {
      const errorRate = totalAttempts > 0 ? (count / totalAttempts) * 100 : 0
      if (errorRate > 5) {
        alerts.push({
          level: 'warning',
          message: `High error rate for ${errorType}: ${errorRate.toFixed(1)}%`,
          value: errorRate
        })
      }
    })

    return alerts
  }

  // Export metrics for external monitoring systems
  exportMetrics(): string {
    const metrics = this.getAllMetrics()
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      metrics: metrics,
      alerts: this.checkAlerts(metrics['1h']),
      event_count: this.events.length
    }, null, 2)
  }
}

export const authMetricsCollector = new AuthMetricsCollector()