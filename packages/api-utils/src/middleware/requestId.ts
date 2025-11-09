/**
 * Request ID Middleware
 * Adds unique request ID to each request for tracing
 */

import type { Context, MiddlewareHandler } from 'hono';
import { generateRequestId } from '../utils/logging';

/**
 * Request ID middleware options
 */
export interface RequestIdOptions {
  headerName?: string;
  generator?: () => string;
  setResponseHeader?: boolean;
}

/**
 * Request ID middleware
 * Generates or extracts request ID for tracing
 */
export function requestIdMiddleware(options: RequestIdOptions = {}): MiddlewareHandler {
  const {
    headerName = 'X-Request-ID',
    generator = generateRequestId,
    setResponseHeader = true,
  } = options;

  return async (c: Context, next) => {
    // Try to get request ID from header, otherwise generate new one
    const requestId = c.req.header(headerName) || generator();

    // Store in context
    c.set('requestId', requestId);

    // Set response header
    if (setResponseHeader) {
      c.header(headerName, requestId);
    }

    await next();
  };
}
