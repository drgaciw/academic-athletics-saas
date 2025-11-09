/**
 * Compliance Service Client
 * Type-safe client for Compliance Service endpoints
 */

import { ServiceClient, getServiceUrl } from './serviceClient';
import {
  EligibilityCheckRequest,
  EligibilityCheckResponse,
  ComplianceRecord,
  InitialEligibilityRequest,
  ContinuingEligibilityRequest,
  AuditLogEntry,
  RequestContext,
  PaginatedResponse,
} from '../types/services';

class ComplianceServiceClient {
  private client: ServiceClient;

  constructor() {
    this.client = new ServiceClient('compliance', {
      baseUrl: getServiceUrl('compliance'),
      timeout: 15000,
    });
  }

  /**
   * Check student eligibility
   */
  async checkEligibility(
    data: EligibilityCheckRequest,
    context: RequestContext
  ): Promise<EligibilityCheckResponse> {
    return this.client.post<EligibilityCheckResponse>(
      '/check-eligibility',
      data,
      context
    );
  }

  /**
   * Get current eligibility status
   */
  async getStatus(
    studentId: string,
    context: RequestContext
  ): Promise<ComplianceRecord> {
    return this.client.get<ComplianceRecord>(`/status/${studentId}`, context);
  }

  /**
   * Check initial eligibility (freshmen)
   */
  async checkInitialEligibility(
    data: InitialEligibilityRequest,
    context: RequestContext
  ): Promise<EligibilityCheckResponse> {
    return this.client.post<EligibilityCheckResponse>(
      '/initial-eligibility',
      data,
      context
    );
  }

  /**
   * Check continuing eligibility
   */
  async checkContinuingEligibility(
    data: ContinuingEligibilityRequest,
    context: RequestContext
  ): Promise<EligibilityCheckResponse> {
    return this.client.post<EligibilityCheckResponse>(
      '/continuing',
      data,
      context
    );
  }

  /**
   * Get eligibility violations
   */
  async getViolations(
    studentId: string,
    context: RequestContext
  ): Promise<ComplianceRecord[]> {
    return this.client.get<ComplianceRecord[]>(
      `/violations/${studentId}`,
      context
    );
  }

  /**
   * Update NCAA rules (admin only)
   */
  async updateRules(
    rules: any,
    context: RequestContext
  ): Promise<{ success: boolean }> {
    return this.client.post<{ success: boolean }>('/update-rules', rules, context);
  }

  /**
   * Get compliance audit log
   */
  async getAuditLog(
    studentId: string,
    context: RequestContext
  ): Promise<PaginatedResponse<AuditLogEntry>> {
    return this.client.get<PaginatedResponse<AuditLogEntry>>(
      `/audit-log/${studentId}`,
      context
    );
  }

  /**
   * Health check
   */
  async health() {
    return this.client.healthCheck();
  }
}

export const complianceService = new ComplianceServiceClient();
