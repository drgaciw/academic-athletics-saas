/**
 * AI Evaluation Framework - Metric Aggregation System
 *
 * Task 4.5: Implements metric aggregation across test cases
 * - Calculate accuracy, pass rate, average score, confidence intervals
 * - Category-specific metric breakdowns
 * - Scorer-specific metric breakdowns
 * - Summary statistics for reporting
 */

import type {
  AggregatedMetrics,
  CategoryMetrics,
  ScorerMetrics,
  TestCaseResult,
  ScorerResult,
} from './types';

/**
 * Calculate aggregated metrics across multiple test cases
 *
 * @param results - Array of test case results
 * @returns Aggregated metrics with breakdowns
 */
export function calculateMetrics(
  results: TestCaseResult[]
): AggregatedMetrics {
  if (results.length === 0) {
    return createEmptyMetrics();
  }

  // Extract all scores
  const allScores = results.flatMap((result) =>
    result.scorerResults.map((sr) => sr.result.score)
  );

  // Calculate basic statistics
  const totalCases = results.length;
  const passedCases = results.filter((r) => r.passed).length;
  const failedCases = totalCases - passedCases;
  const passRate = passedCases / totalCases;

  const averageScore = mean(allScores);
  const medianScore = median(allScores);
  const stdDevScore = standardDeviation(allScores);
  const confidenceInterval = calculateConfidenceInterval(allScores, 0.95);

  // Calculate category-specific metrics
  const byCategory = calculateCategoryMetrics(results);

  // Calculate scorer-specific metrics
  const byScorer = calculateScorerMetrics(results);

  // Calculate custom metrics
  const customMetrics = calculateCustomMetrics(results);

  return {
    totalCases,
    passedCases,
    failedCases,
    passRate,
    averageScore,
    medianScore,
    stdDevScore,
    confidenceInterval,
    byCategory,
    byScorer,
    customMetrics,
  };
}

/**
 * Calculate metrics grouped by category
 */
function calculateCategoryMetrics(
  results: TestCaseResult[]
): Record<string, CategoryMetrics> {
  const categoryGroups = groupBy(results, (r) => r.category ?? 'uncategorized');
  const categoryMetrics: Record<string, CategoryMetrics> = {};

  for (const [category, categoryResults] of Object.entries(categoryGroups)) {
    const scores = categoryResults.flatMap((r) =>
      r.scorerResults.map((sr) => sr.result.score)
    );

    const passed = categoryResults.filter((r) => r.passed).length;

    categoryMetrics[category] = {
      count: categoryResults.length,
      passRate: passed / categoryResults.length,
      averageScore: mean(scores),
      medianScore: median(scores),
    };
  }

  return categoryMetrics;
}

/**
 * Calculate metrics grouped by scorer
 */
function calculateScorerMetrics(
  results: TestCaseResult[]
): Record<string, ScorerMetrics> {
  const scorerResults: Record<
    string,
    { score: number; passed: boolean }[]
  > = {};

  // Collect all results per scorer
  for (const result of results) {
    for (const scorerResult of result.scorerResults) {
      const scorerName = scorerResult.scorerName;

      if (!scorerResults[scorerName]) {
        scorerResults[scorerName] = [];
      }

      scorerResults[scorerName].push({
        score: scorerResult.result.score,
        passed: scorerResult.result.passed,
      });
    }
  }

  // Calculate metrics for each scorer
  const scorerMetrics: Record<string, ScorerMetrics> = {};

  for (const [scorerName, results] of Object.entries(scorerResults)) {
    const scores = results.map((r) => r.score);
    const passed = results.filter((r) => r.passed).length;

    scorerMetrics[scorerName] = {
      count: results.length,
      passRate: passed / results.length,
      averageScore: mean(scores),
      medianScore: median(scores),
    };
  }

  return scorerMetrics;
}

/**
 * Calculate custom domain-specific metrics
 */
function calculateCustomMetrics(
  results: TestCaseResult[]
): Record<string, number> {
  const customMetrics: Record<string, number> = {};

  // Extract all breakdown metrics
  const breakdowns = results.flatMap((r) =>
    r.scorerResults.map((sr) => sr.result.breakdown ?? {})
  );

  // Aggregate common breakdown metrics
  const metricKeys = new Set(
    breakdowns.flatMap((b) => Object.keys(b))
  );

  for (const key of metricKeys) {
    const values = breakdowns
      .map((b) => b[key])
      .filter((v): v is number => typeof v === 'number');

    if (values.length > 0) {
      customMetrics[`avg_${key}`] = mean(values);
      customMetrics[`median_${key}`] = median(values);
    }
  }

  // Calculate score distribution percentiles
  const allScores = results.flatMap((r) =>
    r.scorerResults.map((sr) => sr.result.score)
  );

  if (allScores.length > 0) {
    customMetrics.p25 = percentile(allScores, 25);
    customMetrics.p50 = percentile(allScores, 50);
    customMetrics.p75 = percentile(allScores, 75);
    customMetrics.p90 = percentile(allScores, 90);
    customMetrics.p95 = percentile(allScores, 95);
    customMetrics.p99 = percentile(allScores, 99);
  }

  return customMetrics;
}

/**
 * Create empty metrics object
 */
function createEmptyMetrics(): AggregatedMetrics {
  return {
    totalCases: 0,
    passedCases: 0,
    failedCases: 0,
    passRate: 0,
    averageScore: 0,
    medianScore: 0,
    stdDevScore: 0,
    byCategory: {},
    byScorer: {},
    customMetrics: {},
  };
}

// ==================== Statistical Utility Functions ====================

/**
 * Calculate mean of an array
 */
function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/**
 * Calculate median of an array
 */
function median(values: number[]): number {
  if (values.length === 0) return 0;

  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }

  return sorted[mid];
}

/**
 * Calculate standard deviation
 */
function standardDeviation(values: number[]): number {
  if (values.length === 0) return 0;

  const avg = mean(values);
  const squaredDiffs = values.map((v) => Math.pow(v - avg, 2));
  const avgSquaredDiff = mean(squaredDiffs);

  return Math.sqrt(avgSquaredDiff);
}

/**
 * Calculate percentile
 */
function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;

  const sorted = [...values].sort((a, b) => a - b);
  const index = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;

  if (lower === upper) {
    return sorted[lower];
  }

  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

/**
 * Calculate confidence interval using t-distribution
 */
function calculateConfidenceInterval(
  values: number[],
  confidence: number
): [number, number] | undefined {
  if (values.length < 2) {
    return undefined;
  }

  const avg = mean(values);
  const stdDev = standardDeviation(values);
  const n = values.length;

  // Use t-distribution critical value (approximation)
  // For 95% confidence and reasonable sample sizes, use ~1.96
  const tValue = getTValue(confidence, n - 1);
  const marginOfError = tValue * (stdDev / Math.sqrt(n));

  return [avg - marginOfError, avg + marginOfError];
}

/**
 * Get t-value for confidence interval
 * (Simplified approximation for common confidence levels)
 */
function getTValue(confidence: number, degreesOfFreedom: number): number {
  // Simplified approximations for common confidence levels
  if (confidence >= 0.99) return 2.576;
  if (confidence >= 0.95) return 1.96;
  if (confidence >= 0.90) return 1.645;
  return 1.96; // Default to 95%
}

/**
 * Group array elements by a key function
 */
function groupBy<T>(
  array: T[],
  keyFn: (item: T) => string
): Record<string, T[]> {
  const groups: Record<string, T[]> = {};

  for (const item of array) {
    const key = keyFn(item);
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
  }

  return groups;
}

// ==================== Metric Reporting Functions ====================

/**
 * Format metrics for console output
 */
export function formatMetricsReport(metrics: AggregatedMetrics): string {
  const lines: string[] = [];

  lines.push('='.repeat(60));
  lines.push('EVALUATION METRICS REPORT');
  lines.push('='.repeat(60));
  lines.push('');

  // Overall statistics
  lines.push('OVERALL STATISTICS:');
  lines.push(`  Total Test Cases: ${metrics.totalCases}`);
  lines.push(`  Passed: ${metrics.passedCases} (${(metrics.passRate * 100).toFixed(1)}%)`);
  lines.push(`  Failed: ${metrics.failedCases} (${((1 - metrics.passRate) * 100).toFixed(1)}%)`);
  lines.push('');

  lines.push('SCORE STATISTICS:');
  lines.push(`  Average Score: ${metrics.averageScore.toFixed(3)}`);
  lines.push(`  Median Score: ${metrics.medianScore.toFixed(3)}`);
  lines.push(`  Std Deviation: ${metrics.stdDevScore.toFixed(3)}`);

  if (metrics.confidenceInterval) {
    lines.push(
      `  95% Confidence Interval: [${metrics.confidenceInterval[0].toFixed(3)}, ${metrics.confidenceInterval[1].toFixed(3)}]`
    );
  }
  lines.push('');

  // Category breakdown
  if (Object.keys(metrics.byCategory ?? {}).length > 0) {
    lines.push('BY CATEGORY:');
    for (const [category, categoryMetrics] of Object.entries(
      metrics.byCategory ?? {}
    )) {
      lines.push(`  ${category}:`);
      lines.push(`    Count: ${categoryMetrics.count}`);
      lines.push(
        `    Pass Rate: ${(categoryMetrics.passRate * 100).toFixed(1)}%`
      );
      lines.push(`    Avg Score: ${categoryMetrics.averageScore.toFixed(3)}`);
    }
    lines.push('');
  }

  // Scorer breakdown
  if (Object.keys(metrics.byScorer ?? {}).length > 0) {
    lines.push('BY SCORER:');
    for (const [scorer, scorerMetrics] of Object.entries(
      metrics.byScorer ?? {}
    )) {
      lines.push(`  ${scorer}:`);
      lines.push(`    Count: ${scorerMetrics.count}`);
      lines.push(`    Pass Rate: ${(scorerMetrics.passRate * 100).toFixed(1)}%`);
      lines.push(`    Avg Score: ${scorerMetrics.averageScore.toFixed(3)}`);
    }
    lines.push('');
  }

  // Custom metrics
  if (Object.keys(metrics.customMetrics ?? {}).length > 0) {
    lines.push('CUSTOM METRICS:');
    for (const [key, value] of Object.entries(metrics.customMetrics ?? {})) {
      lines.push(`  ${key}: ${value.toFixed(3)}`);
    }
    lines.push('');
  }

  lines.push('='.repeat(60));

  return lines.join('\n');
}

/**
 * Convert metrics to JSON report
 */
export function metricsToJSON(metrics: AggregatedMetrics): string {
  return JSON.stringify(metrics, null, 2);
}

/**
 * Convert metrics to CSV format
 */
export function metricsToCSV(results: TestCaseResult[]): string {
  const headers = [
    'test_id',
    'category',
    'passed',
    'scorer',
    'score',
    'reason',
  ];

  const rows: string[][] = [headers];

  for (const result of results) {
    for (const scorerResult of result.scorerResults) {
      rows.push([
        result.id,
        result.category ?? 'uncategorized',
        result.passed.toString(),
        scorerResult.scorerName,
        scorerResult.result.score.toString(),
        scorerResult.result.reason ?? '',
      ]);
    }
  }

  return rows.map((row) => row.map(escapeCSV).join(',')).join('\n');
}

/**
 * Escape CSV value
 */
function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
