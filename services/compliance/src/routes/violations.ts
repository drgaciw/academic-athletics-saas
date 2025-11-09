/**
 * Violations Routes
 * Get eligibility violations for students
 */

import { Hono } from 'hono'
import { getUser, checkPermission } from '@aah/auth'
import {
  successResponse,
  NotFoundError,
  ForbiddenError,
} from '@aah/api-utils'
import { prisma } from '@aah/database'

const routes = new Hono()

/**
 * GET /api/compliance/violations/:studentId
 * Get eligibility violations for a student
 */
routes.get('/violations/:studentId', async (c) => {
  const studentId = c.req.param('studentId')
  const currentUser = getUser(c)
  const correlationId = c.get('correlationId')

  try {
    checkPermission(c, 'compliance:read')
  } catch (error) {
    throw new ForbiddenError('You do not have permission to view violations')
  }

  const student = await prisma.user.findFirst({
    where: {
      studentProfile: {
        studentId: studentId,
      },
    },
    include: {
      studentProfile: {
        include: {
          complianceRecords: {
            where: {
              isEligible: false,
            },
            orderBy: {
              checkedAt: 'desc',
            },
          },
        },
      },
    },
  })

  if (!student || !student.studentProfile) {
    throw new NotFoundError('Student not found', 'student')
  }

  const violations = student.studentProfile.complianceRecords
    .filter(record => record.violations)
    .map(record => ({
      recordId: record.id,
      checkedAt: record.checkedAt,
      violations: record.violations,
      ruleVersion: record.ruleVersion,
    }))

  return c.json(successResponse({
    studentId: student.studentProfile.studentId,
    studentName: `${student.firstName} ${student.lastName}`,
    totalViolations: violations.length,
    violations,
  }, correlationId))
})

export default routes
