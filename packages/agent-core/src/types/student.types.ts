/**
 * Student-Athlete & Academic Core Types
 */

export type SportSeason = "FALL" | "WINTER" | "SPRING" | "YEAR_ROUND";

export type ClassStanding =
  | "FRESHMAN"
  | "SOPHOMORE"
  | "JUNIOR"
  | "SENIOR"
  | "FIFTH_YEAR"
  | "GRADUATE";

export type AcademicRiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type EligibilityStatus =
  | "ELIGIBLE"
  | "AT_RISK"
  | "INELIGIBLE"
  | "PENDING_WAIVER";

export interface Course {
  id: string;
  code: string;
  title: string;
  credits: number;
  department: string;
  degreeApplicable: boolean;
  prerequisites?: string[];
  meetingTimes?: string[]; // e.g., ["MWF 09:00-09:50", "TR 11:00-12:15"]
}

export interface EnrollmentRecord {
  id: string;
  courseId: string;
  courseCode: string;
  courseTitle: string;
  term: string; // e.g., "Fall 2026"
  termNumber: number; // 1 = Fall Year 1, 2 = Spring Year 1, 3 = Fall Year 2, etc.
  credits: number;
  grade?: string; // "A", "B", "C", "D", "F", "IP" (In Progress), "W" (Withdrawn)
  isDegreeApplicable: boolean;
  status: "ENROLLED" | "COMPLETED" | "DROPPED" | "WITHDRAWN";
}

export interface StudentAthleteProfile {
  id: string;
  userId: string;
  name: string;
  email: string;
  sport: string;
  season: SportSeason;
  classStanding: ClassStanding;
  currentTermNumber: number;
  major: string;
  majorDeclared: boolean;
  enrolledCredits: number;
  lastTermPassedCredits: number;
  academicYearCredits: number;
  cumulativeDegreeCredits: number;
  totalDegreeCreditsRequired: number;
  cumulativeGpa: number;
  eligibilityStatus: EligibilityStatus;
  academicRiskLevel: AcademicRiskLevel;
  studyHallHoursCompleted: number;
  studyHallHoursRequired: number;
  isGraduatingSenior?: boolean;
  hasMedicalHardship?: boolean;
}
