import { MiddlewareHandler } from 'hono'
import { AuthError, AuthErrorCode, UserRole } from '../types'
import { getOptionalUser } from './auth'

/**
 * Rate limit store interface
 * Allows for different storage backends (memory, Redis, etc.)
 */
export interface RateLimitStore {
  /**
   * Increment the counter for a key
   * @returns Current count after increment
   */
  increment(key: string): Promise<number>

  /**
   * Get the current count for a key
   */
  get(key: string): Promise<number>

  /**
   * Reset the counter for a key
   */
  reset(key: string): Promise<void>

  /**
   * Get time until reset for a key (in milliseconds)
   */
  getTimeUntilReset(key: string): Promise<number>
}

/**
 * In-memory rate limit store
 * Simple implementation for development and single-instance deployments
 * For production with multiple instances, use Redis-based store
 */
export class MemoryRateLimitStore implements RateLimitStore {
  private store: Map<string, { count: number; resetAt: number }> = new Map()

  constructor(private windowMs: number) {}

  async increment(key: string): Promise<number> {
    const now = Date.now()
    const record = this.store.get(key)

    if (!record || now > record.resetAt) {
      // Create new record or reset expired one
      this.store.set(key, {
        count: 1,
        resetAt: now + this.windowMs,
      })
      return 1
    }

    // Increment existing record
    record.count++
    return record.count
  }

  async get(key: string): Promise<number> {
    const now = Date.now()
    const record = this.store.get(key)

    if (!record || now > record.resetAt) {
      return 0
    }

    return record.count
  }

  async reset(key: string): Promise<void> {
    this.store.delete(key)
  }

  async getTimeUntilReset(key: string): Promise<number> {
    const now = Date.now()
    const record = this.store.get(key)

    if (!record || now > record.resetAt) {
      return 0
    }

    return record.resetAt - now
  }

  /**
   * Clean up expired records (call periodically)
   */
  cleanup(): void {
    const now = Date.now()
    for (const [key, record] of this.store.entries()) {
      if (now > record.resetAt) {
        this.store.delete(key)
      }
    }
  }
}

/**
 * Rate limiting middleware options
 */
export interface RateLimitOptions {
  /**
   * Time window in milliseconds
   * @default 60000 (1 minute)
   */
  windowMs?: number

  /**
   * Maximum number of requests per window
   * @default 100
   */
  max?: number

  /**
   * Maximum requests for admin users
   * @default 1000
   */
  maxAdmin?: number

  /**
   * Maximum requests for authenticated users
   * @default 200
   */
  maxAuthenticated?: number

  /**
   * Custom rate limit store
   * @default MemoryRateLimitStore
   */
  store?: RateLimitStore

  /**
   * Custom key generator function
   * @default IP address or user ID
   */
  keyGenerator?: (c: any) => string

  /**
   * Custom handler for rate limit exceeded
   */
  onLimitExceeded?: (c: any, retryAfter: number) => Response | Promise<Response>

  /**
   * Skip rate limiting for certain requests
   */
  skip?: (c: any) => boolean | Promise<boolean>

  /**
   * Whether to include rate limit headers in response
   * @default true
   */
  includeHeaders?: boolean

  /**
   * Custom message when rate limit is exceeded
   */
  message?: string
}

/**
 * Default key generator - uses user ID if authenticated, otherwise IP address
 */
function defaultKeyGenerator(c: any): string {
  const user = getOptionalUser(c)
  if (user) {
    return `user:${user.userId}`
  }

  // Try to get IP from various headers
  const forwarded = c.req.header('x-forwarded-for')
  if (forwarded) {
    return `ip:${forwarded.split(',')[0].trim()}`
  }

  const realIp = c.req.header('x-real-ip')
  if (realIp) {
    return `ip:${realIp}`
  }

  // Fallback to a generic key (not ideal for production)
  return 'ip:unknown'
}

/**
 * Default handler for rate limit exceeded
 */
function defaultLimitExceededHandler(c: any, retryAfter: number): Response {
  const error = new AuthError(
    AuthErrorCode.INSUFFICIENT_PERMISSIONS,
    'Too many requests. Please try again later.',
    429
  )

  return c.json(
    {
      error: {
        code: error.code,
        message: error.message,
        retryAfter: Math.ceil(retryAfter / 1000), // Convert to seconds
      },
    },
    429,
    {
      'Retry-After': Math.ceil(retryAfter / 1000).toString(),
    }
  )
}

/**
 * Rate limiting middleware for Hono
 * 
 * Implements tiered rate limiting based on user role:
 * - Admin users: Higher limits
 * - Authenticated users: Medium limits
 * - Anonymous users: Lower limits
 * 
 * @param options - Rate limiting configuration
 * @returns Hono middleware handler
 * 
 * @example
 * ```typescript
 * import { Hono } from 'hono'
 * import { rateLimitMiddleware } from '@aah/auth'
 * 
 * const app = new Hono()
 * 
 * // Apply rate limiting to all routes
 * app.use('*', rateLimitMiddleware({
 *   windowMs: 60000, // 1 minute
 *   max: 100, // 100 requests per minute for anonymous
 *   maxAuthenticated: 200, // 200 for authenticated users
 *   maxAdmin: 1000 // 1000 for admins
 * }))
 * 
 * // Or apply to specific routes
 * app.use('/api/public/*', rateLimitMiddleware({ max: 50 }))
 * ```
 */
export function rateLimitMiddleware(
  options: RateLimitOptions = {}
): MiddlewareHandler {
  const {
    windowMs = 60000,
    max = 100,
    maxAdmin = 1000,
    maxAuthenticated = 200,
    store = new MemoryRateLimitStore(windowMs),
    keyGenerator = defaultKeyGenerator,
    onLimitExceeded = defaultLimitExceededHandler,
    skip,
    includeHeaders = true,
    message,
  } = options

  return async (c, next) => {
    // Check if request should skip rate limiting
    if (skip && (await skip(c))) {
      return next()
    }

    // Generate rate limit key
    const key = keyGenerator(c)

    // Determine max requests based on user role
    const user = getOptionalUser(c)
    let maxRequests = max

    if (user) {
      if (user.role === UserRole.ADMIN) {
        maxRequests = maxAdmin
      } else {
        maxRequests = maxAuthenticated
      }
    }

    // Increment counter
    const currentCount = await store.increment(key)

    // Get time until reset
    const timeUntilReset = await store.getTimeUntilReset(key)

    // Add rate limit headers if enabled
    if (includeHeaders) {
      c.header('X-RateLimit-Limit', maxRequests.toString())
      c.header('X-RateLimit-Remaining', Math.max(0, maxRequests - currentCount).toString())
      c.header('X-RateLimit-Reset', new Date(Date.now() + timeUntilReset).toISOString())
    }

    // Check if limit exceeded
    if (currentCount > maxRequests) {
      return onLimitExceeded(c, timeUntilReset)
    }

    await next()
  }
}

/**
 * Create a rate limiter with custom configuration
 * Useful for creating multiple rate limiters with different settings
 * 
 * @param options - Rate limiting configuration
 * @returns Configured rate limit middleware
 * 
 * @example
 * ```typescript
 * const strictLimiter = createRateLimiter({
 *   windowMs: 60000,
 *   max: 10
 * })
 * 
 * const lenientLimiter = createRateLimiter({
 *   windowMs: 60000,
 *   max: 1000
 * })
 * 
 * app.use('/api/auth/*', strictLimiter)
 * app.use('/api/public/*', lenientLimiter)
 * ```
 */
export function createRateLimiter(options: RateLimitOptions): MiddlewareHandler {
  return rateLimitMiddleware(options)
}

/**
 * Strict rate limiter for sensitive endpoints (e.g., authentication)
 * 
 * @example
 * ```typescript
 * app.use('/api/auth/*', strictRateLimiter())
 * ```
 */
export function strictRateLimiter(): MiddlewareHandler {
  return rateLimitMiddleware({
    windowMs: 60000, // 1 minute
    max: 10, // 10 requests per minute
    maxAuthenticated: 20,
    maxAdmin: 100,
  })
}

/**
 * Lenient rate limiter for public endpoints
 * 
 * @example
 * ```typescript
 * app.use('/api/public/*', lenientRateLimiter())
 * ```
 */
export function lenientRateLimiter(): MiddlewareHandler {
  return rateLimitMiddleware({
    windowMs: 60000, // 1 minute
    max: 500, // 500 requests per minute
    maxAuthenticated: 1000,
    maxAdmin: 5000,
  })
}

/**
 * AI-specific rate limiter with token-based limits
 * Higher limits for admins, moderate for users
 * 
 * @example
 * ```typescript
 * app.use('/api/ai/*', aiRateLimiter())
 * ```
 */
export function aiRateLimiter(): MiddlewareHandler {
  return rateLimitMiddleware({
    windowMs: 60000, // 1 minute
    max: 20, // 20 AI requests per minute for anonymous
    maxAuthenticated: 50, // 50 for authenticated users
    maxAdmin: 200, // 200 for admins
    message: 'AI request limit exceeded. Please try again later.',
  })
}

/**
 * Get current rate limit status for a key
 * Useful for displaying rate limit info to users
 * 
 * @param store - Rate limit store
 * @param key - Rate limit key
 * @param maxRequests - Maximum requests allowed
 * @returns Rate limit status
 * 
 * @example
 * ```typescript
 * app.get('/api/rate-limit-status', async (c) => {
 *   const key = defaultKeyGenerator(c)
 *   const status = await getRateLimitStatus(store, key, 100)
 *   return c.json(status)
 * })
 * ```
 */
export async function getRateLimitStatus(
  store: RateLimitStore,
  key: string,
  maxRequests: number
): Promise<{
  limit: number
  remaining: number
  reset: Date
  resetIn: number
}> {
  const currentCount = await store.get(key)
  const timeUntilReset = await store.getTimeUntilReset(key)

  return {
    limit: maxRequests,
    remaining: Math.max(0, maxRequests - currentCount),
    reset: new Date(Date.now() + timeUntilReset),
    resetIn: timeUntilReset,
  }
}
