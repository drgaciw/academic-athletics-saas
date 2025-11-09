/**
 * User Service API Gateway
 * Forwards requests to User Service
 */

import { NextRequest } from 'next/server';
import { createRouteHandler, extractPath, forwardRequest } from '@/lib/api/routeHandler';
import { getServiceUrl } from '@/lib/services';

const serviceUrl = getServiceUrl('user');

// GET /api/user/*
export const GET = createRouteHandler(
  async (request, context, params) => {
    const path = extractPath(params);
    return forwardRequest(serviceUrl, path, request, context);
  },
  { serviceName: 'user' }
);

// POST /api/user/*
export const POST = createRouteHandler(
  async (request, context, params) => {
    const path = extractPath(params);
    return forwardRequest(serviceUrl, path, request, context);
  },
  { serviceName: 'user' }
);

// PUT /api/user/*
export const PUT = createRouteHandler(
  async (request, context, params) => {
    const path = extractPath(params);
    return forwardRequest(serviceUrl, path, request, context);
  },
  { serviceName: 'user' }
);

// PATCH /api/user/*
export const PATCH = createRouteHandler(
  async (request, context, params) => {
    const path = extractPath(params);
    return forwardRequest(serviceUrl, path, request, context);
  },
  { serviceName: 'user' }
);

// DELETE /api/user/*
export const DELETE = createRouteHandler(
  async (request, context, params) => {
    const path = extractPath(params);
    return forwardRequest(serviceUrl, path, request, context);
  },
  { serviceName: 'user' }
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
