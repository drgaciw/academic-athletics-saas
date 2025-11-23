/**
 * Test Data Factories
 *
 * Provides factory functions for creating test data with sensible defaults.
 * Reduces boilerplate and ensures consistency across tests.
 *
 * @module __tests__/factories
 */

import { z } from 'zod';
import type {
  TestCase,
  TestCaseMetadata,
  Dataset,
  DatasetSchema,
  RunResult,
  RunSummary,
  Score,
  TokenUsage,
  RunnerConfig,
  ScorerConfig,
} from '../../types';

/**
 * Generate a unique ID for testing
 */
function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Create test case metadata
 */
export function createTestCaseMetadata(
  overrides?: Partial<TestCaseMetadata>
): TestCaseMetadata {
  return {
    source: 'synthetic',
    description: 'Test case for unit testing',
    createdAt: new Date().toISOString(),
    difficulty: 'easy',
    category: 'test',
    tags: ['test'],
    ...overrides,
  };
}

/**
 * Create a test case with default values
 *
 * @example
 * ```typescript
 * const testCase = createTestCase({
 *   input: { question: 'What is 2+2?' },
 *   expected: { answer: '4' },
 * });
 * ```
 */
export function createTestCase<TInput = any, TOutput = any>(
  overrides?: Partial<TestCase<TInput, TOutput>>
): TestCase<TInput, TOutput> {
  return {
    id: generateId('test'),
    name: 'Test Case',
    category: 'test',
    input: {} as TInput,
    expected: {} as TOutput,
    metadata: createTestCaseMetadata(overrides?.metadata),
    ...overrides,
  };
}

/**
 * Create a dataset with default values
 *
 * @example
 * ```typescript
 * const dataset = createDataset({
 *   name: 'Compliance Tests',
 *   testCases: [testCase1, testCase2],
 * });
 * ```
 */
export function createDataset<TInput = any, TOutput = any>(
  overrides?: Partial<Dataset<TInput, TOutput>>
): Dataset<TInput, TOutput> {
  return {
    id: generateId('dataset'),
    name: 'Test Dataset',
    description: 'Test dataset for unit tests',
    version: '1.0.0',
    testCases: [],
    schema: {
      input: z.any(),
      output: z.any(),
    } as DatasetSchema<TInput, TOutput>,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Create token usage data
 */
export function createTokenUsage(
  overrides?: Partial<TokenUsage>
): TokenUsage {
  return {
    prompt: 100,
    completion: 50,
    total: 150,
    ...overrides,
  };
}

/**
 * Create a run result with default values
 *
 * @example
 * ```typescript
 * const result = createRunResult({
 *   testCaseId: 'test-001',
 *   actual: { answer: '4' },
 * });
 * ```
 */
export function createRunResult<TOutput = any>(
  overrides?: Partial<RunResult<TOutput>>
): RunResult<TOutput> {
  return {
    testCaseId: 'test-001',
    input: {},
    expected: {} as TOutput,
    actual: {} as TOutput,
    metadata: {
      modelId: 'gpt-4o-mini',
      latency: 500,
      tokenUsage: createTokenUsage(),
      cost: 0.0001,
      timestamp: new Date(),
    },
    ...overrides,
  };
}

/**
 * Create a score with default values
 */
export function createScore(overrides?: Partial<Score>): Score {
  return {
    testCaseId: 'test-001',
    value: 1.0,
    passed: true,
    actual: {},
    expected: {},
    latencyMs: 500,
    tokens: createTokenUsage(),
    cost: 0.0001,
    explanation: 'Test passed',
    ...overrides,
  };
}

/**
 * Create runner configuration
 */
export function createRunnerConfig(
  overrides?: Partial<RunnerConfig>
): RunnerConfig {
  return {
    modelId: 'gpt-4o-mini',
    temperature: 0,
    maxTokens: 1000,
    timeout: 30000,
    retries: 3,
    ...overrides,
  };
}

/**
 * Create scorer configuration
 */
export function createScorerConfig(
  overrides?: Partial<ScorerConfig>
): ScorerConfig {
  return {
    type: 'exact-match',
    threshold: 0.8,
    ...overrides,
  };
}

/**
 * Create a run summary with default values
 */
export function createRunSummary(
  overrides?: Partial<RunSummary>
): RunSummary {
  return {
    datasetId: 'dataset-001',
    runId: generateId('run'),
    config: createRunnerConfig(),
    results: [],
    startTime: new Date(),
    endTime: new Date(),
    totalDuration: 1000,
    totalCost: 0.001,
    totalTokens: 1000,
    ...overrides,
  };
}

/**
 * Batch create test cases
 *
 * @param count - Number of test cases to create
 * @param template - Template for test case creation
 *
 * @example
 * ```typescript
 * const testCases = createTestCases(5, {
 *   category: 'compliance',
 *   metadata: { difficulty: 'medium' },
 * });
 * ```
 */
export function createTestCases<TInput = any, TOutput = any>(
  count: number,
  template?: Partial<TestCase<TInput, TOutput>>
): TestCase<TInput, TOutput>[] {
  return Array.from({ length: count }, (_, i) =>
    createTestCase({
      ...template,
      id: `${template?.id || 'test'}-${String(i + 1).padStart(3, '0')}`,
      name: `${template?.name || 'Test Case'} ${i + 1}`,
    })
  );
}

/**
 * Create a dataset with generated test cases
 *
 * @param testCaseCount - Number of test cases to include
 * @param overrides - Dataset overrides
 *
 * @example
 * ```typescript
 * const dataset = createDatasetWithTestCases(10, {
 *   name: 'Large Test Dataset',
 * });
 * ```
 */
export function createDatasetWithTestCases<TInput = any, TOutput = any>(
  testCaseCount: number,
  overrides?: Partial<Dataset<TInput, TOutput>>
): Dataset<TInput, TOutput> {
  return createDataset({
    ...overrides,
    testCases: createTestCases(testCaseCount),
  });
}

/**
 * All factory functions in a convenient object
 */
export const factories = {
  testCase: createTestCase,
  testCaseMetadata: createTestCaseMetadata,
  dataset: createDataset,
  datasetWithTestCases: createDatasetWithTestCases,
  testCases: createTestCases,
  runResult: createRunResult,
  score: createScore,
  tokenUsage: createTokenUsage,
  runnerConfig: createRunnerConfig,
  scorerConfig: createScorerConfig,
  runSummary: createRunSummary,
  generateId,
};

export default factories;
