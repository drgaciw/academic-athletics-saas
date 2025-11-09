/**
 * Error Handler Middleware
 * Global error handling for Hono applications
 */

import type { Context, ErrorHandler } from 'hono';
import { AppError, formatErrorResponse, getStatusCode } from '../utils/errors';
import { Logger } from '../utils/logging';

/**
 * Create error handler middleware for Hono
 */
export function createErrorHandler(logger?: Logger): ErrorHandler {
  return (error: Error, c: Context) => {
    const requestId = c.get('requestId');
    const path = c.req.path;

    // Log the error
    if (logger) {
      if (error instanceof AppError && error.isOperational) {
        // Log operational errors at warn level
        logger.warn('Operational error occurred', {
          error: error.message,
          code: error.code,
          category: error.category,
          requestId,
          path,
        });
      } else {
        // Log unexpected errors at error level
        logger.error('Unexpected error occurred', error, {
          requestId,
          path,
        });
      }
    }

    // Get status code
    const statusCode = getStatusCode(error);

    // Format error response
    const response = formatErrorResponse(error, requestId, path);

    // Return error response
    return c.json(response, statusCode);
  };
}

/**
 * Not found handler
 */
export function notFoundHandler() {
  return (c: Context) => {
    const requestId = c.get('requestId');
    const path = c.req.path;

    return c.json(
      formatErrorResponse(
        new Error(`Route not found: ${c.req.method} ${path}`),
        requestId,
        path
      ),
      404
    );
  };
}
