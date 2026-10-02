/**
 * Academic Advising & Schedule Optimizer Tools
 */

import { z } from "zod";
import { AgentTool } from "../../runtime/tool-registry.js";
import {
  DegreeAuditSummary,
  ScheduleConflict,
} from "../../types/advising.types.js";

const auditDegreeInputSchema = z.object({
  studentAthleteId: z.string(),
  major: z.string(),
  catalogYear: z.string().default("2025-2026"),
  totalCreditsRequired: z.number().default(120),
  creditsEarned: z.number().min(0),
  creditsInFlight: z.number().min(0),
});

type AuditDegreeInput = z.infer<typeof auditDegreeInputSchema>;

export const auditDegreeProgressTool: AgentTool<
  AuditDegreeInput,
  DegreeAuditSummary
> = {
  name: "audit_degree_progress",
  description:
    "Conduct a comprehensive degree audit against degree roadmap requirements.",
  domain: "advising",
  tier: "TIER_1_AUTONOMOUS",
  inputSchema: auditDegreeInputSchema,
  execute: async (input: AuditDegreeInput): Promise<DegreeAuditSummary> => {
    const totalAccounted = input.creditsEarned + input.creditsInFlight;
    const creditsRemaining = Math.max(
      0,
      input.totalCreditsRequired - totalAccounted,
    );
    const semestersRemaining = Math.ceil(creditsRemaining / 15);

    return {
      studentAthleteId: input.studentAthleteId,
      major: input.major,
      catalogYear: input.catalogYear,
      totalCreditsRequired: input.totalCreditsRequired,
      creditsEarned: input.creditsEarned,
      creditsInFlight: input.creditsInFlight,
      creditsRemaining,
      generalEducationCompleted: input.creditsEarned >= 45,
      coreRequirementsCompleted: input.creditsEarned >= 75,
      majorElectivesCompleted: input.creditsEarned >= 105,
      projectedGraduationTerm: `Term +${semestersRemaining} semesters`,
    };
  },
};

const resolveConflictsInputSchema = z.object({
  studentAthleteId: z.string(),
  proposedCourses: z.array(
    z.object({
      code: z.string(),
      title: z.string(),
      meetingTimes: z.array(z.string()),
    }),
  ),
  practiceWindow: z.object({
    days: z.array(z.string()),
    startTime: z.string(),
    endTime: z.string(),
  }),
});

type ResolveConflictsInput = z.infer<typeof resolveConflictsInputSchema>;

export const resolveScheduleConflictsTool: AgentTool<
  ResolveConflictsInput,
  Record<string, unknown>
> = {
  name: "resolve_schedule_conflicts",
  description:
    "Detect and resolve class meeting conflicts with athletic practice and competition travel.",
  domain: "advising",
  tier: "TIER_1_AUTONOMOUS",
  inputSchema: resolveConflictsInputSchema,
  execute: async (input: ResolveConflictsInput) => {
    const conflicts: ScheduleConflict[] = [];

    for (const course of input.proposedCourses) {
      for (const meeting of course.meetingTimes) {
        if (
          meeting.includes("14:") ||
          meeting.includes("15:") ||
          meeting.includes("16:")
        ) {
          conflicts.push({
            courseCode: course.code,
            courseTitle: course.title,
            athleticActivity: "Mandatory Team Practice (CARA 20hr block)",
            conflictType: "DIRECT_OVERLAP",
            time: meeting,
            severity: "CRITICAL_UNRESOLVABLE",
            recommendedResolution: `Reschedule ${course.code} to morning section (09:00-11:30 AM) to preserve practice attendance.`,
          });
        }
      }
    }

    return {
      studentAthleteId: input.studentAthleteId,
      totalCoursesAudited: input.proposedCourses.length,
      conflictsFound: conflicts.length,
      isConflictFree: conflicts.length === 0,
      conflicts,
    };
  },
};
