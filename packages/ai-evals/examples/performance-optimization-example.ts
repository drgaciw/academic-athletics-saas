/**
 * Performance Optimization Example
 *
 * Demonstrates how to use all performance optimization features together
 * for maximum efficiency in AI evaluation workflows.
 */

import {
  cacheManager,
  performanceMonitor,
  Benchmark,
  BenchmarkSuite,
  BatchProcessor,
} from '@aah/ai-evals/performance';
import { ParallelExecutor } from '@aah/ai-evals/orchestrator';
import { DatasetManager } from '@aah/ai-evals/datasets';
import type { TestCase, RunResult } from '@aah/ai-evals/types';

/**
 * Example 1: Basic caching setup
 */
async function setupCaching() {
  console.log('=== Setting up caching ===\n');

  // Start automatic cache cleanup every 5 minutes
  cacheManager.startCleanup(300000);

  // Configure caches with optimal settings
  console.log('Cache configuration:');
  console.log('- Response cache: 500 entries, 2hr TTL');
  console.log('- Embedding cache: 2000 entries, 24hr TTL');
  console.log('- Query cache: 200 entries, 5min TTL\n');
}

/**
 * Example 2: Cached AI response generation
 */
async function generateWithCache(input: string, modelConfig: any): Promise<any> {
  // Check cache first
  let response = cacheManager.responseCache.get(input, modelConfig);

  if (!response) {
    console.log(`Cache miss for input: "${input.substring(0, 50)}..."`);

    // Simulate AI response generation
    response = {
      answer: `Response to: ${input}`,
      timestamp: new Date(),
    };

    // Cache for future use
    cacheManager.responseCache.set(input, modelConfig, response);
  } else {
    console.log(`Cache hit for input: "${input.substring(0, 50)}..."`);
  }

  return response;
}

/**
 * Example 3: Cached embedding generation
 */
async function generateEmbeddingWithCache(text: string): Promise<number[]> {
  // Check cache first
  let embedding = cacheManager.embeddingCache.get(text);

  if (!embedding) {
    console.log(`Generating embedding for: "${text.substring(0, 50)}..."`);

    // Simulate embedding generation (expensive operation)
    embedding = Array.from({ length: 1536 }, () => Math.random());

    // Cache for future use
    cacheManager.embeddingCache.set(text, embedding);
  } else {
    console.log(`Using cached embedding for: "${text.substring(0, 50)}..."`);
  }

  return embedding;
}

/**
 * Example 4: Performance monitoring
 */
async function evaluateWithMonitoring(dataset: any) {
  console.log('\n=== Running evaluation with performance monitoring ===\n');

  // Start total evaluation timer
  performanceMonitor.start('total-evaluation');

  // Load dataset with timing
  performanceMonitor.start('dataset-loading');
  // Simulate dataset loading
  await new Promise((resolve) => setTimeout(resolve, 200));
  performanceMonitor.end('dataset-loading');
  console.log('✓ Dataset loaded');

  // Execute test cases with timing
  performanceMonitor.start('test-execution');
  for (let i = 0; i < 10; i++) {
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  performanceMonitor.end('test-execution');
  console.log('✓ Tests executed');

  // Score results with timing
  performanceMonitor.start('scoring');
  await new Promise((resolve) => setTimeout(resolve, 300));
  performanceMonitor.end('scoring');
  console.log('✓ Results scored');

  // Generate report with timing
  performanceMonitor.start('report-generation');
  await new Promise((resolve) => setTimeout(resolve, 100));
  performanceMonitor.end('report-generation');
  console.log('✓ Report generated');

  // End total timer
  performanceMonitor.end('total-evaluation');

  // Generate performance report
  const report = performanceMonitor.generateReport();

  console.log('\n--- Performance Report ---');
  console.log(`Total Duration: ${report.totalDuration}ms`);
  console.log(`Components: ${report.summary.totalComponents}`);
  console.log(`Slowest: ${report.summary.slowestComponent}`);

  // Identify bottlenecks
  const bottlenecks = performanceMonitor.identifyBottlenecks({
    criticalMs: 200,
    criticalPercent: 20,
  });

  if (bottlenecks.length > 0) {
    console.log('\n--- Bottlenecks Detected ---');
    for (const bottleneck of bottlenecks) {
      console.log(`${bottleneck.severity.toUpperCase()}: ${bottleneck.component}`);
      console.log(`  Impact: ${bottleneck.impact}`);
      console.log(`  Recommendation: ${bottleneck.recommendation}`);
    }
  }
}

/**
 * Example 5: Regression detection
 */
async function detectRegressions() {
  console.log('\n=== Regression Detection ===\n');

  // Run baseline evaluation
  console.log('Running baseline evaluation...');
  performanceMonitor.reset();

  await evaluateWithMonitoring({});

  // Set baseline
  const baselineId = 'baseline-v1.0';
  performanceMonitor.setBaseline(baselineId);
  console.log(`✓ Baseline set: ${baselineId}`);

  // Simulate code changes that cause regression
  console.log('\nSimulating code changes...');
  performanceMonitor.reset();

  performanceMonitor.start('dataset-loading');
  await new Promise((resolve) => setTimeout(resolve, 400)); // Slower!
  performanceMonitor.end('dataset-loading');

  performanceMonitor.start('test-execution');
  await new Promise((resolve) => setTimeout(resolve, 800)); // Slower!
  performanceMonitor.end('test-execution');

  // Detect regressions
  const regressions = performanceMonitor.detectRegressions(baselineId, {
    critical: 50,
    major: 25,
    minor: 10,
  });

  if (regressions.length > 0) {
    console.log('\n⚠️  Performance Regressions Detected:');
    for (const regression of regressions) {
      console.log(
        `\n${regression.severity.toUpperCase()}: ${regression.component}`
      );
      console.log(`  Baseline: ${regression.baselineDuration.toFixed(2)}ms`);
      console.log(`  Current: ${regression.currentDuration.toFixed(2)}ms`);
      console.log(`  Change: +${regression.percentChange.toFixed(1)}%`);
    }
  } else {
    console.log('\n✓ No regressions detected');
  }
}

/**
 * Example 6: Benchmarking components
 */
async function benchmarkComponents() {
  console.log('\n=== Benchmarking Components ===\n');

  const benchmark = new Benchmark();

  // Benchmark exact match scorer
  console.log('Benchmarking exact match scorer...');
  const exactMatchResult = await benchmark.run(
    {
      name: 'exact-match-scorer',
      description: 'Simple string comparison',
      iterations: 1000,
      warmupIterations: 100,
    },
    async () => {
      // Simulate exact match scoring
      return 'expected' === 'actual' ? 1.0 : 0.0;
    }
  );

  // Benchmark semantic similarity scorer
  console.log('Benchmarking semantic similarity scorer...');
  const semanticResult = await benchmark.run(
    {
      name: 'semantic-similarity',
      description: 'Embedding-based comparison',
      iterations: 100,
      warmupIterations: 10,
    },
    async () => {
      // Simulate semantic similarity calculation
      const embedding1 = await generateEmbeddingWithCache('expected');
      const embedding2 = await generateEmbeddingWithCache('actual');
      return 0.85; // Simulated similarity score
    }
  );

  // Print results
  console.log('\n--- Benchmark Results ---\n');
  Benchmark.print(exactMatchResult);
  Benchmark.print(semanticResult);

  // Compare scorers
  const comparison = benchmark.compare(exactMatchResult, semanticResult);
  console.log('\n--- Scorer Comparison ---');
  Benchmark.printComparison(comparison);
}

/**
 * Example 7: Benchmark suite
 */
async function runBenchmarkSuite() {
  console.log('\n=== Running Benchmark Suite ===\n');

  const suite = new BenchmarkSuite();

  suite
    .add(
      {
        name: 'cache-lookup',
        description: 'Response cache lookup',
        iterations: 10000,
      },
      async () => {
        cacheManager.responseCache.get('test-input', { model: 'gpt-4' });
      }
    )
    .add(
      {
        name: 'cache-write',
        description: 'Response cache write',
        iterations: 1000,
      },
      async () => {
        cacheManager.responseCache.set(
          `test-${Math.random()}`,
          { model: 'gpt-4' },
          { result: 'test' }
        );
      }
    )
    .add(
      {
        name: 'embedding-cache-lookup',
        description: 'Embedding cache lookup',
        iterations: 10000,
      },
      async () => {
        cacheManager.embeddingCache.get('test text');
      }
    );

  const suiteResult = await suite.run();

  console.log('\n--- Suite Summary ---');
  BenchmarkSuite.printSummary(suiteResult);
}

/**
 * Example 8: Streaming for large datasets
 */
async function processLargeDataset() {
  console.log('\n=== Processing Large Dataset with Streaming ===\n');

  // Create large dataset
  const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
    id: `test-${i}`,
    input: `Test case ${i}`,
    expected: `Expected ${i}`,
    metadata: {
      difficulty: 'medium' as const,
      category: 'compliance',
      tags: ['test'],
      createdAt: new Date(),
      source: 'synthetic' as const,
    },
  }));

  console.log(`Dataset size: ${largeDataset.length} test cases`);

  // Process with streaming
  const processor = new BatchProcessor({
    batchSize: 50,
    maxMemory: 50 * 1024 * 1024, // 50MB
    bufferSize: 500,
  });

  // Add test cases
  console.log('Adding test cases to processor...');
  processor.addTestCases(largeDataset);

  // Process all
  console.log('Processing with streaming...');
  const startTime = Date.now();

  const results = await processor.processAll(async (batch) => {
    // Simulate processing batch
    await new Promise((resolve) => setTimeout(resolve, 10));

    return batch.map((tc) => ({
      testCaseId: tc.id,
      input: tc.input,
      expected: tc.expected,
      actual: tc.expected, // Simulate correct output
      metadata: {
        modelId: 'test-model',
        latency: 100,
        tokenUsage: { prompt: 10, completion: 20, total: 30 },
        cost: 0.001,
        timestamp: new Date(),
      },
    }));
  });

  const duration = Date.now() - startTime;

  // Get statistics
  const stats = processor.getStats();

  console.log('\n--- Streaming Results ---');
  console.log(`Processed: ${results.length} test cases`);
  console.log(`Duration: ${duration}ms`);
  console.log(`Throughput: ${(results.length / (duration / 1000)).toFixed(2)} tests/sec`);
  console.log(`Memory Usage: ${(stats.memoryUsage / 1024 / 1024).toFixed(2)}MB`);
  console.log(`Backpressure Events: ${stats.backpressureEvents}`);
}

/**
 * Example 9: Complete optimized workflow
 */
async function optimizedEvaluationWorkflow() {
  console.log('\n=== Complete Optimized Evaluation Workflow ===\n');

  // 1. Setup caching
  await setupCaching();

  // 2. Create test dataset
  const testCases = Array.from({ length: 20 }, (_, i) => ({
    id: `test-${i}`,
    input: `What are the NCAA eligibility requirements for student ${i}?`,
    expected: 'Student must maintain 2.3 GPA and complete core courses',
    metadata: {
      difficulty: 'medium' as const,
      category: 'compliance',
      tags: ['ncaa', 'eligibility'],
      createdAt: new Date(),
      source: 'synthetic' as const,
    },
  }));

  // 3. Configure parallel executor
  const executor = new ParallelExecutor({
    concurrency: 5,
    rateLimit: {
      requestsPerMinute: 60,
      tokensPerMinute: 150000,
    },
  });

  // 4. Execute with performance monitoring
  console.log('Executing test cases with caching and monitoring...\n');

  const modelConfig = { provider: 'openai', model: 'gpt-4' };

  const results = await performanceMonitor.measure('full-evaluation', async () => {
    const tasks = testCases.map((tc) => ({
      id: tc.id,
      testCase: tc,
      runnerConfig: { modelId: 'openai/gpt-4' },
    }));

    return await executor.executeTasks(tasks, async (task) => {
      // Use cached responses
      const response = await generateWithCache(task.testCase.input, modelConfig);

      return {
        testCaseId: task.testCase.id,
        input: task.testCase.input,
        expected: task.testCase.expected,
        actual: response.answer,
        metadata: {
          modelId: 'openai/gpt-4',
          latency: 100,
          tokenUsage: { prompt: 50, completion: 100, total: 150 },
          cost: 0.003,
          timestamp: new Date(),
        },
      };
    });
  });

  // 5. Get cache statistics
  const cacheStats = cacheManager.getAllStats();

  console.log('\n--- Cache Performance ---');
  console.log(`Response Cache Hit Rate: ${(cacheStats.response.hitRate * 100).toFixed(1)}%`);
  console.log(`Embedding Cache Hit Rate: ${(cacheStats.embedding.hitRate * 100).toFixed(1)}%`);
  console.log(`Total Cache Memory: ${((cacheStats.response.memoryUsage + cacheStats.embedding.memoryUsage + cacheStats.query.memoryUsage) / 1024 / 1024).toFixed(2)}MB`);

  // 6. Generate performance report
  const report = performanceMonitor.generateReport();

  console.log('\n--- Performance Report ---');
  console.log(`Total Duration: ${report.totalDuration}ms`);
  console.log(`Average per Test: ${(report.totalDuration / testCases.length).toFixed(2)}ms`);
  console.log(`Throughput: ${((testCases.length / report.totalDuration) * 1000).toFixed(2)} tests/sec`);

  // 7. Set baseline for future regression detection
  performanceMonitor.setBaseline('workflow-baseline');
  console.log('\n✓ Baseline set for future regression detection');
}

/**
 * Main function - run all examples
 */
async function main() {
  console.log('╔════════════════════════════════════════════════╗');
  console.log('║   Performance Optimization Examples            ║');
  console.log('╚════════════════════════════════════════════════╝\n');

  try {
    // Run examples
    await setupCaching();
    await evaluateWithMonitoring({});
    await detectRegressions();
    await benchmarkComponents();
    await runBenchmarkSuite();
    await processLargeDataset();
    await optimizedEvaluationWorkflow();

    console.log('\n✅ All examples completed successfully!\n');
  } catch (error) {
    console.error('\n❌ Error running examples:', error);
    process.exit(1);
  } finally {
    // Cleanup
    cacheManager.stopCleanup();
    performanceMonitor.reset();
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export {
  setupCaching,
  generateWithCache,
  generateEmbeddingWithCache,
  evaluateWithMonitoring,
  detectRegressions,
  benchmarkComponents,
  runBenchmarkSuite,
  processLargeDataset,
  optimizedEvaluationWorkflow,
};
