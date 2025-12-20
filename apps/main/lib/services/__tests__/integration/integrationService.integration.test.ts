/**
 * Integration Service Integration Tests
 *
 * Tests the full integration flow including travel letters,
 * absence notifications, email, calendar, LMS/SIS sync, and transcripts.
 */

import { IntegrationService, integrationService } from '../../integrationService';
import { UserRole, type RequestContext } from '../../../middleware/authentication';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('IntegrationService Integration Tests', () => {
  const studentContext: RequestContext = {
    userId: 'student-123',
    clerkId: 'clerk_student123',
    role: UserRole.STUDENT,
    correlationId: 'corr-integration-123',
    timestamp: new Date('2024-01-15T10:00:00Z'),
  };

  const advisorContext: RequestContext = {
    userId: 'advisor-123',
    clerkId: 'clerk_advisor123',
    role: UserRole.ADVISOR,
    correlationId: 'corr-integration-456',
    timestamp: new Date('2024-01-15T10:00:00Z'),
  };

  const adminContext: RequestContext = {
    userId: 'admin-123',
    clerkId: 'clerk_admin123',
    role: UserRole.ADMIN,
    correlationId: 'corr-integration-789',
    timestamp: new Date('2024-01-15T10:00:00Z'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Travel Letter Generation', () => {
    it('should generate a travel letter for an away game', async () => {
      const travelLetterRequest = {
        studentId: 'student-123',
        eventType: 'AWAY_GAME',
        eventName: 'Conference Championship',
        destination: 'State University, Columbus, OH',
        departureDate: '2024-02-10',
        returnDate: '2024-02-12',
        courses: ['ECON201', 'MATH201', 'COMM150'],
        includeSchedule: true,
      };

      const expectedResponse = {
        letterId: 'letter-789',
        studentId: 'student-123',
        studentName: 'John Athlete',
        sport: 'Basketball',
        eventDetails: {
          name: 'Conference Championship',
          type: 'AWAY_GAME',
          destination: 'State University, Columbus, OH',
          departure: '2024-02-10T06:00:00Z',
          return: '2024-02-12T22:00:00Z',
        },
        affectedCourses: [
          {
            code: 'ECON201',
            name: 'Microeconomics',
            instructor: 'Dr. Smith',
            email: 'smith@university.edu',
            missedDates: ['2024-02-10', '2024-02-12'],
            missedAssignments: ['Quiz 3 - Due Feb 11'],
          },
          {
            code: 'MATH201',
            name: 'Calculus II',
            instructor: 'Prof. Johnson',
            email: 'johnson@university.edu',
            missedDates: ['2024-02-11'],
            missedAssignments: [],
          },
          {
            code: 'COMM150',
            name: 'Public Speaking',
            instructor: 'Dr. Williams',
            email: 'williams@university.edu',
            missedDates: ['2024-02-10'],
            missedAssignments: ['Presentation - Feb 10'],
          },
        ],
        letterUrl: 'https://storage.university.edu/letters/letter-789.pdf',
        status: 'GENERATED',
        generatedAt: '2024-01-15T10:00:00Z',
        sentTo: [],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => expectedResponse,
      });

      const result = await integrationService.generateTravelLetter(
        travelLetterRequest,
        advisorContext
      );

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];

      expect(url).toContain('/travel-letter');
      expect(options.method).toBe('POST');

      const body = JSON.parse(options.body);
      expect(body.eventType).toBe('AWAY_GAME');
      expect(body.courses).toHaveLength(3);

      expect(result.letterId).toBe('letter-789');
      expect(result.affectedCourses).toHaveLength(3);
      expect(result.letterUrl).toBeDefined();
    });

    it('should send travel letter to instructors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          letterId: 'letter-789',
          sentTo: ['smith@university.edu', 'johnson@university.edu', 'williams@university.edu'],
          sentAt: '2024-01-15T10:05:00Z',
          status: 'SENT',
          deliveryConfirmations: 3,
        }),
      });

      const result = await integrationService.sendTravelLetter('letter-789', advisorContext);

      expect(result.sentTo).toHaveLength(3);
      expect(result.status).toBe('SENT');
    });

    it('should handle invalid date range', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          error: {
            code: 'INVALID_DATE_RANGE',
            message: 'Return date must be after departure date',
          },
        }),
      });

      await expect(
        integrationService.generateTravelLetter(
          {
            studentId: 'student-123',
            eventType: 'AWAY_GAME',
            departureDate: '2024-02-12',
            returnDate: '2024-02-10', // Before departure
          },
          advisorContext
        )
      ).rejects.toMatchObject({
        statusCode: 400,
      });
    });
  });

  describe('Absence Notification', () => {
    it('should send absence notification to instructor', async () => {
      const absenceRequest = {
        studentId: 'student-123',
        courseId: 'course-econ201',
        date: '2024-02-10',
        reason: 'ATHLETIC_TRAVEL',
        eventName: 'Conference Championship',
        requestMakeup: true,
        notes: 'Will complete any missed work upon return',
      };

      const expectedResponse = {
        notificationId: 'notif-456',
        studentId: 'student-123',
        courseId: 'course-econ201',
        instructorId: 'instructor-789',
        instructorEmail: 'smith@university.edu',
        date: '2024-02-10',
        reason: 'ATHLETIC_TRAVEL',
        status: 'SENT',
        makeupRequested: true,
        sentAt: '2024-01-15T10:00:00Z',
        readAt: null,
        response: null,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => expectedResponse,
      });

      const result = await integrationService.sendAbsenceNotification(
        absenceRequest,
        studentContext
      );

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];

      expect(url).toContain('/absence-notification');
      expect(options.method).toBe('POST');

      expect(result.status).toBe('SENT');
      expect(result.makeupRequested).toBe(true);
    });

    it('should handle batch absence notifications', async () => {
      const batchRequest = {
        studentId: 'student-123',
        dates: ['2024-02-10', '2024-02-11', '2024-02-12'],
        reason: 'ATHLETIC_TRAVEL',
        eventName: 'Tournament',
        courses: ['ECON201', 'MATH201', 'COMM150'],
      };

      const expectedResponse = {
        batchId: 'batch-123',
        notifications: [
          { courseCode: 'ECON201', status: 'SENT', dates: ['2024-02-10', '2024-02-12'] },
          { courseCode: 'MATH201', status: 'SENT', dates: ['2024-02-11'] },
          { courseCode: 'COMM150', status: 'SENT', dates: ['2024-02-10'] },
        ],
        totalSent: 3,
        failedDeliveries: 0,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => expectedResponse,
      });

      const result = await integrationService.sendBatchAbsenceNotifications(
        batchRequest,
        advisorContext
      );

      expect(result.totalSent).toBe(3);
      expect(result.failedDeliveries).toBe(0);
    });
  });

  describe('Email Service', () => {
    it('should send an email', async () => {
      const emailRequest = {
        to: 'student@university.edu',
        subject: 'Academic Support Appointment Reminder',
        body: 'This is a reminder that you have an appointment...',
        template: 'APPOINTMENT_REMINDER',
        templateData: {
          appointmentDate: '2024-01-20',
          appointmentTime: '14:00',
          location: 'Academic Support Center',
        },
      };

      const expectedResponse = {
        success: true,
        messageId: 'msg-email-123',
        sentAt: '2024-01-15T10:00:00Z',
        recipient: 'student@university.edu',
        status: 'DELIVERED',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => expectedResponse,
      });

      const result = await integrationService.sendEmail(emailRequest, advisorContext);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];

      expect(url).toContain('/email/send');
      expect(options.method).toBe('POST');

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('msg-email-123');
    });

    it('should handle invalid email address', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          error: {
            code: 'INVALID_EMAIL',
            message: 'Invalid email address format',
          },
        }),
      });

      await expect(
        integrationService.sendEmail(
          { to: 'invalid-email', subject: 'Test', body: 'Test' },
          advisorContext
        )
      ).rejects.toMatchObject({
        statusCode: 400,
      });
    });

    it('should send bulk emails', async () => {
      const bulkRequest = {
        recipients: [
          'student1@university.edu',
          'student2@university.edu',
          'student3@university.edu',
        ],
        subject: 'Mandatory Study Hall Reminder',
        body: 'All student-athletes must complete study hall hours...',
        template: 'BULK_ANNOUNCEMENT',
      };

      const expectedResponse = {
        success: true,
        batchId: 'batch-email-456',
        totalRecipients: 3,
        successfulDeliveries: 3,
        failedDeliveries: 0,
        failures: [],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => expectedResponse,
      });

      const result = await integrationService.sendBulkEmail(bulkRequest, adminContext);

      expect(result.successfulDeliveries).toBe(3);
      expect(result.failedDeliveries).toBe(0);
    });
  });

  describe('Calendar Sync', () => {
    it('should sync calendar events', async () => {
      const syncRequest = {
        studentId: 'student-123',
        events: [
          {
            type: 'TUTORING',
            title: 'Math Tutoring Session',
            start: '2024-01-20T14:00:00Z',
            end: '2024-01-20T15:00:00Z',
            location: 'Academic Support Center',
          },
          {
            type: 'STUDY_HALL',
            title: 'Required Study Hall',
            start: '2024-01-20T18:00:00Z',
            end: '2024-01-20T20:00:00Z',
            location: 'Athletics Study Hall',
          },
        ],
        calendarProvider: 'GOOGLE',
      };

      const expectedResponse = {
        success: true,
        synced: 2,
        events: [
          { localId: 'event-1', externalId: 'gcal-abc123', status: 'SYNCED' },
          { localId: 'event-2', externalId: 'gcal-def456', status: 'SYNCED' },
        ],
        lastSync: '2024-01-15T10:00:00Z',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => expectedResponse,
      });

      const result = await integrationService.syncCalendar(syncRequest, studentContext);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];

      expect(url).toContain('/calendar/sync');
      expect(options.method).toBe('POST');

      expect(result.success).toBe(true);
      expect(result.synced).toBe(2);
    });

    it('should handle calendar provider not connected', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          error: {
            code: 'CALENDAR_NOT_CONNECTED',
            message: 'Google Calendar is not connected',
            authUrl: 'https://accounts.google.com/oauth/authorize?...',
          },
        }),
      });

      await expect(
        integrationService.syncCalendar(
          { studentId: 'student-123', events: [], calendarProvider: 'GOOGLE' },
          studentContext
        )
      ).rejects.toMatchObject({
        statusCode: 401,
      });
    });
  });

  describe('LMS Integration', () => {
    it('should sync with LMS (Canvas/Blackboard)', async () => {
      const lmsSyncRequest = {
        studentId: 'student-123',
        lmsProvider: 'CANVAS',
        syncTypes: ['GRADES', 'ASSIGNMENTS', 'ANNOUNCEMENTS'],
      };

      const expectedResponse = {
        success: true,
        lmsProvider: 'CANVAS',
        lastSync: '2024-01-15T10:00:00Z',
        data: {
          courses: [
            {
              id: 'canvas-course-1',
              name: 'Microeconomics',
              code: 'ECON201',
              currentGrade: 'B+',
              gradePercentage: 87.5,
            },
            {
              id: 'canvas-course-2',
              name: 'Calculus II',
              code: 'MATH201',
              currentGrade: 'B',
              gradePercentage: 83.2,
            },
          ],
          upcomingAssignments: [
            {
              course: 'ECON201',
              name: 'Problem Set 5',
              dueDate: '2024-01-22T23:59:00Z',
              points: 50,
            },
            {
              course: 'MATH201',
              name: 'Quiz 4',
              dueDate: '2024-01-25T14:00:00Z',
              points: 25,
            },
          ],
          recentAnnouncements: [
            {
              course: 'ECON201',
              title: 'Office Hours Change',
              date: '2024-01-14T09:00:00Z',
            },
          ],
        },
        syncedRecords: 15,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => expectedResponse,
      });

      const result = await integrationService.syncLMS(lmsSyncRequest, studentContext);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];

      expect(url).toContain('/lms/sync');
      expect(options.method).toBe('POST');

      expect(result.success).toBe(true);
      expect(result.data.courses).toHaveLength(2);
      expect(result.data.upcomingAssignments).toHaveLength(2);
    });

    it('should handle LMS authentication expired', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          error: {
            code: 'LMS_AUTH_EXPIRED',
            message: 'Canvas authentication has expired',
            reauthorizeUrl: 'https://canvas.university.edu/oauth/authorize',
          },
        }),
      });

      await expect(
        integrationService.syncLMS(
          { studentId: 'student-123', lmsProvider: 'CANVAS' },
          studentContext
        )
      ).rejects.toMatchObject({
        statusCode: 401,
      });
    });
  });

  describe('SIS Import', () => {
    it('should import data from SIS', async () => {
      const sisImportRequest = {
        importType: 'ENROLLMENT',
        termId: 'spring-2024',
        filters: {
          sport: 'BASKETBALL',
        },
      };

      const expectedResponse = {
        success: true,
        importId: 'import-789',
        importType: 'ENROLLMENT',
        termId: 'spring-2024',
        recordsImported: 45,
        recordsUpdated: 12,
        recordsFailed: 0,
        summary: {
          newEnrollments: 45,
          droppedCourses: 3,
          addedCourses: 8,
        },
        completedAt: '2024-01-15T10:02:00Z',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => expectedResponse,
      });

      const result = await integrationService.importSIS(sisImportRequest, adminContext);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];

      expect(url).toContain('/sis/import');
      expect(options.method).toBe('POST');

      expect(result.success).toBe(true);
      expect(result.recordsImported).toBe(45);
    });

    it('should handle SIS connection error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          error: {
            code: 'SIS_UNAVAILABLE',
            message: 'Student Information System is currently unavailable',
            retryAfter: 300,
          },
        }),
      });

      await expect(
        integrationService.importSIS({ importType: 'ENROLLMENT', termId: 'spring-2024' }, adminContext)
      ).rejects.toMatchObject({
        statusCode: 503,
      });
    });

    it('should handle partial import failure', async () => {
      const expectedResponse = {
        success: true, // Overall success, but with some failures
        importId: 'import-partial',
        recordsImported: 40,
        recordsFailed: 5,
        failures: [
          { studentId: 'student-101', error: 'Missing required field: major' },
          { studentId: 'student-102', error: 'Invalid course code: XYZ999' },
        ],
        completedAt: '2024-01-15T10:02:00Z',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => expectedResponse,
      });

      const result = await integrationService.importSIS(
        { importType: 'ENROLLMENT', termId: 'spring-2024' },
        adminContext
      );

      expect(result.recordsFailed).toBe(5);
      expect(result.failures).toHaveLength(2);
    });
  });

  describe('Transcript Retrieval', () => {
    it('should retrieve transcript as JSON', async () => {
      const expectedTranscript = {
        studentId: 'student-123',
        studentName: 'John Athlete',
        major: 'Business Administration',
        minor: 'Communications',
        cumulativeGpa: 3.25,
        totalCredits: 75,
        terms: [
          {
            termId: 'fall-2023',
            termName: 'Fall 2023',
            gpa: 3.4,
            credits: 15,
            courses: [
              { code: 'ECON201', name: 'Microeconomics', credits: 3, grade: 'A-' },
              { code: 'MATH201', name: 'Calculus II', credits: 4, grade: 'B+' },
              { code: 'COMM150', name: 'Public Speaking', credits: 3, grade: 'A' },
              { code: 'HIST101', name: 'US History', credits: 3, grade: 'B' },
              { code: 'PHYS101', name: 'Physics I', credits: 2, grade: 'B+' },
            ],
          },
        ],
        degreeProgress: {
          percentComplete: 62.5,
          creditsRemaining: 45,
          projectedGraduation: 'May 2026',
        },
        generatedAt: '2024-01-15T10:00:00Z',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => expectedTranscript,
      });

      const result = await integrationService.getTranscript('student-123', 'JSON', studentContext);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url] = mockFetch.mock.calls[0];

      expect(url).toContain('/transcript/student-123');
      expect(url).toContain('format=JSON');

      expect(result.cumulativeGpa).toBe(3.25);
      expect(result.terms[0].courses).toHaveLength(5);
    });

    it('should retrieve transcript as PDF', async () => {
      const expectedResponse = {
        studentId: 'student-123',
        format: 'PDF',
        url: 'https://storage.university.edu/transcripts/student-123-official.pdf',
        generatedAt: '2024-01-15T10:00:00Z',
        expiresAt: '2024-01-15T11:00:00Z', // PDF link expires
        isOfficial: true,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => expectedResponse,
      });

      const result = await integrationService.getTranscript('student-123', 'PDF', studentContext);

      expect(result.url).toBeDefined();
      expect(result.format).toBe('PDF');
      expect(result.isOfficial).toBe(true);
    });

    it('should handle unauthorized transcript access', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          error: {
            code: 'FORBIDDEN',
            message: 'Cannot access transcript for other students',
          },
        }),
      });

      await expect(
        integrationService.getTranscript('other-student-456', 'JSON', studentContext)
      ).rejects.toMatchObject({
        statusCode: 403,
      });
    });
  });

  describe('Webhook Management', () => {
    it('should register a webhook for grade updates', async () => {
      const webhookRequest = {
        event: 'GRADE_UPDATE',
        url: 'https://app.university.edu/webhooks/grades',
        secret: 'webhook-secret-123',
        filters: {
          sports: ['BASKETBALL', 'FOOTBALL'],
        },
      };

      const expectedResponse = {
        webhookId: 'webhook-789',
        event: 'GRADE_UPDATE',
        url: 'https://app.university.edu/webhooks/grades',
        status: 'ACTIVE',
        createdAt: '2024-01-15T10:00:00Z',
        lastTriggered: null,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => expectedResponse,
      });

      const result = await integrationService.registerWebhook(webhookRequest, adminContext);

      expect(result.webhookId).toBe('webhook-789');
      expect(result.status).toBe('ACTIVE');
    });
  });

  describe('Error Handling', () => {
    it('should handle external service timeout', async () => {
      mockFetch.mockImplementationOnce(() => new Promise(() => {}));

      const promise = integrationService.syncLMS(
        { studentId: 'student-123', lmsProvider: 'CANVAS' },
        studentContext
      );

      await jest.advanceTimersByTimeAsync(31000);

      await expect(promise).rejects.toThrow();
    });

    it('should handle rate limiting from external service', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        headers: new Headers({
          'content-type': 'application/json',
          'retry-after': '60',
        }),
        json: async () => ({
          error: {
            code: 'RATE_LIMITED',
            message: 'Too many requests to external service',
            retryAfter: 60,
          },
        }),
      });

      await expect(
        integrationService.syncCalendar(
          { studentId: 'student-123', events: [], calendarProvider: 'GOOGLE' },
          studentContext
        )
      ).rejects.toMatchObject({
        statusCode: 429,
      });
    });
  });
});
