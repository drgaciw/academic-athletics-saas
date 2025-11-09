/**
 * Metrics Aggregation
 * 
 * Aggregate and calculate metrics across multiple test case results
 * Includes accuracy, pass rate, confidence intervals, and category breakdowns
 */

import type { Score, RunResult, EvalMetrics } from './types'

/**
 * Calculate aggregated metrics from run results
 */
export function calculateMetrics(results: RunResult[]): EvalMetrics {
  if (results.length === 0) {
    return {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      passRate: 0,
      averageScore: 0,
      medianScore: 0,
      minScore: 0,
      maxScore: 0,
      standardDeviation: 0,
      confidenceInterval: { lower: 0, upper: 0 },
      categoryBreakdown: {},
      totalLatencyMs: 0,
      averageLatencyMs: 0,
      totalTokens: { input: 0, output: 0, total: 0 },
      totalCost: 0,
    }
  }

  // Basic counts
  const totalTests = results.length
  const passedTests = results.filter(r => r.score.passed).length
  const failedTests = totalTests - passedTests
  const passRate = passedTests / totalTests

  // Score statistics
  const scores = results.map(r => r.score.value)
  const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length
  const medianScore = calculateMedian(scores)
  const minScore = Math.min(...scores)
  const maxScore = Math.max(...scores)
  const standardDeviation = calculateStandardDeviation(scores, averageScore)
  const confidenceInterval = calculateConfidenceInterval(scores, averageScore, standardDeviation)

  // Category breakdown
  const categoryBreakdown = calculateCategoryBreakdown(results)

  // Performance metrics
  const totalLatencyMs = results.reduce((sum, r) => sum + r.score.latencyMs, 0)
  const averageLatencyMs = totalLatencyMs / totalTests

  // Token and cost metrics
  const totalTokens = results.reduce(
    (sum, r) => ({
      input: sum.input + (r.score.tokens?.input ?? 0),
      output: sum.output + (r.score.tokens?.output ?? 0),
      total: sum.total + (r.score.tokens?.total ?? 0),
    }),
    { input: 0, output: 0, total: 0 }
  )

  const totalCost = results.reduce((sum, r) => sum + (r.score.cost ?? 0), 0)

  return {
    totalTests,
    passedTests,
    failedTests,
    passRate,
    averageScore,
    medianScore,
    minScore,
    maxScore,
    standardDeviation,
    confidenceInterval,
    categoryBreakdown,
    totalLatencyMs,
    averageLatencyMs,
    totalTokens,
    totalCost,
  }
}

/**
 * Calculate median of an array of numbers
 */
function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0

  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)

  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2
  }

  return sorted[mid]
}

/**
 * Calculate standard deviation
 */
function calculateStandardDeviation(values: number[], mean: number): number {
  if (values.length === 0) return 0

  const squaredDiffs = values.map(value => Math.pow(value - mean, 2))
  const variance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length

  return Math.sqrt(variance)
}

/**
 * Calculate 95% confidence interval
 */
function calculateConfidenceInterval(
  values: number[],
  mean: number,
  stdDev: number
): { lower: number; upper: number } {
  if (values.length === 0) {
    return { lower: 0, upper: 0 }
  }

  // Use t-distribution for small samples, z-distribution for large samples
  const n = values.length
  const criticalValue = n < 30 ? getTCriticalValue(n) : 1.96 // 95% confidence

  const marginOfError = criticalValue * (stdDev / Math.sqrt(n))

  return {
    lower: Math.max(0, mean - marginOfError),
    upper: Math.min(1, mean + marginOfError),
  }
}

/**
 * Get t-distribution critical value for 95% confidence
 * Approximation for small samples
 */
function getTCriticalValue(n: number): number {
  // Simplified t-table for 95% confidence (two-tailed)
  const tTable: Record<number, number> = {
    2: 12.706,
    3: 4.303,
    4: 3.182,
    5: 2.776,
    6: 2.571,
    7: 2.447,
    8: 2.365,
    9: 2.306,
    10: 2.262,
    15: 2.131,
    20: 2.086,
    25: 2.060,
    30: 2.042,
  }

  // Find closest sample size in table
  const sizes = Object.keys(tTable).map(Number).sort((a, b) => a - b)
  const closest = sizes.reduce((prev, curr) =>
    Math.abs(curr - n) < Math.abs(prev - n) ? curr : prev
  )

  return tTable[closest] ?? 1.96
}

/**
 * Calculate category-specific breakdown
 */
function calculateCategoryBreakdown(
  results: RunResult[]
): Record<string, {
  totalTests: number
  passedTests: number
  failedTests: number
  passRate: number
  averageScore: number
  averageLatencyMs: number
}> {
  const categories = new Map<string, RunResult[]>()

  // Group results by category
  for (const result of results) {
    const category = result.testCase.category ?? 'uncategorized'
    if (!categories.has(category)) {
      categories.set(category, [])
    }
    categories.get(category)!.push(result)
  }

  // Calculate metrics for each category
  const breakdown: Record<string, any> = {}

  for (const [category, categoryResults] of categories) {
    const totalTests = categoryResults.length
    const passedTests = categoryResults.filter(r => r.score.passed).length
    const failedTests = totalTests - passedTests
    const passRate = passedTests / totalTests

    const scores = categoryResults.map(r => r.score.value)
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length

    const totalLatency = categoryResults.reduce((sum, r) => sum + r.score.latencyMs, 0)
    const averageLatencyMs = totalLatency / totalTests

    breakdown[category] = {
      totalTests,
      passedTests,
      failedTests,
      passRate,
      averageScore,
      averageLatencyMs,
    }
  }

  return breakdown
}

/**
 * Calculate percentile score
 */
export function calculatePercentile(values: number[], percentile: number): number {
  if (values.length === 0) return 0
  if (percentile < 0 || percentile > 100) {
    throw new Error('Percentile must be between 0 and 100')
  }

  const sorted = [...values].sort((a, b) => a - b)
  const index = (percentile / 100) * (sorted.length - 1)
  const lower = Math.floor(index)
  const upper = Math.ceil(index)
  const weight = index - lower

  if (lower === upper) {
    return sorted[lower]
  }

  return sorted[lower] * (1 - weight) + sorted[upper] * weight
}

/**
 * Calculate score distribution
 */
export function calculateScoreDistribution(
  scores: number[],
  bins: number = 10
): Array<{ range: string; count: number; percentage: number }> {
  if (scores.length === 0) return []

  const binSize = 1 / bins
  const distribution: Array<{ range: string; count: number; percentage: number }> = []

  for (let i = 0; i < bins; i++) {
    const lower = i * binSize
    const upper = (i + 1) * binSize
    const count = scores.filter(score => score >= lower && score < upper).length
    const percentage = (count / scores.length) * 100

    distribution.push({
      range: `${(lower * 100).toFixed(0)}-${(upper * 100).toFixed(0)}%`,
      count,
      percentage,
    })
  }

  return distribution
}

/**
 * Compare metrics between two runs
 */
export function compareMetrics(
  current: EvalMetrics,
  baseline: EvalMetrics
): {
  passRateDelta: number
  averageScoreDelta: number
  latencyDelta: number
  costDelta: number
  regressions: Array<{
    metric: string
    current: number
    baseline: number
    delta: number
    severity: 'critical' | 'major' | 'minor'
  }>
} {
  const passRateDelta = current.passRate - baseline.passRate
  const averageScoreDelta = current.averageScore - baseline.averageScore
  const latencyDelta = current.averageLatencyMs - baseline.averageLatencyMs
  const costDelta = current.totalCost - baseline.totalCost

  const regressions: Array<{
    metric: string
    current: number
    baseline: number
    delta: number
    severity: 'critical' | 'major' | 'minor'
  }> = []

  // Check for pass rate regression
  if (passRateDelta < -0.05) {
    regressions.push({
      metric: 'passRate',
      current: current.passRate,
      baseline: baseline.passRate,
      delta: passRateDelta,
      severity: passRateDelta < -0.15 ? 'critical' : passRateDelta < -0.10 ? 'major' : 'minor',
    })
  }

  // Check for average score regression
  if (averageScoreDelta < -0.05) {
    regressions.push({
      metric: 'averageScore',
      current: current.averageScore,
      baseline: baseline.averageScore,
      delta: averageScoreDelta,
      severity: averageScoreDelta < -0.15 ? 'critical' : averageScoreDelta < -0.10 ? 'major' : 'minor',
    })
  }

  // Check for latency regression (>20% increase)
  const latencyIncrease = latencyDelta / baseline.averageLatencyMs
  if (latencyIncrease > 0.20) {
    regressions.push({
      metric: 'averageLatencyMs',
      current: current.averageLatencyMs,
      baseline: baseline.averageLatencyMs,
      delta: latencyDelta,
      severity: latencyIncrease > 0.50 ? 'critical' : latencyIncrease > 0.35 ? 'major' : 'minor',
    })
  }

  // Check for cost regression (>30% increase)
  const costIncrease = costDelta / baseline.totalCost
  if (costIncrease > 0.30) {
    regressions.push({
      metric: 'totalCost',
      current: current.totalCost,
      baseline: baseline.totalCost,
      delta: costDelta,
      severity: costIncrease > 0.75 ? 'critical' : costIncrease > 0.50 ? 'major' : 'minor',
    })
  }

  return {
    passRateDelta,
    averageScoreDelta,
    latencyDelta,
    costDelta,
    regressions,
  }
}

/**
 * Format metrics for display
 */
export function formatMetrics(metrics: EvalMetrics): string {
  const lines = [
    '=== Evaluation Metrics ===',
    '',
    `Total Tests: ${metrics.totalTests}`,
    `Passed: ${metrics.passedTests} (${(metrics.passRate * 100).toFixed(1)}%)`,
    `Failed: ${metrics.failedTests}`,
    '',
    '--- Score Statistics ---',
    `Average: ${(metrics.averageScore * 100).toFixed(1)}%`,
    `Median: ${(metrics.medianScore * 100).toFixed(1)}%`,
    `Min: ${(metrics.minScore * 100).toFixed(1)}%`,
    `Max: ${(metrics.maxScore * 100).toFixed(1)}%`,
    `Std Dev: ${(metrics.standardDeviation * 100).toFixed(1)}%`,
    `95% CI: [${(metrics.confidenceInterval.lower * 100).toFixed(1)}%, ${(metrics.confidenceInterval.upper * 100).toFixed(1)}%]`,
    '',
    '--- Performance ---',
    `Total Latency: ${metrics.totalLatencyMs.toFixed(0)}ms`,
    `Average Latency: ${metrics.averageLatencyMs.toFixed(0)}ms`,
    `Total Tokens: ${metrics.totalTokens.total.toLocaleString()}`,
    `Total Cost: $${metrics.totalCost.toFixed(4)}`,
  ]

  // Add category breakdown if available
  if (Object.keys(metrics.categoryBreakdown).length > 0) {
    lines.push('', '--- Category Breakdown ---')
    for (const [category, breakdown] of Object.entries(metrics.categoryBreakdown)) {
      lines.push(
        `${category}: ${breakdown.passedTests}/${breakdown.totalTests} passed (${(breakdown.passRate * 100).toFixed(1)}%), avg score: ${(breakdown.averageScore * 100).toFixed(1)}%`
      )
    }
  }

  return lines.join('\n')
}

/**
 * Export metrics to CSV format
 */
export function exportMetricsToCSV(results: RunResult[]): string {
  const headers = [
    'Test Case ID',
    'Category',
    'Score',
    'Passed',
    'Latency (ms)',
    'Input Tokens',
    'Output Tokens',
    'Total Tokens',
    'Cost',
    'Explanation',
  ]

  const rows = results.map(result => [
    result.testCase.id,
    result.testCase.category ?? 'uncategorized',
    result.score.value.toFixed(4),
    result.score.passed ? 'true' : 'false',
    result.score.latencyMs.toFixed(0),
    result.score.tokens?.input ?? 0,
    result.score.tokens?.output ?? 0,
    result.score.tokens?.total ?? 0,
    result.score.cost?.toFixed(6) ?? '0',
    `"${(result.score.explanation ?? '').replace(/"/g, '""')}"`,
  ])

  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
}

/**
 * Export metrics to JSON format
 */
export function exportMetricsToJSON(metrics: EvalMetrics, results: RunResult[]): string {
  return JSON.stringify(
    {
      metrics,
      results: results.map(r => ({
        testCaseId: r.testCase.id,
        category: r.testCase.category,
        score: r.score.value,
        passed: r.score.passed,
        latencyMs: r.score.latencyMs,
        tokens: r.score.tokens,
        cost: r.score.cost,
        explanation: r.score.explanation,
      })),
    },
    null,
    2
  )
}
