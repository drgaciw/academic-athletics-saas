// ============================================================================
// ADVISING SERVICE TYPES
// ============================================================================

// Course and Section Types
export interface CourseInfo {
  id: string
  courseCode: string
  courseName: string
  department: string
  credits: number
  description?: string
  prerequisites?: string[]
  corequisites?: string[]
  level?: 'FRESHMAN' | 'SOPHOMORE' | 'JUNIOR' | 'SENIOR' | 'GRADUATE'
}

export interface CourseSectionInfo {
  id: string
  courseId: string
  course?: CourseInfo
  sectionNumber: string
  term: string
  academicYear: string
  instructor?: string
  days: string[]
  startTime: string
  endTime: string
  location?: string
  capacity: number
  enrolled: number
  isOpen: boolean
  meetingPattern?: string
}

// Schedule Types
export interface ScheduleRequest {
  studentId: string
  sectionIds: string[]
  term: string
  academicYear: string
  preferences?: SchedulePreferences
}

export interface SchedulePreferences {
  preferredDays?: string[]
  preferredTimeRanges?: TimeRange[]
  avoidBackToBack?: boolean
  maxDailyHours?: number
  respectAthleticSchedule?: boolean
}

export interface TimeRange {
  start: string // HH:MM format
  end: string   // HH:MM format
}

export interface ScheduleResponse {
  scheduleId: string
  studentId: string
  term: string
  academicYear: string
  sections: CourseSectionInfo[]
  totalCredits: number
  conflicts: Conflict[]
  status: 'VALID' | 'HAS_CONFLICTS' | 'INVALID'
  warnings: string[]
}

// Conflict Types
export type ConflictType =
  | 'TIME_CONFLICT'
  | 'ATHLETIC_CONFLICT'
  | 'PREREQUISITE_MISSING'
  | 'CAPACITY_FULL'
  | 'CREDIT_HOUR_LIMIT'
  | 'COREQUISITE_MISSING'

export type ConflictSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'

export interface Conflict {
  id?: string
  conflictType: ConflictType
  severity: ConflictSeverity
  description: string
  affectedCourses: string[]
  suggestions?: string[]
  metadata?: Record<string, any>
}

export interface ConflictDetectionResult {
  hasConflicts: boolean
  conflicts: Conflict[]
  warnings: string[]
}

// Athletic Schedule Types
export interface AthleticEvent {
  id: string
  type: 'PRACTICE' | 'GAME' | 'TRAVEL' | 'CONDITIONING' | 'MEETING'
  title: string
  days: string[]
  startTime: string
  endTime: string
  location?: string
  isMandatory: boolean
  conflictPriority: number // 1-5, 5 being highest priority
}

export interface AthleticSchedule {
  studentId: string
  sport: string
  events: AthleticEvent[]
  travelDates?: TravelDate[]
}

export interface TravelDate {
  departureDate: string
  returnDate: string
  eventName: string
  location: string
}

// CSP (Constraint Satisfaction Problem) Types
export interface CSPVariable {
  id: string
  domain: string[] // Available section IDs for this course
}

export interface CSPConstraint {
  type: 'TIME' | 'ATHLETIC' | 'PREREQUISITE' | 'CAPACITY' | 'CREDIT_LIMIT' | 'COREQUISITE'
  variables: string[]
  validator: (assignment: CSPAssignment) => boolean
  description: string
  severity: ConflictSeverity
}

export interface CSPAssignment {
  [courseId: string]: string // courseId -> sectionId
}

export interface CSPSolution {
  assignment: CSPAssignment
  isValid: boolean
  conflicts: Conflict[]
  score: number // Quality score of the solution
}

// Degree Progress Types
export interface DegreeProgressRequest {
  studentId: string
  degreeProgram?: string
}

export interface DegreeProgressResponse {
  studentId: string
  degreeProgram: string
  totalCreditsRequired: number
  totalCreditsCompleted: number
  completionPercentage: number
  requirements: RequirementProgress[]
  estimatedGraduation?: string
  onTrack: boolean
  warnings: string[]
}

export interface RequirementProgress {
  category: string
  description: string
  creditsRequired: number
  creditsCompleted: number
  coursesCompleted: CourseCompletion[]
  remainingCourses: string[]
  status: 'COMPLETED' | 'IN_PROGRESS' | 'NOT_STARTED'
}

export interface CourseCompletion {
  courseCode: string
  courseName: string
  term: string
  academicYear: string
  grade?: string
  credits: number
  satisfiesRequirement: string
}

// Recommendation Types
export interface RecommendationRequest {
  studentId: string
  term: string
  academicYear: string
  preferences?: SchedulePreferences
  goals?: string[]
  context?: string
}

export interface RecommendationResponse {
  recommendations: CourseRecommendation[]
  reasoning: string
  alternativePaths?: AlternativePath[]
  warnings: string[]
}

export interface CourseRecommendation {
  course: CourseInfo
  priority: number
  reasoning: string
  availableSections: CourseSectionInfo[]
  fitsSchedule: boolean
  meetsPrerequisites: boolean
  satisfiesRequirement?: string
}

export interface AlternativePath {
  description: string
  courses: string[]
  reasoning: string
}

// Validation Types
export interface ScheduleValidationRequest {
  studentId: string
  sectionIds: string[]
  term: string
  academicYear: string
  checkPrerequisites?: boolean
  checkConflicts?: boolean
  checkCreditLimit?: boolean
}

export interface ScheduleValidationResponse {
  isValid: boolean
  conflicts: Conflict[]
  warnings: string[]
  totalCredits: number
  creditLimitMin: number
  creditLimitMax: number
  suggestions: string[]
}

// Time Slot Types
export interface TimeSlot {
  day: string
  startTime: string
  endTime: string
}

export interface TimeBlock {
  days: string[]
  startTime: string
  endTime: string
  type: 'ACADEMIC' | 'ATHLETIC' | 'BLOCKED'
  metadata?: Record<string, any>
}

// Graph Types for Conflict Detection
export interface ConflictGraph {
  nodes: Map<string, GraphNode>
  edges: Map<string, GraphEdge[]>
}

export interface GraphNode {
  id: string
  sectionId: string
  section: CourseSectionInfo
  timeSlots: TimeSlot[]
}

export interface GraphEdge {
  fromNodeId: string
  toNodeId: string
  conflictType: ConflictType
  severity: ConflictSeverity
  description: string
}

// Utility Types
export interface PaginationParams {
  page?: number
  limit?: number
}

export interface SortParams {
  field: string
  order: 'asc' | 'desc'
}

export interface FilterParams {
  department?: string
  level?: string
  credits?: number
  days?: string[]
  timeRange?: TimeRange
}

// Error Types
export class AdvisingError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400,
    public details?: any
  ) {
    super(message)
    this.name = 'AdvisingError'
  }
}

// Response Types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
  timestamp: string
  requestId?: string
}

// Constants
export const DAYS_OF_WEEK = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'] as const
export type DayOfWeek = typeof DAYS_OF_WEEK[number]

export const CREDIT_HOUR_LIMITS = {
  MIN_FULL_TIME: 12,
  MAX_STANDARD: 18,
  MAX_WITH_APPROVAL: 21,
  MIN_HALF_TIME: 6
} as const

export const CONFLICT_SEVERITY_WEIGHTS = {
  CRITICAL: 100,
  HIGH: 50,
  MEDIUM: 25,
  LOW: 10
} as const
