/**
 * Initial Eligibility Validation
 * NCAA Division I rules for freshman eligibility
 */

import {
  StudentData,
  ValidationResult,
  Violation,
  Warning,
  EligibilityStatus,
  ViolationSeverity,
  RuleCategory,
  CoreCourse,
  CoreCourseCategory,
  NCAA_DI_SLIDING_SCALE,
} from '../types'

/**
 * Validate 16 core course requirement
 * Must complete 16 NCAA-approved core courses
 */
export function validate16CoreCourses(student: StudentData): ValidationResult {
  const violations: Violation[] = []
  const warnings: Warning[] = []
  const recommendations: string[] = []

  const coreCourses = student.coreCourses || []
  const totalCoreCourses = coreCourses.length

  if (totalCoreCourses < 16) {
    violations.push({
      id: `v-core-courses-${Date.now()}`,
      ruleId: 'NCAA-DI-16-CORE',
      ruleName: '16 Core Courses Requirement',
      category: RuleCategory.INITIAL_ELIGIBILITY,
      severity: ViolationSeverity.CRITICAL,
      message: 'Must complete 16 NCAA-approved core courses',
      details: `Student has completed ${totalCoreCourses} core courses, needs ${16 - totalCoreCourses} more`,
      threshold: 16,
      actualValue: totalCoreCourses,
      timestamp: new Date(),
    })
  }

  if (totalCoreCourses < 16 && totalCoreCourses >= 14) {
    warnings.push({
      id: `w-core-courses-${Date.now()}`,
      ruleId: 'NCAA-DI-16-CORE',
      message: 'Approaching core course requirement',
      recommendation: `Complete ${16 - totalCoreCourses} more core courses before high school graduation`,
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
 * Validate 10/7 rule
 * 10 core courses before senior year (7 in English, Math, or Science)
 */
export function validate10of7Rule(student: StudentData): ValidationResult {
  const violations: Violation[] = []
  const warnings: Warning[] = []
  const recommendations: string[] = []

  const coreCourses = student.coreCourses || []
  const coursesBeforeSeniorYear = coreCourses.filter(
    (c) => c.completedBeforeSeniorYear
  )

  const totalBeforeSenior = coursesBeforeSeniorYear.length

  // Count English, Math, Science courses before senior year
  const englishMathScience = coursesBeforeSeniorYear.filter(
    (c) =>
      c.category === CoreCourseCategory.ENGLISH ||
      c.category === CoreCourseCategory.MATH ||
      c.category === CoreCourseCategory.SCIENCE
  ).length

  // Must have 10 before senior year
  if (totalBeforeSenior < 10) {
    violations.push({
      id: `v-10-courses-${Date.now()}`,
      ruleId: 'NCAA-DI-10-7-RULE',
      ruleName: '10/7 Rule - 10 Courses Before Senior Year',
      category: RuleCategory.INITIAL_ELIGIBILITY,
      severity: ViolationSeverity.CRITICAL,
      message: 'Must complete 10 core courses before senior year',
      details: `Student completed ${totalBeforeSenior} core courses before senior year, needs ${10 - totalBeforeSenior} more`,
      threshold: 10,
      actualValue: totalBeforeSenior,
      timestamp: new Date(),
    })
  }

  // 7 of those 10 must be in English, Math, or Science
  if (englishMathScience < 7) {
    violations.push({
      id: `v-7-ems-${Date.now()}`,
      ruleId: 'NCAA-DI-10-7-RULE',
      ruleName: '10/7 Rule - 7 in English/Math/Science',
      category: RuleCategory.INITIAL_ELIGIBILITY,
      severity: ViolationSeverity.CRITICAL,
      message:
        '7 of the 10 core courses before senior year must be in English, Math, or Science',
      details: `Student completed ${englishMathScience} courses in English/Math/Science before senior year, needs ${7 - englishMathScience} more`,
      threshold: 7,
      actualValue: englishMathScience,
      timestamp: new Date(),
    })
  }

  if (totalBeforeSenior >= 8 && totalBeforeSenior < 10) {
    warnings.push({
      id: `w-10-courses-${Date.now()}`,
      ruleId: 'NCAA-DI-10-7-RULE',
      message: 'Approaching 10 core courses before senior year requirement',
      recommendation: `Complete ${10 - totalBeforeSenior} more core courses before senior year begins`,
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
 * Calculate core course GPA
 */
export function calculateCoreGPA(coreCourses: CoreCourse[]): number {
  if (coreCourses.length === 0) return 0

  const totalPoints = coreCourses.reduce(
    (sum, course) => sum + course.gradePoints * course.creditHours,
    0
  )
  const totalHours = coreCourses.reduce(
    (sum, course) => sum + course.creditHours,
    0
  )

  return totalHours > 0 ? totalPoints / totalHours : 0
}

/**
 * Validate core course GPA requirement
 * Minimum 2.3 GPA in 16 core courses
 */
export function validateCoreGPA(student: StudentData): ValidationResult {
  const violations: Violation[] = []
  const warnings: Warning[] = []
  const recommendations: string[] = []

  const coreCourses = student.coreCourses || []
  const coreGpa = calculateCoreGPA(coreCourses)

  const minimumGPA = 2.3

  if (coreGpa < minimumGPA) {
    violations.push({
      id: `v-core-gpa-${Date.now()}`,
      ruleId: 'NCAA-DI-CORE-GPA',
      ruleName: 'Core Course GPA Requirement',
      category: RuleCategory.INITIAL_ELIGIBILITY,
      severity: ViolationSeverity.CRITICAL,
      message: `Core course GPA must be at least ${minimumGPA}`,
      details: `Student's core GPA is ${coreGpa.toFixed(3)}, needs to improve by ${(minimumGPA - coreGpa).toFixed(3)}`,
      threshold: minimumGPA,
      actualValue: parseFloat(coreGpa.toFixed(3)),
      timestamp: new Date(),
    })
  }

  if (coreGpa >= minimumGPA && coreGpa < minimumGPA + 0.1) {
    warnings.push({
      id: `w-core-gpa-${Date.now()}`,
      ruleId: 'NCAA-DI-CORE-GPA',
      message: 'Core GPA is close to minimum threshold',
      recommendation:
        'Focus on maintaining or improving grades in core courses to ensure continued eligibility',
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
 * Find minimum test score requirements based on core GPA
 * using NCAA Division I sliding scale
 */
export function getMinimumTestScores(coreGpa: number): {
  minSat: number
  minAct: number
} {
  // If GPA is 3.550 or higher, no minimum test score
  if (coreGpa >= 3.55) {
    return { minSat: 400, minAct: 37 }
  }

  // If GPA is below 2.3, not eligible regardless of test scores
  if (coreGpa < 2.3) {
    return { minSat: Infinity, minAct: Infinity }
  }

  // Find the appropriate sliding scale entry
  // The scale is ordered from highest to lowest GPA
  for (let i = 0; i < NCAA_DI_SLIDING_SCALE.length; i++) {
    const entry = NCAA_DI_SLIDING_SCALE[i]
    if (coreGpa >= entry.coreGpa) {
      return { minSat: entry.minSatTotal, minAct: entry.minActComposite }
    }
  }

  // If not found, use the last entry (lowest GPA on scale)
  const lastEntry = NCAA_DI_SLIDING_SCALE[NCAA_DI_SLIDING_SCALE.length - 1]
  return { minSat: lastEntry.minSatTotal, minAct: lastEntry.minActComposite }
}

/**
 * Validate test score requirement using sliding scale
 */
export function validateTestScores(student: StudentData): ValidationResult {
  const violations: Violation[] = []
  const warnings: Warning[] = []
  const recommendations: string[] = []

  const coreCourses = student.coreCourses || []
  const coreGpa = calculateCoreGPA(coreCourses)

  // Get minimum test scores for this GPA
  const { minSat, minAct } = getMinimumTestScores(coreGpa)

  const testScores = student.testScores

  if (!testScores) {
    warnings.push({
      id: `w-no-test-scores-${Date.now()}`,
      ruleId: 'NCAA-DI-SLIDING-SCALE',
      message: 'No test scores on file',
      recommendation:
        'Submit SAT or ACT scores to complete initial eligibility requirements',
      timestamp: new Date(),
    })

    return {
      isEligible: false,
      status: EligibilityStatus.PENDING,
      violations,
      warnings,
      recommendations: [
        `With a core GPA of ${coreGpa.toFixed(3)}, minimum SAT is ${minSat} or ACT is ${minAct}`,
      ],
    }
  }

  const satTotal = testScores.satTotal || 0
  const actComposite = testScores.actComposite || 0

  // Student passes if either SAT or ACT meets requirement
  const satMeetsRequirement = satTotal >= minSat
  const actMeetsRequirement = actComposite >= minAct

  if (!satMeetsRequirement && !actMeetsRequirement) {
    violations.push({
      id: `v-test-scores-${Date.now()}`,
      ruleId: 'NCAA-DI-SLIDING-SCALE',
      ruleName: 'NCAA Sliding Scale Test Score Requirement',
      category: RuleCategory.INITIAL_ELIGIBILITY,
      severity: ViolationSeverity.CRITICAL,
      message: 'Test scores do not meet NCAA sliding scale requirements',
      details: `With a core GPA of ${coreGpa.toFixed(3)}, minimum SAT is ${minSat} (current: ${satTotal}) or ACT is ${minAct} (current: ${actComposite})`,
      threshold: minSat,
      actualValue: Math.max(satTotal, actComposite),
      timestamp: new Date(),
    })

    recommendations.push(
      `Retake SAT (need ${minSat - satTotal} more points) or ACT (need ${minAct - actComposite} more points)`
    )
  } else if (
    (satMeetsRequirement && satTotal < minSat + 50) ||
    (actMeetsRequirement && actComposite < minAct + 2)
  ) {
    warnings.push({
      id: `w-test-scores-${Date.now()}`,
      ruleId: 'NCAA-DI-SLIDING-SCALE',
      message: 'Test scores are close to minimum threshold',
      recommendation:
        'Consider retaking SAT/ACT to improve scores and provide more cushion',
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
 * Comprehensive initial eligibility check
 * Combines all initial eligibility rules
 */
export async function checkInitialEligibility(
  student: StudentData
): Promise<ValidationResult> {
  const results = await Promise.all([
    validate16CoreCourses(student),
    validate10of7Rule(student),
    validateCoreGPA(student),
    validateTestScores(student),
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

  return {
    isEligible,
    status,
    violations: allViolations,
    warnings: allWarnings,
    recommendations: allRecommendations,
    metadata: {
      checkType: 'initial_eligibility',
      coreGpa: student.coreCourses ? calculateCoreGPA(student.coreCourses) : 0,
      totalCoreCourses: student.coreCourses?.length || 0,
    },
  }
}
