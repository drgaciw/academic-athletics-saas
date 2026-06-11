import { z } from 'zod';
import { EvalOrchestrator } from '../index';

describe('EvalOrchestrator scoring results', () => {
  it('includes dataset and model identity for each score', async () => {
    const orchestrator = new EvalOrchestrator({ workerConfig: { concurrency: 1 } });
    const jobId = orchestrator.createJob({
      datasetIds: ['compliance'],
      runnerConfigs: [
        { modelId: 'model-a' },
        { modelId: 'model-b' },
      ],
      scorerConfig: { strategy: 'exact' },
    });

    const report = await orchestrator.executeJob(
      jobId,
      [
        {
          id: 'compliance',
          name: 'Compliance',
          description: 'Compliance checks',
          version: '1.0.0',
          testCases: [
            {
              id: 'tc-1',
              input: { prompt: 'input' },
              expected: { answer: 'expected' },
              metadata: {
                difficulty: 'easy',
                category: 'eligibility',
                tags: [],
                createdAt: new Date('2026-01-01T00:00:00Z'),
                source: 'synthetic',
              },
            },
          ],
          schema: { input: z.any(), output: z.any() },
          createdAt: new Date('2026-01-01T00:00:00Z'),
          updatedAt: new Date('2026-01-01T00:00:00Z'),
        },
      ],
      async (task) => ({
        testCase: task.testCase,
        score: {
          testCaseId: task.testCase.id,
          value: 1,
          passed: true,
          actual: { answer: task.runnerConfig.modelId },
          expected: task.testCase.expected,
          latencyMs: 10,
        },
        modelConfig: task.runnerConfig,
        testCaseId: task.testCase.id,
        input: task.testCase.input,
        expected: task.testCase.expected,
        actual: { answer: task.runnerConfig.modelId },
        metadata: {
          modelId: task.runnerConfig.modelId,
          latency: 10,
          tokenUsage: { prompt: 1, completion: 1, total: 2 },
          cost: 0.01,
          timestamp: new Date('2026-01-01T00:00:00Z'),
        },
      }),
      async (result) => ({
        passed: result.modelConfig?.modelId === 'model-a',
        score: result.modelConfig?.modelId === 'model-a' ? 1 : 0.2,
      })
    );

    expect(report.scoringResults).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          datasetId: 'compliance',
          modelId: 'model-a',
          testCaseId: 'tc-1',
          score: expect.objectContaining({ passed: true, score: 1 }),
        }),
        expect.objectContaining({
          datasetId: 'compliance',
          modelId: 'model-b',
          testCaseId: 'tc-1',
          score: expect.objectContaining({ passed: false, score: 0.2 }),
        }),
      ])
    );
  });
});
