# Database Migration Guide - AI Evaluation Framework

This guide walks through setting up the database schema for the AI Evaluation Framework.

## Prerequisites

- Vercel Postgres database configured
- `DATABASE_URL` environment variable set
- Prisma CLI installed (included in project dependencies)

## Migration Overview

The AI Evaluation Framework adds four new models to the existing Prisma schema:

1. **EvalRun** - Tracks individual evaluation runs
2. **EvalResult** - Stores results for each test case in a run
3. **EvalMetrics** - Aggregated metrics for each run
4. **EvalBaseline** - Baseline runs for regression detection

These models are isolated and don't modify existing tables, making this a safe additive migration.

## Step 1: Verify Schema Changes

Review the schema additions in `packages/database/prisma/schema.prisma`:

```bash
# From project root
cd packages/database
cat prisma/schema.prisma | grep -A 50 "AI EVALUATION FRAMEWORK"
```

You should see the four new models with proper indexes and relations.

## Step 2: Generate Migration

Create a new Prisma migration:

```bash
# From packages/database directory
cd packages/database

# Generate migration
npm run db:migrate -- --name add_ai_eval_framework

# This creates a new migration file in prisma/migrations/
```

The migration will include:

- `CREATE TABLE` statements for all four models
- `CREATE INDEX` statements for query optimization
- Foreign key constraints for relations

## Step 3: Review Migration SQL

Before applying, review the generated SQL:

```bash
# The migration file will be in:
# packages/database/prisma/migrations/YYYYMMDDHHMMSS_add_ai_eval_framework/migration.sql

cat prisma/migrations/*/migration.sql | tail -200
```

Expected tables:
- `EvalRun` with indexes on datasetId, modelId, runnerType, status, startTime, createdAt
- `EvalResult` with indexes on runId, testCaseId, passed, score, createdAt
- `EvalMetrics` with indexes on runId, accuracy, avgScore, createdAt
- `EvalBaseline` with indexes on name, datasetId, modelId, isActive, createdAt

## Step 4: Apply Migration to Development Database

```bash
# From packages/database directory
npm run db:push

# Or use migrate for production:
npm run db:migrate
```

Expected output:
```
✔ Generated Prisma Client
✔ Applied migration 20250108_add_ai_eval_framework
```

## Step 5: Generate Prisma Client

Update the Prisma Client with the new models:

```bash
# From packages/database directory
npm run db:generate
```

This generates TypeScript types for the new models.

## Step 6: Verify Migration

Check that tables were created:

```bash
# Option 1: Use Prisma Studio
npm run db:studio

# Option 2: Direct SQL query (if you have psql)
psql $DATABASE_URL -c "\dt"
```

You should see:
- `EvalRun`
- `EvalResult`
- `EvalMetrics`
- `EvalBaseline`

Verify indexes:

```bash
psql $DATABASE_URL -c "\di" | grep -i eval
```

## Step 7: Test the Schema

Create a simple test to verify the schema works:

```typescript
// test-eval-schema.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testSchema() {
  // Create a test run
  const run = await prisma.evalRun.create({
    data: {
      datasetId: 'test-dataset',
      datasetVersion: '1.0.0',
      modelId: 'test-model',
      modelConfig: { temperature: 0.5 },
      runnerType: 'COMPLIANCE',
      scorerConfig: { strategy: 'exact' },
      startTime: new Date(),
      status: 'running',
    },
  });

  console.log('✓ Created EvalRun:', run.id);

  // Create a test result
  const result = await prisma.evalResult.create({
    data: {
      runId: run.id,
      testCaseId: 'test-001',
      input: { test: 'data' },
      expected: { result: 'expected' },
      actual: { result: 'expected' },
      passed: true,
      score: 1.0,
      latencyMs: 100,
      tokenUsage: { prompt: 10, completion: 5, total: 15 },
      cost: 0.001,
    },
  });

  console.log('✓ Created EvalResult:', result.id);

  // Create test metrics
  const metrics = await prisma.evalMetrics.create({
    data: {
      runId: run.id,
      totalTests: 1,
      passedTests: 1,
      failedTests: 0,
      accuracy: 1.0,
      passRate: 1.0,
      avgScore: 1.0,
      avgLatencyMs: 100,
      totalCost: 0.001,
      totalTokens: 15,
    },
  });

  console.log('✓ Created EvalMetrics:', metrics.id);

  // Create a test baseline
  const baseline = await prisma.evalBaseline.create({
    data: {
      name: 'test-baseline',
      description: 'Test baseline',
      runId: run.id,
      datasetId: 'test-dataset',
      modelId: 'test-model',
      isActive: true,
    },
  });

  console.log('✓ Created EvalBaseline:', baseline.id);

  // Clean up
  await prisma.evalBaseline.delete({ where: { id: baseline.id } });
  await prisma.evalMetrics.delete({ where: { id: metrics.id } });
  await prisma.evalResult.delete({ where: { id: result.id } });
  await prisma.evalRun.delete({ where: { id: run.id } });

  console.log('✓ Cleanup complete');
  console.log('\n✅ Schema verification successful!');
}

testSchema()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

Run the test:

```bash
npx tsx test-eval-schema.ts
```

## Rollback (If Needed)

If you need to rollback the migration:

```bash
# Option 1: Rollback via Prisma
cd packages/database
npx prisma migrate resolve --rolled-back MIGRATION_NAME

# Option 2: Manual SQL rollback
psql $DATABASE_URL -c "DROP TABLE IF EXISTS \"EvalBaseline\""
psql $DATABASE_URL -c "DROP TABLE IF EXISTS \"EvalMetrics\""
psql $DATABASE_URL -c "DROP TABLE IF EXISTS \"EvalResult\""
psql $DATABASE_URL -c "DROP TABLE IF EXISTS \"EvalRun\""
```

## Production Deployment

When deploying to production:

1. **Backup database** before applying migration
2. Run migration during low-traffic period
3. Apply migration using `npm run db:migrate` (not `db:push`)
4. Monitor for errors in Vercel logs
5. Verify tables created successfully
6. Test basic operations

```bash
# In production environment
cd packages/database
npm run db:migrate
npm run db:generate
```

## Troubleshooting

### Migration fails with "relation already exists"

The tables may already exist. Check with:

```bash
psql $DATABASE_URL -c "\dt" | grep -i eval
```

If tables exist, you can:
1. Drop them manually and re-run migration
2. Skip migration and just generate client

### Client doesn't recognize new models

Ensure you've run:

```bash
cd packages/database
npm run db:generate
```

Then restart your development server.

### Foreign key constraint errors

Ensure you're not trying to create baselines or metrics without a valid `runId`.

### Index creation is slow

For large databases, index creation can take time. The migration includes indexes on:
- All foreign keys
- Common query fields (datasetId, modelId, status)
- Timestamp fields for sorting

This is normal and shouldn't cause issues.

## Schema Evolution

Future changes to the eval schema should:

1. Create a new migration
2. Maintain backward compatibility
3. Update TypeScript types
4. Document breaking changes

Example:

```bash
cd packages/database
npm run db:migrate -- --name add_eval_tags_table
```

## Maintenance Queries

Useful queries for maintaining the eval database:

```sql
-- Count runs by status
SELECT status, COUNT(*) FROM "EvalRun" GROUP BY status;

-- Average accuracy by dataset
SELECT "datasetId", AVG(accuracy) FROM "EvalRun"
JOIN "EvalMetrics" ON "EvalRun".id = "EvalMetrics"."runId"
GROUP BY "datasetId";

-- Find runs older than 90 days
SELECT id, "datasetId", "startTime" FROM "EvalRun"
WHERE "startTime" < NOW() - INTERVAL '90 days';

-- Get baseline runs
SELECT r.id, r."datasetId", r."modelId", b.name, b."isActive"
FROM "EvalRun" r
JOIN "EvalBaseline" b ON r.id = b."runId";

-- Check database size
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE tablename LIKE 'Eval%'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## Next Steps

After successful migration:

1. ✅ Schema is ready for eval framework
2. ✅ Start building dataset manager (Task 2.1)
3. ✅ Implement runner engine (Task 3.1)
4. ✅ Use repository for persisting results

See `packages/ai-evals/src/db/README.md` for repository usage examples.
