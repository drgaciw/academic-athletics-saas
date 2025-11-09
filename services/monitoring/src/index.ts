// Monitoring Service - Main Application
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'

// Import routes
import performanceRoutes from './routes/performance'
import reportsRoutes from './routes/reports'
import alertsRoutes from './routes/alerts'
import interventionRoutes from './routes/intervention'
import analyticsRoutes from './routes/analytics'
import riskRoutes from './routes/risk'

const app = new Hono()

// Middleware
app.use('*', logger())
app.use(
  '*',
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
  })
)

// Health check endpoint
app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    service: 'monitoring',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
  })
})

// Mount routes
app.route('/api/monitoring/performance', performanceRoutes)
app.route('/api/monitoring/progress-report', reportsRoutes)
app.route('/api/monitoring/alerts', alertsRoutes)
app.route('/api/monitoring/intervention', interventionRoutes)
app.route('/api/monitoring/analytics', analyticsRoutes)
app.route('/api/monitoring/risk-assessment', riskRoutes)

// Root endpoint
app.get('/', (c) => {
  return c.json({
    service: 'Monitoring Service',
    version: '2.0.0',
    description:
      'Academic performance tracking, progress reports, and early intervention alerts',
    endpoints: {
      performance: '/api/monitoring/performance/:studentId',
      progressReports: '/api/monitoring/progress-report',
      alerts: '/api/monitoring/alerts/:studentId',
      intervention: '/api/monitoring/intervention',
      analytics: '/api/monitoring/analytics/team/:teamId',
      riskAssessment: '/api/monitoring/risk-assessment',
    },
    features: [
      'Performance metrics tracking (GPA, attendance, credit hours)',
      'Faculty progress report submission and management',
      'Threshold-based alert generation',
      'Intervention plan creation and tracking',
      'Team-wide analytics and trends',
      'AI-powered risk assessment',
      'Real-time WebSocket notifications via Pusher',
    ],
  })
})

// 404 handler
app.notFound((c) => {
  return c.json(
    {
      error: {
        code: 'NOT_FOUND',
        message: 'Endpoint not found',
        timestamp: new Date().toISOString(),
      },
    },
    404
  )
})

// Error handler
app.onError((err, c) => {
  console.error('Unhandled error:', err)

  return c.json(
    {
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: err.message || 'An unexpected error occurred',
        timestamp: new Date().toISOString(),
      },
    },
    500
  )
})

// Export for Vercel serverless
export default app

// For local development
if (process.env.NODE_ENV !== 'production') {
  const port = process.env.PORT || 3004
  console.log(`🚀 Monitoring Service running on http://localhost:${port}`)
  console.log(`📊 Health check: http://localhost:${port}/health`)
  console.log(`📈 Performance API: http://localhost:${port}/api/monitoring/performance`)
  console.log(`📝 Progress Reports API: http://localhost:${port}/api/monitoring/progress-report`)
  console.log(`🚨 Alerts API: http://localhost:${port}/api/monitoring/alerts`)
  console.log(`🎯 Intervention API: http://localhost:${port}/api/monitoring/intervention`)
  console.log(`📊 Analytics API: http://localhost:${port}/api/monitoring/analytics`)
  console.log(`⚠️ Risk Assessment API: http://localhost:${port}/api/monitoring/risk-assessment`)
}
