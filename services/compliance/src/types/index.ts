/**
 * NCAA Compliance Types
 * Based on NCAA Division I eligibility rules
 */

export enum NCAADivision {
  DI = 'DI',
  DII = 'DII',
  DIII = 'DIII',
}

export enum EligibilityStatus {
  ELIGIBLE = 'ELIGIBLE',
  INELIGIBLE = 'INELIGIBLE',
  CONDITIONAL = 'CONDITIONAL',
  PENDING = 'PENDING',
  UNDER_REVIEW = 'UNDER_REVIEW',
}

export enum ViolationSeverity {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

export enum RuleCategory {
  INITIAL_ELIGIBILITY = 'INITIAL_ELIGIBILITY',
  CONTINUING_ELIGIBILITY = 'CONTINUING_ELIGIBILITY',
  ACADEMIC_PROGRESS = 'ACADEMIC_PROGRESS',
  GPA_REQUIREMENT = 'GPA_REQUIREMENT',
  CREDIT_HOUR_REQUIREMENT = 'CREDIT_HOUR_REQUIREMENT',
}

export interface Violation {
  id: string
  ruleId: string
  ruleName: string
  category: RuleCategory
  severity: ViolationSeverity
  message: string
  details: string
  threshold?: number
  actualValue?: number
  timestamp: Date
}

export interface Warning {
  id: string
  ruleId: string
  message: string
  recommendation: string
  timestamp: Date
}

export interface ValidationResult {
  isEligible: boolean
  status: EligibilityStatus
  violations: Violation[]
  warnings: Warning[]
  recommendations: string[]
  eligibilityDate?: Date
  nextReviewDate?: Date
  metadata?: Record<string, any>
}

export interface StudentData {
  id: string
  firstName?: string
  lastName?: string
  sport?: string
  academicYear: number // 1 = Freshman, 2 = Sophomore, etc.

  // Academic data
  cumulativeGpa: number
  termGpa?: number
  totalCreditHours: number
  creditHoursThisTerm?: number
  creditHoursPreviousTerm?: number

  // Core courses (for initial eligibility)
  coreCourses?: CoreCourse[]

  // Progress toward degree
  degreeRequirementHours: number // Total hours required for degree
  progressTowardDegree: number // Percentage (0-100)

  // Additional data
  testScores?: TestScores
  enrollmentStatus?: string
  majorDeclared?: boolean
}

export interface CoreCourse {
  id: string
  subject: string
  courseNumber: string
  name: string
  grade: string
  gradePoints: number
  creditHours: number
  category: CoreCourseCategory
  completedBeforeSeniorYear: boolean
}

export enum CoreCourseCategory {
  ENGLISH = 'ENGLISH',
  MATH = 'MATH',
  SCIENCE = 'SCIENCE',
  SOCIAL_SCIENCE = 'SOCIAL_SCIENCE',
  ADDITIONAL_ENGLISH_MATH_SCIENCE = 'ADDITIONAL_ENGLISH_MATH_SCIENCE',
  ADDITIONAL_ACADEMIC = 'ADDITIONAL_ACADEMIC',
}

export interface TestScores {
  satTotal?: number // Combined SAT score (400-1600)
  actComposite?: number // ACT composite score (1-36)
}

export interface EligibilityRule {
  id: string
  name: string
  description: string
  category: RuleCategory
  version: string
  division: NCAADivision
  isActive: boolean
  effectiveDate: Date
  validate: (student: StudentData) => Promise<ValidationResult> | ValidationResult
  metadata?: Record<string, any>
}

export interface RuleConfiguration {
  id: string
  ruleId: string
  parameters: Record<string, any>
  isActive: boolean
  updatedAt: Date
  updatedBy: string
}

export interface ComplianceCheckRequest {
  studentId: string
  checkType?: 'full' | 'initial' | 'continuing'
  academicYear?: number
  termCode?: string
}

export interface ComplianceCheckResponse {
  studentId: string
  checkId: string
  timestamp: Date
  result: ValidationResult
  rulesApplied: string[]
  ruleVersion: string
}

export interface AuditLogEntry {
  id: string
  studentId: string
  checkType: string
  result: EligibilityStatus
  violations: number
  warnings: number
  performedBy: string
  timestamp: Date
  metadata?: Record<string, any>
}

export interface InitialEligibilityRequest {
  studentId: string
  coreCourses: CoreCourse[]
  coreGpa: number
  testScores?: TestScores
}

export interface ContinuingEligibilityRequest {
  studentId: string
  academicYear: number
  cumulativeGpa: number
  termGpa: number
  totalCreditHours: number
  creditHoursPreviousTerm: number
  progressTowardDegree: number
  degreeRequirementHours: number
}

export interface UpdateRulesRequest {
  ruleId: string
  parameters: Record<string, any>
  effectiveDate?: Date
  reason: string
}

/**
 * NCAA Division I Sliding Scale
 * Maps core GPA to minimum test scores
 */
export interface SlidingScaleEntry {
  coreGpa: number
  minSatTotal: number
  minActComposite: number
}

export const NCAA_DI_SLIDING_SCALE: SlidingScaleEntry[] = [
  { coreGpa: 3.550, minSatTotal: 400, minActComposite: 37 },
  { coreGpa: 3.525, minSatTotal: 410, minActComposite: 38 },
  { coreGpa: 3.500, minSatTotal: 420, minActComposite: 39 },
  { coreGpa: 3.475, minSatTotal: 430, minActComposite: 40 },
  { coreGpa: 3.450, minSatTotal: 440, minActComposite: 41 },
  { coreGpa: 3.425, minSatTotal: 450, minActComposite: 42 },
  { coreGpa: 3.400, minSatTotal: 460, minActComposite: 43 },
  { coreGpa: 3.375, minSatTotal: 470, minActComposite: 44 },
  { coreGpa: 3.350, minSatTotal: 480, minActComposite: 45 },
  { coreGpa: 3.325, minSatTotal: 490, minActComposite: 46 },
  { coreGpa: 3.300, minSatTotal: 500, minActComposite: 47 },
  { coreGpa: 3.275, minSatTotal: 510, minActComposite: 48 },
  { coreGpa: 3.250, minSatTotal: 520, minActComposite: 49 },
  { coreGpa: 3.225, minSatTotal: 530, minActComposite: 50 },
  { coreGpa: 3.200, minSatTotal: 540, minActComposite: 51 },
  { coreGpa: 3.175, minSatTotal: 550, minActComposite: 52 },
  { coreGpa: 3.150, minSatTotal: 560, minActComposite: 53 },
  { coreGpa: 3.125, minSatTotal: 570, minActComposite: 54 },
  { coreGpa: 3.100, minSatTotal: 580, minActComposite: 55 },
  { coreGpa: 3.075, minSatTotal: 590, minActComposite: 56 },
  { coreGpa: 3.050, minSatTotal: 600, minActComposite: 57 },
  { coreGpa: 3.025, minSatTotal: 610, minActComposite: 58 },
  { coreGpa: 3.000, minSatTotal: 620, minActComposite: 59 },
  { coreGpa: 2.975, minSatTotal: 630, minActComposite: 60 },
  { coreGpa: 2.950, minSatTotal: 640, minActComposite: 61 },
  { coreGpa: 2.925, minSatTotal: 650, minActComposite: 62 },
  { coreGpa: 2.900, minSatTotal: 660, minActComposite: 63 },
  { coreGpa: 2.875, minSatTotal: 670, minActComposite: 64 },
  { coreGpa: 2.850, minSatTotal: 680, minActComposite: 65 },
  { coreGpa: 2.825, minSatTotal: 690, minActComposite: 66 },
  { coreGpa: 2.800, minSatTotal: 700, minActComposite: 67 },
  { coreGpa: 2.775, minSatTotal: 710, minActComposite: 68 },
  { coreGpa: 2.750, minSatTotal: 720, minActComposite: 69 },
  { coreGpa: 2.725, minSatTotal: 730, minActComposite: 70 },
  { coreGpa: 2.700, minSatTotal: 740, minActComposite: 71 },
  { coreGpa: 2.675, minSatTotal: 750, minActComposite: 72 },
  { coreGpa: 2.650, minSatTotal: 760, minActComposite: 73 },
  { coreGpa: 2.625, minSatTotal: 770, minActComposite: 74 },
  { coreGpa: 2.600, minSatTotal: 780, minActComposite: 75 },
  { coreGpa: 2.575, minSatTotal: 790, minActComposite: 76 },
  { coreGpa: 2.550, minSatTotal: 800, minActComposite: 77 },
  { coreGpa: 2.525, minSatTotal: 810, minActComposite: 78 },
  { coreGpa: 2.500, minSatTotal: 820, minActComposite: 79 },
  { coreGpa: 2.475, minSatTotal: 830, minActComposite: 80 },
  { coreGpa: 2.450, minSatTotal: 840, minActComposite: 81 },
  { coreGpa: 2.425, minSatTotal: 850, minActComposite: 82 },
  { coreGpa: 2.400, minSatTotal: 860, minActComposite: 83 },
  { coreGpa: 2.375, minSatTotal: 870, minActComposite: 84 },
  { coreGpa: 2.350, minSatTotal: 880, minActComposite: 85 },
  { coreGpa: 2.325, minSatTotal: 890, minActComposite: 86 },
  { coreGpa: 2.300, minSatTotal: 900, minActComposite: 86 },
];
