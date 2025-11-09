# Database Implementation - Tasks 6.1, 6.2, 6.3

This document provides a complete overview of the database implementation for the AI Evaluation Framework.

## Quick Start

### 1. Prerequisites

Ensure you have:
- ✅ Vercel Postgres database configured
- ✅ `DATABASE_URL` set in `.env`
- ✅ Prisma CLI installed (`npm install` in project root)

### 2. Run Migration

```bash
# Navigate to database package
cd packages/database

# Generate and apply migration
npm run db:migrate -- --name add_ai_eval_framework

# Generate Prisma Client
npm run db:generate
```

### 3. Verify Schema

```bash
# Navigate to ai-evals package
cd packages/ai-evals

# Run verification script
npm run verify-schema
```

Expected output:
```
✓ Create EvalRun
✓ Update EvalRun
✓ Create EvalResult
✓ Batch create EvalResults
✓ Query EvalResults
✓ Create EvalMetrics
✓ Create EvalBaseline
✓ Query with relations
✓ Index usage
✓ Cleanup and cascade delete

✅ All tests passed! Schema is correctly set up.
```

## What Was Implemented

### Task 6.1: Prisma Schema ✅

**File**: `/packages/database/prisma/schema.prisma`

Added four new models with comprehensive indexing:

| Model | Purpose | Records | Indexes |
|-------|---------|---------|---------|
| `EvalRun` | Track evaluation runs | 1 per eval | 6 indexes |
| `EvalResult` | Individual test results | Many per run | 5 indexes |
| `EvalMetrics` | Aggregated metrics | 1 per run | 4 indexes |
| `EvalBaseline` | Baseline references | Few | 5 indexes |

**Key Design Decisions**:
- JSON fields for flexible configuration storage
- Cascade deletes for data integrity
- Comprehensive indexes for query performance
- Proper foreign key constraints

### Task 6.2: Repository Layer ✅

**Location**: `/packages/ai-evals/src/db/`

**Files Created**:
- `types.ts` (196 lines) - TypeScript type definitions
- `repository.ts` (820 lines) - Repository implementation
- `index.ts` (7 lines) - Public API exports
- `README.md` (476 lines) - Usage documentation

**Repository Methods** (30+ total):

| Category | Methods | Purpose |
|----------|---------|---------|
| EvalRun | 8 methods | Create, update, query, complete runs |
| EvalResult | 5 methods | Save and query test results |
| EvalMetrics | 3 methods | Calculate and query metrics |
| EvalBaseline | 6 methods | Manage baselines |
| Analysis | 4 methods | Trends, comparisons, statistics |
| Retention | 2 methods | Data cleanup and deletion |

### Task 6.3: Migration Process ✅

**Files Created**:
- `MIGRATION_GUIDE.md` (389 lines) - Step-by-step migration instructions
- `scripts/verify-schema.ts` (400+ lines) - Automated verification script
- `IMPLEMENTATION_SUMMARY.md` (395 lines) - Complete implementation documentation

**Migration Readiness**:
- ✅ Migration SQL ready to generate
- ✅ Rollback procedures documented
- ✅ Verification script prepared
- ✅ Production deployment guide included

## Repository Usage Examples

### Basic CRUD Operations

```typescript
import { PrismaClient } from '@prisma/client';
import { createEvalRepository } from '@aah/ai-evals/db';

const prisma = new PrismaClient();
const repo = createEvalRepository(prisma);

// Create a new run
const run = await repo.createRun({
  datasetId: 'compliance-checks-v1',
  datasetVersion: '1.0.0',
  modelId: 'openai/gpt-4',
  modelConfig: { temperature: 0.1 },
  runnerType: 'COMPLIANCE',
  scorerConfig: { strategy: 'exact' },
  startTime: new Date(),
});

// Save results
await repo.createResultsBatch([
  {
    runId: run.id,
    testCaseId: 'test-001',
    input: {...},
    expected: {...},
    actual: {...},
    passed: true,
    score: 1.0,
    latencyMs: 1200,
    tokenUsage: { prompt: 150, completion: 50, total: 200 },
    cost: 0.002,
  },
  // ... more results
]);

// Calculate metrics
const metrics = await repo.calculateAndSaveMetrics(run.id);

// Complete the run
await repo.completeRun(run.id, new Date());
```

### Baseline Management

```typescript
// Create baseline from successful run
const baseline = await repo.createBaseline({
  name: 'compliance-v1-baseline',
  description: 'Production baseline for compliance checks',
  runId: successfulRunId,
  datasetId: 'compliance-checks-v1',
  modelId: 'openai/gpt-4',
  tags: ['production', 'v1.0'],
});

// Set as active
await repo.setActiveBaseline(baseline.id);

// Compare new run to baseline
const comparison = await repo.compareToBaseline(newRunId, baseline.id);

if (comparison.regressions.length > 0) {
  console.log('⚠️ Regressions detected:');
  comparison.regressions.forEach(reg => {
    console.log(`  ${reg.severity}: ${reg.metric} changed by ${reg.percentChange.toFixed(2)}%`);
  });
}
```

### Historical Analysis

```typescript
// Get trend data
const trends = await repo.getTrendData('compliance-checks-v1', 30);
console.log('Accuracy over last 30 runs:');
trends.forEach(t => {
  console.log(`  ${t.timestamp.toISOString()}: ${t.accuracy.toFixed(3)}`);
});

// Get dataset statistics
const stats = await repo.getDatasetStatistics('compliance-checks-v1');
console.log(`Dataset: ${stats.datasetId}`);
console.log(`Total runs: ${stats.totalRuns}`);
console.log(`Avg accuracy: ${stats.avgAccuracy.toFixed(3)}`);
console.log(`Trend: ${stats.trendDirection}`);

// Get model performance
const perf = await repo.getModelPerformance('openai/gpt-4');
console.log(`Model: ${perf.modelId}`);
console.log(`Runs: ${perf.totalRuns}`);
console.log(`Avg accuracy: ${perf.avgAccuracy.toFixed(3)}`);
console.log(`Avg latency: ${perf.avgLatencyMs.toFixed(0)}ms`);
console.log(`Avg cost: $${perf.avgCost.toFixed(4)}`);
```

### Data Retention

```typescript
// Configure retention policy
const policy = {
  keepRecentDays: 60,
  keepBaselines: true,
  keepFailedRuns: true,
  keepTopPerformers: 10,
};

// Run cleanup
const result = await repo.cleanupOldData(policy);
console.log(`Cleaned up ${result.runsDeleted} runs`);
console.log(`Freed approximately ${result.bytesFreed} bytes`);
```

## Database Schema Details

### EvalRun

```sql
CREATE TABLE "EvalRun" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    datasetId TEXT NOT NULL,
    datasetVersion TEXT NOT NULL,
    datasetName TEXT,
    modelId TEXT NOT NULL,
    modelConfig JSONB NOT NULL,
    runnerType TEXT NOT NULL,
    scorerConfig JSONB NOT NULL,
    startTime TIMESTAMP NOT NULL,
    endTime TIMESTAMP,
    durationMs INTEGER,
    status TEXT NOT NULL,
    error TEXT,
    metadata JSONB,
    createdAt TIMESTAMP DEFAULT NOW(),
    updatedAt TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_evalrun_datasetid ON "EvalRun"(datasetId);
CREATE INDEX idx_evalrun_modelid ON "EvalRun"(modelId);
CREATE INDEX idx_evalrun_runnertype ON "EvalRun"(runnerType);
CREATE INDEX idx_evalrun_status ON "EvalRun"(status);
CREATE INDEX idx_evalrun_starttime ON "EvalRun"(startTime);
CREATE INDEX idx_evalrun_createdat ON "EvalRun"(createdAt);
```

### EvalResult

```sql
CREATE TABLE "EvalResult" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    runId TEXT NOT NULL REFERENCES "EvalRun"(id) ON DELETE CASCADE,
    testCaseId TEXT NOT NULL,
    input JSONB NOT NULL,
    expected JSONB NOT NULL,
    actual JSONB NOT NULL,
    passed BOOLEAN NOT NULL,
    score DOUBLE PRECISION NOT NULL,
    confidence DOUBLE PRECISION,
    explanation TEXT,
    latencyMs INTEGER NOT NULL,
    tokenUsage JSONB NOT NULL,
    cost DOUBLE PRECISION NOT NULL,
    metadata JSONB,
    createdAt TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_evalresult_runid ON "EvalResult"(runId);
CREATE INDEX idx_evalresult_testcaseid ON "EvalResult"(testCaseId);
CREATE INDEX idx_evalresult_passed ON "EvalResult"(passed);
CREATE INDEX idx_evalresult_score ON "EvalResult"(score);
CREATE INDEX idx_evalresult_createdat ON "EvalResult"(createdAt);
```

### EvalMetrics

```sql
CREATE TABLE "EvalMetrics" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    runId TEXT UNIQUE NOT NULL REFERENCES "EvalRun"(id) ON DELETE CASCADE,
    totalTests INTEGER NOT NULL,
    passedTests INTEGER NOT NULL,
    failedTests INTEGER NOT NULL,
    accuracy DOUBLE PRECISION NOT NULL,
    passRate DOUBLE PRECISION NOT NULL,
    avgScore DOUBLE PRECISION NOT NULL,
    avgLatencyMs DOUBLE PRECISION NOT NULL,
    totalCost DOUBLE PRECISION NOT NULL,
    totalTokens INTEGER NOT NULL,
    categoryBreakdown JSONB,
    failuresByType JSONB,
    scoreDistribution JSONB,
    createdAt TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_evalmetrics_runid ON "EvalMetrics"(runId);
CREATE INDEX idx_evalmetrics_accuracy ON "EvalMetrics"(accuracy);
CREATE INDEX idx_evalmetrics_avgscore ON "EvalMetrics"(avgScore);
CREATE INDEX idx_evalmetrics_createdat ON "EvalMetrics"(createdAt);
```

### EvalBaseline

```sql
CREATE TABLE "EvalBaseline" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    description TEXT NOT NULL,
    runId TEXT NOT NULL,
    datasetId TEXT NOT NULL,
    modelId TEXT NOT NULL,
    isActive BOOLEAN DEFAULT FALSE,
    tags TEXT[] DEFAULT '{}',
    metadata JSONB,
    createdAt TIMESTAMP DEFAULT NOW(),
    updatedAt TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_evalbaseline_name ON "EvalBaseline"(name);
CREATE INDEX idx_evalbaseline_datasetid ON "EvalBaseline"(datasetId);
CREATE INDEX idx_evalbaseline_modelid ON "EvalBaseline"(modelId);
CREATE INDEX idx_evalbaseline_isactive ON "EvalBaseline"(isActive);
CREATE INDEX idx_evalbaseline_createdat ON "EvalBaseline"(createdAt);
```

## Performance Optimization

### Indexing Strategy

All common query patterns are indexed:

1. **Foreign Keys**: `runId` in results and metrics
2. **Filter Fields**: `datasetId`, `modelId`, `status`, `passed`
3. **Sort Fields**: All timestamp fields
4. **Unique Lookups**: `name` in baselines, `runId` in metrics

### Query Optimization Tips

```typescript
// ✅ Good: Use indexes
const runs = await repo.getRuns({
  datasetId: 'compliance-v1', // Uses index
  status: 'completed',         // Uses index
});

// ✅ Good: Batch operations
await repo.createResultsBatch(results); // Single transaction

// ❌ Avoid: N+1 queries
for (const run of runs) {
  await repo.getMetrics(run.id); // Multiple round trips
}

// ✅ Better: Include relations
const runs = await prisma.evalRun.findMany({
  include: { metrics: true }, // Single query
});
```

### Database Size Management

Implement regular cleanup:

```typescript
// Weekly cleanup job
async function weeklyCleanup() {
  const result = await repo.cleanupOldData({
    keepRecentDays: 60,
    keepBaselines: true,
    keepFailedRuns: true,
    keepTopPerformers: 10,
  });

  console.log(`Cleanup: ${result.runsDeleted} runs deleted`);
}
```

## Troubleshooting

### Migration Issues

**Problem**: Migration fails with "relation already exists"

**Solution**: Tables may already exist. Verify with:
```bash
psql $DATABASE_URL -c "\dt" | grep -i eval
```

**Problem**: Foreign key constraint errors

**Solution**: Ensure you create EvalRun before creating EvalResult/EvalMetrics

### Query Performance

**Problem**: Slow queries on large datasets

**Solution**:
1. Ensure indexes are created (check with `\di` in psql)
2. Use pagination with `limit` and `offset`
3. Add specific indexes for custom queries

### Data Consistency

**Problem**: Orphaned metrics or results

**Solution**: Cascade deletes should handle this. If issues persist:
```sql
-- Clean up orphaned results
DELETE FROM "EvalResult"
WHERE "runId" NOT IN (SELECT id FROM "EvalRun");

-- Clean up orphaned metrics
DELETE FROM "EvalMetrics"
WHERE "runId" NOT IN (SELECT id FROM "EvalRun");
```

## Next Steps

1. ✅ **Schema Created**: Four models with proper indexing
2. ✅ **Repository Ready**: 30+ methods for all operations
3. ✅ **Documentation Complete**: Comprehensive guides and examples
4. ⏳ **Migration Pending**: Run when DATABASE_URL is configured
5. ⏳ **Integration**: Use in dataset manager, runner, and scorer

### Integration with Other Tasks

**Task 2 - Dataset Manager**:
```typescript
// Store dataset metadata with runs
await repo.createRun({
  datasetId: dataset.id,
  datasetVersion: dataset.version,
  datasetName: dataset.name,
  ...
});
```

**Task 3 - Runner Engine**:
```typescript
// Track eval execution
const run = await repo.createRun({...});
const results = await runner.execute(dataset);
await repo.createResultsBatch(results);
await repo.calculateAndSaveMetrics(run.id);
await repo.completeRun(run.id, new Date());
```

**Task 5 - Orchestrator**:
```typescript
// Compare to baseline
const baseline = await repo.getActiveBaseline(datasetId);
const comparison = await repo.compareToBaseline(runId, baseline.id);
if (comparison.regressions.length > 0) {
  // Alert on regressions
}
```

## Resources

- **Schema Documentation**: `src/db/README.md`
- **Migration Guide**: `MIGRATION_GUIDE.md`
- **Implementation Summary**: `IMPLEMENTATION_SUMMARY.md`
- **Verification Script**: `scripts/verify-schema.ts`

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the MIGRATION_GUIDE.md
3. Run the verification script for debugging
4. Check Prisma documentation for advanced queries
