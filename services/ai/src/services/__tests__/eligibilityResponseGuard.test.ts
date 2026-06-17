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

  it('STUDENT: rewrites every definitive eligibility phrase in a response', () => {
    const raw =
      "You're eligible for team travel. You are still eligible to compete this term. You’re academically eligible for postseason. You are not eligible after the schedule change."
    const { text, wasModified } = eligibilityResponseGuard(raw, {
      userRole: 'STUDENT',
      hasRecordedComplianceReview: false,
    })

    expect(wasModified).toBe(true)
    expect(text.toLowerCase()).not.toMatch(/\byou'?re eligible\b/)
    expect(text.toLowerCase()).not.toMatch(/\byou are eligible\b/)
    expect(text.toLowerCase()).not.toContain('you are still eligible')
    expect(text.toLowerCase()).not.toContain('you’re academically eligible')
    expect(text.toLowerCase()).not.toContain('you are not eligible')
    expect(text).toContain('preliminary decision support')
  })

  it('STUDENT: rewrites definitive play or competition status advice', () => {
    const raw =
      'Yes, you can compete this season, you can still play right away, you’re allowed to compete, you’re still allowed to compete, you are permitted to compete, and you are approved to play.'
    const { text, wasModified } = eligibilityResponseGuard(raw, {
      userRole: 'STUDENT',
      hasRecordedComplianceReview: false,
    })

    expect(wasModified).toBe(true)
    expect(text.toLowerCase()).not.toContain('you can compete')
    expect(text.toLowerCase()).not.toContain('you can play')
    expect(text.toLowerCase()).not.toContain('you can still play')
    expect(text.toLowerCase()).not.toContain('you’re allowed to compete')
    expect(text.toLowerCase()).not.toContain('you’re still allowed to compete')
    expect(text.toLowerCase()).not.toContain('you are permitted to compete')
    expect(text.toLowerCase()).not.toContain('you are approved to play')
    expect(text).toContain('preliminary decision support')
  })
})
