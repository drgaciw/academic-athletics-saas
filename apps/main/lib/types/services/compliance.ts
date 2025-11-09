/**
 * Compliance Service Types
 */

export interface EligibilityCheckRequest {
  studentId: string;
  termId?: string;
}

export interface EligibilityCheckResponse {
  isEligible: boolean;
  status: EligibilityStatus;
  violations: Violation[];
  warnings: Warning[];
  recommendations: string[];
  checkedAt: string;
  ruleVersion: string;
}

export enum EligibilityStatus {
  ELIGIBLE = 'ELIGIBLE',
  CONDITIONALLY_ELIGIBLE = 'CONDITIONALLY_ELIGIBLE',
  INELIGIBLE = 'INELIGIBLE',
  PENDING = 'PENDING',
}

export interface Violation {
  ruleId: string;
  ruleName: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  message: string;
  details?: Record<string, any>;
}

export interface Warning {
  type: string;
  message: string;
  threshold?: number;
  current?: number;
}

export interface ComplianceRecord {
  id: string;
  studentId: string;
  termGpa: number;
  cumulativeGpa: number;
  creditHours: number;
  progressPercent: number;
  isEligible: boolean;
  violations?: Violation[];
  ruleVersion: string;
  checkedAt: string;
}

export interface InitialEligibilityRequest {
  studentId: string;
  coreCoursesCount: number;
  coreGpa: number;
  satScore?: number;
  actScore?: number;
}

export interface ContinuingEligibilityRequest {
  studentId: string;
  termGpa: number;
  cumulativeGpa: number;
  creditHoursCompleted: number;
  creditHoursAttempted: number;
}

export interface AuditLogEntry {
  id: string;
  studentId: string;
  action: string;
  performedBy: string;
  timestamp: string;
  details: Record<string, any>;
}
