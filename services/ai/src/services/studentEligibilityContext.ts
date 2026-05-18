import { prisma } from '@aah/database'

/**
 * Resolve BFF `X-User-Id` (Clerk id or Prisma id) to internal User.id for FK lookups.
 */
export async function resolveDbUserId(externalUserId: string): Promise<string | null> {
  const byPrimary = await prisma.user.findUnique({ where: { id: externalUserId } })
  if (byPrimary) return byPrimary.id

  const byClerk = await prisma.user.findUnique({ where: { clerkId: externalUserId } })
  return byClerk?.id ?? null
}

export type StudentEligibilityGate = {
  hasRecordedComplianceReview: boolean
  snapshotLines: string[]
}

/**
 * Loads whether a student has an audited compliance record and a short non-PII snapshot for prompts.
 */
export async function loadStudentEligibilityGate(dbUserId: string): Promise<StudentEligibilityGate> {
  const profile = await prisma.studentProfile.findUnique({
    where: { userId: dbUserId },
    include: {
      complianceRecords: {
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
    },
  })

  if (!profile) {
    return {
      hasRecordedComplianceReview: false,
      snapshotLines: ['Student athletic profile: not found or not linked for this user.'],
    }
  }

  let hasRecordedComplianceReview = false
  for (const rec of profile.complianceRecords) {
    if (!rec.reviewedAt || !rec.reviewedBy) continue
    const reviewer = await prisma.user.findUnique({
      where: { id: rec.reviewedBy },
      select: { role: true },
    })
    if (reviewer?.role === 'COMPLIANCE') {
      hasRecordedComplianceReview = true
      break
    }
  }

  const gaps: string[] = []
  if (profile.gpa == null) gaps.push('cumulative GPA not on file')
  if (!profile.creditHours && profile.creditHours !== 0) gaps.push('credit hours incomplete')

  const snapshotLines = [
    `Profile flags (non-final): eligibilityStatus=${profile.eligibilityStatus}, academicStanding=${profile.academicStanding ?? 'unknown'}, enrollment=${profile.enrollmentStatus}.`,
    gaps.length ? `Data gaps to highlight: ${gaps.join('; ')}.` : 'Core academic fields present; gaps may still exist elsewhere.',
    hasRecordedComplianceReview
      ? 'At least one compliance-reviewed eligibility record exists on file.'
      : 'No compliance-reviewed eligibility record found yet for recent terms.',
  ]

  return { hasRecordedComplianceReview, snapshotLines }
}
