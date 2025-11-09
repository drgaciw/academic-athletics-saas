/**
 * Benchmarking Tools (Task 12.3)
 *
 * Tools for benchmarking evaluation components and comparing performance
 */

import { PerformanceMonitor, ComponentTiming } from './monitor';
import { CacheStats } from './cache';

/**
 * Benchmark configuration
 */
export interface BenchmarkConfig {
  name: string;
  description?: string;
  iterations?: number;
  warmupIterations?: number;
  parallel?: boolean;
  concurrency?: number;
}

/**
 * Benchmark result
 */
export interface BenchmarkResult {
  name: string;
  description?: string;
  iterations: number;
  totalDuration: number;
  avgDuration: number;
  minDuration: number;
  maxDuration: number;
  medianDuration: number;
  p95Duration: number;
  p99Duration: number;
  stdDeviation: number;
  throughput: number; // operations per second
  memoryUsage?: {
    before: number;
    after: number;
    delta: number;
  };
}

/**
 * Comparison result between two benchmarks
 */
export interface BenchmarkComparison {
  baseline: BenchmarkResult;
  current: BenchmarkResult;
  improvement: {
    durationPercent: number;
    throughputPercent: number;
    memoryPercent: number;
  };
  verdict: 'faster' | 'slower' | 'similar';
  significance: 'significant' | 'moderate' | 'minor' | 'negligible';
}

/**
 * Benchmark suite result
 */
export interface BenchmarkSuiteResult {
  name: string;
  timestamp: Date;
  benchmarks: BenchmarkResult[];
  summary: {
    totalBenchmarks: number;
    totalDuration: number;
    fastestBenchmark: string;
    slowestBenchmark: string;
    avgThroughput: number;
  };
}

/**
 * Benchmarking utility
 */
export class Benchmark {
  private monitor: PerformanceMonitor;
  private results: Map<string, BenchmarkResult[]> = new Map();

  constructor() {
    this.monitor = new PerformanceMonitor();
  }

  /**
   * Run a benchmark
   */
  async run<T>(
    config: BenchmarkConfig,
    fn: () => Promise<T>
  ): Promise<BenchmarkResult> {
    const iterations = config.iterations ?? 100;
    const warmupIterations = config.warmupIterations ?? 10;

    // Warmup phase
    console.log(`Running ${warmupIterations} warmup iterations for "${config.name}"...`);
    for (let i = 0; i < warmupIterations; i++) {
      await fn();
    }

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }

    const memBefore = process.memoryUsage().heapUsed;

    // Benchmark phase
    console.log(`Running ${iterations} benchmark iterations for "${config.name}"...`);
    const durations: number[] = [];
    const startTime = Date.now();

    if (config.parallel && config.concurrency) {
      // Run in parallel batches
      const batches = Math.ceil(iterations / config.concurrency);
      for (let batch = 0; batch < batches; batch++) {
        const batchSize = Math.min(
          config.concurrency,
          iterations - batch * config.concurrency
        );
        const promises: Promise<void>[] = [];

        for (let i = 0; i < batchSize; i++) {
          promises.push(
            (async () => {
              const iterStart = Date.now();
              await fn();
              durations.push(Date.now() - iterStart);
            })()
          );
        }

        await Promise.all(promises);
      }
    } else {
      // Run sequentially
      for (let i = 0; i < iterations; i++) {
        const iterStart = Date.now();
        await fn();
        durations.push(Date.now() - iterStart);
      }
    }

    const totalDuration = Date.now() - startTime;
    const memAfter = process.memoryUsage().heapUsed;

    // Calculate statistics
    const sorted = durations.sort((a, b) => a - b);
    const avgDuration = durations.reduce((a, b) => a + b, 0) / iterations;
    const variance =
      durations.reduce((sum, d) => sum + Math.pow(d - avgDuration, 2), 0) / iterations;
    const stdDeviation = Math.sqrt(variance);

    const result: BenchmarkResult = {
      name: config.name,
      description: config.description,
      iterations,
      totalDuration,
      avgDuration,
      minDuration: sorted[0],
      maxDuration: sorted[sorted.length - 1],
      medianDuration: this.percentile(sorted, 50),
      p95Duration: this.percentile(sorted, 95),
      p99Duration: this.percentile(sorted, 99),
      stdDeviation,
      throughput: (iterations / totalDuration) * 1000, // ops/sec
      memoryUsage: {
        before: memBefore,
        after: memAfter,
        delta: memAfter - memBefore,
      },
    };

    // Store result
    if (!this.results.has(config.name)) {
      this.results.set(config.name, []);
    }
    this.results.get(config.name)!.push(result);

    return result;
  }

  /**
   * Run a synchronous benchmark
   */
  runSync<T>(config: BenchmarkConfig, fn: () => T): BenchmarkResult {
    const iterations = config.iterations ?? 1000;
    const warmupIterations = config.warmupIterations ?? 100;

    // Warmup
    for (let i = 0; i < warmupIterations; i++) {
      fn();
    }

    if (global.gc) {
      global.gc();
    }

    const memBefore = process.memoryUsage().heapUsed;
    const durations: number[] = [];
    const startTime = Date.now();

    for (let i = 0; i < iterations; i++) {
      const iterStart = Date.now();
      fn();
      durations.push(Date.now() - iterStart);
    }

    const totalDuration = Date.now() - startTime;
    const memAfter = process.memoryUsage().heapUsed;

    const sorted = durations.sort((a, b) => a - b);
    const avgDuration = durations.reduce((a, b) => a + b, 0) / iterations;
    const variance =
      durations.reduce((sum, d) => sum + Math.pow(d - avgDuration, 2), 0) / iterations;
    const stdDeviation = Math.sqrt(variance);

    const result: BenchmarkResult = {
      name: config.name,
      description: config.description,
      iterations,
      totalDuration,
      avgDuration,
      minDuration: sorted[0],
      maxDuration: sorted[sorted.length - 1],
      medianDuration: this.percentile(sorted, 50),
      p95Duration: this.percentile(sorted, 95),
      p99Duration: this.percentile(sorted, 99),
      stdDeviation,
      throughput: (iterations / totalDuration) * 1000,
      memoryUsage: {
        before: memBefore,
        after: memAfter,
        delta: memAfter - memBefore,
      },
    };

    if (!this.results.has(config.name)) {
      this.results.set(config.name, []);
    }
    this.results.get(config.name)!.push(result);

    return result;
  }

  /**
   * Compare two benchmark results
   */
  compare(baseline: BenchmarkResult, current: BenchmarkResult): BenchmarkComparison {
    const durationImprovement =
      ((baseline.avgDuration - current.avgDuration) / baseline.avgDuration) * 100;
    const throughputImprovement =
      ((current.throughput - baseline.throughput) / baseline.throughput) * 100;
    const memoryImprovement = baseline.memoryUsage && current.memoryUsage
      ? ((baseline.memoryUsage.delta - current.memoryUsage.delta) /
          baseline.memoryUsage.delta) * 100
      : 0;

    let verdict: 'faster' | 'slower' | 'similar';
    let significance: 'significant' | 'moderate' | 'minor' | 'negligible';

    if (Math.abs(durationImprovement) < 5) {
      verdict = 'similar';
      significance = 'negligible';
    } else if (durationImprovement > 0) {
      verdict = 'faster';
      if (durationImprovement > 30) significance = 'significant';
      else if (durationImprovement > 15) significance = 'moderate';
      else significance = 'minor';
    } else {
      verdict = 'slower';
      if (Math.abs(durationImprovement) > 30) significance = 'significant';
      else if (Math.abs(durationImprovement) > 15) significance = 'moderate';
      else significance = 'minor';
    }

    return {
      baseline,
      current,
      improvement: {
        durationPercent: durationImprovement,
        throughputPercent: throughputImprovement,
        memoryPercent: memoryImprovement,
      },
      verdict,
      significance,
    };
  }

  /**
   * Get benchmark history
   */
  getHistory(name: string): BenchmarkResult[] {
    return this.results.get(name) ?? [];
  }

  /**
   * Clear all results
   */
  clear(): void {
    this.results.clear();
  }

  /**
   * Calculate percentile
   */
  private percentile(sorted: number[], p: number): number {
    const index = Math.ceil((sorted.length * p) / 100) - 1;
    return sorted[Math.max(0, index)];
  }

  /**
   * Print benchmark result
   */
  static print(result: BenchmarkResult): void {
    console.log(`\n┌─ Benchmark: ${result.name}`);
    if (result.description) {
      console.log(`│  ${result.description}`);
    }
    console.log(`├─ Statistics:`);
    console.log(`│  Iterations:     ${result.iterations}`);
    console.log(`│  Total Duration: ${result.totalDuration.toFixed(2)}ms`);
    console.log(`│  Avg Duration:   ${result.avgDuration.toFixed(3)}ms`);
    console.log(`│  Min Duration:   ${result.minDuration.toFixed(3)}ms`);
    console.log(`│  Max Duration:   ${result.maxDuration.toFixed(3)}ms`);
    console.log(`│  Median:         ${result.medianDuration.toFixed(3)}ms`);
    console.log(`│  P95:            ${result.p95Duration.toFixed(3)}ms`);
    console.log(`│  P99:            ${result.p99Duration.toFixed(3)}ms`);
    console.log(`│  Std Deviation:  ${result.stdDeviation.toFixed(3)}ms`);
    console.log(`│  Throughput:     ${result.throughput.toFixed(2)} ops/sec`);
    if (result.memoryUsage) {
      console.log(`├─ Memory:`);
      console.log(`│  Delta:          ${(result.memoryUsage.delta / 1024 / 1024).toFixed(2)}MB`);
    }
    console.log(`└─`);
  }

  /**
   * Print comparison result
   */
  static printComparison(comparison: BenchmarkComparison): void {
    console.log(`\n┌─ Benchmark Comparison`);
    console.log(`├─ Baseline:  ${comparison.baseline.name}`);
    console.log(`│  Duration:  ${comparison.baseline.avgDuration.toFixed(3)}ms`);
    console.log(`│  Throughput: ${comparison.baseline.throughput.toFixed(2)} ops/sec`);
    console.log(`├─ Current:   ${comparison.current.name}`);
    console.log(`│  Duration:  ${comparison.current.avgDuration.toFixed(3)}ms`);
    console.log(`│  Throughput: ${comparison.current.throughput.toFixed(2)} ops/sec`);
    console.log(`├─ Improvement:`);
    console.log(`│  Duration:  ${comparison.improvement.durationPercent > 0 ? '+' : ''}${comparison.improvement.durationPercent.toFixed(2)}%`);
    console.log(`│  Throughput: ${comparison.improvement.throughputPercent > 0 ? '+' : ''}${comparison.improvement.throughputPercent.toFixed(2)}%`);
    console.log(`│  Memory:    ${comparison.improvement.memoryPercent > 0 ? '+' : ''}${comparison.improvement.memoryPercent.toFixed(2)}%`);
    console.log(`├─ Verdict:   ${comparison.verdict.toUpperCase()}`);
    console.log(`└─ Significance: ${comparison.significance.toUpperCase()}`);
  }
}

/**
 * Benchmark suite for running multiple benchmarks
 */
export class BenchmarkSuite {
  private benchmarks: Array<{
    config: BenchmarkConfig;
    fn: () => Promise<any>;
  }> = [];
  private results: BenchmarkResult[] = [];

  /**
   * Add benchmark to suite
   */
  add(config: BenchmarkConfig, fn: () => Promise<any>): this {
    this.benchmarks.push({ config, fn });
    return this;
  }

  /**
   * Run all benchmarks in suite
   */
  async run(): Promise<BenchmarkSuiteResult> {
    const startTime = Date.now();
    const benchmark = new Benchmark();

    this.results = [];

    for (const { config, fn } of this.benchmarks) {
      console.log(`\n=== Running benchmark: ${config.name} ===`);
      const result = await benchmark.run(config, fn);
      this.results.push(result);
      Benchmark.print(result);
    }

    const totalDuration = Date.now() - startTime;
    const sorted = [...this.results].sort((a, b) => a.avgDuration - b.avgDuration);
    const avgThroughput =
      this.results.reduce((sum, r) => sum + r.throughput, 0) / this.results.length;

    return {
      name: 'Benchmark Suite',
      timestamp: new Date(),
      benchmarks: this.results,
      summary: {
        totalBenchmarks: this.results.length,
        totalDuration,
        fastestBenchmark: sorted[0]?.name ?? 'N/A',
        slowestBenchmark: sorted[sorted.length - 1]?.name ?? 'N/A',
        avgThroughput,
      },
    };
  }

  /**
   * Get results
   */
  getResults(): BenchmarkResult[] {
    return this.results;
  }

  /**
   * Clear suite
   */
  clear(): void {
    this.benchmarks = [];
    this.results = [];
  }

  /**
   * Print suite summary
   */
  static printSummary(suite: BenchmarkSuiteResult): void {
    console.log(`\n╔═══════════════════════════════════════╗`);
    console.log(`║     Benchmark Suite Summary          ║`);
    console.log(`╠═══════════════════════════════════════╣`);
    console.log(`║ Total Benchmarks: ${suite.summary.totalBenchmarks.toString().padEnd(19)}║`);
    console.log(`║ Total Duration:   ${(suite.summary.totalDuration / 1000).toFixed(2)}s${' '.repeat(16 - (suite.summary.totalDuration / 1000).toFixed(2).length)}║`);
    console.log(`║ Fastest:          ${suite.summary.fastestBenchmark.padEnd(19)}║`);
    console.log(`║ Slowest:          ${suite.summary.slowestBenchmark.padEnd(19)}║`);
    console.log(`║ Avg Throughput:   ${suite.summary.avgThroughput.toFixed(2)} ops/s${' '.repeat(11 - suite.summary.avgThroughput.toFixed(2).length)}║`);
    console.log(`╚═══════════════════════════════════════╝\n`);
  }
}

/**
 * Cache performance benchmark utility
 */
export async function benchmarkCache(
  cache: { get: (key: string) => any; set: (key: string, value: any) => void; getStats: () => CacheStats },
  operations: number = 10000
): Promise<{
  reads: BenchmarkResult;
  writes: BenchmarkResult;
  stats: CacheStats;
}> {
  const benchmark = new Benchmark();

  // Benchmark writes
  const writes = await benchmark.run(
    {
      name: 'cache-writes',
      description: 'Cache write operations',
      iterations: operations,
      warmupIterations: 100,
    },
    async () => {
      cache.set(`key-${Math.random()}`, { data: 'test-value' });
    }
  );

  // Pre-populate for read benchmark
  for (let i = 0; i < 1000; i++) {
    cache.set(`key-${i}`, { data: `value-${i}` });
  }

  // Benchmark reads
  const reads = await benchmark.run(
    {
      name: 'cache-reads',
      description: 'Cache read operations',
      iterations: operations,
      warmupIterations: 100,
    },
    async () => {
      cache.get(`key-${Math.floor(Math.random() * 1000)}`);
    }
  );

  return {
    reads,
    writes,
    stats: cache.getStats(),
  };
}
