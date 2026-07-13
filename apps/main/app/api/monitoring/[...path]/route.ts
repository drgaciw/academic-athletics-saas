/**
 * Monitoring Service API Gateway
 * Forwards requests to Monitoring Service
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

const serviceUrl = getServiceUrl('monitoring');
const allowedRoles = [UserRole.ADMIN, UserRole.COMPLIANCE] as const;

async function forwardMonitoringRequest(
  request: NextRequest,
  context: RequestContext | null,
  params: any
) {
  requireServiceRole(context, allowedRoles, 'monitoring');
  const path = extractServicePath('monitoring', params);
  return forwardRequest(serviceUrl, path, request, context);
}

// GET /api/monitoring/*
export const GET = createRouteHandler(
  forwardMonitoringRequest,
  { serviceName: 'monitoring' }
);

// POST /api/monitoring/*
export const POST = createRouteHandler(
  forwardMonitoringRequest,
  { serviceName: 'monitoring' }
);

// PUT /api/monitoring/*
export const PUT = createRouteHandler(
  forwardMonitoringRequest,
  { serviceName: 'monitoring' }
);

// PATCH /api/monitoring/*
export const PATCH = createRouteHandler(
  forwardMonitoringRequest,
  { serviceName: 'monitoring' }
);

// DELETE /api/monitoring/*
export const DELETE = createRouteHandler(
  forwardMonitoringRequest,
  { serviceName: 'monitoring' }
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
