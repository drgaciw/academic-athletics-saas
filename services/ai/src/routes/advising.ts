import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { advisingAgent } from '../services/advisingAgent'
import { AdvisingRequestSchema } from '../types'

export const advisingRouter = new Hono()

/**
 * POST /api/ai/advising/recommend - Get AI course recommendations
 */
advisingRouter.post('/recommend', zValidator('json', AdvisingRequestSchema), async (c) => {
  try {
    const { studentId, term, preferredCourses, constraints } = c.req.valid('json')

    const recommendation = await advisingAgent.recommendCourses(studentId, term, {
      preferredCourses,
      maxCredits: constraints?.maxCredits,
      constraints,
    })

    return c.json(recommendation)
  } catch (error) {
    console.error('Advising recommendation error:', error)
    return c.json(
      {
        error: {
          code: 'RECOMMENDATION_ERROR',
          message: error instanceof Error ? error.message : 'Failed to generate recommendations',
        },
      },
      500
    )
  }
})

/**
 * POST /api/ai/advising/conflicts - Check for schedule conflicts
 */
advisingRouter.post('/conflicts', async (c) => {
  try {
    const { studentId, proposedCourses } = await c.req.json()

    if (!studentId || !Array.isArray(proposedCourses)) {
      return c.json({ error: { code: 'INVALID_INPUT', message: 'Invalid request' } }, 400)
    }

    const conflicts = await advisingAgent.detectConflicts(studentId, proposedCourses)

    return c.json({ conflicts, count: conflicts.length })
  } catch (error) {
    console.error('Conflict detection error:', error)
    return c.json(
      {
        error: {
          code: 'CONFLICT_ERROR',
          message: 'Failed to detect conflicts',
        },
      },
      500
    )
  }
})
