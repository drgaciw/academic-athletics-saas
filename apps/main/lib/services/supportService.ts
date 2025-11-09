/**
 * Support Service Client
 * Type-safe client for Support Service endpoints
 */

import { ServiceClient, getServiceUrl } from './serviceClient';
import {
  TutoringSession,
  BookTutoringRequest,
  TutorAvailability,
  StudyHallCheckIn,
  CheckInRequest,
  AttendanceRecord,
  Workshop,
  WorkshopRegistration,
  RegisterWorkshopRequest,
  MentorMatch,
  MentoringSession,
  ScheduleMentoringRequest,
  RequestContext,
} from '../types/services';

class SupportServiceClient {
  private client: ServiceClient;

  constructor() {
    this.client = new ServiceClient('support', {
      baseUrl: getServiceUrl('support'),
      timeout: 10000,
    });
  }

  /**
   * Book tutoring session
   */
  async bookTutoring(
    data: BookTutoringRequest,
    context: RequestContext
  ): Promise<TutoringSession> {
    return this.client.post<TutoringSession>('/tutoring/book', data, context);
  }

  /**
   * Check tutor availability
   */
  async getTutorAvailability(
    courseId: string,
    context: RequestContext
  ): Promise<TutorAvailability[]> {
    return this.client.get<TutorAvailability[]>(
      `/tutoring/availability?courseId=${courseId}`,
      context
    );
  }

  /**
   * Check in to study hall
   */
  async checkInStudyHall(
    data: CheckInRequest,
    context: RequestContext
  ): Promise<StudyHallCheckIn> {
    return this.client.post<StudyHallCheckIn>(
      '/study-hall/checkin',
      data,
      context
    );
  }

  /**
   * Get study hall attendance records
   */
  async getAttendance(
    studentId: string,
    context: RequestContext
  ): Promise<AttendanceRecord> {
    return this.client.get<AttendanceRecord>(
      `/study-hall/attendance?studentId=${studentId}`,
      context
    );
  }

  /**
   * Register for workshop
   */
  async registerWorkshop(
    data: RegisterWorkshopRequest,
    context: RequestContext
  ): Promise<WorkshopRegistration> {
    return this.client.post<WorkshopRegistration>(
      '/workshop/register',
      data,
      context
    );
  }

  /**
   * Get available workshops
   */
  async getWorkshops(context: RequestContext): Promise<Workshop[]> {
    return this.client.get<Workshop[]>('/workshops', context);
  }

  /**
   * Get mentor matches
   */
  async getMentorMatches(
    studentId: string,
    context: RequestContext
  ): Promise<MentorMatch[]> {
    return this.client.get<MentorMatch[]>(
      `/mentoring/matches?studentId=${studentId}`,
      context
    );
  }

  /**
   * Schedule mentoring session
   */
  async scheduleMentoringSession(
    data: ScheduleMentoringRequest,
    context: RequestContext
  ): Promise<MentoringSession> {
    return this.client.post<MentoringSession>(
      '/mentoring/session',
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

export const supportService = new SupportServiceClient();
