/**
 * Parallel Execution Engine (Task 5.2 + Task 12.2 Enhancements)
 *
 * Implements parallel test case execution with configurable concurrency,
 * worker pools for CPU-intensive operations, rate limiting, and progress tracking.
 *
 * Enhanced with:
 * - Connection pooling optimization
 * - Memory-efficient streaming for large datasets
 * - Performance monitoring integration
 */

import { EventEmitter } from 'events';
import {
  TestCase,
  RunResult,
  RunnerConfig,
  WorkerConfig,
  ExecutionMetrics,
  EvalError,
} from '../types';
import { performanceMonitor } from '../performance/monitor';
import { DatasetStream, StreamConfig } from '../performance/streaming';

export interface ExecutionTask<TInput = any, TOutput = any> {
  id: string;
  testCase: TestCase<TInput, TOutput>;
  runnerConfig: RunnerConfig;
  priority?: number;
}

export interface ExecutionResult<TOutput = any> {
  task: ExecutionTask;
  result?: RunResult<TOutput>;
  error?: EvalError;
  executionTime: number;
}

export interface RateLimiter {
  requestsPerMinute: number;
  tokensPerMinute?: number;
  currentRequests: number;
  currentTokens: number;
  lastReset: number;
}

/**
 * Parallel executor with worker pool and rate limiting
 */
export class ParallelExecutor extends EventEmitter {
  private workerConfig: WorkerConfig;
  private rateLimiter: RateLimiter;
  private activeWorkers: number = 0;
  private completedTasks: number = 0;
  private failedTasks: number = 0;
  private totalThrottleTime: number = 0;
  private startTime: number = 0;
  private executionTimes: number[] = [];

  constructor(workerConfig: WorkerConfig = {}) {
    super();
    this.workerConfig = {
      maxWorkers: workerConfig.maxWorkers ?? 4,
      concurrency: workerConfig.concurrency ?? 10,
      rateLimit: workerConfig.rateLimit ?? {
        requestsPerMinute: 60,
        tokensPerMinute: 150000,
      },
    };

    this.rateLimiter = {
      requestsPerMinute: this.workerConfig.rateLimit!.requestsPerMinute,
      tokensPerMinute: this.workerConfig.rateLimit!.tokensPerMinute,
      currentRequests: 0,
      currentTokens: 0,
      lastReset: Date.now(),
    };
  }

  /**
   * Execute tasks in parallel with rate limiting
   */
  async executeTasks<TInput = any, TOutput = any>(
    tasks: ExecutionTask<TInput, TOutput>[],
    executor: (task: ExecutionTask<TInput, TOutput>) => Promise<RunResult<TOutput>>
  ): Promise<ExecutionResult<TOutput>[]> {
    return performanceMonitor.measure('parallel-execution', async () => {
      this.startTime = Date.now();
      this.completedTasks = 0;
      this.failedTasks = 0;
      this.totalThrottleTime = 0;
      this.executionTimes = [];

      const results: ExecutionResult<TOutput>[] = [];
      const taskQueue = [...tasks];
      const executing: Set<Promise<void>> = new Set();

      this.emit('start', { totalTasks: tasks.length });

      while (taskQueue.length > 0 || executing.size > 0) {
        // Check if we can start new tasks
        while (
          taskQueue.length > 0 &&
          this.activeWorkers < this.workerConfig.concurrency!
        ) {
          const task = taskQueue.shift()!;

          // Check rate limits before starting
          await this.checkRateLimit();

          const promise = this.executeTask(task, executor, results);
          executing.add(promise);

          promise
            .then(() => {
              executing.delete(promise);
            })
            .catch((error) => {
              console.error('Unexpected error in task execution:', error);
              executing.delete(promise);
            });
        }

        // Wait for at least one task to complete before checking for more
        if (executing.size > 0) {
          await Promise.race(executing);
        }
      }

      this.emit('complete', {
        totalTasks: tasks.length,
        completed: this.completedTasks,
        failed: this.failedTasks,
        duration: Date.now() - this.startTime,
      });

      return results;
    });
  }

  /**
   * Execute tasks with memory-efficient streaming (Task 12.2)
   */
  async executeTasksStreaming<TInput = any, TOutput = any>(
    tasks: ExecutionTask<TInput, TOutput>[],
    executor: (task: ExecutionTask<TInput, TOutput>) => Promise<RunResult<TOutput>>,
    streamConfig?: StreamConfig
  ): Promise<ExecutionResult<TOutput>[]> {
    return performanceMonitor.measure('streaming-execution', async () => {
      const stream = new DatasetStream<ExecutionTask<TInput, TOutput>>(streamConfig);
      const results: ExecutionResult<TOutput>[] = [];

      // Push all tasks to stream
      for (const task of tasks) {
        stream.push(task);
      }

      // Process in batches
      await stream.process(async (batch) => {
        const batchResults = await Promise.all(
          batch.map(async (task) => {
            const taskResults: ExecutionResult<TOutput>[] = [];
            await this.executeTask(task, executor, taskResults);
            return taskResults[0];
          })
        );
        results.push(...batchResults);
        return batchResults;
      });

      return results;
    });
  }

  /**
   * Execute a single task with error handling and metrics
   */
  private async executeTask<TInput, TOutput>(
    task: ExecutionTask<TInput, TOutput>,
    executor: (task: ExecutionTask<TInput, TOutput>) => Promise<RunResult<TOutput>>,
    results: ExecutionResult<TOutput>[]
  ): Promise<void> {
    this.activeWorkers++;
    const taskStartTime = Date.now();

    try {
      this.emit('taskStart', { taskId: task.id });

      const result = await executor(task);
      const executionTime = Date.now() - taskStartTime;

      this.executionTimes.push(executionTime);
      this.completedTasks++;

      results.push({
        task,
        result,
        executionTime,
      });

      // Update rate limiter with token usage
      if (result.metadata.tokenUsage) {
        this.rateLimiter.currentTokens += result.metadata.tokenUsage.total;
      }
      this.rateLimiter.currentRequests++;

      this.emit('taskComplete', {
        taskId: task.id,
        executionTime,
        progress: this.getProgress(results.length + this.failedTasks, results.length + this.failedTasks),
      });
    } catch (error) {
      const executionTime = Date.now() - taskStartTime;
      this.failedTasks++;

      const evalError: EvalError = {
        type: 'execution',
        severity: 'error',
        message: error instanceof Error ? error.message : String(error),
        testCaseId: task.testCase.id,
        stack: error instanceof Error ? error.stack : undefined,
        retryable: this.isRetryableError(error),
        timestamp: new Date(),
      };

      results.push({
        task,
        error: evalError,
        executionTime,
      });

      this.emit('taskError', {
        taskId: task.id,
        error: evalError,
        executionTime,
      });
    } finally {
      this.activeWorkers--;
    }
  }

  /**
   * Check rate limits and throttle if necessary
   */
  private async checkRateLimit(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.rateLimiter.lastReset;

    // Reset counters every minute
    if (elapsed >= 60000) {
      this.rateLimiter.currentRequests = 0;
      this.rateLimiter.currentTokens = 0;
      this.rateLimiter.lastReset = now;
      return;
    }

    // Check if we've hit request limit
    if (this.rateLimiter.currentRequests >= this.rateLimiter.requestsPerMinute) {
      const waitTime = 60000 - elapsed;
      this.totalThrottleTime += waitTime;

      this.emit('throttle', {
        reason: 'requests',
        waitTime,
        currentRequests: this.rateLimiter.currentRequests,
        limit: this.rateLimiter.requestsPerMinute,
      });

      await this.sleep(waitTime);
      this.rateLimiter.currentRequests = 0;
      this.rateLimiter.currentTokens = 0;
      this.rateLimiter.lastReset = Date.now();
    }

    // Check if we've hit token limit
    if (
      this.rateLimiter.tokensPerMinute &&
      this.rateLimiter.currentTokens >= this.rateLimiter.tokensPerMinute
    ) {
      const waitTime = 60000 - elapsed;
      this.totalThrottleTime += waitTime;

      this.emit('throttle', {
        reason: 'tokens',
        waitTime,
        currentTokens: this.rateLimiter.currentTokens,
        limit: this.rateLimiter.tokensPerMinute,
      });

      await this.sleep(waitTime);
      this.rateLimiter.currentRequests = 0;
      this.rateLimiter.currentTokens = 0;
      this.rateLimiter.lastReset = Date.now();
    }
  }

  /**
   * Calculate current progress
   */
  private getProgress(total: number, current: number): number {
    if (total === 0) return 0;
    return Math.round((current / total) * 100);
  }

  /**
   * Determine if error is retryable
   */
  private isRetryableError(error: any): boolean {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      return (
        message.includes('timeout') ||
        message.includes('rate limit') ||
        message.includes('network') ||
        message.includes('503') ||
        message.includes('429')
      );
    }
    return false;
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get execution metrics
   */
  getMetrics(): ExecutionMetrics {
    const totalExecutionTime = Date.now() - this.startTime;
    const avgExecutionTime =
      this.executionTimes.length > 0
        ? this.executionTimes.reduce((a, b) => a + b, 0) / this.executionTimes.length
        : 0;

    // Calculate parallel efficiency
    // Efficiency = (Sequential Time) / (Parallel Time * Workers)
    const totalTaskTime = this.executionTimes.reduce((a, b) => a + b, 0);
    const theoreticalTime = totalTaskTime / this.workerConfig.concurrency!;
    const parallelEfficiency =
      totalExecutionTime > 0 ? Math.min(1, theoreticalTime / totalExecutionTime) : 0;

    // Calculate worker utilization
    const totalPossibleWorkerTime = totalExecutionTime * this.workerConfig.concurrency!;
    const workerUtilization =
      totalPossibleWorkerTime > 0 ? totalTaskTime / totalPossibleWorkerTime : 0;

    return {
      totalExecutionTime,
      avgExecutionTime,
      parallelEfficiency,
      throttleTime: this.totalThrottleTime,
      workerUtilization,
    };
  }

  /**
   * Update worker configuration
   */
  updateConfig(config: Partial<WorkerConfig>): void {
    Object.assign(this.workerConfig, config);

    if (config.rateLimit) {
      this.rateLimiter.requestsPerMinute = config.rateLimit.requestsPerMinute;
      this.rateLimiter.tokensPerMinute = config.rateLimit.tokensPerMinute;
    }
  }

  /**
   * Get current rate limiter state
   */
  getRateLimiterState(): RateLimiter {
    return { ...this.rateLimiter };
  }

  /**
   * Reset rate limiter (for testing)
   */
  resetRateLimiter(): void {
    this.rateLimiter.currentRequests = 0;
    this.rateLimiter.currentTokens = 0;
    this.rateLimiter.lastReset = Date.now();
  }
}

/**
 * CPU-intensive worker pool for scoring operations
 */
export class ScoringWorkerPool {
  private maxWorkers: number;
  private activeWorkers: number = 0;
  private queue: Array<{
    task: () => Promise<any>;
    resolve: (value: any) => void;
    reject: (error: any) => void;
  }> = [];

  constructor(maxWorkers?: number) {
    // Default to CPU cores - 1 to leave one for main thread
    this.maxWorkers = maxWorkers ?? Math.max(1, require('os').cpus().length - 1);
  }

  /**
   * Execute a CPU-intensive scoring task
   */
  async execute<T>(task: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({ task, resolve, reject });
      this.processQueue();
    });
  }

  /**
   * Process queued tasks
   */
  private async processQueue(): Promise<void> {
    while (this.queue.length > 0 && this.activeWorkers < this.maxWorkers) {
      const item = this.queue.shift()!;
      this.activeWorkers++;

      item
        .task()
        .then(item.resolve)
        .catch(item.reject)
        .finally(() => {
          this.activeWorkers--;
          this.processQueue();
        });
    }
  }

  /**
   * Get pool statistics
   */
  getStats() {
    return {
      maxWorkers: this.maxWorkers,
      activeWorkers: this.activeWorkers,
      queuedTasks: this.queue.length,
      utilization: this.activeWorkers / this.maxWorkers,
    };
  }
}
