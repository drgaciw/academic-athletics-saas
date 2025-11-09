import { Command } from 'commander';
import { RunCommandOptions } from '../../config/types';
import { loadConfig, ConfigValidationError, ConfigParseError } from '../../config/parser';
import { interactiveMode } from '../interactive';
import {
  displayBanner,
  section,
  success,
  error,
  warning,
  info,
  spinner,
  formatTable,
  summaryBox,
  logError,
  colorScore,
  colorStatus,
  formatDuration,
  formatCost,
} from '../utils';

/**
 * Run command - Execute eval runs
 */
export function createRunCommand(): Command {
  const command = new Command('run')
    .description('Run evaluations on AI models')
    .option('-c, --config <path>', 'Path to configuration file')
    .option('-d, --dataset <datasets...>', 'Dataset IDs to run')
    .option('-m, --model <models...>', 'Model IDs to test')
    .option('-b, --baseline <id>', 'Baseline run ID for comparison')
    .option('-o, --output <path>', 'Output file path')
    .option('-f, --format <format>', 'Output format (json|table|markdown|html|csv)', 'table')
    .option('-v, --verbose', 'Verbose output', false)
    .option('-i, --interactive', 'Interactive mode', false)
    .option('--dry-run', 'Dry run without executing', false)
    .option('--parallel', 'Run in parallel', false)
    .option('--concurrency <number>', 'Concurrency limit', parseInt, 5)
    .action(handleRunCommand);

  return command;
}

/**
 * Handle run command
 */
async function handleRunCommand(options: RunCommandOptions) {
  try {
    // Display banner
    if (!options.verbose) {
      displayBanner();
    }

    section('Configuration');

    // Load configuration
    let config;
    if (options.interactive) {
      info('Starting interactive mode...');
      config = await interactiveMode();
    } else {
      const spin = spinner('Loading configuration...');
      try {
        config = await loadConfig(options.config);
        spin.succeed('Configuration loaded');
      } catch (err) {
        spin.fail('Failed to load configuration');
        throw err;
      }
    }

    // Override config with CLI options
    if (options.dataset) {
      config.datasets.include = options.dataset;
    }
    if (options.model) {
      config.models = config.models.filter((m) =>
        options.model!.includes(`${m.provider}/${m.modelId}`)
      );
    }
    if (options.output) {
      config.output.outputFile = options.output;
    }
    if (options.format) {
      config.output.format = options.format as any;
    }
    if (options.verbose !== undefined) {
      config.output.verbose = options.verbose;
    }
    if (options.baseline) {
      config.baseline.enabled = true;
      config.baseline.baselineId = options.baseline;
    }
    if (options.concurrency) {
      config.runner.concurrency = options.concurrency;
    }

    // Display configuration summary
    info(`Name: ${config.name}`);
    info(`Environment: ${config.environment}`);
    info(`Models: ${config.models.length}`);
    info(`Datasets: ${config.datasets.include?.length || 'all'}`);

    // Dry run check
    if (options.dryRun) {
      warning('Dry run mode - no actual execution');
      console.log('\nConfiguration:');
      console.log(JSON.stringify(config, null, 2));
      return;
    }

    // TODO: Execute eval run
    section('Execution');
    warning('Eval execution not yet implemented - this is a CLI skeleton');

    // Mock results for demonstration
    const mockResults = {
      runId: 'run_' + Date.now(),
      totalTests: 50,
      passed: 42,
      failed: 8,
      accuracy: 0.84,
      avgLatency: 1234,
      totalCost: 0.52,
      duration: 125000,
    };

    // Display results
    section('Results');

    summaryBox({
      title: 'Eval Summary',
      items: [
        { label: 'Run ID', value: mockResults.runId },
        { label: 'Total Tests', value: mockResults.totalTests },
        { label: 'Passed', value: mockResults.passed, color: 'green' },
        { label: 'Failed', value: mockResults.failed, color: 'red' },
        { label: 'Accuracy', value: colorScore(mockResults.accuracy, 0.8) },
        { label: 'Avg Latency', value: formatDuration(mockResults.avgLatency) },
        { label: 'Total Cost', value: formatCost(mockResults.totalCost) },
        { label: 'Duration', value: formatDuration(mockResults.duration) },
      ],
    });

    // Display detailed results table
    if (config.output.verbose) {
      const tableData = [
        ['Test ID', 'Status', 'Score', 'Latency', 'Cost'],
        ['test-001', colorStatus(true), colorScore(0.95), '1.2s', '$0.01'],
        ['test-002', colorStatus(true), colorScore(0.88), '0.8s', '$0.008'],
        ['test-003', colorStatus(false), colorScore(0.45), '1.5s', '$0.012'],
      ];

      console.log('\nDetailed Results:');
      console.log(formatTable(tableData));
    }

    success('Eval completed successfully');

    // Save to file if specified
    if (config.output.outputFile) {
      info(`Results saved to: ${config.output.outputFile}`);
    }
  } catch (err) {
    if (err instanceof ConfigValidationError) {
      error('Configuration validation failed:');
      console.log(err.formatErrors());
    } else if (err instanceof ConfigParseError) {
      error(err.message);
      if (options.verbose) {
        logError(err.cause, true);
      }
    } else {
      error('Eval run failed');
      logError(err as Error, options.verbose);
    }
    process.exit(1);
  }
}
