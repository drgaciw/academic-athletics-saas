// Re-export types from @aah/ai-evals for use in the UI
import type {
  EvalReport,
  EvalMetrics,
  RunResult,
  RegressionResult,
  Baseline,
  Dataset,
  TestCase,
  EvalJob,
} from '@aah/ai-evals';

export type {
  EvalReport,
  EvalMetrics as Metrics,
  RunResult,
  RegressionResult as Regression,
  Baseline,
  Dataset,
  TestCase,
  EvalJob,
};

// UI-specific types
export interface EvalRunListItem {
  id: string;
  datasetId: string;
  datasetName: string;
  modelId: string;
  status: EvalJob['status'];
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
