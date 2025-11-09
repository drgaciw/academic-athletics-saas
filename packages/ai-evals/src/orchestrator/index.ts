/**
 * Eval Orchestrator - Main Entry Point
 *
 * Coordinates all evaluation components: job management, parallel execution,
 * baseline comparison, and report generation.
 */

export { JobManager, JobConfig, JobQueue } from './job-manager';
export {
  ParallelExecutor,
  ScoringWorkerPool,
  ExecutionTask,
  ExecutionResult,
  RateLimiter,
} from './parallel-executor';
export {
  BaselineComparator,
  BaselineConfig,
  RegressionThresholds,
} from './baseline-comparator';
export { ReportGenerator, ReportConfig } from './report-generator';

import { JobManager, JobConfig } from './job-manager';
import { ParallelExecutor, ExecutionTask, ExecutionResult } from './parallel-executor';
import { BaselineComparator } from './baseline-comparator';
import { ReportGenerator } from './report-generator';
import {
  Dataset,
  TestCase,
  RunResult,
  ScorerConfig,
  EvalReport,
  WorkerConfig,
  Metrics,
  BaselineComparison,
  ExportOptions,
} from '../types';

export interface EvalOrchestratorConfig {
  maxConcurrentJobs?: number;
  workerConfig?: WorkerConfig;
}

/**
 * Main orchestrator class that coordinates all evaluation operations
 */
export class EvalOrchestrator {
  private jobManager: JobManager;
  private parallelExecutor: ParallelExecutor;
  private baselineComparator: BaselineComparator;
  private reportGenerator: ReportGenerator;

  constructor(config: EvalOrchestratorConfig = {}) {
    this.jobManager = new JobManager(config.maxConcurrentJobs);
    this.parallelExecutor = new ParallelExecutor(config.workerConfig);
    this.baselineComparator = new BaselineComparator();
    this.reportGenerator = new ReportGenerator();
  }

  /**
   * Create and queue a new evaluation job
   */
  createJob(jobConfig: JobConfig): string {
    return this.jobManager.createJob(jobConfig);
  }

  /**
   * Execute an evaluation job end-to-end
   */
  async executeJob(
    jobId: string,
    datasets: Dataset[],
    runExecutor: (task: ExecutionTask) => Promise<RunResult>,
    scorer: (result: RunResult, config: ScorerConfig) => Promise<any>
  ): Promise<EvalReport> {
    const job = this.jobManager.getJob(jobId);
    if (!job) {
      throw new Error('Job not found: ' + jobId);
    }

    try {
      this.jobManager.updateJobStatus(jobId, 'running');

      const allTestCases: TestCase[] = datasets.flatMap((d) => d.testCases);

      this.jobManager.updateProgress(jobId, {
        totalTests: allTestCases.length,
      });

      const tasks: ExecutionTask[] = [];
      for (const dataset of datasets) {
        for (const testCase of dataset.testCases) {
          for (const runnerConfig of job.runnerConfigs) {
            tasks.push({
              id: testCase.id + '-' + runnerConfig.modelId,
              testCase,
              runnerConfig,
            });
          }
        }
      }

      this.parallelExecutor.on('taskComplete', ({ taskId, progress }) => {
        this.jobManager.updateProgress(jobId, {
          completedTests: progress,
        });
      });

      this.parallelExecutor.on('taskError', ({ error }) => {
        this.jobManager.addError(jobId, error);
        this.jobManager.updateProgress(jobId, {
          failedTests: (this.jobManager.getProgress(jobId)?.failedTests || 0) + 1,
        });
      });

      const executionResults = await this.parallelExecutor.executeTasks(tasks, runExecutor);

      const runSummaries = this.groupResultsIntoRuns(executionResults);

      const scoringResults = [];
      for (const result of executionResults) {
        if (result.result) {
          try {
            const score = await scorer(result.result, job.scorerConfig);
            scoringResults.push({
              testCaseId: result.task.testCase.id,
              score,
              scorerConfig: job.scorerConfig,
            });
          } catch (error) {
            const evalError = {
              type: 'scoring' as const,
              severity: 'error' as const,
              message: error instanceof Error ? error.message : String(error),
              testCaseId: result.task.testCase.id,
              retryable: false,
              timestamp: new Date(),
            };
            this.jobManager.addError(jobId, evalError);
          }
        }
      }

      const executionMetrics = this.parallelExecutor.getMetrics();

      let regressions = [];
      if (job.baseline) {
        const currentMetrics = this.calculateMetricsFromResults(
          runSummaries,
          scoringResults
        );
        const comparison = this.baselineComparator.compareToBaseline(
          currentMetrics,
          jobId,
          job.baseline
        );
        regressions = comparison.regressions;
      }

      const report = this.reportGenerator.generateReport({
        jobId,
        runSummaries,
        scoringResults,
        regressions,
        executionMetrics,
        status: 'completed',
      });

      this.jobManager.updateJobStatus(jobId, 'completed');

      return report;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.jobManager.updateJobStatus(jobId, 'failed', errorMessage);
      throw error;
    }
  }

  /**
   * Compare current results to baseline
   */
  compareToBaseline(
    currentMetrics: Metrics,
    currentRunId: string,
    baselineId?: string
  ): BaselineComparison {
    return this.baselineComparator.compareToBaseline(
      currentMetrics,
      currentRunId,
      baselineId
    );
  }

  /**
   * Store a new baseline
   */
  storeBaseline(name: string, description: string, runId: string, metrics: Metrics): string {
    return this.baselineComparator.storeBaseline({
      name,
      description,
      runId,
      metrics,
    });
  }

  /**
   * Set active baseline for comparisons
   */
  setActiveBaseline(baselineId: string): void {
    this.baselineComparator.setActiveBaseline(baselineId);
  }

  /**
   * Get active baseline
   */
  getActiveBaseline() {
    return this.baselineComparator.getActiveBaseline();
  }

  /**
   * Generate report from job results
   */
  generateReport(jobId: string): EvalReport {
    const job = this.jobManager.getJob(jobId);
    if (!job) {
      throw new Error('Job not found: ' + jobId);
    }

    throw new Error('Report generation from stored job not yet implemented');
  }

  /**
   * Export report in specified format
   */
  exportReport(report: EvalReport, options: ExportOptions): string {
    return this.reportGenerator.exportReport(report, options);
  }

  /**
   * Cancel a running job
   */
  async cancelJob(jobId: string): Promise<void> {
    await this.jobManager.cancelJob(jobId);
  }

  /**
   * Get job progress
   */
  getProgress(jobId: string) {
    return this.jobManager.getProgress(jobId);
  }

  /**
   * Get job status
   */
  getJob(jobId: string) {
    return this.jobManager.getJob(jobId);
  }

  /**
   * Get queue statistics
   */
  getQueueStats() {
    return this.jobManager.getQueueStats();
  }

  /**
   * Get all baselines
   */
  getAllBaselines() {
    return this.baselineComparator.getAllBaselines();
  }

  /**
   * Helper: Group execution results into run summaries
   */
  private groupResultsIntoRuns(
    executionResults: ExecutionResult[]
  ): any[] {
    const runMap = new Map();

    for (const execResult of executionResults) {
      if (!execResult.result) continue;

      const modelId = execResult.task.runnerConfig.modelId;
      const datasetId = 'default';

      const runKey = datasetId + '-' + modelId;

      if (!runMap.has(runKey)) {
        runMap.set(runKey, {
          datasetId,
          runId: 'run-' + Date.now() + '-' + modelId,
          config: execResult.task.runnerConfig,
          results: [],
          startTime: new Date(),
          endTime: new Date(),
          totalDuration: 0,
          totalCost: 0,
          totalTokens: 0,
        });
      }

      const run = runMap.get(runKey);
      run.results.push(execResult.result);
      run.totalDuration += execResult.executionTime;
      run.totalCost += execResult.result.metadata.cost;
      run.totalTokens += execResult.result.metadata.tokenUsage.total;
    }

    return Array.from(runMap.values());
  }

  /**
   * Helper: Calculate metrics from results
   */
  private calculateMetricsFromResults(runSummaries: any[], scoringResults: any[]): Metrics {
    const reportGen = new ReportGenerator();
    const report = reportGen.generateReport({
      jobId: 'temp',
      runSummaries,
      scoringResults,
      status: 'completed',
    });
    return report.metrics;
  }
}
