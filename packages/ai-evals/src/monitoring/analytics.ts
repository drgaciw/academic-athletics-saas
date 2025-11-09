/**
 * Vercel Analytics Integration for AI Evals
 *
 * Task 11.1: Integrate with Vercel Analytics
 * - Send eval metrics to Vercel Analytics for tracking
 * - Add custom events for eval runs, failures, and regressions
 * - Track key metrics: run duration, pass rate, cost, regression count
 *
 * Usage:
 * ```typescript
 * const analytics = new AnalyticsTracker();
 * await analytics.trackEvalRun(report);
 * await analytics.trackRegression(regression);
 * ```
 */

import { track } from '@vercel/analytics/server';
import type {
  EvalReport,
  Regression,
  Metrics,
  JobStatus,
  RegressionSeverity,
} from '../types';

/**
 * Analytics event types
 */
export enum AnalyticsEventType {
  EVAL_RUN_STARTED = 'eval_run_started',
  EVAL_RUN_COMPLETED = 'eval_run_completed',
  EVAL_RUN_FAILED = 'eval_run_failed',
  REGRESSION_DETECTED = 'regression_detected',
  BASELINE_UPDATED = 'baseline_updated',
  COST_THRESHOLD_EXCEEDED = 'cost_threshold_exceeded',
  PERFORMANCE_DEGRADATION = 'performance_degradation',
}

/**
 * Configuration for analytics tracking
 */
export interface AnalyticsConfig {
  enabled?: boolean;
  verbose?: boolean;
  sampleRate?: number; // 0.0 to 1.0, for sampling events
  endpoint?: string; // Custom analytics endpoint (if not using Vercel)
}

/**
 * Event metadata for eval runs
 */
export interface EvalRunMetadata {
  jobId: string;
  datasetIds?: string[];
  modelIds?: string[];
  totalTests: number;
  duration: number; // milliseconds
  passRate: number; // 0-100
  accuracy: number; // 0-100
  avgLatency: number; // milliseconds
  totalCost: number; // USD
  status: JobStatus;
  regressionCount?: number;
  timestamp: string;
}

/**
 * Event metadata for regressions
 */
export interface RegressionMetadata {
  jobId: string;
  testCaseId: string;
  metric: string;
  severity: RegressionSeverity;
  baseline: number;
  current: number;
  percentChange: number;
  category?: string;
  timestamp: string;
}

/**
 * Tracker for sending eval metrics to Vercel Analytics
 */
export class AnalyticsTracker {
  private config: Required<AnalyticsConfig>;
  private eventQueue: Array<{ type: string; data: any }> = [];
  private flushInterval?: NodeJS.Timeout;

  constructor(config: AnalyticsConfig = {}) {
    this.config = {
      enabled: config.enabled ?? process.env.VERCEL_ANALYTICS_ENABLED === 'true',
      verbose: config.verbose ?? false,
      sampleRate: config.sampleRate ?? 1.0,
      endpoint: config.endpoint ?? '',
    };

    // Auto-flush queue every 30 seconds
    if (this.config.enabled) {
      this.flushInterval = setInterval(() => this.flush(), 30000);
    }
  }

  /**
   * Track the start of an eval run
   */
  async trackEvalRunStarted(
    jobId: string,
    datasetIds: string[],
    modelIds: string[]
  ): Promise<void> {
    if (!this.shouldTrack()) return;

    const metadata = {
      jobId,
      datasetIds: datasetIds.join(','),
      modelIds: modelIds.join(','),
      timestamp: new Date().toISOString(),
    };

    await this.sendEvent(AnalyticsEventType.EVAL_RUN_STARTED, metadata);
    this.log('Eval run started tracked:', metadata);
  }

  /**
   * Track a completed eval run
   */
  async trackEvalRun(report: EvalReport): Promise<void> {
    if (!this.shouldTrack()) return;

    const metadata: EvalRunMetadata = {
      jobId: report.jobId,
      datasetIds: report.runSummaries.map((r) => r.datasetId),
      modelIds: report.runSummaries.map((r) => r.config.modelId),
      totalTests: report.summary.totalTests,
      duration: report.summary.duration,
      passRate: (report.summary.passed / report.summary.totalTests) * 100,
      accuracy: report.summary.accuracy,
      avgLatency: report.summary.avgLatency,
      totalCost: report.summary.totalCost,
      status: report.summary.status,
      regressionCount: report.regressions?.length || 0,
      timestamp: report.generatedAt.toISOString(),
    };

    const eventType =
      report.summary.status === 'completed'
        ? AnalyticsEventType.EVAL_RUN_COMPLETED
        : AnalyticsEventType.EVAL_RUN_FAILED;

    await this.sendEvent(eventType, metadata);
    this.log('Eval run tracked:', metadata);

    // Track individual regressions if any
    if (report.regressions && report.regressions.length > 0) {
      for (const regression of report.regressions) {
        await this.trackRegression(report.jobId, regression);
      }
    }
  }

  /**
   * Track a regression detection
   */
  async trackRegression(jobId: string, regression: Regression): Promise<void> {
    if (!this.shouldTrack()) return;

    const metadata: RegressionMetadata = {
      jobId,
      testCaseId: regression.testCaseId,
      metric: regression.metric,
      severity: regression.severity,
      baseline: regression.baseline,
      current: regression.current,
      percentChange: regression.percentChange,
      category: regression.category,
      timestamp: new Date().toISOString(),
    };

    await this.sendEvent(AnalyticsEventType.REGRESSION_DETECTED, metadata);
    this.log('Regression tracked:', metadata);
  }

  /**
   * Track baseline update
   */
  async trackBaselineUpdate(
    baselineId: string,
    name: string,
    metrics: Metrics
  ): Promise<void> {
    if (!this.shouldTrack()) return;

    const metadata = {
      baselineId,
      name,
      accuracy: metrics.accuracy,
      passRate: metrics.passRate,
      avgLatency: metrics.avgLatency,
      totalCost: metrics.totalCost,
      timestamp: new Date().toISOString(),
    };

    await this.sendEvent(AnalyticsEventType.BASELINE_UPDATED, metadata);
    this.log('Baseline update tracked:', metadata);
  }

  /**
   * Track cost threshold exceeded
   */
  async trackCostThresholdExceeded(
    jobId: string,
    actualCost: number,
    threshold: number
  ): Promise<void> {
    if (!this.shouldTrack()) return;

    const metadata = {
      jobId,
      actualCost,
      threshold,
      percentOver: ((actualCost - threshold) / threshold) * 100,
      timestamp: new Date().toISOString(),
    };

    await this.sendEvent(AnalyticsEventType.COST_THRESHOLD_EXCEEDED, metadata);
    this.log('Cost threshold exceeded tracked:', metadata);
  }

  /**
   * Track performance degradation
   */
  async trackPerformanceDegradation(
    jobId: string,
    metric: string,
    baseline: number,
    current: number
  ): Promise<void> {
    if (!this.shouldTrack()) return;

    const metadata = {
      jobId,
      metric,
      baseline,
      current,
      percentChange: ((current - baseline) / baseline) * 100,
      timestamp: new Date().toISOString(),
    };

    await this.sendEvent(AnalyticsEventType.PERFORMANCE_DEGRADATION, metadata);
    this.log('Performance degradation tracked:', metadata);
  }

  /**
   * Send a custom analytics event
   */
  async sendEvent(eventType: string, metadata: Record<string, any>): Promise<void> {
    if (!this.config.enabled) return;

    try {
      // Use Vercel Analytics track function
      await track(eventType, metadata);
    } catch (error) {
      console.error('Failed to send analytics event:', error);
      // Queue for retry
      this.eventQueue.push({ type: eventType, data: metadata });
    }
  }

  /**
   * Flush queued events
   */
  private async flush(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    for (const event of events) {
      try {
        await track(event.type, event.data);
      } catch (error) {
        console.error('Failed to flush analytics event:', error);
      }
    }
  }

  /**
   * Determine if event should be tracked based on sample rate
   */
  private shouldTrack(): boolean {
    if (!this.config.enabled) return false;
    return Math.random() < this.config.sampleRate;
  }

  /**
   * Log if verbose mode is enabled
   */
  private log(...args: any[]): void {
    if (this.config.verbose) {
      console.log('[Analytics]', ...args);
    }
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    this.flush();
  }
}

/**
 * Create a singleton analytics tracker
 */
let globalTracker: AnalyticsTracker | null = null;

export function getAnalyticsTracker(config?: AnalyticsConfig): AnalyticsTracker {
  if (!globalTracker) {
    globalTracker = new AnalyticsTracker(config);
  }
  return globalTracker;
}

/**
 * Helper function to track eval run
 */
export async function trackEvalRun(report: EvalReport): Promise<void> {
  const tracker = getAnalyticsTracker();
  await tracker.trackEvalRun(report);
}

/**
 * Helper function to track regression
 */
export async function trackRegression(jobId: string, regression: Regression): Promise<void> {
  const tracker = getAnalyticsTracker();
  await tracker.trackRegression(jobId, regression);
}

/**
 * Metrics aggregator for analytics dashboard
 */
export class MetricsAggregator {
  /**
   * Aggregate metrics from multiple eval runs
   */
  aggregateRunMetrics(reports: EvalReport[]): {
    totalRuns: number;
    avgPassRate: number;
    avgAccuracy: number;
    avgLatency: number;
    totalCost: number;
    totalTests: number;
    totalRegressions: number;
    criticalRegressions: number;
  } {
    const totalRuns = reports.length;
    const totalTests = reports.reduce((sum, r) => sum + r.summary.totalTests, 0);
    const totalCost = reports.reduce((sum, r) => sum + r.summary.totalCost, 0);
    const totalRegressions = reports.reduce((sum, r) => sum + (r.regressions?.length || 0), 0);
    const criticalRegressions = reports.reduce(
      (sum, r) => sum + (r.regressions?.filter((reg) => reg.severity === 'critical').length || 0),
      0
    );

    const avgPassRate =
      reports.reduce(
        (sum, r) => sum + (r.summary.passed / r.summary.totalTests) * 100,
        0
      ) / totalRuns;

    const avgAccuracy = reports.reduce((sum, r) => sum + r.summary.accuracy, 0) / totalRuns;
    const avgLatency = reports.reduce((sum, r) => sum + r.summary.avgLatency, 0) / totalRuns;

    return {
      totalRuns,
      avgPassRate,
      avgAccuracy,
      avgLatency,
      totalCost,
      totalTests,
      totalRegressions,
      criticalRegressions,
    };
  }

  /**
   * Calculate trend data for time-series visualization
   */
  calculateTrends(
    reports: EvalReport[],
    metric: 'accuracy' | 'passRate' | 'latency' | 'cost'
  ): Array<{ timestamp: string; value: number }> {
    return reports
      .map((report) => {
        let value: number;
        switch (metric) {
          case 'accuracy':
            value = report.summary.accuracy;
            break;
          case 'passRate':
            value = (report.summary.passed / report.summary.totalTests) * 100;
            break;
          case 'latency':
            value = report.summary.avgLatency;
            break;
          case 'cost':
            value = report.summary.totalCost;
            break;
        }
        return {
          timestamp: report.generatedAt.toISOString(),
          value,
        };
      })
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  }
}
