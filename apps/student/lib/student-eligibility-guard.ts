const BLOCKED_PHRASE_PATTERNS: RegExp[] = [
  /\byou are eligible\b/i,
  /\byou'?re eligible\b/i,
  /\byou are ineligible\b/i,
  /\byou'?re ineligible\b/i,
  /\b(?:you|the student)\s+(?:are|is|remain(?:s)?|will be|would be)\s+(?:academically\s+)?(?:eligible|ineligible)\b/i,
  /\b(?:eligibility\s*status|eligibilitystatus|eligibility_status|status)\s*[:=]\s*(?:eligible|ineligible)\b/i,
  /\b(?:eligible|ineligible)\s+to compete\b/i,
  /\bcleared to compete\b/i,
  /\byou are cleared\b/i,
  /\bcleared for competition\b/i,
]

const STANDARD_DISCLAIMER =
  '\n\n---\nThis is preliminary decision support only. Institutional compliance staff make official eligibility determinations. Contact your athletics compliance office for an authoritative answer.'

const REPLACEMENT =
  'Based on the information available here, I cannot provide a final competition eligibility determination. Your athletics compliance office must confirm official status.'

export function guardStudentEligibilityResponse(text: string): string {
  let out = text
  let wasModified = false

  for (const re of BLOCKED_PHRASE_PATTERNS) {
    if (re.test(out)) {
      out = out.replace(re, REPLACEMENT)
      wasModified = true
    }
  }

  if ((wasModified || shouldAppendDisclaimer(out)) && !out.includes('preliminary decision support')) {
    out = out.trimEnd() + STANDARD_DISCLAIMER
  }

  return out
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
