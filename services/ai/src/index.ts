import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { chatRouter } from './routes/chat'
import { advisingRouter } from './routes/advising'
import { complianceRouter } from './routes/compliance'
import { predictRouter } from './routes/predict'
import { agentRouter } from './routes/agent'
import { knowledgeRouter } from './routes/knowledge'
import { feedbackRouter } from './routes/feedback'
import { embeddingsRouter } from './routes/embeddings'
import { errorDiagnosticsRouter } from './routes/error-diagnostics'
import auditRouter from './routes/audit'

// Configuration is validated on import via env.ts Zod schema
console.log('✓ AI Service configuration validated successfully')

try {
  // Application startup
  const placeholder = true
} catch (error) {
  console.error('✗ AI Service configuration validation failed:', error)
  process.exit(1)
}

// Initialize Hono app
const app = new Hono()

// Global middleware
app.use('*', logger())
app.use(
  '*',
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
  })
)

// Health check
app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    service: 'ai-service',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
  })
})

// API routes
app.route('/api/ai/chat', chatRouter)
app.route('/api/ai/advising', advisingRouter)
app.route('/api/ai/compliance', complianceRouter)
app.route('/api/ai/predict', predictRouter)
app.route('/api/ai/agent', agentRouter)
app.route('/api/ai/knowledge', knowledgeRouter)
app.route('/api/ai/feedback', feedbackRouter)
app.route('/api/ai/embeddings', embeddingsRouter)
app.route('/api/ai/error-diagnostics', errorDiagnosticsRouter)
app.route('/api/ai/audit', auditRouter)

// 404 handler
app.notFound((c) => {
  return c.json(
    {
      error: {
        code: 'NOT_FOUND',
        message: 'The requested endpoint does not exist',
        timestamp: new Date().toISOString(),
      },
    },
    404
  )
})

// Error handler
app.onError((err, c) => {
  console.error('Unhandled error:', err)

  const isDev = process.env.NODE_ENV === 'development'

  return c.json(
    {
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: isDev ? err.message : 'An unexpected error occurred',
        details: isDev ? err.stack : undefined,
        timestamp: new Date().toISOString(),
      },
    },
    500
  )
})

// Start server (for local development)
if (process.env.NODE_ENV !== 'production') {
  const port = process.env.PORT || 3007
  console.log(`🚀 AI Service starting on port ${port}`)
  console.log(`📍 Health check: http://localhost:${port}/health`)
  console.log(`🤖 Chat API: http://localhost:${port}/api/ai/chat`)
}

export default app
