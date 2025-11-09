/**
 * Performance Monitoring (Task 12.3)
 *
 * Tracks execution time for each component, identifies bottlenecks,
 * and detects performance regressions
 */

import { EventEmitter } from 'events';

/**
 * Performance measurement
 */
export interface PerformanceMeasurement {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

/**
 * Component timing statistics
 */
export interface ComponentTiming {
  component: string;
  totalCalls: number;
  totalDuration: number;
  avgDuration: number;
  minDuration: number;
  maxDuration: number;
  p50Duration: number;
  p95Duration: number;
  p99Duration: number;
}

/**
 * Performance bottleneck
 */
export interface Bottleneck {
  component: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  avgDuration: number;
  percentOfTotal: number;
  impact: string;
  recommendation: string;
}

/**
 * Performance baseline for regression detection
 */
export interface PerformanceBaseline {
  id: string;
  timestamp: Date;
  components: Map<string, ComponentTiming>;
  totalDuration: number;
}

/**
 * Performance regression
 */
export interface PerformanceRegression {
  component: string;
  baselineDuration: number;
  currentDuration: number;
  percentChange: number;
  severity: 'critical' | 'major' | 'minor';
  threshold: number;
}

/**
 * Performance report
 */
export interface PerformanceReport {
  id: string;
  timestamp: Date;
  totalDuration: number;
  components: ComponentTiming[];
  bottlenecks: Bottleneck[];
  regressions: PerformanceRegression[];
  summary: {
    totalComponents: number;
    totalCalls: number;
    avgCallDuration: number;
    slowestComponent: string;
    fastestComponent: string;
  };
  baseline?: string; // Baseline ID if compared
}

/**
 * Performance monitor for tracking execution times
 */
export class PerformanceMonitor extends EventEmitter {
  private measurements = new Map<string, PerformanceMeasurement[]>();
  private activeTimers = new Map<string, number>();
  private baselines = new Map<string, PerformanceBaseline>();
  private sessionStart: number = 0;

  constructor() {
    super();
  }

  /**
   * Start a performance measurement
   */
  start(name: string, metadata?: Record<string, any>): void {
    if (this.sessionStart === 0) {
      this.sessionStart = Date.now();
    }

    const startTime = Date.now();
    this.activeTimers.set(name, startTime);

    const measurement: PerformanceMeasurement = {
      name,
      startTime,
      metadata,
    };

    if (!this.measurements.has(name)) {
      this.measurements.set(name, []);
    }

    this.measurements.get(name)!.push(measurement);
    this.emit('start', { name, startTime, metadata });
  }

  /**
   * End a performance measurement
   */
  end(name: string): number {
    const startTime = this.activeTimers.get(name);
    if (!startTime) {
      throw new Error(`No active timer found for: ${name}`);
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    const measurements = this.measurements.get(name);
    if (measurements) {
      const lastMeasurement = measurements[measurements.length - 1];
      lastMeasurement.endTime = endTime;
      lastMeasurement.duration = duration;
    }

    this.activeTimers.delete(name);
    this.emit('end', { name, duration });

    return duration;
  }

  /**
   * Measure async function execution time
   */
  async measure<T>(
    name: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    this.start(name, metadata);
    try {
      const result = await fn();
      this.end(name);
      return result;
    } catch (error) {
      this.end(name);
      throw error;
    }
  }

  /**
   * Measure sync function execution time
   */
  measureSync<T>(
    name: string,
    fn: () => T,
    metadata?: Record<string, any>
  ): T {
    this.start(name, metadata);
    try {
      const result = fn();
      this.end(name);
      return result;
    } catch (error) {
      this.end(name);
      throw error;
    }
  }

  /**
   * Get timing statistics for a component
   */
  getComponentTiming(component: string): ComponentTiming | undefined {
    const measurements = this.measurements.get(component);
    if (!measurements || measurements.length === 0) {
      return undefined;
    }

    const durations = measurements
      .filter((m) => m.duration !== undefined)
      .map((m) => m.duration!);

    if (durations.length === 0) {
      return undefined;
    }

    const sorted = durations.sort((a, b) => a - b);
    const totalDuration = durations.reduce((a, b) => a + b, 0);

    return {
      component,
      totalCalls: durations.length,
      totalDuration,
      avgDuration: totalDuration / durations.length,
      minDuration: sorted[0],
      maxDuration: sorted[sorted.length - 1],
      p50Duration: this.percentile(sorted, 50),
      p95Duration: this.percentile(sorted, 95),
      p99Duration: this.percentile(sorted, 99),
    };
  }

  /**
   * Get all component timings
   */
  getAllTimings(): ComponentTiming[] {
    const timings: ComponentTiming[] = [];
    for (const component of this.measurements.keys()) {
      const timing = this.getComponentTiming(component);
      if (timing) {
        timings.push(timing);
      }
    }
    return timings.sort((a, b) => b.totalDuration - a.totalDuration);
  }

  /**
   * Identify performance bottlenecks
   */
  identifyBottlenecks(thresholds?: {
    criticalMs?: number;
    criticalPercent?: number;
  }): Bottleneck[] {
    const timings = this.getAllTimings();
    const totalDuration = timings.reduce((sum, t) => sum + t.totalDuration, 0);

    const criticalMs = thresholds?.criticalMs ?? 1000;
    const criticalPercent = thresholds?.criticalPercent ?? 20;

    const bottlenecks: Bottleneck[] = [];

    for (const timing of timings) {
      const percentOfTotal = (timing.totalDuration / totalDuration) * 100;

      let severity: 'critical' | 'high' | 'medium' | 'low';
      let impact: string;
      let recommendation: string;

      if (timing.avgDuration > criticalMs || percentOfTotal > criticalPercent) {
        severity = 'critical';
        impact = `Accounts for ${percentOfTotal.toFixed(1)}% of total execution time`;
        recommendation = `Optimize ${timing.component} - avg ${timing.avgDuration.toFixed(0)}ms per call`;
      } else if (timing.avgDuration > criticalMs * 0.5 || percentOfTotal > criticalPercent * 0.5) {
        severity = 'high';
        impact = `Significant contributor at ${percentOfTotal.toFixed(1)}% of total time`;
        recommendation = `Consider optimizing ${timing.component}`;
      } else if (timing.avgDuration > criticalMs * 0.25 || percentOfTotal > criticalPercent * 0.25) {
        severity = 'medium';
        impact = `Moderate impact at ${percentOfTotal.toFixed(1)}% of total time`;
        recommendation = `Monitor ${timing.component} performance`;
      } else {
        severity = 'low';
        impact = `Low impact at ${percentOfTotal.toFixed(1)}% of total time`;
        recommendation = `No immediate action needed`;
      }

      bottlenecks.push({
        component: timing.component,
        severity,
        avgDuration: timing.avgDuration,
        percentOfTotal,
        impact,
        recommendation,
      });
    }

    return bottlenecks.sort((a, b) => b.percentOfTotal - a.percentOfTotal);
  }

  /**
   * Set performance baseline
   */
  setBaseline(id: string): PerformanceBaseline {
    const components = new Map<string, ComponentTiming>();
    const timings = this.getAllTimings();

    for (const timing of timings) {
      components.set(timing.component, timing);
    }

    const totalDuration = Date.now() - this.sessionStart;

    const baseline: PerformanceBaseline = {
      id,
      timestamp: new Date(),
      components,
      totalDuration,
    };

    this.baselines.set(id, baseline);
    this.emit('baseline-set', { id, baseline });

    return baseline;
  }

  /**
   * Detect performance regressions
   */
  detectRegressions(
    baselineId: string,
    thresholds?: {
      critical?: number; // % increase
      major?: number;
      minor?: number;
    }
  ): PerformanceRegression[] {
    const baseline = this.baselines.get(baselineId);
    if (!baseline) {
      throw new Error(`Baseline not found: ${baselineId}`);
    }

    const currentTimings = this.getAllTimings();
    const regressions: PerformanceRegression[] = [];

    const criticalThreshold = thresholds?.critical ?? 50; // 50% increase
    const majorThreshold = thresholds?.major ?? 25;
    const minorThreshold = thresholds?.minor ?? 10;

    for (const current of currentTimings) {
      const baselineTiming = baseline.components.get(current.component);
      if (!baselineTiming) continue;

      const percentChange =
        ((current.avgDuration - baselineTiming.avgDuration) / baselineTiming.avgDuration) * 100;

      if (percentChange > minorThreshold) {
        let severity: 'critical' | 'major' | 'minor';
        let threshold: number;

        if (percentChange > criticalThreshold) {
          severity = 'critical';
          threshold = criticalThreshold;
        } else if (percentChange > majorThreshold) {
          severity = 'major';
          threshold = majorThreshold;
        } else {
          severity = 'minor';
          threshold = minorThreshold;
        }

        regressions.push({
          component: current.component,
          baselineDuration: baselineTiming.avgDuration,
          currentDuration: current.avgDuration,
          percentChange,
          severity,
          threshold,
        });
      }
    }

    return regressions.sort((a, b) => b.percentChange - a.percentChange);
  }

  /**
   * Generate performance report
   */
  generateReport(baselineId?: string): PerformanceReport {
    const timings = this.getAllTimings();
    const bottlenecks = this.identifyBottlenecks();
    const totalDuration = Date.now() - this.sessionStart;

    let regressions: PerformanceRegression[] = [];
    if (baselineId) {
      regressions = this.detectRegressions(baselineId);
    }

    const totalCalls = timings.reduce((sum, t) => sum + t.totalCalls, 0);
    const avgCallDuration = totalCalls > 0 ? totalDuration / totalCalls : 0;

    const sorted = [...timings].sort((a, b) => b.avgDuration - a.avgDuration);

    return {
      id: `perf-report-${Date.now()}`,
      timestamp: new Date(),
      totalDuration,
      components: timings,
      bottlenecks,
      regressions,
      summary: {
        totalComponents: timings.length,
        totalCalls,
        avgCallDuration,
        slowestComponent: sorted[0]?.component ?? 'N/A',
        fastestComponent: sorted[sorted.length - 1]?.component ?? 'N/A',
      },
      baseline: baselineId,
    };
  }

  /**
   * Calculate percentile
   */
  private percentile(sorted: number[], p: number): number {
    const index = Math.ceil((sorted.length * p) / 100) - 1;
    return sorted[Math.max(0, index)];
  }

  /**
   * Reset all measurements
   */
  reset(): void {
    this.measurements.clear();
    this.activeTimers.clear();
    this.sessionStart = 0;
    this.emit('reset');
  }

  /**
   * Clear baselines
   */
  clearBaselines(): void {
    this.baselines.clear();
  }

  /**
   * Get baseline
   */
  getBaseline(id: string): PerformanceBaseline | undefined {
    return this.baselines.get(id);
  }

  /**
   * List all baselines
   */
  listBaselines(): string[] {
    return Array.from(this.baselines.keys());
  }
}

/**
 * Global performance monitor instance
 */
export const performanceMonitor = new PerformanceMonitor();

/**
 * Decorator for automatic performance measurement
 */
export function Measure(name?: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const measurementName = name || `${target.constructor.name}.${propertyKey}`;

    descriptor.value = async function (...args: any[]) {
      return performanceMonitor.measure(
        measurementName,
        () => originalMethod.apply(this, args)
      );
    };

    return descriptor;
  };
}
