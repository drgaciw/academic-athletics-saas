/**
 * Continuing Eligibility Validation
 * NCAA Division I rules for ongoing student-athlete eligibility
 */

import {
  StudentData,
  ValidationResult,
  Violation,
  Warning,
  EligibilityStatus,
  ViolationSeverity,
  RuleCategory,
} from '../types'

/**
 * Validate 24/18 credit hour rule
 * Must complete 24 semester hours per academic year
 * Must complete 18 hours in previous academic year to be eligible
 */
export function validate24_18Rule(student: StudentData): ValidationResult {
  const violations: Violation[] = []
  const warnings: Warning[] = []
  const recommendations: string[] = []

  const creditHoursPreviousTerm = student.creditHoursPreviousTerm || 0

  // 18 hour requirement for previous year
  if (student.academicYear > 1 && creditHoursPreviousTerm < 18) {
    violations.push({
      id: `v-18-hours-${Date.now()}`,
      ruleId: 'NCAA-DI-24-18-RULE',
      ruleName: '18 Credit Hours Previous Year Requirement',
      category: RuleCategory.CONTINUING_ELIGIBILITY,
      severity: ViolationSeverity.CRITICAL,
      message:
        'Must have completed 18 semester/quarter hours in previous academic year',
      details: `Student completed ${creditHoursPreviousTerm} hours in previous year, short by ${18 - creditHoursPreviousTerm} hours`,
      threshold: 18,
      actualValue: creditHoursPreviousTerm,
      timestamp: new Date(),
    })

    recommendations.push(
      'Student must complete additional coursework to meet 18-hour requirement'
    )
  }

  // Warning if approaching but not yet at threshold
  if (creditHoursPreviousTerm >= 15 && creditHoursPreviousTerm < 18) {
    warnings.push({
      id: `w-18-hours-${Date.now()}`,
      ruleId: 'NCAA-DI-24-18-RULE',
      message: 'Approaching 18 credit hour requirement',
      recommendation: `Complete ${18 - creditHoursPreviousTerm} more credit hours to meet annual requirement`,
      timestamp: new Date(),
    })
  }

  // 24 hour requirement for full year (tracked separately)
  const creditHoursThisTerm = student.creditHoursThisTerm || 0
  if (creditHoursThisTerm < 12) {
    warnings.push({
      id: `w-24-hours-pace-${Date.now()}`,
      ruleId: 'NCAA-DI-24-18-RULE',
      message: 'On pace to fall short of 24 credit hours for year',
      recommendation:
        'Enroll in at least 12 credit hours per term to meet 24-hour annual requirement',
      timestamp: new Date(),
    })
  }

  const isEligible = violations.length === 0

  return {
    isEligible,
    status: isEligible ? EligibilityStatus.ELIGIBLE : EligibilityStatus.INELIGIBLE,
    violations,
    warnings,
    recommendations,
  }
}

/**
 * Validate 40/60/80 progress-toward-degree rule
 * 40% of degree by end of second year
 * 60% of degree by end of third year
 * 80% of degree by end of fourth year
 */
export function validate40_60_80Rule(student: StudentData): ValidationResult {
  const violations: Violation[] = []
  const warnings: Warning[] = []
  const recommendations: string[] = []

  const progressPercent = student.progressTowardDegree
  const academicYear = student.academicYear

  let requiredProgress = 0
  let nextMilestone = 0

  if (academicYear >= 2) {
    requiredProgress = 40
    nextMilestone = 60
  }
  if (academicYear >= 3) {
    requiredProgress = 60
    nextMilestone = 80
  }
  if (academicYear >= 4) {
    requiredProgress = 80
    nextMilestone = 100
  }

  if (academicYear >= 2 && progressPercent < requiredProgress) {
    violations.push({
      id: `v-progress-${Date.now()}`,
      ruleId: 'NCAA-DI-40-60-80-RULE',
      ruleName: `${requiredProgress}% Progress Toward Degree Requirement`,
      category: RuleCategory.ACADEMIC_PROGRESS,
      severity: ViolationSeverity.CRITICAL,
      message: `Must complete ${requiredProgress}% of degree requirements by end of year ${academicYear}`,
      details: `Student at ${progressPercent.toFixed(1)}% progress, needs ${(requiredProgress - progressPercent).toFixed(1)}% more`,
      threshold: requiredProgress,
      actualValue: parseFloat(progressPercent.toFixed(1)),
      timestamp: new Date(),
    })

    const degreeHoursNeeded =
      (requiredProgress - progressPercent) *
      (student.degreeRequirementHours / 100)
    recommendations.push(
      `Complete approximately ${Math.ceil(degreeHoursNeeded)} more credit hours toward degree requirements`
    )
  }

  // Warning if approaching next milestone
  if (
    nextMilestone > 0 &&
    progressPercent < nextMilestone &&
    progressPercent >= requiredProgress &&
    progressPercent < nextMilestone - 10
  ) {
    warnings.push({
      id: `w-progress-${Date.now()}`,
      ruleId: 'NCAA-DI-40-60-80-RULE',
      message: `Approaching ${nextMilestone}% progress milestone`,
      recommendation: `Work toward ${nextMilestone}% degree completion for next academic year`,
      timestamp: new Date(),
    })
  }

  const isEligible = violations.length === 0

  return {
    isEligible,
    status: isEligible ? EligibilityStatus.ELIGIBLE : EligibilityStatus.INELIGIBLE,
    violations,
    warnings,
    recommendations,
  }
}

/**
 * Validate GPA requirements
 * Year 1: 1.8 minimum
 * Year 2: 1.8 minimum
 * Year 3: 1.9 minimum
 * Year 4+: 2.0 minimum
 */
export function validateGPAThresholds(student: StudentData): ValidationResult {
  const violations: Violation[] = []
  const warnings: Warning[] = []
  const recommendations: string[] = []

  const cumulativeGpa = student.cumulativeGpa
  const academicYear = student.academicYear

  let minimumGpa = 0

  if (academicYear === 1 || academicYear === 2) {
    minimumGpa = 1.8
  } else if (academicYear === 3) {
    minimumGpa = 1.9
  } else {
    minimumGpa = 2.0
  }

  if (cumulativeGpa < minimumGpa) {
    violations.push({
      id: `v-gpa-${Date.now()}`,
      ruleId: 'NCAA-DI-GPA-THRESHOLDS',
      ruleName: `Year ${academicYear} GPA Requirement`,
      category: RuleCategory.GPA_REQUIREMENT,
      severity: ViolationSeverity.CRITICAL,
      message: `Cumulative GPA must be at least ${minimumGpa.toFixed(1)} for year ${academicYear}`,
      details: `Student's GPA is ${cumulativeGpa.toFixed(3)}, needs to improve by ${(minimumGpa - cumulativeGpa).toFixed(3)}`,
      threshold: minimumGpa,
      actualValue: parseFloat(cumulativeGpa.toFixed(3)),
      timestamp: new Date(),
    })

    recommendations.push(
      'Meet with academic advisor to develop a plan to improve GPA',
      'Consider tutoring services and study hall attendance',
      'Focus on courses where improvement is most achievable'
    )
  }

  // Warning if GPA is close to threshold
  if (cumulativeGpa >= minimumGpa && cumulativeGpa < minimumGpa + 0.1) {
    warnings.push({
      id: `w-gpa-${Date.now()}`,
      ruleId: 'NCAA-DI-GPA-THRESHOLDS',
      message: 'GPA is close to minimum threshold',
      recommendation:
        'Focus on maintaining or improving grades to ensure continued eligibility',
      timestamp: new Date(),
    })
  }

  const isEligible = violations.length === 0

  return {
    isEligible,
    status: isEligible ? EligibilityStatus.ELIGIBLE : EligibilityStatus.INELIGIBLE,
    violations,
    warnings,
    recommendations,
  }
}

/**
 * Validate full-time enrollment
 * Must be enrolled in at least 12 credit hours per term
 */
export function validateFullTimeEnrollment(
  student: StudentData
): ValidationResult {
  const violations: Violation[] = []
  const warnings: Warning[] = []
  const recommendations: string[] = []

  const creditHoursThisTerm = student.creditHoursThisTerm || 0
  const minimumHours = 12

  if (creditHoursThisTerm < minimumHours) {
    violations.push({
      id: `v-enrollment-${Date.now()}`,
      ruleId: 'NCAA-DI-FULL-TIME',
      ruleName: 'Full-Time Enrollment Requirement',
      category: RuleCategory.CREDIT_HOUR_REQUIREMENT,
      severity: ViolationSeverity.CRITICAL,
      message: `Must be enrolled in at least ${minimumHours} credit hours`,
      details: `Student enrolled in ${creditHoursThisTerm} hours, needs ${minimumHours - creditHoursThisTerm} more`,
      threshold: minimumHours,
      actualValue: creditHoursThisTerm,
      timestamp: new Date(),
    })

    recommendations.push(
      `Add ${minimumHours - creditHoursThisTerm} credit hours to meet full-time enrollment requirement`
    )
  }

  const isEligible = violations.length === 0

  return {
    isEligible,
    status: isEligible ? EligibilityStatus.ELIGIBLE : EligibilityStatus.INELIGIBLE,
    violations,
    warnings,
    recommendations,
  }
}

/**
 * Validate 6-hour rule for term eligibility
 * Must pass at least 6 credit hours in previous term to compete
 */
export function validate6HourRule(student: StudentData): ValidationResult {
  const violations: Violation[] = []
  const warnings: Warning[] = []
  const recommendations: string[] = []

  const creditHoursPreviousTerm = student.creditHoursPreviousTerm || 0
  const minimumHours = 6

  if (creditHoursPreviousTerm < minimumHours) {
    violations.push({
      id: `v-6-hour-${Date.now()}`,
      ruleId: 'NCAA-DI-6-HOUR',
      ruleName: '6-Hour Rule for Term Eligibility',
      category: RuleCategory.CONTINUING_ELIGIBILITY,
      severity: ViolationSeverity.HIGH,
      message: `Must pass at least ${minimumHours} credit hours in previous term`,
      details: `Student passed ${creditHoursPreviousTerm} hours in previous term, short by ${minimumHours - creditHoursPreviousTerm} hours`,
      threshold: minimumHours,
      actualValue: creditHoursPreviousTerm,
      timestamp: new Date(),
    })
  }

  const isEligible = violations.length === 0

  return {
    isEligible,
    status: isEligible ? EligibilityStatus.ELIGIBLE : EligibilityStatus.INELIGIBLE,
    violations,
    warnings,
    recommendations,
  }
}

/**
 * Comprehensive continuing eligibility check
 * Combines all continuing eligibility rules
 */
export async function checkContinuingEligibility(
  student: StudentData
): Promise<ValidationResult> {
  const results = await Promise.all([
    validate24_18Rule(student),
    validate40_60_80Rule(student),
    validateGPAThresholds(student),
    validateFullTimeEnrollment(student),
    validate6HourRule(student),
  ])

  // Combine all results
  const allViolations = results.flatMap((r) => r.violations)
  const allWarnings = results.flatMap((r) => r.warnings)
  const allRecommendations = Array.from(
    new Set(results.flatMap((r) => r.recommendations))
  )

  const isEligible = results.every((r) => r.isEligible)

  let status: EligibilityStatus
  if (isEligible) {
    status = EligibilityStatus.ELIGIBLE
  } else if (allViolations.some((v) => v.severity === 'CRITICAL')) {
    status = EligibilityStatus.INELIGIBLE
  } else {
    status = EligibilityStatus.CONDITIONAL
  }

  // Calculate next review date (typically end of term)
  const nextReviewDate = new Date()
  nextReviewDate.setMonth(nextReviewDate.getMonth() + 3) // Quarterly review

  return {
    isEligible,
    status,
    violations: allViolations,
    warnings: allWarnings,
    recommendations: allRecommendations,
    nextReviewDate,
    metadata: {
      checkType: 'continuing_eligibility',
      academicYear: student.academicYear,
      cumulativeGpa: student.cumulativeGpa,
      progressTowardDegree: student.progressTowardDegree,
    },
  }
}
