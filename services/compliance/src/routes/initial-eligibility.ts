/**
 * Initial Eligibility Routes
 * Validate initial eligibility for incoming freshmen
 */

import { Hono } from 'hono'
import { getUser, checkPermission } from '@aah/auth'
import {
  successResponse,
  validateRequest,
  ForbiddenError,
} from '@aah/api-utils'
import { z } from 'zod'
import { validateInitialEligibility } from '../services/rules-engine'

const routes = new Hono()

const initialEligibilitySchema = z.object({
  studentId: z.string().min(1),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  coreCourses: z.number().int().min(0),
  coreGpa: z.number().min(0).max(4.0),
})

/**
 * POST /api/compliance/initial-eligibility
 * Validate initial eligibility for incoming freshman
 */
routes.post(
  '/initial-eligibility',
  validateRequest(initialEligibilitySchema, 'json'),
  async (c) => {
    const currentUser = getUser(c)
    const correlationId = c.get('correlationId')
    const data = c.get('validated_json')

    try {
      checkPermission(c, 'compliance:validate')
    } catch (error) {
      throw new ForbiddenError('You do not have permission to validate eligibility')
    }

    const result = validateInitialEligibility({
      ...data,
      enrollmentDate: new Date().toISOString(),
      gpa: data.coreGpa,
      creditHours: 0,
      isFullTime: false,
    })

    return c.json(successResponse({
      studentId: data.studentId,
      studentName: `${data.firstName} ${data.lastName}`,
      eligibility: {
        isEligible: result.isEligible,
        checkedAt: result.checkedAt,
        ruleVersion: result.ruleVersion,
      },
      violations: result.violations,
      warnings: result.warnings,
      recommendations: result.recommendations,
    }, correlationId))
  }
)

export default routes
