/**
 * Model Comparison
 * 
 * Compare multiple model configurations on the same test cases
 * Provides side-by-side metrics and performance analysis
 */

import type {
  TestCase,
  ModelConfig,
  ScorerConfig,
  RunResult,
  EvalMetrics,
} from './types'
import { BaseRunner } from './base-runner'
import { calculateMetrics } from './metrics'

/**
 * Model comparison configuration
 */
export interface ComparisonConfig {
  /** Models to compare */
  models: ModelConfig[]
  
  /** Scorer configuration */
  scorerConfig: ScorerConfig
  
  /** Run test cases in parallel */
  parallel?: boolean
  
  /** Maximum concurrent executions */
  concurrency?: number
  
  /** Timeout per test case in milliseconds */
  timeout?: number
}

/**
 * Comparison result for a single model
 */
export interface ModelComparisonResult {
  /** Model configuration */
  modelConfig: ModelConfig
  
  /** Run results */
  results: RunResult[]
  
  /** Aggregated metrics */
  metrics: EvalMetrics
  
  /** Execution time in milliseconds */
  executionTimeMs: number
}

/**
 * Complete comparison report
 */
export interface ComparisonReport {
  /** Test cases used */
  testCases: TestCase[]
  
  /** Scorer configuration */
  scorerConfig: ScorerConfig
  
  /** Results for each model */
  modelResults: ModelComparisonResult[]
  
  /** Winner (best performing model) */
  winner: {
    modelConfig: ModelConfig
    reason: string
  }
  
  /** Timestamp */
  timestamp: string
  
  /** Total execution time */
  totalExecutionTimeMs: number
}

/**
 * Run comparison across multiple models
 */
export async function runComparison(
  runner: BaseRunner,
  testCases: TestCase[],
  config: ComparisonConfig
): Promise<ComparisonReport> {
  const startTime = Date.now()
  const modelResults: ModelComparisonResult[] = []

  // Run evaluation for each model
  for (const modelConfig of config.models) {
    const modelStartTime = Date.now()
    const results: RunResult[] = []

    if (config.parallel) {
      // Parallel execution with concurrency control
      results.push(...await runTestCasesParallel(
        runner,
        testCases,
        modelConfig,
        config.scorerConfig,
        config.concurrency ?? 5
      ))
    } else {
      // Sequential execution
      for (const testCase of testCases) {
        const result = await runner.runTestCase(
          testCase,
          modelConfig,
          config.scorerConfig
        )
        results.push(result)
      }
    }

    const metrics = calculateMetrics(results)
    const executionTimeMs = Date.now() - modelStartTime

    modelResults.push({
      modelConfig,
      results,
      metrics,
      executionTimeMs,
    })
  }

  // Determine winner
  const winner = determineWinner(modelResults)

  const totalExecutionTimeMs = Date.now() - startTime

  return {
    testCases,
    scorerConfig: config.scorerConfig,
    modelResults,
    winner,
    timestamp: new Date().toISOString(),
    totalExecutionTimeMs,
  }
}

/**
 * Run test cases in parallel with concurrency control
 */
async function runTestCasesParallel(
  runner: BaseRunner,
  testCases: TestCase[],
  modelConfig: ModelConfig,
  scorerConfig: ScorerConfig,
  concurrency: number
): Promise<RunResult[]> {
  const results: RunResult[] = []
  const queue = [...testCases]

  // Create worker pool
  const workers: Promise<void>[] = []

  for (let i = 0; i < Math.min(concurrency, testCases.length); i++) {
    workers.push(
      (async () => {
        while (queue.length > 0) {
          const testCase = queue.shift()
          if (!testCase) break

          try {
            const result = await runner.runTestCase(
              testCase,
              modelConfig,
              scorerConfig
            )
            results.push(result)
          } catch (error) {
            // Log error but continue with other test cases
            console.error(`Error running test case ${testCase.id}:`, error)
          }
        }
      })()
    )
  }

  // Wait for all workers to complete
  await Promise.all(workers)

  return results
}

/**
 * Determine the winner based on multiple criteria
 */
function determineWinner(
  modelResults: ModelComparisonResult[]
): { modelConfig: ModelConfig; reason: string } {
  if (modelResults.length === 0) {
    throw new Error('No model results to compare')
  }

  if (modelResults.length === 1) {
    return {
      modelConfig: modelResults[0].modelConfig,
      reason: 'Only model tested',
    }
  }

  // Scoring criteria (weighted)
  const weights = {
    passRate: 0.4,
    averageScore: 0.3,
    latency: 0.15,
    cost: 0.15,
  }

  // Normalize and score each model
  const scores = modelResults.map(result => {
    const metrics = result.metrics

    // Normalize latency (lower is better)
    const maxLatency = Math.max(...modelResults.map(r => r.metrics.averageLatencyMs))
    const normalizedLatency = maxLatency > 0 ? 1 - (metrics.averageLatencyMs / maxLatency) : 1

    // Normalize cost (lower is better)
    const maxCost = Math.max(...modelResults.map(r => r.metrics.totalCost))
    const normalizedCost = maxCost > 0 ? 1 - (metrics.totalCost / maxCost) : 1

    // Calculate weighted score
    const totalScore =
      metrics.passRate * weights.passRate +
      metrics.averageScore * weights.averageScore +
      normalizedLatency * weights.latency +
      normalizedCost * weights.cost

    return {
      modelConfig: result.modelConfig,
      totalScore,
      breakdown: {
        passRate: metrics.passRate,
        averageScore: metrics.averageScore,
        latency: metrics.averageLatencyMs,
        cost: metrics.totalCost,
      },
    }
  })

  // Find winner
  const winner = scores.reduce((best, current) =>
    current.totalScore > best.totalScore ? current : best
  )

  // Generate reason
  const reason = generateWinnerReason(winner, scores)

  return {
    modelConfig: winner.modelConfig,
    reason,
  }
}

/**
 * Generate human-readable reason for winner selection
 */
function generateWinnerReason(
  winner: any,
  allScores: any[]
): string {
  const reasons: string[] = []

  // Check if winner has best pass rate
  const bestPassRate = Math.max(...allScores.map(s => s.breakdown.passRate))
  if (winner.breakdown.passRate === bestPassRate) {
    reasons.push(`highest pass rate (${(winner.breakdown.passRate * 100).toFixed(1)}%)`)
  }

  // Check if winner has best average score
  const bestAvgScore = Math.max(...allScores.map(s => s.breakdown.averageScore))
  if (winner.breakdown.averageScore === bestAvgScore) {
    reasons.push(`highest average score (${(winner.breakdown.averageScore * 100).toFixed(1)}%)`)
  }

  // Check if winner has best latency
  const bestLatency = Math.min(...allScores.map(s => s.breakdown.latency))
  if (winner.breakdown.latency === bestLatency) {
    reasons.push(`fastest latency (${winner.breakdown.latency.toFixed(0)}ms)`)
  }

  // Check if winner has best cost
  const bestCost = Math.min(...allScores.map(s => s.breakdown.cost))
  if (winner.breakdown.cost === bestCost) {
    reasons.push(`lowest cost ($${winner.breakdown.cost.toFixed(4)})`)
  }

  if (reasons.length === 0) {
    return 'Best overall weighted score'
  }

  return `Best overall: ${reasons.join(', ')}`
}

/**
 * Format comparison report for display
 */
export function formatComparisonReport(report: ComparisonReport): string {
  const lines = [
    '=== Model Comparison Report ===',
    '',
    `Test Cases: ${report.testCases.length}`,
    `Models Compared: ${report.modelResults.length}`,
    `Total Execution Time: ${(report.totalExecutionTimeMs / 1000).toFixed(1)}s`,
    '',
    '--- Results by Model ---',
  ]

  // Sort by pass rate (descending)
  const sortedResults = [...report.modelResults].sort(
    (a, b) => b.metrics.passRate - a.metrics.passRate
  )

  for (const result of sortedResults) {
    const model = result.modelConfig
    const metrics = result.metrics
    const isWinner = model.model === report.winner.modelConfig.model

    lines.push(
      '',
      `${isWinner ? '🏆 ' : ''}${model.provider}/${model.model}${isWinner ? ' (WINNER)' : ''}`,
      `  Pass Rate: ${(metrics.passRate * 100).toFixed(1)}% (${metrics.passedTests}/${metrics.totalTests})`,
      `  Avg Score: ${(metrics.averageScore * 100).toFixed(1)}%`,
      `  Avg Latency: ${metrics.averageLatencyMs.toFixed(0)}ms`,
      `  Total Cost: $${metrics.totalCost.toFixed(4)}`,
      `  Execution Time: ${(result.executionTimeMs / 1000).toFixed(1)}s`
    )
  }

  lines.push(
    '',
    '--- Winner ---',
    `${report.winner.modelConfig.provider}/${report.winner.modelConfig.model}`,
    `Reason: ${report.winner.reason}`
  )

  return lines.join('\n')
}

/**
 * Export comparison report to CSV
 */
export function exportComparisonToCSV(report: ComparisonReport): string {
  const headers = [
    'Model',
    'Provider',
    'Pass Rate',
    'Avg Score',
    'Avg Latency (ms)',
    'Total Cost',
    'Total Tests',
    'Passed Tests',
    'Failed Tests',
    'Execution Time (s)',
  ]

  const rows = report.modelResults.map(result => [
    result.modelConfig.model,
    result.modelConfig.provider,
    (result.metrics.passRate * 100).toFixed(1) + '%',
    (result.metrics.averageScore * 100).toFixed(1) + '%',
    result.metrics.averageLatencyMs.toFixed(0),
    result.metrics.totalCost.toFixed(4),
    result.metrics.totalTests,
    result.metrics.passedTests,
    result.metrics.failedTests,
    (result.executionTimeMs / 1000).toFixed(1),
  ])

  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
}

/**
 * Export comparison report to JSON
 */
export function exportComparisonToJSON(report: ComparisonReport): string {
  return JSON.stringify(
    {
      testCases: report.testCases.map(tc => tc.id),
      scorerConfig: report.scorerConfig,
      models: report.modelResults.map(result => ({
        model: `${result.modelConfig.provider}/${result.modelConfig.model}`,
        metrics: {
          passRate: result.metrics.passRate,
          averageScore: result.metrics.averageScore,
          averageLatencyMs: result.metrics.averageLatencyMs,
          totalCost: result.metrics.totalCost,
          totalTests: result.metrics.totalTests,
          passedTests: result.metrics.passedTests,
          failedTests: result.metrics.failedTests,
        },
        executionTimeMs: result.executionTimeMs,
      })),
      winner: {
        model: `${report.winner.modelConfig.provider}/${report.winner.modelConfig.model}`,
        reason: report.winner.reason,
      },
      timestamp: report.timestamp,
      totalExecutionTimeMs: report.totalExecutionTimeMs,
    },
    null,
    2
  )
}

/**
 * Generate side-by-side comparison table
 */
export function generateComparisonTable(report: ComparisonReport): string {
  const models = report.modelResults.map(r => r.modelConfig)
  const metrics = report.modelResults.map(r => r.metrics)

  // Calculate column widths
  const modelNames = models.map(m => `${m.provider}/${m.model}`)
  const maxModelNameLength = Math.max(...modelNames.map(n => n.length), 15)

  const lines = [
    '=== Side-by-Side Comparison ===',
    '',
  ]

  // Header row
  const header = ['Metric'.padEnd(20), ...modelNames.map(n => n.padEnd(maxModelNameLength))]
  lines.push(header.join(' | '))
  lines.push('-'.repeat(header.join(' | ').length))

  // Metric rows
  const metricRows = [
    {
      name: 'Pass Rate',
      values: metrics.map(m => `${(m.passRate * 100).toFixed(1)}%`),
    },
    {
      name: 'Average Score',
      values: metrics.map(m => `${(m.averageScore * 100).toFixed(1)}%`),
    },
    {
      name: 'Median Score',
      values: metrics.map(m => `${(m.medianScore * 100).toFixed(1)}%`),
    },
    {
      name: 'Avg Latency',
      values: metrics.map(m => `${m.averageLatencyMs.toFixed(0)}ms`),
    },
    {
      name: 'Total Cost',
      values: metrics.map(m => `$${m.totalCost.toFixed(4)}`),
    },
    {
      name: 'Total Tokens',
      values: metrics.map(m => m.totalTokens.total.toLocaleString()),
    },
    {
      name: 'Passed/Total',
      values: metrics.map(m => `${m.passedTests}/${m.totalTests}`),
    },
  ]

  for (const row of metricRows) {
    const cells = [
      row.name.padEnd(20),
      ...row.values.map(v => v.padEnd(maxModelNameLength)),
    ]
    lines.push(cells.join(' | '))
  }

  lines.push(
    '',
    `Winner: ${report.winner.modelConfig.provider}/${report.winner.modelConfig.model}`,
    `Reason: ${report.winner.reason}`
  )

  return lines.join('\n')
}
