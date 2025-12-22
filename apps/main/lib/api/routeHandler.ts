/**
 * API Route Handler Utility
 * Wraps route handlers with middleware (auth, logging, rate limiting, error handling)
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateAuth, validateOptionalAuth } from '../middleware/authentication';
import { logRequest, logResponse, createTimer } from '../middleware/logging';
import { checkRateLimit, addRateLimitHeaders } from '../middleware/rateLimit';
import { handleError } from '../middleware/errorHandler';
import { addCorsHeaders, handleCorsPreFlight } from '../middleware/cors';
import { RequestContext } from '../types/services';

export interface RouteHandlerConfig {
  requireAuth?: boolean;
  serviceName: string;
  skipRateLimit?: boolean;
}

/**
 * Creates a wrapped route handler with all middleware
 */
export function createRouteHandler(
  handler: (
    request: NextRequest,
    context: RequestContext | null,
    params: any
  ) => Promise<NextResponse>,
  config: RouteHandlerConfig
) {
  return async (
    request: NextRequest,
    { params }: { params: any }
  ): Promise<NextResponse> => {
    const timer = createTimer();
    const origin = request.headers.get('origin') || undefined;
    let context: RequestContext | null = null;

    try {
      // Handle CORS preflight
      if (request.method === 'OPTIONS') {
        return handleCorsPreFlight(origin);
      }

      // Validate authentication
      if (config.requireAuth !== false) {
        context = await validateAuth(request);
      } else {
        context = await validateOptionalAuth(request);
      }

      // Log request
      logRequest(request, context || undefined);

      // Check rate limit
      if (!config.skipRateLimit && context) {
        await checkRateLimit(config.serviceName, context);
      }

      // Call handler
      const response = await handler(request, context, params);

      // Add CORS headers
      addCorsHeaders(response, origin);

      // Add rate limit headers
      if (context) {
        addRateLimitHeaders(response.headers, config.serviceName, context);
      }

      // Add correlation ID
      if (context) {
        response.headers.set('X-Request-Id', context.correlationId);
      }

      // Log response
      const duration = timer();
      logResponse(response.status, duration, context || undefined);

      return response;
    } catch (error) {
      const duration = timer();
      const response = handleError(error as Error, context || undefined);

      // Add CORS headers to error responses
      addCorsHeaders(response, origin);

      return response;
    }
  };
}

/**
 * Extracts path segments from params
 */
export function extractPath(params: any): string {
  const path = params.path;
  if (Array.isArray(path)) {
    return '/' + path.join('/');
  }
  return '/' + (path || '');
}

/**
 * Forwards request to service with proper headers
 */
export async function forwardRequest(
  serviceUrl: string,
  path: string,
  request: NextRequest,
  context: RequestContext | null
): Promise<NextResponse> {
  const url = `${serviceUrl}${path}`;

  // Get request body if present
  let body: any = undefined;
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    try {
      body = await request.json();
    } catch {
      // No body or invalid JSON
    }
  }

  // Prepare headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Forward authorization token
  const authHeader = request.headers.get('authorization');
  if (authHeader) {
    headers['Authorization'] = authHeader;
  }

  // Add context headers
  if (context) {
    headers['X-Correlation-Id'] = context.correlationId;
    headers['X-User-Id'] = context.userId;
    headers['X-User-Role'] = context.role;
  }

  // Make request to service
  const response = await fetch(url, {
    method: request.method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  // Get response data
  const contentType = response.headers.get('content-type');
  let data: any;

  if (contentType?.includes('application/json')) {
    data = await response.json();
  } else if (contentType?.includes('text/')) {
    data = await response.text();
  } else {
    data = await response.blob();
  }

  // Create NextResponse
  return NextResponse.json(data, {
    status: response.status,
    headers: {
      'Content-Type': contentType || 'application/json',
    },
  });
}
