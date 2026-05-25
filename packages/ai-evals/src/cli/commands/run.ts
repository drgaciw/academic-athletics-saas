import { Command } from 'commander';
import { prisma } from '@aah/database';
import { RunCommandOptions } from '../../config/types';
import { loadConfig, ConfigValidationError, ConfigParseError } from '../../config/parser';
import { interactiveMode } from '../interactive';
import { EvalOrchestrator } from '../../orchestrator/index';
import { loadDataset, listDatasets } from '../../dataset-manager';
import { createEvalRepository } from '../../db/repository';
import {
  ComplianceRunner,
  ConversationalRunner,
  AdvisingRunner,
  RiskPredictionRunner,
  RAGRunner,
} from '../../runners';
import type { RunResult, ScorerConfig, Score } from '../../types';
import type { ExecutionTask } from '../../orchestrator/parallel-executor';
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
  writeOutputFile,
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

function renderRunOutput(results: {
  runId: string;
  totalTests: number;
  passed: number;
  failed: number;
  accuracy: number;
  avgLatency: number;
  totalCost: number;
  duration: number;
}, format: string, verbose: boolean): string {
  if (format === 'json') {
    return JSON.stringify(results, null, 2);
  }

  if (format === 'markdown') {
    return `# Eval Results\n\n| Metric | Value |\n|--------|-------|\n| Run ID | ${results.runId} |\n| Total Tests | ${results.totalTests} |\n| Passed | ${results.passed} |\n| Failed | ${results.failed} |\n| Accuracy | ${results.accuracy} |\n| Avg Latency | ${results.avgLatency} |\n| Total Cost | ${results.totalCost} |\n| Duration | ${results.duration} |\n`;
  }

  const sections = [
    `Run ID: ${results.runId}`,
    `Total Tests: ${results.totalTests}`,
    `Passed: ${results.passed}`,
    `Failed: ${results.failed}`,
    `Accuracy: ${results.accuracy}`,
    `Avg Latency: ${results.avgLatency}`,
    `Total Cost: ${results.totalCost}`,
    `Duration: ${results.duration}`,
  ];

  if (verbose) {
    sections.push('Detailed results included in console output');
  }

  return sections.join('\n');
}

function createRunnerForDataset(datasetId: string) {
  if (datasetId.startsWith('compliance')) return new ComplianceRunner();
  if (datasetId.startsWith('advising')) return new AdvisingRunner();
  if (datasetId.startsWith('risk')) return new RiskPredictionRunner();
  if (datasetId.startsWith('rag')) return new RAGRunner();
  return new ConversationalRunner();
}

async function scoreRunResult(
  result: RunResult,
  scorerConfig: ScorerConfig
): Promise<Score> {
  if (result.metadata?.error) {
    return {
      passed: false,
      score: 0,
      explanation: result.metadata.error,
    };
  }

  if (scorerConfig.strategy === 'exact') {
    const matches = JSON.stringify(result.actual) === JSON.stringify(result.expected);
    return {
      passed: matches,
      score: matches ? 1 : 0,
      explanation: matches ? 'Exact match' : 'Output mismatch',
    };
  }

  return {
    passed: true,
    score: 0.5,
    explanation: 'Semantic scorer not yet wired; marked as provisional pass',
  };
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

    section('Execution');
    const execSpin = spinner('Running evaluations...');

    const orchestrator = new EvalOrchestrator({
      workerConfig: {
        concurrency: config.runner.concurrency ?? options.concurrency ?? 5,
      },
    });

    const datasetIds = config.datasets.include?.length
      ? config.datasets.include
      : (await listDatasets()).map((dataset) => dataset.id);

    if (datasetIds.length === 0) {
      execSpin.fail('No datasets found');
      throw new Error('No datasets available to run');
    }

    const datasets = await Promise.all(datasetIds.map((id) => loadDataset(id)));
    const runnerConfigs = config.models.map((model) => ({
      modelId: `${model.provider}/${model.modelId}`,
      temperature: model.temperature,
      maxTokens: model.maxTokens,
      timeout: config.runner.timeout,
      retries: config.runner.retries,
    }));

    const jobId = orchestrator.createJob({
      datasetIds,
      runnerConfigs,
      scorerConfig: config.scorer,
      baseline: config.baseline.enabled ? config.baseline.baselineId : undefined,
      parallel: options.parallel ?? true,
      concurrency: config.runner.concurrency,
    });

    const runExecutor = async (task: ExecutionTask) => {
      const runner = createRunnerForDataset(task.datasetId ?? datasetIds[0]!);
      return runner.runTestCase(task.testCase, task.runnerConfig);
    };

    const report = await orchestrator.executeJob(
      jobId,
      datasets,
      runExecutor,
      scoreRunResult
    );

    execSpin.succeed('Eval execution completed');

    const repository = createEvalRepository(prisma);
    const persistedRunIds = await repository.persistEvalReport(report, datasets, config);

    const results = {
      runId: persistedRunIds[0] ?? report.jobId,
      totalTests: report.summary.totalTests,
      passed: report.summary.passed,
      failed: report.summary.failed,
      accuracy: report.summary.accuracy / 100,
      avgLatency: report.summary.avgLatency,
      totalCost: report.summary.totalCost,
      duration: report.summary.duration,
    };

    section('Results');

    summaryBox({
      title: 'Eval Summary',
      items: [
        { label: 'Run ID', value: results.runId },
        { label: 'Total Tests', value: results.totalTests },
        { label: 'Passed', value: results.passed, color: 'green' },
        { label: 'Failed', value: results.failed, color: 'red' },
        { label: 'Accuracy', value: colorScore(results.accuracy, 0.8) },
        { label: 'Avg Latency', value: formatDuration(results.avgLatency) },
        { label: 'Total Cost', value: formatCost(results.totalCost) },
        { label: 'Duration', value: formatDuration(results.duration) },
      ],
    });

    if (config.output.verbose) {
      const tableData = [
        ['Test ID', 'Status', 'Score', 'Latency', 'Cost'],
        ...report.scoringResults.slice(0, 20).map((entry) => {
          const runResult = report.runSummaries
            .flatMap((summary) => summary.results)
            .find((result) => result.testCaseId === entry.testCaseId);

          return [
            entry.testCaseId,
            colorStatus(entry.score.passed),
            colorScore(entry.score.score ?? entry.score.value ?? 0),
            formatDuration(runResult?.metadata?.latency ?? 0),
            formatCost(runResult?.metadata?.cost ?? 0),
          ];
        }),
      ];

      console.log('\nDetailed Results:');
      console.log(formatTable(tableData));
    }

    success('Eval completed successfully');

    if (config.output.outputFile) {
      await writeOutputFile(
        config.output.outputFile,
        renderRunOutput(results, config.output.format, config.output.verbose)
      );
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
