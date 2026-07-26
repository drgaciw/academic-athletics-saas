/**
 * AI Service API Gateway
 * Forwards requests to AI Service with streaming support
 */

import { NextRequest, NextResponse } from 'next/server';
import { buildForwardUrl, buildServicePath, createRouteHandler, extractPath } from '@/lib/api/routeHandler';
import { getServiceUrl } from '@/lib/services';
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
  const url = buildForwardUrl(serviceUrl, path, request);

  let body: any = undefined;
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    try {
      body = await request.json();
    } catch {
      body = undefined;
    }
  }

  logServiceCall('ai', path, request.method, context);

  // Prepare headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (context) {
    headers['X-Correlation-Id'] = context.correlationId;
    headers['X-User-Id'] = context.userId;
    // Normalize Clerk/Prisma student aliases to the AI service STUDENT contract.
    const role = context.role === 'STUDENT_ATHLETE' ? 'STUDENT' : context.role;
    headers['X-User-Role'] = role;
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
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const contentType = response.headers.get('content-type') || '';

  // Handle streaming responses
  if (contentType.includes('text/event-stream') && response.ok && response.body) {
    return new NextResponse(response.body, {
      status: response.status,
      headers: {
        'Content-Type': contentType,
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
    const path = buildServicePath('ai', extractPath(params));
    return forwardWithStreaming(path, request, context);
  },
  { serviceName: 'ai' }
);

// POST /api/ai/*
export const POST = createRouteHandler(
  async (request, context, params) => {
    const path = buildServicePath('ai', extractPath(params));
    return forwardWithStreaming(path, request, context);
  },
  { serviceName: 'ai' }
);

// PUT /api/ai/*
export const PUT = createRouteHandler(
  async (request, context, params) => {
    const path = buildServicePath('ai', extractPath(params));
    return forwardWithStreaming(path, request, context);
  },
  { serviceName: 'ai' }
);

// PATCH /api/ai/*
export const PATCH = createRouteHandler(
  async (request, context, params) => {
    const path = buildServicePath('ai', extractPath(params));
    return forwardWithStreaming(path, request, context);
  },
  { serviceName: 'ai' }
);

// DELETE /api/ai/*
export const DELETE = createRouteHandler(
  async (request, context, params) => {
    const path = buildServicePath('ai', extractPath(params));
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
