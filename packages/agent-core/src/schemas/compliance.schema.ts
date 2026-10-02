import { z } from "zod";
import { EligibilityStatusSchema } from "./student.schema.js";

export const EligibilityFindingSchema = z.object({
  bylaw: z.string(),
  ruleName: z.string(),
  passed: z.boolean(),
  actualValue: z.union([z.string(), z.number()]),
  requiredValue: z.union([z.string(), z.number()]),
  details: z.string(),
});

export const PTDReportSchema = z.object({
  studentAthleteId: z.string(),
  termNumber: z.number().int(),
  major: z.string(),
  majorDeclared: z.boolean(),
  cumulativeDegreeCredits: z.number(),
  totalDegreeCreditsRequired: z.number(),
  actualPercentage: z.number(),
  requiredPercentage: z.number(),
  metPTD: z.boolean(),
  deficiencyCredits: z.number().optional(),
});

export const EligibilityEvaluationReportSchema = z.object({
  studentId: z.string(),
  studentName: z.string(),
  sport: z.string(),
  currentTerm: z.number().int(),
  overallStatus: EligibilityStatusSchema,
  ptdReport: PTDReportSchema,
  cumulativeGpa: z.number(),
  gpaRequirementMet: z.boolean(),
  fullTimeEnrolled: z.boolean(),
  sixHourTermMet: z.boolean(),
  eighteenHourAnnualMet: z.boolean(),
  twentyFourHourFreshmanMet: z.boolean(),
  findings: z.array(EligibilityFindingSchema),
  violations: z.array(z.string()),
  warnings: z.array(z.string()),
  evaluatedAt: z.string(),
});
