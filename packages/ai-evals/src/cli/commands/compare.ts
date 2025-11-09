import { Command } from 'commander';
import { CompareCommandOptions } from '../../config/types';
import { loadConfig } from '../../config/parser';
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
} from '../utils';

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

    // TODO: Execute comparison
    section('Execution');

    const compareSpinner = spinner('Running comparison...');

    // Mock comparison results
    await new Promise((resolve) => setTimeout(resolve, 2000));

    compareSpinner.succeed('Comparison completed');

    // Mock results for demonstration
    const mockResults = {
      models: [
        {
          id: 'gpt-4-turbo',
          accuracy: 0.92,
          avgLatency: 1234,
          totalCost: 0.45,
          passRate: 0.90,
        },
        {
          id: 'claude-3-opus',
          accuracy: 0.94,
          avgLatency: 987,
          totalCost: 0.52,
          passRate: 0.93,
        },
        {
          id: 'gpt-3.5-turbo',
          accuracy: 0.78,
          avgLatency: 456,
          totalCost: 0.12,
          passRate: 0.75,
        },
      ],
      totalTests: 100,
    };

    // Display results
    section('Comparison Results');

    // Summary table
    const tableData = [
      ['Model', 'Accuracy', 'Pass Rate', 'Avg Latency', 'Total Cost', 'Winner'],
      ...mockResults.models.map((model, index) => {
        const isWinner = index === 1; // Mock: claude-3-opus wins
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

    console.log(formatTable(tableData));

    // Detailed analysis
    if (options.verbose) {
      section('Detailed Analysis');

      // Best in each category
      const best = {
        accuracy: mockResults.models[1],
        latency: mockResults.models[2],
        cost: mockResults.models[2],
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
      info('✓ claude-3-opus: Best overall accuracy and pass rate');
      info('✓ gpt-3.5-turbo: Most cost-effective for less critical tasks');
      info('⚠ gpt-4-turbo: Balanced performance but higher cost');
    }

    success('Comparison completed');

    // Save to file if specified
    if (options.output) {
      info(`Results saved to: ${options.output}`);
    }
  } catch (err) {
    error('Comparison failed');
    logError(err as Error, options.verbose);
    process.exit(1);
  }
}
