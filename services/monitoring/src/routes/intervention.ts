// Intervention plans route
import { Hono } from 'hono'
import { z } from 'zod'
import {
  createInterventionPlan,
  activateInterventionPlan,
  getInterventionPlans,
  getInterventionPlan,
  updateInterventionPlan,
  completeInterventionPlan,
  cancelInterventionPlan,
  getInterventionsByAssignee,
  getInterventionStats,
  updateInterventionGoal,
} from '../services/interventionService'

const app = new Hono()

// POST /api/monitoring/intervention
app.post('/', async (c) => {
  try {
    const body = await c.req.json()

    const schema = z.object({
      studentId: z.string(),
      planType: z.enum(['ACADEMIC', 'BEHAVIORAL', 'ELIGIBILITY', 'COMPREHENSIVE']),
      title: z.string(),
      description: z.string(),
      goals: z.array(
        z.object({
          id: z.string(),
          description: z.string(),
          deadline: z.string(),
          status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED']),
        })
      ),
      strategies: z.array(
        z.object({
          id: z.string(),
          type: z.string(),
          description: z.string(),
          assignedTo: z.string(),
        })
      ),
      timeline: z.object({
        startDate: z.string(),
        checkpoints: z.array(
          z.object({
            date: z.string(),
            description: z.string(),
          })
        ),
        endDate: z.string(),
      }),
      assignedTo: z.string(),
    })

    const validated = schema.parse(body)

    const plan = await createInterventionPlan(validated)

    return c.json({
      success: true,
      data: plan,
    })
  } catch (error: any) {
    console.error('Error creating intervention plan:', error)

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
          code: 'INTERVENTION_CREATE_ERROR',
          message: error.message || 'Failed to create intervention plan',
          timestamp: new Date().toISOString(),
        },
      },
      500
    )
  }
})

// GET /api/monitoring/intervention/student/:studentId
app.get('/student/:studentId', async (c) => {
  try {
    const studentId = c.req.param('studentId')
    const { status } = c.req.query()

    const plans = await getInterventionPlans(studentId, status)

    return c.json({
      success: true,
      data: plans,
    })
  } catch (error: any) {
    console.error('Error fetching intervention plans:', error)
    return c.json(
      {
        error: {
          code: 'PLANS_FETCH_ERROR',
          message: error.message || 'Failed to fetch intervention plans',
          timestamp: new Date().toISOString(),
        },
      },
      500
    )
  }
})

// GET /api/monitoring/intervention/:planId
app.get('/:planId', async (c) => {
  try {
    const planId = c.req.param('planId')

    const plan = await getInterventionPlan(planId)

    if (!plan) {
      return c.json(
        {
          error: {
            code: 'PLAN_NOT_FOUND',
            message: 'Intervention plan not found',
            timestamp: new Date().toISOString(),
          },
        },
        404
      )
    }

    return c.json({
      success: true,
      data: plan,
    })
  } catch (error: any) {
    console.error('Error fetching intervention plan:', error)
    return c.json(
      {
        error: {
          code: 'PLAN_FETCH_ERROR',
          message: error.message || 'Failed to fetch intervention plan',
          timestamp: new Date().toISOString(),
        },
      },
      500
    )
  }
})

// PUT /api/monitoring/intervention/:planId/activate
app.put('/:planId/activate', async (c) => {
  try {
    const planId = c.req.param('planId')

    const plan = await activateInterventionPlan(planId)

    return c.json({
      success: true,
      data: plan,
    })
  } catch (error: any) {
    console.error('Error activating intervention plan:', error)
    return c.json(
      {
        error: {
          code: 'PLAN_ACTIVATE_ERROR',
          message: error.message || 'Failed to activate intervention plan',
          timestamp: new Date().toISOString(),
        },
      },
      500
    )
  }
})

// PUT /api/monitoring/intervention/:planId
app.put('/:planId', async (c) => {
  try {
    const planId = c.req.param('planId')
    const body = await c.req.json()

    const schema = z.object({
      goals: z.array(z.any()).optional(),
      strategies: z.array(z.any()).optional(),
      timeline: z.object(z.any()).optional(),
      status: z.string().optional(),
      outcomes: z.string().optional(),
      effectiveness: z.string().optional(),
    })

    const validated = schema.parse(body)

    const plan = await updateInterventionPlan(planId, validated)

    return c.json({
      success: true,
      data: plan,
    })
  } catch (error: any) {
    console.error('Error updating intervention plan:', error)

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
          code: 'PLAN_UPDATE_ERROR',
          message: error.message || 'Failed to update intervention plan',
          timestamp: new Date().toISOString(),
        },
      },
      500
    )
  }
})

// PUT /api/monitoring/intervention/:planId/complete
app.put('/:planId/complete', async (c) => {
  try {
    const planId = c.req.param('planId')
    const body = await c.req.json()

    const schema = z.object({
      outcomes: z.string(),
      effectiveness: z.enum([
        'VERY_EFFECTIVE',
        'EFFECTIVE',
        'SOMEWHAT_EFFECTIVE',
        'NOT_EFFECTIVE',
      ]),
    })

    const { outcomes, effectiveness } = schema.parse(body)

    const plan = await completeInterventionPlan(planId, outcomes, effectiveness)

    return c.json({
      success: true,
      data: plan,
    })
  } catch (error: any) {
    console.error('Error completing intervention plan:', error)

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
          code: 'PLAN_COMPLETE_ERROR',
          message: error.message || 'Failed to complete intervention plan',
          timestamp: new Date().toISOString(),
        },
      },
      500
    )
  }
})

// PUT /api/monitoring/intervention/:planId/cancel
app.put('/:planId/cancel', async (c) => {
  try {
    const planId = c.req.param('planId')
    const body = await c.req.json()

    const schema = z.object({
      reason: z.string(),
    })

    const { reason } = schema.parse(body)

    const plan = await cancelInterventionPlan(planId, reason)

    return c.json({
      success: true,
      data: plan,
    })
  } catch (error: any) {
    console.error('Error cancelling intervention plan:', error)

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
          code: 'PLAN_CANCEL_ERROR',
          message: error.message || 'Failed to cancel intervention plan',
          timestamp: new Date().toISOString(),
        },
      },
      500
    )
  }
})

// GET /api/monitoring/intervention/assignee/:assigneeId
app.get('/assignee/:assigneeId', async (c) => {
  try {
    const assigneeId = c.req.param('assigneeId')
    const { status } = c.req.query()

    const plans = await getInterventionsByAssignee(assigneeId, status)

    return c.json({
      success: true,
      data: plans,
    })
  } catch (error: any) {
    console.error('Error fetching assignee plans:', error)
    return c.json(
      {
        error: {
          code: 'PLANS_FETCH_ERROR',
          message: error.message || 'Failed to fetch assignee plans',
          timestamp: new Date().toISOString(),
        },
      },
      500
    )
  }
})

// GET /api/monitoring/intervention/stats
app.get('/stats', async (c) => {
  try {
    const { planType } = c.req.query()

    const stats = await getInterventionStats(planType)

    return c.json({
      success: true,
      data: stats,
    })
  } catch (error: any) {
    console.error('Error fetching intervention stats:', error)
    return c.json(
      {
        error: {
          code: 'STATS_FETCH_ERROR',
          message: error.message || 'Failed to fetch intervention stats',
          timestamp: new Date().toISOString(),
        },
      },
      500
    )
  }
})

// PUT /api/monitoring/intervention/:planId/goal/:goalId
app.put('/:planId/goal/:goalId', async (c) => {
  try {
    const { planId, goalId } = c.req.param()
    const body = await c.req.json()

    const schema = z.object({
      status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED']),
    })

    const { status } = schema.parse(body)

    const plan = await updateInterventionGoal(planId, goalId, status)

    return c.json({
      success: true,
      data: plan,
    })
  } catch (error: any) {
    console.error('Error updating intervention goal:', error)

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
          code: 'GOAL_UPDATE_ERROR',
          message: error.message || 'Failed to update intervention goal',
          timestamp: new Date().toISOString(),
        },
      },
      500
    )
  }
})

export default app
