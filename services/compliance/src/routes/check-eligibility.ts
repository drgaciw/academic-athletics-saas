/**
 * Check Eligibility Routes
 * Main endpoint for comprehensive eligibility validation
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
import { checkEligibility, getEligibilitySummary } from '../services/rules-engine'

const routes = new Hono()

// =============================================================================
// SCHEMAS
// =============================================================================

const checkEligibilitySchema = z.object({
  studentId: z.string().min(1),
  isIncomingFreshman: z.boolean().optional().default(false),
})

type CheckEligibilityInput = z.infer<typeof checkEligibilitySchema>

// =============================================================================
// ROUTES
// =============================================================================

/**
 * POST /api/compliance/check-eligibility
 * Perform comprehensive eligibility check for a student
 * 
 * Authorization:
 * - Requires compliance:validate permission
 */
routes.post(
  '/check-eligibility',
  validateRequest(checkEligibilitySchema, 'json'),
  async (c) => {
    const currentUser = getUser(c)
    const correlationId = c.get('correlationId')
    const { studentId, isIncomingFreshman } = c.get('validated_json') as CheckEligibilityInput

    // Check permission
    try {
      checkPermission(c, 'compliance:validate')
    } catch (error) {
      throw new ForbiddenError('You do not have permission to validate eligibility')
    }

    // Fetch student data
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

    // Prepare student data for validation
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
      degreeRequiredCredits: 120, // Standard bachelor's degree
      completedCredits: student.studentProfile.creditHours || 0,
    }

    // Perform eligibility check
    const result = checkEligibility(studentData, isIncomingFreshman)

    // Save compliance record
    const complianceRecord = await prisma.complianceRecord.create({
      data: {
        studentId: student.studentProfile.id,
        termGpa: studentData.gpa,
        cumulativeGpa: studentData.cumulativeGpa,
        creditHours: studentData.creditHours,
        progressPercent: (studentData.completedCredits / studentData.degreeRequiredCredits) * 100,
        isEligible: result.isEligible,
        violations: result.violations.length > 0 ? result.violations : null,
        ruleVersion: result.ruleVersion,
      },
    })

    // Get summary
    const summary = getEligibilitySummary(result)

    return c.json(successResponse({
      studentId: student.studentProfile.studentId,
      studentName: `${student.firstName} ${student.lastName}`,
      eligibility: {
        isEligible: result.isEligible,
        summary,
        checkedAt: result.checkedAt,
        ruleVersion: result.ruleVersion,
      },
      violations: result.violations,
      warnings: result.warnings,
      recommendations: result.recommendations,
      complianceRecordId: complianceRecord.id,
    }, correlationId))
  }
)

export default routes
