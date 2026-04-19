/**
 * Coach Service Client
 * Type-safe client for Coach Service endpoints
 */

import { ServiceClient, getServiceUrl } from './serviceClient';
import {
  CoachProfile,
  CreateCoachRequest,
  UpdateCoachRequest,
  StudentAthleteInfo,
  CoachTeamAnalytics,
  GetStudentAthletesRequest,
  GetStudentAthletesResponse,
  RequestContext,
} from '../types/services';

class CoachServiceClient {
  private client: ServiceClient;

  constructor() {
    this.client = new ServiceClient('coach', {
      baseUrl: getServiceUrl('coach'),
      timeout: 10000,
    });
  }

  /**
   * Create new coach profile
   */
  async createCoach(
    data: CreateCoachRequest,
    context: RequestContext
  ): Promise<CoachProfile> {
    return this.client.post<CoachProfile>('/coaches', data, context);
  }

  /**
   * Get coach profile
   */
  async getProfile(coachId: string, context: RequestContext): Promise<CoachProfile> {
    return this.client.get<CoachProfile>(`/coaches/${coachId}`, context);
  }

  /**
   * Update coach profile
   */
  async updateProfile(
    coachId: string,
    data: UpdateCoachRequest,
    context: RequestContext
  ): Promise<CoachProfile> {
    return this.client.put<CoachProfile>(`/coaches/${coachId}`, data, context);
  }

  /**
   * Delete coach profile
   */
  async deleteCoach(
    coachId: string,
    context: RequestContext
  ): Promise<{ success: boolean }> {
    return this.client.delete<{ success: boolean }>(`/coaches/${coachId}`, context);
  }

  /**
   * Get all coaches (admin only)
   */
  async listCoaches(context: RequestContext): Promise<CoachProfile[]> {
    return this.client.get<CoachProfile[]>('/coaches', context);
  }

  /**
   * Get student athletes assigned to coach
   */
  async getStudentAthletes(
    coachId: string,
    params: GetStudentAthletesRequest,
    context: RequestContext
  ): Promise<GetStudentAthletesResponse> {
    const queryParams = new URLSearchParams();
    if (params.sport) queryParams.append('sport', params.sport);
    if (params.team) queryParams.append('team', params.team);
    if (params.eligibilityStatus) queryParams.append('eligibilityStatus', params.eligibilityStatus);
    if (params.academicStanding) queryParams.append('academicStanding', params.academicStanding);
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.offset) queryParams.append('offset', params.offset.toString());

    const url = `/coaches/${coachId}/students${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.client.get<GetStudentAthletesResponse>(url, context);
  }

  /**
   * Get individual student athlete details
   */
  async getStudentDetails(
    coachId: string,
    studentId: string,
    context: RequestContext
  ): Promise<StudentAthleteInfo> {
    return this.client.get<StudentAthleteInfo>(
      `/coaches/${coachId}/students/${studentId}`,
      context
    );
  }

  /**
   * Get team analytics for coach
   */
  async getTeamAnalytics(
    coachId: string,
    context: RequestContext
  ): Promise<CoachTeamAnalytics> {
    return this.client.get<CoachTeamAnalytics>(
      `/coaches/${coachId}/analytics`,
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

export const coachService = new CoachServiceClient();
