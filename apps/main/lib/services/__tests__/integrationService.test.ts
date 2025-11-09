/**
 * IntegrationService Unit Tests
 * Tests for the Integration Service client
 */

import { integrationService } from '../integrationService';
import { ServiceClient } from '../serviceClient';
import { RequestContext, UserRole } from '../../types/services/common';

// Mock ServiceClient
jest.mock('../serviceClient');

describe('IntegrationService', () => {
  const mockContext: RequestContext = {
    userId: 'user-123',
    clerkId: 'clerk-123',
    role: UserRole.ADMIN,
    correlationId: 'corr-123',
    timestamp: new Date(),
  };

  let mockPost: jest.Mock;
  let mockGet: jest.Mock;
  let mockHealthCheck: jest.Mock;

  beforeEach(() => {
    mockPost = jest.fn();
    mockGet = jest.fn();
    mockHealthCheck = jest.fn();

    (ServiceClient as jest.Mock).mockImplementation(() => ({
      post: mockPost,
      get: mockGet,
      healthCheck: mockHealthCheck,
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateTravelLetter', () => {
    it('should generate travel letter', async () => {
      const travelRequest = {
        studentId: 'student-123',
        destination: 'University of State',
        departureDate: '2024-11-20',
        returnDate: '2024-11-22',
        reason: 'Basketball game',
      };

      const mockLetter = {
        letterId: 'letter-123',
        pdfUrl: 'https://example.com/letter.pdf',
        generatedAt: new Date().toISOString(),
      };

      mockPost.mockResolvedValueOnce(mockLetter);

      const result = await integrationService.generateTravelLetter(travelRequest, mockContext);

      expect(result).toEqual(mockLetter);
      expect(mockPost).toHaveBeenCalledWith('/travel-letter', travelRequest, mockContext);
    });

    it('should handle invalid travel dates', async () => {
      const travelRequest = {
        studentId: 'student-123',
        destination: 'University of State',
        departureDate: '2024-11-22',
        returnDate: '2024-11-20',
        reason: 'Basketball game',
      };

      mockPost.mockRejectedValueOnce(new Error('Invalid date range'));

      await expect(
        integrationService.generateTravelLetter(travelRequest, mockContext)
      ).rejects.toThrow('Invalid date range');
    });
  });

  describe('sendAbsenceNotification', () => {
    it('should send absence notification', async () => {
      const absenceNotification = {
        studentId: 'student-123',
        courseId: 'CS101',
        facultyEmail: 'professor@example.com',
        absenceDate: '2024-11-20',
        reason: 'Athletic competition',
      };

      mockPost.mockResolvedValueOnce({ success: true });

      const result = await integrationService.sendAbsenceNotification(
        absenceNotification,
        mockContext
      );

      expect(result.success).toBe(true);
      expect(mockPost).toHaveBeenCalledWith('/absence-notification', absenceNotification, mockContext);
    });

    it('should handle notification failures', async () => {
      const absenceNotification = {
        studentId: 'student-123',
        courseId: 'CS101',
        facultyEmail: 'invalid-email',
        absenceDate: '2024-11-20',
      };

      mockPost.mockRejectedValueOnce(new Error('Invalid email address'));

      await expect(
        integrationService.sendAbsenceNotification(absenceNotification, mockContext)
      ).rejects.toThrow('Invalid email address');
    });
  });

  describe('sendEmail', () => {
    it('should send email successfully', async () => {
      const emailRequest = {
        to: ['student@example.com'],
        subject: 'Important Update',
        body: 'Your schedule has been updated...',
        from: 'noreply@aah.com',
      };

      const mockResponse = {
        messageId: 'email-123',
        status: 'sent',
        sentAt: new Date().toISOString(),
      };

      mockPost.mockResolvedValueOnce(mockResponse);

      const result = await integrationService.sendEmail(emailRequest, mockContext);

      expect(result).toEqual(mockResponse);
      expect(result.status).toBe('sent');
      expect(mockPost).toHaveBeenCalledWith('/email/send', emailRequest, mockContext);
    });

    it('should handle multiple recipients', async () => {
      const emailRequest = {
        to: ['student1@example.com', 'student2@example.com', 'student3@example.com'],
        subject: 'Team Meeting',
        body: 'Meeting scheduled for tomorrow...',
      };

      const mockResponse = {
        messageId: 'email-456',
        status: 'sent',
        sentAt: new Date().toISOString(),
      };

      mockPost.mockResolvedValueOnce(mockResponse);

      const result = await integrationService.sendEmail(emailRequest, mockContext);

      expect(result.status).toBe('sent');
    });
  });

  describe('syncCalendar', () => {
    it('should sync calendar events', async () => {
      const syncRequest = {
        userId: 'user-123',
        calendarType: 'google',
        events: [
          {
            title: 'Practice',
            start: '2024-11-20T14:00:00Z',
            end: '2024-11-20T16:00:00Z',
          },
          {
            title: 'Game',
            start: '2024-11-22T19:00:00Z',
            end: '2024-11-22T21:00:00Z',
          },
        ],
      };

      const mockResponse = {
        success: true,
        synced: 2,
      };

      mockPost.mockResolvedValueOnce(mockResponse);

      const result = await integrationService.syncCalendar(syncRequest, mockContext);

      expect(result).toEqual(mockResponse);
      expect(result.synced).toBe(2);
      expect(mockPost).toHaveBeenCalledWith('/calendar/sync', syncRequest, mockContext);
    });

    it('should handle calendar sync failures', async () => {
      const syncRequest = {
        userId: 'user-123',
        calendarType: 'invalid',
        events: [],
      };

      mockPost.mockRejectedValueOnce(new Error('Unsupported calendar type'));

      await expect(
        integrationService.syncCalendar(syncRequest, mockContext)
      ).rejects.toThrow('Unsupported calendar type');
    });
  });

  describe('syncLMS', () => {
    it('should sync with LMS', async () => {
      const lmsRequest = {
        studentId: 'student-123',
        lmsType: 'canvas',
      };

      const mockLMSData = {
        courses: [
          {
            id: 'course-1',
            name: 'Computer Science 101',
            grade: 'A',
            assignments: 15,
          },
          {
            id: 'course-2',
            name: 'Mathematics 201',
            grade: 'B+',
            assignments: 12,
          },
        ],
        lastSync: new Date().toISOString(),
      };

      mockPost.mockResolvedValueOnce(mockLMSData);

      const result = await integrationService.syncLMS(lmsRequest, mockContext);

      expect(result).toEqual(mockLMSData);
      expect(result.courses).toHaveLength(2);
      expect(mockPost).toHaveBeenCalledWith('/lms/sync', lmsRequest, mockContext);
    });

    it('should handle LMS authentication errors', async () => {
      const lmsRequest = {
        studentId: 'student-123',
        lmsType: 'canvas',
      };

      mockPost.mockRejectedValueOnce(new Error('LMS authentication failed'));

      await expect(
        integrationService.syncLMS(lmsRequest, mockContext)
      ).rejects.toThrow('LMS authentication failed');
    });
  });

  describe('importSIS', () => {
    it('should import SIS data', async () => {
      const sisRequest = {
        semester: 'Fall 2024',
        dataType: 'enrollment',
      };

      const mockResponse = {
        success: true,
        recordsImported: 150,
      };

      mockPost.mockResolvedValueOnce(mockResponse);

      const result = await integrationService.importSIS(sisRequest, mockContext);

      expect(result).toEqual(mockResponse);
      expect(result.recordsImported).toBe(150);
      expect(mockPost).toHaveBeenCalledWith('/sis/import', sisRequest, mockContext);
    });

    it('should handle SIS import errors', async () => {
      const sisRequest = {
        semester: 'Fall 2024',
        dataType: 'invalid',
      };

      mockPost.mockRejectedValueOnce(new Error('Invalid data type'));

      await expect(
        integrationService.importSIS(sisRequest, mockContext)
      ).rejects.toThrow('Invalid data type');
    });
  });

  describe('getTranscript', () => {
    it('should retrieve transcript in PDF format', async () => {
      const studentId = 'student-123';
      const format = 'PDF';

      const mockTranscript = {
        studentId,
        format,
        url: 'https://example.com/transcript.pdf',
        generatedAt: new Date().toISOString(),
      };

      mockGet.mockResolvedValueOnce(mockTranscript);

      const result = await integrationService.getTranscript(studentId, format, mockContext);

      expect(result).toEqual(mockTranscript);
      expect(result.format).toBe('PDF');
      expect(mockGet).toHaveBeenCalledWith(
        `/transcript/${studentId}?format=${format}`,
        mockContext
      );
    });

    it('should retrieve transcript in JSON format', async () => {
      const studentId = 'student-123';
      const format = 'JSON';

      const mockTranscript = {
        studentId,
        format,
        data: {
          courses: [
            { code: 'CS101', grade: 'A', credits: 3 },
            { code: 'MATH201', grade: 'B+', credits: 4 },
          ],
          gpa: 3.5,
        },
        generatedAt: new Date().toISOString(),
      };

      mockGet.mockResolvedValueOnce(mockTranscript);

      const result = await integrationService.getTranscript(studentId, format, mockContext);

      expect(result).toEqual(mockTranscript);
      expect(result.format).toBe('JSON');
      expect(result.data.courses).toHaveLength(2);
    });

    it('should handle missing transcript', async () => {
      const studentId = 'nonexistent-123';
      const format = 'PDF';

      mockGet.mockRejectedValueOnce(new Error('Transcript not found'));

      await expect(
        integrationService.getTranscript(studentId, format, mockContext)
      ).rejects.toThrow('Transcript not found');
    });
  });

  describe('health', () => {
    it('should check service health', async () => {
      mockHealthCheck.mockResolvedValueOnce({ status: 'healthy' });

      const result = await integrationService.health();

      expect(result).toEqual({ status: 'healthy' });
      expect(mockHealthCheck).toHaveBeenCalled();
    });

    it('should detect unhealthy service', async () => {
      mockHealthCheck.mockResolvedValueOnce({ status: 'unhealthy' });

      const result = await integrationService.health();

      expect(result.status).toBe('unhealthy');
    });
  });
});
