/**
 * Advising Service API Gateway
 * Forwards requests to Advising Service
 */

import { NextRequest } from 'next/server';
import { createRouteHandler, extractPath, forwardRequest } from '@/lib/api/routeHandler';
import { getServiceUrl } from '@/lib/services';

const serviceUrl = getServiceUrl('advising');

// GET /api/advising/*
export const GET = createRouteHandler(
  async (request, context, params) => {
    const path = extractPath(params);
    return forwardRequest(serviceUrl, path, request, context);
  },
  { serviceName: 'advising' }
);

// POST /api/advising/*
export const POST = createRouteHandler(
  async (request, context, params) => {
    const path = extractPath(params);
    return forwardRequest(serviceUrl, path, request, context);
  },
  { serviceName: 'advising' }
);

// PUT /api/advising/*
export const PUT = createRouteHandler(
  async (request, context, params) => {
    const path = extractPath(params);
    return forwardRequest(serviceUrl, path, request, context);
  },
  { serviceName: 'advising' }
);

// PATCH /api/advising/*
export const PATCH = createRouteHandler(
  async (request, context, params) => {
    const path = extractPath(params);
    return forwardRequest(serviceUrl, path, request, context);
  },
  { serviceName: 'advising' }
);

// DELETE /api/advising/*
export const DELETE = createRouteHandler(
  async (request, context, params) => {
    const path = extractPath(params);
    return forwardRequest(serviceUrl, path, request, context);
  },
  { serviceName: 'advising' }
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
