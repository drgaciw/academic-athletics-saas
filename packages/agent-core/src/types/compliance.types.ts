/**
 * NCAA Division I Compliance & Eligibility Verification Types
 */

import { EligibilityStatus } from "./student.types.js";

export interface BylawCitation {
  bylawNumber: string; // e.g., "14.4.3.2.1"
  ruleName: string; // e.g., "Progress-Toward-Degree (40% Rule)"
  textSummary: string;
}

export interface EligibilityFinding {
  bylaw: string;
  ruleName: string;
  passed: boolean;
  actualValue: string | number;
  requiredValue: string | number;
  details: string;
}

export interface PTDReport {
  studentAthleteId: string;
  termNumber: number;
  major: string;
  majorDeclared: boolean;
  cumulativeDegreeCredits: number;
  totalDegreeCreditsRequired: number;
  actualPercentage: number;
  requiredPercentage: number;
  metPTD: boolean;
  deficiencyCredits?: number;
}

export interface EligibilityEvaluationReport {
  studentId: string;
  studentName: string;
  sport: string;
  currentTerm: number;
  overallStatus: EligibilityStatus;
  ptdReport: PTDReport;
  cumulativeGpa: number;
  gpaRequirementMet: boolean;
  fullTimeEnrolled: boolean;
  sixHourTermMet: boolean;
  eighteenHourAnnualMet: boolean;
  twentyFourHourFreshmanMet: boolean;
  findings: EligibilityFinding[];
  violations: string[];
  warnings: string[];
  evaluatedAt: string;
}
