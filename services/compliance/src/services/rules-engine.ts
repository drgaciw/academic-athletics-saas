/**
 * NCAA Division I Rules Engine
 * 
 * Implements NCAA Division I eligibility rules for:
 * - Initial eligibility (high school certification)
 * - Continuing eligibility (ongoing college standards)
 * 
 * Rule Version: 2024-2025
 */

import { differenceInYears, parseISO } from 'date-fns'

// =============================================================================
// TYPES
// =============================================================================

export interface StudentData {
  studentId: string
  firstName: string
  lastName: string
  dateOfBirth?: string
  enrollmentDate: string
  
  // Academic data
  gpa: number
  cumulativeGpa?: number
  creditHours: number
  totalCreditHours?: number
  coreCourses?: number
  coreGpa?: number
  
  // Progress data
  degreeRequiredCredits?: number
  completedCredits?: number
  
  // Status
  isFullTime: boolean
  academicYear?: number
  termNumber?: number
  
  // Transfer student
  isTransfer?: boolean
  transferCredits?: number
}

export interface ValidationResult {
  isEligible: boolean
  violations: Violation[]
  warnings: Warning[]
  recommendations: string[]
  ruleVersion: string
  checkedAt: string
}

export interface Violation {
  code: string
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM'
  rule: string
  message: string
  currentValue?: any
  requiredValue?: any
}

export interface Warning {
  code: string
  message: string
  recommendation?: string
}

// =============================================================================
// CONSTANTS
// =============================================================================

export const NCAA_RULE_VERSION = '2024-2025'

// Initial Eligibility Constants
export const INITIAL_ELIGIBILITY = {
  MIN_CORE_COURSES: 16,
  MIN_CORE_GPA: 2.3,
  MIN_CORE_COURSES_BY_JUNIOR_YEAR: 10,
  MIN_ENGLISH_MATH_SCIENCE_BY_JUNIOR_YEAR: 7,
} as const

// Continuing Eligibility Constants
export const CONTINUING_ELIGIBILITY = {
  MIN_CREDITS_PER_TERM: 6,
  MIN_CREDITS_FULL_TIME: 12,
  
  // GPA Requirements (percentage of institutional minimum)
  GPA_YEAR_1: 0.90, // 90% by end of year 1
  GPA_YEAR_2: 0.95, // 95% by end of year 2
  GPA_YEAR_3: 1.00, // 100% by end of year 3
  GPA_YEAR_4: 1.00, // 100% by end of year 4
  
  // Progress Toward Degree
  PTD_YEAR_2: 0.40, // 40% by end of year 2
  PTD_YEAR_3: 0.60, // 60% by end of year 3
  PTD_YEAR_4: 0.80, // 80% by end of year 4
  
  // Five-year eligibility window
  MAX_YEARS: 5,
} as const

// Institutional minimum GPA (typically 2.0, but configurable)
export const INSTITUTIONAL_MIN_GPA = 2.0

// =============================================================================
// INITIAL ELIGIBILITY VALIDATION
// =============================================================================

/**
 * Validate initial eligibility for incoming freshmen
 * 
 * Requirements:
 * - 16 core courses completed
 * - Minimum 2.3 core GPA
 * - 10 core courses (7 in English/Math/Science) by end of junior year
 * - No standardized test scores required (as of 2025)
 */
export function validateInitialEligibility(student: StudentData): ValidationResult {
  const violations: Violation[] = []
  const warnings: Warning[] = []
  const recommendations: string[] = []
  
  // Check core courses
  if (!student.coreCourses || student.coreCourses < INITIAL_ELIGIBILITY.MIN_CORE_COURSES) {
    violations.push({
      code: 'INITIAL_CORE_COURSES',
      severity: 'CRITICAL',
      rule: 'NCAA Division I Initial Eligibility - Core Courses',
      message: `Student must complete ${INITIAL_ELIGIBILITY.MIN_CORE_COURSES} NCAA-approved core courses`,
      currentValue: student.coreCourses || 0,
      requiredValue: INITIAL_ELIGIBILITY.MIN_CORE_COURSES,
    })
    recommendations.push('Review high school transcript for NCAA-approved core courses')
  }
  
  // Check core GPA
  if (!student.coreGpa || student.coreGpa < INITIAL_ELIGIBILITY.MIN_CORE_GPA) {
    violations.push({
      code: 'INITIAL_CORE_GPA',
      severity: 'CRITICAL',
      rule: 'NCAA Division I Initial Eligibility - Core GPA',
      message: `Student must have minimum ${INITIAL_ELIGIBILITY.MIN_CORE_GPA} core GPA`,
      currentValue: student.coreGpa || 0,
      requiredValue: INITIAL_ELIGIBILITY.MIN_CORE_GPA,
    })
    recommendations.push('Student may need to retake courses to improve core GPA')
  }
  
  // Warning if close to minimum
  if (student.coreGpa && student.coreGpa < 2.5 && student.coreGpa >= INITIAL_ELIGIBILITY.MIN_CORE_GPA) {
    warnings.push({
      code: 'LOW_CORE_GPA',
      message: 'Core GPA is close to minimum requirement',
      recommendation: 'Consider academic support programs to maintain eligibility',
    })
  }
  
  const isEligible = violations.length === 0
  
  return {
    isEligible,
    violations,
    warnings,
    recommendations,
    ruleVersion: NCAA_RULE_VERSION,
    checkedAt: new Date().toISOString(),
  }
}

// =============================================================================
// CONTINUING ELIGIBILITY VALIDATION
// =============================================================================

/**
 * Validate continuing eligibility for current student-athletes
 * 
 * Requirements:
 * - Minimum 6 credit hours per term for next-term eligibility
 * - Full-time enrollment (12+ credits) for practice/competition
 * - Progressive GPA requirements
 * - Progress toward degree requirements
 * - Five-year eligibility window
 */
export function validateContinuingEligibility(student: StudentData): ValidationResult {
  const violations: Violation[] = []
  const warnings: Warning[] = []
  const recommendations: string[] = []
  
  // Determine academic year
  const academicYear = student.academicYear || calculateAcademicYear(student.enrollmentDate)
  
  // Check credit hours for current term
  if (student.creditHours < CONTINUING_ELIGIBILITY.MIN_CREDITS_PER_TERM) {
    violations.push({
      code: 'INSUFFICIENT_CREDITS',
      severity: 'CRITICAL',
      rule: 'NCAA Division I Continuing Eligibility - Credit Hours',
      message: `Student must be enrolled in at least ${CONTINUING_ELIGIBILITY.MIN_CREDITS_PER_TERM} credit hours`,
      currentValue: student.creditHours,
      requiredValue: CONTINUING_ELIGIBILITY.MIN_CREDITS_PER_TERM,
    })
    recommendations.push('Student must add courses to meet minimum credit hour requirement')
  }
  
  // Check full-time status for practice/competition
  if (!student.isFullTime || student.creditHours < CONTINUING_ELIGIBILITY.MIN_CREDITS_FULL_TIME) {
    violations.push({
      code: 'NOT_FULL_TIME',
      severity: 'HIGH',
      rule: 'NCAA Division I Continuing Eligibility - Full-Time Status',
      message: `Student must be enrolled full-time (${CONTINUING_ELIGIBILITY.MIN_CREDITS_FULL_TIME}+ credits) to practice and compete`,
      currentValue: student.creditHours,
      requiredValue: CONTINUING_ELIGIBILITY.MIN_CREDITS_FULL_TIME,
    })
    recommendations.push('Student cannot practice or compete without full-time enrollment')
  }
  
  // Check GPA requirements based on academic year
  const gpaViolation = validateGPARequirement(student, academicYear)
  if (gpaViolation) {
    violations.push(gpaViolation)
    recommendations.push('Student may need academic support or tutoring to improve GPA')
  }
  
  // Check progress toward degree
  const ptdViolation = validateProgressTowardDegree(student, academicYear)
  if (ptdViolation) {
    violations.push(ptdViolation)
    recommendations.push('Student needs to complete more degree requirements')
  }
  
  // Check five-year eligibility window
  const yearsEnrolled = calculateYearsEnrolled(student.enrollmentDate)
  if (yearsEnrolled > CONTINUING_ELIGIBILITY.MAX_YEARS) {
    violations.push({
      code: 'ELIGIBILITY_EXPIRED',
      severity: 'CRITICAL',
      rule: 'NCAA Division I Continuing Eligibility - Five-Year Window',
      message: 'Student has exceeded the five-year eligibility window',
      currentValue: yearsEnrolled,
      requiredValue: CONTINUING_ELIGIBILITY.MAX_YEARS,
    })
  }
  
  // Warnings for students approaching limits
  if (yearsEnrolled >= 4) {
    warnings.push({
      code: 'APPROACHING_ELIGIBILITY_LIMIT',
      message: 'Student is approaching the five-year eligibility limit',
      recommendation: 'Ensure degree completion plan is on track',
    })
  }
  
  if (student.gpa < 2.5 && student.gpa >= getRequiredGPA(academicYear)) {
    warnings.push({
      code: 'LOW_GPA',
      message: 'GPA is close to minimum requirement',
      recommendation: 'Consider academic support programs',
    })
  }
  
  const isEligible = violations.filter(v => v.severity === 'CRITICAL' || v.severity === 'HIGH').length === 0
  
  return {
    isEligible,
    violations,
    warnings,
    recommendations,
    ruleVersion: NCAA_RULE_VERSION,
    checkedAt: new Date().toISOString(),
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Calculate academic year based on enrollment date
 */
function calculateAcademicYear(enrollmentDate: string): number {
  const enrolled = parseISO(enrollmentDate)
  const now = new Date()
  const years = differenceInYears(now, enrolled)
  return Math.min(years + 1, 5) // Cap at year 5
}

/**
 * Calculate years enrolled
 */
function calculateYearsEnrolled(enrollmentDate: string): number {
  const enrolled = parseISO(enrollmentDate)
  const now = new Date()
  return differenceInYears(now, enrolled)
}

/**
 * Get required GPA based on academic year
 */
function getRequiredGPA(academicYear: number): number {
  const multiplier = {
    1: CONTINUING_ELIGIBILITY.GPA_YEAR_1,
    2: CONTINUING_ELIGIBILITY.GPA_YEAR_2,
    3: CONTINUING_ELIGIBILITY.GPA_YEAR_3,
    4: CONTINUING_ELIGIBILITY.GPA_YEAR_4,
    5: CONTINUING_ELIGIBILITY.GPA_YEAR_4,
  }[academicYear] || CONTINUING_ELIGIBILITY.GPA_YEAR_4
  
  return INSTITUTIONAL_MIN_GPA * multiplier
}

/**
 * Validate GPA requirement for academic year
 */
function validateGPARequirement(student: StudentData, academicYear: number): Violation | null {
  const requiredGPA = getRequiredGPA(academicYear)
  const currentGPA = student.cumulativeGpa || student.gpa
  
  if (currentGPA < requiredGPA) {
    return {
      code: 'INSUFFICIENT_GPA',
      severity: 'CRITICAL',
      rule: `NCAA Division I Continuing Eligibility - GPA Year ${academicYear}`,
      message: `Student must maintain minimum ${requiredGPA.toFixed(2)} GPA`,
      currentValue: currentGPA,
      requiredValue: requiredGPA,
    }
  }
  
  return null
}

/**
 * Get required progress toward degree percentage
 */
function getRequiredProgressTowardDegree(academicYear: number): number {
  return {
    1: 0,
    2: CONTINUING_ELIGIBILITY.PTD_YEAR_2,
    3: CONTINUING_ELIGIBILITY.PTD_YEAR_3,
    4: CONTINUING_ELIGIBILITY.PTD_YEAR_4,
    5: CONTINUING_ELIGIBILITY.PTD_YEAR_4,
  }[academicYear] || 0
}

/**
 * Validate progress toward degree
 */
function validateProgressTowardDegree(student: StudentData, academicYear: number): Violation | null {
  if (academicYear < 2) {
    return null // No PTD requirement for year 1
  }
  
  const requiredPercentage = getRequiredProgressTowardDegree(academicYear)
  
  if (!student.degreeRequiredCredits || !student.completedCredits) {
    return {
      code: 'PTD_DATA_MISSING',
      severity: 'MEDIUM',
      rule: 'NCAA Division I Continuing Eligibility - Progress Toward Degree',
      message: 'Unable to calculate progress toward degree - missing data',
    }
  }
  
  const currentPercentage = student.completedCredits / student.degreeRequiredCredits
  
  if (currentPercentage < requiredPercentage) {
    return {
      code: 'INSUFFICIENT_PTD',
      severity: 'CRITICAL',
      rule: `NCAA Division I Continuing Eligibility - Progress Toward Degree Year ${academicYear}`,
      message: `Student must complete ${(requiredPercentage * 100).toFixed(0)}% of degree requirements`,
      currentValue: `${(currentPercentage * 100).toFixed(1)}%`,
      requiredValue: `${(requiredPercentage * 100).toFixed(0)}%`,
    }
  }
  
  return null
}

// =============================================================================
// COMPREHENSIVE ELIGIBILITY CHECK
// =============================================================================

/**
 * Perform comprehensive eligibility check
 * Determines whether to use initial or continuing eligibility rules
 */
export function checkEligibility(student: StudentData, isIncomingFreshman: boolean = false): ValidationResult {
  if (isIncomingFreshman) {
    return validateInitialEligibility(student)
  } else {
    return validateContinuingEligibility(student)
  }
}

/**
 * Get eligibility summary
 */
export function getEligibilitySummary(result: ValidationResult): string {
  if (result.isEligible) {
    return 'Student is eligible to compete'
  }
  
  const criticalViolations = result.violations.filter(v => v.severity === 'CRITICAL')
  const highViolations = result.violations.filter(v => v.severity === 'HIGH')
  
  if (criticalViolations.length > 0) {
    return `Student is NOT eligible - ${criticalViolations.length} critical violation(s)`
  }
  
  if (highViolations.length > 0) {
    return `Student has eligibility concerns - ${highViolations.length} high-priority violation(s)`
  }
  
  return 'Student has minor eligibility concerns'
}
