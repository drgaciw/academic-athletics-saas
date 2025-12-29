/**
 * Coach Service Types
 */

export interface CoachProfile {
  id: string;
  userId: string;
  coachId: string;
  sport: string;
  teams: string[];
  title?: string;
  department?: string;
  phone?: string;
  officeLocation?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCoachRequest {
  clerkId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  sport: string;
  teams: string[];
  title?: string;
  department?: string;
  phone?: string;
  officeLocation?: string;
}

export interface UpdateCoachRequest {
  sport?: string;
  teams?: string[];
  title?: string;
  department?: string;
  phone?: string;
  officeLocation?: string;
}

export interface StudentAthleteInfo {
  id: string;
  studentId: string;
  name: string;
  sport: string;
  team?: string;
  year?: string;
  gpa?: number;
  creditHours: number;
  eligibilityStatus: string;
  academicStanding?: string;
  enrollmentStatus: string;
  major?: string;
  alerts: AlertSummary[];
  recentPerformance?: PerformanceSummary;
}

export interface AlertSummary {
  id: string;
  type: string;
  severity: string;
  message: string;
  createdAt: string;
}

export interface PerformanceSummary {
  termGpa?: number;
  cumulativeGpa?: number;
  attendanceRate?: number;
  lastUpdated: string;
}

export interface CoachTeamAnalytics {
  sport: string;
  teams: string[];
  totalStudents: number;
  eligibleCount: number;
  atRiskCount: number;
  ineligibleCount: number;
  averageGpa: number;
  averageCreditHours: number;
  eligibilityRate: number;
  activeAlerts: number;
  criticalAlerts: number;
  performanceByTeam?: TeamPerformance[];
}

export interface TeamPerformance {
  team: string;
  studentCount: number;
  averageGpa: number;
  eligibilityRate: number;
}

export interface GetStudentAthletesRequest {
  sport?: string;
  team?: string;
  eligibilityStatus?: string;
  academicStanding?: string;
  limit?: number;
  offset?: number;
}

export interface GetStudentAthletesResponse {
  students: StudentAthleteInfo[];
  total: number;
  limit: number;
  offset: number;
}
