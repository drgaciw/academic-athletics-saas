import { prisma } from '@aah/database'
import { getUser, UserRole } from '@aah/auth'
import type { Context } from 'hono'
import { AppError } from './errorHandler'

const STAFF_ROLES = new Set<UserRole>([
  UserRole.ADMIN,
  UserRole.COMPLIANCE,
  UserRole.COACH,
  UserRole.FACULTY,
  UserRole.MENTOR,
])

/**
 * Ensure the authenticated caller may access the given studentProfile id.
 * Staff roles may access any profile; students are limited to their own.
 */
export async function assertStudentProfileAccess(
  c: Context,
  studentProfileId: string
): Promise<void> {
  if (!studentProfileId) {
    throw new AppError(400, 'MISSING_STUDENT_ID', 'studentId is required')
  }

  const user = getUser(c)
  if (STAFF_ROLES.has(user.role)) {
    return
  }

  const dbUser = await prisma.user.findUnique({
    where: { clerkId: user.clerkId },
    select: {
      studentProfile: {
        select: { id: true },
      },
    },
  })

  const ownProfileId = dbUser?.studentProfile?.id
  if (!ownProfileId || ownProfileId !== studentProfileId) {
    throw new AppError(
      403,
      'FORBIDDEN',
      'You can only access your own student support records'
    )
  }
}
