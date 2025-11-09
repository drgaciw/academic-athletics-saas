import axios, { AxiosInstance } from 'axios';

export interface TranscriptRequest {
  studentId: string;
  studentName: string;
  studentEmail: string;
  recipientName?: string;
  recipientEmail?: string;
  recipientAddress?: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  deliveryMethod: 'electronic' | 'mail';
  purpose?: string;
  urgent?: boolean;
}

export interface TranscriptStatus {
  id: string;
  status: 'pending' | 'processing' | 'sent' | 'delivered' | 'failed';
  requestedAt: string;
  sentAt?: string;
  deliveredAt?: string;
  trackingNumber?: string;
  error?: string;
}

export interface TranscriptResult {
  success: boolean;
  requestId?: string;
  status?: TranscriptStatus;
  error?: string;
}

/**
 * Transcript Service
 * Integrates with Parchment and National Student Clearinghouse (NSC)
 * for official transcript requests and verification
 */
export class TranscriptService {
  private parchmentClient: AxiosInstance | null = null;
  private nscClient: AxiosInstance | null = null;

  constructor() {
    // Initialize Parchment API client
    if (process.env.PARCHMENT_API_URL && process.env.PARCHMENT_API_KEY) {
      this.parchmentClient = axios.create({
        baseURL: process.env.PARCHMENT_API_URL,
        headers: {
          'Authorization': `Bearer ${process.env.PARCHMENT_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      });
    }

    // Initialize NSC API client
    if (process.env.NSC_API_URL && process.env.NSC_API_KEY) {
      this.nscClient = axios.create({
        baseURL: process.env.NSC_API_URL,
        headers: {
          'Authorization': `Bearer ${process.env.NSC_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      });
    }
  }

  /**
   * Request official transcript via Parchment
   */
  async requestTranscript(request: TranscriptRequest): Promise<TranscriptResult> {
    try {
      if (!this.parchmentClient) {
        throw new Error('Parchment API not configured');
      }

      const response = await this.parchmentClient.post('/api/v1/transcript-requests', {
        student_id: request.studentId,
        student_name: request.studentName,
        student_email: request.studentEmail,
        recipient_name: request.recipientName,
        recipient_email: request.recipientEmail,
        recipient_address: request.recipientAddress ? {
          street_address: request.recipientAddress.street,
          city: request.recipientAddress.city,
          state: request.recipientAddress.state,
          postal_code: request.recipientAddress.zip,
        } : undefined,
        delivery_method: request.deliveryMethod,
        purpose: request.purpose,
        rush_processing: request.urgent || false,
      });

      return {
        success: true,
        requestId: response.data.request_id,
        status: {
          id: response.data.request_id,
          status: 'pending',
          requestedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error('Parchment transcript request error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to request transcript',
      };
    }
  }

  /**
   * Get transcript request status
   */
  async getTranscriptStatus(requestId: string): Promise<TranscriptResult> {
    try {
      if (!this.parchmentClient) {
        throw new Error('Parchment API not configured');
      }

      const response = await this.parchmentClient.get(
        `/api/v1/transcript-requests/${requestId}`
      );

      const status: TranscriptStatus = {
        id: response.data.request_id,
        status: this.mapParchmentStatus(response.data.status),
        requestedAt: response.data.requested_at,
        sentAt: response.data.sent_at,
        deliveredAt: response.data.delivered_at,
        trackingNumber: response.data.tracking_number,
        error: response.data.error_message,
      };

      return {
        success: true,
        requestId: response.data.request_id,
        status,
      };
    } catch (error) {
      console.error('Parchment status check error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get transcript status',
      };
    }
  }

  /**
   * Verify enrollment via National Student Clearinghouse
   */
  async verifyEnrollment(studentId: string): Promise<{
    success: boolean;
    isEnrolled?: boolean;
    enrollmentData?: {
      institutionName: string;
      enrollmentStatus: string;
      enrollmentBegin: string;
      enrollmentEnd?: string;
      degreeTitle?: string;
      majorField?: string;
    };
    error?: string;
  }> {
    try {
      if (!this.nscClient) {
        throw new Error('NSC API not configured');
      }

      const response = await this.nscClient.post('/api/enrollment-verification', {
        student_id: studentId,
      });

      return {
        success: true,
        isEnrolled: response.data.is_enrolled,
        enrollmentData: response.data.enrollment_info ? {
          institutionName: response.data.enrollment_info.institution_name,
          enrollmentStatus: response.data.enrollment_info.enrollment_status,
          enrollmentBegin: response.data.enrollment_info.enrollment_begin,
          enrollmentEnd: response.data.enrollment_info.enrollment_end,
          degreeTitle: response.data.enrollment_info.degree_title,
          majorField: response.data.enrollment_info.major_field,
        } : undefined,
      };
    } catch (error) {
      console.error('NSC enrollment verification error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to verify enrollment',
      };
    }
  }

  /**
   * Verify degree via National Student Clearinghouse
   */
  async verifyDegree(studentId: string): Promise<{
    success: boolean;
    hasDegree?: boolean;
    degreeData?: {
      degreeTitle: string;
      majorField: string;
      degreeDate: string;
      institutionName: string;
    }[];
    error?: string;
  }> {
    try {
      if (!this.nscClient) {
        throw new Error('NSC API not configured');
      }

      const response = await this.nscClient.post('/api/degree-verification', {
        student_id: studentId,
      });

      return {
        success: true,
        hasDegree: response.data.has_degree,
        degreeData: response.data.degrees?.map((degree: any) => ({
          degreeTitle: degree.degree_title,
          majorField: degree.major_field,
          degreeDate: degree.degree_date,
          institutionName: degree.institution_name,
        })),
      };
    } catch (error) {
      console.error('NSC degree verification error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to verify degree',
      };
    }
  }

  /**
   * Request electronic transcript delivery
   */
  async sendElectronicTranscript(options: {
    studentId: string;
    recipientEmail: string;
    purpose?: string;
  }): Promise<TranscriptResult> {
    return this.requestTranscript({
      studentId: options.studentId,
      studentName: '', // Will be fetched from system
      studentEmail: '', // Will be fetched from system
      recipientEmail: options.recipientEmail,
      deliveryMethod: 'electronic',
      purpose: options.purpose,
    });
  }

  /**
   * Request physical transcript delivery
   */
  async sendPhysicalTranscript(options: {
    studentId: string;
    recipientName: string;
    recipientAddress: {
      street: string;
      city: string;
      state: string;
      zip: string;
    };
    urgent?: boolean;
  }): Promise<TranscriptResult> {
    return this.requestTranscript({
      studentId: options.studentId,
      studentName: '', // Will be fetched from system
      studentEmail: '', // Will be fetched from system
      recipientName: options.recipientName,
      recipientAddress: options.recipientAddress,
      deliveryMethod: 'mail',
      urgent: options.urgent,
    });
  }

  /**
   * Batch transcript requests
   */
  async batchRequestTranscripts(
    requests: TranscriptRequest[]
  ): Promise<TranscriptResult[]> {
    const results: TranscriptResult[] = [];

    for (const request of requests) {
      const result = await this.requestTranscript(request);
      results.push(result);

      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    return results;
  }

  /**
   * Cancel transcript request
   */
  async cancelTranscriptRequest(requestId: string): Promise<TranscriptResult> {
    try {
      if (!this.parchmentClient) {
        throw new Error('Parchment API not configured');
      }

      await this.parchmentClient.delete(`/api/v1/transcript-requests/${requestId}`);

      return {
        success: true,
        requestId,
      };
    } catch (error) {
      console.error('Transcript cancellation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to cancel transcript request',
      };
    }
  }

  /**
   * Get transcript request history for a student
   */
  async getTranscriptHistory(studentId: string): Promise<{
    success: boolean;
    requests?: TranscriptStatus[];
    error?: string;
  }> {
    try {
      if (!this.parchmentClient) {
        throw new Error('Parchment API not configured');
      }

      const response = await this.parchmentClient.get('/api/v1/transcript-requests', {
        params: {
          student_id: studentId,
        },
      });

      const requests: TranscriptStatus[] = response.data.map((req: any) => ({
        id: req.request_id,
        status: this.mapParchmentStatus(req.status),
        requestedAt: req.requested_at,
        sentAt: req.sent_at,
        deliveredAt: req.delivered_at,
        trackingNumber: req.tracking_number,
        error: req.error_message,
      }));

      return {
        success: true,
        requests,
      };
    } catch (error) {
      console.error('Transcript history fetch error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get transcript history',
      };
    }
  }

  /**
   * Map Parchment status to our system status
   */
  private mapParchmentStatus(status: string): TranscriptStatus['status'] {
    const statusMap: Record<string, TranscriptStatus['status']> = {
      'submitted': 'pending',
      'processing': 'processing',
      'sent': 'sent',
      'delivered': 'delivered',
      'failed': 'failed',
      'error': 'failed',
    };

    return statusMap[status.toLowerCase()] || 'pending';
  }

  /**
   * Check service connection health
   */
  async checkConnections(): Promise<{
    parchment: boolean;
    nsc: boolean;
  }> {
    const results = {
      parchment: false,
      nsc: false,
    };

    // Check Parchment
    if (this.parchmentClient) {
      try {
        await this.parchmentClient.get('/api/v1/health');
        results.parchment = true;
      } catch (error) {
        console.error('Parchment connection check failed:', error);
      }
    }

    // Check NSC
    if (this.nscClient) {
      try {
        await this.nscClient.get('/api/health');
        results.nsc = true;
      } catch (error) {
        console.error('NSC connection check failed:', error);
      }
    }

    return results;
  }
}

export const transcriptService = new TranscriptService();
