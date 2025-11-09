import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { createErrorDiagnosticsAgent } from '@aah/ai'

export const errorDiagnosticsRouter = new Hono()

/**
 * POST /api/ai/error-diagnostics/analyze - Analyze a specific error
 */
errorDiagnosticsRouter.post(
  '/analyze',
  zValidator(
    'json',
    z.object({
      errorMessage: z.string().describe('Error message or exception text'),
      stackTrace: z.string().optional().describe('Stack trace if available'),
      service: z.string().describe('Service where error occurred'),
      correlationId: z.string().optional().describe('Correlation ID for tracing'),
      metadata: z.record(z.any()).optional().describe('Additional error context'),
      userId: z.string().optional().describe('User ID if error is user-specific'),
    })
  ),
  async (c) => {
    try {
      const params = c.req.valid('json')
      const authUserId = c.req.header('X-User-Id') || 'system'

      const agent = createErrorDiagnosticsAgent()
      const result = await agent.analyzeError({
        error: params.errorMessage,
        context: {
          service: params.service,
          userId: params.userId || authUserId,
          correlationId: params.correlationId,
          stackTrace: params.stackTrace,
          metadata: params.metadata,
        },
      })

      return c.json({
        success: true,
        analysis: {
          errorId: `err-${Date.now()}`,
          service: params.service,
          response: result.content,
          toolsUsed: result.toolInvocations.map((t) => t.toolName),
          duration: result.duration,
          cost: result.cost,
        },
      })
    } catch (error) {
      console.error('Error analysis failed:', error)
      return c.json(
        {
          error: {
            code: 'ANALYSIS_ERROR',
            message: error instanceof Error ? error.message : 'Failed to analyze error',
          },
        },
        500
      )
    }
  }
)

/**
 * POST /api/ai/error-diagnostics/patterns - Detect error patterns
 */
errorDiagnosticsRouter.post(
  '/patterns',
  zValidator(
    'json',
    z.object({
      timeRange: z
        .object({
          start: z.string().describe('Start time (ISO 8601)'),
          end: z.string().describe('End time (ISO 8601)'),
        })
        .optional()
        .describe('Time range for analysis'),
      services: z.array(z.string()).optional().describe('Specific services to analyze'),
      errorTypes: z.array(z.string()).optional().describe('Specific error types to analyze'),
      minOccurrences: z.number().optional().describe('Minimum occurrences for pattern'),
    })
  ),
  async (c) => {
    try {
      const params = c.req.valid('json')

      const agent = createErrorDiagnosticsAgent()
      const result = await agent.detectPatterns({
        timeRange: params.timeRange
          ? {
              start: new Date(params.timeRange.start),
              end: new Date(params.timeRange.end),
            }
          : undefined,
        services: params.services,
        errorTypes: params.errorTypes,
        minOccurrences: params.minOccurrences,
      })

      return c.json({
        success: true,
        patterns: {
          response: result.content,
          toolsUsed: result.toolInvocations.map((t) => t.toolName),
          duration: result.duration,
          cost: result.cost,
        },
      })
    } catch (error) {
      console.error('Pattern detection failed:', error)
      return c.json(
        {
          error: {
            code: 'PATTERN_DETECTION_ERROR',
            message: error instanceof Error ? error.message : 'Failed to detect patterns',
          },
        },
        500
      )
    }
  }
)

/**
 * POST /api/ai/error-diagnostics/fix - Get fix recommendation
 */
errorDiagnosticsRouter.post(
  '/fix',
  zValidator(
    'json',
    z.object({
      errorCode: z.string().describe('Error code or type'),
      errorMessage: z.string().describe('Error message'),
      service: z.string().describe('Service where error occurred'),
      context: z.record(z.any()).optional().describe('Additional context'),
    })
  ),
  async (c) => {
    try {
      const params = c.req.valid('json')

      const agent = createErrorDiagnosticsAgent()
      const result = await agent.suggestFix({
        errorCode: params.errorCode,
        errorMessage: params.errorMessage,
        service: params.service,
        context: params.context,
      })

      return c.json({
        success: true,
        fix: {
          response: result.content,
          toolsUsed: result.toolInvocations.map((t) => t.toolName),
          duration: result.duration,
          cost: result.cost,
        },
      })
    } catch (error) {
      console.error('Fix suggestion failed:', error)
      return c.json(
        {
          error: {
            code: 'FIX_SUGGESTION_ERROR',
            message: error instanceof Error ? error.message : 'Failed to suggest fix',
          },
        },
        500
      )
    }
  }
)

/**
 * POST /api/ai/error-diagnostics/compliance-impact - Assess NCAA compliance impact
 */
errorDiagnosticsRouter.post(
  '/compliance-impact',
  zValidator(
    'json',
    z.object({
      errorMessage: z.string().describe('Error message'),
      service: z.string().describe('Service where error occurred'),
      affectedStudents: z.array(z.string()).optional().describe('Student IDs affected'),
    })
  ),
  async (c) => {
    try {
      const params = c.req.valid('json')

      const agent = createErrorDiagnosticsAgent()
      const result = await agent.assessComplianceImpact({
        error: params.errorMessage,
        service: params.service,
        affectedStudents: params.affectedStudents,
      })

      return c.json({
        success: true,
        impact: {
          response: result.content,
          toolsUsed: result.toolInvocations.map((t) => t.toolName),
          duration: result.duration,
          cost: result.cost,
        },
      })
    } catch (error) {
      console.error('Compliance impact assessment failed:', error)
      return c.json(
        {
          error: {
            code: 'COMPLIANCE_ASSESSMENT_ERROR',
            message:
              error instanceof Error ? error.message : 'Failed to assess compliance impact',
          },
        },
        500
      )
    }
  }
)

/**
 * POST /api/ai/error-diagnostics/report - Generate error report
 */
errorDiagnosticsRouter.post(
  '/report',
  zValidator(
    'json',
    z.object({
      timeRange: z.object({
        start: z.string().describe('Start time (ISO 8601)'),
        end: z.string().describe('End time (ISO 8601)'),
      }),
      services: z.array(z.string()).optional().describe('Services to include'),
      severity: z.enum(['critical', 'high', 'medium', 'low']).optional(),
      includeResolutions: z.boolean().optional().describe('Include resolution status'),
    })
  ),
  async (c) => {
    try {
      const params = c.req.valid('json')
      const authUserRole = c.req.header('X-User-Role')

      // Only admins can generate reports
      if (authUserRole !== 'ADMIN') {
        return c.json(
          {
            error: {
              code: 'FORBIDDEN',
              message: 'Admin access required',
            },
          },
          403
        )
      }

      const agent = createErrorDiagnosticsAgent()
      const result = await agent.generateErrorReport({
        timeRange: {
          start: new Date(params.timeRange.start),
          end: new Date(params.timeRange.end),
        },
        services: params.services,
        severity: params.severity,
        includeResolutions: params.includeResolutions,
      })

      return c.json({
        success: true,
        report: {
          response: result.content,
          toolsUsed: result.toolInvocations.map((t) => t.toolName),
          duration: result.duration,
          cost: result.cost,
        },
      })
    } catch (error) {
      console.error('Report generation failed:', error)
      return c.json(
        {
          error: {
            code: 'REPORT_GENERATION_ERROR',
            message: error instanceof Error ? error.message : 'Failed to generate report',
          },
        },
        500
      )
    }
  }
)

/**
 * POST /api/ai/error-diagnostics/ferpa-check - Validate FERPA compliance
 */
errorDiagnosticsRouter.post(
  '/ferpa-check',
  zValidator(
    'json',
    z.object({
      errorLogs: z.array(
        z.object({
          message: z.string(),
          metadata: z.record(z.any()).optional(),
        })
      ),
      service: z.string(),
    })
  ),
  async (c) => {
    try {
      const params = c.req.valid('json')

      const agent = createErrorDiagnosticsAgent()
      const result = await agent.validateFERPACompliance({
        errorLogs: params.errorLogs,
        service: params.service,
      })

      return c.json({
        success: true,
        validation: {
          response: result.content,
          toolsUsed: result.toolInvocations.map((t) => t.toolName),
          duration: result.duration,
          cost: result.cost,
        },
      })
    } catch (error) {
      console.error('FERPA validation failed:', error)
      return c.json(
        {
          error: {
            code: 'FERPA_VALIDATION_ERROR',
            message: error instanceof Error ? error.message : 'Failed to validate FERPA compliance',
          },
        },
        500
      )
    }
  }
)

/**
 * POST /api/ai/error-diagnostics/predict - Predict potential errors
 */
errorDiagnosticsRouter.post(
  '/predict',
  zValidator(
    'json',
    z.object({
      service: z.string(),
      changes: z.object({
        files: z.array(z.string()),
        description: z.string(),
      }),
      deploymentTarget: z.enum(['development', 'staging', 'production']),
    })
  ),
  async (c) => {
    try {
      const params = c.req.valid('json')

      const agent = createErrorDiagnosticsAgent()
      const result = await agent.predictErrors({
        service: params.service,
        changes: params.changes,
        deploymentTarget: params.deploymentTarget,
      })

      return c.json({
        success: true,
        prediction: {
          response: result.content,
          toolsUsed: result.toolInvocations.map((t) => t.toolName),
          duration: result.duration,
          cost: result.cost,
        },
      })
    } catch (error) {
      console.error('Error prediction failed:', error)
      return c.json(
        {
          error: {
            code: 'ERROR_PREDICTION_ERROR',
            message: error instanceof Error ? error.message : 'Failed to predict errors',
          },
        },
        500
      )
    }
  }
)
