import type { FullConfig, Reporter, Suite, TestCase, TestResult } from '@playwright/test/reporter'

interface OAuthTestMetrics {
  totalOAuthTests: number
  passedOAuthTests: number
  failedOAuthTests: number
  skippedOAuthTests: number
  oAuthTestDuration: number
  averageOAuthLatency: number
  errorBreakdown: Record<string, number>
  scenariosCompleted: string[]
  criticalFailures: Array<{
    test: string
    error: string
    failureReason: string
  }>
}

class OAuthTestReporter implements Reporter {
  private metrics: OAuthTestMetrics = {
    totalOAuthTests: 0,
    passedOAuthTests: 0,
    failedOAuthTests: 0,
    skippedOAuthTests: 0,
    oAuthTestDuration: 0,
    averageOAuthLatency: 0,
    errorBreakdown: {},
    scenariosCompleted: [],
    criticalFailures: []
  }

  private oAuthTestResults: TestResult[] = []
  private startTime: number = 0

  onBegin(config: FullConfig, suite: Suite) {
    this.startTime = Date.now()
    console.log('\n🔐 Starting OAuth E2E Test Suite')
    console.log(`📊 Total test files: ${suite.allTests().length}`)

    // Count OAuth-related tests
    const oauthTests = suite.allTests().filter(test =>
      test.title.toLowerCase().includes('oauth') ||
      test.parent?.title?.toLowerCase().includes('oauth') ||
      test.location.file.includes('oauth')
    )

    this.metrics.totalOAuthTests = oauthTests.length
    console.log(`🔑 OAuth tests found: ${this.metrics.totalOAuthTests}`)
  }

  onTestEnd(test: TestCase, result: TestResult) {
    // Check if this is an OAuth-related test
    const isOAuthTest = test.title.toLowerCase().includes('oauth') ||
                       test.parent?.title?.toLowerCase().includes('oauth') ||
                       test.location.file.includes('oauth')

    if (!isOAuthTest) return

    this.oAuthTestResults.push(result)

    // Update metrics based on test result
    switch (result.status) {
      case 'passed':
        this.metrics.passedOAuthTests++
        this.metrics.scenariosCompleted.push(test.title)
        break
      case 'failed':
        this.metrics.failedOAuthTests++
        this.categorizeFailure(test, result)
        break
      case 'skipped':
        this.metrics.skippedOAuthTests++
        break
    }

    this.metrics.oAuthTestDuration += result.duration

    // Extract OAuth-specific metrics from test output
    this.extractOAuthMetrics(test, result)
  }

  private categorizeFailure(test: TestCase, result: TestResult) {
    const error = result.error?.message || 'Unknown error'

    // Categorize OAuth-specific errors
    if (error.includes('access_denied')) {
      this.metrics.errorBreakdown['User Denied Access'] = (this.metrics.errorBreakdown['User Denied Access'] || 0) + 1
    } else if (error.includes('invalid_grant') || error.includes('PKCE')) {
      this.metrics.errorBreakdown['PKCE/Grant Errors'] = (this.metrics.errorBreakdown['PKCE/Grant Errors'] || 0) + 1
    } else if (error.includes('network') || error.includes('timeout')) {
      this.metrics.errorBreakdown['Network/Timeout'] = (this.metrics.errorBreakdown['Network/Timeout'] || 0) + 1
    } else if (error.includes('session') || error.includes('cookie')) {
      this.metrics.errorBreakdown['Session Management'] = (this.metrics.errorBreakdown['Session Management'] || 0) + 1
    } else {
      this.metrics.errorBreakdown['Other'] = (this.metrics.errorBreakdown['Other'] || 0) + 1
    }

    // Track critical failures
    const criticalKeywords = ['critical', 'security', 'authentication', 'authorization']
    const isCritical = criticalKeywords.some(keyword =>
      test.title.toLowerCase().includes(keyword) || error.toLowerCase().includes(keyword)
    )

    if (isCritical) {
      this.metrics.criticalFailures.push({
        test: test.title,
        error: error,
        failureReason: this.extractFailureReason(error)
      })
    }
  }

  private extractOAuthMetrics(test: TestCase, result: TestResult) {
    // Extract latency measurements from test output
    const stdout = result.stdout.join('\n')
    const latencyMatch = stdout.match(/latency.*?(\d+)ms/i)

    if (latencyMatch) {
      const latency = parseInt(latencyMatch[1])
      // Calculate running average
      const totalTests = this.metrics.passedOAuthTests + this.metrics.failedOAuthTests
      this.metrics.averageOAuthLatency =
        (this.metrics.averageOAuthLatency * (totalTests - 1) + latency) / totalTests
    }
  }

  private extractFailureReason(error: string): string {
    if (error.includes('timeout')) return 'Test timeout - possibly slow OAuth provider'
    if (error.includes('element not found')) return 'UI element missing - possibly broken OAuth button'
    if (error.includes('network')) return 'Network connectivity issue'
    if (error.includes('PKCE')) return 'PKCE validation failure'
    if (error.includes('session')) return 'Session management issue'
    return 'Unknown failure reason'
  }

  async onEnd() {
    const totalTime = Date.now() - this.startTime
    const successRate = this.metrics.totalOAuthTests > 0
      ? (this.metrics.passedOAuthTests / this.metrics.totalOAuthTests) * 100
      : 0

    console.log('\n🔐 OAuth E2E Test Suite Results')
    console.log('=====================================')
    console.log(`📊 Total OAuth Tests: ${this.metrics.totalOAuthTests}`)
    console.log(`✅ Passed: ${this.metrics.passedOAuthTests}`)
    console.log(`❌ Failed: ${this.metrics.failedOAuthTests}`)
    console.log(`⏭️  Skipped: ${this.metrics.skippedOAuthTests}`)
    console.log(`📈 Success Rate: ${successRate.toFixed(1)}%`)
    console.log(`⏱️  Total Duration: ${(totalTime / 1000).toFixed(2)}s`)
    console.log(`🔑 OAuth Test Duration: ${(this.metrics.oAuthTestDuration / 1000).toFixed(2)}s`)

    if (this.metrics.averageOAuthLatency > 0) {
      console.log(`⚡ Average OAuth Latency: ${this.metrics.averageOAuthLatency.toFixed(0)}ms`)
    }

    // Error breakdown
    if (Object.keys(this.metrics.errorBreakdown).length > 0) {
      console.log('\n🔍 Error Breakdown:')
      Object.entries(this.metrics.errorBreakdown).forEach(([category, count]) => {
        console.log(`   ${category}: ${count}`)
      })
    }

    // Critical failures
    if (this.metrics.criticalFailures.length > 0) {
      console.log('\n🚨 Critical Failures:')
      this.metrics.criticalFailures.forEach((failure, index) => {
        console.log(`   ${index + 1}. ${failure.test}`)
        console.log(`      Reason: ${failure.failureReason}`)
      })
    }

    // Scenario coverage
    console.log('\n✅ Completed OAuth Scenarios:')
    this.metrics.scenariosCompleted.forEach(scenario => {
      console.log(`   • ${scenario}`)
    })

    // Performance warnings
    if (this.metrics.averageOAuthLatency > 5000) {
      console.log('\n⚠️  Performance Warning: Average OAuth latency exceeds 5s')
    }

    if (successRate < 95) {
      console.log('\n⚠️  Quality Warning: OAuth test success rate below 95%')
    }

    // Generate JSON report for CI/CD
    await this.generateJSONReport()
  }

  private async generateJSONReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: this.metrics.totalOAuthTests,
        passed: this.metrics.passedOAuthTests,
        failed: this.metrics.failedOAuthTests,
        skipped: this.metrics.skippedOAuthTests,
        successRate: this.metrics.totalOAuthTests > 0
          ? (this.metrics.passedOAuthTests / this.metrics.totalOAuthTests) * 100
          : 0,
        duration: this.metrics.oAuthTestDuration,
        averageLatency: this.metrics.averageOAuthLatency
      },
      errors: this.metrics.errorBreakdown,
      criticalFailures: this.metrics.criticalFailures,
      scenarios: this.metrics.scenariosCompleted,
      performance: {
        latencyThreshold: 5000,
        latencyStatus: this.metrics.averageOAuthLatency <= 5000 ? 'PASS' : 'WARN',
        successThreshold: 95,
        successStatus: (this.metrics.passedOAuthTests / this.metrics.totalOAuthTests) * 100 >= 95 ? 'PASS' : 'FAIL'
      }
    }

    // Write to file for CI/CD consumption using ESM dynamic import
    const { writeFileSync, mkdirSync } = await import('fs')
    const { join, dirname } = await import('path')

    const reportPath = join(process.cwd(), 'playwright-report', 'oauth-test-results.json')
    mkdirSync(dirname(reportPath), { recursive: true })
    writeFileSync(reportPath, JSON.stringify(report, null, 2))

    console.log(`\n📄 JSON report saved to: ${reportPath}`)
  }
}

export default OAuthTestReporter