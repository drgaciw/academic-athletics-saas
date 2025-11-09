/**
 * Schema Verification Script
 *
 * This script verifies that the AI Evaluation Framework database schema
 * is correctly set up by creating, reading, and deleting test records.
 *
 * Run this after applying the migration to ensure everything works.
 *
 * Usage:
 *   npx tsx scripts/verify-schema.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface VerificationResult {
  test: string;
  status: 'PASS' | 'FAIL';
  error?: string;
  details?: any;
}

const results: VerificationResult[] = [];

function logTest(test: string, status: 'PASS' | 'FAIL', error?: string, details?: any) {
  results.push({ test, status, error, details });
  const icon = status === 'PASS' ? '✓' : '✗';
  const color = status === 'PASS' ? '\x1b[32m' : '\x1b[31m';
  console.log(`${color}${icon} ${test}\x1b[0m`);
  if (error) {
    console.log(`  Error: ${error}`);
  }
  if (details) {
    console.log(`  Details: ${JSON.stringify(details)}`);
  }
}

async function verifySchema() {
  console.log('\n🔍 AI Evaluation Framework - Schema Verification\n');
  console.log('=' .repeat(60));

  let runId: string;
  let resultId: string;
  let metricsId: string;
  let baselineId: string;

  try {
    // Test 1: Create EvalRun
    console.log('\n1. Testing EvalRun creation...');
    try {
      const run = await prisma.evalRun.create({
        data: {
          datasetId: 'test-dataset-001',
          datasetVersion: '1.0.0',
          datasetName: 'Test Dataset',
          modelId: 'openai/gpt-4',
          modelConfig: {
            temperature: 0.5,
            maxTokens: 1000,
          },
          runnerType: 'COMPLIANCE',
          scorerConfig: {
            strategy: 'exact',
            threshold: 0.95,
          },
          startTime: new Date(),
          status: 'running',
          metadata: {
            environment: 'test',
            version: '1.0.0',
          },
        },
      });

      runId = run.id;
      logTest('Create EvalRun', 'PASS', undefined, { id: run.id });
    } catch (error) {
      logTest('Create EvalRun', 'FAIL', (error as Error).message);
      throw error;
    }

    // Test 2: Update EvalRun
    console.log('\n2. Testing EvalRun update...');
    try {
      await prisma.evalRun.update({
        where: { id: runId },
        data: {
          status: 'completed',
          endTime: new Date(),
          durationMs: 5000,
        },
      });
      logTest('Update EvalRun', 'PASS');
    } catch (error) {
      logTest('Update EvalRun', 'FAIL', (error as Error).message);
      throw error;
    }

    // Test 3: Create EvalResult
    console.log('\n3. Testing EvalResult creation...');
    try {
      const result = await prisma.evalResult.create({
        data: {
          runId,
          testCaseId: 'test-case-001',
          input: {
            studentId: 'SA12345',
            gpa: 3.5,
            creditHours: 30,
          },
          expected: {
            eligible: true,
            issues: [],
          },
          actual: {
            eligible: true,
            issues: [],
          },
          passed: true,
          score: 1.0,
          confidence: 0.99,
          explanation: 'Exact match on all fields',
          latencyMs: 1250,
          tokenUsage: {
            prompt: 150,
            completion: 50,
            total: 200,
          },
          cost: 0.002,
          metadata: {
            category: 'gpa-check',
            difficulty: 'easy',
          },
        },
      });

      resultId = result.id;
      logTest('Create EvalResult', 'PASS', undefined, { id: result.id });
    } catch (error) {
      logTest('Create EvalResult', 'FAIL', (error as Error).message);
      throw error;
    }

    // Test 4: Create multiple results (batch)
    console.log('\n4. Testing batch EvalResult creation...');
    try {
      await prisma.evalResult.createMany({
        data: [
          {
            runId,
            testCaseId: 'test-case-002',
            input: { gpa: 2.0 },
            expected: { eligible: false },
            actual: { eligible: false },
            passed: true,
            score: 1.0,
            latencyMs: 1000,
            tokenUsage: { prompt: 100, completion: 30, total: 130 },
            cost: 0.001,
          },
          {
            runId,
            testCaseId: 'test-case-003',
            input: { gpa: 2.8 },
            expected: { eligible: true },
            actual: { eligible: false },
            passed: false,
            score: 0.0,
            latencyMs: 1100,
            tokenUsage: { prompt: 110, completion: 40, total: 150 },
            cost: 0.0015,
          },
        ],
      });
      logTest('Batch create EvalResults', 'PASS');
    } catch (error) {
      logTest('Batch create EvalResults', 'FAIL', (error as Error).message);
      throw error;
    }

    // Test 5: Query results
    console.log('\n5. Testing EvalResult queries...');
    try {
      const allResults = await prisma.evalResult.findMany({
        where: { runId },
      });

      const failedResults = await prisma.evalResult.findMany({
        where: { runId, passed: false },
      });

      logTest('Query EvalResults', 'PASS', undefined, {
        total: allResults.length,
        failed: failedResults.length,
      });

      if (allResults.length !== 3) {
        throw new Error(`Expected 3 results, found ${allResults.length}`);
      }
    } catch (error) {
      logTest('Query EvalResults', 'FAIL', (error as Error).message);
      throw error;
    }

    // Test 6: Create EvalMetrics
    console.log('\n6. Testing EvalMetrics creation...');
    try {
      const metrics = await prisma.evalMetrics.create({
        data: {
          runId,
          totalTests: 3,
          passedTests: 2,
          failedTests: 1,
          accuracy: 0.667,
          passRate: 0.667,
          avgScore: 0.667,
          avgLatencyMs: 1117,
          totalCost: 0.0045,
          totalTokens: 480,
          categoryBreakdown: {
            'gpa-check': {
              total: 3,
              passed: 2,
              accuracy: 0.667,
            },
          },
          failuresByType: {
            'gpa-check': 1,
          },
          scoreDistribution: {
            '0.0-0.2': 1,
            '0.2-0.4': 0,
            '0.4-0.6': 0,
            '0.6-0.8': 0,
            '0.8-1.0': 2,
          },
        },
      });

      metricsId = metrics.id;
      logTest('Create EvalMetrics', 'PASS', undefined, { id: metrics.id });
    } catch (error) {
      logTest('Create EvalMetrics', 'FAIL', (error as Error).message);
      throw error;
    }

    // Test 7: Create EvalBaseline
    console.log('\n7. Testing EvalBaseline creation...');
    try {
      const baseline = await prisma.evalBaseline.create({
        data: {
          name: 'test-baseline-001',
          description: 'Test baseline for verification',
          runId,
          datasetId: 'test-dataset-001',
          modelId: 'openai/gpt-4',
          isActive: true,
          tags: ['test', 'verification'],
          metadata: {
            createdBy: 'verify-schema.ts',
          },
        },
      });

      baselineId = baseline.id;
      logTest('Create EvalBaseline', 'PASS', undefined, { id: baseline.id });
    } catch (error) {
      logTest('Create EvalBaseline', 'FAIL', (error as Error).message);
      throw error;
    }

    // Test 8: Query with relations
    console.log('\n8. Testing queries with relations...');
    try {
      const runWithData = await prisma.evalRun.findUnique({
        where: { id: runId },
        include: {
          results: true,
          metrics: true,
        },
      });

      if (!runWithData) {
        throw new Error('Run not found');
      }

      if (!runWithData.results || runWithData.results.length !== 3) {
        throw new Error(`Expected 3 results, found ${runWithData.results?.length}`);
      }

      if (!runWithData.metrics) {
        throw new Error('Metrics not found');
      }

      logTest('Query with relations', 'PASS', undefined, {
        results: runWithData.results.length,
        hasMetrics: !!runWithData.metrics,
      });
    } catch (error) {
      logTest('Query with relations', 'FAIL', (error as Error).message);
      throw error;
    }

    // Test 9: Index performance
    console.log('\n9. Testing index usage...');
    try {
      // These queries should use indexes
      await prisma.evalRun.findMany({
        where: { datasetId: 'test-dataset-001' },
      });

      await prisma.evalRun.findMany({
        where: { modelId: 'openai/gpt-4' },
      });

      await prisma.evalResult.findMany({
        where: { passed: false },
      });

      await prisma.evalBaseline.findMany({
        where: { isActive: true },
      });

      logTest('Index usage', 'PASS');
    } catch (error) {
      logTest('Index usage', 'FAIL', (error as Error).message);
      throw error;
    }

    // Test 10: Cleanup (cascade delete)
    console.log('\n10. Testing cleanup and cascade delete...');
    try {
      // Delete baseline first
      await prisma.evalBaseline.delete({
        where: { id: baselineId },
      });

      // Delete run (should cascade to results and metrics)
      await prisma.evalRun.delete({
        where: { id: runId },
      });

      // Verify all related data is deleted
      const remainingResults = await prisma.evalResult.findMany({
        where: { runId },
      });

      const remainingMetrics = await prisma.evalMetrics.findUnique({
        where: { runId },
      });

      if (remainingResults.length > 0 || remainingMetrics !== null) {
        throw new Error('Cascade delete did not work correctly');
      }

      logTest('Cleanup and cascade delete', 'PASS');
    } catch (error) {
      logTest('Cleanup and cascade delete', 'FAIL', (error as Error).message);
      throw error;
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('\n📊 Verification Summary\n');

    const passed = results.filter((r) => r.status === 'PASS').length;
    const failed = results.filter((r) => r.status === 'FAIL').length;
    const total = results.length;

    console.log(`Total tests: ${total}`);
    console.log(`\x1b[32m✓ Passed: ${passed}\x1b[0m`);
    console.log(`\x1b[31m✗ Failed: ${failed}\x1b[0m`);

    if (failed === 0) {
      console.log('\n\x1b[32m✅ All tests passed! Schema is correctly set up.\x1b[0m\n');
      process.exit(0);
    } else {
      console.log('\n\x1b[31m❌ Some tests failed. Please review the errors above.\x1b[0m\n');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n\x1b[31m❌ Verification failed with error:\x1b[0m');
    console.error(error);

    // Attempt cleanup
    console.log('\n🧹 Attempting cleanup...');
    try {
      if (baselineId) {
        await prisma.evalBaseline.delete({ where: { id: baselineId } }).catch(() => {});
      }
      if (runId) {
        await prisma.evalRun.delete({ where: { id: runId } }).catch(() => {});
      }
      console.log('Cleanup completed.');
    } catch (cleanupError) {
      console.error('Cleanup failed:', cleanupError);
    }

    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run verification
verifySchema();
