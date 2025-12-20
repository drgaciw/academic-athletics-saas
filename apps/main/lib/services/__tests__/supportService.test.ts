/**
 * SupportService Unit Tests
 * Tests for the Support Service client
 */

import { RequestContext, UserRole } from '../../types/services/common';

// Define mocks at module level so they're available when the singleton is created
const mockPost = jest.fn();
const mockGet = jest.fn();
const mockHealthCheck = jest.fn();

// Mock ServiceClient with factory function - must be before import
jest.mock('../serviceClient', () => ({
  ServiceClient: jest.fn().mockImplementation(() => ({
    post: mockPost,
    get: mockGet,
    healthCheck: mockHealthCheck,
  })),
  getServiceUrl: jest.fn().mockReturnValue('http://localhost:3005'),
}));

// Import after mock is set up
import { supportService } from '../supportService';

describe('SupportService', () => {
  const mockContext: RequestContext = {
    userId: 'user-123',
    clerkId: 'clerk-123',
    role: UserRole.STUDENT,
    correlationId: 'corr-123',
    timestamp: new Date(),
  };

  beforeEach(() => {
    // Clear all mock call history between tests
    jest.clearAllMocks();
  });

  describe('bookTutoring', () => {
    it('should book tutoring session successfully', async () => {
      const bookingRequest = {
        studentId: 'student-123',
        courseId: 'CS101',
        tutorId: 'tutor-456',
        date: '2024-11-15',
        time: '14:00',
      };

      const mockSession = {
        id: 'session-123',
        ...bookingRequest,
        status: 'confirmed',
        createdAt: new Date().toISOString(),
      };

      mockPost.mockResolvedValueOnce(mockSession);

      const result = await supportService.bookTutoring(bookingRequest, mockContext);

      expect(result).toEqual(mockSession);
      expect(mockPost).toHaveBeenCalledWith('/tutoring/book', bookingRequest, mockContext);
    });

    it('should handle booking conflicts', async () => {
      const bookingRequest = {
        studentId: 'student-123',
        courseId: 'CS101',
        tutorId: 'tutor-456',
        date: '2024-11-15',
        time: '14:00',
      };

      mockPost.mockRejectedValueOnce(new Error('Time slot not available'));

      await expect(
        supportService.bookTutoring(bookingRequest, mockContext)
      ).rejects.toThrow('Time slot not available');
    });
  });

  describe('getTutorAvailability', () => {
    it('should check tutor availability', async () => {
      const courseId = 'CS101';
      const mockAvailability = [
        {
          tutorId: 'tutor-1',
          name: 'John Doe',
          availableSlots: ['14:00', '15:00', '16:00'],
        },
        {
          tutorId: 'tutor-2',
          name: 'Jane Smith',
          availableSlots: ['10:00', '11:00'],
        },
      ];

      mockGet.mockResolvedValueOnce(mockAvailability);

      const result = await supportService.getTutorAvailability(courseId, mockContext);

      expect(result).toEqual(mockAvailability);
      expect(result).toHaveLength(2);
      expect(mockGet).toHaveBeenCalledWith(
        `/tutoring/availability?courseId=${courseId}`,
        mockContext
      );
    });

    it('should return empty array when no tutors available', async () => {
      const courseId = 'RARE101';
      mockGet.mockResolvedValueOnce([]);

      const result = await supportService.getTutorAvailability(courseId, mockContext);

      expect(result).toHaveLength(0);
    });
  });

  describe('checkInStudyHall', () => {
    it('should check in to study hall', async () => {
      const checkInRequest = {
        studentId: 'student-123',
        location: 'Library Room 201',
        timestamp: new Date().toISOString(),
      };

      const mockCheckIn = {
        id: 'checkin-123',
        ...checkInRequest,
        status: 'checked-in',
      };

      mockPost.mockResolvedValueOnce(mockCheckIn);

      const result = await supportService.checkInStudyHall(checkInRequest, mockContext);

      expect(result).toEqual(mockCheckIn);
      expect(mockPost).toHaveBeenCalledWith('/study-hall/checkin', checkInRequest, mockContext);
    });

    it('should handle duplicate check-ins', async () => {
      const checkInRequest = {
        studentId: 'student-123',
        location: 'Library Room 201',
        timestamp: new Date().toISOString(),
      };

      mockPost.mockRejectedValueOnce(new Error('Already checked in'));

      await expect(
        supportService.checkInStudyHall(checkInRequest, mockContext)
      ).rejects.toThrow('Already checked in');
    });
  });

  describe('getAttendance', () => {
    it('should get study hall attendance records', async () => {
      const studentId = 'student-123';
      const mockAttendance = {
        studentId,
        totalHours: 45,
        requiredHours: 40,
        sessions: [
          {
            date: '2024-11-01',
            duration: 2,
            location: 'Library Room 201',
          },
          {
            date: '2024-11-03',
            duration: 3,
            location: 'Library Room 201',
          },
        ],
      };

      mockGet.mockResolvedValueOnce(mockAttendance);

      const result = await supportService.getAttendance(studentId, mockContext);

      expect(result).toEqual(mockAttendance);
      expect(result.totalHours).toBeGreaterThan(result.requiredHours);
      expect(mockGet).toHaveBeenCalledWith(
        `/study-hall/attendance?studentId=${studentId}`,
        mockContext
      );
    });
  });

  describe('registerWorkshop', () => {
    it('should register for workshop', async () => {
      const registrationRequest = {
        studentId: 'student-123',
        workshopId: 'workshop-456',
      };

      const mockRegistration = {
        id: 'reg-123',
        ...registrationRequest,
        status: 'registered',
        registeredAt: new Date().toISOString(),
      };

      mockPost.mockResolvedValueOnce(mockRegistration);

      const result = await supportService.registerWorkshop(registrationRequest, mockContext);

      expect(result).toEqual(mockRegistration);
      expect(mockPost).toHaveBeenCalledWith('/workshop/register', registrationRequest, mockContext);
    });

    it('should handle full workshops', async () => {
      const registrationRequest = {
        studentId: 'student-123',
        workshopId: 'workshop-456',
      };

      mockPost.mockRejectedValueOnce(new Error('Workshop is full'));

      await expect(
        supportService.registerWorkshop(registrationRequest, mockContext)
      ).rejects.toThrow('Workshop is full');
    });
  });

  describe('getWorkshops', () => {
    it('should get available workshops', async () => {
      const mockWorkshops = [
        {
          id: 'workshop-1',
          title: 'Time Management',
          date: '2024-11-20',
          capacity: 30,
          enrolled: 15,
        },
        {
          id: 'workshop-2',
          title: 'Study Skills',
          date: '2024-11-22',
          capacity: 25,
          enrolled: 20,
        },
      ];

      mockGet.mockResolvedValueOnce(mockWorkshops);

      const result = await supportService.getWorkshops(mockContext);

      expect(result).toEqual(mockWorkshops);
      expect(result).toHaveLength(2);
      expect(mockGet).toHaveBeenCalledWith('/workshops', mockContext);
    });

    it('should return empty array when no workshops available', async () => {
      mockGet.mockResolvedValueOnce([]);

      const result = await supportService.getWorkshops(mockContext);

      expect(result).toHaveLength(0);
    });
  });

  describe('getMentorMatches', () => {
    it('should get mentor matches', async () => {
      const studentId = 'student-123';
      const mockMatches = [
        {
          mentorId: 'mentor-1',
          name: 'Senior Student',
          major: 'Computer Science',
          matchScore: 0.95,
        },
        {
          mentorId: 'mentor-2',
          name: 'Another Senior',
          major: 'Computer Science',
          matchScore: 0.88,
        },
      ];

      mockGet.mockResolvedValueOnce(mockMatches);

      const result = await supportService.getMentorMatches(studentId, mockContext);

      expect(result).toEqual(mockMatches);
      expect(result).toHaveLength(2);
      expect(mockGet).toHaveBeenCalledWith(
        `/mentoring/matches?studentId=${studentId}`,
        mockContext
      );
    });
  });

  describe('scheduleMentoringSession', () => {
    it('should schedule mentoring session', async () => {
      const sessionRequest = {
        studentId: 'student-123',
        mentorId: 'mentor-456',
        date: '2024-11-18',
        time: '15:00',
        topic: 'Career planning',
      };

      const mockSession = {
        id: 'session-789',
        ...sessionRequest,
        status: 'scheduled',
        createdAt: new Date().toISOString(),
      };

      mockPost.mockResolvedValueOnce(mockSession);

      const result = await supportService.scheduleMentoringSession(sessionRequest, mockContext);

      expect(result).toEqual(mockSession);
      expect(mockPost).toHaveBeenCalledWith('/mentoring/session', sessionRequest, mockContext);
    });

    it('should handle scheduling conflicts', async () => {
      const sessionRequest = {
        studentId: 'student-123',
        mentorId: 'mentor-456',
        date: '2024-11-18',
        time: '15:00',
      };

      mockPost.mockRejectedValueOnce(new Error('Mentor not available'));

      await expect(
        supportService.scheduleMentoringSession(sessionRequest, mockContext)
      ).rejects.toThrow('Mentor not available');
    });
  });

  describe('health', () => {
    it('should check service health', async () => {
      mockHealthCheck.mockResolvedValueOnce({ status: 'healthy' });

      const result = await supportService.health();

      expect(result).toEqual({ status: 'healthy' });
      expect(mockHealthCheck).toHaveBeenCalled();
    });
  });
});
