/**
 * Compliance Service - Athletic Academics Hub
 * 
 * NCAA Division I Eligibility Validation Service
 * 
 * Features:
 * - Initial eligibility validation (16 core courses, 2.3 GPA, 10/7 rule)
 * - Continuing eligibility validation (credit hours, GPA, progress-toward-degree)
 * - Rule versioning and configuration
 * - Audit logging for NCAA compliance
 * - Alert generation for violations
 * 
 * @packageDocumentation
 */

import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
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
import { validateEnv, complianceServiceEnvSchema } from '@aah/config/env'

// Import routes
import checkEligibilityRoutes from './routes/check-eligibility'
import statusRoutes from './routes/status'
import initialEligibilityRoutes from './routes/initial-eligibility'
import continuingEligibilityRoutes from './routes/continuing'
import violationsRoutes from './routes/violations'
import auditLogRoutes from './routes/audit-log'
import regulationsRoutes from './routes/regulations'
import { runAllRegulationChecks } from './regulation/service'

const loadEnvFile = (filePath: string) => {
  if (!existsSync(filePath)) return

  const content = readFileSync(filePath, 'utf8')
  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue

    const separatorIndex = line.indexOf('=')
    if (separatorIndex === -1) continue

    const key = line.slice(0, separatorIndex).trim()
    const value = line.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, '')

    if (key && process.env[key] === undefined) {
      process.env[key] = value
    }
  }
}

loadEnvFile(resolve(process.cwd(), '.env'))
loadEnvFile(resolve(process.cwd(), '../../.env'))

// Validate environment variables
const env = validateEnv(complianceServiceEnvSchema)

// Create logger instance
const logger = createLogger('compliance-service', {
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
 * Returns service health status
 */
app.get('/health', (c) => {
  // @ts-expect-error - correlationId is set by middleware
  const correlationId = c.get('correlationId') as string | undefined
  
  return c.json(successResponse({
    status: 'healthy',
    service: 'compliance-service',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
    ncaaRuleVersion: env.NCAA_RULE_VERSION,
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
    name: 'Compliance Service',
    description: 'NCAA Division I eligibility validation and compliance tracking',
    version: '2.0.0',
    ncaaRuleVersion: env.NCAA_RULE_VERSION,
    features: [
      'Initial eligibility validation',
      'Continuing eligibility validation',
      'Rule versioning',
      'Audit logging',
      'Alert generation',
    ],
    endpoints: {
      health: '/health',
      checkEligibility: '/api/compliance/check-eligibility',
      status: '/api/compliance/status/:studentId',
      initialEligibility: '/api/compliance/initial-eligibility',
      continuingEligibility: '/api/compliance/continuing',
      violations: '/api/compliance/violations/:studentId',
      auditLog: '/api/compliance/audit-log/:studentId',
      regulations: '/api/compliance/regulations/changes',
      regulationCron: '/internal/cron/regulation-check',
    },
  }, correlationId))
})

/**
 * Scheduled regulation ingestion (secret header). Not under /api — bypasses user JWT.
 */
app.post('/internal/cron/regulation-check', async (c) => {
  const correlationId = c.get('correlationId') as string | undefined
  const secret = c.req.header('X-Regulation-Cron-Secret')

  if (env.NODE_ENV === 'production' && !env.REGULATION_CRON_SECRET) {
    logger.error('REGULATION_CRON_SECRET is required in production')
    return c.json(
      {
        success: false,
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'Regulation cron not configured',
        },
      },
      503
    )
  }

  const allowed =
    env.REGULATION_CRON_SECRET === undefined ||
    env.REGULATION_CRON_SECRET === '' ||
    secret === env.REGULATION_CRON_SECRET

  if (!allowed) {
    return c.json(
      {
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Invalid cron secret' },
      },
      401
    )
  }

  try {
    const result = await runAllRegulationChecks()
    return c.json(successResponse(result, correlationId))
  } catch (err) {
    logger.error('regulation cron failed', err as Error)
    return c.json(
      {
        success: false,
        error: {
          code: 'REGULATION_CRON_FAILED',
          message:
            env.NODE_ENV === 'production'
              ? 'Regulation check failed'
              : (err as Error).message,
        },
      },
      500
    )
  }
})

// =============================================================================
// PROTECTED ROUTES (require authentication)
// =============================================================================

// Apply authentication to all /api routes
app.use('/api/*', requireAuth())

// Mount route handlers
app.route('/api/compliance', checkEligibilityRoutes)
app.route('/api/compliance', statusRoutes)
app.route('/api/compliance', initialEligibilityRoutes)
app.route('/api/compliance', continuingEligibilityRoutes)
app.route('/api/compliance', violationsRoutes)
app.route('/api/compliance', auditLogRoutes)
app.route('/api/compliance', regulationsRoutes)

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

logger.info('Compliance Service starting', {
  port,
  environment: env.NODE_ENV,
  version: '2.0.0',
  ncaaRuleVersion: env.NCAA_RULE_VERSION,
})

// Export for Vercel serverless or local development
export default {
  port,
  fetch: app.fetch,
}

// For local development with tsx
if (env.NODE_ENV === 'development') {
  console.log(`🚀 Compliance Service running on http://localhost:${port}`)
  console.log(`📊 Health check: http://localhost:${port}/health`)
  console.log(`📖 Service info: http://localhost:${port}/info`)
  console.log(`📋 NCAA Rule Version: ${env.NCAA_RULE_VERSION}`)
}
