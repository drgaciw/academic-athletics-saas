import { MiddlewareHandler } from 'hono'
import { generateRequestId } from '../utils'

/**
 * Correlation ID middleware for distributed tracing
 * 
 * Generates or extracts a correlation ID for each request and propagates it
 * through the request chain. This enables tracing requests across multiple
 * microservices.
 * 
 * The correlation ID is:
 * - Extracted from X-Correlation-ID header if present
 * - Generated if not present
 * - Added to response headers
 * - Attached to request context for logging
 * 
 * @param options - Middleware configuration
 * @returns Hono middleware handler
 * 
 * @example
 * ```typescript
 * import { Hono } from 'hono'
 * import { correlationMiddleware } from '@aah/auth'
 * 
 * const app = new Hono()
 * app.use('*', correlationMiddleware())
 * 
 * app.get('/api/test', (c) => {
 *   const correlationId = c.get('correlationId')
 *   console.log('Request ID:', correlationId)
 *   return c.json({ correlationId })
 * })
 * ```
 */
export interface CorrelationMiddlewareOptions {
  /**
   * Header name for correlation ID
   * @default 'X-Correlation-ID'
   */
  headerName?: string

  /**
   * Whether to include correlation ID in response headers
   * @default true
   */
  includeInResponse?: boolean

  /**
   * Custom ID generator function
   * @default generateRequestId from utils
   */
  generator?: () => string
}

export function correlationMiddleware(
  options: CorrelationMiddlewareOptions = {}
): MiddlewareHandler {
  const {
    headerName = 'X-Correlation-ID',
    includeInResponse = true,
    generator = generateRequestId,
  } = options

  return async (c, next) => {
    // Extract correlation ID from request header or generate new one
    let correlationId = c.req.header(headerName)

    if (!correlationId) {
      correlationId = generator()
    }

    // Attach to context for use in handlers and other middleware
    c.set('correlationId', correlationId)
    c.set('requestId', correlationId) // Alias for compatibility

    // Add to response headers if enabled
    if (includeInResponse) {
      c.header(headerName, correlationId)
    }

    await next()
  }
}

/**
 * Get correlation ID from context
 * 
 * @param c - Hono context
 * @returns Correlation ID string
 * 
 * @example
 * ```typescript
 * app.get('/api/test', (c) => {
 *   const correlationId = getCorrelationId(c)
 *   logger.info('Processing request', { correlationId })
 *   return c.json({ success: true })
 * })
 * ```
 */
export function getCorrelationId(c: any): string {
  return c.get('correlationId') || c.get('requestId') || 'unknown'
}

/**
 * Create a child correlation ID for sub-requests
 * Useful when making requests to other microservices
 * 
 * @param c - Hono context
 * @param suffix - Optional suffix to append
 * @returns Child correlation ID
 * 
 * @example
 * ```typescript
 * app.post('/api/process', async (c) => {
 *   const childId = createChildCorrelationId(c, 'compliance-check')
 *   
 *   // Make request to compliance service with child ID
 *   const response = await fetch('http://compliance-service/check', {
 *     headers: {
 *       'X-Correlation-ID': childId
 *     }
 *   })
 *   
 *   return c.json({ result: await response.json() })
 * })
 * ```
 */
export function createChildCorrelationId(c: any, suffix?: string): string {
  const parentId = getCorrelationId(c)
  const timestamp = Date.now().toString(36)
  return suffix ? `${parentId}.${suffix}.${timestamp}` : `${parentId}.${timestamp}`
}

/**
 * Extract service name from correlation ID
 * Useful for debugging and tracing
 * 
 * @param correlationId - Correlation ID string
 * @returns Array of service names in the chain
 * 
 * @example
 * ```typescript
 * const id = 'abc123.compliance-check.xyz789.monitoring.def456'
 * const services = extractServiceChain(id)
 * // Returns: ['compliance-check', 'monitoring']
 * ```
 */
export function extractServiceChain(correlationId: string): string[] {
  const parts = correlationId.split('.')
  // Filter out parts that look like timestamps or IDs (alphanumeric only)
  return parts.filter(part => part.includes('-') || part.length > 10)
}

/**
 * Middleware to log correlation ID with each request
 * Combines correlation middleware with logging
 * 
 * @param options - Middleware configuration
 * @returns Hono middleware handler
 * 
 * @example
 * ```typescript
 * app.use('*', correlationLoggingMiddleware({
 *   logLevel: 'info',
 *   includeHeaders: true
 * }))
 * ```
 */
export interface CorrelationLoggingOptions extends CorrelationMiddlewareOptions {
  /**
   * Log level for request logging
   * @default 'info'
   */
  logLevel?: 'debug' | 'info' | 'warn' | 'error'

  /**
   * Whether to include request headers in logs
   * @default false
   */
  includeHeaders?: boolean

  /**
   * Whether to include request body in logs (be careful with sensitive data)
   * @default false
   */
  includeBody?: boolean
}

export function correlationLoggingMiddleware(
  options: CorrelationLoggingOptions = {}
): MiddlewareHandler {
  const {
    logLevel = 'info',
    includeHeaders = false,
    includeBody = false,
    ...correlationOptions
  } = options

  return async (c, next) => {
    // Apply correlation middleware first
    await correlationMiddleware(correlationOptions)(c, async () => {
      const correlationId = getCorrelationId(c)
      const startTime = Date.now()

      // Log request
      const logData: any = {
        correlationId,
        method: c.req.method,
        path: c.req.path,
        timestamp: new Date().toISOString(),
      }

      if (includeHeaders) {
        logData.headers = Object.fromEntries(c.req.raw.headers.entries())
      }

      if (includeBody && c.req.method !== 'GET') {
        try {
          // Clone request to read body without consuming it
          const clonedReq = c.req.raw.clone()
          logData.body = await clonedReq.text()
        } catch (error) {
          logData.bodyError = 'Failed to read request body'
        }
      }

      console[logLevel]('Incoming request', logData)

      await next()

      // Log response
      const duration = Date.now() - startTime
      console[logLevel]('Request completed', {
        correlationId,
        method: c.req.method,
        path: c.req.path,
        status: c.res.status,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString(),
      })
    })
  }
}
