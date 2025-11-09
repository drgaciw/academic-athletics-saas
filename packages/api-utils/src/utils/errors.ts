/**
 * Error Handling Utilities
 * Provides standardized error classes and helpers for consistent error handling
 */

import type { ErrorCategory, ErrorCode, ErrorResponse } from '../types';

/**
 * Custom application error class with error codes and categories
 */
export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly category: ErrorCategory;
  public readonly statusCode: number;
  public readonly details?: unknown;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    code: ErrorCode,
    category: ErrorCategory,
    statusCode: number,
    details?: unknown,
    isOperational = true
  ) {
    super(message);
    this.code = code;
    this.category = category;
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = isOperational;

    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace(this, this.constructor);
    Object.setPrototypeOf(this, AppError.prototype);
  }

  /**
   * Convert error to JSON response format
   */
  toJSON(): ErrorResponse['error'] {
    return {
      code: this.code,
      message: this.message,
      category: this.category,
      details: this.details,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Authentication errors (401)
 */
export class AuthError extends AppError {
  constructor(message = 'Authentication failed', code: ErrorCode = 'AUTH_UNAUTHORIZED', details?: unknown) {
    super(message, code, 'AUTH' as ErrorCategory, 401, details);
  }
}

/**
 * Authorization errors (403)
 */
export class ForbiddenError extends AppError {
  constructor(message = 'Access forbidden', code: ErrorCode = 'AUTH_FORBIDDEN', details?: unknown) {
    super(message, code, 'FORBIDDEN' as ErrorCategory, 403, details);
  }
}

/**
 * Validation errors (400)
 */
export class ValidationError extends AppError {
  constructor(message = 'Validation failed', details?: unknown) {
    super(message, 'VALIDATION_FAILED', 'VALIDATION' as ErrorCategory, 400, details);
  }
}

/**
 * Not found errors (404)
 */
export class NotFoundError extends AppError {
  constructor(message = 'Resource not found', resource?: string) {
    super(
      message,
      'NOT_FOUND_RESOURCE',
      'NOT_FOUND' as ErrorCategory,
      404,
      resource ? { resource } : undefined
    );
  }
}

/**
 * Conflict errors (409)
 */
export class ConflictError extends AppError {
  constructor(message = 'Resource conflict', code: ErrorCode = 'CONFLICT_DUPLICATE', details?: unknown) {
    super(message, code, 'CONFLICT' as ErrorCategory, 409, details);
  }
}

/**
 * Rate limit errors (429)
 */
export class RateLimitError extends AppError {
  constructor(message = 'Rate limit exceeded', retryAfter?: number) {
    super(
      message,
      'RATE_LIMIT_EXCEEDED',
      'RATE_LIMIT' as ErrorCategory,
      429,
      retryAfter ? { retryAfter } : undefined
    );
  }
}

/**
 * Server errors (500)
 */
export class ServerError extends AppError {
  constructor(message = 'Internal server error', details?: unknown) {
    super(message, 'SERVER_ERROR', 'SERVER' as ErrorCategory, 500, details, false);
  }
}

/**
 * External service errors (502)
 */
export class ExternalServiceError extends AppError {
  constructor(message = 'External service error', service?: string, details?: unknown) {
    super(
      message,
      'EXTERNAL_SERVICE_ERROR',
      'EXTERNAL' as ErrorCategory,
      502,
      { service, ...details },
      false
    );
  }
}

/**
 * Timeout errors (504)
 */
export class TimeoutError extends AppError {
  constructor(message = 'Request timeout', timeout?: number) {
    super(
      message,
      'SERVER_TIMEOUT',
      'SERVER' as ErrorCategory,
      504,
      timeout ? { timeout } : undefined
    );
  }
}

/**
 * HTTP status code helpers
 */
export const HttpStatus = {
  // Success
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,

  // Redirection
  MOVED_PERMANENTLY: 301,
  FOUND: 302,
  NOT_MODIFIED: 304,

  // Client Errors
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,

  // Server Errors
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;

/**
 * Error response formatter
 * Converts any error into a standardized ErrorResponse format
 */
export function formatErrorResponse(
  error: unknown,
  requestId?: string,
  path?: string
): ErrorResponse {
  if (error instanceof AppError) {
    return {
      success: false,
      error: {
        ...error.toJSON(),
        requestId,
        path,
      },
    };
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    return {
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: error.message || 'An unexpected error occurred',
        category: 'SERVER' as ErrorCategory,
        timestamp: new Date().toISOString(),
        requestId,
        path,
      },
    };
  }

  // Handle unknown error types
  return {
    success: false,
    error: {
      code: 'SERVER_ERROR',
      message: 'An unexpected error occurred',
      category: 'SERVER' as ErrorCategory,
      timestamp: new Date().toISOString(),
      requestId,
      path,
    },
  };
}

/**
 * Check if error is operational (expected) or programming error
 */
export function isOperationalError(error: unknown): boolean {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
}

/**
 * Get HTTP status code from error
 */
export function getStatusCode(error: unknown): number {
  if (error instanceof AppError) {
    return error.statusCode;
  }
  return HttpStatus.INTERNAL_SERVER_ERROR;
}

/**
 * Error category helpers
 */
export const ErrorCategories = {
  isAuthError: (error: unknown): boolean =>
    error instanceof AppError && error.category === 'AUTH',

  isValidationError: (error: unknown): boolean =>
    error instanceof AppError && error.category === 'VALIDATION',

  isNotFoundError: (error: unknown): boolean =>
    error instanceof AppError && error.category === 'NOT_FOUND',

  isServerError: (error: unknown): boolean =>
    error instanceof AppError && error.category === 'SERVER',

  isExternalError: (error: unknown): boolean =>
    error instanceof AppError && error.category === 'EXTERNAL',

  isRateLimitError: (error: unknown): boolean =>
    error instanceof AppError && error.category === 'RATE_LIMIT',
} as const;
