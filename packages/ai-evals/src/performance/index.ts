/**
 * Performance Optimization Module (Tasks 12.1-12.3)
 *
 * Exports caching, monitoring, and benchmarking utilities
 */

// Caching (Task 12.1)
export {
  LRUCache,
  ResponseCache,
  EmbeddingCache,
  QueryCache,
  CacheInvalidator,
  CacheManager,
  cacheManager,
  type CacheStats,
} from './cache';

// Streaming (Task 12.2)
export {
  DatasetStream,
  BatchProcessor,
  ResultWriter,
  type StreamConfig,
  type StreamStats,
} from './streaming';

// Monitoring (Task 12.3)
export {
  PerformanceMonitor,
  performanceMonitor,
  Measure,
  type PerformanceMeasurement,
  type ComponentTiming,
  type Bottleneck,
  type PerformanceBaseline,
  type PerformanceRegression,
  type PerformanceReport,
} from './monitor';

// Benchmarking (Task 12.3)
export {
  Benchmark,
  BenchmarkSuite,
  benchmarkCache,
  type BenchmarkConfig,
  type BenchmarkResult,
  type BenchmarkComparison,
  type BenchmarkSuiteResult,
} from './benchmarks';
