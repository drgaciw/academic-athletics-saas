/**
 * Clerk webhook helpers for StudentProfile sync.
 *
 * Athletic fields (studentId, sport, gpa, creditHours) are owned by admin/DB
 * after the profile exists. Clerk public_metadata must not clobber them on
 * routine user.updated events (name/email changes, etc.).
 */

import { prisma } from '@aah/database'

export type ClerkStudentMetadata = {
  studentId?: string
  sport?: string
  gpa?: number
  creditHours?: number
} | null | undefined

/**
 * Create a StudentProfile from Clerk metadata only when the user has none.
 * Existing profiles are left untouched.
 */
export async function ensureStudentProfileIfMissing(
  userId: string,
  role: string,
  publicMetadata: ClerkStudentMetadata
) {
  if (role !== 'STUDENT' || !publicMetadata?.studentId) {
    return null
  }

  const existingProfile = await prisma.studentProfile.findUnique({
    where: { userId },
  })

  if (existingProfile) {
    return existingProfile
  }

  return prisma.studentProfile.create({
    data: {
      userId,
      studentId: publicMetadata.studentId,
      sport: publicMetadata.sport || '',
      gpa: publicMetadata.gpa || null,
      creditHours: publicMetadata.creditHours || 0,
      eligibilityStatus: 'PENDING',
    },
  })
}
