import { EvalRepository } from '../repository';

function runResult(testCaseId: string, actual: string, modelId: string) {
  return {
    testCaseId,
    input: { prompt: testCaseId },
    expected: 'expected',
    actual,
    metadata: {
      modelId,
      latency: 10,
      tokenUsage: { prompt: 1, completion: 1, total: 2 },
      cost: 0.01,
      timestamp: new Date('2026-01-01T00:00:00Z'),
    },
  };
}

describe('EvalRepository.persistEvalReport', () => {
  it('matches scores by dataset and model when test case IDs repeat', async () => {
    const createdResults: any[][] = [];
    const prisma = {
      evalRun: {
        create: jest.fn(async ({ data }) => ({
          id: `run-${data.modelId}`,
          startTime: data.startTime,
        })),
        findUnique: jest.fn(async () => ({ startTime: new Date('2026-01-01T00:00:00Z') })),
        update: jest.fn(async ({ where }) => ({ id: where.id })),
      },
      evalResult: {
        createMany: jest.fn(async ({ data }) => {
          createdResults.push(data);
          return { count: data.length };
        }),
        findMany: jest.fn(async () => [
          {
            passed: true,
            score: 1,
            latencyMs: 10,
            cost: 0.01,
            tokenUsage: { total: 2 },
            metadata: {},
          },
        ]),
      },
      evalMetrics: {
        create: jest.fn(async ({ data }) => data),
      },
    };
    const repository = new EvalRepository(prisma as any);

    await repository.persistEvalReport(
      {
        runSummaries: [
          {
            datasetId: 'compliance',
            runId: 'summary-a',
            config: { modelId: 'model-a' },
            results: [runResult('tc-1', 'answer-a', 'model-a')],
            startTime: new Date('2026-01-01T00:00:00Z'),
            endTime: new Date('2026-01-01T00:00:01Z'),
            totalDuration: 10,
            totalCost: 0.01,
            totalTokens: 2,
          },
          {
            datasetId: 'compliance',
            runId: 'summary-b',
            config: { modelId: 'model-b' },
            results: [runResult('tc-1', 'answer-b', 'model-b')],
            startTime: new Date('2026-01-01T00:00:00Z'),
            endTime: new Date('2026-01-01T00:00:01Z'),
            totalDuration: 10,
            totalCost: 0.01,
            totalTokens: 2,
          },
        ],
        scoringResults: [
          {
            datasetId: 'compliance',
            modelId: 'model-a',
            testCaseId: 'tc-1',
            score: { passed: true, score: 0.9, explanation: 'model-a score' },
            scorerConfig: { strategy: 'exact' },
          },
          {
            datasetId: 'compliance',
            modelId: 'model-b',
            testCaseId: 'tc-1',
            score: { passed: false, score: 0.2, explanation: 'model-b score' },
            scorerConfig: { strategy: 'exact' },
          },
        ],
      } as any,
      [{ id: 'compliance', version: '1.0.0', name: 'Compliance' }],
      { scorer: { strategy: 'exact' } }
    );

    expect(createdResults).toHaveLength(2);
    expect(createdResults[0][0]).toMatchObject({
      runId: 'run-model-a',
      passed: true,
      score: 0.9,
      explanation: 'model-a score',
    });
    expect(createdResults[1][0]).toMatchObject({
      runId: 'run-model-b',
      passed: false,
      score: 0.2,
      explanation: 'model-b score',
    });
  });

  it('does not reuse ambiguous legacy scores across repeated test case IDs', async () => {
    const createdResults: any[][] = [];
    const prisma = {
      evalRun: {
        create: jest.fn(async ({ data }) => ({
          id: `run-${data.modelId}`,
          startTime: data.startTime,
        })),
        findUnique: jest.fn(async () => ({ startTime: new Date('2026-01-01T00:00:00Z') })),
        update: jest.fn(async ({ where }) => ({ id: where.id })),
      },
      evalResult: {
        createMany: jest.fn(async ({ data }) => {
          createdResults.push(data);
          return { count: data.length };
        }),
        findMany: jest.fn(async () => [
          {
            passed: false,
            score: 0,
            latencyMs: 10,
            cost: 0.01,
            tokenUsage: { total: 2 },
            metadata: {},
          },
        ]),
      },
      evalMetrics: {
        create: jest.fn(async ({ data }) => data),
      },
    };
    const repository = new EvalRepository(prisma as any);

    await repository.persistEvalReport(
      {
        runSummaries: [
          {
            datasetId: 'compliance',
            runId: 'summary-a',
            config: { modelId: 'model-a' },
            results: [runResult('tc-1', 'answer-a', 'model-a')],
            startTime: new Date('2026-01-01T00:00:00Z'),
            endTime: new Date('2026-01-01T00:00:01Z'),
            totalDuration: 10,
            totalCost: 0.01,
            totalTokens: 2,
          },
          {
            datasetId: 'compliance',
            runId: 'summary-b',
            config: { modelId: 'model-b' },
            results: [runResult('tc-1', 'answer-b', 'model-b')],
            startTime: new Date('2026-01-01T00:00:00Z'),
            endTime: new Date('2026-01-01T00:00:01Z'),
            totalDuration: 10,
            totalCost: 0.01,
            totalTokens: 2,
          },
        ],
        scoringResults: [
          {
            testCaseId: 'tc-1',
            score: { passed: true, score: 0.9, explanation: 'first legacy score' },
            scorerConfig: { strategy: 'exact' },
          },
          {
            testCaseId: 'tc-1',
            score: { passed: true, score: 0.8, explanation: 'second legacy score' },
            scorerConfig: { strategy: 'exact' },
          },
        ],
      } as any,
      [{ id: 'compliance', version: '1.0.0', name: 'Compliance' }],
      { scorer: { strategy: 'exact' } }
    );

    expect(createdResults[0][0]).toMatchObject({
      runId: 'run-model-a',
      passed: false,
      score: 0,
      explanation: undefined,
    });
    expect(createdResults[1][0]).toMatchObject({
      runId: 'run-model-b',
      passed: false,
      score: 0,
      explanation: undefined,
    });
  });

  it('does not reuse a single legacy score when multiple results share the test case ID', async () => {
    const createdResults: any[][] = [];
    const prisma = {
      evalRun: {
        create: jest.fn(async ({ data }) => ({
          id: `run-${data.modelId}`,
          startTime: data.startTime,
        })),
        findUnique: jest.fn(async () => ({ startTime: new Date('2026-01-01T00:00:00Z') })),
        update: jest.fn(async ({ where }) => ({ id: where.id })),
      },
      evalResult: {
        createMany: jest.fn(async ({ data }) => {
          createdResults.push(data);
          return { count: data.length };
        }),
        findMany: jest.fn(async () => [
          {
            passed: false,
            score: 0,
            latencyMs: 10,
            cost: 0.01,
            tokenUsage: { total: 2 },
            metadata: {},
          },
        ]),
      },
      evalMetrics: {
        create: jest.fn(async ({ data }) => data),
      },
    };
    const repository = new EvalRepository(prisma as any);

    await repository.persistEvalReport(
      {
        runSummaries: [
          {
            datasetId: 'compliance',
            runId: 'summary-a',
            config: { modelId: 'model-a' },
            results: [runResult('tc-1', 'answer-a', 'model-a')],
            startTime: new Date('2026-01-01T00:00:00Z'),
            endTime: new Date('2026-01-01T00:00:01Z'),
            totalDuration: 10,
            totalCost: 0.01,
            totalTokens: 2,
          },
          {
            datasetId: 'compliance',
            runId: 'summary-b',
            config: { modelId: 'model-b' },
            results: [runResult('tc-1', 'answer-b', 'model-b')],
            startTime: new Date('2026-01-01T00:00:00Z'),
            endTime: new Date('2026-01-01T00:00:01Z'),
            totalDuration: 10,
            totalCost: 0.01,
            totalTokens: 2,
          },
        ],
        scoringResults: [
          {
            testCaseId: 'tc-1',
            score: { passed: true, score: 0.9, explanation: 'only legacy score' },
            scorerConfig: { strategy: 'exact' },
          },
        ],
      } as any,
      [{ id: 'compliance', version: '1.0.0', name: 'Compliance' }],
      { scorer: { strategy: 'exact' } }
    );

    expect(createdResults[0][0]).toMatchObject({
      runId: 'run-model-a',
      passed: false,
      score: 0,
      explanation: undefined,
    });
    expect(createdResults[1][0]).toMatchObject({
      runId: 'run-model-b',
      passed: false,
      score: 0,
      explanation: undefined,
    });
  });
});
