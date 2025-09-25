import { test } from '@playwright/test'

export interface OAuthTestMetadata {
  scenario: string
  category: 'authentication' | 'error_handling' | 'session_management' | 'security' | 'performance'
  priority: 'critical' | 'high' | 'medium' | 'low'
  provider: 'google' | 'any'
  expectedDuration: number // in milliseconds
  requirements: string[]
  tags: string[]
}

export interface TestExecutionMetrics {
  startTime: number
  endTime: number
  latency?: number
  networkCalls?: number
  errorType?: string
  sessionActions?: Array<{
    action: string
    timestamp: number
    success: boolean
  }>
}

class TestMetadataTracker {
  private static instance: TestMetadataTracker
  private testMetadata = new Map<string, OAuthTestMetadata>()
  private executionMetrics = new Map<string, TestExecutionMetrics>()

  static getInstance(): TestMetadataTracker {
    if (!TestMetadataTracker.instance) {
      TestMetadataTracker.instance = new TestMetadataTracker()
    }
    return TestMetadataTracker.instance
  }

  registerTest(testName: string, metadata: OAuthTestMetadata) {
    this.testMetadata.set(testName, metadata)
  }

  startTest(testName: string) {
    this.executionMetrics.set(testName, {
      startTime: Date.now(),
      endTime: 0,
      sessionActions: []
    })
  }

  endTest(testName: string) {
    const metrics = this.executionMetrics.get(testName)
    if (metrics) {
      metrics.endTime = Date.now()
    }
  }

  recordLatency(testName: string, latency: number) {
    const metrics = this.executionMetrics.get(testName)
    if (metrics) {
      metrics.latency = latency
    }
  }

  recordError(testName: string, errorType: string) {
    const metrics = this.executionMetrics.get(testName)
    if (metrics) {
      metrics.errorType = errorType
    }
  }

  recordSessionAction(testName: string, action: string, success: boolean) {
    const metrics = this.executionMetrics.get(testName)
    if (metrics && metrics.sessionActions) {
      metrics.sessionActions.push({
        action,
        timestamp: Date.now(),
        success
      })
    }
  }

  getTestMetadata(testName: string): OAuthTestMetadata | undefined {
    return this.testMetadata.get(testName)
  }

  getExecutionMetrics(testName: string): TestExecutionMetrics | undefined {
    return this.executionMetrics.get(testName)
  }

  getAllResults() {
    const results = []
    for (const [testName, metadata] of this.testMetadata.entries()) {
      const metrics = this.executionMetrics.get(testName)
      results.push({
        testName,
        metadata,
        metrics
      })
    }
    return results
  }

  generateCoverageReport() {
    const categoryCounters = {
      authentication: 0,
      error_handling: 0,
      session_management: 0,
      security: 0,
      performance: 0
    }

    const priorityCounters = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    }

    for (const metadata of this.testMetadata.values()) {
      categoryCounters[metadata.category]++
      priorityCounters[metadata.priority]++
    }

    return {
      totalTests: this.testMetadata.size,
      categories: categoryCounters,
      priorities: priorityCounters,
      coverage: this.calculateCoverage()
    }
  }

  private calculateCoverage() {
    const requiredScenarios = [
      'OAuth login flow',
      'PKCE validation',
      'Session persistence',
      'Error handling',
      'Network failures',
      'Rate limiting',
      'Security validation'
    ]

    const coveredScenarios = []
    for (const metadata of this.testMetadata.values()) {
      requiredScenarios.forEach(scenario => {
        if (metadata.scenario.toLowerCase().includes(scenario.toLowerCase()) ||
            metadata.requirements.some(req => req.toLowerCase().includes(scenario.toLowerCase()))) {
          if (!coveredScenarios.includes(scenario)) {
            coveredScenarios.push(scenario)
          }
        }
      })
    }

    return {
      requiredScenarios,
      coveredScenarios,
      coveragePercentage: (coveredScenarios.length / requiredScenarios.length) * 100
    }
  }
}

// Helper function to register test with metadata
export function oauthTest(name: string, metadata: OAuthTestMetadata, testFn: Parameters<typeof test>[1]) {
  const tracker = TestMetadataTracker.getInstance()
  tracker.registerTest(name, metadata)

  return test(name, async (testInfo) => {
    tracker.startTest(name)

    try {
      await testFn(testInfo)
    } finally {
      tracker.endTest(name)
    }
  })
}

// Helper function to measure OAuth latency
export async function measureOAuthLatency<T>(
  testName: string,
  operation: () => Promise<T>
): Promise<T> {
  const tracker = TestMetadataTracker.getInstance()
  const startTime = Date.now()

  try {
    const result = await operation()
    const latency = Date.now() - startTime
    tracker.recordLatency(testName, latency)
    return result
  } catch (error) {
    const latency = Date.now() - startTime
    tracker.recordLatency(testName, latency)
    throw error
  }
}

// Helper function to record session actions
export function recordSessionAction(testName: string, action: string, success: boolean) {
  const tracker = TestMetadataTracker.getInstance()
  tracker.recordSessionAction(testName, action, success)
}

// Helper function to record OAuth errors
export function recordOAuthError(testName: string, error: Error | string) {
  const tracker = TestMetadataTracker.getInstance()
  const errorType = typeof error === 'string' ? error : error.message

  // Categorize OAuth errors
  let category = 'unknown'
  if (errorType.includes('access_denied')) category = 'user_denied'
  else if (errorType.includes('invalid_grant')) category = 'invalid_grant'
  else if (errorType.includes('timeout')) category = 'timeout'
  else if (errorType.includes('network')) category = 'network'
  else if (errorType.includes('PKCE')) category = 'pkce'
  else if (errorType.includes('session')) category = 'session'

  tracker.recordError(testName, category)
}

// Pre-defined test metadata templates
export const oauthTestTemplates = {
  basicLogin: {
    scenario: 'Basic OAuth login flow',
    category: 'authentication' as const,
    priority: 'critical' as const,
    provider: 'google' as const,
    expectedDuration: 5000,
    requirements: ['OAuth provider response', 'Session creation', 'Dashboard redirect'],
    tags: ['oauth', 'login', 'authentication']
  },

  errorHandling: {
    scenario: 'OAuth error handling',
    category: 'error_handling' as const,
    priority: 'high' as const,
    provider: 'google' as const,
    expectedDuration: 3000,
    requirements: ['Error message display', 'Graceful degradation', 'User feedback'],
    tags: ['oauth', 'errors', 'resilience']
  },

  sessionManagement: {
    scenario: 'OAuth session management',
    category: 'session_management' as const,
    priority: 'high' as const,
    provider: 'google' as const,
    expectedDuration: 8000,
    requirements: ['Session persistence', 'Cookie management', 'State validation'],
    tags: ['oauth', 'session', 'cookies']
  },

  pkceValidation: {
    scenario: 'PKCE security validation',
    category: 'security' as const,
    priority: 'critical' as const,
    provider: 'google' as const,
    expectedDuration: 4000,
    requirements: ['Code challenge generation', 'Code verifier validation', 'S256 method'],
    tags: ['oauth', 'pkce', 'security']
  },

  performanceTesting: {
    scenario: 'OAuth performance testing',
    category: 'performance' as const,
    priority: 'medium' as const,
    provider: 'google' as const,
    expectedDuration: 15000,
    requirements: ['Latency measurement', 'Timeout handling', 'Network resilience'],
    tags: ['oauth', 'performance', 'latency']
  }
}

export default TestMetadataTracker