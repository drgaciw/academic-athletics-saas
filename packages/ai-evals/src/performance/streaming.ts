/**
 * Memory-Efficient Streaming (Task 12.2)
 *
 * Implements streaming capabilities for large datasets with memory-efficient processing
 */

import { EventEmitter } from 'events';
import { TestCase, RunResult } from '../types';

/**
 * Streaming configuration
 */
export interface StreamConfig {
  batchSize?: number; // Process N items at a time
  maxMemory?: number; // Max memory in bytes before backpressure
  bufferSize?: number; // Internal buffer size
}

/**
 * Stream statistics
 */
export interface StreamStats {
  itemsProcessed: number;
  itemsBuffered: number;
  memoryUsage: number;
  backpressureEvents: number;
  avgProcessingTime: number;
  throughput: number; // items per second
}

/**
 * Memory-efficient streaming processor for large datasets
 */
export class DatasetStream<T = any> extends EventEmitter {
  private buffer: T[] = [];
  private config: Required<StreamConfig>;
  private stats = {
    itemsProcessed: 0,
    itemsBuffered: 0,
    backpressureEvents: 0,
    processingTimes: [] as number[],
    startTime: 0,
  };
  private processing = false;
  private paused = false;

  constructor(config: StreamConfig = {}) {
    super();
    this.config = {
      batchSize: config.batchSize ?? 50,
      maxMemory: config.maxMemory ?? 100 * 1024 * 1024, // 100MB default
      bufferSize: config.bufferSize ?? 1000,
    };
    this.stats.startTime = Date.now();
  }

  /**
   * Push item to stream
   */
  push(item: T): boolean {
    if (this.buffer.length >= this.config.bufferSize) {
      this.emit('backpressure', {
        bufferSize: this.buffer.length,
        maxSize: this.config.bufferSize,
      });
      this.stats.backpressureEvents++;
      return false; // Signal backpressure
    }

    this.buffer.push(item);
    this.stats.itemsBuffered = this.buffer.length;

    // Check memory usage
    const memoryUsage = this.estimateMemoryUsage();
    if (memoryUsage > this.config.maxMemory) {
      this.emit('memory-pressure', {
        current: memoryUsage,
        max: this.config.maxMemory,
      });
      this.pause();
    }

    this.emit('data', item);
    return true;
  }

  /**
   * Process stream in batches
   */
  async process<R>(
    processor: (batch: T[]) => Promise<R[]>
  ): Promise<R[]> {
    this.processing = true;
    const results: R[] = [];

    while (this.buffer.length > 0 && !this.paused) {
      const batch = this.buffer.splice(0, this.config.batchSize);
      this.stats.itemsBuffered = this.buffer.length;

      const startTime = Date.now();

      try {
        const batchResults = await processor(batch);
        results.push(...batchResults);

        const processingTime = Date.now() - startTime;
        this.stats.processingTimes.push(processingTime);
        this.stats.itemsProcessed += batch.length;

        this.emit('batch-complete', {
          batchSize: batch.length,
          processingTime,
          totalProcessed: this.stats.itemsProcessed,
        });

        // Trim processing times history
        if (this.stats.processingTimes.length > 100) {
          this.stats.processingTimes.shift();
        }

        // Allow event loop to process
        await this.sleep(0);
      } catch (error) {
        this.emit('error', {
          error,
          batch,
        });
        throw error;
      }
    }

    this.processing = false;
    return results;
  }

  /**
   * Pause stream processing
   */
  pause(): void {
    this.paused = true;
    this.emit('pause');
  }

  /**
   * Resume stream processing
   */
  resume(): void {
    this.paused = false;
    this.emit('resume');
  }

  /**
   * Check if stream is paused
   */
  isPaused(): boolean {
    return this.paused;
  }

  /**
   * Clear buffer
   */
  clear(): void {
    this.buffer = [];
    this.stats.itemsBuffered = 0;
  }

  /**
   * Get stream statistics
   */
  getStats(): StreamStats {
    const elapsedSeconds = (Date.now() - this.stats.startTime) / 1000;
    const avgProcessingTime =
      this.stats.processingTimes.length > 0
        ? this.stats.processingTimes.reduce((a, b) => a + b, 0) /
          this.stats.processingTimes.length
        : 0;

    return {
      itemsProcessed: this.stats.itemsProcessed,
      itemsBuffered: this.stats.itemsBuffered,
      memoryUsage: this.estimateMemoryUsage(),
      backpressureEvents: this.stats.backpressureEvents,
      avgProcessingTime,
      throughput: elapsedSeconds > 0 ? this.stats.itemsProcessed / elapsedSeconds : 0,
    };
  }

  /**
   * Estimate current memory usage
   */
  private estimateMemoryUsage(): number {
    if (this.buffer.length === 0) return 0;

    // Sample first item to estimate average size
    const sampleSize = this.estimateItemSize(this.buffer[0]);
    return sampleSize * this.buffer.length;
  }

  /**
   * Estimate size of single item in bytes
   */
  private estimateItemSize(item: any): number {
    if (typeof item === 'string') {
      return item.length * 2; // 2 bytes per char
    }
    if (typeof item === 'number') {
      return 8;
    }
    if (typeof item === 'object' && item !== null) {
      return JSON.stringify(item).length * 2;
    }
    return 0;
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Batch processor for test case execution
 */
export class BatchProcessor<TInput = any, TOutput = any> {
  private stream: DatasetStream<TestCase<TInput, TOutput>>;
  private results: RunResult<TOutput>[] = [];

  constructor(config: StreamConfig = {}) {
    this.stream = new DatasetStream(config);

    // Set up event handlers
    this.stream.on('backpressure', (data) => {
      console.warn('Stream backpressure detected:', data);
    });

    this.stream.on('memory-pressure', (data) => {
      console.warn('Memory pressure detected:', data);
    });

    this.stream.on('batch-complete', (data) => {
      console.log(`Batch complete: ${data.batchSize} items in ${data.processingTime}ms`);
    });
  }

  /**
   * Add test case to processing queue
   */
  addTestCase(testCase: TestCase<TInput, TOutput>): boolean {
    return this.stream.push(testCase);
  }

  /**
   * Add multiple test cases
   */
  addTestCases(testCases: TestCase<TInput, TOutput>[]): void {
    for (const testCase of testCases) {
      const success = this.stream.push(testCase);
      if (!success) {
        // Wait for buffer to drain
        console.warn('Buffer full, waiting...');
        break;
      }
    }
  }

  /**
   * Process all queued test cases
   */
  async processAll(
    executor: (testCases: TestCase<TInput, TOutput>[]) => Promise<RunResult<TOutput>[]>
  ): Promise<RunResult<TOutput>[]> {
    this.results = await this.stream.process(executor);
    return this.results;
  }

  /**
   * Get processing statistics
   */
  getStats(): StreamStats {
    return this.stream.getStats();
  }

  /**
   * Get results
   */
  getResults(): RunResult<TOutput>[] {
    return this.results;
  }

  /**
   * Clear processor
   */
  clear(): void {
    this.stream.clear();
    this.results = [];
  }
}

/**
 * Result stream writer for incremental output
 */
export class ResultWriter<T = any> {
  private writeBuffer: T[] = [];
  private config: Required<StreamConfig>;
  private stats = {
    itemsWritten: 0,
    flushes: 0,
    errors: 0,
  };

  constructor(config: StreamConfig = {}) {
    this.config = {
      batchSize: config.batchSize ?? 100,
      maxMemory: config.maxMemory ?? 50 * 1024 * 1024, // 50MB default
      bufferSize: config.bufferSize ?? 500,
    };
  }

  /**
   * Write result to buffer
   */
  async write(result: T, writer: (results: T[]) => Promise<void>): Promise<void> {
    this.writeBuffer.push(result);

    // Auto-flush when buffer reaches batch size
    if (this.writeBuffer.length >= this.config.batchSize) {
      await this.flush(writer);
    }
  }

  /**
   * Write multiple results
   */
  async writeMany(results: T[], writer: (results: T[]) => Promise<void>): Promise<void> {
    for (const result of results) {
      await this.write(result, writer);
    }
  }

  /**
   * Flush buffer to storage
   */
  async flush(writer: (results: T[]) => Promise<void>): Promise<void> {
    if (this.writeBuffer.length === 0) return;

    try {
      await writer([...this.writeBuffer]);
      this.stats.itemsWritten += this.writeBuffer.length;
      this.stats.flushes++;
      this.writeBuffer = [];
    } catch (error) {
      this.stats.errors++;
      throw error;
    }
  }

  /**
   * Get writer statistics
   */
  getStats() {
    return {
      itemsWritten: this.stats.itemsWritten,
      itemsBuffered: this.writeBuffer.length,
      flushes: this.stats.flushes,
      errors: this.stats.errors,
    };
  }

  /**
   * Clear buffer
   */
  clear(): void {
    this.writeBuffer = [];
  }
}
