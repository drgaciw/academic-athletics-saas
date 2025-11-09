// TanStack Query hooks - Queries
export { useStudentProfile } from './use-student-profile'
export { useEligibilityStatus } from './use-eligibility-status'
export { useStudentsList } from './use-students-list'
export { useAlerts } from './use-alerts'
export { useAnalyticsSummary } from './use-analytics-summary'

// TanStack Query hooks - Mutations
export { useUpdateStudent } from './use-update-student'
export { useAcknowledgeAlert } from './use-acknowledge-alert'

// Re-export types
export type { StudentProfile } from './use-student-profile'
export type { EligibilityStatus } from './use-eligibility-status'
export type { Student, StudentsListFilters, StudentsListResponse } from './use-students-list'
export type { Alert, AlertsFilters } from './use-alerts'
export type { AnalyticsSummary } from './use-analytics-summary'
export type { UpdateStudentData } from './use-update-student'