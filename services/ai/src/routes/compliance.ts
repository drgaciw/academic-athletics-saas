import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { complianceAgent } from '../services/complianceAgent'
import { ComplianceQuerySchema } from '../types'

export const complianceRouter = new Hono()

/**
 * POST /api/ai/compliance/analyze - Analyze compliance query
 */
complianceRouter.post('/analyze', zValidator('json', ComplianceQuerySchema), async (c) => {
  try {
    const query = c.req.valid('json')
    const analysis = await complianceAgent.analyzeCompliance(query)

    return c.json(analysis)
  } catch (error) {
    console.error('Compliance analysis error:', error)
    return c.json(
      {
        error: {
          code: 'ANALYSIS_ERROR',
          message: error instanceof Error ? error.message : 'Failed to analyze compliance',
        },
      },
      500
    )
  }
})

/**
 * POST /api/ai/compliance/check-eligibility - Check student eligibility
 */
complianceRouter.post('/check-eligibility', async (c) => {
  try {
    const { studentId } = await c.req.json()

    if (!studentId) {
      return c.json({ error: { code: 'INVALID_INPUT', message: 'Student ID required' } }, 400)
    }

    const result = await complianceAgent.checkEligibility(studentId)

    return c.json(result)
  } catch (error) {
    console.error('Eligibility check error:', error)
    return c.json(
      {
        error: {
          code: 'ELIGIBILITY_ERROR',
          message: 'Failed to check eligibility',
        },
      },
      500
    )
  }
})
