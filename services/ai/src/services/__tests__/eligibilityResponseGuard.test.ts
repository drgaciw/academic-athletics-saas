import { eligibilityResponseGuard } from '../eligibilityResponseGuard'

describe('eligibilityResponseGuard', () => {
  it('does not modify non-student roles', () => {
    const raw = 'You are eligible to compete this term.'
    const { text, wasModified } = eligibilityResponseGuard(raw, {
      userRole: 'COACH',
      hasRecordedComplianceReview: false,
    })
    expect(wasModified).toBe(false)
    expect(text).toBe(raw)
  })

  it('STUDENT: strips definitive eligibility phrasing and adds disclaimer', () => {
    const raw = 'Great news — you are eligible for next semester!'
    const { text, wasModified } = eligibilityResponseGuard(raw, {
      userRole: 'STUDENT',
      hasRecordedComplianceReview: false,
    })
    expect(wasModified).toBe(true)
    expect(text.toLowerCase()).not.toMatch(/\byou are eligible\b/)
    expect(text).toContain('preliminary decision support')
  })

  it('STUDENT: handles cleared to compete', () => {
    const raw = 'You are cleared to compete.'
    const { text, wasModified } = eligibilityResponseGuard(raw, {
      userRole: 'STUDENT',
      hasRecordedComplianceReview: false,
    })
    expect(wasModified).toBe(true)
    expect(text.toLowerCase()).not.toContain('cleared to compete')
  })

  it('STUDENT: when compliance review exists, still avoids definitive phrasing', () => {
    const raw = "You're eligible based on your file."
    const { text, wasModified } = eligibilityResponseGuard(raw, {
      userRole: 'STUDENT',
      hasRecordedComplianceReview: true,
    })
    expect(wasModified).toBe(true)
    expect(text.toLowerCase()).not.toMatch(/\byou'?re eligible\b/)
    expect(text).toContain('compliance office')
  })

  it('STUDENT: replaces every repeated definitive eligibility phrase', () => {
    const raw = 'You are eligible for the regular season. You are eligible for postseason.'
    const { text, wasModified } = eligibilityResponseGuard(raw, {
      userRole: 'STUDENT',
      hasRecordedComplianceReview: false,
    })

    expect(wasModified).toBe(true)
    expect(text.toLowerCase()).not.toMatch(/\byou are eligible\b/)
    expect(text).toContain('preliminary decision support')
  })
})
