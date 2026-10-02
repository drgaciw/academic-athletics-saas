/**
 * Academic Risk & Proactive Intervention Tools
 */

import { z } from "zod";
import { AgentTool } from "../../runtime/tool-registry.js";
import { AcademicRiskLevel } from "../../types/student.types.js";

const calculateRiskInputSchema = z.object({
  studentId: z.string(),
  cumulativeGpa: z.number().min(0.0).max(4.0),
  currentTermNumber: z.number().int(),
  studyHallCompletionRate: z.number().min(0.0).max(1.0),
  missedClassesCount: z.number().min(0),
  midtermDeficienciesCount: z.number().min(0),
  ptdBufferPercentage: z.number(),
});

type CalculateRiskInput = z.infer<typeof calculateRiskInputSchema>;

export const calculateAcademicRiskScoreTool: AgentTool<
  CalculateRiskInput,
  Record<string, unknown>
> = {
  name: "calculate_academic_risk_score",
  description:
    "Calculate multi-factor predictive academic risk score (0-100) and identify threat indicators.",
  domain: "risk_intervention",
  tier: "TIER_1_AUTONOMOUS",
  inputSchema: calculateRiskInputSchema,
  execute: async (input: CalculateRiskInput) => {
    let score = 0;
    const flags: string[] = [];

    // GPA risk component (up to 40 pts)
    if (input.cumulativeGpa < 2.0) {
      score += 40;
      flags.push(
        `Critical GPA risk: ${input.cumulativeGpa.toFixed(2)} is below probation threshold.`,
      );
    } else if (input.cumulativeGpa < 2.3) {
      score += 25;
      flags.push(
        `Elevated GPA risk: ${input.cumulativeGpa.toFixed(2)} is near NCAA threshold.`,
      );
    } else if (input.cumulativeGpa < 2.6) {
      score += 10;
    }

    // Midterm grade risk component (up to 30 pts)
    if (input.midtermDeficienciesCount > 0) {
      const midtermPts = Math.min(30, input.midtermDeficienciesCount * 15);
      score += midtermPts;
      flags.push(
        `Midterm alerts: ${input.midtermDeficienciesCount} active course(s) with D or F grades.`,
      );
    }

    // Attendance & study hall component (up to 20 pts)
    if (input.studyHallCompletionRate < 0.6) {
      score += 15;
      flags.push(
        `Study hall non-compliance: Only ${Math.round(input.studyHallCompletionRate * 100)}% of hours logged.`,
      );
    }
    if (input.missedClassesCount >= 3) {
      score += 15;
      flags.push(
        `Unexcused absences: ${input.missedClassesCount} classes missed.`,
      );
    }

    // PTD buffer component (up to 15 pts)
    if (input.ptdBufferPercentage < 3.0 && input.currentTermNumber >= 5) {
      score += 15;
      flags.push(
        `PTD margin thin: Only ${input.ptdBufferPercentage.toFixed(1)}% buffer above required benchmark.`,
      );
    }

    score = Math.min(100, Math.max(0, score));

    let riskLevel: AcademicRiskLevel = "LOW";
    if (score >= 75) riskLevel = "CRITICAL";
    else if (score >= 50) riskLevel = "HIGH";
    else if (score >= 25) riskLevel = "MEDIUM";

    return {
      studentId: input.studentId,
      riskScore: score,
      riskLevel,
      requiresIntervention: score >= 50,
      riskFactors: flags,
      recommendedActions:
        score >= 50
          ? [
              "Assign 1-on-1 subject tutor",
              "Increase study hall requirement to 8 hrs/week",
              "Schedule mandatory advisor check-in",
            ]
          : ["Continue standard bi-weekly monitoring"],
    };
  },
};

const assignTutoringInputSchema = z.object({
  studentId: z.string(),
  courseCode: z.string(),
  weeklyHours: z.number().int().min(1).max(10).default(2),
  tutorSubject: z.string(),
  justification: z.string(),
});

type AssignTutoringInput = z.infer<typeof assignTutoringInputSchema>;

export const assignMandatoryTutoringTool: AgentTool<
  AssignTutoringInput,
  Record<string, unknown>
> = {
  name: "assign_mandatory_tutoring",
  description:
    "Assign mandatory weekly tutoring sessions for a student-athlete in a struggling course.",
  domain: "risk_intervention",
  tier: "TIER_2_STAFF_REVIEW",
  inputSchema: assignTutoringInputSchema,
  execute: async (input: AssignTutoringInput) => {
    return {
      success: true,
      assignmentId: `TUTR-${Date.now()}`,
      studentId: input.studentId,
      courseCode: input.courseCode,
      weeklyHours: input.weeklyHours,
      assignedTutorPool: `${input.tutorSubject} Academic Mentors`,
      status: "ASSIGNED",
    };
  },
};
