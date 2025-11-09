# Performance Optimization Module

## Overview

The Performance module provides caching, monitoring, and benchmarking utilities to optimize AI evaluation framework performance. This implements Tasks 12.1, 12.2, and 12.3 of the AI Evaluation Framework.

## Features

### 1. Caching Strategies (Task 12.1)

- **Response Cache**: Cache AI model outputs for identical inputs
- **Embedding Cache**: Cache expensive embedding computations
- **Query Cache**: Cache database query results
- **LRU Eviction**: Automatic least-recently-used eviction
- **TTL Support**: Time-to-live for cache entries
- **Cache Invalidation**: Manual and pattern-based invalidation

### 2. Parallel Execution Optimization (Task 12.2)

- **Connection Pooling**: Optimized database connections via Prisma
- **Memory-Efficient Streaming**: Process large datasets without OOM
- **Batch Processing**: Process items in configurable batches
- **Backpressure Handling**: Automatic flow control
- **Rate Limiting**: Respect provider rate limits

### 3. Performance Monitoring (Task 12.3)

- **Component Timing**: Track execution time for each component
- **Bottleneck Detection**: Identify performance bottlenecks
- **Regression Detection**: Compare against baseline performance
- **Performance Reports**: Detailed timing breakdowns
- **Benchmarking Tools**: Measure and compare performance

## Quick Start

### Basic Caching

```typescript
import { cacheManager } from '@aah/ai-evals/performance';

// Cache AI responses
const modelConfig = { provider: 'openai', model: 'gpt-4' };
const input = 'What is NCAA eligibility?';

// Check cache first
let response = cacheManager.responseCache.get(input, modelConfig);
if (!response) {
  // Generate response
  response = await generateResponse(input, modelConfig);
  // Cache for future use
  cacheManager.responseCache.set(input, modelConfig, response);
}

// Cache embeddings
let embedding = cacheManager.embeddingCache.get(text);
if (!embedding) {
  embedding = await generateEmbedding(text);
  cacheManager.embeddingCache.set(text, embedding);
}

// Cache database queries
const queryKey = 'student-metrics';
const params = { studentId: '123' };
let result = cacheManager.queryCache.get(queryKey, params);
if (!result) {
  result = await prisma.studentProfile.findUnique({
    where: { studentId: params.studentId },
    include: { performanceMetrics: true },
  });
  cacheManager.queryCache.set(queryKey, params, result);
}
```

### Performance Monitoring

```typescript
import { performanceMonitor } from '@aah/ai-evals/performance';

// Manual timing
performanceMonitor.start('dataset-loading');
const dataset = await loadDataset('compliance-tests');
performanceMonitor.end('dataset-loading');

// Automatic timing with measure()
const result = await performanceMonitor.measure(
  'runner-execution',
  async () => {
    return await runner.run(testCase);
  }
);

// Generate performance report
const report = performanceMonitor.generateReport();
console.log('Bottlenecks:', report.bottlenecks);
console.log('Slowest component:', report.summary.slowestComponent);

// Set baseline for regression detection
performanceMonitor.setBaseline('baseline-v1');

// Later, detect regressions
const regressions = performanceMonitor.detectRegressions('baseline-v1');
if (regressions.length > 0) {
  console.warn('Performance regressions detected:', regressions);
}
```

### Benchmarking

```typescript
import { Benchmark, BenchmarkSuite } from '@aah/ai-evals/performance';

// Single benchmark
const benchmark = new Benchmark();
const result = await benchmark.run(
  {
    name: 'scorer-performance',
    description: 'Semantic similarity scoring',
    iterations: 100,
    warmupIterations: 10,
  },
  async () => {
    return await scorer.score(expected, actual);
  }
);

Benchmark.print(result);

// Benchmark suite
const suite = new BenchmarkSuite();

suite
  .add(
    { name: 'exact-match-scorer', iterations: 1000 },
    async () => exactMatchScorer.score(expected, actual)
  )
  .add(
    { name: 'semantic-similarity-scorer', iterations: 100 },
    async () => semanticScorer.score(expected, actual)
  )
  .add(
    { name: 'llm-judge-scorer', iterations: 50 },
    async () => llmJudgeScorer.score(expected, actual)
  );

const suiteResult = await suite.run();
BenchmarkSuite.printSummary(suiteResult);

// Compare benchmarks
const baseline = result1;
const current = result2;
const comparison = benchmark.compare(baseline, current);
Benchmark.printComparison(comparison);
```

### Streaming for Large Datasets

```typescript
import { BatchProcessor } from '@aah/ai-evals/performance';

// Process large dataset with streaming
const processor = new BatchProcessor({
  batchSize: 50,
  maxMemory: 100 * 1024 * 1024, // 100MB
  bufferSize: 1000,
});

// Add test cases
for (const testCase of largeDataset.testCases) {
  processor.addTestCase(testCase);
}

// Process all with automatic batching
const results = await processor.processAll(async (batch) => {
  return await Promise.all(
    batch.map(tc => runner.run(tc))
  );
});

console.log('Stream stats:', processor.getStats());
```

## API Reference

### CacheManager

Global singleton for managing all caches.

```typescript
interface CacheManager {
  responseCache: ResponseCache;
  embeddingCache: EmbeddingCache;
  queryCache: QueryCache;

  clearAll(): void;
  getAllStats(): { response: CacheStats; embedding: CacheStats; query: CacheStats };
  startCleanup(intervalMs?: number): void;
  stopCleanup(): void;
}

// Usage
import { cacheManager } from '@aah/ai-evals/performance';

// Get cache statistics
const stats = cacheManager.getAllStats();
console.log('Response cache hit rate:', stats.response.hitRate);

// Clear all caches
cacheManager.clearAll();

// Start automatic cleanup (every 5 minutes)
cacheManager.startCleanup(300000);
```

### ResponseCache

Cache for AI model responses.

```typescript
interface ResponseCache {
  get(input: any, modelConfig: any): any | undefined;
  set(input: any, modelConfig: any, response: any): void;
  has(input: any, modelConfig: any): boolean;
  clear(): void;
  getStats(): CacheStats;
  removeExpired(): number;
}
```

### EmbeddingCache

Cache for vector embeddings.

```typescript
interface EmbeddingCache {
  get(text: string): number[] | undefined;
  set(text: string, embedding: number[]): void;
  has(text: string): boolean;
  batchGet(texts: string[]): Map<string, number[] | undefined>;
  batchSet(embeddings: Map<string, number[]>): void;
  clear(): void;
  getStats(): CacheStats;
}
```

### QueryCache

Cache for database query results.

```typescript
interface QueryCache {
  get(query: string, params?: any): any | undefined;
  set(query: string, params: any | undefined, result: any): void;
  has(query: string, params?: any): boolean;
  invalidate(pattern: RegExp | string): number;
  clear(): void;
  getStats(): CacheStats;
}
```

### PerformanceMonitor

Monitor and track component execution times.

```typescript
interface PerformanceMonitor {
  start(name: string, metadata?: Record<string, any>): void;
  end(name: string): number;
  measure<T>(name: string, fn: () => Promise<T>, metadata?: Record<string, any>): Promise<T>;
  measureSync<T>(name: string, fn: () => T, metadata?: Record<string, any>): T;

  getComponentTiming(component: string): ComponentTiming | undefined;
  getAllTimings(): ComponentTiming[];
  identifyBottlenecks(thresholds?: { criticalMs?: number; criticalPercent?: number }): Bottleneck[];

  setBaseline(id: string): PerformanceBaseline;
  detectRegressions(baselineId: string, thresholds?: { critical?: number; major?: number; minor?: number }): PerformanceRegression[];

  generateReport(baselineId?: string): PerformanceReport;
  reset(): void;
}
```

### Benchmark

Benchmarking utility for performance testing.

```typescript
interface Benchmark {
  run<T>(config: BenchmarkConfig, fn: () => Promise<T>): Promise<BenchmarkResult>;
  runSync<T>(config: BenchmarkConfig, fn: () => T): BenchmarkResult;
  compare(baseline: BenchmarkResult, current: BenchmarkResult): BenchmarkComparison;
  getHistory(name: string): BenchmarkResult[];
  clear(): void;
}
```

## Performance Best Practices

### 1. Use Caching Strategically

**Do:**
- Cache expensive AI responses (>500ms)
- Cache embeddings (generation is costly)
- Cache database queries that don't change often
- Set appropriate TTLs based on data freshness needs

**Don't:**
- Cache everything (memory overhead)
- Use long TTLs for frequently changing data
- Cache user-specific data without careful key management

### 2. Optimize Parallel Execution

**Do:**
- Tune concurrency based on provider limits
- Use streaming for large datasets (>1000 items)
- Monitor memory usage with streaming
- Implement backpressure handling

**Don't:**
- Set concurrency too high (rate limiting)
- Load entire large datasets into memory
- Ignore rate limit errors

### 3. Monitor Performance

**Do:**
- Set baselines for critical operations
- Track component timings during development
- Use benchmarks to validate optimizations
- Monitor cache hit rates

**Don't:**
- Skip performance monitoring in tests
- Ignore performance regressions
- Optimize without measuring first

### 4. Database Optimization

**Do:**
- Use connection pooling (see Prisma docs)
- Cache expensive queries
- Use batch operations for writes
- Add indexes for common queries

**Don't:**
- Create new Prisma clients per request
- Skip query optimization
- Ignore connection pool exhaustion

## Performance Targets

### Response Times
- Dataset loading: <500ms for <100 test cases
- Test case execution: <2s per case
- Scoring: <100ms for exact match, <1s for semantic, <5s for LLM-judge
- Report generation: <1s for <100 results

### Cache Performance
- Hit rate: >70% for embeddings, >50% for responses
- Access time: <1ms for cache lookups
- Memory usage: <100MB for response cache, <200MB for embedding cache

### Throughput
- Sequential execution: 10-20 test cases/minute
- Parallel execution (10 workers): 50-100 test cases/minute
- Streaming execution: 100+ test cases/minute for large datasets

## Troubleshooting

### High Memory Usage

```typescript
// Monitor memory
const stats = cacheManager.getAllStats();
console.log('Total cache memory:',
  stats.response.memoryUsage +
  stats.embedding.memoryUsage +
  stats.query.memoryUsage
);

// Reduce cache sizes
cacheManager.responseCache = new ResponseCache({
  maxSize: 100, // Reduce from 500
  ttl: 1800000, // 30 minutes instead of 2 hours
});
```

### Cache Miss Rate Too High

```typescript
// Check cache statistics
const stats = cacheManager.responseCache.getStats();
console.log('Hit rate:', stats.hitRate);
console.log('Hits:', stats.hits);
console.log('Misses:', stats.misses);

// Increase cache size or TTL
cacheManager.responseCache = new ResponseCache({
  maxSize: 1000, // Increase size
  ttl: 14400000, // 4 hours
});
```

### Performance Regression

```typescript
// Detect and analyze
const regressions = performanceMonitor.detectRegressions('baseline-v1', {
  critical: 50, // >50% slower is critical
  major: 25,
  minor: 10,
});

for (const regression of regressions) {
  console.log(`${regression.component}: ${regression.percentChange.toFixed(1)}% slower`);
  console.log(`  Baseline: ${regression.baselineDuration}ms`);
  console.log(`  Current: ${regression.currentDuration}ms`);
}

// Generate detailed report
const report = performanceMonitor.generateReport('baseline-v1');
console.log('Bottlenecks:', report.bottlenecks);
```

### Rate Limiting Issues

```typescript
// Adjust parallel executor rate limits
executor.updateConfig({
  rateLimit: {
    requestsPerMinute: 30, // Reduce from 60
    tokensPerMinute: 75000, // Reduce from 150000
  },
  concurrency: 5, // Reduce from 10
});

// Monitor throttling
executor.on('throttle', (data) => {
  console.warn('Rate limited:', data.reason);
  console.log('Wait time:', data.waitTime);
});
```

## Examples

See the [examples](../examples/) directory for complete usage examples:

- `cache-example.ts` - Response and embedding caching
- `monitoring-example.ts` - Performance monitoring and regression detection
- `benchmark-example.ts` - Benchmarking and comparison
- `streaming-example.ts` - Large dataset processing

## Related Documentation

- [Parallel Executor](../orchestrator/README.md)
- [Connection Pooling](../../../../packages/database/prisma/connection-pool.md)
- [AI Evaluation Framework Tasks](../../../../.kiro/specs/ai-evaluation-framework/tasks.md)
