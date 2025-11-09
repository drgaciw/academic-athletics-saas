import {
  RunnerConfig,
  TestCase,
  RunResult,
  ComparisonResult,
  ComparisonReport,
  Score,
  ScorerConfig,
} from '../types';
import { BaseRunner } from './base-runner';

/**
 * Model comparison utilities for running side-by-side evaluations
 * and generating comparative reports
 */

/**
 * Compare results from multiple models on the same test case
 */
export function compareTestCaseResults(
  testCaseId: string,
  modelResults: Map<string, RunResult>,
  scores?: Map<string, Score>
): ComparisonResult {
  const models: ComparisonResult['models'] = {};
  const metrics: ComparisonResult['metrics'] = {};

  let winnerModelId: string | undefined;
  let highestScore = -1;

  // Build the comparison data for each model
  for (const [modelId, result] of modelResults.entries()) {
    const score = scores?.get(modelId);

    models[modelId] = {
      result,
      score,
    };

    metrics[modelId] = {
      latency: result.metadata.latency,
      cost: result.metadata.cost,
      score: score?.score ?? 0,
    };

    // Track the winner (model with highest score)
    if (score && score.score > highestScore) {
      highestScore = score.score;
      winnerModelId = modelId;
    }
  }

  return {
    testCaseId,
    models,
    winner: winnerModelId,
    metrics,
  };
}

/**
 * Calculate summary statistics across all comparisons
 */
export function calculateComparisonSummary(
  results: ComparisonResult[],
  modelIds: string[]
): ComparisonReport['summary'] {
  const summary: ComparisonReport['summary'] = {};

  for (const modelId of modelIds) {
    let totalLatency = 0;
    let totalCost = 0;
    let totalScore = 0;
    let wins = 0;
    let count = 0;

    for (const result of results) {
      const metrics = result.metrics[modelId];
      if (metrics) {
        totalLatency += metrics.latency;
        totalCost += metrics.cost;
        totalScore += metrics.score;
        count++;

        if (result.winner === modelId) {
          wins++;
        }
      }
    }

    summary[modelId] = {
      avgLatency: count > 0 ? totalLatency / count : 0,
      totalCost,
      avgScore: count > 0 ? totalScore / count : 0,
      winRate: count > 0 ? (wins / count) * 100 : 0,
    };
  }

  return summary;
}

/**
 * Run comparison across multiple model configurations
 */
export async function runModelComparison<TInput = any, TOutput = any>(
  runner: BaseRunner<TInput, TOutput>,
  testCases: TestCase<TInput, TOutput>[],
  configs: RunnerConfig[],
  options?: {
    parallel?: boolean;
    concurrency?: number;
    scorerConfig?: ScorerConfig;
    onProgress?: (completed: number, total: number) => void;
  }
): Promise<ComparisonReport> {
  const startTime = new Date();
  const comparisonId = `comparison_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const datasetId = `dataset_${Date.now()}`;

  // Run each model configuration
  const modelResults = new Map<string, RunResult<TOutput>[]>();

  for (const config of configs) {
    console.log(`Running model: ${config.modelId}...`);
    const results = await runner.runDataset(testCases, config, {
      parallel: options?.parallel,
      concurrency: options?.concurrency,
      onProgress: (completed, total) => {
        const modelIndex = configs.indexOf(config);
        const totalProgress =
          modelIndex * testCases.length + completed;
        const totalTests = configs.length * testCases.length;
        options?.onProgress?.(totalProgress, totalTests);
      },
    });
    modelResults.set(config.modelId, results);
  }

  // Compare results for each test case
  const comparisonResults: ComparisonResult[] = [];

  for (let i = 0; i < testCases.length; i++) {
    const testCaseId = testCases[i].id;
    const testCaseResults = new Map<string, RunResult<TOutput>>();
    const testCaseScores = new Map<string, Score>();

    for (const config of configs) {
      const results = modelResults.get(config.modelId);
      if (results && results[i]) {
        testCaseResults.set(config.modelId, results[i]);

        // If scorer is provided, score the result
        if (options?.scorerConfig) {
          const score = await scoreResult(
            results[i],
            testCases[i].expected,
            options.scorerConfig
          );
          testCaseScores.set(config.modelId, score);
        }
      }
    }

    const comparison = compareTestCaseResults(
      testCaseId,
      testCaseResults,
      testCaseScores
    );
    comparisonResults.push(comparison);
  }

  const endTime = new Date();
  const summary = calculateComparisonSummary(
    comparisonResults,
    configs.map((c) => c.modelId)
  );

  return {
    datasetId,
    comparisonId,
    configs,
    results: comparisonResults,
    summary,
    startTime,
    endTime,
    totalDuration: endTime.getTime() - startTime.getTime(),
  };
}

/**
 * Simple scoring function (can be replaced with actual scorer implementation)
 */
async function scoreResult<TOutput>(
  result: RunResult<TOutput>,
  expected: TOutput,
  config: ScorerConfig
): Promise<Score> {
  // If there was an error, fail the test
  if (result.metadata.error) {
    return {
      passed: false,
      score: 0,
      explanation: `Test failed with error: ${result.metadata.error}`,
    };
  }

  // Simple exact match scoring (will be replaced by actual scorers)
  if (config.strategy === 'exact') {
    const matches = JSON.stringify(result.actual) === JSON.stringify(expected);
    return {
      passed: matches,
      score: matches ? 1.0 : 0.0,
      explanation: matches ? 'Exact match' : 'Output does not match expected',
    };
  }

  // Custom scorer
  if (config.customScorer) {
    return config.customScorer(expected, result.actual);
  }

  // Default: return a placeholder score
  return {
    passed: true,
    score: 0.5,
    explanation: 'No scorer configured',
  };
}

/**
 * Format comparison report as a readable table
 */
export function formatComparisonReport(report: ComparisonReport): string {
  const lines: string[] = [];

  lines.push('='.repeat(80));
  lines.push('MODEL COMPARISON REPORT');
  lines.push('='.repeat(80));
  lines.push('');

  // Summary table
  lines.push('Summary by Model:');
  lines.push('-'.repeat(80));
  lines.push(
    'Model'.padEnd(30) +
      'Avg Score'.padEnd(12) +
      'Win Rate'.padEnd(12) +
      'Avg Latency'.padEnd(14) +
      'Total Cost'
  );
  lines.push('-'.repeat(80));

  const sortedModels = Object.entries(report.summary).sort(
    ([, a], [, b]) => b.avgScore - a.avgScore
  );

  for (const [modelId, metrics] of sortedModels) {
    lines.push(
      modelId.padEnd(30) +
        metrics.avgScore.toFixed(3).padEnd(12) +
        `${metrics.winRate.toFixed(1)}%`.padEnd(12) +
        `${metrics.avgLatency.toFixed(0)}ms`.padEnd(14) +
        `$${metrics.totalCost.toFixed(4)}`
    );
  }

  lines.push('');
  lines.push(`Total Duration: ${(report.totalDuration / 1000).toFixed(2)}s`);
  lines.push(`Test Cases: ${report.results.length}`);
  lines.push(`Models Compared: ${report.configs.length}`);
  lines.push('');

  // Detailed results
  lines.push('Detailed Results:');
  lines.push('-'.repeat(80));

  for (const result of report.results) {
    lines.push(`\nTest Case: ${result.testCaseId}`);
    if (result.winner) {
      lines.push(`Winner: ${result.winner}`);
    }

    for (const modelId of Object.keys(result.metrics)) {
      const metrics = result.metrics[modelId];
      const score = result.models[modelId].score;

      lines.push(
        `  ${modelId}: score=${metrics.score.toFixed(3)}, ` +
          `latency=${metrics.latency}ms, cost=$${metrics.cost.toFixed(4)}`
      );

      if (score?.explanation) {
        lines.push(`    Explanation: ${score.explanation}`);
      }
    }
  }

  lines.push('');
  lines.push('='.repeat(80));

  return lines.join('\n');
}

/**
 * Run parallel comparison (all models run concurrently for each test case)
 */
export async function runParallelComparison<TInput = any, TOutput = any>(
  runner: BaseRunner<TInput, TOutput>,
  testCases: TestCase<TInput, TOutput>[],
  configs: RunnerConfig[],
  options?: {
    scorerConfig?: ScorerConfig;
    onProgress?: (completed: number, total: number) => void;
  }
): Promise<ComparisonReport> {
  const startTime = new Date();
  const comparisonId = `comparison_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const datasetId = `dataset_${Date.now()}`;

  const comparisonResults: ComparisonResult[] = [];
  let completed = 0;
  const totalTests = testCases.length;

  // For each test case, run all models in parallel
  for (const testCase of testCases) {
    const testCaseResults = new Map<string, RunResult<TOutput>>();
    const testCaseScores = new Map<string, Score>();

    // Run all models in parallel for this test case
    const results = await Promise.all(
      configs.map((config) => runner.runTestCase(testCase, config))
    );

    // Store results and scores
    for (let i = 0; i < configs.length; i++) {
      const config = configs[i];
      const result = results[i];

      testCaseResults.set(config.modelId, result);

      // Score if scorer is provided
      if (options?.scorerConfig) {
        const score = await scoreResult(
          result,
          testCase.expected,
          options.scorerConfig
        );
        testCaseScores.set(config.modelId, score);
      }
    }

    const comparison = compareTestCaseResults(
      testCase.id,
      testCaseResults,
      testCaseScores
    );
    comparisonResults.push(comparison);

    completed++;
    options?.onProgress?.(completed, totalTests);
  }

  const endTime = new Date();
  const summary = calculateComparisonSummary(
    comparisonResults,
    configs.map((c) => c.modelId)
  );

  return {
    datasetId,
    comparisonId,
    configs,
    results: comparisonResults,
    summary,
    startTime,
    endTime,
    totalDuration: endTime.getTime() - startTime.getTime(),
  };
}
