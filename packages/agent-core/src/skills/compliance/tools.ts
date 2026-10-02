/**
 * NCAA Compliance Domain Skill Tools
 */

import { z } from "zod";
import { AgentTool } from "../../runtime/tool-registry.js";
import {
  EligibilityEvaluationReport,
  EligibilityFinding,
} from "../../types/compliance.types.js";

const evaluateNcaaInputSchema = z.object({
  studentId: z.string(),
  studentName: z.string(),
  sport: z.string(),
  currentTermNumber: z.number().int().min(1),
  enrolledCredits: z.number().min(0),
  lastTermPassedCredits: z.number().min(0),
  academicYearCredits: z.number().min(0),
  cumulativeDegreeCredits: z.number().min(0),
  totalDegreeCreditsRequired: z.number().positive().default(120),
  cumulativeGpa: z.number().min(0.0).max(4.0),
  major: z.string().default("General Studies"),
  majorDeclared: z.boolean().default(false),
  isGraduatingSenior: z.boolean().default(false),
});

type EvaluateNcaaInput = z.infer<typeof evaluateNcaaInputSchema>;

export const evaluateNcaaEligibilityTool: AgentTool<
  EvaluateNcaaInput,
  EligibilityEvaluationReport
> = {
  name: "evaluate_ncaa_eligibility",
  description:
    "Evaluate student-athlete academic record against NCAA Division I Bylaw 14 rules.",
  domain: "compliance",
  tier: "TIER_1_AUTONOMOUS",
  inputSchema: evaluateNcaaInputSchema,
  execute: async (
    input: EvaluateNcaaInput,
  ): Promise<EligibilityEvaluationReport> => {
    const findings: EligibilityFinding[] = [];
    const violations: string[] = [];
    const warnings: string[] = [];
    let overallStatus: "ELIGIBLE" | "AT_RISK" | "INELIGIBLE" = "ELIGIBLE";

    // 1. Full-Time Enrollment (12 Credits)
    const fullTimePassed =
      input.isGraduatingSenior || input.enrolledCredits >= 12;
    findings.push({
      bylaw: "14.1.2",
      ruleName: "Full-Time Enrollment",
      passed: fullTimePassed,
      actualValue: input.enrolledCredits,
      requiredValue: 12,
      details: fullTimePassed
        ? `${input.enrolledCredits} enrolled credits (Met)`
        : `${input.enrolledCredits} credits enrolled (Minimum 12 required for competition)`,
    });
    if (!fullTimePassed) {
      overallStatus = "INELIGIBLE";
      violations.push(
        "Bylaw 14.1.2: Enrolled in fewer than 12 credit hours without certified graduation waiver.",
      );
    }

    // 2. Six-Hour Term Rule
    let sixHourPassed = true;
    if (input.currentTermNumber > 1) {
      sixHourPassed = input.lastTermPassedCredits >= 6;
      findings.push({
        bylaw: "14.4.3.1",
        ruleName: "Six-Hour Term Rule",
        passed: sixHourPassed,
        actualValue: input.lastTermPassedCredits,
        requiredValue: 6,
        details: `${input.lastTermPassedCredits} credits earned in previous regular term`,
      });
      if (!sixHourPassed) {
        overallStatus = "INELIGIBLE";
        violations.push(
          "Bylaw 14.4.3.1: Deficient in 6-hour prior term credit requirement.",
        );
      }
    }

    // 3. Eighteen-Hour Academic Year Rule (Terms 3, 5, 7, 9)
    let eighteenHourPassed = true;
    if ([3, 5, 7, 9].includes(input.currentTermNumber)) {
      eighteenHourPassed = input.academicYearCredits >= 18;
      findings.push({
        bylaw: "14.4.3.2",
        ruleName: "Eighteen-Hour Academic Year Rule",
        passed: eighteenHourPassed,
        actualValue: input.academicYearCredits,
        requiredValue: 18,
        details: `${input.academicYearCredits} regular academic year credits earned (summer excluded)`,
      });
      if (!eighteenHourPassed) {
        overallStatus = "INELIGIBLE";
        violations.push(
          "Bylaw 14.4.3.2: Deficient in 18-hour regular academic year credit requirement.",
        );
      }
    }

    // 4. Twenty-Four Hour Freshman Rule (Term 3)
    let twentyFourHourPassed = true;
    if (input.currentTermNumber === 3) {
      twentyFourHourPassed = input.cumulativeDegreeCredits >= 24;
      findings.push({
        bylaw: "14.4.3.3",
        ruleName: "Twenty-Four Hour Freshman Rule",
        passed: twentyFourHourPassed,
        actualValue: input.cumulativeDegreeCredits,
        requiredValue: 24,
        details: `${input.cumulativeDegreeCredits} credits earned before Year 2`,
      });
      if (!twentyFourHourPassed) {
        overallStatus = "INELIGIBLE";
        violations.push(
          "Bylaw 14.4.3.3: Deficient in 24-hour freshman credit requirement.",
        );
      }
    }

    // 5. Progress-Toward-Degree (PTD 40/60/80%)
    const actualPtd =
      Math.round(
        (input.cumulativeDegreeCredits / input.totalDegreeCreditsRequired) *
          1000,
      ) / 10;
    let reqPtd = 0;
    if (input.currentTermNumber >= 9) reqPtd = 80;
    else if (input.currentTermNumber >= 7) reqPtd = 60;
    else if (input.currentTermNumber >= 5) reqPtd = 40;

    let ptdPassed = true;
    let deficiencyCredits = 0;
    if (reqPtd > 0) {
      const requiredCredits = Math.ceil(
        (reqPtd / 100) * input.totalDegreeCreditsRequired,
      );
      ptdPassed = input.cumulativeDegreeCredits >= requiredCredits;
      deficiencyCredits = ptdPassed
        ? 0
        : requiredCredits - input.cumulativeDegreeCredits;

      findings.push({
        bylaw: "14.4.3.2.1",
        ruleName: `Progress-Toward-Degree (${reqPtd}% Rule)`,
        passed: ptdPassed,
        actualValue: `${actualPtd}%`,
        requiredValue: `${reqPtd}%`,
        details: `${actualPtd}% achieved (${input.cumulativeDegreeCredits}/${input.totalDegreeCreditsRequired} credits)`,
      });
      if (!ptdPassed) {
        overallStatus = "INELIGIBLE";
        violations.push(
          `Bylaw 14.4.3.2.1: Deficient by ${deficiencyCredits} degree credits (${(reqPtd - actualPtd).toFixed(1)}%).`,
        );
      } else if (actualPtd - reqPtd < 5.0 && overallStatus === "ELIGIBLE") {
        overallStatus = "AT_RISK";
        warnings.push(
          `PTD Warning: Within 5% buffer of minimum benchmark (${actualPtd}% vs ${reqPtd}%).`,
        );
      }
    }

    // 6. Minimum GPA Benchmarks
    let reqGpa = 0.0;
    if (input.currentTermNumber >= 7) reqGpa = 2.0;
    else if (input.currentTermNumber >= 5) reqGpa = 1.9;
    else if (input.currentTermNumber >= 3) reqGpa = 1.8;

    let gpaPassed = true;
    if (reqGpa > 0.0) {
      gpaPassed = input.cumulativeGpa >= reqGpa;
      findings.push({
        bylaw: "14.4.3.3.1",
        ruleName: `Minimum GPA Requirement (${reqGpa.toFixed(3)})`,
        passed: gpaPassed,
        actualValue: input.cumulativeGpa.toFixed(3),
        requiredValue: reqGpa.toFixed(3),
        details: `Cumulative GPA ${input.cumulativeGpa.toFixed(3)} vs required ${reqGpa.toFixed(3)}`,
      });
      if (!gpaPassed) {
        overallStatus = "INELIGIBLE";
        violations.push(
          `Bylaw 14.4.3.3.1: GPA ${input.cumulativeGpa.toFixed(3)} below required benchmark ${reqGpa.toFixed(3)}.`,
        );
      } else if (
        input.cumulativeGpa - reqGpa < 0.15 &&
        overallStatus === "ELIGIBLE"
      ) {
        overallStatus = "AT_RISK";
        warnings.push(
          `Academic Warning: GPA ${input.cumulativeGpa.toFixed(3)} within 0.15 of probation threshold.`,
        );
      }
    }

    return {
      studentId: input.studentId,
      studentName: input.studentName,
      sport: input.sport,
      currentTerm: input.currentTermNumber,
      overallStatus,
      ptdReport: {
        studentAthleteId: input.studentId,
        termNumber: input.currentTermNumber,
        major: input.major,
        majorDeclared: input.majorDeclared,
        cumulativeDegreeCredits: input.cumulativeDegreeCredits,
        totalDegreeCreditsRequired: input.totalDegreeCreditsRequired,
        actualPercentage: actualPtd,
        requiredPercentage: reqPtd,
        metPTD: ptdPassed,
        deficiencyCredits,
      },
      cumulativeGpa: input.cumulativeGpa,
      gpaRequirementMet: gpaPassed,
      fullTimeEnrolled: fullTimePassed,
      sixHourTermMet: sixHourPassed,
      eighteenHourAnnualMet: eighteenHourPassed,
      twentyFourHourFreshmanMet: twentyFourHourPassed,
      findings,
      violations,
      warnings,
      evaluatedAt: new Date().toISOString(),
    };
  },
};

const simulateCourseDropInputSchema = z.object({
  studentId: z.string(),
  currentEnrolledCredits: z.number().positive(),
  creditsToDrop: z.number().positive(),
  courseCode: z.string(),
  isGraduatingSenior: z.boolean().default(false),
});

type SimulateCourseDropInput = z.infer<typeof simulateCourseDropInputSchema>;

export const simulateCourseDropImpactTool: AgentTool<
  SimulateCourseDropInput,
  Record<string, unknown>
> = {
  name: "simulate_course_drop_impact",
  description:
    "Simulate the compliance and eligibility impact of dropping a course.",
  domain: "compliance",
  tier: "TIER_1_AUTONOMOUS",
  inputSchema: simulateCourseDropInputSchema,
  execute: async (input: SimulateCourseDropInput) => {
    const projectedCredits = input.currentEnrolledCredits - input.creditsToDrop;
    const isFullTime = input.isGraduatingSenior || projectedCredits >= 12;
    const willCauseIneligibility = !isFullTime;

    return {
      studentId: input.studentId,
      courseCode: input.courseCode,
      creditsDropped: input.creditsToDrop,
      projectedEnrolledCredits: projectedCredits,
      maintainsFullTimeStatus: isFullTime,
      willCauseImmediateIneligibility: willCauseIneligibility,
      violatedBylaw: willCauseIneligibility
        ? "Bylaw 14.1.2 (Full-Time Enrollment)"
        : null,
      recommendation: willCauseIneligibility
        ? `DO NOT DROP: Dropping ${input.courseCode} reduces total enrolled units to ${projectedCredits}, falling below the 12-credit minimum required by NCAA Bylaw 14.1.2.`
        : `DROP PERMISSIBLE: Projected enrollment of ${projectedCredits} credits satisfies the 12-credit minimum.`,
    };
  },
};
