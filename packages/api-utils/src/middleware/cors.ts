/**
 * CORS Middleware
 * Cross-Origin Resource Sharing configuration
 */

import type { Context, MiddlewareHandler } from 'hono';

/**
 * CORS configuration options
 */
export interface CorsOptions {
  origin?: string | string[] | ((origin: string) => boolean);
  methods?: string[];
  allowedHeaders?: string[];
  exposedHeaders?: string[];
  credentials?: boolean;
  maxAge?: number;
}

/**
 * Default CORS options
 */
const defaultOptions: CorsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  exposedHeaders: ['X-Request-ID', 'X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
  credentials: false,
  maxAge: 86400, // 24 hours
};

/**
 * Check if origin is allowed
 */
function isOriginAllowed(
  origin: string,
  allowedOrigin: string | string[] | ((origin: string) => boolean)
): boolean {
  if (typeof allowedOrigin === 'string') {
    return allowedOrigin === '*' || allowedOrigin === origin;
  }

  if (Array.isArray(allowedOrigin)) {
    return allowedOrigin.includes(origin);
  }

  if (typeof allowedOrigin === 'function') {
    return allowedOrigin(origin);
  }

  return false;
}

/**
 * CORS middleware for Hono
 */
export function cors(options: CorsOptions = {}): MiddlewareHandler {
  const opts = { ...defaultOptions, ...options };

  return async (c: Context, next) => {
    const origin = c.req.header('Origin') || '';
    const requestMethod = c.req.method;

    // Handle preflight requests
    if (requestMethod === 'OPTIONS') {
      const requestHeaders = c.req.header('Access-Control-Request-Headers');

      // Set CORS headers for preflight
      if (opts.origin && isOriginAllowed(origin, opts.origin)) {
        c.header('Access-Control-Allow-Origin', origin);
      } else if (opts.origin === '*') {
        c.header('Access-Control-Allow-Origin', '*');
      }

      if (opts.credentials) {
        c.header('Access-Control-Allow-Credentials', 'true');
      }

      if (opts.methods) {
        c.header('Access-Control-Allow-Methods', opts.methods.join(', '));
      }

      if (opts.allowedHeaders) {
        c.header('Access-Control-Allow-Headers', opts.allowedHeaders.join(', '));
      } else if (requestHeaders) {
        c.header('Access-Control-Allow-Headers', requestHeaders);
      }

      if (opts.maxAge) {
        c.header('Access-Control-Max-Age', opts.maxAge.toString());
      }

      return c.text('', 204);
    }

    // Set CORS headers for actual requests
    if (opts.origin && isOriginAllowed(origin, opts.origin)) {
      c.header('Access-Control-Allow-Origin', origin);
    } else if (opts.origin === '*') {
      c.header('Access-Control-Allow-Origin', '*');
    }

    if (opts.credentials) {
      c.header('Access-Control-Allow-Credentials', 'true');
    }

    if (opts.exposedHeaders) {
      c.header('Access-Control-Expose-Headers', opts.exposedHeaders.join(', '));
    }

    await next();
  };
}

/**
 * Development CORS (allow all)
 */
export function devCors(): MiddlewareHandler {
  return cors({
    origin: '*',
    credentials: false,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
  });
}

/**
 * Production CORS with specific origins
 */
export function prodCors(allowedOrigins: string[]): MiddlewareHandler {
  return cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });
}

/**
 * Custom origin validator CORS
 */
export function customOriginCors(
  originValidator: (origin: string) => boolean,
  credentials = true
): MiddlewareHandler {
  return cors({
    origin: originValidator,
    credentials,
  });
}
