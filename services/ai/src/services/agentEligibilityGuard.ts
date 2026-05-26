import { eligibilityResponseGuard } from './eligibilityResponseGuard'
import { loadStudentEligibilityGate, resolveDbUserId } from './studentEligibilityContext'

export async function applyAgentEligibilityGuard(
  content: string,
  options: { userRole?: string; authUserId: string }
): Promise<string> {
  if (!isStudentRole(options.userRole)) {
    return content
  }

  const dbUserId = await resolveDbUserId(options.authUserId)
  const gate = dbUserId
    ? await loadStudentEligibilityGate(dbUserId)
    : { hasRecordedComplianceReview: false, snapshotLines: [] }

  const guarded = eligibilityResponseGuard(content, {
    userRole: 'STUDENT',
    hasRecordedComplianceReview: gate.hasRecordedComplianceReview,
  })

  return guarded.text
}

function isStudentRole(userRole?: string): boolean {
  const normalized = userRole?.toUpperCase()
  return normalized === 'STUDENT' || normalized === 'STUDENT_ATHLETE'
}
