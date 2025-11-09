/**
 * Audit Log Routes
 * Get compliance audit trail for students
 */

import { Hono } from 'hono'
import { getUser, checkPermission } from '@aah/auth'
import {
  successResponse,
  paginatedResponse,
  parsePaginationParams,
  NotFoundError,
  ForbiddenError,
} from '@aah/api-utils'
import { prisma } from '@aah/database'

const routes = new Hono()

/**
 * GET /api/compliance/audit-log/:studentId
 * Get compliance audit trail for a student
 */
routes.get('/audit-log/:studentId', async (c) => {
  const studentId = c.req.param('studentId')
  const currentUser = getUser(c)
  const correlationId = c.get('correlationId')
  const { page, pageSize } = parsePaginationParams(c.req.query())

  try {
    checkPermission(c, 'compliance:read')
  } catch (error) {
    throw new ForbiddenError('You do not have permission to view audit logs')
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

  // Get total count
  const totalCount = await prisma.complianceRecord.count({
    where: {
      studentId: student.studentProfile.id,
    },
  })

  // Get paginated records
  const records = await prisma.complianceRecord.findMany({
    where: {
      studentId: student.studentProfile.id,
    },
    orderBy: {
      checkedAt: 'desc',
    },
    skip: (page - 1) * pageSize,
    take: pageSize,
  })

  const auditLog = records.map(record => ({
    id: record.id,
    checkedAt: record.checkedAt,
    isEligible: record.isEligible,
    termGpa: record.termGpa,
    cumulativeGpa: record.cumulativeGpa,
    creditHours: record.creditHours,
    progressPercent: record.progressPercent,
    violations: record.violations,
    ruleVersion: record.ruleVersion,
  }))

  return c.json(paginatedResponse(
    auditLog,
    totalCount,
    { page, pageSize },
    correlationId
  ))
})

export default routes
