/**
 * AI Evaluation Framework - Core Types
 *
 * Type definitions for test cases, datasets, scores, and evaluation results
 */

import type { AgentType } from '@aah/ai'

// Re-export RunnerConfig from base-runner for backward compatibility
export type { RunnerConfig } from './base-runner'

/**
 * Test case for AI evaluation
 */
export interface TestCase {
  /** Unique identifier */
  id: string
  
  /** Test case name */
  name: string
  
  /** Input to the AI system */
  input: string
  
  /** Expected output */
  expected: any
  
  /** Test category (e.g., 'compliance', 'advising', 'conversation') */
  category: string
  
  /** Difficulty level (1-5) */
  difficulty?: number
  
  /** Tags for filtering */
  tags?: string[]
  
  /** Additional context */
  context?: Record<string, any>
  
  /** Metadata */
  metadata?: {
    source?: string
    createdAt?: string
    updatedAt?: string
    author?: string
  }
}

/**
 * Dataset containing multiple test cases
 */
export interface Dataset {
  /** Dataset identifier */
  id: string
  
  /** Dataset name */
  name: string
  
  /** Description */
  description: string
  
  /** Version */
  version: string
  
  /** Test cases */
  testCases: TestCase[]
  
  /** Dataset metadata */
  metadata?: {
    createdAt?: string
    updatedAt?: string
    author?: string
    tags?: string[]
  }
}

/**
 * Model configuration for evaluation
 */
export interface ModelConfig {
  /** Provider (openai, anthropic) */
  provider: 'openai' | 'anthropic'
  
  /** Model name */
  model: string
  
  /** Temperature */
  temperature?: number
  
  /** Max tokens */
  maxTokens?: number
  
  /** Top P */
  topP?: number
  
  /** Additional parameters */
  params?: Record<string, any>
}

/**
 * Scorer configuration
 */
export interface ScorerConfig {
  /** Scorer type */
  type: 'exact-match' | 'partial-match' | 'contains' | 'regex' | 'numeric-range' | 'semantic-similarity' | 'llm-judge' | 'precision-recall-f1' | 'recall-at-k' | 'mrr' | 'ndcg' | 'custom'
  
  /** Threshold for pass/fail */
  threshold?: number
  
  /** Additional parameters */
  params?: Record<string, any>
}

/**
 * Score result for a single test case
 */
export interface Score {
  /** Test case ID */
  testCaseId: string
  
  /** Score value (0-1) */
  value: number
  
  /** Pass/fail status */
  passed: boolean
  
  /** Actual output from AI */
  actual: any
  
  /** Expected output */
  expected: any
  
  /** Explanation */
  explanation?: string
  
  /** Latency in milliseconds */
  latencyMs: number
  
  /** Token usage */
  tokens?: {
    input: number
    output: number
    total: number
  }
  
  /** Cost in USD */
  cost?: number
  
  /** Error if any */
  error?: {
    code: string
    message: string
  }
}

/**
 * Run result for a single test case
 */
export interface RunResult {
  /** Test case */
  testCase: TestCase

  /** Test case ID (convenience accessor) */
  testCaseId?: string

  /** Score */
  score: Score

  /** Model configuration used */
  modelConfig: ModelConfig

  /** Scorer configuration used */
  scorerConfig: ScorerConfig

  /** Timestamp */
  timestamp: string

  /** Metadata for cost tracking and analytics */
  metadata?: {
    timestamp: Date
    tokens?: TokenUsage
    latency?: number
    cost?: number
    error?: string
  }
}

/**
 * Evaluation report
 */
export interface EvalReport {
  /** Report ID */
  id: string

  /** Job ID (alias for id for compatibility) */
  jobId: string

  /** Dataset used */
  dataset: Dataset
  
  /** Model configuration */
  modelConfig: ModelConfig
  
  /** Scorer configuration */
  scorerConfig: ScorerConfig
  
  /** Run results */
  results: RunResult[]
  
  /** Summary metrics */
  metrics: EvalMetrics
  
  /** Baseline comparison */
  baseline?: {
    /** Baseline report ID */
    reportId: string
    
    /** Metrics comparison */
    comparison: {
      passRateDelta: number
      averageScoreDelta: number
      averageLatencyDelta: number
    }
    
    /** Regressions detected */
    regressions: Array<{
      testCaseId: string
      testCaseName: string
      baselineScore: number
      currentScore: number
      delta: number
    }>
  }
  
  /** Timestamp */
  timestamp: string
  
  /** Duration in ms */
  duration: number

  /** Summary for monitoring compatibility */
  summary: {
    totalTests: number
    passed: number
    failed: number
    accuracy: number
    avgLatency: number
    totalCost: number
    duration: number
    status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  }

  /** When the report was generated */
  generatedAt: Date

  /** Regressions detected during evaluation */
  regressions?: Regression[]

  /** Run summaries for analytics */
  runSummaries: RunSummary[]
}

/**
 * Evaluation metrics
 */
export interface EvalMetrics {
  /** Total test cases */
  totalTests: number
  
  /** Passed test cases */
  passedTests: number
  
  /** Failed test cases */
  failedTests: number
  
  /** Pass rate (0-1) */
  passRate: number
  
  /** Average score (0-1) */
  averageScore: number
  
  /** Median score (0-1) */
  medianScore: number
  
  /** Minimum score (0-1) */
  minScore: number
  
  /** Maximum score (0-1) */
  maxScore: number
  
  /** Standard deviation */
  standardDeviation: number
  
  /** 95% confidence interval */
  confidenceInterval: {
    lower: number
    upper: number
  }
  
  /** Category-specific breakdown */
  categoryBreakdown: Record<string, {
    totalTests: number
    passedTests: number
    failedTests: number
    passRate: number
    averageScore: number
    averageLatencyMs: number
  }>
  
  /** Total latency in ms */
  totalLatencyMs: number
  
  /** Average latency in ms */
  averageLatencyMs: number
  
  /** Total tokens used */
  totalTokens: {
    input: number
    output: number
    total: number
  }
  
  /** Total cost in USD */
  totalCost: number

  /** Accuracy alias for compatibility (same as averageScore) */
  accuracy?: number

  /** Average latency alias for compatibility (same as averageLatencyMs) */
  avgLatency?: number
}

/**
 * Evaluation job configuration
 */
export interface EvalJobConfig {
  /** Job name */
  name: string
  
  /** Dataset to evaluate */
  datasetId: string
  
  /** Model configuration */
  modelConfig: ModelConfig
  
  /** Scorer configuration */
  scorerConfig: ScorerConfig
  
  /** Baseline report ID for comparison */
  baselineReportId?: string
  
  /** Concurrency limit */
  concurrency?: number
  
  /** Timeout per test case (ms) */
  timeout?: number
  
  /** Agent type (if evaluating agents) */
  agentType?: AgentType
}

/**
 * Evaluation job status
 */
export interface EvalJob {
  /** Job ID */
  id: string
  
  /** Job configuration */
  config: EvalJobConfig
  
  /** Status */
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  
  /** Progress (0-1) */
  progress: number
  
  /** Current test case index */
  currentTestCase?: number
  
  /** Total test cases */
  totalTestCases: number
  
  /** Report ID (when completed) */
  reportId?: string
  
  /** Error (if failed) */
  error?: {
    code: string
    message: string
  }
  
  /** Started at */
  startedAt?: string
  
  /** Completed at */
  completedAt?: string
  
  /** Created at */
  createdAt: string
}

/**
 * Baseline configuration
 */
export interface Baseline {
  /** Baseline ID */
  id: string
  
  /** Name */
  name: string
  
  /** Description */
  description?: string
  
  /** Report ID */
  reportId: string
  
  /** Dataset ID */
  datasetId: string
  
  /** Model configuration */
  modelConfig: ModelConfig
  
  /** Active status */
  active: boolean
  
  /** Created at */
  createdAt: string
}

/**
 * Regression detection result
 */
export interface RegressionResult {
  /** Test case ID */
  testCaseId: string
  
  /** Test case name */
  testCaseName: string
  
  /** Baseline score */
  baselineScore: number
  
  /** Current score */
  currentScore: number
  
  /** Score delta */
  scoreDelta: number
  
  /** Severity */
  severity: 'critical' | 'major' | 'minor'
  
  /** Explanation */
  explanation?: string
}

/**
 * Export format
 */
export type ExportFormat = 'json' | 'csv' | 'html' | 'markdown'

/**
 * Run summary for analytics
 */
export interface RunSummary {
  runId: string
  datasetId: string
  modelId: string
  status: JobStatus
  metrics: EvalMetrics
  startTime: Date
  endTime: Date
  config: {
    modelId: string
    temperature?: number
    maxTokens?: number
    timeout?: number
    retries?: number
    concurrency?: number
  }
  results?: RunResult[]
}

/**
 * Token usage tracking
 */
export interface TokenUsage {
  input: number
  output: number
  total: number
}

// RunnerConfig is exported from base-runner.ts
// Re-using that definition for compatibility

/**
 * Export options
 */
export interface ExportOptions {
  /** Format */
  format: ExportFormat
  
  /** Output path */
  outputPath: string
  
  /** Include raw results */
  includeRawResults?: boolean
  
  /** Include baseline comparison */
  includeBaseline?: boolean
}

// Additional types needed by monitoring module

/**
 * Job status
 */
export type JobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'

/**
 * Metrics type alias for compatibility
 */
export type Metrics = EvalMetrics

/**
 * Regression severity levels
 */
export type RegressionSeverity = 'critical' | 'major' | 'minor'

/**
 * Regression detection for monitoring module
 * Note: This interface is used by the monitoring/alerts module
 */
export interface Regression {
  /** Test case ID */
  testCaseId: string
  /** Metric name */
  metric: string
  /** Baseline value */
  baseline: number
  /** Current value */
  current: number
  /** Percent change */
  percentChange: number
  /** Absolute change */
  absoluteChange?: number
  /** Severity */
  severity: RegressionSeverity
  /** Category */
  category?: string
}

/**
 * Evaluation error
 */
export interface EvalError {
  /** Error type */
  type: 'execution' | 'scoring' | 'system'
  /** Error severity */
  severity: 'fatal' | 'error' | 'warning'
  /** Error message */
  message: string
  /** Test case ID if applicable */
  testCaseId?: string
  /** Stack trace */
  stack?: string
  /** Whether error is retryable */
  retryable: boolean
}
