/**
 * Integration Service Client
 * Type-safe client for Integration Service endpoints
 */

import { ServiceClient, getServiceUrl } from './serviceClient';
import {
  TravelLetterRequest,
  TravelLetterResponse,
  AbsenceNotification,
  EmailRequest,
  EmailResponse,
  CalendarSyncRequest,
  LMSSyncRequest,
  LMSData,
  SISImportRequest,
  TranscriptRequest,
  TranscriptResponse,
  RequestContext,
} from '../types/services';

class IntegrationServiceClient {
  private client: ServiceClient;

  constructor() {
    this.client = new ServiceClient('integration', {
      baseUrl: getServiceUrl('integration'),
      timeout: 30000, // External integrations can be slow
    });
  }

  /**
   * Generate travel letter
   */
  async generateTravelLetter(
    data: TravelLetterRequest,
    context: RequestContext
  ): Promise<TravelLetterResponse> {
    return this.client.post<TravelLetterResponse>(
      '/travel-letter',
      data,
      context
    );
  }

  /**
   * Send absence notification
   */
  async sendAbsenceNotification(
    data: AbsenceNotification,
    context: RequestContext
  ): Promise<{ success: boolean }> {
    return this.client.post<{ success: boolean }>(
      '/absence-notification',
      data,
      context
    );
  }

  /**
   * Send email
   */
  async sendEmail(
    data: EmailRequest,
    context: RequestContext
  ): Promise<EmailResponse> {
    return this.client.post<EmailResponse>('/email/send', data, context);
  }

  /**
   * Sync calendar events
   */
  async syncCalendar(
    data: CalendarSyncRequest,
    context: RequestContext
  ): Promise<{ success: boolean; synced: number }> {
    return this.client.post<{ success: boolean; synced: number }>(
      '/calendar/sync',
      data,
      context
    );
  }

  /**
   * Sync with LMS
   */
  async syncLMS(
    data: LMSSyncRequest,
    context: RequestContext
  ): Promise<LMSData> {
    return this.client.post<LMSData>('/lms/sync', data, context);
  }

  /**
   * Import SIS data
   */
  async importSIS(
    data: SISImportRequest,
    context: RequestContext
  ): Promise<{ success: boolean; recordsImported: number }> {
    return this.client.post<{ success: boolean; recordsImported: number }>(
      '/sis/import',
      data,
      context
    );
  }

  /**
   * Retrieve transcript
   */
  async getTranscript(
    studentId: string,
    format: 'PDF' | 'JSON',
    context: RequestContext
  ): Promise<TranscriptResponse> {
    return this.client.get<TranscriptResponse>(
      `/transcript/${studentId}?format=${format}`,
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

export const integrationService = new IntegrationServiceClient();
