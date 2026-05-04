/**
 * Unit tests for BaseRunner
 */
import { z } from 'zod';
import { BaseRunner } from '../base-runner';
import { TestCase, RunnerConfig, RunResult } from '../../types/index';

const mockGenerateObject = jest.fn();
const mockGenerateText = jest.fn();

// Mock the AI SDK modules
jest.mock('ai', () => ({
      generateObject: (...args: any[]) => mockGenerateObject(...args),
      generateText: (...args: any[]) => mockGenerateText(...args),
}));

jest.mock('@ai-sdk/openai', () => ({
      openai: jest.fn((model: string) => ({ modelId: model, provider: 'openai' })),
}));

jest.mock('@ai-sdk/anthropic', () => ({
      anthropic: jest.fn((model: string) => ({ modelId: model, provider: 'anthropic' })),
}));

// Check if API key is available for integration tests
const hasOpenAIKey = !!process.env.OPENAI_API_KEY;
const itWithApiKey = hasOpenAIKey ? it : it.skip;

// Mock implementation for testing
class MockRunner extends BaseRunner<{ value: number }, { result: number }> {
      protected preparePrompt(input: { value: number }): string {
              return `Calculate double of ${input.value}`;
      }

  protected getOutputSchema(): z.ZodSchema<{ result: number }> {
          return z.object({
                    result: z.number(),
          });
  }

  protected parseOutput(output: string): { result: number } {
          return { result: parseInt(output) };
  }
}

const defaultMockResponse = {
      object: { result: 10 },
      usage: { promptTokens: 50, completionTokens: 25, totalTokens: 75 },
};

describe('BaseRunner', () => {
      let runner: MockRunner;
      let testCase: TestCase<{ value: number }, { result: number }>;
      let config: RunnerConfig;

           beforeEach(() => {
                   jest.clearAllMocks();
                   mockGenerateObject.mockResolvedValue(defaultMockResponse);
                   mockGenerateText.mockResolvedValue({
                             text: '10',
                             usage: { promptTokens: 50, completionTokens: 25, totalTokens: 75 },
                   });
                   runner = new MockRunner();

                          testCase = {
                                    id: 'test-001',
                                    input: { value: 5 },
                                    expected: { result: 10 },
                                    metadata: {
                                                difficulty: 'easy',
                                                category: 'math',
                                                tags: ['calculation'],
                                                createdAt: new Date(),
                                                source: 'synthetic',
                                    },
                          };

                          config = {
                                    modelId: 'gpt-4',
                                    temperature: 0.1,
                                    maxTokens: 100,
                                    timeout: 10000,
                                    retries: 2,
                          };
           });

  describe('runTestCase', () => {
    itWithApiKey('should execute a test case and return result with metadata', async () => {
      const result = await runner.runTestCase(testCase, config);

                            expect(result).toMatchObject({
                                        testCaseId: 'test-001',
                                        input: { value: 5 },
                                        expected: { result: 10 },
                                        metadata: expect.objectContaining({
                                                      modelId: 'gpt-4',
                                                      latency: expect.any(Number),
                                                      cost: expect.any(Number),
                                                      timestamp: expect.any(Date),
                                        }),
                            });
                             expect(result.metadata.latency).toBeGreaterThanOrEqual(0);
                   });

                        it('should handle errors gracefully', async () => {
                                  // Use unknown/model which throws in getModelProvider before generateObject is called
                                 const badConfig = {
                                             ...config,
                                             modelId: 'unknown/model',
                                 };

    itWithApiKey('should handle errors gracefully', async () => {
      const badConfig = {
        ...config,
        modelId: 'invalid-model',
      };

                        it('should respect timeout settings', async () => {
                                  mockGenerateObject.mockImplementation(
                                              () => new Promise((resolve) => setTimeout(resolve, 5000))
                                            );

                                 const shortTimeoutConfig = {
                                             ...config,
                                             timeout: 1,
                                             retries: 1,
                                 };

    itWithApiKey('should respect timeout settings', async () => {
      const shortTimeoutConfig = {
        ...config,
        timeout: 1, // 1ms - will definitely timeout
      };

                        it('should calculate cost based on token usage', async () => {
                                  const result = await runner.runTestCase(testCase, config);

                                  if (result.metadata.tokenUsage.total > 0) {
                                              expect(result.metadata.cost).toBeGreaterThan(0);
                                  }
                        });
           });

    itWithApiKey('should calculate cost based on token usage', async () => {
      const result = await runner.runTestCase(testCase, config);

                        beforeEach(() => {
                                  testCases = [
                                      {
                                                    id: 'test-001',
                                                    input: { value: 5 },
                                                    expected: { result: 10 },
                                                    metadata: {
                                                                    difficulty: 'easy',
                                                                    category: 'math',
                                                                    tags: ['calculation'],
                                                                    createdAt: new Date(),
                                                                    source: 'synthetic',
                                                    },
                                      },
                                      {
                                                    id: 'test-002',
                                                    input: { value: 10 },
                                                    expected: { result: 20 },
                                                    metadata: {
                                                                    difficulty: 'easy',
                                                                    category: 'math',
                                                                    tags: ['calculation'],
                                                                    createdAt: new Date(),
                                                                    source: 'synthetic',
                                                    },
                                      },
                                      {
                                                    id: 'test-003',
                                                    input: { value: 15 },
                                                    expected: { result: 30 },
                                                    metadata: {
                                                                    difficulty: 'easy',
                                                                    category: 'math',
                                                                    tags: ['calculation'],
                                                                    createdAt: new Date(),
                                                                    source: 'synthetic',
                                                    },
                                      },
                                            ];
                        });

                        it('should execute all test cases sequentially', async () => {
                                  const results = await runner.runDataset(testCases, config, {
                                              parallel: false,
                                  });

                                 expect(results).toHaveLength(3);
                                  expect(results[0].testCaseId).toBe('test-001');
                                  expect(results[1].testCaseId).toBe('test-002');
                                  expect(results[2].testCaseId).toBe('test-003');
                        });

    itWithApiKey('should execute all test cases sequentially', async () => {
      const results = await runner.runDataset(testCases, config, {
        parallel: false,
      });

                                 expect(results).toHaveLength(3);
                                  const ids = results.map((r) => r.testCaseId);
                                  expect(ids).toContain('test-001');
                                  expect(ids).toContain('test-002');
                                  expect(ids).toContain('test-003');
                        });

    itWithApiKey('should execute test cases in parallel', async () => {
      const results = await runner.runDataset(testCases, config, {
        parallel: true,
        concurrency: 2,
      });

                                 await runner.runDataset(testCases, config, {
                                             parallel: false,
                                             onProgress: (completed, total) => {
                                                           progressUpdates.push({ completed, total });
                                             },
                                 });

    itWithApiKey('should call progress callback', async () => {
      const progressUpdates: Array<{ completed: number; total: number }> = [];

                        it('should continue execution even if some tests fail', async () => {
                                  mockGenerateObject
                                    .mockResolvedValueOnce(defaultMockResponse)
                                    .mockRejectedValueOnce(new Error('API Error'))
                                    .mockResolvedValueOnce(defaultMockResponse);

                                 const results = await runner.runDataset(testCases, config, {
                                             parallel: false,
                                 });

    it('should continue execution even if some tests fail', async () => {
      const mixedTestCases = [
        testCases[0],
        {
          ...testCases[1],
          id: 'test-error',
        },
        testCases[2],
      ];

      const runTestCaseSpy = jest.spyOn(runner, 'runTestCase');
      runTestCaseSpy
        .mockResolvedValueOnce({
          testCaseId: 'test-001',
          input: mixedTestCases[0].input,
          expected: mixedTestCases[0].expected,
          actual: { result: 10 },
          metadata: {
            modelId: 'gpt-4',
            latency: 10,
            tokenUsage: { prompt: 1, completion: 1, total: 2 },
            cost: 0.001,
            timestamp: new Date(),
          },
        })
        .mockResolvedValueOnce({
          testCaseId: 'test-error',
          input: mixedTestCases[1].input,
          expected: mixedTestCases[1].expected,
          actual: {} as { result: number },
          metadata: {
            modelId: 'gpt-4',
            latency: 5,
            tokenUsage: { prompt: 0, completion: 0, total: 0 },
            cost: 0,
            timestamp: new Date(),
            error: 'synthetic failure',
          },
        })
        .mockResolvedValueOnce({
          testCaseId: 'test-003',
          input: mixedTestCases[2].input,
          expected: mixedTestCases[2].expected,
          actual: { result: 30 },
          metadata: {
            modelId: 'gpt-4',
            latency: 10,
            tokenUsage: { prompt: 1, completion: 1, total: 2 },
            cost: 0.001,
            timestamp: new Date(),
          },
        });

      const results = await runner.runDataset(mixedTestCases, config, {
        parallel: false,
      });

      expect(results).toHaveLength(3);
      expect(runTestCaseSpy).toHaveBeenCalledTimes(3);
      const successfulTests = results.filter((r) => !r.metadata.error);
      expect(successfulTests.length).toBeGreaterThan(0);
      const failedTests = results.filter((r) => !!r.metadata.error);
      expect(failedTests).toHaveLength(1);
    });
  });

                            const summary = runner['generateRunSummary'](
                                        'dataset-123',
                                        config,
                                        results,
                                        startTime,
                                        endTime
                                      );

                            expect(summary).toMatchObject({
                                        datasetId: 'dataset-123',
                                        runId: expect.stringContaining('run_'),
                                        config,
                                        results,
                                        startTime,
                                        endTime,
                                        totalDuration: 5000,
                                        totalCost: 0.011,
                                        totalTokens: 165,
                            });
                   });
           });

           describe('model provider detection', () => {
                   it('should detect OpenAI models', () => {
                             expect(() =>
                                         runner.runTestCase(testCase, { modelId: 'gpt-4' })
                                          ).not.toThrow();
                             expect(() =>
                                         runner.runTestCase(testCase, { modelId: 'openai/gpt-4' })
                                          ).not.toThrow();
                             expect(() =>
                                         runner.runTestCase(testCase, { modelId: 'gpt-3.5-turbo' })
                                          ).not.toThrow();
                   });

                        it('should detect Anthropic models', () => {
                                  expect(() =>
                                              runner.runTestCase(testCase, { modelId: 'claude-sonnet-4' })
                                               ).not.toThrow();
                                  expect(() =>
                                              runner.runTestCase(testCase, { modelId: 'anthropic/claude-opus-4' })
                                               ).not.toThrow();
                        });

                        it('should handle unknown providers with error in result', async () => {
                                  const result = await runner.runTestCase(testCase, {
                                              modelId: 'unknown/model',
                                  });
                                  expect(result.metadata.error).toBeDefined();
                                  expect(result.metadata.error).toContain('Unknown model provider');
                        });
           });

           describe('retry logic', () => {
                   it('should retry on retryable errors', async () => {
                             const result = await runner.runTestCase(testCase, {
                                         ...config,
                                         retries: 1,
                                         timeout: 5000,
                             });

                            expect(result).toBeDefined();
                   });

                        it('should not retry on non-retryable errors', async () => {
                                  mockGenerateObject.mockRejectedValue(
                                              new Error('Invalid request')
                                            );

                                 const result = await runner.runTestCase(testCase, {
                                             ...config,
                                             modelId: 'gpt-4',
                                             retries: 3,
                                 });
                                  expect(result.metadata.error).toBeDefined();
                        });
           });
});
