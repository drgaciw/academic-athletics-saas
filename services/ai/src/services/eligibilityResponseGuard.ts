const BLOCKED_PHRASE_PATTERNS: RegExp[] = [
  /\byou are eligible\b/gi,
  /\byou'?re eligible\b/gi,
  /\byou are not eligible\b/gi,
  /\byou aren'?t eligible\b/gi,
  /\byou are ineligible\b/gi,
  /\byou'?re ineligible\b/gi,
  /\beligible to compete\b/gi,
  /\bineligible to compete\b/gi,
  /\bnot cleared to compete\b/gi,
  /\bcleared to compete\b/gi,
  /\byou are cleared\b/gi,
  /\byou are not cleared\b/gi,
  /\byou aren'?t cleared\b/gi,
  /\bnot cleared for competition\b/gi,
  /\bcleared for competition\b/gi,
  /\byou can compete\b/gi,
  /\byou can'?t compete\b/gi,
  /\byou cannot compete\b/gi,
]

const STANDARD_DISCLAIMER =
  '\n\n---\nThis is preliminary decision support only. Institutional compliance staff make official eligibility determinations. Contact your athletics compliance office for an authoritative answer.'

const REPLACEMENT_NO_REVIEW =
  'Based on the information available here, I cannot provide a final competition eligibility determination. Your athletics compliance office must confirm official status.'

const REPLACEMENT_WITH_REVIEW =
  'Official competition eligibility must still be confirmed by your athletics compliance office; recorded reviews in AAH do not replace that authority in this assistant.'

export type EligibilityGuardInput = {
  userRole: string
  /** True when a compliance reviewer has recorded a review on file (PRD v2.2). */
  hasRecordedComplianceReview: boolean
}

export function eligibilityResponseGuard(
  text: string,
  ctx: EligibilityGuardInput
): { text: string; wasModified: boolean; reason?: string } {
  if (ctx.userRole !== 'STUDENT') {
    return { text, wasModified: false }
  }

  const replacement = ctx.hasRecordedComplianceReview ? REPLACEMENT_WITH_REVIEW : REPLACEMENT_NO_REVIEW

  let out = text
  let wasModified = false
  for (const re of BLOCKED_PHRASE_PATTERNS) {
    const replaced = out.replace(re, replacement)
    if (replaced !== out) {
      out = replaced
      wasModified = true
    }
  }

  if (wasModified || shouldAppendDisclaimer(out)) {
    if (!out.includes('preliminary decision support')) {
      out = out.trimEnd() + STANDARD_DISCLAIMER
      wasModified = true
    }
  }

  return {
    text: out,
    wasModified,
    reason: wasModified ? 'student_eligibility_guard' : undefined,
  }
}

function shouldAppendDisclaimer(text: string): boolean {
  const lower = text.toLowerCase()
  return (
    lower.includes('eligib') ||
    lower.includes('ncaa') ||
    (lower.includes('compliance') && lower.includes('elig')) ||
    lower.includes('progress toward')
  )
}
