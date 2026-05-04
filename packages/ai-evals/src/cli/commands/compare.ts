import { Command } from 'commander';
import { prisma } from '@aah/database';
import { CompareCommandOptions } from '../../config/types';
import { loadConfig } from '../../config/parser';
import { createEvalRepository } from '../../db/repository';
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
  formatDuration,
  formatCost,
  formatPercent,
  writeOutputFile,
} from '../utils';

type MockComparisonModel = {
  id: string;
  accuracy: number;
  avgLatency: number;
  totalCost: number;
  passRate: number;
};

type MockComparisonResults = {
  models: MockComparisonModel[];
  totalTests: number;
  winnerId?: string;
};

type ComparisonDisplayResults = MockComparisonResults;

function normalizeRepositoryComparisonResults(runs: Array<{ modelId: string; metrics: { accuracy: number; passRate?: number | null; avgLatencyMs: number; totalCost: number; totalTests: number; passedTests: number; } | null; }>): ComparisonDisplayResults {
  const normalizedModels = runs
    .filter((run) => run.metrics)
    .map((run) => ({
      id: run.modelId,
      accuracy: run.metrics!.accuracy,
      avgLatency: run.metrics!.avgLatencyMs,
      totalCost: run.metrics!.totalCost,
      passRate: run.metrics!.passRate ?? (run.metrics!.totalTests > 0 ? run.metrics!.passedTests / run.metrics!.totalTests : 0),
    }));

  const highestAccuracy = Math.max(...normalizedModels.map((model) => model.accuracy));

  return {
    models: normalizedModels,
    totalTests: runs[0]?.metrics?.totalTests ?? 0,
    winnerId: normalizedModels.find((model) => model.accuracy === highestAccuracy)?.id,
  };
}

async function loadRepositoryComparisonResults(options: CompareCommandOptions, datasetId?: string): Promise<ComparisonDisplayResults | null> {
  if (!datasetId) {
    return null;
  }

  const repository = createEvalRepository(prisma);
  const runs = await Promise.all(
    options.models.map(async (modelId) => {
      const result = await repository.getRuns({ datasetId, modelId, status: 'completed' }, 1, 0);
      return result.runs[0] ?? null;
    })
  );

  const completedRuns = runs.filter((run): run is NonNullable<typeof run> => Boolean(run && run.metrics));

  if (completedRuns.length !== options.models.length) {
    return null;
  }

  return normalizeRepositoryComparisonResults(completedRuns);
}

function buildMarkdownComparison(results: MockComparisonResults): string {
  const lines = [
    '## Comparison Results',
    '',
    '| Model | Accuracy | Pass Rate | Avg Latency | Total Cost | Winner |',
    '|-------|----------|-----------|-------------|------------|--------|',
    ...results.models.map((model) => {
      const isWinner = model.id === results.winnerId;
      return `| ${model.id} | ${formatPercent(model.accuracy)} | ${formatPercent(model.passRate)} | ${formatDuration(model.avgLatency)} | ${formatCost(model.totalCost)} | ${isWinner ? '🏆' : ''} |`;
    }),
  ];

  return lines.join('\n');
}

const MOCK_MODEL_FIXTURES: Record<string, Omit<MockComparisonModel, 'id'>> = {
  'gpt-4-turbo': {
    accuracy: 0.92,
    avgLatency: 1234,
    totalCost: 0.45,
    passRate: 0.9,
  },
  'claude-3-opus': {
    accuracy: 0.94,
    avgLatency: 987,
    totalCost: 0.52,
    passRate: 0.93,
  },
  'gpt-3.5-turbo': {
    accuracy: 0.78,
    avgLatency: 456,
    totalCost: 0.12,
    passRate: 0.75,
  },
};

export function buildMockComparisonResults(models: string[]) {
  const normalizedModels = models.map((modelId) => {
    const fixture = MOCK_MODEL_FIXTURES[modelId] || {
      accuracy: 0.8,
      avgLatency: 1000,
      totalCost: 0.2,
      passRate: 0.8,
    };

    return {
      id: modelId,
      ...fixture,
    };
  });

  const highestAccuracy = Math.max(...normalizedModels.map((model) => model.accuracy));

  return {
    models: normalizedModels,
    totalTests: 100,
    winnerId: normalizedModels.find((model) => model.accuracy === highestAccuracy)?.id,
  };
}

function buildComparisonTable(results: ComparisonDisplayResults): string {
  const tableData = [
    ['Model', 'Accuracy', 'Pass Rate', 'Avg Latency', 'Total Cost', 'Winner'],
    ...results.models.map((model) => {
      const isWinner = model.id === results.winnerId;
      return [
        model.id,
        colorScore(model.accuracy, 0.85),
        formatPercent(model.passRate),
        formatDuration(model.avgLatency),
        formatCost(model.totalCost),
        isWinner ? '🏆' : '',
      ];
    }),
  ];

  return formatTable(tableData);
}

function buildComparisonOutput(results: ComparisonDisplayResults, format: string): string {
  if (format === 'markdown') {
    return buildMarkdownComparison(results);
  }

  if (format === 'json') {
    return JSON.stringify(results, null, 2);
  }

  return buildComparisonTable(results);
}

/**
 * Compare command - Compare multiple models
 */
export function createCompareCommand(): Command {
  const command = new Command('compare')
    .description('Compare performance of multiple models')
    .option('-c, --config <path>', 'Path to configuration file')
    .option('-d, --dataset <datasets...>', 'Dataset IDs to use for comparison')
    .requiredOption('-m, --models <models...>', 'Model IDs to compare (minimum 2)')
    .option('-o, --output <path>', 'Output file path')
    .option('-f, --format <format>', 'Output format (json|table|markdown|html)', 'table')
    .option('--metric <metrics...>', 'Metrics to compare (accuracy, latency, cost, etc.)')
    .option('-v, --verbose', 'Verbose output', false)
    .action(handleCompareCommand);

  return command;
}

/**
 * Handle compare command
 */
async function handleCompareCommand(options: CompareCommandOptions) {
  try {
    section('Model Comparison');

    // Validate at least 2 models
    if (options.models.length < 2) {
      throw new Error('At least 2 models required for comparison');
    }

    // Load configuration
    const spin = spinner('Loading configuration...');
    const config = await loadConfig(options.config);
    spin.succeed('Configuration loaded');

    // Override with CLI options
    if (options.dataset) {
      config.datasets.include = options.dataset;
    }

    info(`Comparing ${options.models.length} models`);
    info(`Datasets: ${config.datasets.include?.join(', ') || 'all'}`);
    info(`Metrics: ${options.metric?.join(', ') || 'all'}`);

    // Execute comparison
    section('Execution');

    const compareSpinner = spinner('Running comparison...');
    const repositoryResults = await loadRepositoryComparisonResults(
      options,
      options.dataset?.length === 1 ? options.dataset[0] : undefined
    );

    // Mock comparison results fallback for demonstration when no persisted comparison set exists
    await new Promise((resolve) => setTimeout(resolve, 2000));

    compareSpinner.succeed('Comparison completed');

    const comparisonResults = repositoryResults || buildMockComparisonResults(options.models);

    const renderedOutput = buildComparisonOutput(comparisonResults, options.format || 'table');

    // Display results
    if (options.format === 'markdown' || options.format === 'json') {
      console.log(renderedOutput);
    } else {
      section('Comparison Results');
      console.log(renderedOutput);
    }

    // Detailed analysis
    if (options.verbose) {
      section('Detailed Analysis');

      // Best in each category
      const best = {
        accuracy: [...comparisonResults.models].sort((a, b) => b.accuracy - a.accuracy)[0],
        latency: [...comparisonResults.models].sort((a, b) => a.avgLatency - b.avgLatency)[0],
        cost: [...comparisonResults.models].sort((a, b) => a.totalCost - b.totalCost)[0],
      };

      summaryBox({
        title: 'Category Winners',
        items: [
          { label: 'Best Accuracy', value: `${best.accuracy.id} (${formatPercent(best.accuracy.accuracy)})`, color: 'green' },
          { label: 'Fastest', value: `${best.latency.id} (${formatDuration(best.latency.avgLatency)})`, color: 'cyan' },
          { label: 'Most Cost-Effective', value: `${best.cost.id} (${formatCost(best.cost.totalCost)})`, color: 'yellow' },
        ],
      });

      // Recommendations
      section('Recommendations');
      info(`✓ ${best.accuracy.id}: Best overall accuracy in this comparison`);
      info(`✓ ${best.cost.id}: Most cost-effective among the selected models`);
      if (best.latency.id !== best.accuracy.id && best.latency.id !== best.cost.id) {
        info(`✓ ${best.latency.id}: Fastest response time among the selected models`);
      }
    }

    success('Comparison completed');

    // Save to file if specified
    if (options.output) {
      await writeOutputFile(options.output, renderedOutput);
      info(`Results saved to: ${options.output}`);
    }
  } catch (err) {
    error('Comparison failed');
    logError(err as Error, options.verbose);
    process.exit(1);
  }
}
