/**
 * Error Handler Middleware
 * Provides consistent error responses across all services
 */

import { NextResponse } from 'next/server';
import { ApiError } from '../types/services';
import { RequestContext } from '../types/services';
import { logError } from './logging';
import { AuthenticationError } from './authentication';
import { RateLimitError } from './rateLimit';

/**
 * Creates a standardized error response
 */
export function createErrorResponse(
  error: Error,
  statusCode: number = 500,
  requestId?: string
): NextResponse {
  const errorResponse: { error: ApiError } = {
    error: {
      code: getErrorCode(error),
      message: error.message,
      details: getErrorDetails(error),
      timestamp: new Date().toISOString(),
      requestId: requestId || 'unknown',
    },
  };

  return NextResponse.json(errorResponse, { status: statusCode });
}

/**
 * Handles errors and returns appropriate response
 */
export function handleError(
  error: Error,
  context?: RequestContext
): NextResponse {
  // Log the error
  logError(error, context);

  // Handle specific error types
  if (error instanceof AuthenticationError) {
    return createErrorResponse(error, error.statusCode, context?.correlationId);
  }

  if (error instanceof RateLimitError) {
    const response = createErrorResponse(error, 429, context?.correlationId);
    response.headers.set('Retry-After', error.retryAfter.toString());
    response.headers.set('X-RateLimit-Limit', error.limit.toString());
    response.headers.set('X-RateLimit-Remaining', error.remaining.toString());
    return response;
  }

  if (error instanceof ValidationError) {
    return createErrorResponse(error, 400, context?.correlationId);
  }

  if (error instanceof NotFoundError) {
    return createErrorResponse(error, 404, context?.correlationId);
  }

  if (error instanceof ServiceError) {
    return createErrorResponse(error, error.statusCode, context?.correlationId);
  }

  // Default error response
  return createErrorResponse(
    new Error('An unexpected error occurred'),
    500,
    context?.correlationId
  );
}

/**
 * Gets error code from error type
 */
function getErrorCode(error: Error): string {
  if (error instanceof AuthenticationError) {
    return error.statusCode === 403 ? 'FORBIDDEN' : 'UNAUTHORIZED';
  }
  if (error instanceof RateLimitError) return 'RATE_LIMIT_EXCEEDED';
  if (error instanceof ValidationError) return 'VALIDATION_ERROR';
  if (error instanceof NotFoundError) return 'NOT_FOUND';
  if (error instanceof ServiceError) return 'SERVICE_ERROR';

  return 'INTERNAL_ERROR';
}

/**
 * Extracts error details if available
 */
function getErrorDetails(error: Error): any {
  if (error instanceof ValidationError) {
    return error.validationErrors;
  }

  // Don't expose stack traces in production
  if (process.env.NODE_ENV !== 'production') {
    return { stack: error.stack };
  }

  return undefined;
}

/**
 * Custom error classes
 */
export class ValidationError extends Error {
  constructor(message: string, public validationErrors?: any) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ServiceError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public serviceName?: string
  ) {
    super(message);
    this.name = 'ServiceError';
  }
}

/**
 * Wraps async route handlers with error handling
 */
export function withErrorHandler<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleError(error as Error);
    }
  };
}
