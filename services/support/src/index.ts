import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { errorHandler, notFoundHandler } from './middleware/errorHandler'
import tutoring from './routes/tutoring'
import studyHall from './routes/studyHall'
import workshop from './routes/workshop'
import mentoring from './routes/mentoring'

const app = new Hono()

// Global middleware
app.use('*', logger())
app.use('*', errorHandler)

// CORS configuration
app.use('*', cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    process.env.FRONTEND_URL || 'https://aah.vercel.app',
  ],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'x-request-id'],
  credentials: true,
  maxAge: 86400,
}))

// Health check endpoint
app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    service: 'support-service',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
  })
})

// Service status endpoint with detailed information
app.get('/api/support/status', (c) => {
  return c.json({
    service: 'support-service',
    status: 'operational',
    version: '2.0.0',
    features: {
      tutoring: 'enabled',
      studyHall: 'enabled',
      workshops: 'enabled',
      mentoring: 'enabled',
      availabilityEngine: 'enabled',
    },
    endpoints: {
      tutoring: [
        'POST /api/support/tutoring/book',
        'GET /api/support/tutoring/availability',
        'GET /api/support/tutoring/sessions/:studentId',
        'DELETE /api/support/tutoring/:sessionId',
      ],
      studyHall: [
        'POST /api/support/study-hall/checkin',
        'POST /api/support/study-hall/checkout',
        'GET /api/support/study-hall/attendance/:studentId',
        'GET /api/support/study-hall/stats/:studentId',
      ],
      workshop: [
        'POST /api/support/workshop/register',
        'GET /api/support/workshop/available',
        'GET /api/support/workshop/registrations/:studentId',
        'DELETE /api/support/workshop/:registrationId',
      ],
      mentoring: [
        'GET /api/support/mentoring/matches/:studentId',
        'GET /api/support/mentoring/matches',
        'POST /api/support/mentoring/session',
        'GET /api/support/mentoring/sessions/:userId',
        'DELETE /api/support/mentoring/session/:sessionId',
      ],
    },
    timestamp: new Date().toISOString(),
  })
})

// API routes
app.route('/api/support/tutoring', tutoring)
app.route('/api/support/study-hall', studyHall)
app.route('/api/support/workshop', workshop)
app.route('/api/support/mentoring', mentoring)

// 404 handler
app.notFound(notFoundHandler)

// For local development
const port = parseInt(process.env.PORT || '3005')
console.log(`Support Service starting on port ${port}`)

export default {
  port,
  fetch: app.fetch,
}
