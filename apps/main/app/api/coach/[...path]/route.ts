/**
 * Coach Service API Gateway
 * Forwards requests to Coach Service
 */

import { NextRequest } from 'next/server';
import { createRouteHandler, extractPath, forwardRequest } from '@/lib/api/routeHandler';
import { getServiceUrl } from '@/lib/services';

const serviceUrl = getServiceUrl('coach');

// GET /api/coach/*
export const GET = createRouteHandler(
  async (request, context, params) => {
    const path = extractPath(params);
    return forwardRequest(serviceUrl, path, request, context);
  },
  { serviceName: 'coach' }
);

// POST /api/coach/*
export const POST = createRouteHandler(
  async (request, context, params) => {
    const path = extractPath(params);
    return forwardRequest(serviceUrl, path, request, context);
  },
  { serviceName: 'coach' }
);

// PUT /api/coach/*
export const PUT = createRouteHandler(
  async (request, context, params) => {
    const path = extractPath(params);
    return forwardRequest(serviceUrl, path, request, context);
  },
  { serviceName: 'coach' }
);

// PATCH /api/coach/*
export const PATCH = createRouteHandler(
  async (request, context, params) => {
    const path = extractPath(params);
    return forwardRequest(serviceUrl, path, request, context);
  },
  { serviceName: 'coach' }
);

// DELETE /api/coach/*
export const DELETE = createRouteHandler(
  async (request, context, params) => {
    const path = extractPath(params);
    return forwardRequest(serviceUrl, path, request, context);
  },
  { serviceName: 'coach' }
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
