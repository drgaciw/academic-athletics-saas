// Alerts route
import { Hono } from 'hono'
import { z } from 'zod'
import {
  generateAlertsForStudent,
  createAlert,
  getActiveAlerts,
  acknowledgeAlert,
  resolveAlert,
  dismissAlert,
} from '../services/alertEngine'

const app = new Hono()

// GET /api/monitoring/alerts/:studentId
app.get('/:studentId', async (c) => {
  try {
    const studentId = c.req.param('studentId')

    const alerts = await getActiveAlerts(studentId)

    return c.json({
      success: true,
      data: alerts,
    })
  } catch (error: any) {
    console.error('Error fetching alerts:', error)
    return c.json(
      {
        error: {
          code: 'ALERTS_FETCH_ERROR',
          message: error.message || 'Failed to fetch alerts',
          timestamp: new Date().toISOString(),
        },
      },
      500
    )
  }
})

// POST /api/monitoring/alerts/generate/:studentId
app.post('/generate/:studentId', async (c) => {
  try {
    const studentId = c.req.param('studentId')

    const alerts = await generateAlertsForStudent(studentId)

    // Create all generated alerts
    const createdAlerts = await Promise.all(
      alerts.map((alert) => createAlert(alert))
    )

    return c.json({
      success: true,
      data: {
        count: createdAlerts.length,
        alerts: createdAlerts,
      },
    })
  } catch (error: any) {
    console.error('Error generating alerts:', error)
    return c.json(
      {
        error: {
          code: 'ALERTS_GENERATE_ERROR',
          message: error.message || 'Failed to generate alerts',
          timestamp: new Date().toISOString(),
        },
      },
      500
    )
  }
})

// POST /api/monitoring/alerts
app.post('/', async (c) => {
  try {
    const body = await c.req.json()

    const schema = z.object({
      studentId: z.string(),
      alertType: z.enum(['ACADEMIC', 'ELIGIBILITY', 'ATTENDANCE', 'BEHAVIORAL']),
      severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']),
      title: z.string(),
      message: z.string(),
      metadata: z.record(z.any()).optional(),
      triggeredBy: z.string().optional(),
      assignedTo: z.string().optional(),
    })

    const validated = schema.parse(body)

    const alert = await createAlert(validated)

    return c.json({
      success: true,
      data: alert,
    })
  } catch (error: any) {
    console.error('Error creating alert:', error)

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
          code: 'ALERT_CREATE_ERROR',
          message: error.message || 'Failed to create alert',
          timestamp: new Date().toISOString(),
        },
      },
      500
    )
  }
})

// PUT /api/monitoring/alerts/:alertId/acknowledge
app.put('/:alertId/acknowledge', async (c) => {
  try {
    const alertId = c.req.param('alertId')
    const body = await c.req.json()

    const schema = z.object({
      userId: z.string(),
    })

    const { userId } = schema.parse(body)

    const alert = await acknowledgeAlert(alertId, userId)

    return c.json({
      success: true,
      data: alert,
    })
  } catch (error: any) {
    console.error('Error acknowledging alert:', error)

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
          code: 'ALERT_ACKNOWLEDGE_ERROR',
          message: error.message || 'Failed to acknowledge alert',
          timestamp: new Date().toISOString(),
        },
      },
      500
    )
  }
})

// PUT /api/monitoring/alerts/:alertId/resolve
app.put('/:alertId/resolve', async (c) => {
  try {
    const alertId = c.req.param('alertId')
    const body = await c.req.json()

    const schema = z.object({
      userId: z.string(),
      resolution: z.string(),
    })

    const { userId, resolution } = schema.parse(body)

    const alert = await resolveAlert(alertId, resolution, userId)

    return c.json({
      success: true,
      data: alert,
    })
  } catch (error: any) {
    console.error('Error resolving alert:', error)

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
          code: 'ALERT_RESOLVE_ERROR',
          message: error.message || 'Failed to resolve alert',
          timestamp: new Date().toISOString(),
        },
      },
      500
    )
  }
})

// PUT /api/monitoring/alerts/:alertId/dismiss
app.put('/:alertId/dismiss', async (c) => {
  try {
    const alertId = c.req.param('alertId')

    const alert = await dismissAlert(alertId)

    return c.json({
      success: true,
      data: alert,
    })
  } catch (error: any) {
    console.error('Error dismissing alert:', error)
    return c.json(
      {
        error: {
          code: 'ALERT_DISMISS_ERROR',
          message: error.message || 'Failed to dismiss alert',
          timestamp: new Date().toISOString(),
        },
      },
      500
    )
  }
})

export default app
