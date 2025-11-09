/**
 * Repository layer for AI Evaluation Framework data persistence
 *
 * This module provides methods to save run results, metrics, and baselines,
 * query historical data for analysis, and implement data retention policies.
 */

import { PrismaClient } from '@prisma/client';
import type {
  CreateEvalRunInput,
  CreateEvalResultInput,
  CreateEvalMetricsInput,
  CreateEvalBaselineInput,
  UpdateEvalRunInput,
  UpdateEvalBaselineInput,
  EvalRunFilters,
  EvalResultFilters,
  EvalBaselineFilters,
  EvalRunWithMetrics,
  TrendData,
  ComparisonData,
  Regression,
  DatasetStatistics,
  ModelPerformance,
  RetentionPolicy,
  CleanupResult,
} from './types';

/**
 * Repository class for managing eval data persistence
 */
export class EvalRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // ============================================================================
  // EvalRun Operations
  // ============================================================================

  /**
   * Create a new eval run
   */
  async createRun(input: CreateEvalRunInput) {
    return this.prisma.evalRun.create({
      data: {
        datasetId: input.datasetId,
        datasetVersion: input.datasetVersion,
        datasetName: input.datasetName,
        modelId: input.modelId,
        modelConfig: input.modelConfig,
        runnerType: input.runnerType,
        scorerConfig: input.scorerConfig,
        startTime: input.startTime,
        status: 'running',
        metadata: input.metadata,
      },
    });
  }

  /**
   * Update an existing eval run
   */
  async updateRun(runId: string, input: UpdateEvalRunInput) {
    return this.prisma.evalRun.update({
      where: { id: runId },
      data: input,
    });
  }

  /**
   * Mark a run as completed
   */
  async completeRun(runId: string, endTime: Date) {
    const run = await this.prisma.evalRun.findUnique({
      where: { id: runId },
      select: { startTime: true },
    });

    if (!run) {
      throw new Error(`Run ${runId} not found`);
    }

    const durationMs = endTime.getTime() - run.startTime.getTime();

    return this.prisma.evalRun.update({
      where: { id: runId },
      data: {
        endTime,
        durationMs,
        status: 'completed',
      },
    });
  }

  /**
   * Mark a run as failed
   */
  async failRun(runId: string, error: string) {
    const endTime = new Date();
    const run = await this.prisma.evalRun.findUnique({
      where: { id: runId },
      select: { startTime: true },
    });

    if (!run) {
      throw new Error(`Run ${runId} not found`);
    }

    const durationMs = endTime.getTime() - run.startTime.getTime();

    return this.prisma.evalRun.update({
      where: { id: runId },
      data: {
        endTime,
        durationMs,
        status: 'failed',
        error,
      },
    });
  }

  /**
   * Get a run by ID with all related data
   */
  async getRun(runId: string): Promise<EvalRunWithMetrics | null> {
    return this.prisma.evalRun.findUnique({
      where: { id: runId },
      include: {
        metrics: true,
        results: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  /**
   * Get runs with optional filtering
   */
  async getRuns(filters: EvalRunFilters = {}, limit = 50, offset = 0) {
    const where: any = {};

    if (filters.datasetId) where.datasetId = filters.datasetId;
    if (filters.modelId) where.modelId = filters.modelId;
    if (filters.runnerType) where.runnerType = filters.runnerType;
    if (filters.status) where.status = filters.status;

    if (filters.startTimeFrom || filters.startTimeTo) {
      where.startTime = {};
      if (filters.startTimeFrom) where.startTime.gte = filters.startTimeFrom;
      if (filters.startTimeTo) where.startTime.lte = filters.startTimeTo;
    }

    const [runs, total] = await Promise.all([
      this.prisma.evalRun.findMany({
        where,
        include: {
          metrics: true,
        },
        orderBy: { startTime: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.evalRun.count({ where }),
    ]);

    return { runs, total };
  }

  /**
   * Get the most recent run for a dataset
   */
  async getLatestRun(datasetId: string): Promise<EvalRunWithMetrics | null> {
    return this.prisma.evalRun.findFirst({
      where: { datasetId, status: 'completed' },
      include: {
        metrics: true,
        results: true,
      },
      orderBy: { startTime: 'desc' },
    });
  }

  // ============================================================================
  // EvalResult Operations
  // ============================================================================

  /**
   * Create a single eval result
   */
  async createResult(input: CreateEvalResultInput) {
    return this.prisma.evalResult.create({
      data: input,
    });
  }

  /**
   * Create multiple eval results in a batch
   */
  async createResultsBatch(inputs: CreateEvalResultInput[]) {
    return this.prisma.evalResult.createMany({
      data: inputs,
    });
  }

  /**
   * Get results for a specific run
   */
  async getResults(runId: string, filters: EvalResultFilters = {}) {
    const where: any = { runId };

    if (filters.passed !== undefined) where.passed = filters.passed;
    if (filters.scoreMin !== undefined) where.score = { gte: filters.scoreMin };
    if (filters.scoreMax !== undefined) {
      where.score = { ...where.score, lte: filters.scoreMax };
    }

    return this.prisma.evalResult.findMany({
      where,
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Get failed results for a run
   */
  async getFailedResults(runId: string) {
    return this.prisma.evalResult.findMany({
      where: { runId, passed: false },
      orderBy: { score: 'asc' },
    });
  }

  /**
   * Get a specific result by test case ID
   */
  async getResultByTestCase(runId: string, testCaseId: string) {
    return this.prisma.evalResult.findFirst({
      where: { runId, testCaseId },
    });
  }

  // ============================================================================
  // EvalMetrics Operations
  // ============================================================================

  /**
   * Create metrics for a run
   */
  async createMetrics(input: CreateEvalMetricsInput) {
    return this.prisma.evalMetrics.create({
      data: input,
    });
  }

  /**
   * Get metrics for a specific run
   */
  async getMetrics(runId: string) {
    return this.prisma.evalMetrics.findUnique({
      where: { runId },
    });
  }

  /**
   * Calculate and save metrics for a run based on its results
   */
  async calculateAndSaveMetrics(runId: string) {
    const results = await this.prisma.evalResult.findMany({
      where: { runId },
    });

    if (results.length === 0) {
      throw new Error(`No results found for run ${runId}`);
    }

    const totalTests = results.length;
    const passedTests = results.filter((r) => r.passed).length;
    const failedTests = totalTests - passedTests;
    const accuracy = passedTests / totalTests;
    const passRate = accuracy;

    const avgScore = results.reduce((sum, r) => sum + r.score, 0) / totalTests;
    const avgLatencyMs = results.reduce((sum, r) => sum + r.latencyMs, 0) / totalTests;
    const totalCost = results.reduce((sum, r) => sum + r.cost, 0);
    const totalTokens = results.reduce(
      (sum, r) => sum + ((r.tokenUsage as any)?.total || 0),
      0
    );

    // Calculate category breakdown (if metadata has categories)
    const categoryBreakdown: Record<string, any> = {};
    const failuresByType: Record<string, number> = {};

    results.forEach((result) => {
      const category = (result.metadata as any)?.category || 'uncategorized';

      if (!categoryBreakdown[category]) {
        categoryBreakdown[category] = {
          total: 0,
          passed: 0,
          avgScore: 0,
          scores: [],
        };
      }

      categoryBreakdown[category].total++;
      if (result.passed) categoryBreakdown[category].passed++;
      categoryBreakdown[category].scores.push(result.score);

      if (!result.passed) {
        failuresByType[category] = (failuresByType[category] || 0) + 1;
      }
    });

    // Calculate average scores for each category
    Object.keys(categoryBreakdown).forEach((category) => {
      const scores = categoryBreakdown[category].scores;
      categoryBreakdown[category].avgScore =
        scores.reduce((sum: number, s: number) => sum + s, 0) / scores.length;
      categoryBreakdown[category].accuracy =
        categoryBreakdown[category].passed / categoryBreakdown[category].total;
      delete categoryBreakdown[category].scores; // Remove intermediate data
    });

    // Calculate score distribution (buckets: 0-0.2, 0.2-0.4, etc.)
    const scoreDistribution = {
      '0.0-0.2': 0,
      '0.2-0.4': 0,
      '0.4-0.6': 0,
      '0.6-0.8': 0,
      '0.8-1.0': 0,
    };

    results.forEach((result) => {
      const score = result.score;
      if (score < 0.2) scoreDistribution['0.0-0.2']++;
      else if (score < 0.4) scoreDistribution['0.2-0.4']++;
      else if (score < 0.6) scoreDistribution['0.4-0.6']++;
      else if (score < 0.8) scoreDistribution['0.6-0.8']++;
      else scoreDistribution['0.8-1.0']++;
    });

    return this.createMetrics({
      runId,
      totalTests,
      passedTests,
      failedTests,
      accuracy,
      passRate,
      avgScore,
      avgLatencyMs,
      totalCost,
      totalTokens,
      categoryBreakdown,
      failuresByType,
      scoreDistribution,
    });
  }

  // ============================================================================
  // EvalBaseline Operations
  // ============================================================================

  /**
   * Create a new baseline
   */
  async createBaseline(input: CreateEvalBaselineInput) {
    // Verify the run exists
    const run = await this.prisma.evalRun.findUnique({
      where: { id: input.runId },
      include: { metrics: true },
    });

    if (!run) {
      throw new Error(`Run ${input.runId} not found`);
    }

    if (!run.metrics) {
      throw new Error(`Run ${input.runId} has no metrics`);
    }

    return this.prisma.evalBaseline.create({
      data: input,
    });
  }

  /**
   * Update a baseline
   */
  async updateBaseline(baselineId: string, input: UpdateEvalBaselineInput) {
    return this.prisma.evalBaseline.update({
      where: { id: baselineId },
      data: input,
    });
  }

  /**
   * Set a baseline as active (and deactivate others for the same dataset)
   */
  async setActiveBaseline(baselineId: string) {
    const baseline = await this.prisma.evalBaseline.findUnique({
      where: { id: baselineId },
    });

    if (!baseline) {
      throw new Error(`Baseline ${baselineId} not found`);
    }

    // Deactivate all baselines for this dataset
    await this.prisma.evalBaseline.updateMany({
      where: { datasetId: baseline.datasetId },
      data: { isActive: false },
    });

    // Activate the target baseline
    return this.prisma.evalBaseline.update({
      where: { id: baselineId },
      data: { isActive: true },
    });
  }

  /**
   * Get the active baseline for a dataset
   */
  async getActiveBaseline(datasetId: string) {
    return this.prisma.evalBaseline.findFirst({
      where: { datasetId, isActive: true },
    });
  }

  /**
   * Get all baselines with optional filtering
   */
  async getBaselines(filters: EvalBaselineFilters = {}) {
    const where: any = {};

    if (filters.datasetId) where.datasetId = filters.datasetId;
    if (filters.modelId) where.modelId = filters.modelId;
    if (filters.isActive !== undefined) where.isActive = filters.isActive;
    if (filters.tags && filters.tags.length > 0) {
      where.tags = { hasSome: filters.tags };
    }

    return this.prisma.evalBaseline.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Delete a baseline
   */
  async deleteBaseline(baselineId: string) {
    return this.prisma.evalBaseline.delete({
      where: { id: baselineId },
    });
  }

  // ============================================================================
  // Historical Analysis and Trends
  // ============================================================================

  /**
   * Get trend data for a dataset over time
   */
  async getTrendData(datasetId: string, limit = 20): Promise<TrendData[]> {
    const runs = await this.prisma.evalRun.findMany({
      where: {
        datasetId,
        status: 'completed',
      },
      include: {
        metrics: true,
      },
      orderBy: { startTime: 'desc' },
      take: limit,
    });

    return runs
      .filter((run) => run.metrics)
      .map((run) => ({
        runId: run.id,
        timestamp: run.startTime,
        accuracy: run.metrics!.accuracy,
        avgScore: run.metrics!.avgScore,
        avgLatencyMs: run.metrics!.avgLatencyMs,
        totalCost: run.metrics!.totalCost,
      }))
      .reverse(); // Return in chronological order
  }

  /**
   * Compare a run to a baseline
   */
  async compareToBaseline(runId: string, baselineId: string): Promise<ComparisonData> {
    const [currentRun, baseline] = await Promise.all([
      this.getRun(runId),
      this.prisma.evalBaseline.findUnique({ where: { id: baselineId } }),
    ]);

    if (!currentRun) {
      throw new Error(`Run ${runId} not found`);
    }

    if (!baseline) {
      throw new Error(`Baseline ${baselineId} not found`);
    }

    const baselineRun = await this.getRun(baseline.runId);

    if (!baselineRun || !baselineRun.metrics || !currentRun.metrics) {
      throw new Error('Cannot compare runs without metrics');
    }

    const differences = {
      accuracyDelta: currentRun.metrics.accuracy - baselineRun.metrics.accuracy,
      scoreDelta: currentRun.metrics.avgScore - baselineRun.metrics.avgScore,
      latencyDelta: currentRun.metrics.avgLatencyMs - baselineRun.metrics.avgLatencyMs,
      costDelta: currentRun.metrics.totalCost - baselineRun.metrics.totalCost,
    };

    // Detect regressions
    const regressions: Regression[] = [];

    // Accuracy regression (> 5% decrease is critical, > 2% is major, > 1% is minor)
    if (differences.accuracyDelta < -0.05) {
      regressions.push({
        testCaseId: 'overall',
        metric: 'accuracy',
        baseline: baselineRun.metrics.accuracy,
        current: currentRun.metrics.accuracy,
        percentChange: (differences.accuracyDelta / baselineRun.metrics.accuracy) * 100,
        severity: 'critical',
      });
    } else if (differences.accuracyDelta < -0.02) {
      regressions.push({
        testCaseId: 'overall',
        metric: 'accuracy',
        baseline: baselineRun.metrics.accuracy,
        current: currentRun.metrics.accuracy,
        percentChange: (differences.accuracyDelta / baselineRun.metrics.accuracy) * 100,
        severity: 'major',
      });
    } else if (differences.accuracyDelta < -0.01) {
      regressions.push({
        testCaseId: 'overall',
        metric: 'accuracy',
        baseline: baselineRun.metrics.accuracy,
        current: currentRun.metrics.accuracy,
        percentChange: (differences.accuracyDelta / baselineRun.metrics.accuracy) * 100,
        severity: 'minor',
      });
    }

    // Latency regression (> 50% increase is critical, > 25% is major, > 10% is minor)
    const latencyIncreasePct = differences.latencyDelta / baselineRun.metrics.avgLatencyMs;
    if (latencyIncreasePct > 0.5) {
      regressions.push({
        testCaseId: 'overall',
        metric: 'latency',
        baseline: baselineRun.metrics.avgLatencyMs,
        current: currentRun.metrics.avgLatencyMs,
        percentChange: latencyIncreasePct * 100,
        severity: 'critical',
      });
    } else if (latencyIncreasePct > 0.25) {
      regressions.push({
        testCaseId: 'overall',
        metric: 'latency',
        baseline: baselineRun.metrics.avgLatencyMs,
        current: currentRun.metrics.avgLatencyMs,
        percentChange: latencyIncreasePct * 100,
        severity: 'major',
      });
    } else if (latencyIncreasePct > 0.1) {
      regressions.push({
        testCaseId: 'overall',
        metric: 'latency',
        baseline: baselineRun.metrics.avgLatencyMs,
        current: currentRun.metrics.avgLatencyMs,
        percentChange: latencyIncreasePct * 100,
        severity: 'minor',
      });
    }

    return {
      baseline: baselineRun,
      current: currentRun,
      differences,
      regressions,
    };
  }

  /**
   * Get statistics for a dataset
   */
  async getDatasetStatistics(datasetId: string): Promise<DatasetStatistics> {
    const runs = await this.prisma.evalRun.findMany({
      where: { datasetId, status: 'completed' },
      include: { metrics: true },
      orderBy: { startTime: 'desc' },
      take: 10,
    });

    const totalRuns = await this.prisma.evalRun.count({
      where: { datasetId, status: 'completed' },
    });

    const runsWithMetrics = runs.filter((r) => r.metrics);

    const avgAccuracy =
      runsWithMetrics.reduce((sum, r) => sum + r.metrics!.accuracy, 0) /
      (runsWithMetrics.length || 1);

    const avgCost =
      runsWithMetrics.reduce((sum, r) => sum + r.metrics!.totalCost, 0) /
      (runsWithMetrics.length || 1);

    const lastRunDate = runs[0]?.startTime || null;

    // Determine trend direction based on last 5 runs
    let trendDirection: 'improving' | 'stable' | 'declining' = 'stable';
    if (runsWithMetrics.length >= 5) {
      const recent = runsWithMetrics.slice(0, 3);
      const older = runsWithMetrics.slice(3, 6);

      const recentAvg =
        recent.reduce((sum, r) => sum + r.metrics!.accuracy, 0) / recent.length;
      const olderAvg =
        older.reduce((sum, r) => sum + r.metrics!.accuracy, 0) / older.length;

      if (recentAvg > olderAvg + 0.02) trendDirection = 'improving';
      else if (recentAvg < olderAvg - 0.02) trendDirection = 'declining';
    }

    return {
      datasetId,
      totalRuns,
      avgAccuracy,
      avgCost,
      lastRunDate,
      trendDirection,
    };
  }

  /**
   * Get performance statistics for a model
   */
  async getModelPerformance(modelId: string): Promise<ModelPerformance> {
    const runs = await this.prisma.evalRun.findMany({
      where: { modelId, status: 'completed' },
      include: { metrics: true },
      orderBy: { startTime: 'desc' },
    });

    const runsWithMetrics = runs.filter((r) => r.metrics);

    const avgAccuracy =
      runsWithMetrics.reduce((sum, r) => sum + r.metrics!.accuracy, 0) /
      (runsWithMetrics.length || 1);

    const avgLatencyMs =
      runsWithMetrics.reduce((sum, r) => sum + r.metrics!.avgLatencyMs, 0) /
      (runsWithMetrics.length || 1);

    const avgCost =
      runsWithMetrics.reduce((sum, r) => sum + r.metrics!.totalCost, 0) /
      (runsWithMetrics.length || 1);

    // Find best run
    let bestRun = null;
    if (runsWithMetrics.length > 0) {
      const best = runsWithMetrics.reduce((prev, current) =>
        current.metrics!.accuracy > prev.metrics!.accuracy ? current : prev
      );
      bestRun = {
        runId: best.id,
        accuracy: best.metrics!.accuracy,
        timestamp: best.startTime,
      };
    }

    return {
      modelId,
      totalRuns: runs.length,
      avgAccuracy,
      avgLatencyMs,
      avgCost,
      bestRun,
    };
  }

  // ============================================================================
  // Data Retention and Cleanup
  // ============================================================================

  /**
   * Clean up old eval data based on retention policy
   */
  async cleanupOldData(policy: RetentionPolicy): Promise<CleanupResult> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - policy.keepRecentDays);

    // Build delete criteria
    const deleteWhere: any = {
      startTime: { lt: cutoffDate },
    };

    // Exclude baselines if policy says to keep them
    if (policy.keepBaselines) {
      const baselineRunIds = await this.prisma.evalBaseline.findMany({
        select: { runId: true },
      });
      deleteWhere.id = {
        notIn: baselineRunIds.map((b) => b.runId),
      };
    }

    // Exclude failed runs if policy says to keep them
    if (policy.keepFailedRuns) {
      deleteWhere.status = { not: 'failed' };
    }

    // Keep top performers if specified
    if (policy.keepTopPerformers && policy.keepTopPerformers > 0) {
      const topRuns = await this.prisma.evalRun.findMany({
        where: { status: 'completed' },
        include: { metrics: true },
        orderBy: { metrics: { accuracy: 'desc' } },
        take: policy.keepTopPerformers,
        select: { id: true },
      });

      const existingNotIn = deleteWhere.id?.notIn || [];
      deleteWhere.id = {
        notIn: [...existingNotIn, ...topRuns.map((r) => r.id)],
      };
    }

    // Count what will be deleted
    const toDelete = await this.prisma.evalRun.findMany({
      where: deleteWhere,
      include: {
        results: true,
        metrics: true,
      },
    });

    const runsDeleted = toDelete.length;
    const resultsDeleted = toDelete.reduce((sum, r) => sum + r.results.length, 0);
    const metricsDeleted = toDelete.filter((r) => r.metrics).length;

    // Perform deletion (cascade will handle results and metrics)
    await this.prisma.evalRun.deleteMany({
      where: deleteWhere,
    });

    // Estimate bytes freed (rough calculation)
    const bytesFreed = runsDeleted * 1024 + resultsDeleted * 2048 + metricsDeleted * 512;

    return {
      runsDeleted,
      resultsDeleted,
      metricsDeleted,
      bytesFreed,
    };
  }

  /**
   * Delete all data for a specific dataset
   */
  async deleteDatasetData(datasetId: string) {
    // Delete baselines first
    await this.prisma.evalBaseline.deleteMany({
      where: { datasetId },
    });

    // Delete runs (cascade will handle results and metrics)
    const result = await this.prisma.evalRun.deleteMany({
      where: { datasetId },
    });

    return result;
  }
}

/**
 * Create a singleton instance of the repository
 */
export function createEvalRepository(prisma: PrismaClient): EvalRepository {
  return new EvalRepository(prisma);
}
