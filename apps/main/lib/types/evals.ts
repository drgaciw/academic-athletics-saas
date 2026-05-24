// UI-specific types for eval admin pages and API routes.
// Kept local to avoid coupling main's type-check to @aah/ai-evals implementation drift.

export interface TestCaseMetadata {
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  tags: string[];
  createdAt: Date;
  source: 'production' | 'synthetic' | 'edge-case';
  description?: string;
  reference?: string;
}

export interface TestCase<TInput = unknown, TOutput = unknown> {
  id: string;
  input: TInput;
  expected: TOutput;
  metadata: TestCaseMetadata;
}

export interface Dataset<TInput = unknown, TOutput = unknown> {
  id: string;
  name: string;
  description: string;
  version: string;
  testCases: TestCase<TInput, TOutput>[];
  createdAt: Date;
  updatedAt: Date;
}

export interface EvalRunListItem {
  id: string;
  datasetId: string;
  datasetName: string;
  modelId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
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

export interface EvalCategoryBreakdown {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  passRate: number;
  averageScore: number;
  averageLatencyMs: number;
}

export interface EvalRunDetailsReport {
  id: string;
  metrics: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    passRate: number;
    totalCost: number;
    categoryBreakdown: Record<string, EvalCategoryBreakdown>;
  };
}

export interface EvalRunDetailsResult {
  testCaseId: string;
  input: unknown;
  expected: unknown;
  actual: unknown;
  score: {
    passed: boolean;
    score: number;
  };
  metadata: {
    modelId: string;
    latency: number;
    cost: number;
    timestamp: Date | string;
    error?: string;
  };
}
