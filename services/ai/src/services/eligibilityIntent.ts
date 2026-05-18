/**
 * Lightweight eligibility-topic detection for PRD v2.2 student-facing policy.
 * Prefer recall over precision: routing extra threads to the guarded path is acceptable.
 */

const ELIGIBILITY_PATTERN =
  /\b(eligib(?:le|ility)|ineligib|cleared to compete|ncaa|progress[- ]toward[- ]degree|ptd|transfer portal|full[- ]time|part[- ]time|academic (?:year|term) certif|redshirt|waiver|compliance (?:officer|review))\b/i

export function isEligibilityIntent(message: string): boolean {
  const t = message.trim()
  if (t.length < 2) return false
  return ELIGIBILITY_PATTERN.test(t)
}
