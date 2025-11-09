/**
 * AI Service API Gateway
 * Forwards requests to AI Service with streaming support
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandler, extractPath } from '@/lib/api/routeHandler';
import { getServiceUrl } from '@/lib/services';
import { validateAuth } from '@/lib/middleware/authentication';
import { logServiceCall } from '@/lib/middleware/logging';

const serviceUrl = getServiceUrl('ai');

/**
 * Forward with streaming support
 */
async function forwardWithStreaming(
  path: string,
  request: NextRequest,
  context: any
): Promise<NextResponse> {
  const url = `${serviceUrl}${path}`;

  // Check if this is a streaming request
  let body: any;
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const isStreaming = body.stream === true || path.includes('/chat');

  logServiceCall('ai', path, request.method, context);

  // Prepare headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (context) {
    headers['X-Correlation-Id'] = context.correlationId;
    headers['X-User-Id'] = context.userId;
    headers['X-User-Role'] = context.role;
  }

  // Forward auth token
  const authHeader = request.headers.get('authorization');
  if (authHeader) {
    headers['Authorization'] = authHeader;
  }

  // Make request
  const response = await fetch(url, {
    method: request.method,
    headers,
    body: JSON.stringify(body),
  });

  // Handle streaming responses
  if (isStreaming && response.ok && response.body) {
    return new NextResponse(response.body, {
      status: response.status,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Request-Id': context?.correlationId || 'unknown',
      },
    });
  }

  // Handle regular JSON responses
  const data = await response.json();
  return NextResponse.json(data, {
    status: response.status,
    headers: {
      'X-Request-Id': context?.correlationId || 'unknown',
    },
  });
}

// GET /api/ai/*
export const GET = createRouteHandler(
  async (request, context, params) => {
    const path = extractPath(params);
    return forwardWithStreaming(path, request, context);
  },
  { serviceName: 'ai' }
);

// POST /api/ai/*
export const POST = createRouteHandler(
  async (request, context, params) => {
    const path = extractPath(params);
    return forwardWithStreaming(path, request, context);
  },
  { serviceName: 'ai' }
);

// PUT /api/ai/*
export const PUT = createRouteHandler(
  async (request, context, params) => {
    const path = extractPath(params);
    return forwardWithStreaming(path, request, context);
  },
  { serviceName: 'ai' }
);

// PATCH /api/ai/*
export const PATCH = createRouteHandler(
  async (request, context, params) => {
    const path = extractPath(params);
    return forwardWithStreaming(path, request, context);
  },
  { serviceName: 'ai' }
);

// DELETE /api/ai/*
export const DELETE = createRouteHandler(
  async (request, context, params) => {
    const path = extractPath(params);
    return forwardWithStreaming(path, request, context);
  },
  { serviceName: 'ai' }
);

// OPTIONS (CORS preflight)
export async function OPTIONS(request: NextRequest) {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
