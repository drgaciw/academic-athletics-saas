/**
 * Support Service - Athletic Academics Hub
 *
 * Tutoring, study hall, workshops, and mentoring for student-athletes.
 */

import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
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
import { validateEnv, supportServiceEnvSchema } from '@aah/config/env'
import tutoring from './routes/tutoring'
import studyHall from './routes/studyHall'
import workshop from './routes/workshop'
import mentoring from './routes/mentoring'

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

const env = validateEnv(supportServiceEnvSchema)

const logger = createLogger('support-service', {
  minLevel: env.LOG_LEVEL,
  prettyPrint: env.NODE_ENV === 'development',
})

const app = new Hono()

app.use('*', correlationMiddleware({
  headerName: 'X-Correlation-ID',
  includeInResponse: true,
}))

app.use('*', requestLogger(logger))
app.use('*', errorLogger(logger))

app.use('*', cors({
  origin: env.ALLOWED_ORIGINS.split(',').map((origin) => origin.trim()),
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

app.use('*', rateLimitMiddleware({
  windowMs: env.RATE_LIMIT_WINDOW,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  maxAuthenticated: 200,
  maxAdmin: 1000,
}))

app.get('/health', (c) => {
  const correlationId = getCorrelationId(c)

  return c.json(successResponse({
    status: 'healthy',
    service: 'support-service',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  }, correlationId))
})

app.get('/info', (c) => {
  const correlationId = getCorrelationId(c)

  return c.json(successResponse({
    name: 'Support Service',
    description: 'Tutoring, study hall, workshops, and mentoring for student-athletes',
    version: '2.0.0',
    features: ['tutoring', 'studyHall', 'workshops', 'mentoring', 'availabilityEngine'],
    endpoints: {
      health: '/health',
      tutoring: '/api/support/tutoring',
      studyHall: '/api/support/study-hall',
      workshop: '/api/support/workshop',
      mentoring: '/api/support/mentoring',
    },
  }, correlationId))
})

app.use('/api/*', requireAuth())

app.route('/api/support/tutoring', tutoring)
app.route('/api/support/study-hall', studyHall)
app.route('/api/support/workshop', workshop)
app.route('/api/support/mentoring', mentoring)

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

const port = parseInt(process.env.PORT || '3005', 10)

export default {
  port,
  fetch: app.fetch,
}
