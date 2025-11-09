/**
 * Rate Limiting Utilities
 * Provides token bucket algorithm and rate limiting middleware
 */

import type { Context, MiddlewareHandler } from 'hono';
import type { RateLimitConfig, RateLimitInfo } from '../types';
import { RateLimitError } from './errors';

/**
 * Token bucket for rate limiting
 */
class TokenBucket {
  private tokens: number;
  private lastRefill: number;

  constructor(
    private capacity: number,
    private refillRate: number // tokens per second
  ) {
    this.tokens = capacity;
    this.lastRefill = Date.now();
  }

  /**
   * Refill tokens based on time elapsed
   */
  private refill(): void {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000; // seconds
    const tokensToAdd = elapsed * this.refillRate;

    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }

  /**
   * Try to consume tokens
   */
  consume(tokens = 1): boolean {
    this.refill();

    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return true;
    }

    return false;
  }

  /**
   * Get remaining tokens
   */
  getRemaining(): number {
    this.refill();
    return Math.floor(this.tokens);
  }

  /**
   * Get time until next token (in ms)
   */
  getTimeUntilNextToken(): number {
    if (this.tokens >= 1) {
      return 0;
    }

    return Math.ceil((1 - this.tokens) / this.refillRate * 1000);
  }

  /**
   * Reset bucket
   */
  reset(): void {
    this.tokens = this.capacity;
    this.lastRefill = Date.now();
  }
}

/**
 * In-memory rate limiter store
 */
class RateLimiterStore {
  private buckets: Map<string, TokenBucket> = new Map();

  /**
   * Get or create bucket for a key
   */
  getBucket(key: string, capacity: number, refillRate: number): TokenBucket {
    if (!this.buckets.has(key)) {
      this.buckets.set(key, new TokenBucket(capacity, refillRate));
    }

    return this.buckets.get(key)!;
  }

  /**
   * Remove bucket
   */
  removeBucket(key: string): void {
    this.buckets.delete(key);
  }

  /**
   * Clear all buckets
   */
  clear(): void {
    this.buckets.clear();
  }

  /**
   * Clean up old buckets (not accessed recently)
   */
  cleanup(maxAge: number = 3600000): void {
    const now = Date.now();
    const keysToRemove: string[] = [];

    this.buckets.forEach((bucket, key) => {
      if (now - bucket['lastRefill'] > maxAge) {
        keysToRemove.push(key);
      }
    });

    keysToRemove.forEach((key) => this.removeBucket(key));
  }
}

/**
 * Global rate limiter store
 */
const globalStore = new RateLimiterStore();

// Cleanup old buckets every hour
setInterval(() => globalStore.cleanup(), 3600000);

/**
 * Rate limiter class
 */
export class RateLimiter {
  private store: RateLimiterStore;
  private capacity: number;
  private refillRate: number;

  constructor(
    config: RateLimitConfig,
    store: RateLimiterStore = globalStore
  ) {
    this.store = store;
    this.capacity = config.maxRequests;
    // Convert windowMs to refill rate (tokens per second)
    this.refillRate = config.maxRequests / (config.windowMs / 1000);
  }

  /**
   * Check if request is allowed
   */
  async check(key: string): Promise<{
    allowed: boolean;
    remaining: number;
    reset: number;
  }> {
    const bucket = this.store.getBucket(key, this.capacity, this.refillRate);
    const allowed = bucket.consume(1);
    const remaining = bucket.getRemaining();
    const reset = Date.now() + bucket.getTimeUntilNextToken();

    return {
      allowed,
      remaining: Math.max(0, remaining),
      reset,
    };
  }

  /**
   * Reset limit for a key
   */
  async reset(key: string): Promise<void> {
    this.store.removeBucket(key);
  }
}

/**
 * Create rate limiter instance
 */
export function createRateLimiter(config: RateLimitConfig): RateLimiter {
  return new RateLimiter(config);
}

/**
 * Rate limiting middleware for Hono
 */
export function rateLimitMiddleware(config: RateLimitConfig): MiddlewareHandler {
  const limiter = createRateLimiter(config);
  const keyPrefix = config.keyPrefix || 'ratelimit';

  return async (c: Context, next) => {
    // Generate rate limit key
    const userId = c.get('userId');
    const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown';
    const key = userId ? `${keyPrefix}:user:${userId}` : `${keyPrefix}:ip:${ip}`;

    // Check rate limit
    const result = await limiter.check(key);

    // Set rate limit headers
    c.header('X-RateLimit-Limit', String(config.maxRequests));
    c.header('X-RateLimit-Remaining', String(result.remaining));
    c.header('X-RateLimit-Reset', String(Math.floor(result.reset / 1000)));

    if (!result.allowed) {
      const retryAfter = Math.ceil((result.reset - Date.now()) / 1000);
      c.header('Retry-After', String(retryAfter));

      throw new RateLimitError(
        'Too many requests, please try again later',
        retryAfter
      );
    }

    await next();
  };
}

/**
 * Per-user rate limiting middleware
 */
export function perUserRateLimit(config: Omit<RateLimitConfig, 'keyPrefix'>): MiddlewareHandler {
  return rateLimitMiddleware({
    ...config,
    keyPrefix: 'ratelimit:user',
  });
}

/**
 * Per-IP rate limiting middleware
 */
export function perIpRateLimit(config: Omit<RateLimitConfig, 'keyPrefix'>): MiddlewareHandler {
  return rateLimitMiddleware({
    ...config,
    keyPrefix: 'ratelimit:ip',
  });
}

/**
 * Per-service rate limiting middleware
 */
export function perServiceRateLimit(
  service: string,
  config: Omit<RateLimitConfig, 'keyPrefix'>
): MiddlewareHandler {
  return rateLimitMiddleware({
    ...config,
    keyPrefix: `ratelimit:service:${service}`,
  });
}

/**
 * Custom key generator for rate limiting
 */
export function customRateLimit(
  config: RateLimitConfig,
  keyGenerator: (c: Context) => string
): MiddlewareHandler {
  const limiter = createRateLimiter(config);

  return async (c: Context, next) => {
    const key = keyGenerator(c);

    // Check rate limit
    const result = await limiter.check(key);

    // Set rate limit headers
    c.header('X-RateLimit-Limit', String(config.maxRequests));
    c.header('X-RateLimit-Remaining', String(result.remaining));
    c.header('X-RateLimit-Reset', String(Math.floor(result.reset / 1000)));

    if (!result.allowed) {
      const retryAfter = Math.ceil((result.reset - Date.now()) / 1000);
      c.header('Retry-After', String(retryAfter));

      throw new RateLimitError(
        'Too many requests, please try again later',
        retryAfter
      );
    }

    await next();
  };
}

/**
 * Rate limit info helper
 */
export function getRateLimitInfo(c: Context): RateLimitInfo | null {
  const limit = c.res.headers.get('X-RateLimit-Limit');
  const remaining = c.res.headers.get('X-RateLimit-Remaining');
  const reset = c.res.headers.get('X-RateLimit-Reset');

  if (!limit || !remaining || !reset) {
    return null;
  }

  return {
    limit: parseInt(limit, 10),
    remaining: parseInt(remaining, 10),
    reset: parseInt(reset, 10),
  };
}

/**
 * Sliding window rate limiter (more accurate than token bucket)
 */
class SlidingWindowRateLimiter {
  private requests: Map<string, number[]> = new Map();

  constructor(
    private maxRequests: number,
    private windowMs: number
  ) {}

  /**
   * Clean old requests outside the window
   */
  private cleanOldRequests(key: string, now: number): void {
    const requests = this.requests.get(key) || [];
    const cutoff = now - this.windowMs;
    const validRequests = requests.filter((timestamp) => timestamp > cutoff);
    this.requests.set(key, validRequests);
  }

  /**
   * Check if request is allowed
   */
  check(key: string): { allowed: boolean; remaining: number; reset: number } {
    const now = Date.now();
    this.cleanOldRequests(key, now);

    const requests = this.requests.get(key) || [];
    const allowed = requests.length < this.maxRequests;

    if (allowed) {
      requests.push(now);
      this.requests.set(key, requests);
    }

    const oldest = requests[0] || now;
    const reset = oldest + this.windowMs;
    const remaining = Math.max(0, this.maxRequests - requests.length);

    return { allowed, remaining, reset };
  }

  /**
   * Reset limit for a key
   */
  reset(key: string): void {
    this.requests.delete(key);
  }

  /**
   * Clear all limits
   */
  clear(): void {
    this.requests.clear();
  }
}

/**
 * Create sliding window rate limiter middleware
 */
export function slidingWindowRateLimit(config: RateLimitConfig): MiddlewareHandler {
  const limiter = new SlidingWindowRateLimiter(config.maxRequests, config.windowMs);
  const keyPrefix = config.keyPrefix || 'ratelimit';

  return async (c: Context, next) => {
    const userId = c.get('userId');
    const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown';
    const key = userId ? `${keyPrefix}:user:${userId}` : `${keyPrefix}:ip:${ip}`;

    const result = limiter.check(key);

    c.header('X-RateLimit-Limit', String(config.maxRequests));
    c.header('X-RateLimit-Remaining', String(result.remaining));
    c.header('X-RateLimit-Reset', String(Math.floor(result.reset / 1000)));

    if (!result.allowed) {
      const retryAfter = Math.ceil((result.reset - Date.now()) / 1000);
      c.header('Retry-After', String(retryAfter));

      throw new RateLimitError(
        'Too many requests, please try again later',
        retryAfter
      );
    }

    await next();
  };
}
