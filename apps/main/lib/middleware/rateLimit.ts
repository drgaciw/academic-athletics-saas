/**
 * Rate Limiting Middleware
 * Implements per-user and per-service rate limiting
 */

import { NextRequest } from 'next/server';
import { RequestContext } from '../types/services';

export class RateLimitError extends Error {
  constructor(
    message: string,
    public retryAfter: number,
    public limit: number,
    public remaining: number
  ) {
    super(message);
    this.name = 'RateLimitError';
  }
}

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
}

// In-memory store for development (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

/**
 * Service-specific rate limits
 */
const SERVICE_LIMITS: Record<string, RateLimitConfig> = {
  user: { windowMs: 60000, maxRequests: 100 }, // 100 req/min
  compliance: { windowMs: 60000, maxRequests: 50 }, // 50 req/min
  advising: { windowMs: 60000, maxRequests: 60 }, // 60 req/min
  monitoring: { windowMs: 60000, maxRequests: 100 }, // 100 req/min
  support: { windowMs: 60000, maxRequests: 80 }, // 80 req/min
  integration: { windowMs: 60000, maxRequests: 40 }, // 40 req/min
  ai: { windowMs: 60000, maxRequests: 20 }, // 20 req/min (AI is expensive)
};

/**
 * Default rate limit for unknown services
 */
const DEFAULT_LIMIT: RateLimitConfig = {
  windowMs: 60000,
  maxRequests: 60,
};

/**
 * Checks rate limit for a service and user
 * @throws {RateLimitError} If rate limit exceeded
 */
export async function checkRateLimit(
  serviceName: string,
  context: RequestContext
): Promise<void> {
  const config = SERVICE_LIMITS[serviceName] || DEFAULT_LIMIT;
  const key = `${serviceName}:${context.userId}`;

  const now = Date.now();
  const record = rateLimitStore.get(key);

  // Reset if window expired
  if (!record || now >= record.resetAt) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + config.windowMs,
    });
    return;
  }

  // Check limit
  if (record.count >= config.maxRequests) {
    const retryAfter = Math.ceil((record.resetAt - now) / 1000);
    throw new RateLimitError(
      `Rate limit exceeded for ${serviceName}`,
      retryAfter,
      config.maxRequests,
      0
    );
  }

  // Increment counter
  record.count++;
  rateLimitStore.set(key, record);
}

/**
 * Gets remaining rate limit for a service
 */
export function getRateLimitInfo(
  serviceName: string,
  context: RequestContext
): {
  limit: number;
  remaining: number;
  resetAt: number;
} {
  const config = SERVICE_LIMITS[serviceName] || DEFAULT_LIMIT;
  const key = `${serviceName}:${context.userId}`;
  const record = rateLimitStore.get(key);
  const now = Date.now();

  if (!record || now >= record.resetAt) {
    return {
      limit: config.maxRequests,
      remaining: config.maxRequests,
      resetAt: now + config.windowMs,
    };
  }

  return {
    limit: config.maxRequests,
    remaining: Math.max(0, config.maxRequests - record.count),
    resetAt: record.resetAt,
  };
}

/**
 * Adds rate limit headers to response
 */
export function addRateLimitHeaders(
  headers: Headers,
  serviceName: string,
  context: RequestContext
): void {
  const info = getRateLimitInfo(serviceName, context);

  headers.set('X-RateLimit-Limit', info.limit.toString());
  headers.set('X-RateLimit-Remaining', info.remaining.toString());
  headers.set('X-RateLimit-Reset', info.resetAt.toString());
}

/**
 * Cleanup expired entries (run periodically)
 */
export function cleanupRateLimitStore(): void {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now >= record.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}

// Cleanup every 5 minutes in production
if (process.env.NODE_ENV === 'production') {
  setInterval(cleanupRateLimitStore, 5 * 60 * 1000);
}
