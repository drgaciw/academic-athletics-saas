/**
 * Rules Management Route (Admin Only)
 * POST /api/compliance/update-rules
 */

import { Hono } from 'hono'
import { z } from 'zod'
import {
  updateRuleConfig,
  getAllRuleConfigs,
  getRuleConfigHistory,
  validateRuleParameters,
} from '../services/ruleConfig'

const app = new Hono()

const updateRulesSchema = z.object({
  ruleId: z.string(),
  parameters: z.record(z.any()),
  effectiveDate: z.string().datetime().optional(),
  reason: z.string().min(10),
})

/**
 * Update rule configuration
 */
app.post('/update', async (c) => {
  try {
    const body = await c.req.json()
    const { ruleId, parameters, effectiveDate, reason } =
      updateRulesSchema.parse(body)

    const userId = c.get('userId')
    const userRole = c.get('userRole')

    // Check if user is admin (this should be done by middleware)
    if (userRole !== 'ADMIN' && userRole !== 'COMPLIANCE_OFFICER') {
      return c.json({ error: 'Unauthorized - Admin access required' }, 403)
    }

    // Validate rule parameters
    const validation = validateRuleParameters(ruleId, parameters)
    if (!validation.valid) {
      return c.json(
        {
          error: 'Invalid rule parameters',
          validationErrors: validation.errors,
        },
        400
      )
    }

    // Update rule configuration
    const config = await updateRuleConfig(
      ruleId,
      parameters,
      userId || 'unknown',
      effectiveDate ? new Date(effectiveDate) : undefined
    )

    return c.json({
      success: true,
      message: 'Rule configuration updated successfully',
      config,
      reason,
    })
  } catch (error) {
    console.error('Error updating rule configuration:', error)
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Invalid request data', details: error.errors }, 400)
    }
    return c.json({ error: 'Internal server error' }, 500)
  }
})

/**
 * Get all active rule configurations
 */
app.get('/', async (c) => {
  try {
    const configs = await getAllRuleConfigs()

    return c.json({
      total: configs.length,
      configs,
    })
  } catch (error) {
    console.error('Error retrieving rule configurations:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

/**
 * Get configuration history for a specific rule
 */
app.get('/:ruleId/history', async (c) => {
  try {
    const ruleId = c.req.param('ruleId')
    const limit = parseInt(c.req.query('limit') || '10')

    const history = await getRuleConfigHistory(ruleId, limit)

    return c.json({
      ruleId,
      total: history.length,
      history,
    })
  } catch (error) {
    console.error('Error retrieving rule configuration history:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

/**
 * Get list of all NCAA rules
 */
app.get('/list', async (c) => {
  const rules = [
    {
      id: 'NCAA-DI-16-CORE',
      name: '16 Core Courses Requirement',
      category: 'INITIAL_ELIGIBILITY',
      description: 'Must complete 16 NCAA-approved core courses',
    },
    {
      id: 'NCAA-DI-10-7-RULE',
      name: '10/7 Rule',
      category: 'INITIAL_ELIGIBILITY',
      description:
        '10 core courses before senior year (7 in English/Math/Science)',
    },
    {
      id: 'NCAA-DI-CORE-GPA',
      name: 'Core Course GPA',
      category: 'INITIAL_ELIGIBILITY',
      description: 'Minimum 2.3 GPA in 16 core courses',
    },
    {
      id: 'NCAA-DI-SLIDING-SCALE',
      name: 'NCAA Sliding Scale',
      category: 'INITIAL_ELIGIBILITY',
      description: 'Test score requirements based on core GPA',
    },
    {
      id: 'NCAA-DI-24-18-RULE',
      name: '24/18 Credit Hour Rule',
      category: 'CONTINUING_ELIGIBILITY',
      description: '24 hours per year, 18 hours in previous year',
    },
    {
      id: 'NCAA-DI-40-60-80-RULE',
      name: '40/60/80 Progress Rule',
      category: 'CONTINUING_ELIGIBILITY',
      description: 'Progress toward degree requirements by year',
    },
    {
      id: 'NCAA-DI-GPA-THRESHOLDS',
      name: 'GPA Thresholds by Year',
      category: 'CONTINUING_ELIGIBILITY',
      description: 'Minimum GPA requirements for each academic year',
    },
    {
      id: 'NCAA-DI-FULL-TIME',
      name: 'Full-Time Enrollment',
      category: 'CONTINUING_ELIGIBILITY',
      description: 'Minimum 12 credit hours per term',
    },
    {
      id: 'NCAA-DI-6-HOUR',
      name: '6-Hour Rule',
      category: 'CONTINUING_ELIGIBILITY',
      description: 'Pass at least 6 hours in previous term',
    },
  ]

  return c.json({
    total: rules.length,
    rules,
  })
})

export default app
