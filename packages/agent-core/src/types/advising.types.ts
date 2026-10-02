/**
 * Academic Advising & Athletic Scheduling Types
 */

import { Course } from "./student.types.js";

export interface AthleticScheduleBlock {
  id: string;
  type: "PRACTICE" | "COMPETITION" | "TRAVEL" | "WEIGHT_ROOM" | "FILM_STUDY";
  title: string;
  dayOfWeek:
    | "MONDAY"
    | "TUESDAY"
    | "WEDNESDAY"
    | "THURSDAY"
    | "FRIDAY"
    | "SATURDAY"
    | "SUNDAY";
  startTime: string; // "14:00"
  endTime: string; // "17:00"
  location?: string;
  isMandatory: boolean;
}

export interface ScheduleConflict {
  courseCode: string;
  courseTitle: string;
  athleticActivity: string;
  conflictType: "DIRECT_OVERLAP" | "TRAVEL_WINDOW" | "EXAM_CONFLICT";
  time: string;
  severity:
    | "CRITICAL_UNRESOLVABLE"
    | "MODERATE_EXCUSED_ABSENCE_ELIGIBLE"
    | "LOW";
  recommendedResolution: string;
}

export interface DegreeAuditSummary {
  studentAthleteId: string;
  major: string;
  catalogYear: string;
  totalCreditsRequired: number;
  creditsEarned: number;
  creditsInFlight: number;
  creditsRemaining: number;
  generalEducationCompleted: boolean;
  coreRequirementsCompleted: boolean;
  majorElectivesCompleted: boolean;
  projectedGraduationTerm: string;
}

export interface TermScheduleRecommendation {
  termName: string;
  courses: Course[];
  totalCredits: number;
  inSeason: boolean;
  academicRigorScore: number; // 1-10 scale
  conflictAudit: ScheduleConflict[];
  advisingRationale: string;
}
