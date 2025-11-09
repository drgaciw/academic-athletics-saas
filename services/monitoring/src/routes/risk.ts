// Risk assessment route - integrates with AI Service
import { Hono } from 'hono'
import { z } from 'zod'
import { RiskAssessmentRequest, RiskAssessmentResponse } from '../types'

const app = new Hono()

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:3000/api/ai'

// POST /api/monitoring/risk-assessment
app.post('/', async (c) => {
  try {
    const body = await c.req.json()

    const schema = z.object({
      studentId: z.string(),
      includeRecommendations: z.boolean().optional().default(true),
    })

    const validated = schema.parse(body)

    // Call AI Service for risk prediction
    const response = await fetch(`${AI_SERVICE_URL}/predict/risk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        studentId: validated.studentId,
        includeRecommendations: validated.includeRecommendations,
      }),
    })

    if (!response.ok) {
      throw new Error(`AI Service returned status ${response.status}`)
    }

    const aiResult = await response.json()

    // Transform AI Service response to our format
    const riskAssessment: RiskAssessmentResponse = {
      studentId: validated.studentId,
      riskScore: aiResult.riskScore || 0,
      riskLevel: determineRiskLevel(aiResult.riskScore || 0),
      confidence: aiResult.confidence || 0,
      factors: aiResult.factors || [],
      recommendations: validated.includeRecommendations
        ? aiResult.recommendations
        : undefined,
      generatedAt: new Date().toISOString(),
    }

    return c.json({
      success: true,
      data: riskAssessment,
    })
  } catch (error: any) {
    console.error('Error performing risk assessment:', error)

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

    // Check if AI Service is unavailable
    if (error.message.includes('fetch')) {
      return c.json(
        {
          error: {
            code: 'AI_SERVICE_UNAVAILABLE',
            message:
              'AI Service is currently unavailable. Please try again later.',
            timestamp: new Date().toISOString(),
          },
        },
        503
      )
    }

    return c.json(
      {
        error: {
          code: 'RISK_ASSESSMENT_ERROR',
          message: error.message || 'Failed to perform risk assessment',
          timestamp: new Date().toISOString(),
        },
      },
      500
    )
  }
})

// POST /api/monitoring/risk-assessment/batch
app.post('/batch', async (c) => {
  try {
    const body = await c.req.json()

    const schema = z.object({
      studentIds: z.array(z.string()),
      includeRecommendations: z.boolean().optional().default(false),
    })

    const validated = schema.parse(body)

    // Perform risk assessments for all students in parallel
    const assessments = await Promise.all(
      validated.studentIds.map(async (studentId) => {
        try {
          const response = await fetch(`${AI_SERVICE_URL}/predict/risk`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              studentId,
              includeRecommendations: validated.includeRecommendations,
            }),
          })

          if (!response.ok) {
            return {
              studentId,
              error: `AI Service returned status ${response.status}`,
            }
          }

          const aiResult = await response.json()

          return {
            studentId,
            riskScore: aiResult.riskScore || 0,
            riskLevel: determineRiskLevel(aiResult.riskScore || 0),
            confidence: aiResult.confidence || 0,
            factors: aiResult.factors || [],
            recommendations: validated.includeRecommendations
              ? aiResult.recommendations
              : undefined,
            generatedAt: new Date().toISOString(),
          }
        } catch (error: any) {
          return {
            studentId,
            error: error.message,
          }
        }
      })
    )

    // Separate successful and failed assessments
    const successful = assessments.filter((a) => !('error' in a))
    const failed = assessments.filter((a) => 'error' in a)

    return c.json({
      success: true,
      data: {
        total: validated.studentIds.length,
        successful: successful.length,
        failed: failed.length,
        assessments: successful,
        errors: failed,
      },
    })
  } catch (error: any) {
    console.error('Error performing batch risk assessment:', error)

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
          code: 'BATCH_ASSESSMENT_ERROR',
          message: error.message || 'Failed to perform batch risk assessment',
          timestamp: new Date().toISOString(),
        },
      },
      500
    )
  }
})

// Helper function to determine risk level from score
function determineRiskLevel(
  score: number
): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  if (score >= 75) return 'CRITICAL'
  if (score >= 50) return 'HIGH'
  if (score >= 25) return 'MEDIUM'
  return 'LOW'
}

export default app
