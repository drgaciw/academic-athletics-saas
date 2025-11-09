import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { predictiveAnalytics } from '../services/predictiveAnalytics'
import { RiskAssessmentSchema } from '../types'

export const predictRouter = new Hono()

/**
 * POST /api/ai/predict/risk - Predict student risk
 */
predictRouter.post('/risk', zValidator('json', RiskAssessmentSchema), async (c) => {
  try {
    const { studentId, includeRecommendations, timeframe } = c.req.valid('json')

    const prediction = await predictiveAnalytics.predictRisk(studentId, {
      includeRecommendations,
      timeframe,
    })

    return c.json(prediction)
  } catch (error) {
    console.error('Risk prediction error:', error)
    return c.json(
      {
        error: {
          code: 'PREDICTION_ERROR',
          message: error instanceof Error ? error.message : 'Failed to predict risk',
        },
      },
      500
    )
  }
})
