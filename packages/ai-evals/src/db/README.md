# AI Evaluation Framework - Database Operations

This directory contains the database persistence layer for the AI Evaluation Framework. It provides a repository pattern for managing eval runs, results, metrics, and baselines.

## Overview

The database layer consists of:

- **Prisma Schema**: Four models (EvalRun, EvalResult, EvalMetrics, EvalBaseline) in `packages/database/prisma/schema.prisma`
- **Repository**: A class providing high-level operations for eval data
- **Types**: TypeScript definitions for all data structures

## Schema

### EvalRun

Represents a single evaluation run of a dataset against a model.

**Key fields:**
- `datasetId`, `datasetVersion`: Which dataset was evaluated
- `modelId`, `modelConfig`: Which model and configuration was used
- `runnerType`: Type of evaluation (COMPLIANCE, ADVISING, etc.)
- `status`: Current state (running, completed, failed, cancelled)
- `startTime`, `endTime`, `durationMs`: Timing information

**Relations:**
- `results`: Many EvalResult records
- `metrics`: One EvalMetrics record

**Indexes:**
- `datasetId`, `modelId`, `runnerType`, `status`, `startTime`, `createdAt`

### EvalResult

Represents the result of evaluating a single test case.

**Key fields:**
- `testCaseId`: ID of the test case from the dataset
- `input`, `expected`, `actual`: Test case data and outputs
- `passed`: Whether the test passed
- `score`: Numeric score (0.0 to 1.0)
- `latencyMs`: Execution time
- `tokenUsage`: Token counts for prompt, completion, and total
- `cost`: Estimated cost in dollars

**Relations:**
- `run`: The EvalRun this result belongs to

**Indexes:**
- `runId`, `testCaseId`, `passed`, `score`, `createdAt`

### EvalMetrics

Aggregated metrics for an entire eval run.

**Key fields:**
- `totalTests`, `passedTests`, `failedTests`: Test counts
- `accuracy`, `passRate`: Success rates
- `avgScore`, `avgLatencyMs`, `totalCost`: Averages and totals
- `categoryBreakdown`: Metrics by category
- `failuresByType`: Count of failures by type
- `scoreDistribution`: Distribution of scores in buckets

**Relations:**
- `run`: The EvalRun these metrics belong to (one-to-one)

**Indexes:**
- `runId`, `accuracy`, `avgScore`, `createdAt`

### EvalBaseline

Represents a baseline run used for regression detection.

**Key fields:**
- `name`: Unique name for the baseline
- `runId`: The run to use as baseline
- `isActive`: Whether this is the active baseline for the dataset
- `tags`: Categorization tags

**Relations:**
- None (references EvalRun by ID but no formal relation)

**Indexes:**
- `name`, `datasetId`, `modelId`, `isActive`, `createdAt`

## Usage Examples

### Basic Operations

```typescript
import { PrismaClient } from '@prisma/client';
import { createEvalRepository } from './db';

const prisma = new PrismaClient();
const repo = createEvalRepository(prisma);

// Create a new eval run
const run = await repo.createRun({
  datasetId: 'compliance-eligibility-v1',
  datasetVersion: '1.0.0',
  datasetName: 'NCAA Compliance - Eligibility Checks',
  modelId: 'openai/gpt-4',
  modelConfig: {
    temperature: 0.1,
    maxTokens: 1000,
  },
  runnerType: 'COMPLIANCE',
  scorerConfig: {
    strategy: 'exact',
  },
  startTime: new Date(),
});

// Save individual results
await repo.createResult({
  runId: run.id,
  testCaseId: 'test-001',
  input: { gpa: 2.8, creditHours: 24 },
  expected: { eligible: true },
  actual: { eligible: true },
  passed: true,
  score: 1.0,
  latencyMs: 1250,
  tokenUsage: { prompt: 150, completion: 50, total: 200 },
  cost: 0.002,
});

// Or batch save results
await repo.createResultsBatch([
  // ... array of results
]);

// Calculate and save aggregated metrics
await repo.calculateAndSaveMetrics(run.id);

// Mark run as completed
await repo.completeRun(run.id, new Date());
```

### Querying Data

```typescript
// Get a specific run with all data
const runData = await repo.getRun(runId);
console.log(`Accuracy: ${runData.metrics?.accuracy}`);
console.log(`Failed tests: ${runData.results.filter(r => !r.passed).length}`);

// Get recent runs for a dataset
const { runs, total } = await repo.getRuns({
  datasetId: 'compliance-eligibility-v1',
  status: 'completed',
});

// Get failed results
const failures = await repo.getFailedResults(runId);
failures.forEach(result => {
  console.log(`Test ${result.testCaseId} failed with score ${result.score}`);
});

// Get latest run for a dataset
const latest = await repo.getLatestRun('compliance-eligibility-v1');
```

### Baseline Management

```typescript
// Create a baseline from a successful run
const baseline = await repo.createBaseline({
  name: 'compliance-v1-production',
  description: 'Production baseline for compliance checks',
  runId: successfulRunId,
  datasetId: 'compliance-eligibility-v1',
  modelId: 'openai/gpt-4',
  tags: ['production', 'v1.0'],
});

// Set as active baseline
await repo.setActiveBaseline(baseline.id);

// Compare current run to baseline
const comparison = await repo.compareToBaseline(currentRunId, baseline.id);

console.log(`Accuracy change: ${comparison.differences.accuracyDelta}`);
console.log(`Regressions detected: ${comparison.regressions.length}`);

comparison.regressions.forEach(regression => {
  console.log(`${regression.severity.toUpperCase()}: ${regression.metric} changed by ${regression.percentChange.toFixed(2)}%`);
});
```

### Historical Analysis

```typescript
// Get trend data
const trends = await repo.getTrendData('compliance-eligibility-v1', 20);
trends.forEach(trend => {
  console.log(`${trend.timestamp}: Accuracy ${trend.accuracy.toFixed(3)}`);
});

// Get dataset statistics
const stats = await repo.getDatasetStatistics('compliance-eligibility-v1');
console.log(`Total runs: ${stats.totalRuns}`);
console.log(`Average accuracy: ${stats.avgAccuracy.toFixed(3)}`);
console.log(`Trend: ${stats.trendDirection}`);

// Get model performance
const perf = await repo.getModelPerformance('openai/gpt-4');
console.log(`Runs: ${perf.totalRuns}`);
console.log(`Avg accuracy: ${perf.avgAccuracy.toFixed(3)}`);
console.log(`Avg latency: ${perf.avgLatencyMs.toFixed(0)}ms`);
console.log(`Avg cost: $${perf.avgCost.toFixed(4)}`);
```

### Data Retention

```typescript
// Clean up old data
const result = await repo.cleanupOldData({
  keepRecentDays: 30,
  keepBaselines: true,
  keepFailedRuns: true,
  keepTopPerformers: 10,
});

console.log(`Deleted ${result.runsDeleted} runs`);
console.log(`Freed approximately ${result.bytesFreed} bytes`);

// Delete all data for a dataset
await repo.deleteDatasetData('old-dataset-id');
```

## Error Handling

All repository methods throw errors for:
- Not found resources
- Invalid state transitions
- Database constraint violations

Wrap calls in try-catch blocks:

```typescript
try {
  await repo.completeRun(runId, new Date());
} catch (error) {
  if (error.message.includes('not found')) {
    console.error('Run does not exist');
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## Performance Considerations

### Indexes

All common query patterns are indexed:
- Filtering by dataset, model, status
- Sorting by date
- Looking up by test case ID
- Filtering results by pass/fail and score

### Batch Operations

Use batch methods when saving multiple results:

```typescript
// ✅ Good: Batch insert
await repo.createResultsBatch(results);

// ❌ Bad: Individual inserts
for (const result of results) {
  await repo.createResult(result);
}
```

### Query Limits

Always specify limits when querying large result sets:

```typescript
const { runs, total } = await repo.getRuns(filters, 50, 0);
```

### Connection Pooling

Reuse the same Prisma client instance across your application. Don't create a new client for each operation.

## Data Retention Best Practices

Implement a retention policy to manage database size:

1. **Keep recent data**: Retain last 30-90 days of runs
2. **Preserve baselines**: Never delete baseline runs
3. **Keep failures**: Retain failed runs for debugging
4. **Archive top performers**: Keep best runs for each dataset

Run cleanup regularly (e.g., weekly cron job):

```typescript
import { PrismaClient } from '@prisma/client';
import { createEvalRepository } from '@aah/ai-evals/db';

const prisma = new PrismaClient();
const repo = createEvalRepository(prisma);

// Run weekly cleanup
const result = await repo.cleanupOldData({
  keepRecentDays: 60,
  keepBaselines: true,
  keepFailedRuns: true,
  keepTopPerformers: 5,
});

console.log(`Cleanup completed: ${result.runsDeleted} runs deleted`);
```

## Migration Notes

See `MIGRATION_GUIDE.md` for information on:
- Running the initial migration
- Adding the schema to existing databases
- Migrating from other eval systems
