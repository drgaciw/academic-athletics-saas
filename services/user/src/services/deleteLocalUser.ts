/**
 * Atomic local-user deletion for Clerk user.deleted webhooks.
 *
 * StudentProfile cascades from User (onDelete: Cascade). Deleting the profile
 * before the user is unsafe: if user.delete then fails on a non-cascading FK
 * (TutoringSession, MentorMatch, etc.), athletic/compliance data is already gone.
 */

import { prisma } from '@aah/database'

type DbClient = Pick<
  typeof prisma,
  | 'user'
  | 'tutoringSession'
  | 'mentorMatch'
  | 'emailLog'
  | 'alert'
  | 'progressReport'
>

async function clearNonCascadingUserRefs(tx: DbClient, userId: string): Promise<void> {
  // Optional User FKs — detach rather than delete audit/email history.
  await tx.emailLog.updateMany({
    where: { userId },
    data: { userId: null },
  })
  await tx.alert.updateMany({
    where: { createdBy: userId },
    data: { createdBy: null },
  })
  await tx.alert.updateMany({
    where: { assignedTo: userId },
    data: { assignedTo: null },
  })
  await tx.progressReport.updateMany({
    where: { reviewedBy: userId },
    data: { reviewedBy: null },
  })

  // Required User FKs without onDelete: Cascade — remove the dependent rows so
  // user.delete can succeed for the common student athlete path.
  await tx.tutoringSession.deleteMany({
    where: {
      OR: [{ studentId: userId }, { userId }],
    },
  })
  await tx.mentorMatch.deleteMany({
    where: {
      OR: [{ mentorId: userId }, { menteeId: userId }],
    },
  })
}

/**
 * Delete the local User (and cascaded StudentProfile) for a Clerk id.
 * Returns the deleted user row, or null if no local user existed.
 *
 * Remaining required FKs without cascade (e.g. ProgressReport.submittedBy,
 * InterventionPlan.assignedTo) still cause a transactional failure — fail closed
 * so athletic profile data is never partially wiped.
 */
export async function deleteLocalUserByClerkId(clerkId: string) {
  const user = await prisma.user.findUnique({
    where: { clerkId },
  })

  if (!user) {
    return null
  }

  await prisma.$transaction(async (tx) => {
    await clearNonCascadingUserRefs(tx, user.id)
    await tx.user.delete({
      where: { id: user.id },
    })
  })

  return user
}
