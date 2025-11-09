# Performance Optimization Quick Reference

## 🚀 Quick Start (30 seconds)

```typescript
import { cacheManager, performanceMonitor } from '@aah/ai-evals/performance';

// Enable caching
cacheManager.startCleanup(300000);

// Track performance
performanceMonitor.start('my-operation');
await doWork();
performanceMonitor.end('my-operation');

// Get report
const report = performanceMonitor.generateReport();
```

## 📦 Caching Cheatsheet

### Response Caching
```typescript
// Check cache → Generate → Store
const response = cacheManager.responseCache.get(input, config)
  ?? await generateAndCache(input, config);
```

### Embedding Caching
```typescript
// Single embedding
const embedding = cacheManager.embeddingCache.get(text)
  ?? await generateEmbedding(text);

// Batch embeddings
const cached = cacheManager.embeddingCache.batchGet(texts);
const uncached = texts.filter(t => !cached.get(t));
```

### Query Caching
```typescript
// Cache database query
const result = cacheManager.queryCache.get(query, params)
  ?? await executeQuery(query, params);

// Invalidate by pattern
cacheManager.queryCache.invalidate(/student-*/);
```

### Cache Stats
```typescript
const stats = cacheManager.getAllStats();
console.log('Hit rate:', stats.response.hitRate);
console.log('Memory:', stats.response.memoryUsage);
```

## ⚡ Performance Monitoring

### Basic Timing
```typescript
// Manual
performanceMonitor.start('component');
await work();
performanceMonitor.end('component');

// Automatic
await performanceMonitor.measure('component', async () => {
  return await work();
});
```

### Bottleneck Detection
```typescript
const bottlenecks = performanceMonitor.identifyBottlenecks({
  criticalMs: 1000,     // >1s is critical
  criticalPercent: 20,  // >20% of total is critical
});

for (const b of bottlenecks) {
  console.log(b.severity, b.component, b.recommendation);
}
```

### Regression Detection
```typescript
// Set baseline
performanceMonitor.setBaseline('v1.0');

// Later, detect regressions
const regressions = performanceMonitor.detectRegressions('v1.0', {
  critical: 50,  // >50% slower
  major: 25,     // >25% slower
  minor: 10,     // >10% slower
});
```

### Generate Report
```typescript
const report = performanceMonitor.generateReport();
console.log('Duration:', report.totalDuration);
console.log('Slowest:', report.summary.slowestComponent);
console.log('Bottlenecks:', report.bottlenecks);
```

## 🔄 Streaming

### Large Dataset Processing
```typescript
import { BatchProcessor } from '@aah/ai-evals/performance';

const processor = new BatchProcessor({
  batchSize: 50,              // Process 50 at a time
  maxMemory: 100 * 1024 * 1024, // 100MB limit
});

processor.addTestCases(largeDataset);
const results = await processor.processAll(executeBatch);

console.log(processor.getStats());
```

### Memory-Efficient Streaming
```typescript
import { DatasetStream } from '@aah/ai-evals/performance';

const stream = new DatasetStream({
  batchSize: 50,
  maxMemory: 100 * 1024 * 1024,
});

// Add items
for (const item of items) {
  stream.push(item);
}

// Process
await stream.process(async (batch) => {
  return await processBatch(batch);
});
```

## 📊 Benchmarking

### Single Benchmark
```typescript
import { Benchmark } from '@aah/ai-evals/performance';

const benchmark = new Benchmark();
const result = await benchmark.run(
  {
    name: 'my-operation',
    iterations: 100,
    warmupIterations: 10,
  },
  async () => await operation()
);

Benchmark.print(result);
```

### Benchmark Suite
```typescript
import { BenchmarkSuite } from '@aah/ai-evals/performance';

const suite = new BenchmarkSuite();

suite
  .add({ name: 'operation-a', iterations: 100 }, () => operationA())
  .add({ name: 'operation-b', iterations: 100 }, () => operationB());

const results = await suite.run();
BenchmarkSuite.printSummary(results);
```

### Compare Implementations
```typescript
const baseline = await benchmark.run(config, oldImplementation);
const optimized = await benchmark.run(config, newImplementation);

const comparison = benchmark.compare(baseline, optimized);
Benchmark.printComparison(comparison);
```

## 🔧 Configuration

### Cache Configuration
```typescript
// Custom cache settings
cacheManager.responseCache = new ResponseCache({
  maxSize: 1000,    // Max entries
  ttl: 7200000,     // 2 hours
});

cacheManager.embeddingCache = new EmbeddingCache({
  maxSize: 2000,
  ttl: 86400000,    // 24 hours
});

cacheManager.queryCache = new QueryCache({
  maxSize: 200,
  ttl: 300000,      // 5 minutes
});
```

### Parallel Executor
```typescript
import { ParallelExecutor } from '@aah/ai-evals/orchestrator';

const executor = new ParallelExecutor({
  concurrency: 10,
  rateLimit: {
    requestsPerMinute: 60,
    tokensPerMinute: 150000,
  },
});

// With streaming
const results = await executor.executeTasksStreaming(
  tasks,
  runTest,
  { batchSize: 50, maxMemory: 100 * 1024 * 1024 }
);
```

## 📈 Performance Targets

| Component | Target | Excellent | Poor |
|-----------|--------|-----------|------|
| Cache Hit Rate | >70% | >90% | <50% |
| Cache Lookup | <1ms | <0.5ms | >5ms |
| Memory Usage | <500MB | <200MB | >1GB |
| Throughput | 50+ tests/min | 100+ tests/min | <10 tests/min |

## 🐛 Troubleshooting

### High Memory Usage
```typescript
// Check memory
const stats = cacheManager.getAllStats();
const totalMem = stats.response.memoryUsage +
                 stats.embedding.memoryUsage +
                 stats.query.memoryUsage;

console.log('Cache memory:', (totalMem / 1024 / 1024).toFixed(2) + 'MB');

// Reduce cache size
cacheManager.responseCache = new ResponseCache({ maxSize: 100, ttl: 1800000 });
```

### Low Cache Hit Rate
```typescript
// Analyze
const stats = cacheManager.responseCache.getStats();
console.log('Hits:', stats.hits);
console.log('Misses:', stats.misses);
console.log('Hit rate:', (stats.hitRate * 100).toFixed(1) + '%');

// Increase cache size or TTL
cacheManager.responseCache = new ResponseCache({ maxSize: 1000, ttl: 14400000 });
```

### Performance Regression
```typescript
// Detect
const regressions = performanceMonitor.detectRegressions('baseline');

// Analyze
for (const r of regressions) {
  console.log(`${r.component}: +${r.percentChange.toFixed(1)}% slower`);
}

// Generate detailed report
const report = performanceMonitor.generateReport('baseline');
```

### Rate Limiting
```typescript
// Monitor throttling
executor.on('throttle', ({ reason, waitTime }) => {
  console.warn(`Throttled: ${reason}, waiting ${waitTime}ms`);
});

// Adjust limits
executor.updateConfig({
  rateLimit: {
    requestsPerMinute: 30,  // Reduce
    tokensPerMinute: 75000, // Reduce
  },
  concurrency: 5,  // Reduce
});
```

## 💡 Best Practices

1. **Always enable caching** for AI operations
2. **Set baselines** after optimizations
3. **Monitor cache hit rates** (target >70%)
4. **Use streaming** for datasets >1000 items
5. **Benchmark** before and after optimizations
6. **Track performance** in CI/CD
7. **Set regression thresholds** appropriate to your SLAs

## 📚 See Also

- [Full Performance Documentation](./src/performance/README.md)
- [Optimization Guide](./PERFORMANCE_OPTIMIZATION_GUIDE.md)
- [Connection Pooling](../database/prisma/connection-pool.md)
- [Complete Example](./examples/performance-optimization-example.ts)
