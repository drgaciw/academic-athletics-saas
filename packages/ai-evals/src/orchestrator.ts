/**
 * Eval Orchestrator
 * 
 * Job management system for running evaluations
 * Handles job queuing, status tracking, and cancellation
 */

import type {
  EvalJob,
  EvalJobConfig,
  TestCase,
  RunResult,
  EvalReport,
  EvalMetrics,
} from './types'
import { loadDataset } from './dataset-manager'
import { createSpecializedRunner } from './specialized-runners'
import { createScorer } from './scorers'
import { calculateMetrics } from './metrics'
import { ParallelExecutor, RateLimiterPresets } from './parallel-executor'
import { randomUUID } from 'crypto'

/**
 * Job queue manager
 */
export class EvalOrchestrator {
  private jobs: Map<string, EvalJob> = new Map()
  private queue: string[] = []
  private running: Set<string> = new Set()
  private maxConcurrentJobs: number
  private jobCallbacks: Map<string, {
    onProgress?: (job: EvalJob) => void
    onComplete?: (job: EvalJob, report: EvalReport) => void
    onError?: (job: EvalJob, error: Error) => void
  }> = new Map()

  constructor(maxConcurrentJobs: number = 1) {
    this.maxConcurrentJobs = maxConcurrentJobs
  }

  /**
   * Create and queue a new evaluation job
   */
  async createJob(config: EvalJobConfig): Promise<EvalJob> {
    const jobId = randomUUID()

    // Load dataset to get test case count
    const dataset = await loadDataset(config.datasetId)

    const job: EvalJob = {
      id: jobId,
      config,
      status: 'pending',
      progress: 0,
      totalTestCases: dataset.testCases.length,
      createdAt: new Date().toISOString(),
    }

    this.jobs.set(jobId, job)
    this.queue.push(jobId)

    // Start processing queue
    this.processQueue()

    return job
  }

  /**
   * Get job by ID
   */
  getJob(jobId: string): EvalJob | undefined {
    return this.jobs.get(jobId)
  }

  /**
   * Get all jobs
   */
  getAllJobs(): EvalJob[] {
    return Array.from(this.jobs.values())
  }

  /**
   * Get jobs by status
   */
  getJobsByStatus(status: EvalJob['status']): EvalJob[] {
    return Array.from(this.jobs.values()).filter(job => job.status === status)
  }

  /**
   * Cancel a job
   */
  async cancelJob(jobId: string): Promise<boolean> {
    const job = this.jobs.get(jobId)
    if (!job) {
      return false
    }

    if (job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') {
      return false // Already finished
    }

    // Update status
    job.status = 'cancelled'
    job.completedAt = new Date().toISOString()

    // Remove from queue if pending
    const queueIndex = this.queue.indexOf(jobId)
    if (queueIndex !== -1) {
      this.queue.splice(queueIndex, 1)
    }

    // Remove from running set
    this.running.delete(jobId)

    return true
  }

  /**
   * Register callbacks for job events
   */
  onJobProgress(jobId: string, callback: (job: EvalJob) => void): void {
    const callbacks = this.jobCallbacks.get(jobId) || {}
    callbacks.onProgress = callback
    this.jobCallbacks.set(jobId, callbacks)
  }

  onJobComplete(jobId: string, callback: (job: EvalJob, report: EvalReport) => void): void {
    const callbacks = this.jobCallbacks.get(jobId) || {}
    callbacks.onComplete = callback
    this.jobCallbacks.set(jobId, callbacks)
  }

  onJobError(jobId: string, callback: (job: EvalJob, error: Error) => void): void {
    const callbacks = this.jobCallbacks.get(jobId) || {}
    callbacks.onError = callback
    this.jobCallbacks.set(jobId, callbacks)
  }

  /**
   * Process job queue
   */
  private async processQueue(): Promise<void> {
    // Check if we can start more jobs
    while (this.running.size < this.maxConcurrentJobs && this.queue.length > 0) {
      const jobId = this.queue.shift()
      if (!jobId) continue

      const job = this.jobs.get(jobId)
      if (!job) continue

      // Skip if job was cancelled
      if (job.status === 'cancelled') continue

      // Start job
      this.running.add(jobId)
      this.runJob(jobId).finally(() => {
        this.running.delete(jobId)
        this.processQueue() // Process next job
      })
    }
  }

  /**
   * Run a single job
   */
  private async runJob(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId)
    if (!job) return

    try {
      // Update status
      job.status = 'running'
      job.startedAt = new Date().toISOString()
      job.progress = 0

      // Load dataset
      const dataset = await loadDataset(job.config.datasetId)

      // Create runner
      // Map agent type to runner type
      const runnerType = mapAgentTypeToRunner(job.config.agentType)
      const runner = createSpecializedRunner(runnerType)

      // Determine rate limiter based on provider
      let rateLimiterConfig
      if (job.config.modelConfig.provider === 'openai') {
        rateLimiterConfig = RateLimiterPresets.openai.tier2
      } else if (job.config.modelConfig.provider === 'anthropic') {
        rateLimiterConfig = RateLimiterPresets.anthropic.tier2
      }

      // Create parallel executor
      const executor = new ParallelExecutor({
        concurrency: job.config.concurrency || 5,
        rateLimiter: rateLimiterConfig,
        onProgress: (completed, total, currentTestCase) => {
          // Update job progress
          job.currentTestCase = completed - 1
          job.progress = completed / total

          // Notify progress callback
          const callbacks = this.jobCallbacks.get(jobId)
          if (callbacks?.onProgress) {
            callbacks.onProgress(job)
          }
        },
        retries: {
          maxAttempts: 3,
          delayMs: 1000,
          backoffMultiplier: 2,
        },
      })

      // Run test cases in parallel
      const results = await executor.executeTestCases(
        runner,
        dataset.testCases,
        job.config.modelConfig,
        job.config.scorerConfig
      )

      // Calculate metrics
      const metrics = calculateMetrics(results)

      // Create report
      const report: EvalReport = {
        id: randomUUID(),
        dataset,
        modelConfig: job.config.modelConfig,
        scorerConfig: job.config.scorerConfig,
        results,
        metrics,
        timestamp: new Date().toISOString(),
        duration: Date.now() - new Date(job.startedAt!).getTime(),
      }

      // Update job
      job.status = 'completed'
      job.progress = 1
      job.reportId = report.id
      job.completedAt = new Date().toISOString()

      // Notify completion callback
      const callbacks = this.jobCallbacks.get(jobId)
      if (callbacks?.onComplete) {
        callbacks.onComplete(job, report)
      }

      // Clean up callbacks
      this.jobCallbacks.delete(jobId)
    } catch (error) {
      // Update job with error
      job.status = 'failed'
      job.error = {
        code: 'JOB_EXECUTION_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error',
      }
      job.completedAt = new Date().toISOString()

      // Notify error callback
      const callbacks = this.jobCallbacks.get(jobId)
      if (callbacks?.onError) {
        callbacks.onError(job, error instanceof Error ? error : new Error('Unknown error'))
      }

      // Clean up callbacks
      this.jobCallbacks.delete(jobId)
    }
  }

  /**
   * Wait for job to complete
   */
  async waitForJob(jobId: string, pollInterval: number = 1000): Promise<EvalJob> {
    return new Promise((resolve, reject) => {
      const checkStatus = () => {
        const job = this.jobs.get(jobId)
        if (!job) {
          reject(new Error(`Job ${jobId} not found`))
          return
        }

        if (job.status === 'completed') {
          resolve(job)
        } else if (job.status === 'failed') {
          reject(new Error(job.error?.message || 'Job failed'))
        } else if (job.status === 'cancelled') {
          reject(new Error('Job was cancelled'))
        } else {
          setTimeout(checkStatus, pollInterval)
        }
      }

      checkStatus()
    })
  }

  /**
   * Clear completed jobs
   */
  clearCompletedJobs(): number {
    const completedJobs = Array.from(this.jobs.entries()).filter(
      ([_, job]) => job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled'
    )

    for (const [jobId] of completedJobs) {
      this.jobs.delete(jobId)
      this.jobCallbacks.delete(jobId)
    }

    return completedJobs.length
  }

  /**
   * Get queue status
   */
  getQueueStatus(): {
    pending: number
    running: number
    completed: number
    failed: number
    cancelled: number
    total: number
  } {
    const jobs = Array.from(this.jobs.values())

    return {
      pending: jobs.filter(j => j.status === 'pending').length,
      running: jobs.filter(j => j.status === 'running').length,
      completed: jobs.filter(j => j.status === 'completed').length,
      failed: jobs.filter(j => j.status === 'failed').length,
      cancelled: jobs.filter(j => j.status === 'cancelled').length,
      total: jobs.length,
    }
  }
}

/**
 * Global orchestrator instance
 */
let globalOrchestrator: EvalOrchestrator | null = null

/**
 * Get or create global orchestrator
 */
export function getOrchestrator(maxConcurrentJobs?: number): EvalOrchestrator {
  if (!globalOrchestrator) {
    globalOrchestrator = new EvalOrchestrator(maxConcurrentJobs)
  }
  return globalOrchestrator
}

/**
 * Create a new orchestrator instance
 */
export function createOrchestrator(maxConcurrentJobs: number = 1): EvalOrchestrator {
  return new EvalOrchestrator(maxConcurrentJobs)
}

/**
 * Format job status for display
 */
export function formatJobStatus(job: EvalJob): string {
  const lines = [
    `Job: ${job.config.name}`,
    `ID: ${job.id}`,
    `Status: ${job.status.toUpperCase()}`,
    `Progress: ${(job.progress * 100).toFixed(1)}%`,
  ]

  if (job.currentTestCase !== undefined) {
    lines.push(`Current: ${job.currentTestCase + 1}/${job.totalTestCases}`)
  }

  if (job.startedAt) {
    lines.push(`Started: ${new Date(job.startedAt).toLocaleString()}`)
  }

  if (job.completedAt) {
    lines.push(`Completed: ${new Date(job.completedAt).toLocaleString()}`)
    
    if (job.startedAt) {
      const duration = new Date(job.completedAt).getTime() - new Date(job.startedAt).getTime()
      lines.push(`Duration: ${(duration / 1000).toFixed(1)}s`)
    }
  }

  if (job.reportId) {
    lines.push(`Report: ${job.reportId}`)
  }

  if (job.error) {
    lines.push(`Error: ${job.error.message}`)
  }

  return lines.join('\n')
}

/**
 * Format queue status for display
 */
export function formatQueueStatus(orchestrator: EvalOrchestrator): string {
  const status = orchestrator.getQueueStatus()

  return [
    '=== Queue Status ===',
    `Total Jobs: ${status.total}`,
    `Pending: ${status.pending}`,
    `Running: ${status.running}`,
    `Completed: ${status.completed}`,
    `Failed: ${status.failed}`,
    `Cancelled: ${status.cancelled}`,
  ].join('\n')
}

/**
 * Map agent type to runner type
 */
function mapAgentTypeToRunner(
  agentType?: string
): 'compliance' | 'conversation' | 'advising' | 'risk' | 'rag' {
  if (!agentType) return 'conversation'

  switch (agentType) {
    case 'compliance':
      return 'compliance'
    case 'conversation':
    case 'conversational':
      return 'conversation'
    case 'advising':
    case 'advisor':
      return 'advising'
    case 'risk':
    case 'risk-prediction':
    case 'intervention':
      return 'risk'
    case 'rag':
    case 'retrieval':
      return 'rag'
    default:
      return 'conversation'
  }
}
