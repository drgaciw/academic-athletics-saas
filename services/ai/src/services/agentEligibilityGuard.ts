import { eligibilityResponseGuard } from './eligibilityResponseGuard'
import { loadStudentEligibilityGate, resolveDbUserId } from './studentEligibilityContext'

export async function applyAgentEligibilityGuard(
  content: string,
  options: { userRole?: string; authUserId: string }
): Promise<string> {
  if (options.userRole !== 'STUDENT') {
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
