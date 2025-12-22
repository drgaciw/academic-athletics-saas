/**
 * Error Hierarchy for AI Evals
 *
 * Provides structured, contextual error types for better debugging
 * and programmatic error handling.
 *
 * @module errors
 */

/**
 * Base error class for all evaluation-related errors
 *
 * Features:
 * - Error codes for programmatic handling
 * - Contextual metadata
 * - Stack trace preservation
 * - JSON serialization
 */
export class EvalError extends Error {
  /**
   * Create a new EvalError
   *
   * @param message - Human-readable error message
   * @param code - Machine-readable error code
   * @param context - Additional contextual information
   * @param originalError - Original error that caused this error
   *
   * @example
   * ```typescript
   * throw new EvalError(
   *   'Failed to load dataset',
   *   'DATASET_LOAD_ERROR',
   *   { datasetId: 'compliance-001', path: '/datasets/compliance.json' },
   *   originalError
   * );
   * ```
   */
  constructor(
    message: string,
    public readonly code: string,
    public readonly context?: Record<string, unknown>,
    public readonly originalError?: unknown
  ) {
    super(message);
    this.name = 'EvalError';

    // Preserve stack trace from original error if available
    if (originalError instanceof Error && originalError.stack) {
      this.stack = `${this.stack}\nCaused by: ${originalError.stack}`;
    }

    // Maintain proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, EvalError.prototype);
  }

  /**
   * Convert error to JSON for logging and serialization
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      context: this.context,
      stack: this.stack,
      originalError:
        this.originalError instanceof Error
          ? {
              name: this.originalError.name,
              message: this.originalError.message,
              stack: this.originalError.stack,
            }
          : this.originalError,
    };
  }

  /**
   * Format error for display
   */
  toString(): string {
    let result = `${this.name} [${this.code}]: ${this.message}`;

    if (this.context && Object.keys(this.context).length > 0) {
      result += '\n\nContext:';
      for (const [key, value] of Object.entries(this.context)) {
        result += `\n  ${key}: ${JSON.stringify(value)}`;
      }
    }

    return result;
  }
}

/**
 * Dataset-related errors
 */
export class DatasetError extends EvalError {
  constructor(
    message: string,
    code: string,
    public readonly datasetId: string,
    context?: Record<string, unknown>,
    originalError?: unknown
  ) {
    super(
      message,
      code,
      { ...context, datasetId },
      originalError
    );
    this.name = 'DatasetError';
    Object.setPrototypeOf(this, DatasetError.prototype);
  }
}

/**
 * Error when dataset validation fails
 */
export class DatasetValidationError extends DatasetError {
  constructor(
    message: string,
    datasetId: string,
    public readonly testCaseId?: string,
    public readonly field?: string,
    originalError?: unknown
  ) {
    super(
      message,
      'DATASET_VALIDATION_ERROR',
      datasetId,
      { testCaseId, field },
      originalError
    );
    this.name = 'DatasetValidationError';
    Object.setPrototypeOf(this, DatasetValidationError.prototype);
  }
}

/**
 * Error when dataset file operations fail
 */
export class DatasetFileError extends DatasetError {
  constructor(
    message: string,
    datasetId: string,
    public readonly filePath: string,
    public readonly operation: 'read' | 'write' | 'delete',
    originalError?: unknown
  ) {
    super(
      message,
      'DATASET_FILE_ERROR',
      datasetId,
      { filePath, operation },
      originalError
    );
    this.name = 'DatasetFileError';
    Object.setPrototypeOf(this, DatasetFileError.prototype);
  }
}

/**
 * Model execution errors
 */
export class ModelExecutionError extends EvalError {
  constructor(
    message: string,
    public readonly modelId: string,
    public readonly testCaseId: string,
    public readonly retryable: boolean,
    context?: Record<string, unknown>,
    originalError?: unknown
  ) {
    super(
      message,
      'MODEL_EXECUTION_ERROR',
      { ...context, modelId, testCaseId, retryable },
      originalError
    );
    this.name = 'ModelExecutionError';
    Object.setPrototypeOf(this, ModelExecutionError.prototype);
  }
}

/**
 * Error when model generation times out
 */
export class ModelTimeoutError extends ModelExecutionError {
  constructor(
    modelId: string,
    testCaseId: string,
    public readonly timeoutMs: number,
    originalError?: unknown
  ) {
    super(
      `Model generation timed out after ${timeoutMs}ms`,
      modelId,
      testCaseId,
      false, // Not retryable
      { timeoutMs },
      originalError
    );
    this.name = 'ModelTimeoutError';
    Object.setPrototypeOf(this, ModelTimeoutError.prototype);
  }
}

/**
 * Error when model rate limit is exceeded
 */
export class ModelRateLimitError extends ModelExecutionError {
  constructor(
    modelId: string,
    testCaseId: string,
    public readonly retryAfterMs?: number,
    originalError?: unknown
  ) {
    super(
      `Model rate limit exceeded${retryAfterMs ? `. Retry after ${retryAfterMs}ms` : ''}`,
      modelId,
      testCaseId,
      true, // Retryable
      { retryAfterMs },
      originalError
    );
    this.name = 'ModelRateLimitError';
    Object.setPrototypeOf(this, ModelRateLimitError.prototype);
  }
}

/**
 * Scoring errors
 */
export class ScoringError extends EvalError {
  constructor(
    message: string,
    public readonly scorerType: string,
    public readonly testCaseId: string,
    context?: Record<string, unknown>,
    originalError?: unknown
  ) {
    super(
      message,
      'SCORING_ERROR',
      { ...context, scorerType, testCaseId },
      originalError
    );
    this.name = 'ScoringError';
    Object.setPrototypeOf(this, ScoringError.prototype);
  }
}

/**
 * Configuration errors
 */
export class ConfigurationError extends EvalError {
  constructor(
    message: string,
    public readonly configKey: string,
    public readonly expectedType?: string,
    public readonly receivedType?: string,
    originalError?: unknown
  ) {
    super(
      message,
      'CONFIGURATION_ERROR',
      { configKey, expectedType, receivedType },
      originalError
    );
    this.name = 'ConfigurationError';
    Object.setPrototypeOf(this, ConfigurationError.prototype);
  }
}

/**
 * Utility function to extract error message safely
 *
 * @param error - Error of unknown type
 * @returns Error message string
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return String(error);
}

/**
 * Utility function to check if error is retryable
 *
 * @param error - Error to check
 * @returns true if error should be retried
 */
export function isRetryableError(error: unknown): boolean {
  // Check if it's a ModelExecutionError with retryable flag
  if (error instanceof ModelExecutionError) {
    return error.retryable;
  }

  // Check error message for common retryable patterns
  const message = getErrorMessage(error).toLowerCase();
  const retryablePatterns = [
    'rate limit',
    'timeout',
    'econnreset',
    'etimedout',
    'enotfound',
    '429',
    '500',
    '502',
    '503',
    '504',
    'network error',
    'service unavailable',
  ];

  return retryablePatterns.some((pattern) => message.includes(pattern));
}

/**
 * Utility function to wrap an error with context
 *
 * @param error - Original error
 * @param context - Additional context
 * @returns EvalError with context
 *
 * @example
 * ```typescript
 * try {
 *   await dangerousOperation();
 * } catch (error) {
 *   throw wrapError(error, {
 *     operation: 'dangerousOperation',
 *     attemptNumber: 3,
 *   });
 * }
 * ```
 */
export function wrapError(
  error: unknown,
  context: Record<string, unknown>
): EvalError {
  if (error instanceof EvalError) {
    return new EvalError(
      error.message,
      error.code,
      { ...error.context, ...context },
      error.originalError || error
    );
  }

  return new EvalError(
    getErrorMessage(error),
    'WRAPPED_ERROR',
    context,
    error
  );
}
