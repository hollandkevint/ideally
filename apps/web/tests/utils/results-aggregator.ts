import { TestResult } from '@playwright/test/reporter'
import * as fs from 'fs'
import * as path from 'path'

export interface AggregatedOAuthResults {
  summary: {
    totalTests: number
    passed: number
    failed: number
    skipped: number
    successRate: number
    totalDuration: number
    timestamp: string
  }
  performance: {
    averageLatency: number
    p95Latency: number
    slowestTest: string
    fastestTest: string
    timeoutTests: string[]
  }
  coverage: {
    scenariosCovered: string[]
    requirementsCovered: string[]
    coveragePercentage: number
    missingScenarios: string[]
  }
  errors: {
    breakdown: Record<string, number>
    criticalFailures: Array<{
      test: string
      error: string
      category: string
      impact: 'high' | 'medium' | 'low'
    }>
    patterns: string[]
  }
  trends: {
    comparedToPrevious?: {
      successRateChange: number
      performanceChange: number
      newFailures: string[]
      resolvedIssues: string[]
    }
  }
}

export class OAuthResultsAggregator {
  private reportDir: string

  constructor(reportDir: string = 'playwright-report') {
    this.reportDir = reportDir
  }

  async aggregateResults(): Promise<AggregatedOAuthResults> {
    const testResults = await this.loadTestResults()
    const previousResults = await this.loadPreviousResults()

    const aggregated: AggregatedOAuthResults = {
      summary: this.calculateSummary(testResults),
      performance: this.analyzePerformance(testResults),
      coverage: this.analyzeCoverage(testResults),
      errors: this.analyzeErrors(testResults),
      trends: this.compareTrends(testResults, previousResults)
    }

    await this.saveResults(aggregated)
    await this.generateMarkdownReport(aggregated)

    return aggregated
  }

  private async loadTestResults(): Promise<any[]> {
    try {
      const resultsPath = path.join(this.reportDir, 'test-results.json')
      const data = fs.readFileSync(resultsPath, 'utf8')
      const results = JSON.parse(data)

      // Filter OAuth-related tests
      return results.suites?.flatMap((suite: any) =>
        suite.tests?.filter((test: any) =>
          test.title?.toLowerCase().includes('oauth') ||
          test.location?.file?.includes('oauth')
        ) || []
      ) || []
    } catch (error) {
      console.warn('Could not load test results:', error)
      return []
    }
  }

  private async loadPreviousResults(): Promise<AggregatedOAuthResults | null> {
    try {
      const previousPath = path.join(this.reportDir, 'oauth-results-previous.json')
      const data = fs.readFileSync(previousPath, 'utf8')
      return JSON.parse(data)
    } catch {
      return null
    }
  }

  private calculateSummary(testResults: any[]): AggregatedOAuthResults['summary'] {
    const total = testResults.length
    const passed = testResults.filter(t => t.outcome === 'expected').length
    const failed = testResults.filter(t => t.outcome === 'unexpected').length
    const skipped = testResults.filter(t => t.outcome === 'skipped').length

    return {
      totalTests: total,
      passed,
      failed,
      skipped,
      successRate: total > 0 ? (passed / total) * 100 : 0,
      totalDuration: testResults.reduce((sum, t) => sum + (t.duration || 0), 0),
      timestamp: new Date().toISOString()
    }
  }

  private analyzePerformance(testResults: any[]): AggregatedOAuthResults['performance'] {
    const durations = testResults.map(t => t.duration || 0).filter(d => d > 0)
    durations.sort((a, b) => a - b)

    const slowestTest = testResults.reduce((prev, current) =>
      (current.duration > prev.duration) ? current : prev
    )

    const fastestTest = testResults.reduce((prev, current) =>
      (current.duration < prev.duration) ? current : prev
    )

    const timeoutTests = testResults
      .filter(t => t.error?.message?.includes('timeout'))
      .map(t => t.title)

    return {
      averageLatency: durations.length > 0 ? durations.reduce((a, b) => a + b) / durations.length : 0,
      p95Latency: durations.length > 0 ? durations[Math.floor(durations.length * 0.95)] : 0,
      slowestTest: slowestTest?.title || 'N/A',
      fastestTest: fastestTest?.title || 'N/A',
      timeoutTests
    }
  }

  private analyzeCoverage(testResults: any[]): AggregatedOAuthResults['coverage'] {
    const requiredScenarios = [
      'OAuth login flow',
      'PKCE validation',
      'Session persistence',
      'Error handling',
      'Network failures',
      'Rate limiting',
      'Security validation',
      'User denial',
      'Token refresh',
      'Logout functionality'
    ]

    const scenariosCovered = []
    const requirementsCovered = []

    for (const test of testResults) {
      const title = test.title?.toLowerCase() || ''

      // Check scenario coverage
      requiredScenarios.forEach(scenario => {
        if (title.includes(scenario.toLowerCase()) && !scenariosCovered.includes(scenario)) {
          scenariosCovered.push(scenario)
        }
      })

      // Extract requirements from test names and results
      if (title.includes('callback')) requirementsCovered.push('OAuth callback handling')
      if (title.includes('session')) requirementsCovered.push('Session management')
      if (title.includes('error')) requirementsCovered.push('Error handling')
      if (title.includes('pkce')) requirementsCovered.push('PKCE implementation')
      if (title.includes('latency')) requirementsCovered.push('Performance monitoring')
    }

    const missingScenarios = requiredScenarios.filter(s => !scenariosCovered.includes(s))

    return {
      scenariosCovered,
      requirementsCovered: [...new Set(requirementsCovered)], // Remove duplicates
      coveragePercentage: (scenariosCovered.length / requiredScenarios.length) * 100,
      missingScenarios
    }
  }

  private analyzeErrors(testResults: any[]): AggregatedOAuthResults['errors'] {
    const failedTests = testResults.filter(t => t.outcome === 'unexpected')
    const breakdown: Record<string, number> = {}
    const criticalFailures = []
    const patterns = []

    for (const test of failedTests) {
      const error = test.error?.message || 'Unknown error'

      // Categorize errors
      if (error.includes('access_denied')) {
        breakdown['User Denied Access'] = (breakdown['User Denied Access'] || 0) + 1
      } else if (error.includes('timeout')) {
        breakdown['Timeout'] = (breakdown['Timeout'] || 0) + 1
      } else if (error.includes('network')) {
        breakdown['Network Error'] = (breakdown['Network Error'] || 0) + 1
      } else if (error.includes('PKCE') || error.includes('invalid_grant')) {
        breakdown['Security/PKCE'] = (breakdown['Security/PKCE'] || 0) + 1
      } else if (error.includes('session')) {
        breakdown['Session Management'] = (breakdown['Session Management'] || 0) + 1
      } else {
        breakdown['Other'] = (breakdown['Other'] || 0) + 1
      }

      // Identify critical failures
      const isCritical = test.title?.toLowerCase().includes('critical') ||
                        error.includes('security') ||
                        error.includes('authentication')

      if (isCritical) {
        criticalFailures.push({
          test: test.title,
          error: error.substring(0, 200), // Truncate long errors
          category: this.categorizeError(error),
          impact: this.assessImpact(test.title, error)
        })
      }
    }

    // Identify error patterns
    const errorMessages = failedTests.map(t => t.error?.message || '')
    const commonWords = this.findCommonErrorPatterns(errorMessages)
    patterns.push(...commonWords)

    return {
      breakdown,
      criticalFailures,
      patterns
    }
  }

  private categorizeError(error: string): string {
    if (error.includes('access_denied')) return 'User Action'
    if (error.includes('timeout')) return 'Performance'
    if (error.includes('network')) return 'Infrastructure'
    if (error.includes('PKCE')) return 'Security'
    if (error.includes('session')) return 'State Management'
    return 'Unknown'
  }

  private assessImpact(testTitle: string, error: string): 'high' | 'medium' | 'low' {
    if (testTitle.includes('critical') || error.includes('security')) return 'high'
    if (testTitle.includes('error') || error.includes('timeout')) return 'medium'
    return 'low'
  }

  private findCommonErrorPatterns(errors: string[]): string[] {
    const patterns = []
    const wordCounts: Record<string, number> = {}

    errors.forEach(error => {
      const words = error.toLowerCase().split(/\s+/)
      words.forEach(word => {
        if (word.length > 4) { // Only consider longer words
          wordCounts[word] = (wordCounts[word] || 0) + 1
        }
      })
    })

    // Find words that appear in multiple errors
    Object.entries(wordCounts).forEach(([word, count]) => {
      if (count >= 2) {
        patterns.push(`${word} (${count} occurrences)`)
      }
    })

    return patterns.slice(0, 5) // Top 5 patterns
  }

  private compareTrends(
    currentResults: any[],
    previousResults: AggregatedOAuthResults | null
  ): AggregatedOAuthResults['trends'] {
    if (!previousResults) {
      return {}
    }

    const currentSummary = this.calculateSummary(currentResults)
    const currentPerf = this.analyzePerformance(currentResults)

    const successRateChange = currentSummary.successRate - previousResults.summary.successRate
    const performanceChange = currentPerf.averageLatency - previousResults.performance.averageLatency

    // Find new failures and resolved issues
    const currentFailures = currentResults
      .filter(t => t.outcome === 'unexpected')
      .map(t => t.title)

    const previousFailures = previousResults.errors.criticalFailures.map(f => f.test)

    const newFailures = currentFailures.filter(f => !previousFailures.includes(f))
    const resolvedIssues = previousFailures.filter(f => !currentFailures.includes(f))

    return {
      comparedToPrevious: {
        successRateChange,
        performanceChange,
        newFailures,
        resolvedIssues
      }
    }
  }

  private async saveResults(results: AggregatedOAuthResults): Promise<void> {
    const resultsPath = path.join(this.reportDir, 'oauth-results-aggregated.json')
    const previousPath = path.join(this.reportDir, 'oauth-results-previous.json')

    // Backup current results as previous
    if (fs.existsSync(resultsPath)) {
      fs.copyFileSync(resultsPath, previousPath)
    }

    // Save new results
    fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2))
  }

  private async generateMarkdownReport(results: AggregatedOAuthResults): Promise<void> {
    const reportPath = path.join(this.reportDir, 'oauth-test-report.md')

    const markdown = `# OAuth E2E Test Report

Generated: ${new Date().toLocaleString()}

## 📊 Summary

- **Total Tests**: ${results.summary.totalTests}
- **Success Rate**: ${results.summary.successRate.toFixed(1)}%
- **Passed**: ${results.summary.passed}
- **Failed**: ${results.summary.failed}
- **Skipped**: ${results.summary.skipped}
- **Total Duration**: ${(results.summary.totalDuration / 1000).toFixed(2)}s

## ⚡ Performance

- **Average Latency**: ${results.performance.averageLatency.toFixed(0)}ms
- **95th Percentile**: ${results.performance.p95Latency.toFixed(0)}ms
- **Slowest Test**: ${results.performance.slowestTest}
- **Fastest Test**: ${results.performance.fastestTest}

${results.performance.timeoutTests.length > 0 ? `
### ⚠️ Timeout Issues
${results.performance.timeoutTests.map(test => `- ${test}`).join('\n')}
` : ''}

## 🎯 Test Coverage

**Coverage**: ${results.coverage.coveragePercentage.toFixed(1)}%

### ✅ Covered Scenarios
${results.coverage.scenariosCovered.map(s => `- ${s}`).join('\n')}

${results.coverage.missingScenarios.length > 0 ? `
### ❌ Missing Scenarios
${results.coverage.missingScenarios.map(s => `- ${s}`).join('\n')}
` : ''}

## 🔍 Error Analysis

${Object.entries(results.errors.breakdown).map(([category, count]) =>
  `- **${category}**: ${count}`
).join('\n')}

${results.errors.criticalFailures.length > 0 ? `
### 🚨 Critical Failures
${results.errors.criticalFailures.map(f =>
  `- **${f.test}** (${f.impact} impact): ${f.error}`
).join('\n')}
` : ''}

${results.errors.patterns.length > 0 ? `
### 📈 Error Patterns
${results.errors.patterns.map(p => `- ${p}`).join('\n')}
` : ''}

${results.trends.comparedToPrevious ? `
## 📈 Trends

- **Success Rate Change**: ${results.trends.comparedToPrevious.successRateChange > 0 ? '+' : ''}${results.trends.comparedToPrevious.successRateChange.toFixed(1)}%
- **Performance Change**: ${results.trends.comparedToPrevious.performanceChange > 0 ? '+' : ''}${results.trends.comparedToPrevious.performanceChange.toFixed(0)}ms

${results.trends.comparedToPrevious.newFailures.length > 0 ? `
### 🆕 New Failures
${results.trends.comparedToPrevious.newFailures.map(f => `- ${f}`).join('\n')}
` : ''}

${results.trends.comparedToPrevious.resolvedIssues.length > 0 ? `
### ✅ Resolved Issues
${results.trends.comparedToPrevious.resolvedIssues.map(f => `- ${f}`).join('\n')}
` : ''}
` : ''}

---
*Report generated by OAuth E2E Test Suite*
`

    fs.writeFileSync(reportPath, markdown)
  }
}

export default OAuthResultsAggregator