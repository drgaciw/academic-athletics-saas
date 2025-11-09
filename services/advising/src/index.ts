/**
 * Advising Service - Athletic Academics Hub
 * 
 * Course selection, scheduling, conflict detection, and degree progress tracking
 * 
 * Features:
 * - CSP-based course scheduling
 * - Athletic schedule conflict detection
 * - AI-powered course recommendations
 * - Degree progress tracking
 * - Prerequisite validation
 * 
 * @packageDocumentation
 */

import { Hono } from 'hono'
import { cors } from 'hono/cors'
import {
  correlationMiddleware,
  rateLimitMiddleware,
  requireAuth,
  getCorrelationId,
} from '@aah/auth'
import {
  createLogger,
  requestLogger,
  errorLogger,
  successResponse,
} from '@aah/api-utils'
import { validateEnv, advisingServiceEnvSchema } from '@aah/config/env'

// Import routes
import scheduleRoutes from './routes/schedule'
import conflictsRoutes from './routes/conflicts'
import recommendRoutes from './routes/recommend'
import degreeProgressRoutes from './routes/degree-progress'
import validateScheduleRoutes from './routes/validate-schedule'

// Validate environment variables
const env = validateEnv(advisingServiceEnvSchema)

// Create logger instance
const logger = createLogger('advising-service', {
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
  maxAge: 86400,
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
 */
app.get('/health', (c) => {
  const correlationId = getCorrelationId(c)
  
  return c.json(successResponse({
    status: 'healthy',
    service: 'advising-service',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  }, correlationId))
})

/**
 * Service info endpoint
 */
app.get('/info', (c) => {
  const correlationId = getCorrelationId(c)
  
  return c.json(successResponse({
    name: 'Advising Service',
    description: 'Course selection, scheduling, conflict detection, and degree progress tracking',
    version: '2.0.0',
    features: [
      'CSP-based course scheduling',
      'Athletic schedule conflict detection',
      'AI-powered course recommendations',
      'Degree progress tracking',
      'Prerequisite validation',
      'Credit hour limit enforcement',
    ],
    algorithms: [
      'Constraint Satisfaction Problem (CSP) solver',
      'Graph-based conflict detection',
      'Backtracking with forward checking',
      'Degree requirement validation',
    ],
    endpoints: {
      health: '/health',
      schedule: '/api/advising/schedule',
      conflicts: '/api/advising/conflicts/:studentId',
      recommend: '/api/advising/recommend',
      degreeProgress: '/api/advising/degree-progress/:id',
      validateSchedule: '/api/advising/validate-schedule',
    },
  }, correlationId))
})

// =============================================================================
// PROTECTED ROUTES (require authentication)
// =============================================================================

// Apply authentication to all /api routes
app.use('/api/*', requireAuth())

// Mount route handlers
app.route('/api/advising', scheduleRoutes)
app.route('/api/advising', conflictsRoutes)
app.route('/api/advising', recommendRoutes)
app.route('/api/advising', degreeProgressRoutes)
app.route('/api/advising', validateScheduleRoutes)

// =============================================================================
// ERROR HANDLING
// =============================================================================

/**
 * 404 Not Found handler
 */
app.notFound((c) => {
  const correlationId = getCorrelationId(c)
  
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
  const correlationId = getCorrelationId(c)
  
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

logger.info('Advising Service starting', {
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
  console.log(`🚀 Advising Service running on http://localhost:${port}`)
  console.log(`📊 Health check: http://localhost:${port}/health`)
  console.log(`📖 Service info: http://localhost:${port}/info`)
}
