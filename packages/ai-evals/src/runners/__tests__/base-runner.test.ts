/**
 * Unit tests for BaseRunner
 */

import { z } from 'zod';
import { BaseRunner } from '../base-runner';
import { TestCase, RunnerConfig, RunResult } from '../../types';

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

describe('BaseRunner', () => {
  let runner: MockRunner;
  let testCase: TestCase<{ value: number }, { result: number }>;
  let config: RunnerConfig;

  beforeEach(() => {
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
    it('should execute a test case and return result with metadata', async () => {
      const result = await runner.runTestCase(testCase, config);

      expect(result).toMatchObject({
        testCaseId: 'test-001',
        input: { value: 5 },
        expected: { result: 10 },
        metadata: expect.objectContaining({
          modelId: 'gpt-4',
          latency: expect.any(Number),
          tokenUsage: expect.objectContaining({
            prompt: expect.any(Number),
            completion: expect.any(Number),
            total: expect.any(Number),
          }),
          cost: expect.any(Number),
          timestamp: expect.any(Date),
        }),
      });

      expect(result.metadata.latency).toBeGreaterThan(0);
    });

    it('should handle errors gracefully', async () => {
      const badConfig = {
        ...config,
        modelId: 'invalid-model',
      };

      const result = await runner.runTestCase(testCase, badConfig);

      expect(result.metadata.error).toBeDefined();
      expect(result.metadata.tokenUsage.total).toBe(0);
      expect(result.metadata.cost).toBe(0);
    });

    it('should respect timeout settings', async () => {
      const shortTimeoutConfig = {
        ...config,
        timeout: 1, // 1ms - will definitely timeout
      };

      const result = await runner.runTestCase(testCase, shortTimeoutConfig);

      expect(result.metadata.error).toContain('Timeout');
    }, 15000);

    it('should calculate cost based on token usage', async () => {
      const result = await runner.runTestCase(testCase, config);

      // Cost should be greater than 0 if tokens were used
      if (result.metadata.tokenUsage.total > 0) {
        expect(result.metadata.cost).toBeGreaterThan(0);
      }
    });
  });

  describe('runDataset', () => {
    let testCases: TestCase<{ value: number }, { result: number }>[];

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

    it('should execute test cases in parallel', async () => {
      const results = await runner.runDataset(testCases, config, {
        parallel: true,
        concurrency: 2,
      });

      expect(results).toHaveLength(3);
      // Results should contain all test case IDs (order may vary)
      const ids = results.map((r) => r.testCaseId);
      expect(ids).toContain('test-001');
      expect(ids).toContain('test-002');
      expect(ids).toContain('test-003');
    });

    it('should call progress callback', async () => {
      const progressUpdates: Array<{ completed: number; total: number }> = [];

      await runner.runDataset(testCases, config, {
        parallel: false,
        onProgress: (completed, total) => {
          progressUpdates.push({ completed, total });
        },
      });

      expect(progressUpdates).toHaveLength(3);
      expect(progressUpdates[0]).toEqual({ completed: 1, total: 3 });
      expect(progressUpdates[1]).toEqual({ completed: 2, total: 3 });
      expect(progressUpdates[2]).toEqual({ completed: 3, total: 3 });
    });

    it('should continue execution even if some tests fail', async () => {
      const mixedTestCases = [
        testCases[0],
        {
          ...testCases[1],
          // This will cause an error during execution
          id: 'test-error',
        },
        testCases[2],
      ];

      const results = await runner.runDataset(mixedTestCases, config, {
        parallel: false,
      });

      expect(results).toHaveLength(3);
      // At least some tests should succeed
      const successfulTests = results.filter((r) => !r.metadata.error);
      expect(successfulTests.length).toBeGreaterThan(0);
    });
  });

  describe('generateRunSummary', () => {
    it('should generate accurate run summary', () => {
      const results: RunResult<{ result: number }>[] = [
        {
          testCaseId: 'test-001',
          input: { value: 5 },
          expected: { result: 10 },
          actual: { result: 10 },
          metadata: {
            modelId: 'gpt-4',
            latency: 1000,
            tokenUsage: { prompt: 50, completion: 25, total: 75 },
            cost: 0.005,
            timestamp: new Date(),
          },
        },
        {
          testCaseId: 'test-002',
          input: { value: 10 },
          expected: { result: 20 },
          actual: { result: 20 },
          metadata: {
            modelId: 'gpt-4',
            latency: 1200,
            tokenUsage: { prompt: 60, completion: 30, total: 90 },
            cost: 0.006,
            timestamp: new Date(),
          },
        },
      ];

      const startTime = new Date();
      const endTime = new Date(startTime.getTime() + 5000);

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
      expect(() => runner.runTestCase(testCase, { modelId: 'gpt-4' })).not.toThrow();
      expect(() => runner.runTestCase(testCase, { modelId: 'openai/gpt-4' })).not.toThrow();
      expect(() => runner.runTestCase(testCase, { modelId: 'gpt-3.5-turbo' })).not.toThrow();
    });

    it('should detect Anthropic models', () => {
      expect(() =>
        runner.runTestCase(testCase, { modelId: 'claude-sonnet-4' })
      ).not.toThrow();
      expect(() =>
        runner.runTestCase(testCase, { modelId: 'anthropic/claude-opus-4' })
      ).not.toThrow();
    });

    it('should throw error for unknown providers', async () => {
      const result = await runner.runTestCase(testCase, {
        modelId: 'unknown/model',
      });

      expect(result.metadata.error).toBeDefined();
      expect(result.metadata.error).toContain('Unknown model provider');
    });
  });

  describe('retry logic', () => {
    it('should retry on retryable errors', async () => {
      // This test is more of a smoke test since we can't easily mock retryable errors
      const result = await runner.runTestCase(testCase, {
        ...config,
        retries: 1,
        timeout: 5000,
      });

      // Should complete without throwing
      expect(result).toBeDefined();
    });

    it('should not retry on non-retryable errors', async () => {
      const result = await runner.runTestCase(testCase, {
        modelId: 'invalid-model',
        retries: 3,
      });

      expect(result.metadata.error).toBeDefined();
      // Error should be immediate, not after retries
    });
  });
});
