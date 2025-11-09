/**
 * Monitoring Service Client
 * Type-safe client for Monitoring Service endpoints
 */

import { ServiceClient, getServiceUrl } from './serviceClient';
import {
  PerformanceMetrics,
  ProgressReportRequest,
  ProgressReportResponse,
  Alert,
  InterventionPlan,
  CreateInterventionRequest,
  TeamAnalytics,
  RiskAssessmentRequest,
  RiskAssessmentResponse,
  RequestContext,
} from '../types/services';

class MonitoringServiceClient {
  private client: ServiceClient;

  constructor() {
    this.client = new ServiceClient('monitoring', {
      baseUrl: getServiceUrl('monitoring'),
      timeout: 15000,
    });
  }

  /**
   * Get performance metrics
   */
  async getPerformance(
    studentId: string,
    context: RequestContext
  ): Promise<PerformanceMetrics> {
    return this.client.get<PerformanceMetrics>(
      `/performance/${studentId}`,
      context
    );
  }

  /**
   * Submit progress report
   */
  async submitProgressReport(
    data: ProgressReportRequest,
    context: RequestContext
  ): Promise<ProgressReportResponse> {
    return this.client.post<ProgressReportResponse>(
      '/progress-report',
      data,
      context
    );
  }

  /**
   * Get active alerts
   */
  async getAlerts(
    studentId: string,
    context: RequestContext
  ): Promise<Alert[]> {
    return this.client.get<Alert[]>(`/alerts/${studentId}`, context);
  }

  /**
   * Create intervention plan
   */
  async createIntervention(
    data: CreateInterventionRequest,
    context: RequestContext
  ): Promise<InterventionPlan> {
    return this.client.post<InterventionPlan>('/intervention', data, context);
  }

  /**
   * Get team-wide analytics
   */
  async getTeamAnalytics(
    teamId: string,
    context: RequestContext
  ): Promise<TeamAnalytics> {
    return this.client.get<TeamAnalytics>(
      `/analytics/team/${teamId}`,
      context
    );
  }

  /**
   * Trigger risk assessment
   */
  async assessRisk(
    data: RiskAssessmentRequest,
    context: RequestContext
  ): Promise<RiskAssessmentResponse> {
    return this.client.post<RiskAssessmentResponse>(
      '/risk-assessment',
      data,
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

export const monitoringService = new MonitoringServiceClient();
