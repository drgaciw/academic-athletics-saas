# Performance Optimization Guide

## Overview

This guide provides strategies for optimizing the AI Evaluation Framework performance. It covers caching, parallel execution, monitoring, and database optimization.

## Table of Contents

1. [Quick Wins](#quick-wins)
2. [Caching Strategy](#caching-strategy)
3. [Parallel Execution](#parallel-execution)
4. [Database Optimization](#database-optimization)
5. [Memory Management](#memory-management)
6. [Performance Monitoring](#performance-monitoring)
7. [Benchmarking](#benchmarking)

## Quick Wins

These optimizations can be implemented immediately for significant performance gains:

### 1. Enable Response Caching

**Impact**: 80-90% reduction in AI API costs for repeated evaluations

```typescript
import { cacheManager } from '@aah/ai-evals/performance';

// Start automatic cache cleanup
cacheManager.startCleanup(300000); // Every 5 minutes

// Cache AI responses
const response = cacheManager.responseCache.get(input, modelConfig)
  ?? await generateAndCache(input, modelConfig);
```

### 2. Use Parallel Execution

**Impact**: 5-10x speedup for test suites >100 cases

```typescript
import { ParallelExecutor } from '@aah/ai-evals/orchestrator';

const executor = new ParallelExecutor({
  concurrency: 10, // Run 10 tests in parallel
  rateLimit: {
    requestsPerMinute: 60,
    tokensPerMinute: 150000,
  },
});

const results = await executor.executeTasks(tasks, runTestCase);
```

### 3. Cache Embeddings

**Impact**: 95% reduction in embedding API costs

```typescript
// Batch cache embeddings
const texts = testCases.map(tc => tc.input);
const cached = cacheManager.embeddingCache.batchGet(texts);
const uncached = texts.filter(t => !cached.get(t));

// Generate only uncached embeddings
const newEmbeddings = await generateEmbeddings(uncached);
cacheManager.embeddingCache.batchSet(newEmbeddings);
```

### 4. Use Streaming for Large Datasets

**Impact**: 90% reduction in memory usage for datasets >1000 cases

```typescript
import { BatchProcessor } from '@aah/ai-evals/performance';

const processor = new BatchProcessor({
  batchSize: 50,
  maxMemory: 100 * 1024 * 1024, // 100MB limit
});

processor.addTestCases(largeDataset.testCases);
const results = await processor.processAll(executeBatch);
```

## Caching Strategy

### When to Cache

| Data Type | Cache? | TTL | Reason |
|-----------|--------|-----|--------|
| AI Responses | ✅ Yes | 2 hours | Expensive, often repeated |
| Embeddings | ✅ Yes | 24 hours | Very expensive, rarely change |
| Database Queries | ⚠️ Selective | 5 minutes | Balance freshness vs performance |
| Test Results | ❌ No | N/A | Must be fresh for accuracy |
| Dataset Metadata | ✅ Yes | 1 hour | Rarely changes |

### Cache Configuration

```typescript
import { CacheManager } from '@aah/ai-evals/performance';

const optimizedCacheManager = new CacheManager();

// Configure response cache
optimizedCacheManager.responseCache = new ResponseCache({
  maxSize: 500,      // 500 unique responses
  ttl: 7200000,      // 2 hours
});

// Configure embedding cache
optimizedCacheManager.embeddingCache = new EmbeddingCache({
  maxSize: 2000,     // 2000 unique embeddings
  ttl: 86400000,     // 24 hours
});

// Configure query cache
optimizedCacheManager.queryCache = new QueryCache({
  maxSize: 200,      // 200 query results
  ttl: 300000,       // 5 minutes
});
```

### Cache Invalidation Strategy

```typescript
// Invalidate on dataset updates
async function updateDataset(datasetId: string, updates: any) {
  await prisma.dataset.update({ where: { id: datasetId }, data: updates });

  // Invalidate related caches
  cacheManager.queryCache.invalidate(new RegExp(`dataset-${datasetId}`));
}

// Invalidate on model config changes
function updateModelConfig(newConfig: ModelConfig) {
  cacheManager.responseCache.clear(); // Clear all AI responses
  return newConfig;
}

// Periodic cleanup
cacheManager.startCleanup(300000); // Clean up every 5 minutes
```

## Parallel Execution

### Optimal Concurrency

Provider rate limits determine optimal concurrency:

| Provider | Tier | Requests/Min | Tokens/Min | Optimal Concurrency |
|----------|------|--------------|------------|---------------------|
| OpenAI GPT-4 | Tier 1 | 500 | 30,000 | 8-10 |
| OpenAI GPT-4 | Tier 2 | 5,000 | 450,000 | 20-30 |
| Anthropic Claude | Tier 1 | 50 | 40,000 | 3-5 |
| Anthropic Claude | Tier 2 | 1,000 | 100,000 | 10-15 |

```typescript
// Configure based on your tier
const executor = new ParallelExecutor({
  concurrency: 10, // OpenAI Tier 1
  rateLimit: {
    requestsPerMinute: 500,
    tokensPerMinute: 30000,
  },
});

// Monitor throttling
executor.on('throttle', ({ reason, waitTime }) => {
  console.warn(`Throttled: ${reason}, waiting ${waitTime}ms`);
});
```

### Batch Processing

```typescript
// Process in optimal batch sizes
const BATCH_SIZE = 50; // Process 50 at a time

for (let i = 0; i < testCases.length; i += BATCH_SIZE) {
  const batch = testCases.slice(i, i + BATCH_SIZE);
  const results = await executor.executeTasks(
    batch.map(tc => ({ id: tc.id, testCase: tc, runnerConfig })),
    executeTestCase
  );

  // Save batch results
  await saveBatchResults(results);

  // Allow event loop to process
  await new Promise(resolve => setTimeout(resolve, 0));
}
```

### Worker Pool Optimization

```typescript
import { ScoringWorkerPool } from '@aah/ai-evals/orchestrator';

// Use CPU cores - 1 for worker pool
const workerPool = new ScoringWorkerPool(7); // 8 cores - 1

// Execute CPU-intensive scoring in parallel
const scores = await Promise.all(
  results.map(result =>
    workerPool.execute(() => scorer.score(result.expected, result.actual))
  )
);

// Monitor utilization
const stats = workerPool.getStats();
console.log('Worker utilization:', (stats.utilization * 100).toFixed(1) + '%');
```

## Database Optimization

### Connection Pooling

```typescript
// packages/database/index.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['error'], // Reduce logging overhead in production
});

// Singleton pattern prevents connection exhaustion
export { prisma };
```

### Query Caching

```typescript
import { cacheManager } from '@aah/ai-evals/performance';

async function getStudentMetrics(studentId: string) {
  const cacheKey = 'student-metrics';
  const params = { studentId };

  // Check cache first
  let metrics = cacheManager.queryCache.get(cacheKey, params);

  if (!metrics) {
    // Execute query
    metrics = await prisma.studentProfile.findUnique({
      where: { studentId },
      include: {
        performanceMetrics: {
          orderBy: { date: 'desc' },
          take: 10,
        },
      },
    });

    // Cache result
    cacheManager.queryCache.set(cacheKey, params, metrics);
  }

  return metrics;
}
```

### Batch Operations

```typescript
// Bad: N+1 queries
for (const result of results) {
  await prisma.evalResult.create({ data: result });
}

// Good: Single batch insert
await prisma.evalResult.createMany({
  data: results,
  skipDuplicates: true,
});

// Good: Transaction for related operations
await prisma.$transaction([
  prisma.evalRun.create({ data: runData }),
  prisma.evalResult.createMany({ data: resultsData }),
  prisma.evalMetrics.create({ data: metricsData }),
]);
```

### Index Optimization

```prisma
// schema.prisma
model EvalResult {
  id         String   @id @default(cuid())
  runId      String
  testCaseId String
  score      Float
  createdAt  DateTime @default(now())

  // Indexes for common queries
  @@index([runId])
  @@index([testCaseId])
  @@index([createdAt])
  @@index([runId, score]) // Composite for filtering
}
```

## Memory Management

### Streaming Large Datasets

```typescript
import { DatasetStream } from '@aah/ai-evals/performance';

async function processLargeDataset(dataset: Dataset) {
  const stream = new DatasetStream({
    batchSize: 50,
    maxMemory: 100 * 1024 * 1024, // 100MB
    bufferSize: 1000,
  });

  // Push test cases to stream
  for (const testCase of dataset.testCases) {
    const pushed = stream.push(testCase);
    if (!pushed) {
      // Backpressure: wait for buffer to drain
      await new Promise(resolve => stream.once('batch-complete', resolve));
      stream.push(testCase);
    }
  }

  // Process with automatic memory management
  return await stream.process(async (batch) => {
    return await executeBatch(batch);
  });
}
```

### Memory Monitoring

```typescript
// Monitor memory usage
const stats = stream.getStats();
console.log('Memory usage:', (stats.memoryUsage / 1024 / 1024).toFixed(2) + 'MB');

// Handle memory pressure
stream.on('memory-pressure', ({ current, max }) => {
  console.warn('Memory pressure detected');
  console.log(`Current: ${(current / 1024 / 1024).toFixed(2)}MB`);
  console.log(`Max: ${(max / 1024 / 1024).toFixed(2)}MB`);

  // Pause processing until memory clears
  stream.pause();

  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }

  // Resume after GC
  setTimeout(() => stream.resume(), 1000);
});
```

## Performance Monitoring

### Component Timing

```typescript
import { performanceMonitor } from '@aah/ai-evals/performance';

// Time critical components
async function runEvaluation() {
  performanceMonitor.start('total-evaluation');

  performanceMonitor.start('dataset-loading');
  const dataset = await loadDataset('compliance-tests');
  performanceMonitor.end('dataset-loading');

  performanceMonitor.start('runner-execution');
  const results = await runner.run(dataset);
  performanceMonitor.end('runner-execution');

  performanceMonitor.start('scoring');
  const scores = await scorer.scoreAll(results);
  performanceMonitor.end('scoring');

  performanceMonitor.start('report-generation');
  const report = await generateReport(scores);
  performanceMonitor.end('report-generation');

  performanceMonitor.end('total-evaluation');

  // Identify bottlenecks
  const bottlenecks = performanceMonitor.identifyBottlenecks({
    criticalMs: 1000,
    criticalPercent: 20,
  });

  for (const bottleneck of bottlenecks) {
    if (bottleneck.severity === 'critical') {
      console.warn(`BOTTLENECK: ${bottleneck.component}`);
      console.warn(`  ${bottleneck.impact}`);
      console.warn(`  ${bottleneck.recommendation}`);
    }
  }

  return report;
}
```

### Regression Detection

```typescript
// Set baseline after optimization
performanceMonitor.setBaseline('v1.0-optimized');

// Later, detect regressions
const regressions = performanceMonitor.detectRegressions('v1.0-optimized', {
  critical: 50, // >50% slower
  major: 25,    // >25% slower
  minor: 10,    // >10% slower
});

if (regressions.some(r => r.severity === 'critical')) {
  throw new Error('Critical performance regression detected!');
}

// Generate detailed report
const report = performanceMonitor.generateReport('v1.0-optimized');
console.log(JSON.stringify(report, null, 2));
```

## Benchmarking

### Component Benchmarks

```typescript
import { Benchmark } from '@aah/ai-evals/performance';

const benchmark = new Benchmark();

// Benchmark scorer implementations
const exactMatchResult = await benchmark.run(
  { name: 'exact-match-scorer', iterations: 1000 },
  async () => exactMatchScorer.score(expected, actual)
);

const semanticResult = await benchmark.run(
  { name: 'semantic-scorer', iterations: 100 },
  async () => semanticScorer.score(expected, actual)
);

const llmJudgeResult = await benchmark.run(
  { name: 'llm-judge-scorer', iterations: 50 },
  async () => llmJudgeScorer.score(expected, actual)
);

// Print results
Benchmark.print(exactMatchResult);
Benchmark.print(semanticResult);
Benchmark.print(llmJudgeResult);

// Recommend fastest scorer
const results = [exactMatchResult, semanticResult, llmJudgeResult];
const fastest = results.sort((a, b) => a.avgDuration - b.avgDuration)[0];
console.log(`Fastest: ${fastest.name} at ${fastest.avgDuration.toFixed(2)}ms avg`);
```

### Before/After Comparison

```typescript
// Benchmark before optimization
const before = await benchmark.run(
  { name: 'unoptimized-execution', iterations: 100 },
  async () => executeUnoptimized()
);

// Apply optimization
applyOptimization();

// Benchmark after optimization
const after = await benchmark.run(
  { name: 'optimized-execution', iterations: 100 },
  async () => executeOptimized()
);

// Compare results
const comparison = benchmark.compare(before, after);
Benchmark.printComparison(comparison);

if (comparison.verdict === 'faster' && comparison.significance === 'significant') {
  console.log('✅ Optimization successful!');
} else {
  console.log('❌ Optimization did not improve performance significantly');
}
```

## Performance Targets

### Target Metrics

| Component | Target | Excellent | Acceptable | Poor |
|-----------|--------|-----------|------------|------|
| Dataset Loading | <500ms | <200ms | <500ms | >1s |
| Test Execution | <2s/case | <1s | <2s | >5s |
| Exact Match Scoring | <10ms | <5ms | <10ms | >50ms |
| Semantic Scoring | <100ms | <50ms | <100ms | >500ms |
| LLM Judge Scoring | <5s | <3s | <5s | >10s |
| Report Generation | <1s | <500ms | <1s | >3s |
| Cache Hit Rate | >70% | >90% | >70% | <50% |
| Memory Usage | <500MB | <200MB | <500MB | >1GB |

### Monitoring Dashboard

```typescript
// Generate performance dashboard
function generatePerformanceDashboard() {
  const report = performanceMonitor.generateReport();
  const cacheStats = cacheManager.getAllStats();

  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║       Performance Dashboard                ║');
  console.log('╠════════════════════════════════════════════╣');
  console.log(`║ Total Duration:    ${report.totalDuration}ms`);
  console.log(`║ Components:        ${report.summary.totalComponents}`);
  console.log(`║ Slowest:           ${report.summary.slowestComponent}`);
  console.log(`║ Cache Hit Rate:    ${(cacheStats.response.hitRate * 100).toFixed(1)}%`);
  console.log(`║ Memory Usage:      ${((cacheStats.response.memoryUsage + cacheStats.embedding.memoryUsage) / 1024 / 1024).toFixed(1)}MB`);
  console.log('╚════════════════════════════════════════════╝\n');

  return report;
}
```

## Troubleshooting

See [Performance README](./src/performance/README.md#troubleshooting) for detailed troubleshooting guides.

## Related Documentation

- [Performance Module API](./src/performance/README.md)
- [Connection Pooling](../database/prisma/connection-pool.md)
- [Parallel Executor](./src/orchestrator/README.md)
