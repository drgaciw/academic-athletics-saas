/**
 * Cost Tracking System for AI Evals
 *
 * Task 11.3: Add cost tracking
 * - Track token usage and costs per eval run
 * - Display cost trends in metrics
 * - Add budget alerts and limits (daily, monthly thresholds)
 * - Support cost breakdown by model, dataset, and runner type
 * - Integration with existing cost tracking in BaseRunner
 *
 * Usage:
 * ```typescript
 * const costTracker = new CostTracker({
 *   dailyLimit: 100,
 *   monthlyLimit: 1000,
 * });
 *
 * await costTracker.trackRun(report);
 * const breakdown = costTracker.getCostBreakdown('daily');
 * ```
 */

import type {
  EvalReport,
  RunSummary,
  RunResult,
  TokenUsage,
  RunnerConfig,
} from '../types';

/**
 * Time period for cost aggregation
 */
export type TimePeriod = 'hourly' | 'daily' | 'weekly' | 'monthly';

/**
 * Cost breakdown dimensions
 */
export enum CostDimension {
  MODEL = 'model',
  DATASET = 'dataset',
  RUNNER = 'runner',
  TIME = 'time',
}

/**
 * Budget configuration
 */
export interface BudgetConfig {
  hourlyLimit?: number; // USD
  dailyLimit?: number; // USD
  weeklyLimit?: number; // USD
  monthlyLimit?: number; // USD
  perRunLimit?: number; // USD
  alertThreshold?: number; // 0-100, percentage of limit to trigger warning
}

/**
 * Cost tracking configuration
 */
export interface CostTrackerConfig {
  budget?: BudgetConfig;
  persistPath?: string; // Path to persist cost data
  enabled?: boolean;
  verbose?: boolean;
}

/**
 * Cost entry for a single eval run
 */
export interface CostEntry {
  runId: string;
  jobId: string;
  timestamp: Date;
  modelId: string;
  datasetId: string;
  totalCost: number;
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
  testCount: number;
  avgCostPerTest: number;
}

/**
 * Aggregated cost statistics
 */
export interface CostStats {
  period: TimePeriod;
  startDate: Date;
  endDate: Date;
  totalCost: number;
  totalTokens: number;
  totalRuns: number;
  totalTests: number;
  avgCostPerRun: number;
  avgCostPerTest: number;
  avgTokensPerTest: number;
}

/**
 * Cost breakdown by dimension
 */
export interface CostBreakdown {
  dimension: CostDimension;
  entries: Array<{
    key: string; // model name, dataset name, etc.
    cost: number;
    tokens: number;
    runs: number;
    percentage: number; // percentage of total cost
  }>;
  totalCost: number;
  totalTokens: number;
}

/**
 * Budget status
 */
export interface BudgetStatus {
  period: TimePeriod;
  limit: number;
  used: number;
  remaining: number;
  percentUsed: number;
  exceeded: boolean;
  projectedEndOfPeriod?: number; // Projected cost at end of period
}

/**
 * Cost trend data point
 */
export interface CostTrendPoint {
  timestamp: string;
  cost: number;
  tokens: number;
  runs: number;
}

/**
 * Cost Tracker
 */
export class CostTracker {
  private config: Required<CostTrackerConfig>;
  private entries: CostEntry[] = [];
  private budgetTracking: {
    hourly: { cost: number; lastReset: Date };
    daily: { cost: number; lastReset: Date };
    weekly: { cost: number; lastReset: Date };
    monthly: { cost: number; lastReset: Date };
  };

  constructor(config: CostTrackerConfig = {}) {
    this.config = {
      budget: {
        alertThreshold: 80,
        ...config.budget,
      },
      persistPath: config.persistPath || '',
      enabled: config.enabled ?? true,
      verbose: config.verbose ?? false,
    };

    const now = new Date();
    this.budgetTracking = {
      hourly: { cost: 0, lastReset: now },
      daily: { cost: 0, lastReset: now },
      weekly: { cost: 0, lastReset: now },
      monthly: { cost: 0, lastReset: now },
    };

    // Load persisted data if available
    if (this.config.persistPath) {
      this.loadPersistedData();
    }
  }

  /**
   * Track cost for an eval run
   */
  async trackRun(report: EvalReport): Promise<void> {
    if (!this.config.enabled) return;

    for (const runSummary of report.runSummaries) {
      const entry = this.createCostEntry(report.jobId, runSummary);
      this.entries.push(entry);
      this.updateBudgetTracking(entry.totalCost);
      this.log('Cost tracked:', entry);
    }

    // Persist data
    if (this.config.persistPath) {
      await this.persistData();
    }

    // Check budget limits
    await this.checkBudgetLimits();
  }

  /**
   * Track cost for individual run result
   */
  trackRunResult(jobId: string, result: RunResult, config: { modelId: string; [key: string]: any }): void {
    if (!this.config.enabled) return;

    if (!result.metadata) return;

    const entry: CostEntry = {
      runId: `${result.testCaseId}-${config.modelId}`,
      jobId,
      timestamp: result.metadata.timestamp,
      modelId: config.modelId,
      datasetId: 'unknown', // Would need to be passed separately
      totalCost: result.metadata.cost ?? 0,
      totalTokens: (result.metadata as any).tokenUsage?.total ?? 0,
      promptTokens: (result.metadata as any).tokenUsage?.prompt ?? 0,
      completionTokens: (result.metadata as any).tokenUsage?.completion ?? 0,
      testCount: 1,
      avgCostPerTest: result.metadata.cost ?? 0,
    };

    this.entries.push(entry);
    this.updateBudgetTracking(entry.totalCost);
  }

  /**
   * Get cost statistics for a time period
   */
  getCostStats(period: TimePeriod, startDate?: Date, endDate?: Date): CostStats {
    const { start, end } = this.getDateRange(period, startDate, endDate);
    const periodEntries = this.getEntriesInRange(start, end);

    const totalCost = periodEntries.reduce((sum, e) => sum + e.totalCost, 0);
    const totalTokens = periodEntries.reduce((sum, e) => sum + e.totalTokens, 0);
    const totalRuns = periodEntries.length;
    const totalTests = periodEntries.reduce((sum, e) => sum + e.testCount, 0);

    return {
      period,
      startDate: start,
      endDate: end,
      totalCost,
      totalTokens,
      totalRuns,
      totalTests,
      avgCostPerRun: totalRuns > 0 ? totalCost / totalRuns : 0,
      avgCostPerTest: totalTests > 0 ? totalCost / totalTests : 0,
      avgTokensPerTest: totalTests > 0 ? totalTokens / totalTests : 0,
    };
  }

  /**
   * Get cost breakdown by dimension
   */
  getCostBreakdown(dimension: CostDimension, period?: TimePeriod): CostBreakdown {
    const entries = period
      ? (() => { const { start, end } = this.getDateRange(period); return this.getEntriesInRange(start, end); })()
      : this.entries;

    const breakdown = new Map<string, { cost: number; tokens: number; runs: number }>();

    for (const entry of entries) {
      const key = this.getBreakdownKey(entry, dimension);
      const existing = breakdown.get(key) || { cost: 0, tokens: 0, runs: 0 };
      breakdown.set(key, {
        cost: existing.cost + entry.totalCost,
        tokens: existing.tokens + entry.totalTokens,
        runs: existing.runs + 1,
      });
    }

    const totalCost = Array.from(breakdown.values()).reduce((sum, v) => sum + v.cost, 0);
    const totalTokens = Array.from(breakdown.values()).reduce((sum, v) => sum + v.tokens, 0);

    const breakdownEntries = Array.from(breakdown.entries())
      .map(([key, value]) => ({
        key,
        cost: value.cost,
        tokens: value.tokens,
        runs: value.runs,
        percentage: totalCost > 0 ? (value.cost / totalCost) * 100 : 0,
      }))
      .sort((a, b) => b.cost - a.cost);

    return {
      dimension,
      entries: breakdownEntries,
      totalCost,
      totalTokens,
    };
  }

  /**
   * Get budget status for a period
   */
  getBudgetStatus(period: TimePeriod): BudgetStatus | null {
    const limit = this.config.budget[`${period}Limit`];
    if (!limit) return null;

    const tracking = this.budgetTracking[period];
    this.resetBudgetIfNeeded(period);

    const used = tracking.cost;
    const remaining = Math.max(0, limit - used);
    const percentUsed = (used / limit) * 100;
    const exceeded = used > limit;

    // Calculate projection if we have enough data
    let projectedEndOfPeriod: number | undefined;
    const elapsed = Date.now() - tracking.lastReset.getTime();
    const periodDuration = this.getPeriodDuration(period);
    if (elapsed > 0 && elapsed < periodDuration) {
      const rate = used / elapsed;
      projectedEndOfPeriod = rate * periodDuration;
    }

    return {
      period,
      limit,
      used,
      remaining,
      percentUsed,
      exceeded,
      projectedEndOfPeriod,
    };
  }

  /**
   * Get all budget statuses
   */
  getAllBudgetStatuses(): BudgetStatus[] {
    const periods: TimePeriod[] = ['hourly', 'daily', 'weekly', 'monthly'];
    return periods
      .map((period) => this.getBudgetStatus(period))
      .filter((status): status is BudgetStatus => status !== null);
  }

  /**
   * Get cost trends over time
   */
  getCostTrends(
    period: TimePeriod,
    granularity: 'hourly' | 'daily' = 'daily'
  ): CostTrendPoint[] {
    const { start, end } = this.getDateRange(period);
    const entries = this.getEntriesInRange(start, end);

    // Group by granularity
    const buckets = new Map<string, { cost: number; tokens: number; runs: number }>();

    for (const entry of entries) {
      const bucket = this.getBucketKey(entry.timestamp, granularity);
      const existing = buckets.get(bucket) || { cost: 0, tokens: 0, runs: 0 };
      buckets.set(bucket, {
        cost: existing.cost + entry.totalCost,
        tokens: existing.tokens + entry.totalTokens,
        runs: existing.runs + 1,
      });
    }

    return Array.from(buckets.entries())
      .map(([timestamp, data]) => ({
        timestamp,
        cost: data.cost,
        tokens: data.tokens,
        runs: data.runs,
      }))
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  }

  /**
   * Get top cost drivers
   */
  getTopCostDrivers(limit: number = 10): Array<{
    modelId: string;
    datasetId: string;
    cost: number;
    percentage: number;
  }> {
    const drivers = new Map<string, { cost: number; modelId: string; datasetId: string }>();

    for (const entry of this.entries) {
      const key = `${entry.modelId}:${entry.datasetId}`;
      const existing = drivers.get(key) || {
        cost: 0,
        modelId: entry.modelId,
        datasetId: entry.datasetId,
      };
      drivers.set(key, {
        ...existing,
        cost: existing.cost + entry.totalCost,
      });
    }

    const totalCost = Array.from(drivers.values()).reduce((sum, d) => sum + d.cost, 0);

    return Array.from(drivers.values())
      .map((driver) => ({
        modelId: driver.modelId,
        datasetId: driver.datasetId,
        cost: driver.cost,
        percentage: totalCost > 0 ? (driver.cost / totalCost) * 100 : 0,
      }))
      .sort((a, b) => b.cost - a.cost)
      .slice(0, limit);
  }

  /**
   * Export cost data
   */
  exportData(format: 'json' | 'csv' = 'json'): string {
    if (format === 'csv') {
      const headers = [
        'runId',
        'jobId',
        'timestamp',
        'modelId',
        'datasetId',
        'totalCost',
        'totalTokens',
        'promptTokens',
        'completionTokens',
        'testCount',
        'avgCostPerTest',
      ];

      const rows = this.entries.map((entry) => [
        entry.runId,
        entry.jobId,
        entry.timestamp.toISOString(),
        entry.modelId,
        entry.datasetId,
        entry.totalCost.toFixed(4),
        entry.totalTokens,
        entry.promptTokens,
        entry.completionTokens,
        entry.testCount,
        entry.avgCostPerTest.toFixed(4),
      ]);

      return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    }

    return JSON.stringify(this.entries, null, 2);
  }

  /**
   * Clear all cost data
   */
  clear(): void {
    this.entries = [];
    this.resetAllBudgets();
  }

  /**
   * Get total cost across all time
   */
  getTotalCost(): number {
    return this.entries.reduce((sum, e) => sum + e.totalCost, 0);
  }

  /**
   * Get total tokens across all time
   */
  getTotalTokens(): number {
    return this.entries.reduce((sum, e) => sum + e.totalTokens, 0);
  }

  /**
   * Create cost entry from run summary
   */
  private createCostEntry(jobId: string, runSummary: RunSummary): CostEntry {
    const results = runSummary.results || [];
    const promptTokens = results.reduce(
      (sum, r) => sum + ((r.metadata as any)?.tokenUsage?.prompt ?? 0),
      0
    );
    const completionTokens = results.reduce(
      (sum, r) => sum + ((r.metadata as any)?.tokenUsage?.completion ?? 0),
      0
    );
    const testCount = results.length || 1;

    return {
      runId: runSummary.runId,
      jobId,
      timestamp: runSummary.startTime,
      modelId: runSummary.config.modelId,
      datasetId: runSummary.datasetId,
      totalCost: (runSummary as any).totalCost ?? 0,
      totalTokens: (runSummary as any).totalTokens ?? 0,
      promptTokens,
      completionTokens,
      testCount,
      avgCostPerTest: ((runSummary as any).totalCost ?? 0) / testCount,
    };
  }

  /**
   * Update budget tracking with new cost
   */
  private updateBudgetTracking(cost: number): void {
    const now = new Date();

    // Reset budgets if needed
    this.resetBudgetIfNeeded('hourly');
    this.resetBudgetIfNeeded('daily');
    this.resetBudgetIfNeeded('weekly');
    this.resetBudgetIfNeeded('monthly');

    // Add cost to all periods
    this.budgetTracking.hourly.cost += cost;
    this.budgetTracking.daily.cost += cost;
    this.budgetTracking.weekly.cost += cost;
    this.budgetTracking.monthly.cost += cost;
  }

  /**
   * Reset budget if period has elapsed
   */
  private resetBudgetIfNeeded(period: TimePeriod): void {
    const tracking = this.budgetTracking[period];
    const now = new Date();
    const lastReset = tracking.lastReset;

    let shouldReset = false;

    switch (period) {
      case 'hourly':
        shouldReset = now.getHours() !== lastReset.getHours();
        break;
      case 'daily':
        shouldReset = now.getDate() !== lastReset.getDate();
        break;
      case 'weekly':
        const weekDiff = Math.floor((now.getTime() - lastReset.getTime()) / (7 * 24 * 60 * 60 * 1000));
        shouldReset = weekDiff >= 1;
        break;
      case 'monthly':
        shouldReset = now.getMonth() !== lastReset.getMonth();
        break;
    }

    if (shouldReset) {
      tracking.cost = 0;
      tracking.lastReset = now;
    }
  }

  /**
   * Reset all budget tracking
   */
  private resetAllBudgets(): void {
    const now = new Date();
    this.budgetTracking = {
      hourly: { cost: 0, lastReset: now },
      daily: { cost: 0, lastReset: now },
      weekly: { cost: 0, lastReset: now },
      monthly: { cost: 0, lastReset: now },
    };
  }

  /**
   * Check budget limits and emit warnings
   */
  private async checkBudgetLimits(): Promise<void> {
    const statuses = this.getAllBudgetStatuses();
    const alertThreshold = this.config.budget.alertThreshold || 80;

    for (const status of statuses) {
      if (status.exceeded) {
        this.log(`Budget exceeded for ${status.period}: $${status.used.toFixed(2)} / $${status.limit.toFixed(2)}`);
      } else if (status.percentUsed >= alertThreshold) {
        this.log(
          `Budget alert for ${status.period}: ${status.percentUsed.toFixed(1)}% used ($${status.used.toFixed(2)} / $${status.limit.toFixed(2)})`
        );
      }
    }
  }

  /**
   * Get date range for period
   */
  private getDateRange(
    period: TimePeriod,
    startDate?: Date,
    endDate?: Date
  ): { start: Date; end: Date } {
    const now = new Date();
    const end = endDate || now;

    if (startDate) {
      return { start: startDate, end };
    }

    const start = new Date(end);

    switch (period) {
      case 'hourly':
        start.setHours(start.getHours() - 1);
        break;
      case 'daily':
        start.setDate(start.getDate() - 1);
        break;
      case 'weekly':
        start.setDate(start.getDate() - 7);
        break;
      case 'monthly':
        start.setMonth(start.getMonth() - 1);
        break;
    }

    return { start, end };
  }

  /**
   * Get period duration in milliseconds
   */
  private getPeriodDuration(period: TimePeriod): number {
    switch (period) {
      case 'hourly':
        return 60 * 60 * 1000;
      case 'daily':
        return 24 * 60 * 60 * 1000;
      case 'weekly':
        return 7 * 24 * 60 * 60 * 1000;
      case 'monthly':
        return 30 * 24 * 60 * 60 * 1000; // Approximate
    }
  }

  /**
   * Get entries in date range
   */
  private getEntriesInRange(start: Date, end: Date): CostEntry[] {
    return this.entries.filter(
      (entry) => entry.timestamp >= start && entry.timestamp <= end
    );
  }

  /**
   * Get breakdown key for an entry
   */
  private getBreakdownKey(entry: CostEntry, dimension: CostDimension): string {
    switch (dimension) {
      case CostDimension.MODEL:
        return entry.modelId;
      case CostDimension.DATASET:
        return entry.datasetId;
      case CostDimension.RUNNER:
        return entry.modelId.split('/')[0] || entry.modelId; // Provider name
      case CostDimension.TIME:
        return entry.timestamp.toISOString().split('T')[0]; // Date only
    }
  }

  /**
   * Get bucket key for time-based grouping
   */
  private getBucketKey(timestamp: Date, granularity: 'hourly' | 'daily'): string {
    const iso = timestamp.toISOString();
    if (granularity === 'hourly') {
      return iso.substring(0, 13); // YYYY-MM-DDTHH
    }
    return iso.substring(0, 10); // YYYY-MM-DD
  }

  /**
   * Load persisted cost data
   */
  private loadPersistedData(): void {
    // Implementation depends on storage mechanism (file system, database, etc.)
    // For now, this is a placeholder
    this.log('Loading persisted cost data from:', this.config.persistPath);
  }

  /**
   * Persist cost data
   */
  private async persistData(): Promise<void> {
    // Implementation depends on storage mechanism (file system, database, etc.)
    // For now, this is a placeholder
    this.log('Persisting cost data to:', this.config.persistPath);
  }

  /**
   * Log if verbose mode is enabled
   */
  private log(...args: any[]): void {
    if (this.config.verbose) {
      console.log('[CostTracker]', ...args);
    }
  }
}

/**
 * Create a singleton cost tracker
 */
let globalCostTracker: CostTracker | null = null;

export function getCostTracker(config?: CostTrackerConfig): CostTracker {
  if (!globalCostTracker) {
    globalCostTracker = new CostTracker(config);
  }
  return globalCostTracker;
}

/**
 * Helper function to format cost
 */
export function formatCost(cost: number): string {
  return `$${cost.toFixed(4)}`;
}

/**
 * Helper function to format tokens
 */
export function formatTokens(tokens: number): string {
  if (tokens >= 1000000) {
    return `${(tokens / 1000000).toFixed(2)}M`;
  }
  if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(2)}K`;
  }
  return tokens.toString();
}
