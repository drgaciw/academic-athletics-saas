import { EvalRepository } from '../repository';

describe('EvalRepository.persistEvalReport', () => {
  it('matches persisted scores by dataset, model, and test case', async () => {
    const repository = new EvalRepository({} as never);
    const createdBatches: Array<Array<{ runId: string; testCaseId: string; passed: boolean; score: number }>> = [];

    jest
      .spyOn(repository, 'createRun')
      .mockImplementation(async (input) => ({ id: `${input.datasetId}-${input.modelId}` }) as never);
    jest.spyOn(repository, 'createResultsBatch').mockImplementation(async (inputs) => {
      createdBatches.push(
        inputs.map((input) => ({
          runId: input.runId,
          testCaseId: input.testCaseId,
          passed: input.passed,
          score: input.score,
        }))
      );
      return { count: inputs.length } as never;
    });
    jest.spyOn(repository, 'calculateAndSaveMetrics').mockResolvedValue({} as never);
    jest.spyOn(repository, 'completeRun').mockResolvedValue({} as never);

    await repository.persistEvalReport(
      {
        runSummaries: [
          {
            datasetId: 'compliance',
            config: { modelId: 'model-a' },
            results: [makeRunResult('tc-1')],
            startTime: new Date('2026-01-01T00:00:00Z'),
            endTime: new Date('2026-01-01T00:00:01Z'),
          },
          {
            datasetId: 'compliance',
            config: { modelId: 'model-b' },
            results: [makeRunResult('tc-1')],
            startTime: new Date('2026-01-01T00:00:00Z'),
            endTime: new Date('2026-01-01T00:00:01Z'),
          },
        ],
        scoringResults: [
          {
            datasetId: 'compliance',
            modelId: 'model-a',
            testCaseId: 'tc-1',
            score: { passed: true, score: 1, explanation: 'model a passed' },
            scorerConfig: { strategy: 'exact' },
          },
          {
            datasetId: 'compliance',
            modelId: 'model-b',
            testCaseId: 'tc-1',
            score: { passed: false, score: 0.2, explanation: 'model b failed' },
            scorerConfig: { strategy: 'exact' },
          },
        ],
      } as never,
      [{ id: 'compliance', version: '1.0.0', name: 'Compliance' }],
      { scorer: { strategy: 'exact' } }
    );

    expect(createdBatches).toEqual([
      [{ runId: 'compliance-model-a', testCaseId: 'tc-1', passed: true, score: 1 }],
      [{ runId: 'compliance-model-b', testCaseId: 'tc-1', passed: false, score: 0.2 }],
    ]);
  });
});

function makeRunResult(testCaseId: string) {
  return {
    testCaseId,
    input: { prompt: 'input' },
    expected: { answer: 'expected' },
    actual: { answer: 'actual' },
    metadata: {
      latency: 10,
      tokenUsage: { prompt: 1, completion: 1, total: 2 },
      cost: 0.01,
    },
  };
}
