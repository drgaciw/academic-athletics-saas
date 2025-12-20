// Re-export types from @aah/ai-evals for use in the UI
// Note: The @aah/ai-evals package has inconsistent type definitions
// Some types don't match what the API actually returns, so we define local types for UI use

import type {
  EvalReport,
  EvalMetrics,
  RunResult,
  Baseline,
  Dataset,
  TestCase,
} from '@aah/ai-evals';

// Re-export available types
export type {
  EvalReport,
  EvalMetrics,
  RunResult,
  Baseline,
  Dataset,
  TestCase,
};

// Define missing types for UI compatibility
export type Metrics = EvalMetrics;
export type JobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
export type Regression = any;
export type BaselineComparison = any;

// UI-specific types
export interface EvalRunListItem {
  id: string;
  datasetId: string;
  datasetName: string;
  modelId: string;
  status: JobStatus;
  accuracy: number;
  passRate: number;
  totalTests: number;
  totalCost: number;
  avgLatency: number;
  createdAt: string;
  hasRegressions: boolean;
  regressionCount: number;
}

export interface TrendDataPoint {
  date: string;
  accuracy: number;
  passRate: number;
  avgLatency: number;
  cost: number;
}

export interface DatasetListItem {
  id: string;
  name: string;
  description: string;
  version: string;
  testCaseCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface BaselineListItem {
  id: string;
  name: string;
  description: string;
  runId: string;
  datasetId: string;
  datasetName: string;
  accuracy: number;
  passRate: number;
  isActive: boolean;
  createdAt: string;
}
