/**
 * Compliance Service API Gateway
 * Forwards requests to Compliance Service
 */

import { NextRequest } from 'next/server';
import { createRouteHandler, extractPath, forwardRequest } from '@/lib/api/routeHandler';
import { getServiceUrl } from '@/lib/services';

const serviceUrl = getServiceUrl('compliance');

// GET /api/compliance/*
export const GET = createRouteHandler(
  async (request, context, params) => {
    const path = extractPath(params);
    return forwardRequest(serviceUrl, path, request, context);
  },
  { serviceName: 'compliance' }
);

// POST /api/compliance/*
export const POST = createRouteHandler(
  async (request, context, params) => {
    const path = extractPath(params);
    return forwardRequest(serviceUrl, path, request, context);
  },
  { serviceName: 'compliance' }
);

// PUT /api/compliance/*
export const PUT = createRouteHandler(
  async (request, context, params) => {
    const path = extractPath(params);
    return forwardRequest(serviceUrl, path, request, context);
  },
  { serviceName: 'compliance' }
);

// PATCH /api/compliance/*
export const PATCH = createRouteHandler(
  async (request, context, params) => {
    const path = extractPath(params);
    return forwardRequest(serviceUrl, path, request, context);
  },
  { serviceName: 'compliance' }
);

// DELETE /api/compliance/*
export const DELETE = createRouteHandler(
  async (request, context, params) => {
    const path = extractPath(params);
    return forwardRequest(serviceUrl, path, request, context);
  },
  { serviceName: 'compliance' }
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
