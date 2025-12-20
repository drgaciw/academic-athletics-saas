/**
 * Support Service Integration Tests
 *
 * Tests the full support flow including tutoring sessions,
 * study hall check-ins, workshops, and mentoring.
 */

import { SupportService, supportService } from '../../supportService';
import { UserRole, type RequestContext } from '../../../middleware/authentication';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('SupportService Integration Tests', () => {
  const studentContext: RequestContext = {
    userId: 'student-123',
    clerkId: 'clerk_student123',
    role: UserRole.STUDENT,
    correlationId: 'corr-support-123',
    timestamp: new Date('2024-01-15T10:00:00Z'),
  };

  const advisorContext: RequestContext = {
    userId: 'advisor-123',
    clerkId: 'clerk_advisor123',
    role: UserRole.ADVISOR,
    correlationId: 'corr-support-456',
    timestamp: new Date('2024-01-15T10:00:00Z'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Tutoring Session Booking', () => {
    it('should book a tutoring session successfully', async () => {
      const bookingRequest = {
        studentId: 'student-123',
        courseId: 'course-math201',
        tutorId: 'tutor-456',
        preferredDate: '2024-01-20',
        preferredTime: '14:00',
        duration: 60,
        notes: 'Need help with calculus derivatives',
      };

      const expectedResponse = {
        id: 'session-789',
        studentId: 'student-123',
        tutorId: 'tutor-456',
        tutorName: 'Jane Smith',
        courseId: 'course-math201',
        courseName: 'Calculus II',
        scheduledAt: '2024-01-20T14:00:00Z',
        duration: 60,
        status: 'SCHEDULED',
        location: 'Academic Support Center, Room 201',
        meetingLink: null,
        notes: 'Need help with calculus derivatives',
        confirmationSent: true,
        reminderScheduled: true,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => expectedResponse,
      });

      const result = await supportService.bookTutoring(bookingRequest, studentContext);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];

      expect(url).toContain('/tutoring/book');
      expect(options.method).toBe('POST');

      const body = JSON.parse(options.body);
      expect(body.courseId).toBe('course-math201');
      expect(body.duration).toBe(60);

      expect(result.id).toBe('session-789');
      expect(result.status).toBe('SCHEDULED');
      expect(result.confirmationSent).toBe(true);
    });

    it('should handle tutor unavailable', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 409,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          error: {
            code: 'TUTOR_UNAVAILABLE',
            message: 'Tutor is not available at the requested time',
            availableSlots: [
              { date: '2024-01-20', time: '15:00' },
              { date: '2024-01-20', time: '16:00' },
              { date: '2024-01-21', time: '14:00' },
            ],
          },
        }),
      });

      await expect(
        supportService.bookTutoring(
          {
            studentId: 'student-123',
            courseId: 'course-math201',
            tutorId: 'tutor-456',
            preferredDate: '2024-01-20',
            preferredTime: '14:00',
            duration: 60,
          },
          studentContext
        )
      ).rejects.toMatchObject({
        statusCode: 409,
      });
    });

    it('should book virtual tutoring session', async () => {
      const expectedResponse = {
        id: 'session-virtual-123',
        studentId: 'student-123',
        tutorId: 'tutor-789',
        courseId: 'course-chem101',
        scheduledAt: '2024-01-22T10:00:00Z',
        duration: 45,
        status: 'SCHEDULED',
        location: null,
        meetingLink: 'https://zoom.us/j/123456789',
        meetingType: 'VIRTUAL',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => expectedResponse,
      });

      const result = await supportService.bookTutoring(
        {
          studentId: 'student-123',
          courseId: 'course-chem101',
          preferredDate: '2024-01-22',
          preferredTime: '10:00',
          duration: 45,
          virtual: true,
        },
        studentContext
      );

      expect(result.meetingLink).toBeDefined();
      expect(result.meetingType).toBe('VIRTUAL');
    });
  });

  describe('Tutor Availability', () => {
    it('should get tutor availability for a course', async () => {
      const expectedAvailability = [
        {
          tutorId: 'tutor-456',
          tutorName: 'Jane Smith',
          subjects: ['Calculus', 'Linear Algebra', 'Statistics'],
          rating: 4.8,
          sessionsCompleted: 120,
          availableSlots: [
            { date: '2024-01-20', times: ['09:00', '10:00', '14:00', '15:00'] },
            { date: '2024-01-21', times: ['09:00', '10:00', '11:00'] },
          ],
        },
        {
          tutorId: 'tutor-789',
          tutorName: 'John Doe',
          subjects: ['Calculus', 'Physics'],
          rating: 4.5,
          sessionsCompleted: 85,
          availableSlots: [
            { date: '2024-01-20', times: ['11:00', '16:00'] },
            { date: '2024-01-22', times: ['09:00', '10:00', '14:00'] },
          ],
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => expectedAvailability,
      });

      const result = await supportService.getTutorAvailability('course-math201', studentContext);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url] = mockFetch.mock.calls[0];

      expect(url).toContain('/tutoring/availability');
      expect(url).toContain('courseId=course-math201');

      expect(result).toHaveLength(2);
      expect(result[0].subjects).toContain('Calculus');
    });

    it('should handle no tutors available', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => [],
      });

      const result = await supportService.getTutorAvailability(
        'course-rare-subject',
        studentContext
      );

      expect(result).toHaveLength(0);
    });
  });

  describe('Study Hall Check-In', () => {
    it('should check in to study hall', async () => {
      const checkInRequest = {
        studentId: 'student-123',
        locationId: 'study-hall-main',
      };

      const expectedResponse = {
        id: 'checkin-456',
        studentId: 'student-123',
        locationId: 'study-hall-main',
        locationName: 'Main Athletics Study Hall',
        checkInTime: '2024-01-15T18:00:00Z',
        checkOutTime: null,
        status: 'CHECKED_IN',
        requiredHoursRemaining: 4,
        weeklyProgress: {
          required: 8,
          completed: 4,
          remaining: 4,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => expectedResponse,
      });

      const result = await supportService.checkInStudyHall(checkInRequest, studentContext);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];

      expect(url).toContain('/study-hall/checkin');
      expect(options.method).toBe('POST');

      expect(result.status).toBe('CHECKED_IN');
      expect(result.weeklyProgress.remaining).toBe(4);
    });

    it('should handle already checked in', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 409,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          error: {
            code: 'ALREADY_CHECKED_IN',
            message: 'Student is already checked in at another location',
            activeCheckIn: {
              locationName: 'Library Study Room',
              checkInTime: '2024-01-15T16:00:00Z',
            },
          },
        }),
      });

      await expect(
        supportService.checkInStudyHall({ studentId: 'student-123' }, studentContext)
      ).rejects.toMatchObject({
        statusCode: 409,
      });
    });

    it('should check out from study hall', async () => {
      const expectedResponse = {
        id: 'checkin-456',
        studentId: 'student-123',
        checkInTime: '2024-01-15T18:00:00Z',
        checkOutTime: '2024-01-15T20:30:00Z',
        status: 'CHECKED_OUT',
        durationMinutes: 150,
        hoursEarned: 2.5,
        weeklyProgress: {
          required: 8,
          completed: 6.5,
          remaining: 1.5,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => expectedResponse,
      });

      const result = await supportService.checkOutStudyHall('student-123', studentContext);

      expect(result.status).toBe('CHECKED_OUT');
      expect(result.hoursEarned).toBe(2.5);
    });
  });

  describe('Study Hall Attendance', () => {
    it('should get study hall attendance history', async () => {
      const expectedAttendance = {
        studentId: 'student-123',
        currentWeek: {
          required: 8,
          completed: 6.5,
          remaining: 1.5,
          sessions: [
            {
              date: '2024-01-15',
              checkIn: '18:00',
              checkOut: '20:30',
              hours: 2.5,
              location: 'Main Study Hall',
            },
            {
              date: '2024-01-14',
              checkIn: '14:00',
              checkOut: '18:00',
              hours: 4,
              location: 'Library',
            },
          ],
        },
        semester: {
          totalRequired: 120,
          totalCompleted: 85,
          weeksCompliant: 10,
          weeksMissed: 1,
        },
        history: [
          { week: 'Jan 8-14', required: 8, completed: 8, status: 'COMPLETE' },
          { week: 'Jan 1-7', required: 8, completed: 6, status: 'INCOMPLETE' },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => expectedAttendance,
      });

      const result = await supportService.getStudyHallAttendance('student-123', advisorContext);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url] = mockFetch.mock.calls[0];

      expect(url).toContain('/study-hall/attendance');
      expect(url).toContain('studentId=student-123');

      expect(result.currentWeek.completed).toBe(6.5);
      expect(result.semester.weeksCompliant).toBe(10);
    });
  });

  describe('Workshop Registration', () => {
    it('should register for a workshop', async () => {
      const registerRequest = {
        studentId: 'student-123',
        workshopId: 'workshop-study-skills',
      };

      const expectedResponse = {
        id: 'registration-789',
        studentId: 'student-123',
        workshopId: 'workshop-study-skills',
        workshopName: 'Effective Study Strategies for Athletes',
        date: '2024-01-25',
        time: '17:00',
        duration: 90,
        location: 'Academic Support Center, Room 105',
        instructor: 'Dr. Academic Coach',
        status: 'REGISTERED',
        confirmationSent: true,
        prerequisitesMet: true,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => expectedResponse,
      });

      const result = await supportService.registerWorkshop(registerRequest, studentContext);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];

      expect(url).toContain('/workshop/register');
      expect(options.method).toBe('POST');

      expect(result.status).toBe('REGISTERED');
      expect(result.confirmationSent).toBe(true);
    });

    it('should handle workshop full', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 409,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          error: {
            code: 'WORKSHOP_FULL',
            message: 'Workshop has reached maximum capacity',
            waitlistAvailable: true,
            currentPosition: 3,
          },
        }),
      });

      await expect(
        supportService.registerWorkshop(
          { studentId: 'student-123', workshopId: 'workshop-popular' },
          studentContext
        )
      ).rejects.toMatchObject({
        statusCode: 409,
      });
    });

    it('should handle scheduling conflict with practice', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 409,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          error: {
            code: 'SCHEDULE_CONFLICT',
            message: 'Workshop conflicts with team practice',
            conflict: {
              type: 'PRACTICE',
              time: '17:00-19:00',
              day: 'Thursday',
            },
          },
        }),
      });

      await expect(
        supportService.registerWorkshop(
          { studentId: 'student-123', workshopId: 'workshop-thursday' },
          studentContext
        )
      ).rejects.toMatchObject({
        statusCode: 409,
      });
    });
  });

  describe('Available Workshops', () => {
    it('should get list of available workshops', async () => {
      const expectedWorkshops = [
        {
          id: 'workshop-study-skills',
          name: 'Effective Study Strategies for Athletes',
          description: 'Learn time management and study techniques designed for student-athletes',
          date: '2024-01-25',
          time: '17:00',
          duration: 90,
          location: 'Academic Support Center',
          instructor: 'Dr. Academic Coach',
          capacity: 25,
          enrolled: 18,
          spotsRemaining: 7,
          category: 'ACADEMIC_SKILLS',
          tags: ['study-skills', 'time-management', 'required-for-freshmen'],
        },
        {
          id: 'workshop-career',
          name: 'Career Planning for Student-Athletes',
          description: 'Explore career options and build your professional network',
          date: '2024-02-01',
          time: '18:00',
          duration: 60,
          location: 'Career Center',
          instructor: 'Career Services Team',
          capacity: 30,
          enrolled: 12,
          spotsRemaining: 18,
          category: 'CAREER_DEVELOPMENT',
          tags: ['career', 'networking', 'resume'],
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => expectedWorkshops,
      });

      const result = await supportService.getWorkshops(studentContext);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url] = mockFetch.mock.calls[0];

      expect(url).toContain('/workshops');
      expect(result).toHaveLength(2);
      expect(result[0].spotsRemaining).toBe(7);
    });

    it('should filter workshops by category', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => [
          {
            id: 'workshop-study-skills',
            name: 'Effective Study Strategies',
            category: 'ACADEMIC_SKILLS',
          },
        ],
      });

      const result = await supportService.getWorkshops(studentContext, {
        category: 'ACADEMIC_SKILLS',
      });

      expect(result).toHaveLength(1);
      expect(result[0].category).toBe('ACADEMIC_SKILLS');
    });
  });

  describe('Mentoring', () => {
    it('should get mentor matches for a student', async () => {
      const expectedMatches = [
        {
          mentorId: 'mentor-123',
          mentorName: 'Michael Johnson',
          sport: 'BASKETBALL',
          graduationYear: 2020,
          currentRole: 'Marketing Manager at Nike',
          matchScore: 0.92,
          matchReasons: ['Same sport', 'Similar major', 'Shared career interests'],
          availableSlots: [
            { day: 'TUESDAY', times: ['18:00', '19:00'] },
            { day: 'THURSDAY', times: ['17:00', '18:00'] },
          ],
          bio: 'Former point guard, now working in sports marketing...',
        },
        {
          mentorId: 'mentor-456',
          mentorName: 'Sarah Williams',
          sport: 'BASKETBALL',
          graduationYear: 2018,
          currentRole: 'Financial Analyst',
          matchScore: 0.85,
          matchReasons: ['Same sport', 'Finance background'],
          availableSlots: [{ day: 'WEDNESDAY', times: ['19:00', '20:00'] }],
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => expectedMatches,
      });

      const result = await supportService.getMentorMatches('student-123', studentContext);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url] = mockFetch.mock.calls[0];

      expect(url).toContain('/mentoring/matches');
      expect(url).toContain('studentId=student-123');

      expect(result).toHaveLength(2);
      expect(result[0].matchScore).toBeGreaterThan(0.9);
    });

    it('should schedule a mentoring session', async () => {
      const sessionRequest = {
        studentId: 'student-123',
        mentorId: 'mentor-123',
        date: '2024-01-23',
        time: '18:00',
        duration: 30,
        topic: 'Career advice and networking tips',
        virtual: true,
      };

      const expectedResponse = {
        id: 'mentoring-session-789',
        studentId: 'student-123',
        mentorId: 'mentor-123',
        mentorName: 'Michael Johnson',
        scheduledAt: '2024-01-23T18:00:00Z',
        duration: 30,
        topic: 'Career advice and networking tips',
        status: 'SCHEDULED',
        meetingLink: 'https://zoom.us/j/987654321',
        confirmationsSent: true,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => expectedResponse,
      });

      const result = await supportService.scheduleMentoringSession(sessionRequest, studentContext);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];

      expect(url).toContain('/mentoring/session');
      expect(options.method).toBe('POST');

      expect(result.status).toBe('SCHEDULED');
      expect(result.meetingLink).toBeDefined();
    });

    it('should handle mentor unavailable', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 409,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          error: {
            code: 'MENTOR_UNAVAILABLE',
            message: 'Mentor is not available at the requested time',
            nextAvailable: [
              { date: '2024-01-24', time: '18:00' },
              { date: '2024-01-25', time: '17:00' },
            ],
          },
        }),
      });

      await expect(
        supportService.scheduleMentoringSession(
          {
            studentId: 'student-123',
            mentorId: 'mentor-busy',
            date: '2024-01-23',
            time: '18:00',
            duration: 30,
          },
          studentContext
        )
      ).rejects.toMatchObject({
        statusCode: 409,
      });
    });
  });

  describe('Session Management', () => {
    it('should cancel a tutoring session', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          success: true,
          sessionId: 'session-789',
          status: 'CANCELLED',
          refundIssued: true,
          cancellationReason: 'Schedule conflict',
        }),
      });

      const result = await supportService.cancelSession(
        'session-789',
        'Schedule conflict',
        studentContext
      );

      expect(result.success).toBe(true);
      expect(result.status).toBe('CANCELLED');
    });

    it('should reject late cancellation', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          error: {
            code: 'LATE_CANCELLATION',
            message: 'Sessions must be cancelled at least 24 hours in advance',
            penalty: 'Session will be marked as NO_SHOW',
          },
        }),
      });

      await expect(
        supportService.cancelSession('session-789', 'Emergency', studentContext)
      ).rejects.toMatchObject({
        statusCode: 400,
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle student not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          error: { code: 'STUDENT_NOT_FOUND', message: 'Student not found' },
        }),
      });

      await expect(
        supportService.getStudyHallAttendance('nonexistent', advisorContext)
      ).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it('should handle service unavailable', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          error: { code: 'SERVICE_UNAVAILABLE', message: 'Support service is temporarily down' },
        }),
      });

      await expect(supportService.getWorkshops(studentContext)).rejects.toMatchObject({
        statusCode: 503,
      });
    });
  });
});
