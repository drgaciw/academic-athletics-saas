/**
 * Integration Service API Gateway
 * Forwards requests to Integration Service
 */

import { NextRequest } from 'next/server';
import {
  createRouteHandler,
  extractServicePath,
  forwardRequest,
  requireServiceRole,
} from '@/lib/api/routeHandler';
import { getServiceUrl } from '@/lib/services';
import { RequestContext, UserRole } from '@/lib/types/services';

const serviceUrl = getServiceUrl('integration');
const allowedRoles = [UserRole.ADMIN, UserRole.COMPLIANCE] as const;

async function forwardIntegrationRequest(
  request: NextRequest,
  context: RequestContext | null,
  params: any
) {
  requireServiceRole(context, allowedRoles, 'integration');
  const path = extractServicePath('integration', params);
  return forwardRequest(serviceUrl, path, request, context);
}

// GET /api/integration/*
export const GET = createRouteHandler(
  forwardIntegrationRequest,
  { serviceName: 'integration' }
);

// POST /api/integration/*
export const POST = createRouteHandler(
  forwardIntegrationRequest,
  { serviceName: 'integration' }
);

// PUT /api/integration/*
export const PUT = createRouteHandler(
  forwardIntegrationRequest,
  { serviceName: 'integration' }
);

// PATCH /api/integration/*
export const PATCH = createRouteHandler(
  forwardIntegrationRequest,
  { serviceName: 'integration' }
);

// DELETE /api/integration/*
export const DELETE = createRouteHandler(
  forwardIntegrationRequest,
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
