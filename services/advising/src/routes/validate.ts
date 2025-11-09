// ============================================================================
// VALIDATION ROUTES
// ============================================================================

import { Hono } from 'hono'
import { z } from 'zod'
import { ConflictDetectorService } from '../services/conflictDetector'
import type { ApiResponse, ScheduleValidationRequest, ScheduleValidationResponse } from '../types'
import { CREDIT_HOUR_LIMITS } from '../types'

const app = new Hono()
const conflictDetector = new ConflictDetectorService()

// Validation schema
const scheduleValidationRequestSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  sectionIds: z.array(z.string()).min(1, 'At least one section is required'),
  term: z.string().min(1, 'Term is required'),
  academicYear: z.string().min(1, 'Academic year is required'),
  checkPrerequisites: z.boolean().optional().default(true),
  checkConflicts: z.boolean().optional().default(true),
  checkCreditLimit: z.boolean().optional().default(true)
})

/**
 * POST /api/advising/validate-schedule
 * Validate a proposed course schedule
 */
app.post('/validate-schedule', async (c) => {
  try {
    const body = await c.req.json()
    const validatedData = scheduleValidationRequestSchema.parse(body)

    // TODO: Fetch sections from database
    const sections = []

    // TODO: Fetch athletic schedule if needed
    const athleticSchedule = undefined

    // TODO: Fetch prerequisite data if needed
    const prerequisiteData = validatedData.checkPrerequisites ? undefined : undefined

    // Calculate total credits
    const totalCredits = sections.reduce((sum: number, s: any) => sum + (s.course?.credits || 0), 0)

    // Initialize response
    const warnings: string[] = []
    const suggestions: string[] = []
    let isValid = true

    // Check conflicts if requested
    let conflicts: any[] = []
    if (validatedData.checkConflicts) {
      const conflictResult = await conflictDetector.detectConflicts(
        sections,
        validatedData.studentId,
        athleticSchedule,
        prerequisiteData
      )

      conflicts = conflictResult.conflicts
      warnings.push(...conflictResult.warnings)

      // Critical conflicts make schedule invalid
      if (conflicts.some(c => c.severity === 'CRITICAL')) {
        isValid = false
        suggestions.push('Resolve critical conflicts before enrolling')
      }
    }

    // Check credit limits if requested
    if (validatedData.checkCreditLimit) {
      if (totalCredits < CREDIT_HOUR_LIMITS.MIN_FULL_TIME) {
        isValid = false
        warnings.push(
          `Credit hours (${totalCredits}) below minimum for full-time status (${CREDIT_HOUR_LIMITS.MIN_FULL_TIME})`
        )
        suggestions.push('Add more courses to meet full-time enrollment requirements')
      } else if (totalCredits > CREDIT_HOUR_LIMITS.MAX_STANDARD) {
        warnings.push(
          `Credit hours (${totalCredits}) exceed standard maximum (${CREDIT_HOUR_LIMITS.MAX_STANDARD})`
        )

        if (totalCredits > CREDIT_HOUR_LIMITS.MAX_WITH_APPROVAL) {
          isValid = false
          suggestions.push('Reduce course load or seek approval for credit hour overload')
        } else {
          suggestions.push('Credit hour overload requires advisor approval')
        }
      }
    }

    // Add general suggestions
    if (isValid && conflicts.length === 0) {
      suggestions.push('Schedule looks good! Ready for enrollment.')
    } else if (isValid && conflicts.length > 0) {
      suggestions.push('Schedule has minor issues but is enrollable. Consider addressing warnings.')
    }

    const response: ApiResponse<ScheduleValidationResponse> = {
      success: true,
      data: {
        isValid,
        conflicts,
        warnings,
        totalCredits,
        creditLimitMin: CREDIT_HOUR_LIMITS.MIN_FULL_TIME,
        creditLimitMax: CREDIT_HOUR_LIMITS.MAX_STANDARD,
        suggestions
      },
      timestamp: new Date().toISOString()
    }

    return c.json(response)
  } catch (error) {
    console.error('Error validating schedule:', error)

    if (error instanceof z.ZodError) {
      return c.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: error.errors
        },
        timestamp: new Date().toISOString()
      }, 400)
    }

    return c.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to validate schedule'
      },
      timestamp: new Date().toISOString()
    }, 500)
  }
})

/**
 * POST /api/advising/validate-schedule/quick
 * Quick validation (conflicts only, no database queries)
 */
app.post('/validate-schedule/quick', async (c) => {
  try {
    const body = await c.req.json()
    const { sections } = body

    if (!sections || !Array.isArray(sections)) {
      return c.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'sections array is required'
        },
        timestamp: new Date().toISOString()
      }, 400)
    }

    const conflictResult = await conflictDetector.detectConflicts(
      sections,
      'quick-check'
    )

    const response: ApiResponse<typeof conflictResult> = {
      success: true,
      data: conflictResult,
      timestamp: new Date().toISOString()
    }

    return c.json(response)
  } catch (error) {
    console.error('Error in quick validation:', error)

    return c.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to perform quick validation'
      },
      timestamp: new Date().toISOString()
    }, 500)
  }
})

export default app
