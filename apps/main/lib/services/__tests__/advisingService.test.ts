/**
 * AdvisingService Unit Tests
 * Tests for the Advising Service client
 */

import { advisingService } from '../advisingService';
import { ServiceClient } from '../serviceClient';
import { RequestContext, UserRole } from '../../types/services/common';

// Mock ServiceClient
jest.mock('../serviceClient');

describe('AdvisingService', () => {
  const mockContext: RequestContext = {
    userId: 'user-123',
    clerkId: 'clerk-123',
    role: UserRole.STUDENT,
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

  describe('generateSchedule', () => {
    it('should generate course schedule successfully', async () => {
      const scheduleRequest = {
        studentId: 'student-123',
        semester: 'Fall 2024',
        preferences: {
          maxCredits: 15,
          avoidMornings: true,
        },
      };

      const mockResponse = {
        schedule: [
          { courseId: 'CS101', time: '10:00 AM', days: ['Mon', 'Wed'] },
          { courseId: 'MATH201', time: '2:00 PM', days: ['Tue', 'Thu'] },
        ],
        conflicts: [],
        totalCredits: 14,
      };

      mockPost.mockResolvedValueOnce(mockResponse);

      const result = await advisingService.generateSchedule(scheduleRequest, mockContext);

      expect(result).toEqual(mockResponse);
      expect(mockPost).toHaveBeenCalledWith('/schedule', scheduleRequest, mockContext);
    });

    it('should handle scheduling errors', async () => {
      const scheduleRequest = {
        studentId: 'student-123',
        semester: 'Fall 2024',
      };

      mockPost.mockRejectedValueOnce(new Error('Scheduling failed'));

      await expect(
        advisingService.generateSchedule(scheduleRequest, mockContext)
      ).rejects.toThrow('Scheduling failed');
    });
  });

  describe('getConflicts', () => {
    it('should retrieve scheduling conflicts', async () => {
      const studentId = 'student-123';
      const mockConflicts = {
        conflicts: [
          {
            type: 'athletic',
            course: 'CS101',
            athleticEvent: 'Practice',
            time: '10:00 AM',
          },
        ],
      };

      mockGet.mockResolvedValueOnce(mockConflicts);

      const result = await advisingService.getConflicts(studentId, mockContext);

      expect(result).toEqual(mockConflicts);
      expect(mockGet).toHaveBeenCalledWith(`/conflicts/${studentId}`, mockContext);
    });

    it('should return empty conflicts when none exist', async () => {
      const studentId = 'student-123';
      mockGet.mockResolvedValueOnce({ conflicts: [] });

      const result = await advisingService.getConflicts(studentId, mockContext);

      expect(result.conflicts).toHaveLength(0);
    });
  });

  describe('getRecommendations', () => {
    it('should get course recommendations', async () => {
      const recommendationRequest = {
        studentId: 'student-123',
        major: 'Computer Science',
        completedCourses: ['CS101', 'MATH101'],
      };

      const mockRecommendations = {
        recommendations: [
          { courseId: 'CS201', priority: 'high', reason: 'Required for major' },
          { courseId: 'CS202', priority: 'medium', reason: 'Elective option' },
        ],
      };

      mockPost.mockResolvedValueOnce(mockRecommendations);

      const result = await advisingService.getRecommendations(
        recommendationRequest,
        mockContext
      );

      expect(result).toEqual(mockRecommendations);
      expect(mockPost).toHaveBeenCalledWith('/recommend', recommendationRequest, mockContext);
    });
  });

  describe('getDegreeProgress', () => {
    it('should track degree completion progress', async () => {
      const studentId = 'student-123';
      const mockProgress = {
        totalCredits: 90,
        requiredCredits: 120,
        percentComplete: 75,
        remainingRequirements: [
          { category: 'Core', remaining: 6 },
          { category: 'Electives', remaining: 9 },
        ],
      };

      mockGet.mockResolvedValueOnce(mockProgress);

      const result = await advisingService.getDegreeProgress(studentId, mockContext);

      expect(result).toEqual(mockProgress);
      expect(mockGet).toHaveBeenCalledWith(`/degree-progress/${studentId}`, mockContext);
    });

    it('should handle missing student data', async () => {
      const studentId = 'nonexistent-123';
      mockGet.mockRejectedValueOnce(new Error('Student not found'));

      await expect(
        advisingService.getDegreeProgress(studentId, mockContext)
      ).rejects.toThrow('Student not found');
    });
  });

  describe('validateSchedule', () => {
    it('should validate proposed schedule', async () => {
      const validateRequest = {
        studentId: 'student-123',
        proposedCourses: ['CS201', 'MATH201', 'ENG101'],
        semester: 'Fall 2024',
      };

      const mockValidation = {
        valid: true,
        conflicts: [],
        warnings: ['Heavy course load'],
      };

      mockPost.mockResolvedValueOnce(mockValidation);

      const result = await advisingService.validateSchedule(validateRequest, mockContext);

      expect(result).toEqual(mockValidation);
      expect(mockPost).toHaveBeenCalledWith('/validate-schedule', validateRequest, mockContext);
    });

    it('should detect invalid schedules', async () => {
      const validateRequest = {
        studentId: 'student-123',
        proposedCourses: ['CS201', 'CS202'],
        semester: 'Fall 2024',
      };

      const mockValidation = {
        valid: false,
        conflicts: [
          { type: 'time', courses: ['CS201', 'CS202'] },
        ],
        warnings: [],
      };

      mockPost.mockResolvedValueOnce(mockValidation);

      const result = await advisingService.validateSchedule(validateRequest, mockContext);

      expect(result.valid).toBe(false);
      expect(result.conflicts).toHaveLength(1);
    });
  });

  describe('health', () => {
    it('should check service health', async () => {
      mockHealthCheck.mockResolvedValueOnce({ status: 'healthy' });

      const result = await advisingService.health();

      expect(result).toEqual({ status: 'healthy' });
      expect(mockHealthCheck).toHaveBeenCalled();
    });

    it('should detect unhealthy service', async () => {
      mockHealthCheck.mockResolvedValueOnce({ status: 'unhealthy' });

      const result = await advisingService.health();

      expect(result.status).toBe('unhealthy');
    });
  });
});
