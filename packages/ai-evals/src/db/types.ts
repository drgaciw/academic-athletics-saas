/**
 * Type definitions for AI Evaluation Framework database operations
 */

import type { EvalRun, EvalResult, EvalMetrics, EvalBaseline } from '@prisma/client';

// ============================================================================
// Core Types
// ============================================================================

export type { EvalRun, EvalResult, EvalMetrics, EvalBaseline };

// ============================================================================
// Input Types for Creating Records
// ============================================================================

export interface CreateEvalRunInput {
  datasetId: string;
  datasetVersion: string;
  datasetName?: string;
  modelId: string;
  modelConfig: {
    temperature?: number;
    maxTokens?: number;
    [key: string]: any;
  };
  runnerType: 'COMPLIANCE' | 'ADVISING' | 'CONVERSATIONAL' | 'RISK_PREDICTION' | 'RAG';
  scorerConfig: {
    strategy: 'exact' | 'semantic' | 'llm-judge' | 'custom';
    threshold?: number;
    [key: string]: any;
  };
  startTime: Date;
  metadata?: Record<string, any>;
}

export interface CreateEvalResultInput {
  runId: string;
  testCaseId: string;
  input: any;
  expected: any;
  actual: any;
  passed: boolean;
  score: number;
  confidence?: number;
  explanation?: string;
  latencyMs: number;
  tokenUsage: {
    prompt: number;
    completion: number;
    total: number;
  };
  cost: number;
  metadata?: Record<string, any>;
}

export interface CreateEvalMetricsInput {
  runId: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  accuracy: number;
  passRate: number;
  avgScore: number;
  avgLatencyMs: number;
  totalCost: number;
  totalTokens: number;
  categoryBreakdown?: Record<string, any>;
  failuresByType?: Record<string, number>;
  scoreDistribution?: Record<string, number>;
}

export interface CreateEvalBaselineInput {
  name: string;
  description: string;
  runId: string;
  datasetId: string;
  modelId: string;
  isActive?: boolean;
  tags?: string[];
  metadata?: Record<string, any>;
}

// ============================================================================
// Update Types
// ============================================================================

export interface UpdateEvalRunInput {
  endTime?: Date;
  durationMs?: number;
  status?: 'running' | 'completed' | 'failed' | 'cancelled';
  error?: string;
  metadata?: Record<string, any>;
}

export interface UpdateEvalBaselineInput {
  description?: string;
  isActive?: boolean;
  tags?: string[];
  metadata?: Record<string, any>;
}

// ============================================================================
// Query Types
// ============================================================================

export interface EvalRunFilters {
  datasetId?: string;
  modelId?: string;
  runnerType?: string;
  status?: string;
  startTimeFrom?: Date;
  startTimeTo?: Date;
}

export interface EvalResultFilters {
  runId?: string;
  passed?: boolean;
  scoreMin?: number;
  scoreMax?: number;
}

export interface EvalBaselineFilters {
  datasetId?: string;
  modelId?: string;
  isActive?: boolean;
  tags?: string[];
}

// ============================================================================
// Aggregation Types
// ============================================================================

export interface EvalRunWithMetrics extends EvalRun {
  metrics: EvalMetrics | null;
  results: EvalResult[];
}

export interface TrendData {
  runId: string;
  timestamp: Date;
  accuracy: number;
  avgScore: number;
  avgLatencyMs: number;
  totalCost: number;
}

export interface ComparisonData {
  baseline: EvalRunWithMetrics;
  current: EvalRunWithMetrics;
  differences: {
    accuracyDelta: number;
    scoreDelta: number;
    latencyDelta: number;
    costDelta: number;
  };
  regressions: Regression[];
}

export interface Regression {
  testCaseId: string;
  metric: string;
  baseline: number;
  current: number;
  percentChange: number;
  severity: 'critical' | 'major' | 'minor';
}

// ============================================================================
// Statistics Types
// ============================================================================

export interface DatasetStatistics {
  datasetId: string;
  totalRuns: number;
  avgAccuracy: number;
  avgCost: number;
  lastRunDate: Date | null;
  trendDirection: 'improving' | 'stable' | 'declining';
}

export interface ModelPerformance {
  modelId: string;
  totalRuns: number;
  avgAccuracy: number;
  avgLatencyMs: number;
  avgCost: number;
  bestRun: {
    runId: string;
    accuracy: number;
    timestamp: Date;
  } | null;
}

// ============================================================================
// Data Retention Types
// ============================================================================

export interface RetentionPolicy {
  keepRecentDays: number;
  keepBaselines: boolean;
  keepFailedRuns: boolean;
  keepTopPerformers?: number;
}

export interface CleanupResult {
  runsDeleted: number;
  resultsDeleted: number;
  metricsDeleted: number;
  bytesFreed: number;
}
