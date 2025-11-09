// Performance metrics route
import { Hono } from 'hono'
import { z } from 'zod'
import {
  getPerformanceMetrics,
  getPerformanceHistory,
  recordPerformanceMetric,
} from '../services/performanceTracker'

const app = new Hono()

// GET /api/monitoring/performance/:studentId
app.get('/:studentId', async (c) => {
  try {
    const studentId = c.req.param('studentId')
    const { term, academicYear } = c.req.query()

    const metrics = await getPerformanceMetrics(studentId, term, academicYear)

    return c.json({
      success: true,
      data: metrics,
    })
  } catch (error: any) {
    console.error('Error fetching performance metrics:', error)
    return c.json(
      {
        error: {
          code: 'PERFORMANCE_FETCH_ERROR',
          message: error.message || 'Failed to fetch performance metrics',
          timestamp: new Date().toISOString(),
        },
      },
      500
    )
  }
})

// GET /api/monitoring/performance/:studentId/history
app.get('/:studentId/history', async (c) => {
  try {
    const studentId = c.req.param('studentId')
    const { metricType, limit } = c.req.query()

    const history = await getPerformanceHistory(
      studentId,
      metricType,
      limit ? parseInt(limit) : undefined
    )

    return c.json({
      success: true,
      data: history,
    })
  } catch (error: any) {
    console.error('Error fetching performance history:', error)
    return c.json(
      {
        error: {
          code: 'HISTORY_FETCH_ERROR',
          message: error.message || 'Failed to fetch performance history',
          timestamp: new Date().toISOString(),
        },
      },
      500
    )
  }
})

// POST /api/monitoring/performance/:studentId
app.post('/:studentId', async (c) => {
  try {
    const studentId = c.req.param('studentId')
    const body = await c.req.json()

    const schema = z.object({
      metricType: z.enum(['GPA', 'ATTENDANCE', 'CREDIT_HOURS', 'STUDY_HOURS']),
      value: z.number(),
      term: z.string(),
      academicYear: z.string(),
      benchmark: z.number().optional(),
      notes: z.string().optional(),
    })

    const validated = schema.parse(body)

    const metric = await recordPerformanceMetric(
      studentId,
      validated.metricType,
      validated.value,
      validated.term,
      validated.academicYear,
      validated.benchmark,
      validated.notes
    )

    return c.json({
      success: true,
      data: metric,
    })
  } catch (error: any) {
    console.error('Error recording performance metric:', error)

    if (error.name === 'ZodError') {
      return c.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: error.errors,
            timestamp: new Date().toISOString(),
          },
        },
        400
      )
    }

    return c.json(
      {
        error: {
          code: 'METRIC_RECORD_ERROR',
          message: error.message || 'Failed to record performance metric',
          timestamp: new Date().toISOString(),
        },
      },
      500
    )
  }
})

export default app
