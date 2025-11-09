/**
 * Parallel Execution Engine
 * 
 * Advanced parallel execution with worker pools, rate limiting, and progress tracking
 * Optimizes evaluation performance while respecting API rate limits
 */

import type { TestCase, RunResult, ModelConfig, ScorerConfig } from './types'
import type { BaseRunner } from './base-runner'

/**
 * Rate limiter configuration
 */
export interface RateLimiterConfig {
  /** Maximum requests per minute */
  requestsPerMinute: number
  
  /** Maximum requests per second */
  requestsPerSecond?: number
  
  /** Burst allowance (requests that can be sent immediately) */
  burstSize?: number
}

/**
 * Parallel execution configuration
 */
export interface ParallelExecutionConfig {
  /** Maximum concurrent executions */
  concurrency: number
  
  /** Rate limiter configuration */
  rateLimiter?: RateLimiterConfig
  
  /** Progress callback */
  onProgress?: (completed: number, total: number, current?: TestCase) => void
  
  /** Retry configuration */
  retries?: {
    maxAttempts: number
    delayMs: number
    backoffMultiplier?: number
  }
}

/**
 * Rate limiter using token bucket algorithm
 */
export class RateLimiter {
  private tokens: number
  private maxTokens: number
  private refillRate: number // tokens per millisecond
  private lastRefill: number
  private queue: Array<() => void> = []
  private processing: boolean = false

  constructor(config: RateLimiterConfig) {
    this.maxTokens = config.burstSize || config.requestsPerMinute
    this.tokens = this.maxTokens
    this.lastRefill = Date.now()
    
    // Calculate refill rate (tokens per millisecond)
    this.refillRate = config.requestsPerMinute / 60000 // per minute to per ms
    
    // If requestsPerSecond is specified, use the more restrictive limit
    if (config.requestsPerSecond) {
      const perSecondRate = config.requestsPerSecond / 1000
      this.refillRate = Math.min(this.refillRate, perSecondRate)
    }
  }

  /**
   * Acquire a token (wait if necessary)
   */
  async acquire(): Promise<void> {
    return new Promise((resolve) => {
      this.queue.push(resolve)
      this.processQueue()
    })
  }

  /**
   * Process the queue
   */
  private processQueue(): void {
    if (this.processing) return
    this.processing = true

    const process = () => {
      // Refill tokens based on time elapsed
      const now = Date.now()
      const elapsed = now - this.lastRefill
      const tokensToAdd = elapsed * this.refillRate
      
      this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd)
      this.lastRefill = now

      // Process queue
      while (this.queue.length > 0 && this.tokens >= 1) {
        this.tokens -= 1
        const resolve = this.queue.shift()
        if (resolve) resolve()
      }

      // Schedule next processing
      if (this.queue.length > 0) {
        // Calculate time until next token
        const timeUntilNextToken = (1 - (this.tokens % 1)) / this.refillRate
        setTimeout(process, Math.max(1, timeUntilNextToken))
      } else {
        this.processing = false
      }
    }

    process()
  }

  /**
   * Get current token count
   */
  getTokens(): number {
    return this.tokens
  }

  /**
   * Get queue length
   */
  getQueueLength(): number {
    return this.queue.length
  }
}

/**
 * Worker pool for parallel execution
 */
export class WorkerPool {
  private concurrency: number
  private activeWorkers: number = 0
  private queue: Array<() => Promise<void>> = []
  private rateLimiter?: RateLimiter

  constructor(concurrency: number, rateLimiter?: RateLimiter) {
    this.concurrency = concurrency
    this.rateLimiter = rateLimiter
  }

  /**
   * Execute a task
   */
  async execute<T>(task: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          // Acquire rate limit token if configured
          if (this.rateLimiter) {
            await this.rateLimiter.acquire()
          }

          const result = await task()
          resolve(result)
        } catch (error) {
          reject(error)
        }
      })

      this.processQueue()
    })
  }

  /**
   * Process the queue
   */
  private async processQueue(): Promise<void> {
    while (this.activeWorkers < this.concurrency && this.queue.length > 0) {
      const task = this.queue.shift()
      if (!task) continue

      this.activeWorkers++

      task().finally(() => {
        this.activeWorkers--
        this.processQueue()
      })
    }
  }

  /**
   * Get active worker count
   */
  getActiveWorkers(): number {
    return this.activeWorkers
  }

  /**
   * Get queue length
   */
  getQueueLength(): number {
    return this.queue.length
  }

  /**
   * Wait for all tasks to complete
   */
  async waitForCompletion(): Promise<void> {
    while (this.activeWorkers > 0 || this.queue.length > 0) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }
}

/**
 * Parallel executor for running test cases
 */
export class ParallelExecutor {
  private config: ParallelExecutionConfig
  private workerPool: WorkerPool
  private rateLimiter?: RateLimiter

  constructor(config: ParallelExecutionConfig) {
    this.config = config

    // Create rate limiter if configured
    if (config.rateLimiter) {
      this.rateLimiter = new RateLimiter(config.rateLimiter)
    }

    // Create worker pool
    this.workerPool = new WorkerPool(config.concurrency, this.rateLimiter)
  }

  /**
   * Execute test cases in parallel
   */
  async executeTestCases(
    runner: BaseRunner,
    testCases: TestCase[],
    modelConfig: ModelConfig,
    scorerConfig: ScorerConfig
  ): Promise<RunResult[]> {
    const results: RunResult[] = []
    const errors: Array<{ testCase: TestCase; error: Error; attempts: number }> = []
    let completed = 0

    // Create tasks for all test cases
    const tasks = testCases.map((testCase, index) => async () => {
      try {
        const result = await this.executeWithRetry(
          runner,
          testCase,
          modelConfig,
          scorerConfig
        )
        
        results[index] = result
        completed++

        // Report progress
        if (this.config.onProgress) {
          this.config.onProgress(completed, testCases.length, testCase)
        }
      } catch (error) {
        errors.push({
          testCase,
          error: error instanceof Error ? error : new Error('Unknown error'),
          attempts: this.config.retries?.maxAttempts || 1,
        })
        
        completed++

        // Report progress even on error
        if (this.config.onProgress) {
          this.config.onProgress(completed, testCases.length, testCase)
        }
      }
    })

    // Execute all tasks
    await Promise.all(tasks.map(task => this.workerPool.execute(task)))

    // Wait for completion
    await this.workerPool.waitForCompletion()

    // Filter out undefined results (from errors)
    const validResults = results.filter(r => r !== undefined)

    // Log errors if any
    if (errors.length > 0) {
      console.error(`${errors.length} test cases failed:`)
      for (const { testCase, error } of errors) {
        console.error(`  - ${testCase.id}: ${error.message}`)
      }
    }

    return validResults
  }

  /**
   * Execute a single test case with retry logic
   */
  private async executeWithRetry(
    runner: BaseRunner,
    testCase: TestCase,
    modelConfig: ModelConfig,
    scorerConfig: ScorerConfig
  ): Promise<RunResult> {
    const maxAttempts = this.config.retries?.maxAttempts || 1
    const delayMs = this.config.retries?.delayMs || 1000
    const backoffMultiplier = this.config.retries?.backoffMultiplier || 2

    let lastError: Error | undefined

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        return await runner.runTestCase(testCase, modelConfig, scorerConfig)
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error')

        // Don't retry on last attempt
        if (attempt < maxAttempts - 1) {
          const delay = delayMs * Math.pow(backoffMultiplier, attempt)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }

    throw lastError || new Error('Execution failed')
  }

  /**
   * Get execution statistics
   */
  getStats(): {
    activeWorkers: number
    queueLength: number
    rateLimiterTokens?: number
    rateLimiterQueue?: number
  } {
    return {
      activeWorkers: this.workerPool.getActiveWorkers(),
      queueLength: this.workerPool.getQueueLength(),
      rateLimiterTokens: this.rateLimiter?.getTokens(),
      rateLimiterQueue: this.rateLimiter?.getQueueLength(),
    }
  }
}

/**
 * Create a parallel executor with sensible defaults
 */
export function createParallelExecutor(
  concurrency: number = 5,
  rateLimiterConfig?: RateLimiterConfig
): ParallelExecutor {
  return new ParallelExecutor({
    concurrency,
    rateLimiter: rateLimiterConfig,
    retries: {
      maxAttempts: 3,
      delayMs: 1000,
      backoffMultiplier: 2,
    },
  })
}

/**
 * Preset rate limiter configurations for common providers
 */
export const RateLimiterPresets = {
  /**
   * OpenAI rate limits
   */
  openai: {
    tier1: {
      requestsPerMinute: 500,
      requestsPerSecond: 10,
      burstSize: 20,
    },
    tier2: {
      requestsPerMinute: 5000,
      requestsPerSecond: 50,
      burstSize: 100,
    },
    tier3: {
      requestsPerMinute: 10000,
      requestsPerSecond: 100,
      burstSize: 200,
    },
  },

  /**
   * Anthropic rate limits
   */
  anthropic: {
    tier1: {
      requestsPerMinute: 50,
      requestsPerSecond: 5,
      burstSize: 10,
    },
    tier2: {
      requestsPerMinute: 1000,
      requestsPerSecond: 50,
      burstSize: 100,
    },
    tier3: {
      requestsPerMinute: 2000,
      requestsPerSecond: 80,
      burstSize: 150,
    },
  },

  /**
   * Conservative rate limit (safe for all providers)
   */
  conservative: {
    requestsPerMinute: 60,
    requestsPerSecond: 2,
    burstSize: 5,
  },

  /**
   * Aggressive rate limit (for local models or unlimited APIs)
   */
  unlimited: {
    requestsPerMinute: 100000,
    requestsPerSecond: 1000,
    burstSize: 1000,
  },
}

/**
 * Estimate execution time
 */
export function estimateExecutionTime(
  testCaseCount: number,
  avgLatencyMs: number,
  concurrency: number,
  rateLimiterConfig?: RateLimiterConfig
): {
  estimatedTimeMs: number
  estimatedTimeSeconds: number
  estimatedTimeMinutes: number
  bottleneck: 'concurrency' | 'rate-limit' | 'latency'
} {
  // Calculate time based on concurrency
  const concurrencyTimeMs = (testCaseCount / concurrency) * avgLatencyMs

  // Calculate time based on rate limit
  let rateLimitTimeMs = 0
  if (rateLimiterConfig) {
    const requestsPerMs = rateLimiterConfig.requestsPerMinute / 60000
    rateLimitTimeMs = testCaseCount / requestsPerMs
  }

  // The bottleneck is whichever takes longer
  const estimatedTimeMs = Math.max(concurrencyTimeMs, rateLimitTimeMs)

  // Determine bottleneck
  let bottleneck: 'concurrency' | 'rate-limit' | 'latency'
  if (rateLimitTimeMs > concurrencyTimeMs * 1.1) {
    bottleneck = 'rate-limit'
  } else if (avgLatencyMs > 5000) {
    bottleneck = 'latency'
  } else {
    bottleneck = 'concurrency'
  }

  return {
    estimatedTimeMs,
    estimatedTimeSeconds: estimatedTimeMs / 1000,
    estimatedTimeMinutes: estimatedTimeMs / 60000,
    bottleneck,
  }
}

/**
 * Format execution statistics
 */
export function formatExecutionStats(stats: {
  activeWorkers: number
  queueLength: number
  rateLimiterTokens?: number
  rateLimiterQueue?: number
}): string {
  const lines = [
    `Active Workers: ${stats.activeWorkers}`,
    `Queue Length: ${stats.queueLength}`,
  ]

  if (stats.rateLimiterTokens !== undefined) {
    lines.push(`Rate Limiter Tokens: ${stats.rateLimiterTokens.toFixed(1)}`)
  }

  if (stats.rateLimiterQueue !== undefined) {
    lines.push(`Rate Limiter Queue: ${stats.rateLimiterQueue}`)
  }

  return lines.join(' | ')
}
