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

/** Regulation watch — aligns with compliance service responses */
export interface RegulationChangeSummary {
  id: string;
  detectedAt: string;
  severity: string;
  summary: string;
  classification: string;
  impactedDomains: string[];
  coachVisible: boolean;
  evidenceUrl: string;
  retrievalDate: string;
  title: string | null;
  requiresManualReview: boolean;
  source: {
    id: string;
    name: string;
    sourceType: string;
    feedUrl: string;
  };
  acknowledged?: boolean;
}

export interface RegulationChangeDetail extends RegulationChangeSummary {
  diffMetadata: Record<string, unknown> | null;
  materialityScore: number;
  confidenceScore: number;
  audiences: string[];
  acknowledged?: boolean;
  snapshot?: {
    id: string;
    fetchedAt: string;
    contentHash: string;
    rawUrl: string;
    normalizedBody: string;
    parserVersion: string;
  } | null;
}

export interface RegulationSourceStatus {
  id: string;
  sourceType: string;
  name: string;
  feedUrl: string;
  isActive: boolean;
  lastFetchedAt: string | null;
  lastSuccessAt: string | null;
  lastErrorAt: string | null;
  lastErrorSummary: string | null;
  consecutiveFailures: number;
  circuitBreakerOpenUntil: string | null;
  parserVersion: string;
}

export interface AcknowledgeRegulationChangeRequest {
  changeId: string;
  notes?: string;
}

export interface RegulationRunResult {
  sourcesChecked: number;
  changesCreated: number;
  errors: { sourceId: string; message: string }[];
}
