/**
 * Continuing Eligibility Routes
 * Validate continuing eligibility for current student-athletes
 */

import { Hono } from 'hono'
import { getUser, checkPermission } from '@aah/auth'
import {
  successResponse,
  validateRequest,
  NotFoundError,
  ForbiddenError,
} from '@aah/api-utils'
import { prisma } from '@aah/database'
import { z } from 'zod'
import { validateContinuingEligibility } from '../services/rules-engine'

const routes = new Hono()

const continuingEligibilitySchema = z.object({
  studentId: z.string().min(1),
})

/**
 * POST /api/compliance/continuing
 * Validate continuing eligibility for current student-athlete
 */
routes.post(
  '/continuing',
  validateRequest(continuingEligibilitySchema, 'json'),
  async (c) => {
    const currentUser = getUser(c)
    const correlationId = c.get('correlationId')
    const { studentId } = c.get('validated_json')

    try {
      checkPermission(c, 'compliance:validate')
    } catch (error) {
      throw new ForbiddenError('You do not have permission to validate eligibility')
    }

    const student = await prisma.user.findFirst({
      where: {
        studentProfile: {
          studentId: studentId,
        },
      },
      include: {
        studentProfile: true,
      },
    })

    if (!student || !student.studentProfile) {
      throw new NotFoundError('Student not found', 'student')
    }

    const studentData = {
      studentId: student.studentProfile.studentId,
      firstName: student.firstName || '',
      lastName: student.lastName || '',
      enrollmentDate: student.createdAt.toISOString(),
      gpa: student.studentProfile.gpa || 0,
      cumulativeGpa: student.studentProfile.gpa || 0,
      creditHours: student.studentProfile.creditHours || 0,
      totalCreditHours: student.studentProfile.creditHours || 0,
      isFullTime: (student.studentProfile.creditHours || 0) >= 12,
      degreeRequiredCredits: 120,
      completedCredits: student.studentProfile.creditHours || 0,
    }

    const result = validateContinuingEligibility(studentData)

    return c.json(successResponse({
      studentId: student.studentProfile.studentId,
      studentName: `${student.firstName} ${student.lastName}`,
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
