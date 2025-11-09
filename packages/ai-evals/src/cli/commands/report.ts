import { Command } from 'commander';
import { ReportCommandOptions } from '../../config/types';
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
} from '../utils';

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

    // TODO: Load from database
    await new Promise((resolve) => setTimeout(resolve, 1000));

    spin.succeed('Run data loaded');

    // Mock run data
    const runData = {
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

    // Generate report based on format
    if (options.format === 'markdown') {
      generateMarkdownReport(runData, options);
    } else if (options.format === 'json') {
      generateJSONReport(runData, options);
    } else {
      // Display console report
      displayConsoleReport(runData, options);
    }

    success('Report generated successfully');

    if (options.output) {
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
function displayConsoleReport(runData: any, options: ReportCommandOptions) {
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
    info('Baseline comparison not yet implemented');
  }

  divider();
}

/**
 * Generate markdown report
 */
function generateMarkdownReport(runData: any, options: ReportCommandOptions) {
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

## Recommendations

${runData.summary.accuracy >= 0.9 ? '✓' : '⚠'} Overall accuracy: ${formatPercent(runData.summary.accuracy)}
${runData.summary.failed === 0 ? '✓' : '⚠'} Failed tests: ${runData.summary.failed}
${runData.summary.avgLatency < 2000 ? '✓' : '⚠'} Average latency: ${formatDuration(runData.summary.avgLatency)}

---
*Generated by AI Evals Framework*
`;

  console.log(markdown);
}

/**
 * Generate JSON report
 */
function generateJSONReport(runData: any, options: ReportCommandOptions) {
  console.log(JSON.stringify(runData, null, 2));
}
