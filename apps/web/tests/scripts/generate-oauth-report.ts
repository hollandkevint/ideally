#!/usr/bin/env ts-node

/**
 * Post-test script to generate comprehensive OAuth test reports
 * Run this after Playwright tests complete to get detailed analytics
 */

import { OAuthResultsAggregator } from '../utils/results-aggregator'
import TestMetadataTracker from '../utils/test-metadata'
import * as fs from 'fs'
import * as path from 'path'

async function generateOAuthReport() {
  console.log('🔐 Generating OAuth E2E Test Report...')

  try {
    // Initialize aggregator
    const aggregator = new OAuthResultsAggregator('playwright-report')

    // Generate aggregated results
    const results = await aggregator.aggregateResults()

    // Get metadata from tracker
    const tracker = TestMetadataTracker.getInstance()
    const coverageReport = tracker.generateCoverageReport()
    const allResults = tracker.getAllResults()

    // Generate additional insights
    await generatePerformanceInsights(results, allResults)
    await generateCoverageReport(coverageReport)
    await generateCI_CDSummary(results)

    console.log('✅ OAuth test report generation complete!')
    console.log(`📄 Reports available in: ${path.resolve('playwright-report')}`)

    // Print summary to console
    printSummary(results)

  } catch (error) {
    console.error('❌ Error generating OAuth report:', error)
    process.exit(1)
  }
}

async function generatePerformanceInsights(results: any, testResults: any[]) {
  const insights = {
    latencyAnalysis: {
      averageLatency: results.performance.averageLatency,
      p95Latency: results.performance.p95Latency,
      recommendation: getLatencyRecommendation(results.performance.averageLatency)
    },
    timeoutAnalysis: {
      timeoutTests: results.performance.timeoutTests,
      timeoutRate: (results.performance.timeoutTests.length / results.summary.totalTests) * 100,
      recommendation: getTimeoutRecommendation(results.performance.timeoutTests.length)
    },
    trendAnalysis: results.trends.comparedToPrevious ? {
      improving: results.trends.comparedToPrevious.successRateChange > 0,
      performanceRegression: results.trends.comparedToPrevious.performanceChange > 500, // 500ms regression
      recommendation: getTrendRecommendation(results.trends.comparedToPrevious)
    } : null
  }

  const reportPath = path.join('playwright-report', 'oauth-performance-insights.json')
  fs.writeFileSync(reportPath, JSON.stringify(insights, null, 2))
}

async function generateCoverageReport(coverageData: any) {
  const report = {
    ...coverageData,
    recommendations: getCoverageRecommendations(coverageData),
    nextSteps: getNextSteps(coverageData)
  }

  const reportPath = path.join('playwright-report', 'oauth-coverage-report.json')
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
}

async function generateCI_CDSummary(results: any) {
  // Generate CI/CD friendly summary
  const summary = {
    status: results.summary.successRate >= 95 ? 'PASS' : 'FAIL',
    successRate: results.summary.successRate,
    totalTests: results.summary.totalTests,
    failed: results.summary.failed,
    criticalIssues: results.errors.criticalFailures.length,
    performanceStatus: results.performance.averageLatency <= 5000 ? 'PASS' : 'WARN',
    averageLatency: results.performance.averageLatency,
    coverage: results.coverage.coveragePercentage,
    recommendation: getOverallRecommendation(results),
    timestamp: new Date().toISOString()
  }

  // Write CI/CD summary
  const summaryPath = path.join('playwright-report', 'oauth-ci-summary.json')
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2))

  // Write GitHub Actions summary if in CI
  if (process.env.GITHUB_ACTIONS) {
    await writeGitHubSummary(summary, results)
  }
}

async function writeGitHubSummary(summary: any, results: any) {
  const summaryFile = process.env.GITHUB_STEP_SUMMARY
  if (!summaryFile) return

  const markdown = `## 🔐 OAuth E2E Test Results

### Summary
- **Status**: ${summary.status === 'PASS' ? '✅ PASS' : '❌ FAIL'}
- **Success Rate**: ${summary.successRate.toFixed(1)}%
- **Tests**: ${summary.totalTests} total, ${summary.failed} failed
- **Performance**: ${summary.performanceStatus === 'PASS' ? '✅' : '⚠️'} ${summary.averageLatency.toFixed(0)}ms avg
- **Coverage**: ${summary.coverage.toFixed(1)}%

${summary.criticalIssues > 0 ? `
### 🚨 Critical Issues (${summary.criticalIssues})
${results.errors.criticalFailures.slice(0, 3).map((f: any) => `- ${f.test}: ${f.error.substring(0, 100)}...`).join('\n')}
` : ''}

### 📊 Performance
- Average Latency: ${summary.averageLatency.toFixed(0)}ms
- 95th Percentile: ${results.performance.p95Latency.toFixed(0)}ms

### Recommendation
${summary.recommendation}
`

  fs.appendFileSync(summaryFile, markdown)
}

function getLatencyRecommendation(avgLatency: number): string {
  if (avgLatency <= 2000) return 'Excellent performance! OAuth latency is optimal.'
  if (avgLatency <= 5000) return 'Good performance. Monitor for trends.'
  if (avgLatency <= 10000) return 'Investigate OAuth provider performance or network conditions.'
  return 'Poor performance. Immediate investigation required.'
}

function getTimeoutRecommendation(timeoutCount: number): string {
  if (timeoutCount === 0) return 'No timeout issues detected.'
  if (timeoutCount <= 2) return 'Minimal timeout issues. Monitor network conditions.'
  return 'Multiple timeout issues detected. Check OAuth provider availability and network conditions.'
}

function getTrendRecommendation(trends: any): string {
  if (trends.successRateChange > 0 && trends.performanceChange < 500) {
    return 'Positive trend! Both reliability and performance improving.'
  } else if (trends.successRateChange < -5) {
    return 'Concerning reliability regression. Investigate recent changes.'
  } else if (trends.performanceChange > 1000) {
    return 'Performance regression detected. Check OAuth provider or network conditions.'
  }
  return 'Mixed trends. Continue monitoring.'
}

function getCoverageRecommendations(coverage: any): string[] {
  const recommendations = []

  if (coverage.coveragePercentage < 80) {
    recommendations.push('Increase test coverage to at least 80%')
  }

  if (coverage.categories.security < 3) {
    recommendations.push('Add more security-focused OAuth tests')
  }

  if (coverage.categories.error_handling < 5) {
    recommendations.push('Expand error handling test scenarios')
  }

  if (coverage.categories.performance < 2) {
    recommendations.push('Add performance and latency testing')
  }

  return recommendations
}

function getNextSteps(coverage: any): string[] {
  const steps = []

  if (coverage.categories.authentication < coverage.categories.error_handling) {
    steps.push('Focus on positive authentication flow testing')
  }

  if (coverage.priorities.critical < 5) {
    steps.push('Ensure all critical OAuth scenarios are covered')
  }

  steps.push('Review and update test scenarios quarterly')
  steps.push('Monitor OAuth provider changes and security updates')

  return steps
}

function getOverallRecommendation(results: any): string {
  const successRate = results.summary.successRate
  const avgLatency = results.performance.averageLatency
  const criticalIssues = results.errors.criticalFailures.length

  if (successRate >= 95 && avgLatency <= 5000 && criticalIssues === 0) {
    return '✅ Excellent OAuth implementation! All metrics are within acceptable ranges.'
  } else if (successRate >= 90 && avgLatency <= 8000 && criticalIssues <= 1) {
    return '✅ Good OAuth implementation with minor areas for improvement.'
  } else if (criticalIssues > 0) {
    return '🚨 Critical OAuth issues detected. Immediate attention required before deployment.'
  } else if (successRate < 85) {
    return '⚠️ OAuth reliability issues detected. Investigate failures before deployment.'
  } else if (avgLatency > 10000) {
    return '⚠️ OAuth performance issues detected. Check provider connectivity and response times.'
  }

  return '⚠️ OAuth implementation needs attention. Review test results and address issues.'
}

function printSummary(results: any) {
  console.log('\n🔐 OAuth E2E Test Summary')
  console.log('========================')
  console.log(`✅ Success Rate: ${results.summary.successRate.toFixed(1)}%`)
  console.log(`📊 Total Tests: ${results.summary.totalTests}`)
  console.log(`⚡ Avg Latency: ${results.performance.averageLatency.toFixed(0)}ms`)
  console.log(`🎯 Coverage: ${results.coverage.coveragePercentage.toFixed(1)}%`)

  if (results.errors.criticalFailures.length > 0) {
    console.log(`🚨 Critical Issues: ${results.errors.criticalFailures.length}`)
  }

  if (results.trends.comparedToPrevious) {
    const change = results.trends.comparedToPrevious.successRateChange
    console.log(`📈 Trend: ${change > 0 ? '+' : ''}${change.toFixed(1)}% vs previous`)
  }

  console.log(`\n📄 Full report: playwright-report/oauth-test-report.md`)
}

// Run the report generation
if (require.main === module) {
  generateOAuthReport().catch(console.error)
}

export { generateOAuthReport }