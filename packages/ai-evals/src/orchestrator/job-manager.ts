/**
 * Job Manager (Task 5.1)
 * 
 * Manages the lifecycle of evaluation jobs including creation, status tracking,
 * queueing, and cancellation support.
 */

import { randomUUID } from 'crypto';
import {
  EvalJob,
  JobStatus,
  JobProgress,
  RunnerConfig,
  ScorerConfig,
  EvalError,
} from '../types';

export interface JobConfig {
  datasetIds: string[];
  runnerConfigs: RunnerConfig[];
  scorerConfig: ScorerConfig;
  baseline?: string;
  parallel?: boolean;
  concurrency?: number;
}

export interface JobQueue {
  pending: Map<string, EvalJob>;
  running: Map<string, EvalJob>;
  completed: Map<string, EvalJob>;
  failed: Map<string, EvalJob>;
  cancelled: Map<string, EvalJob>;
}

export class JobManager {
  private jobs: Map<string, EvalJob> = new Map();
  private progress: Map<string, JobProgress> = new Map();
  private queue: JobQueue = {
    pending: new Map(),
    running: new Map(),
    completed: new Map(),
    failed: new Map(),
    cancelled: new Map(),
  };
  private maxConcurrentJobs: number;

  constructor(maxConcurrentJobs: number = 5) {
    this.maxConcurrentJobs = maxConcurrentJobs;
  }

  /**
   * Create a new evaluation job
   */
  createJob(config: JobConfig): string {
    const jobId = randomUUID();
    const now = new Date();

    const job: EvalJob = {
      id: jobId,
      datasetIds: config.datasetIds,
      runnerConfigs: config.runnerConfigs,
      scorerConfig: config.scorerConfig,
      baseline: config.baseline,
      parallel: config.parallel ?? true,
      concurrency: config.concurrency ?? 10,
      createdAt: now,
      updatedAt: now,
      status: 'pending',
    };

    this.jobs.set(jobId, job);
    this.queue.pending.set(jobId, job);

    // Initialize progress tracking
    this.progress.set(jobId, {
      jobId,
      status: 'pending',
      totalTests: 0, // Will be set when datasets are loaded
      completedTests: 0,
      failedTests: 0,
      progress: 0,
      errors: [],
    });

    return jobId;
  }

  /**
   * Get a job by ID
   */
  getJob(jobId: string): EvalJob | undefined {
    return this.jobs.get(jobId);
  }

  /**
   * Get all jobs
   */
  getAllJobs(): EvalJob[] {
    return Array.from(this.jobs.values());
  }

  /**
   * Get jobs by status
   */
  getJobsByStatus(status: JobStatus): EvalJob[] {
    return Array.from(this.jobs.values()).filter((job) => job.status === status);
  }

  /**
   * Update job status
   */
  updateJobStatus(jobId: string, status: JobStatus, error?: string): void {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    // Move job between queues
    this.queue[job.status].delete(jobId);
    job.status = status;
    job.updatedAt = new Date();
    if (error) {
      job.error = error;
    }
    this.queue[status].set(jobId, job);

    // Update progress status
    const progress = this.progress.get(jobId);
    if (progress) {
      progress.status = status;
    }
  }

  /**
   * Get job progress
   */
  getProgress(jobId: string): JobProgress | undefined {
    return this.progress.get(jobId);
  }

  /**
   * Update job progress
   */
  updateProgress(
    jobId: string,
    update: Partial<Omit<JobProgress, 'jobId'>>
  ): void {
    const progress = this.progress.get(jobId);
    if (!progress) {
      throw new Error(`Progress tracking for job ${jobId} not found`);
    }

    Object.assign(progress, update);

    // Calculate progress percentage
    if (progress.totalTests > 0) {
      progress.progress = Math.round(
        (progress.completedTests / progress.totalTests) * 100
      );
    }

    // Estimate time remaining based on current progress
    if (progress.completedTests > 0 && progress.totalTests > progress.completedTests) {
      const job = this.jobs.get(jobId);
      if (job && job.status === 'running') {
        const elapsedTime = Date.now() - job.updatedAt.getTime();
        const avgTimePerTest = elapsedTime / progress.completedTests;
        const remainingTests = progress.totalTests - progress.completedTests;
        progress.estimatedTimeRemaining = Math.round(avgTimePerTest * remainingTests);
      }
    }
  }

  /**
   * Add error to job progress
   */
  addError(jobId: string, error: EvalError): void {
    const progress = this.progress.get(jobId);
    if (progress) {
      progress.errors.push(error);
    }
  }

  /**
   * Cancel a job
   */
  async cancelJob(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    if (job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') {
      throw new Error(`Cannot cancel job with status ${job.status}`);
    }

    this.updateJobStatus(jobId, 'cancelled');
  }

  /**
   * Check if a new job can be started
   */
  canStartJob(): boolean {
    return this.queue.running.size < this.maxConcurrentJobs;
  }

  /**
   * Get next pending job
   */
  getNextPendingJob(): EvalJob | undefined {
    const pending = Array.from(this.queue.pending.values());
    if (pending.length === 0) return undefined;

    // Return oldest pending job (FIFO)
    return pending.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0];
  }

  /**
   * Get queue statistics
   */
  getQueueStats() {
    return {
      pending: this.queue.pending.size,
      running: this.queue.running.size,
      completed: this.queue.completed.size,
      failed: this.queue.failed.size,
      cancelled: this.queue.cancelled.size,
      total: this.jobs.size,
      maxConcurrent: this.maxConcurrentJobs,
      availableSlots: Math.max(0, this.maxConcurrentJobs - this.queue.running.size),
    };
  }

  /**
   * Clean up completed jobs older than specified days
   */
  cleanupOldJobs(retentionDays: number = 30): number {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    let cleanedCount = 0;

    for (const [jobId, job] of this.jobs.entries()) {
      if (
        (job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') &&
        job.updatedAt < cutoffDate
      ) {
        this.jobs.delete(jobId);
        this.progress.delete(jobId);
        this.queue[job.status].delete(jobId);
        cleanedCount++;
      }
    }

    return cleanedCount;
  }

  /**
   * Reset job manager (primarily for testing)
   */
  reset(): void {
    this.jobs.clear();
    this.progress.clear();
    Object.values(this.queue).forEach((q) => q.clear());
  }
}
