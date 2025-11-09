/**
 * Query key factories for consistent cache management
 * Following TanStack Query best practices for key organization
 */

export const queryKeys = {
  // Student-related queries
  students: {
    all: ['students'] as const,
    lists: () => [...queryKeys.students.all, 'list'] as const,
    list: (filters?: string) => [...queryKeys.students.lists(), { filters }] as const,
    details: () => [...queryKeys.students.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.students.details(), id] as const,
    profile: (id: string) => [...queryKeys.students.detail(id), 'profile'] as const,
    courses: (id: string) => [...queryKeys.students.detail(id), 'courses'] as const,
    schedule: (id: string) => [...queryKeys.students.detail(id), 'schedule'] as const,
  },

  // Compliance-related queries
  compliance: {
    all: ['compliance'] as const,
    status: (id: string) => [...queryKeys.compliance.all, 'status', id] as const,
    eligibility: (id: string) => [...queryKeys.compliance.all, 'eligibility', id] as const,
    teamStatus: (teamId: string) => [...queryKeys.compliance.all, 'team', teamId] as const,
  },

  // Alert-related queries
  alerts: {
    all: ['alerts'] as const,
    lists: () => [...queryKeys.alerts.all, 'list'] as const,
    list: (filters?: string) => [...queryKeys.alerts.lists(), { filters }] as const,
    detail: (id: string) => [...queryKeys.alerts.all, 'detail', id] as const,
  },

  // AI Evaluation queries
  evals: {
    all: ['evals'] as const,
    runs: () => [...queryKeys.evals.all, 'runs'] as const,
    run: (id: string) => [...queryKeys.evals.runs(), id] as const,
    metrics: () => [...queryKeys.evals.all, 'metrics'] as const,
    trends: () => [...queryKeys.evals.all, 'trends'] as const,
  },

  // Support services queries
  support: {
    all: ['support'] as const,
    tutoring: () => [...queryKeys.support.all, 'tutoring'] as const,
    studyHall: () => [...queryKeys.support.all, 'study-hall'] as const,
    workshops: () => [...queryKeys.support.all, 'workshops'] as const,
    mentoring: (studentId: string) => [...queryKeys.support.all, 'mentoring', studentId] as const,
  },

  // Monitoring queries
  monitoring: {
    all: ['monitoring'] as const,
    analytics: () => [...queryKeys.monitoring.all, 'analytics'] as const,
    summary: () => [...queryKeys.monitoring.analytics(), 'summary'] as const,
    notifications: (userId: string) => [...queryKeys.monitoring.all, 'notifications', userId] as const,
    risk: (studentId: string) => [...queryKeys.monitoring.all, 'risk', studentId] as const,
    interventions: (studentId: string) => [...queryKeys.monitoring.all, 'interventions', studentId] as const,
  },

  // Course-related queries
  courses: {
    all: ['courses'] as const,
    lists: () => [...queryKeys.courses.all, 'list'] as const,
    list: (filters?: string) => [...queryKeys.courses.lists(), { filters }] as const,
    detail: (id: string) => [...queryKeys.courses.all, 'detail', id] as const,
    roster: (id: string) => [...queryKeys.courses.detail(id), 'roster'] as const,
  },

  // User queries
  user: {
    all: ['user'] as const,
    profile: (id: string) => [...queryKeys.user.all, 'profile', id] as const,
    teamRoster: (coachId: string) => [...queryKeys.user.all, 'team-roster', coachId] as const,
    courseRoster: (facultyId: string) => [...queryKeys.user.all, 'course-roster', facultyId] as const,
  },

  // Absence/Integration queries
  absences: {
    all: ['absences'] as const,
    lists: () => [...queryKeys.absences.all, 'list'] as const,
    list: (filters?: string) => [...queryKeys.absences.lists(), { filters }] as const,
    detail: (id: string) => [...queryKeys.absences.all, 'detail', id] as const,
  },
} as const

/**
 * Helper function to invalidate all queries for a specific entity
 */
export function getInvalidationKeys(entity: keyof typeof queryKeys) {
  return queryKeys[entity].all
}