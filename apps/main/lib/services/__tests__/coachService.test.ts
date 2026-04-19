/**
 * CoachService Unit Tests
 * Tests for the Coach Service client
 */

import { RequestContext, UserRole } from '../../types/services/common';

// Define mocks at module level so they're available when the singleton is created
const mockPost = jest.fn();
const mockGet = jest.fn();
const mockPut = jest.fn();
const mockDelete = jest.fn();
const mockHealthCheck = jest.fn();

// Mock ServiceClient with factory function - must be before import
jest.mock('../serviceClient', () => ({
  ServiceClient: jest.fn().mockImplementation(() => ({
    post: mockPost,
    get: mockGet,
    put: mockPut,
    delete: mockDelete,
    healthCheck: mockHealthCheck,
  })),
  getServiceUrl: jest.fn().mockReturnValue('http://localhost:3008'),
}));

// Import after mock is set up
import { coachService } from '../coachService';

describe('CoachService', () => {
  const mockContext: RequestContext = {
    userId: 'coach-123',
    clerkId: 'clerk-coach-123',
    role: UserRole.COACH,
    correlationId: 'corr-123',
    timestamp: new Date(),
  };

  beforeEach(() => {
    // Clear all mock call history between tests
    jest.clearAllMocks();
  });

  describe('createCoach', () => {
    it('should create new coach profile', async () => {
      const createRequest = {
        clerkId: 'clerk-coach-456',
        email: 'coach@example.com',
        firstName: 'John',
        lastName: 'Smith',
        sport: 'Basketball',
        teams: ['Men\'s Varsity', 'Men\'s JV'],
        title: 'Head Coach',
      };

      const mockProfile = {
        id: 'coach-456',
        userId: 'user-456',
        coachId: 'C456',
        ...createRequest,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockPost.mockResolvedValueOnce(mockProfile);

      const result = await coachService.createCoach(createRequest, mockContext);

      expect(result).toEqual(mockProfile);
      expect(mockPost).toHaveBeenCalledWith('/coaches', createRequest, mockContext);
    });
  });

  describe('getProfile', () => {
    it('should get coach profile', async () => {
      const coachId = 'C123';
      const mockProfile = {
        id: 'coach-123',
        userId: 'user-123',
        coachId,
        sport: 'Basketball',
        teams: ['Men\'s Varsity'],
        title: 'Head Coach',
        firstName: 'John',
        lastName: 'Smith',
        email: 'coach@example.com',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockGet.mockResolvedValueOnce(mockProfile);

      const result = await coachService.getProfile(coachId, mockContext);

      expect(result).toEqual(mockProfile);
      expect(mockGet).toHaveBeenCalledWith(`/coaches/${coachId}`, mockContext);
    });
  });

  describe('updateProfile', () => {
    it('should update coach profile', async () => {
      const coachId = 'C123';
      const updateData = {
        phone: '555-0123',
        officeLocation: 'Athletics Building 201',
      };

      const mockUpdatedProfile = {
        id: 'coach-123',
        userId: 'user-123',
        coachId,
        sport: 'Basketball',
        teams: ['Men\'s Varsity'],
        title: 'Head Coach',
        ...updateData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockPut.mockResolvedValueOnce(mockUpdatedProfile);

      const result = await coachService.updateProfile(coachId, updateData, mockContext);

      expect(result).toEqual(mockUpdatedProfile);
      expect(mockPut).toHaveBeenCalledWith(`/coaches/${coachId}`, updateData, mockContext);
    });
  });

  describe('getStudentAthletes', () => {
    it('should get student athletes for coach', async () => {
      const coachId = 'C123';
      const params = {
        sport: 'Basketball',
        team: 'Men\'s Varsity',
        limit: 10,
        offset: 0,
      };

      const mockResponse = {
        students: [
          {
            id: 'student-1',
            studentId: 'SA001',
            name: 'John Doe',
            sport: 'Basketball',
            team: 'Men\'s Varsity',
            gpa: 3.5,
            creditHours: 90,
            eligibilityStatus: 'eligible',
            enrollmentStatus: 'FULL_TIME',
            alerts: [],
          },
        ],
        total: 1,
        limit: 10,
        offset: 0,
      };

      mockGet.mockResolvedValueOnce(mockResponse);

      const result = await coachService.getStudentAthletes(coachId, params, mockContext);

      expect(result).toEqual(mockResponse);
      expect(mockGet).toHaveBeenCalledWith(
        `/coaches/${coachId}/students?sport=Basketball&team=Men%27s+Varsity&limit=10`,
        mockContext
      );
    });
  });

  describe('getStudentDetails', () => {
    it('should get individual student athlete details', async () => {
      const coachId = 'C123';
      const studentId = 'SA001';
      
      const mockStudent = {
        id: 'student-1',
        studentId,
        name: 'John Doe',
        sport: 'Basketball',
        team: 'Men\'s Varsity',
        year: 'Junior',
        gpa: 3.5,
        creditHours: 90,
        eligibilityStatus: 'eligible',
        academicStanding: 'GOOD_STANDING',
        enrollmentStatus: 'FULL_TIME',
        major: 'Business Administration',
        alerts: [],
        recentPerformance: {
          termGpa: 3.5,
          cumulativeGpa: 3.45,
          attendanceRate: 95,
          lastUpdated: new Date().toISOString(),
        },
      };

      mockGet.mockResolvedValueOnce(mockStudent);

      const result = await coachService.getStudentDetails(coachId, studentId, mockContext);

      expect(result).toEqual(mockStudent);
      expect(mockGet).toHaveBeenCalledWith(
        `/coaches/${coachId}/students/${studentId}`,
        mockContext
      );
    });
  });

  describe('getTeamAnalytics', () => {
    it('should get team analytics for coach', async () => {
      const coachId = 'C123';
      
      const mockAnalytics = {
        sport: 'Basketball',
        teams: ['Men\'s Varsity', 'Men\'s JV'],
        totalStudents: 45,
        eligibleCount: 38,
        atRiskCount: 5,
        ineligibleCount: 2,
        averageGpa: 3.15,
        averageCreditHours: 85,
        eligibilityRate: 84.4,
        activeAlerts: 8,
        criticalAlerts: 2,
      };

      mockGet.mockResolvedValueOnce(mockAnalytics);

      const result = await coachService.getTeamAnalytics(coachId, mockContext);

      expect(result).toEqual(mockAnalytics);
      expect(mockGet).toHaveBeenCalledWith(`/coaches/${coachId}/analytics`, mockContext);
    });
  });

  describe('deleteCoach', () => {
    it('should delete coach profile', async () => {
      const coachId = 'C123';
      const mockResponse = { success: true };

      mockDelete.mockResolvedValueOnce(mockResponse);

      const result = await coachService.deleteCoach(coachId, mockContext);

      expect(result).toEqual(mockResponse);
      expect(mockDelete).toHaveBeenCalledWith(`/coaches/${coachId}`, mockContext);
    });
  });

  describe('health', () => {
    it('should check service health', async () => {
      const mockHealthResponse = { status: 'healthy' };
      mockHealthCheck.mockResolvedValueOnce(mockHealthResponse);

      const result = await coachService.health();

      expect(result).toEqual(mockHealthResponse);
      expect(mockHealthCheck).toHaveBeenCalled();
    });
  });
});
