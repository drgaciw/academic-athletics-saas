/**
 * Status Routes
 * Get current eligibility status for students
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
 * GET /api/compliance/status/:studentId
 * Get current eligibility status for a student
 */
routes.get('/status/:studentId', async (c) => {
  const studentId = c.req.param('studentId')
  const currentUser = getUser(c)
  const correlationId = c.get('correlationId')

  // Check permission
  try {
    checkPermission(c, 'compliance:read')
  } catch (error) {
    throw new ForbiddenError('You do not have permission to view compliance status')
  }

  // Fetch student
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
            orderBy: {
              checkedAt: 'desc',
            },
            take: 1,
          },
        },
      },
    },
  })

  if (!student || !student.studentProfile) {
    throw new NotFoundError('Student not found', 'student')
  }

  const latestRecord = student.studentProfile.complianceRecords[0]

  return c.json(successResponse({
    studentId: student.studentProfile.studentId,
    studentName: `${student.firstName} ${student.lastName}`,
    sport: student.studentProfile.sport,
    eligibilityStatus: student.studentProfile.eligibilityStatus,
    currentGpa: student.studentProfile.gpa,
    creditHours: student.studentProfile.creditHours,
    latestCheck: latestRecord ? {
      checkedAt: latestRecord.checkedAt,
      isEligible: latestRecord.isEligible,
      ruleVersion: latestRecord.ruleVersion,
    } : null,
  }, correlationId))
})

export default routes
