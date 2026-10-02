import { z } from "zod";

export const SportSeasonSchema = z.enum([
  "FALL",
  "WINTER",
  "SPRING",
  "YEAR_ROUND",
]);

export const ClassStandingSchema = z.enum([
  "FRESHMAN",
  "SOPHOMORE",
  "JUNIOR",
  "SENIOR",
  "FIFTH_YEAR",
  "GRADUATE",
]);

export const AcademicRiskLevelSchema = z.enum([
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL",
]);

export const EligibilityStatusSchema = z.enum([
  "ELIGIBLE",
  "AT_RISK",
  "INELIGIBLE",
  "PENDING_WAIVER",
]);

export const CourseSchema = z.object({
  id: z.string(),
  code: z.string(),
  title: z.string(),
  credits: z.number().positive(),
  department: z.string(),
  degreeApplicable: z.boolean(),
  prerequisites: z.array(z.string()).optional(),
  meetingTimes: z.array(z.string()).optional(),
});

export const StudentAthleteProfileSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  email: z.string().email(),
  sport: z.string(),
  season: SportSeasonSchema,
  classStanding: ClassStandingSchema,
  currentTermNumber: z.number().int().min(1),
  major: z.string(),
  majorDeclared: z.boolean(),
  enrolledCredits: z.number().min(0),
  lastTermPassedCredits: z.number().min(0),
  academicYearCredits: z.number().min(0),
  cumulativeDegreeCredits: z.number().min(0),
  totalDegreeCreditsRequired: z.number().positive().default(120),
  cumulativeGpa: z.number().min(0.0).max(4.0),
  eligibilityStatus: EligibilityStatusSchema,
  academicRiskLevel: AcademicRiskLevelSchema,
  studyHallHoursCompleted: z.number().min(0),
  studyHallHoursRequired: z.number().min(0),
  isGraduatingSenior: z.boolean().optional(),
  hasMedicalHardship: z.boolean().optional(),
});
