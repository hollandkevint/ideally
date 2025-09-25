// Service availability checker and graceful degradation utilities

export interface ServiceStatus {
  available: boolean
  responseTime?: number
  lastChecked: Date
  error?: string
}

export interface ServiceHealthCheck {
  bmadApi: ServiceStatus
  database: ServiceStatus
  pathwayAnalysis: ServiceStatus
  sessionManagement: ServiceStatus
}

class ServiceMonitor {
  private static instance: ServiceMonitor
  private status: ServiceHealthCheck
  private checkInterval: NodeJS.Timeout | null = null
  private listeners: ((status: ServiceHealthCheck) => void)[] = []

  private constructor() {
    this.status = {
      bmadApi: { available: true, lastChecked: new Date() },
      database: { available: true, lastChecked: new Date() },
      pathwayAnalysis: { available: true, lastChecked: new Date() },
      sessionManagement: { available: true, lastChecked: new Date() }
    }
  }

  static getInstance(): ServiceMonitor {
    if (!ServiceMonitor.instance) {
      ServiceMonitor.instance = new ServiceMonitor()
    }
    return ServiceMonitor.instance
  }

  getStatus(): ServiceHealthCheck {
    return { ...this.status }
  }

  isServiceAvailable(service: keyof ServiceHealthCheck): boolean {
    return this.status[service].available
  }

  areServicesAvailable(services: (keyof ServiceHealthCheck)[]): boolean {
    return services.every(service => this.status[service].available)
  }

  markServiceDown(service: keyof ServiceHealthCheck, error?: string) {
    this.status[service] = {
      available: false,
      lastChecked: new Date(),
      error
    }
    this.notifyListeners()
  }

  markServiceUp(service: keyof ServiceHealthCheck, responseTime?: number) {
    this.status[service] = {
      available: true,
      lastChecked: new Date(),
      responseTime
    }
    this.notifyListeners()
  }

  subscribe(listener: (status: ServiceHealthCheck) => void): () => void {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.getStatus()))
  }

  startMonitoring(intervalMs: number = 30000) {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
    }

    this.checkInterval = setInterval(() => {
      this.performHealthCheck()
    }, intervalMs)

    // Initial check
    this.performHealthCheck()
  }

  stopMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
  }

  private async performHealthCheck() {
    // Check BMad API
    try {
      const startTime = Date.now()
      const response = await fetch('/api/bmad?action=health', { 
        method: 'GET',
        signal: AbortSignal.timeout(5000) // 5 second timeout
      })
      const responseTime = Date.now() - startTime
      
      if (response.ok) {
        this.markServiceUp('bmadApi', responseTime)
      } else {
        this.markServiceDown('bmadApi', `HTTP ${response.status}`)
      }
    } catch (error) {
      this.markServiceDown('bmadApi', error instanceof Error ? error.message : 'Connection failed')
    }

    // Other service checks would go here
    // For now, we'll assume they follow the BMad API status
    const bmadStatus = this.status.bmadApi
    
    this.status.database = { ...bmadStatus }
    this.status.pathwayAnalysis = { ...bmadStatus }
    this.status.sessionManagement = { ...bmadStatus }

    this.notifyListeners()
  }
}

// Graceful degradation strategies
export class GracefulDegradation {
  private static serviceMonitor = ServiceMonitor.getInstance()

  /**
   * Attempts an operation with fallback if services are unavailable
   */
  static async withFallback<T>(
    operation: () => Promise<T>,
    fallback: () => T | Promise<T>,
    requiredServices: (keyof ServiceHealthCheck)[] = ['bmadApi']
  ): Promise<T> {
    // Check if required services are available
    if (!this.serviceMonitor.areServicesAvailable(requiredServices)) {
      console.warn('Services unavailable, using fallback:', requiredServices)
      return await fallback()
    }

    try {
      const result = await operation()
      return result
    } catch (error) {
      // Mark services as down based on error type
      this.handleOperationError(error, requiredServices)
      
      // Use fallback
      console.warn('Operation failed, using fallback:', error)
      return await fallback()
    }
  }

  /**
   * Provides offline pathway recommendations when analysis service is down
   */
  static getOfflinePathwayRecommendation(userInput?: string): {
    recommendedPathway: string
    confidence: number
    reasoning: string
    alternativePathways: string[]
  } {
    // Simple keyword-based analysis for offline mode
    const input = (userInput || '').toLowerCase()
    
    if (input.includes('idea') || input.includes('concept') || input.includes('new')) {
      return {
        recommendedPathway: 'new-idea',
        confidence: 60,
        reasoning: 'Based on keywords suggesting new concept development (offline analysis)',
        alternativePathways: ['business-model', 'strategic-optimization']
      }
    }
    
    if (input.includes('revenue') || input.includes('business') || input.includes('money')) {
      return {
        recommendedPathway: 'business-model',
        confidence: 65,
        reasoning: 'Based on keywords suggesting business/revenue focus (offline analysis)',
        alternativePathways: ['strategic-optimization', 'new-idea']
      }
    }
    
    if (input.includes('improve') || input.includes('optimize') || input.includes('better')) {
      return {
        recommendedPathway: 'strategic-optimization',
        confidence: 60,
        reasoning: 'Based on keywords suggesting optimization needs (offline analysis)',
        alternativePathways: ['business-model', 'new-idea']
      }
    }
    
    // Default recommendation
    return {
      recommendedPathway: 'new-idea',
      confidence: 50,
      reasoning: 'Default recommendation when detailed analysis is unavailable (offline mode)',
      alternativePathways: ['business-model', 'strategic-optimization']
    }
  }

  /**
   * Provides cached session data when database is unavailable
   */
  static getCachedSessionData(sessionId: string): unknown | null {
    try {
      const cached = localStorage.getItem(`bmad_session_${sessionId}`)
      return cached ? JSON.parse(cached) : null
    } catch {
      return null
    }
  }

  /**
   * Caches session data locally for offline access
   */
  static cacheSessionData(sessionId: string, data: unknown): void {
    try {
      localStorage.setItem(`bmad_session_${sessionId}`, JSON.stringify({
        ...data,
        cachedAt: new Date().toISOString()
      }))
    } catch {
      // Storage quota exceeded or disabled
      console.warn('Unable to cache session data')
    }
  }

  /**
   * Provides basic elicitation options when backend is unavailable
   */
  static getOfflineElicitationOptions(): {
    options: Array<{
      number: number
      text: string
      category: string
      estimatedTime: number
    }>
    phaseTitle: string
    prompt: string
  } {
    return {
      options: [
        {
          number: 1,
          text: "Research the competitive landscape and market opportunities",
          category: "analysis",
          estimatedTime: 20
        },
        {
          number: 2,
          text: "Define your target users and their specific needs",
          category: "strategy", 
          estimatedTime: 15
        },
        {
          number: 3,
          text: "Create a minimal version to test core assumptions",
          category: "validation",
          estimatedTime: 30
        },
        {
          number: 4,
          text: "Develop a clear business model and revenue strategy",
          category: "strategy",
          estimatedTime: 25
        }
      ],
      phaseTitle: "Strategic Direction (Offline Mode)",
      prompt: "We're currently in offline mode. Choose an approach to continue your strategic thinking session:"
    }
  }

  private static handleOperationError(error: unknown, services: (keyof ServiceHealthCheck)[]) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    
    // Mark relevant services as down based on error patterns
    if (errorMessage.includes('fetch') || errorMessage.includes('network')) {
      services.forEach(service => {
        this.serviceMonitor.markServiceDown(service, 'Network connectivity issue')
      })
    } else if (errorMessage.includes('database') || errorMessage.includes('storage')) {
      this.serviceMonitor.markServiceDown('database', 'Database connectivity issue')
    } else {
      // Generic service failure
      services.forEach(service => {
        this.serviceMonitor.markServiceDown(service, errorMessage)
      })
    }
  }
}

// Export singleton instance
export const serviceMonitor = ServiceMonitor.getInstance()