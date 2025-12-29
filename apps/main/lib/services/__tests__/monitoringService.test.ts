/**
 * MonitoringService Unit Tests
 * Tests for the Monitoring Service client
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
  getServiceUrl: jest.fn().mockReturnValue('http://localhost:3003'),
}));

// Import after mock is set up
import { monitoringService } from '../monitoringService';

describe('MonitoringService', () => {
  const mockContext: RequestContext = {
    userId: 'user-123',
    clerkId: 'clerk-123',
    role: UserRole.ADVISOR,
    correlationId: 'corr-123',
    timestamp: new Date(),
  };

  beforeEach(() => {
    // Clear all mock call history between tests
    jest.clearAllMocks();
  });

  describe('getPerformance', () => {
    it('should retrieve performance metrics', async () => {
      const studentId = 'student-123';
      const mockMetrics = {
        gpa: 3.5,
        attendanceRate: 95,
        assignmentCompletion: 90,
        trend: 'improving',
      };

      mockGet.mockResolvedValueOnce(mockMetrics);

      const result = await monitoringService.getPerformance(studentId, mockContext);

      expect(result).toEqual(mockMetrics);
      expect(mockGet).toHaveBeenCalledWith(`/performance/${studentId}`, mockContext);
    });

    it('should handle missing student data', async () => {
      const studentId = 'nonexistent-123';
      mockGet.mockRejectedValueOnce(new Error('Student not found'));

      await expect(
        monitoringService.getPerformance(studentId, mockContext)
      ).rejects.toThrow('Student not found');
    });
  });

  describe('submitProgressReport', () => {
    it('should submit progress report successfully', async () => {
      const reportRequest = {
        studentId: 'student-123',
        courseId: 'CS101',
        grade: 'B+',
        attendance: 'Good',
        comments: 'Doing well',
      };

      const mockResponse = {
        reportId: 'report-123',
        submitted: true,
        timestamp: new Date().toISOString(),
      };

      mockPost.mockResolvedValueOnce(mockResponse);

      const result = await monitoringService.submitProgressReport(reportRequest, mockContext);

      expect(result).toEqual(mockResponse);
      expect(mockPost).toHaveBeenCalledWith('/progress-report', reportRequest, mockContext);
    });

    it('should handle invalid report data', async () => {
      const reportRequest = {
        studentId: 'student-123',
        courseId: '',
      };

      mockPost.mockRejectedValueOnce(new Error('Invalid report data'));

      await expect(
        monitoringService.submitProgressReport(reportRequest, mockContext)
      ).rejects.toThrow('Invalid report data');
    });
  });

  describe('getAlerts', () => {
    it('should retrieve active alerts', async () => {
      const studentId = 'student-123';
      const mockAlerts = [
        {
          id: 'alert-1',
          type: 'academic',
          severity: 'high',
          message: 'GPA below threshold',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'alert-2',
          type: 'attendance',
          severity: 'medium',
          message: 'Missing study hall hours',
          createdAt: new Date().toISOString(),
        },
      ];

      mockGet.mockResolvedValueOnce(mockAlerts);

      const result = await monitoringService.getAlerts(studentId, mockContext);

      expect(result).toEqual(mockAlerts);
      expect(result).toHaveLength(2);
      expect(mockGet).toHaveBeenCalledWith(`/alerts/${studentId}`, mockContext);
    });

    it('should return empty array when no alerts', async () => {
      const studentId = 'student-123';
      mockGet.mockResolvedValueOnce([]);

      const result = await monitoringService.getAlerts(studentId, mockContext);

      expect(result).toHaveLength(0);
    });
  });

  describe('createIntervention', () => {
    it('should create intervention plan', async () => {
      const interventionRequest = {
        studentId: 'student-123',
        type: 'academic',
        actions: ['Tutoring', 'Study hall'],
        goals: 'Improve GPA to 3.0',
      };

      const mockPlan = {
        id: 'plan-123',
        studentId: 'student-123',
        type: 'academic',
        actions: ['Tutoring', 'Study hall'],
        goals: 'Improve GPA to 3.0',
        status: 'active',
        createdAt: new Date().toISOString(),
      };

      mockPost.mockResolvedValueOnce(mockPlan);

      const result = await monitoringService.createIntervention(interventionRequest, mockContext);

      expect(result).toEqual(mockPlan);
      expect(mockPost).toHaveBeenCalledWith('/intervention', interventionRequest, mockContext);
    });

    it('should handle intervention creation errors', async () => {
      const interventionRequest = {
        studentId: 'student-123',
        type: 'invalid',
      };

      mockPost.mockRejectedValueOnce(new Error('Invalid intervention type'));

      await expect(
        monitoringService.createIntervention(interventionRequest, mockContext)
      ).rejects.toThrow('Invalid intervention type');
    });
  });

  describe('getTeamAnalytics', () => {
    it('should retrieve team-wide analytics', async () => {
      const teamId = 'team-123';
      const mockAnalytics = {
        teamId,
        averageGPA: 3.2,
        eligibilityRate: 95,
        attendanceRate: 92,
        atRiskCount: 3,
        trends: {
          gpa: 'stable',
          attendance: 'improving',
        },
      };

      mockGet.mockResolvedValueOnce(mockAnalytics);

      const result = await monitoringService.getTeamAnalytics(teamId, mockContext);

      expect(result).toEqual(mockAnalytics);
      expect(mockGet).toHaveBeenCalledWith(`/analytics/team/${teamId}`, mockContext);
    });

    it('should handle missing team data', async () => {
      const teamId = 'nonexistent-team';
      mockGet.mockRejectedValueOnce(new Error('Team not found'));

      await expect(
        monitoringService.getTeamAnalytics(teamId, mockContext)
      ).rejects.toThrow('Team not found');
    });
  });

  describe('assessRisk', () => {
    it('should trigger risk assessment', async () => {
      const riskRequest = {
        studentId: 'student-123',
        factors: ['gpa', 'attendance', 'engagement'],
      };

      const mockAssessment = {
        studentId: 'student-123',
        riskLevel: 'medium',
        riskScore: 0.65,
        factors: [
          { name: 'gpa', score: 0.7, weight: 0.4 },
          { name: 'attendance', score: 0.6, weight: 0.3 },
          { name: 'engagement', score: 0.65, weight: 0.3 },
        ],
        recommendations: ['Increase tutoring', 'Monitor attendance'],
      };

      mockPost.mockResolvedValueOnce(mockAssessment);

      const result = await monitoringService.assessRisk(riskRequest, mockContext);

      expect(result).toEqual(mockAssessment);
      expect(result.riskLevel).toBe('medium');
      expect(mockPost).toHaveBeenCalledWith('/risk-assessment', riskRequest, mockContext);
    });

    it('should identify high-risk students', async () => {
      const riskRequest = {
        studentId: 'student-456',
        factors: ['gpa', 'attendance'],
      };

      const mockAssessment = {
        studentId: 'student-456',
        riskLevel: 'high',
        riskScore: 0.85,
        factors: [
          { name: 'gpa', score: 0.9, weight: 0.5 },
          { name: 'attendance', score: 0.8, weight: 0.5 },
        ],
        recommendations: ['Immediate intervention required'],
      };

      mockPost.mockResolvedValueOnce(mockAssessment);

      const result = await monitoringService.assessRisk(riskRequest, mockContext);

      expect(result.riskLevel).toBe('high');
      expect(result.riskScore).toBeGreaterThan(0.8);
    });
  });

  describe('health', () => {
    it('should check service health', async () => {
      mockHealthCheck.mockResolvedValueOnce({ status: 'healthy' });

      const result = await monitoringService.health();

      expect(result).toEqual({ status: 'healthy' });
      expect(mockHealthCheck).toHaveBeenCalled();
    });
  });
});
