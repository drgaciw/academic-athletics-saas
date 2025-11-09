/**
 * Baseline Comparison System (Task 5.3)
 *
 * Implements baseline storage and retrieval, regression detection,
 * and severity classification for performance changes.
 */

import {
  Baseline,
  Metrics,
  Regression,
  RegressionSeverity,
  BaselineComparison,
  CategoryMetrics,
} from '../types';

export interface BaselineConfig {
  name: string;
  description: string;
  runId: string;
  metrics: Metrics;
}

export interface RegressionThresholds {
  critical: number; // percentage change
  major: number;
  minor: number;
}

const DEFAULT_THRESHOLDS: Record<string, RegressionThresholds> = {
  accuracy: { critical: 10, major: 5, minor: 2 },
  passRate: { critical: 10, major: 5, minor: 2 },
  avgScore: { critical: 15, major: 8, minor: 3 },
  avgLatency: { critical: 50, major: 25, minor: 10 },
  totalCost: { critical: 40, major: 20, minor: 10 },
};

export class BaselineComparator {
  private baselines: Map<string, Baseline> = new Map();
  private activeBaseline?: Baseline;
  private thresholds: Record<string, RegressionThresholds>;

  constructor(customThresholds?: Partial<Record<string, RegressionThresholds>>) {
    this.thresholds = { ...DEFAULT_THRESHOLDS, ...customThresholds };
  }

  storeBaseline(config: BaselineConfig): string {
    const baseline: Baseline = {
      id: 'baseline-' + Date.now().toString(),
      name: config.name,
      description: config.description,
      runId: config.runId,
      metrics: config.metrics,
      isActive: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.baselines.set(baseline.id, baseline);
    return baseline.id;
  }

  getBaseline(baselineId: string): Baseline | undefined {
    return this.baselines.get(baselineId);
  }

  getAllBaselines(): Baseline[] {
    return Array.from(this.baselines.values());
  }

  setActiveBaseline(baselineId: string): void {
    const baseline = this.baselines.get(baselineId);
    if (!baseline) {
      throw new Error('Baseline ' + baselineId + ' not found');
    }

    if (this.activeBaseline) {
      this.activeBaseline.isActive = false;
      this.activeBaseline.updatedAt = new Date();
    }

    baseline.isActive = true;
    baseline.updatedAt = new Date();
    this.activeBaseline = baseline;
  }

  getActiveBaseline(): Baseline | undefined {
    return this.activeBaseline;
  }

  compareToBaseline(
    currentMetrics: Metrics,
    currentRunId: string,
    baselineId?: string
  ): BaselineComparison {
    const baseline = baselineId
      ? this.baselines.get(baselineId)
      : this.activeBaseline;

    if (!baseline) {
      throw new Error('No baseline available for comparison');
    }

    const regressions: Regression[] = [];
    const improvements: Regression[] = [];

    this.compareMetric(
      'accuracy',
      baseline.metrics.accuracy,
      currentMetrics.accuracy,
      'overall',
      regressions,
      improvements,
      false
    );

    this.compareMetric(
      'passRate',
      baseline.metrics.passRate,
      currentMetrics.passRate,
      'overall',
      regressions,
      improvements,
      false
    );

    this.compareMetric(
      'avgScore',
      baseline.metrics.avgScore,
      currentMetrics.avgScore,
      'overall',
      regressions,
      improvements,
      false
    );

    this.compareMetric(
      'avgLatency',
      baseline.metrics.avgLatency,
      currentMetrics.avgLatency,
      'overall',
      regressions,
      improvements,
      true
    );

    this.compareMetric(
      'totalCost',
      baseline.metrics.totalCost,
      currentMetrics.totalCost,
      'overall',
      regressions,
      improvements,
      true
    );

    for (const [category, categoryMetrics] of Object.entries(currentMetrics.breakdown)) {
      const baselineCategory = baseline.metrics.breakdown[category];
      if (baselineCategory) {
        this.compareCategoryMetrics(
          category,
          baselineCategory,
          categoryMetrics,
          regressions,
          improvements
        );
      }
    }

    const summary = {
      totalRegressions: regressions.length,
      criticalRegressions: regressions.filter((r) => r.severity === 'critical').length,
      majorRegressions: regressions.filter((r) => r.severity === 'major').length,
      minorRegressions: regressions.filter((r) => r.severity === 'minor').length,
      totalImprovements: improvements.length,
      overallChange: this.calculateOverallChange(baseline.metrics, currentMetrics),
    };

    return {
      baselineId: baseline.id,
      currentRunId,
      metrics: {
        baseline: baseline.metrics,
        current: currentMetrics,
      },
      regressions,
      improvements,
      summary,
    };
  }

  private compareMetric(
    metricName: string,
    baselineValue: number,
    currentValue: number,
    category: string,
    regressions: Regression[],
    improvements: Regression[],
    lowerIsBetter: boolean = false
  ): void {
    if (baselineValue === 0) return;

    const absoluteChange = currentValue - baselineValue;
    const percentChange = (absoluteChange / baselineValue) * 100;

    const isRegression = lowerIsBetter
      ? currentValue > baselineValue
      : currentValue < baselineValue;

    if (isRegression && Math.abs(percentChange) > (this.thresholds[metricName]?.minor ?? 0)) {
      const severity = this.classifySeverity(metricName, Math.abs(percentChange));

      regressions.push({
        testCaseId: category,
        metric: metricName,
        baseline: baselineValue,
        current: currentValue,
        percentChange,
        absoluteChange,
        severity,
        category,
      });
    } else if (!isRegression && Math.abs(percentChange) > 0) {
      improvements.push({
        testCaseId: category,
        metric: metricName,
        baseline: baselineValue,
        current: currentValue,
        percentChange,
        absoluteChange,
        severity: 'minor',
        category,
      });
    }
  }

  private compareCategoryMetrics(
    category: string,
    baselineMetrics: CategoryMetrics,
    currentMetrics: CategoryMetrics,
    regressions: Regression[],
    improvements: Regression[]
  ): void {
    this.compareMetric(
      'accuracy',
      baselineMetrics.accuracy,
      currentMetrics.accuracy,
      category,
      regressions,
      improvements,
      false
    );

    this.compareMetric(
      'avgScore',
      baselineMetrics.avgScore,
      currentMetrics.avgScore,
      category,
      regressions,
      improvements,
      false
    );

    this.compareMetric(
      'avgLatency',
      baselineMetrics.avgLatency,
      currentMetrics.avgLatency,
      category,
      regressions,
      improvements,
      true
    );
  }

  private classifySeverity(metricName: string, percentChange: number): RegressionSeverity {
    const thresholds = this.thresholds[metricName];
    if (!thresholds) return 'minor';

    if (percentChange >= thresholds.critical) {
      return 'critical';
    } else if (percentChange >= thresholds.major) {
      return 'major';
    } else {
      return 'minor';
    }
  }

  private calculateOverallChange(baseline: Metrics, current: Metrics): number {
    const weights = {
      accuracy: 0.4,
      avgScore: 0.3,
      avgLatency: 0.2,
      totalCost: 0.1,
    };

    let weightedChange = 0;

    if (baseline.accuracy > 0) {
      const accuracyChange = ((current.accuracy - baseline.accuracy) / baseline.accuracy) * 100;
      weightedChange += accuracyChange * weights.accuracy;
    }

    if (baseline.avgScore > 0) {
      const scoreChange = ((current.avgScore - baseline.avgScore) / baseline.avgScore) * 100;
      weightedChange += scoreChange * weights.avgScore;
    }

    if (baseline.avgLatency > 0) {
      const latencyChange = ((baseline.avgLatency - current.avgLatency) / baseline.avgLatency) * 100;
      weightedChange += latencyChange * weights.avgLatency;
    }

    if (baseline.totalCost > 0) {
      const costChange = ((baseline.totalCost - current.totalCost) / baseline.totalCost) * 100;
      weightedChange += costChange * weights.totalCost;
    }

    return weightedChange;
  }

  updateThresholds(metricName: string, thresholds: RegressionThresholds): void {
    this.thresholds[metricName] = thresholds;
  }

  getThresholds(): Record<string, RegressionThresholds> {
    return { ...this.thresholds };
  }

  deleteBaseline(baselineId: string): boolean {
    const baseline = this.baselines.get(baselineId);
    if (!baseline) return false;

    if (baseline.isActive) {
      this.activeBaseline = undefined;
    }

    return this.baselines.delete(baselineId);
  }

  reset(): void {
    this.baselines.clear();
    this.activeBaseline = undefined;
  }
}
