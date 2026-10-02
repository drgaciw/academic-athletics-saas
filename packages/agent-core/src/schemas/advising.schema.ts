import { z } from "zod";
import { CourseSchema } from "./student.schema.js";

export const AthleticScheduleBlockSchema = z.object({
  id: z.string(),
  type: z.enum([
    "PRACTICE",
    "COMPETITION",
    "TRAVEL",
    "WEIGHT_ROOM",
    "FILM_STUDY",
  ]),
  title: z.string(),
  dayOfWeek: z.enum([
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
    "SUNDAY",
  ]),
  startTime: z.string(),
  endTime: z.string(),
  location: z.string().optional(),
  isMandatory: z.boolean().default(true),
});

export const ScheduleConflictSchema = z.object({
  courseCode: z.string(),
  courseTitle: z.string(),
  athleticActivity: z.string(),
  conflictType: z.enum(["DIRECT_OVERLAP", "TRAVEL_WINDOW", "EXAM_CONFLICT"]),
  time: z.string(),
  severity: z.enum([
    "CRITICAL_UNRESOLVABLE",
    "MODERATE_EXCUSED_ABSENCE_ELIGIBLE",
    "LOW",
  ]),
  recommendedResolution: z.string(),
});

export const TermScheduleRecommendationSchema = z.object({
  termName: z.string(),
  courses: z.array(CourseSchema),
  totalCredits: z.number(),
  inSeason: z.boolean(),
  academicRigorScore: z.number().min(1).max(10),
  conflictAudit: z.array(ScheduleConflictSchema),
  advisingRationale: z.string(),
});
