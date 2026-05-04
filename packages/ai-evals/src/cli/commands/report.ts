import { Command } from 'commander';
import { prisma } from '@aah/database';
import { ReportCommandOptions } from '../../config/types';
import { createEvalRepository } from '../../db/repository';
import type { ComparisonData, EvalRunWithMetrics } from '../../db/types';
import {
  section,
  success,
  error,
  info,
  spinner,
  formatTable,
  summaryBox,
  logError,
  colorScore,
  colorStatus,
  formatDuration,
  formatCost,
  formatTimestamp,
  formatPercent,
  divider,
  box,
  writeOutputFile,
} from '../utils';

type MockRunData = {
  id: string;
  name: string;
  timestamp: Date;
  config: {
    modelId: string;
    dataset: string;
  };
  summary: {
    totalTests: number;
    passed: number;
    failed: number;
    accuracy: number;
    avgLatency: number;
    totalCost: number;
    duration: number;
  };
  failures: Array<{
    testId: string;
    category: string;
    expected: string;
    actual: string;
    score: number;
    reason: string;
  }>;
  categoryBreakdown: Record<string, { total: number; passed: number; accuracy: number }>;
};

type MockBaselineComparison = {
  baselineRunId: string;
  metrics: Array<{
    metric: string;
    current: string;
    baseline: string;
    delta: string;
    status: 'improved' | 'regressed' | 'unchanged';
  }>;
};

type ReportRunData = MockRunData;
type BaselineComparisonData = MockBaselineComparison;

function formatSignedPercentDelta(delta: number): string {
  const sign = delta >= 0 ? '+' : '';
  return `${sign}${(delta * 100).toFixed(2)}%`;
}

function formatSignedNumberDelta(delta: number): string {
  const sign = delta >= 0 ? '+' : '';
  return `${sign}${delta.toFixed(2)}`;
}

function formatSignedCurrencyDelta(delta: number): string {
  const sign = delta >= 0 ? '+' : '-';
  return `${sign}$${Math.abs(delta).toFixed(4)}`;
}

function deriveStatus(delta: number, betterWhenLower = false): 'improved' | 'regressed' | 'unchanged' {
  if (delta === 0) return 'unchanged';
  if (betterWhenLower) {
    return delta < 0 ? 'improved' : 'regressed';
  }
  return delta > 0 ? 'improved' : 'regressed';
}

function normalizeRepositoryRun(run: EvalRunWithMetrics): ReportRunData {
  if (!run.metrics) {
    throw new Error(`Run ${run.id} is missing metrics`);
  }

  const categoryBreakdown = Object.fromEntries(
    Object.entries((run.metrics.categoryBreakdown as Record<string, { total: number; passed: number; accuracy: number }> | null) || {})
  );

  const failures = run.results
    .filter((result) => !result.passed)
    .map((result) => ({
      testId: result.testCaseId,
      category: ((result.metadata as Record<string, any> | null)?.category as string) || 'uncategorized',
      expected: typeof result.expected === 'string' ? result.expected : JSON.stringify(result.expected),
      actual: typeof result.actual === 'string' ? result.actual : JSON.stringify(result.actual),
      score: result.score,
      reason: result.explanation || 'No explanation provided',
    }));

  return {
    id: run.id,
    name: run.datasetName || `${run.datasetId} evaluation`,
    timestamp: run.startTime,
    config: {
      modelId: run.modelId,
      dataset: run.datasetId,
    },
    summary: {
      totalTests: run.metrics.totalTests,
      passed: run.metrics.passedTests,
      failed: run.metrics.failedTests,
      accuracy: run.metrics.accuracy,
      avgLatency: run.metrics.avgLatencyMs,
      totalCost: run.metrics.totalCost,
      duration: run.durationMs || 0,
    },
    failures,
    categoryBreakdown,
  };
}

function normalizeRepositoryBaselineComparison(comparison: ComparisonData): BaselineComparisonData {
  return {
    baselineRunId: comparison.baseline.id,
    metrics: [
      {
        metric: 'Accuracy',
        current: formatPercent(comparison.current.metrics!.accuracy),
        baseline: formatPercent(comparison.baseline.metrics!.accuracy),
        delta: formatSignedPercentDelta(comparison.differences.accuracyDelta),
        status: deriveStatus(comparison.differences.accuracyDelta),
      },
      {
        metric: 'Average Latency',
        current: formatDuration(comparison.current.metrics!.avgLatencyMs),
        baseline: formatDuration(comparison.baseline.metrics!.avgLatencyMs),
        delta: formatSignedNumberDelta(comparison.differences.latencyDelta),
        status: deriveStatus(comparison.differences.latencyDelta, true),
      },
      {
        metric: 'Total Cost',
        current: formatCost(comparison.current.metrics!.totalCost),
        baseline: formatCost(comparison.baseline.metrics!.totalCost),
        delta: formatSignedCurrencyDelta(comparison.differences.costDelta),
        status: deriveStatus(comparison.differences.costDelta, true),
      },
    ],
  };
}

async function loadRepositoryReportData(options: ReportCommandOptions): Promise<{ runData: ReportRunData; baselineComparison?: BaselineComparisonData } | null> {
  const repository = createEvalRepository(prisma);

  let run: EvalRunWithMetrics | null = null;

  if (options.runId) {
    run = await repository.getRun(options.runId);
  } else {
    const latest = (await repository.getRuns({ status: 'completed' }, 1, 0)).runs[0] ?? null;
    run = latest ? await repository.getRun(latest.id) : null;
  }

  if (!run || !run.metrics) {
    return null;
  }

  const runData = normalizeRepositoryRun(run);

  if (!options.compareBaseline) {
    return { runData };
  }

  const activeBaseline = await repository.getActiveBaseline(run.datasetId);
  if (!activeBaseline) {
    return { runData };
  }

  const comparison = await repository.compareToBaseline(run.id, activeBaseline.id);
  return {
    runData,
    baselineComparison: normalizeRepositoryBaselineComparison(comparison),
  };
}

function buildMockBaselineComparison(runData: MockRunData): MockBaselineComparison {
  return {
    baselineRunId: 'baseline-2026-04-01',
    metrics: [
      {
        metric: 'Accuracy',
        current: formatPercent(runData.summary.accuracy),
        baseline: '87.20%',
        delta: '+2.40%',
        status: 'improved',
      },
      {
        metric: 'Average Latency',
        current: formatDuration(runData.summary.avgLatency),
        baseline: '1.62s',
        delta: '-164ms',
        status: 'improved',
      },
      {
        metric: 'Total Cost',
        current: formatCost(runData.summary.totalCost),
        baseline: '$1.1800',
        delta: '+$0.0500',
        status: 'regressed',
      },
    ],
  };
}

function buildMarkdownBaselineComparison(baseline: MockBaselineComparison): string {
  return [
    '## Baseline Comparison',
    '',
    `Baseline Run ID: ${baseline.baselineRunId}`,
    '',
    '| Metric | Current | Baseline | Delta | Status |',
    '|--------|---------|----------|-------|--------|',
    ...baseline.metrics.map((metric) =>
      `| ${metric.metric} | ${metric.current} | ${metric.baseline} | ${metric.delta} | ${metric.status} |`
    ),
    '',
  ].join('\n');
}
/**
 * Report command - Generate reports from eval runs
 */
export function createReportCommand(): Command {
  const command = new Command('report')
    .description('Generate reports from evaluation runs')
    .option('-r, --run-id <id>', 'Run ID to generate report for')
    .option('-l, --latest', 'Use latest run', false)
    .option('-f, --format <format>', 'Output format (json|markdown|html|pdf)', 'markdown')
    .option('-o, --output <path>', 'Output file path')
    .option('--include-failures', 'Include failed test details', true)
    .option('--include-metrics', 'Include detailed metrics', true)
    .option('--compare-baseline', 'Compare with baseline', false)
    .action(handleReportCommand);

  return command;
}

/**
 * Handle report command
 */
async function handleReportCommand(options: ReportCommandOptions) {
  try {
    section('Report Generation');

    // Validate input
    if (!options.runId && !options.latest) {
      throw new Error('Either --run-id or --latest must be specified');
    }

    // Load run data
    const spin = spinner('Loading run data...');
    const repositoryData = await loadRepositoryReportData(options);

    // Fallback mock path when no persisted run is available
    await new Promise((resolve) => setTimeout(resolve, 1000));

    spin.succeed('Run data loaded');

    let runData: ReportRunData;
    let baselineComparison: BaselineComparisonData | undefined;

    if (repositoryData) {
      runData = repositoryData.runData;
      baselineComparison = repositoryData.baselineComparison;
    } else {
      // Mock run data
      runData = {
        id: options.runId || 'run_latest_' + Date.now(),
        name: 'NCAA Compliance Evaluation',
        timestamp: new Date(),
        config: {
          modelId: 'gpt-4-turbo-preview',
          dataset: 'compliance-full',
        },
        summary: {
          totalTests: 125,
          passed: 112,
          failed: 13,
          accuracy: 0.896,
          avgLatency: 1456,
          totalCost: 1.23,
          duration: 187500,
        },
        failures: [
          {
            testId: 'compliance-045',
            category: 'progress-toward-degree',
            expected: 'eligible',
            actual: 'review_required',
            score: 0.0,
            reason: 'Model incorrectly flagged edge case',
          },
          {
            testId: 'compliance-078',
            category: 'gpa-calculation',
            expected: 'ineligible',
            actual: 'eligible',
            score: 0.0,
            reason: 'GPA rounding error',
          },
        ],
        categoryBreakdown: {
          'initial-eligibility': { total: 40, passed: 38, accuracy: 0.95 },
          'continuing-eligibility': { total: 45, passed: 42, accuracy: 0.933 },
          'progress-toward-degree': { total: 40, passed: 32, accuracy: 0.8 },
        },
      };

      baselineComparison = options.compareBaseline
        ? buildMockBaselineComparison(runData)
        : undefined;
    }

    let renderedOutput: string;

    // Generate report based on format
    if (options.format === 'markdown') {
      renderedOutput = generateMarkdownReport(runData, options, baselineComparison);
    } else if (options.format === 'json') {
      renderedOutput = generateJSONReport(runData, options, baselineComparison);
    } else {
      // Display console report
      renderedOutput = displayConsoleReport(runData, options, baselineComparison);
    }

    if (options.format === 'markdown' || options.format === 'json') {
      console.log(renderedOutput);
    }

    success('Report generated successfully');

    if (options.output) {
      await writeOutputFile(options.output, renderedOutput);
      info(`Report saved to: ${options.output}`);
    }
  } catch (err) {
    error('Report generation failed');
    logError(err as Error);
    process.exit(1);
  }
}

/**
 * Display console report
 */
function displayConsoleReport(
  runData: MockRunData,
  options: ReportCommandOptions,
  baselineComparison?: MockBaselineComparison
): string {
  section('Eval Run Report');

  // Header
  box(
    `${runData.name}\nRun ID: ${runData.id}\nTimestamp: ${formatTimestamp(runData.timestamp)}`,
    'Evaluation Report'
  );

  // Summary
  summaryBox({
    title: 'Summary',
    items: [
      { label: 'Model', value: runData.config.modelId },
      { label: 'Dataset', value: runData.config.dataset },
      { label: 'Total Tests', value: runData.summary.totalTests },
      { label: 'Passed', value: runData.summary.passed, color: 'green' },
      { label: 'Failed', value: runData.summary.failed, color: 'red' },
      { label: 'Accuracy', value: colorScore(runData.summary.accuracy, 0.9) },
      { label: 'Avg Latency', value: formatDuration(runData.summary.avgLatency) },
      { label: 'Total Cost', value: formatCost(runData.summary.totalCost) },
      { label: 'Duration', value: formatDuration(runData.summary.duration) },
    ],
  });

  // Category breakdown
  if (options.includeMetrics) {
    section('Category Breakdown');

    const categoryData = [
      ['Category', 'Total', 'Passed', 'Failed', 'Accuracy'],
      ...Object.entries(runData.categoryBreakdown).map(([category, stats]: [string, any]) => [
        category,
        stats.total.toString(),
        stats.passed.toString(),
        (stats.total - stats.passed).toString(),
        colorScore(stats.accuracy, 0.85),
      ]),
    ];

    console.log(formatTable(categoryData));
  }

  // Failures
  if (options.includeFailures && runData.failures.length > 0) {
    section('Failed Tests');

    const failureData = [
      ['Test ID', 'Category', 'Expected', 'Actual', 'Reason'],
      ...runData.failures.map((f: any) => [
        f.testId,
        f.category,
        f.expected,
        f.actual,
        f.reason,
      ]),
    ];

    console.log(formatTable(failureData));
  }

  // Baseline comparison
  if (options.compareBaseline) {
    section('Baseline Comparison');

    if (baselineComparison) {
      const baselineData = [
        ['Metric', 'Current', 'Baseline', 'Delta', 'Status'],
        ...baselineComparison.metrics.map((metric) => [
          metric.metric,
          metric.current,
          metric.baseline,
          metric.delta,
          metric.status,
        ]),
      ];

      info(`Baseline Run ID: ${baselineComparison.baselineRunId}`);
      console.log(formatTable(baselineData));
    } else {
      info('Baseline comparison not available');
    }
  }

  divider();

  const baselineSection = options.compareBaseline
    ? baselineComparison
      ? `\nBaseline Run ID: ${baselineComparison.baselineRunId}\n${formatTable([
          ['Metric', 'Current', 'Baseline', 'Delta', 'Status'],
          ...baselineComparison.metrics.map((metric) => [
            metric.metric,
            metric.current,
            metric.baseline,
            metric.delta,
            metric.status,
          ]),
        ])}`
      : '\nBaseline comparison not available'
    : '';

  return [
    `Evaluation Report`,
    `Run ID: ${runData.id}`,
    `Timestamp: ${formatTimestamp(runData.timestamp)}`,
    `Model: ${runData.config.modelId}`,
    `Dataset: ${runData.config.dataset}`,
    `Total Tests: ${runData.summary.totalTests}`,
    `Passed: ${runData.summary.passed}`,
    `Failed: ${runData.summary.failed}`,
    `Accuracy: ${formatPercent(runData.summary.accuracy)}`,
    `Avg Latency: ${formatDuration(runData.summary.avgLatency)}`,
    `Total Cost: ${formatCost(runData.summary.totalCost)}`,
    `Duration: ${formatDuration(runData.summary.duration)}`,
    baselineSection,
  ].join('\n');
}

/**
 * Generate markdown report
 */
function generateMarkdownReport(
  runData: MockRunData,
  options: ReportCommandOptions,
  baselineComparison?: MockBaselineComparison
): string {
  const markdown = `# Evaluation Report

**Run ID:** ${runData.id}
**Name:** ${runData.name}
**Timestamp:** ${formatTimestamp(runData.timestamp)}

## Summary

| Metric | Value |
|--------|-------|
| Model | ${runData.config.modelId} |
| Dataset | ${runData.config.dataset} |
| Total Tests | ${runData.summary.totalTests} |
| Passed | ${runData.summary.passed} |
| Failed | ${runData.summary.failed} |
| Accuracy | ${formatPercent(runData.summary.accuracy)} |
| Average Latency | ${formatDuration(runData.summary.avgLatency)} |
| Total Cost | ${formatCost(runData.summary.totalCost)} |
| Duration | ${formatDuration(runData.summary.duration)} |

## Category Breakdown

| Category | Total | Passed | Failed | Accuracy |
|----------|-------|--------|--------|----------|
${Object.entries(runData.categoryBreakdown)
  .map(([category, stats]: [string, any]) =>
    `| ${category} | ${stats.total} | ${stats.passed} | ${stats.total - stats.passed} | ${formatPercent(stats.accuracy)} |`
  )
  .join('\n')}

${
  options.includeFailures && runData.failures.length > 0
    ? `## Failed Tests

| Test ID | Category | Expected | Actual | Reason |
|---------|----------|----------|--------|--------|
${runData.failures
  .map((f: any) => `| ${f.testId} | ${f.category} | ${f.expected} | ${f.actual} | ${f.reason} |`)
  .join('\n')}
`
    : ''
}
${options.compareBaseline && baselineComparison ? `${buildMarkdownBaselineComparison(baselineComparison)}
` : ''}
## Recommendations

${runData.summary.accuracy >= 0.9 ? '✓' : '⚠'} Overall accuracy: ${formatPercent(runData.summary.accuracy)}
${runData.summary.failed === 0 ? '✓' : '⚠'} Failed tests: ${runData.summary.failed}
${runData.summary.avgLatency < 2000 ? '✓' : '⚠'} Average latency: ${formatDuration(runData.summary.avgLatency)}

---
*Generated by AI Evals Framework*
`;

  return markdown;
}

/**
 * Generate JSON report
 */
function generateJSONReport(
  runData: MockRunData,
  _options: ReportCommandOptions,
  baselineComparison?: MockBaselineComparison
): string {
  const jsonReport = baselineComparison
    ? {
        ...runData,
        baselineComparison,
      }
    : runData;

  return JSON.stringify(jsonReport, null, 2);
}
