/**
 * Advising Service Client
 * Type-safe client for Advising Service endpoints
 */

import { ServiceClient, getServiceUrl } from './serviceClient';
import {
  ScheduleRequest,
  ScheduleResponse,
  RecommendationRequest,
  RecommendationResponse,
  DegreeProgress,
  ValidateScheduleRequest,
  RequestContext,
} from '../types/services';

class AdvisingServiceClient {
  private client: ServiceClient;

  constructor() {
    this.client = new ServiceClient('advising', {
      baseUrl: getServiceUrl('advising'),
      timeout: 20000, // Scheduling can take longer
    });
  }

  /**
   * Generate course schedule
   */
  async generateSchedule(
    data: ScheduleRequest,
    context: RequestContext
  ): Promise<ScheduleResponse> {
    return this.client.post<ScheduleResponse>('/schedule', data, context);
  }

  /**
   * Check scheduling conflicts
   */
  async getConflicts(
    studentId: string,
    context: RequestContext
  ): Promise<ScheduleResponse> {
    return this.client.get<ScheduleResponse>(
      `/conflicts/${studentId}`,
      context
    );
  }

  /**
   * Get course recommendations
   */
  async getRecommendations(
    data: RecommendationRequest,
    context: RequestContext
  ): Promise<RecommendationResponse> {
    return this.client.post<RecommendationResponse>(
      '/recommend',
      data,
      context
    );
  }

  /**
   * Track degree completion progress
   */
  async getDegreeProgress(
    studentId: string,
    context: RequestContext
  ): Promise<DegreeProgress> {
    return this.client.get<DegreeProgress>(
      `/degree-progress/${studentId}`,
      context
    );
  }

  /**
   * Validate proposed schedule
   */
  async validateSchedule(
    data: ValidateScheduleRequest,
    context: RequestContext
  ): Promise<ScheduleResponse> {
    return this.client.post<ScheduleResponse>(
      '/validate-schedule',
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

export const advisingService = new AdvisingServiceClient();
