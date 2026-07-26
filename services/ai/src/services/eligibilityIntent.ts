/**
 * Lightweight eligibility-topic detection for PRD v2.2 student-facing policy.
 * Prefer recall over precision: routing extra threads to the guarded path is acceptable.
 */

const ELIGIBILITY_TOPIC_PATTERN =
  /\b(eligib(?:le|ility)|ineligib|cleared to compete|ncaa|progress[- ]toward[- ]degree|ptd|transfer portal|full[- ]time|part[- ]time|academic (?:year|term) certif|redshirt|waiver|compliance (?:officer|review))\b/i

const COMPETITION_STATUS_PATTERN =
  /\b((?:can|may|could)\s+(?:i|we|he|she|they|the student-athlete)(?:\s+\w+){0,2}\s+(?:play|compete)|(?:am|is|are)\s+(?:i|we|he|she|they|the student-athlete)(?:\s+\w+){0,2}\s+(?:allowed|permitted|authorized|approved)\s+to\s+(?:play|compete)|(?:allowed|permitted|authorized|approved)\s+to\s+(?:play|compete)|(?:play|compete)\s+(?:this|next)\s+(?:season|term|semester|year))\b/i

export function isEligibilityIntent(message: string): boolean {
  const t = message.trim()
  if (t.length < 2) return false
  return ELIGIBILITY_TOPIC_PATTERN.test(t) || COMPETITION_STATUS_PATTERN.test(t)
}

/**
 * Roles that must receive PRD v2.2 student eligibility buffering/guards.
 * Clerk/Prisma may send STUDENT_ATHLETE; BFFs should normalize to STUDENT,
 * but the AI service must treat both as student-facing.
 */
export function isStudentFacingRole(role: string | undefined): boolean {
  return role === 'STUDENT' || role === 'STUDENT_ATHLETE'
}
