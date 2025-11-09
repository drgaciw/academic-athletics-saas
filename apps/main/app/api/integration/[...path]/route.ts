/**
 * Integration Service API Gateway
 * Forwards requests to Integration Service
 */

import { NextRequest } from 'next/server';
import { createRouteHandler, extractPath, forwardRequest } from '@/lib/api/routeHandler';
import { getServiceUrl } from '@/lib/services';

const serviceUrl = getServiceUrl('integration');

// GET /api/integration/*
export const GET = createRouteHandler(
  async (request, context, params) => {
    const path = extractPath(params);
    return forwardRequest(serviceUrl, path, request, context);
  },
  { serviceName: 'integration' }
);

// POST /api/integration/*
export const POST = createRouteHandler(
  async (request, context, params) => {
    const path = extractPath(params);
    return forwardRequest(serviceUrl, path, request, context);
  },
  { serviceName: 'integration' }
);

// PUT /api/integration/*
export const PUT = createRouteHandler(
  async (request, context, params) => {
    const path = extractPath(params);
    return forwardRequest(serviceUrl, path, request, context);
  },
  { serviceName: 'integration' }
);

// PATCH /api/integration/*
export const PATCH = createRouteHandler(
  async (request, context, params) => {
    const path = extractPath(params);
    return forwardRequest(serviceUrl, path, request, context);
  },
  { serviceName: 'integration' }
);

// DELETE /api/integration/*
export const DELETE = createRouteHandler(
  async (request, context, params) => {
    const path = extractPath(params);
    return forwardRequest(serviceUrl, path, request, context);
  },
  { serviceName: 'integration' }
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
