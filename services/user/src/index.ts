/**
 * User Service - Athletic Academics Hub
 * 
 * Microservice responsible for user management, authentication, and authorization.
 * 
 * Features:
 * - User profile management
 * - Role-based access control (RBAC)
 * - Clerk webhook integration for user synchronization
 * - Health check endpoint
 * 
 * @packageDocumentation
 */

import { Hono } from 'hono'
import { cors } from 'hono/cors'
import {
  correlationMiddleware,
  rateLimitMiddleware,
  requireAuth,
} from '@aah/auth'
import {
  createLogger,
  requestLogger,
  errorLogger,
  successResponse,
} from '@aah/api-utils'
import { validateEnv, userServiceEnvSchema } from '@aah/config/env'

// Import routes
import profileRoutes from './routes/profile'
import rolesRoutes from './routes/roles'
import syncRoutes from './routes/sync'

// Validate environment variables
const env = validateEnv(userServiceEnvSchema)

// Create logger instance
const logger = createLogger('user-service', {
  minLevel: env.LOG_LEVEL,
  prettyPrint: env.NODE_ENV === 'development',
})

// Create Hono app
const app = new Hono()

// =============================================================================
// GLOBAL MIDDLEWARE
// =============================================================================

// Correlation ID for distributed tracing
app.use('*', correlationMiddleware({
  headerName: 'X-Correlation-ID',
  includeInResponse: true,
}))

// Request/response logging
app.use('*', requestLogger(logger))
app.use('*', errorLogger(logger))

// CORS configuration
app.use('*', cors({
  origin: env.ALLOWED_ORIGINS.split(',').map(o => o.trim()),
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowHeaders: [
    'Content-Type',
    'Authorization',
    'X-Correlation-ID',
    'X-Request-ID',
  ],
  credentials: env.CORS_CREDENTIALS,
  maxAge: 86400, // 24 hours
}))

// Rate limiting
app.use('*', rateLimitMiddleware({
  windowMs: env.RATE_LIMIT_WINDOW,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  maxAuthenticated: 200,
  maxAdmin: 1000,
}))

// =============================================================================
// PUBLIC ROUTES
// =============================================================================

/**
 * Health check endpoint
 * Returns service health status
 */
app.get('/health', (c) => {
  // @ts-expect-error - correlationId is set by middleware
  const correlationId = c.get('correlationId') as string | undefined
  
  return c.json(successResponse({
    status: 'healthy',
    service: 'user-service',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  }, correlationId))
})

/**
 * Service info endpoint
 * Returns service metadata
 */
app.get('/info', (c) => {
  // @ts-expect-error - correlationId is set by middleware
  const correlationId = c.get('correlationId') as string | undefined
  
  return c.json(successResponse({
    name: 'User Service',
    description: 'User management and authentication microservice',
    version: '2.0.0',
    endpoints: {
      health: '/health',
      profile: '/api/user/profile',
      roles: '/api/user/roles',
      sync: '/api/user/sync-clerk',
    },
  }, correlationId))
})

// =============================================================================
// PROTECTED ROUTES (require authentication)
// =============================================================================

// Apply authentication to all /api routes
app.use('/api/*', requireAuth())

// Mount route handlers
app.route('/api/user/profile', profileRoutes)
app.route('/api/user/roles', rolesRoutes)
app.route('/api/user', syncRoutes)

// =============================================================================
// ERROR HANDLING
// =============================================================================

/**
 * 404 Not Found handler
 */
app.notFound((c) => {
  // @ts-expect-error - correlationId is set by middleware
  const correlationId = c.get('correlationId') as string | undefined
  
  return c.json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'The requested resource was not found',
      path: c.req.path,
      method: c.req.method,
      timestamp: new Date().toISOString(),
      requestId: correlationId,
    },
  }, 404)
})

/**
 * Global error handler
 */
app.onError((err, c) => {
  // @ts-expect-error - correlationId is set by middleware
  const correlationId = c.get('correlationId') as string | undefined
  
  logger.error('Unhandled error', err, {
    correlationId,
    path: c.req.path,
    method: c.req.method,
  })
  
  return c.json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: env.NODE_ENV === 'production' 
        ? 'An unexpected error occurred' 
        : err.message,
      timestamp: new Date().toISOString(),
      requestId: correlationId,
    },
  }, 500)
})

// =============================================================================
// SERVER STARTUP
// =============================================================================

const port = env.PORT

logger.info('User Service starting', {
  port,
  environment: env.NODE_ENV,
  version: '2.0.0',
})

// Export for Vercel serverless or local development
export default {
  port,
  fetch: app.fetch,
}

// For local development with tsx
if (env.NODE_ENV === 'development') {
  console.log(`🚀 User Service running on http://localhost:${port}`)
  console.log(`📊 Health check: http://localhost:${port}/health`)
  console.log(`📖 Service info: http://localhost:${port}/info`)
}
