import { generateObject, generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';
import {
  TestCase,
  RunResult,
  ModelConfig,
} from '../types';

// TODO: Refactor these types - temporarily defined here for compatibility
type TokenUsage = { prompt: number; completion: number; total: number };
type RunnerConfig = ModelConfig & { timeout?: number; retries?: number };
type RunSummary = { runId: string; results: RunResult[]; totalCost: number; totalTokens: number };
type EvalError = Error & { code?: string; retryable?: boolean };

/**
 * Pricing information for different models (USD per 1000 tokens)
 * Updated as of January 2025
 */
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'gpt-4': { input: 0.03, output: 0.06 },
  'gpt-4-turbo': { input: 0.01, output: 0.03 },
  'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
  'claude-opus-4': { input: 0.015, output: 0.075 },
  'claude-sonnet-4': { input: 0.003, output: 0.015 },
  'claude-haiku-4': { input: 0.00025, output: 0.00125 },
};

/**
 * Get the model provider from a model ID
 */
function getModelProvider(modelId: string) {
  if (modelId.startsWith('openai/') || modelId.startsWith('gpt')) {
    return openai;
  } else if (modelId.startsWith('anthropic/') || modelId.startsWith('claude')) {
    return anthropic;
  }
  throw new Error(`Unknown model provider for: ${modelId}`);
}

/**
 * Get the model name without the provider prefix
 */
function getModelName(modelId: string): string {
  return modelId.includes('/') ? modelId.split('/')[1] : modelId;
}

/**
 * Calculate cost based on token usage and model pricing
 */
function calculateCost(modelId: string, tokenUsage: TokenUsage): number {
  const modelName = getModelName(modelId);
  const pricing = MODEL_PRICING[modelName];

  if (!pricing) {
    console.warn(`No pricing information for model: ${modelName}. Using default.`);
    return 0;
  }

  const inputCost = (tokenUsage.prompt / 1000) * pricing.input;
  const outputCost = (tokenUsage.completion / 1000) * pricing.output;

  return inputCost + outputCost;
}

/**
 * Sleep for a given duration (used for retry backoff)
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if an error is retryable
 */
function isRetryableError(error: any): boolean {
  const retryableMessages = [
    'rate limit',
    'timeout',
    'ECONNRESET',
    'ETIMEDOUT',
    'ENOTFOUND',
    '429',
    '500',
    '502',
    '503',
    '504',
  ];

  const errorString = error?.message?.toLowerCase() || String(error).toLowerCase();
  return retryableMessages.some((msg) => errorString.includes(msg));
}

/**
 * Execute a function with retry logic and exponential backoff
 */
async function executeWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (!isRetryableError(error) || attempt === maxRetries - 1) {
        throw error;
      }

      const delay = baseDelay * Math.pow(2, attempt);
      console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms...`);
      await sleep(delay);
    }
  }

  throw new Error('Max retries exceeded');
}

/**
 * Execute a function with timeout
 */
async function executeWithTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number
): Promise<T> {
  return Promise.race([
    fn(),
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs)
    ),
  ]);
}

/**
 * Base abstract class for all runners
 * Provides common execution logic, error handling, and metrics tracking
 */
export abstract class BaseRunner<TInput = any, TOutput = any> {
  protected defaultConfig: Partial<RunnerConfig> = {
    temperature: 0.7,
    maxTokens: 2000,
    timeout: 30000, // 30 seconds
    retries: 3,
  };

  /**
   * Abstract method to prepare the prompt for the model
   * Each runner must implement this based on their specific use case
   */
  protected abstract preparePrompt(input: TInput): string;

  /**
   * Abstract method to get the output schema for structured generation
   * Return null if using text generation instead of structured output
   */
  protected abstract getOutputSchema(): z.ZodSchema<TOutput> | null;

  /**
   * Abstract method to parse the model output into the expected format
   * Only called if getOutputSchema() returns null
   */
  protected abstract parseOutput(output: string): TOutput;

  /**
   * Run a single test case with the configured model
   */
  async runTestCase(
    testCase: TestCase<TInput, TOutput>,
    config: RunnerConfig
  ): Promise<RunResult<TOutput>> {
    const mergedConfig = { ...this.defaultConfig, ...config };
    const startTime = Date.now();

    try {
      const result = await executeWithRetry(
        async () => {
          return await executeWithTimeout(
            async () => {
              return await this.executeModel(testCase.input, mergedConfig);
            },
            mergedConfig.timeout!
          );
        },
        mergedConfig.retries
      );

      const latency = Date.now() - startTime;
      const cost = calculateCost(mergedConfig.modelId, result.tokenUsage);

      return {
        testCaseId: testCase.id,
        input: testCase.input,
        expected: testCase.expected,
        actual: result.output,
        metadata: {
          modelId: mergedConfig.modelId,
          latency,
          tokenUsage: result.tokenUsage,
          cost,
          timestamp: new Date(),
        },
      };
    } catch (error) {
      const latency = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      return {
        testCaseId: testCase.id,
        input: testCase.input,
        expected: testCase.expected,
        actual: {} as TOutput, // Return empty object on error
        metadata: {
          modelId: mergedConfig.modelId,
          latency,
          tokenUsage: { prompt: 0, completion: 0, total: 0 },
          cost: 0,
          timestamp: new Date(),
          error: errorMessage,
        },
      };
    }
  }

  /**
   * Execute the model with either structured or text generation
   */
  private async executeModel(
    input: TInput,
    config: RunnerConfig
  ): Promise<{ output: TOutput; tokenUsage: TokenUsage }> {
    const prompt = this.preparePrompt(input);
    const schema = this.getOutputSchema();
    const provider = getModelProvider(config.modelId);
    const modelName = getModelName(config.modelId);

    if (schema) {
      // Use structured output generation
      const result = await generateObject({
        model: provider(modelName),
        schema,
        prompt,
        temperature: config.temperature,
        maxTokens: config.maxTokens,
        ...config.additionalParams,
      });

      return {
        output: result.object,
        tokenUsage: {
          prompt: result.usage?.promptTokens || 0,
          completion: result.usage?.completionTokens || 0,
          total: result.usage?.totalTokens || 0,
        },
      };
    } else {
      // Use text generation
      const result = await generateText({
        model: provider(modelName),
        prompt,
        temperature: config.temperature,
        maxTokens: config.maxTokens,
        ...config.additionalParams,
      });

      return {
        output: this.parseOutput(result.text),
        tokenUsage: {
          prompt: result.usage?.promptTokens || 0,
          completion: result.usage?.completionTokens || 0,
          total: result.usage?.totalTokens || 0,
        },
      };
    }
  }

  /**
   * Run all test cases in a dataset
   */
  async runDataset(
    testCases: TestCase<TInput, TOutput>[],
    config: RunnerConfig,
    options?: {
      parallel?: boolean;
      concurrency?: number;
      onProgress?: (completed: number, total: number) => void;
    }
  ): Promise<RunResult<TOutput>[]> {
    const parallel = options?.parallel ?? false;
    const concurrency = options?.concurrency ?? 5;

    if (!parallel) {
      // Sequential execution
      const results: RunResult<TOutput>[] = [];
      for (let i = 0; i < testCases.length; i++) {
        const result = await this.runTestCase(testCases[i], config);
        results.push(result);
        options?.onProgress?.(i + 1, testCases.length);
      }
      return results;
    } else {
      // Parallel execution with concurrency limit
      return this.runParallel(testCases, config, concurrency, options?.onProgress);
    }
  }

  /**
   * Run test cases in parallel with concurrency control
   */
  private async runParallel(
    testCases: TestCase<TInput, TOutput>[],
    config: RunnerConfig,
    concurrency: number,
    onProgress?: (completed: number, total: number) => void
  ): Promise<RunResult<TOutput>[]> {
    const results: RunResult<TOutput>[] = [];
    let completed = 0;

    // Create batches based on concurrency
    for (let i = 0; i < testCases.length; i += concurrency) {
      const batch = testCases.slice(i, i + concurrency);
      const batchResults = await Promise.all(
        batch.map((testCase) => this.runTestCase(testCase, config))
      );

      results.push(...batchResults);
      completed += batch.length;
      onProgress?.(completed, testCases.length);
    }

    return results;
  }

  /**
   * Generate a run summary from results
   */
  protected generateRunSummary(
    datasetId: string,
    config: RunnerConfig,
    results: RunResult<TOutput>[],
    startTime: Date,
    endTime: Date
  ): RunSummary {
    const totalCost = results.reduce((sum, r) => sum + r.metadata.cost, 0);
    const totalTokens = results.reduce((sum, r) => sum + r.metadata.tokenUsage.total, 0);

    return {
      datasetId,
      runId: `run_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      config,
      results,
      startTime,
      endTime,
      totalDuration: endTime.getTime() - startTime.getTime(),
      totalCost,
      totalTokens,
    };
  }
}
