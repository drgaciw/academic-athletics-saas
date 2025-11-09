/**
 * CORS Middleware
 * Handles Cross-Origin Resource Sharing configuration
 */

import { NextResponse } from 'next/server';

const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  'https://aah.vercel.app',
  // Add production domains here
];

const ALLOWED_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'];

const ALLOWED_HEADERS = [
  'Content-Type',
  'Authorization',
  'X-Requested-With',
  'Accept',
  'Origin',
];

const EXPOSED_HEADERS = [
  'X-RateLimit-Limit',
  'X-RateLimit-Remaining',
  'X-RateLimit-Reset',
  'X-Request-Id',
];

/**
 * Adds CORS headers to response
 */
export function addCorsHeaders(response: NextResponse, origin?: string): void {
  // Check if origin is allowed
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin)
    ? origin
    : ALLOWED_ORIGINS[0];

  response.headers.set('Access-Control-Allow-Origin', allowedOrigin);
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set(
    'Access-Control-Allow-Methods',
    ALLOWED_METHODS.join(', ')
  );
  response.headers.set(
    'Access-Control-Allow-Headers',
    ALLOWED_HEADERS.join(', ')
  );
  response.headers.set(
    'Access-Control-Expose-Headers',
    EXPOSED_HEADERS.join(', ')
  );
  response.headers.set('Access-Control-Max-Age', '86400'); // 24 hours
}

/**
 * Handles CORS preflight requests
 */
export function handleCorsPreFlight(origin?: string): NextResponse {
  const response = new NextResponse(null, { status: 204 });
  addCorsHeaders(response, origin);
  return response;
}

/**
 * Validates origin is allowed
 */
export function isOriginAllowed(origin: string): boolean {
  // Allow all origins in development
  if (process.env.NODE_ENV === 'development') {
    return true;
  }

  return ALLOWED_ORIGINS.includes(origin);
}
