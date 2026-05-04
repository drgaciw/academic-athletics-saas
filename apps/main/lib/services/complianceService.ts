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
  RegulationChangeSummary,
  RegulationChangeDetail,
  RegulationSourceStatus,
  AcknowledgeRegulationChangeRequest,
  RegulationRunResult,
} from '../types/services';

/** Compliance microservice wraps payloads with `{ success, data, meta }`. */
type ServiceEnvelope<T> = { success: boolean; data: T };

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

  /**
   * List regulation feed changes (compliance/coach scoped server-side).
   */
  async getRegulationChanges(
    query: { page?: number; limit?: number; unacknowledgedOnly?: boolean },
    context: RequestContext
  ): Promise<{
    data: RegulationChangeSummary[];
    pagination: PaginatedResponse<RegulationChangeSummary>['pagination'];
  }> {
    const qs = new URLSearchParams();
    if (query.page) qs.set('page', String(query.page));
    if (query.limit) qs.set('limit', String(query.limit));
    if (query.unacknowledgedOnly) qs.set('unacknowledgedOnly', 'true');
    const q = qs.toString();
    const res = await this.client.get<
      ServiceEnvelope<{
        data: RegulationChangeSummary[];
        pagination: PaginatedResponse<RegulationChangeSummary>['pagination'];
      }>
    >(`/regulations/changes${q ? `?${q}` : ''}`, context);
    return res.data;
  }

  async getRegulationChange(
    id: string,
    context: RequestContext
  ): Promise<RegulationChangeDetail> {
    const res = await this.client.get<ServiceEnvelope<RegulationChangeDetail>>(
      `/regulations/changes/${id}`,
      context
    );
    return res.data;
  }

  async acknowledgeRegulationChange(
    body: AcknowledgeRegulationChangeRequest,
    context: RequestContext
  ): Promise<{ success: boolean }> {
    const res = await this.client.post<ServiceEnvelope<{ success: boolean }>>(
      `/regulations/acknowledge`,
      body,
      context
    );
    return res.data;
  }

  async getRegulationSources(
    context: RequestContext
  ): Promise<{ data: RegulationSourceStatus[] }> {
    const res = await this.client.get<
      ServiceEnvelope<{ data: RegulationSourceStatus[] }>
    >(`/regulations/sources`, context);
    return res.data;
  }

  async runRegulationCheckNow(
    context: RequestContext
  ): Promise<RegulationRunResult> {
    const res = await this.client.post<ServiceEnvelope<RegulationRunResult>>(
      `/regulations/check-now`,
      {},
      context
    );
    return res.data;
  }
}

export const complianceService = new ComplianceServiceClient();
