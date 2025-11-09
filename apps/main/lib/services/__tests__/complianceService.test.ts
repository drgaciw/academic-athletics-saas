/**
 * ComplianceService Unit Tests
 * Tests for the Compliance Service client
 */

import { complianceService } from '../complianceService';
import { ServiceClient } from '../serviceClient';
import { RequestContext, UserRole } from '../../types/services/common';

// Mock ServiceClient
jest.mock('../serviceClient');

describe('ComplianceService', () => {
  const mockContext: RequestContext = {
    userId: 'user-123',
    clerkId: 'clerk-123',
    role: UserRole.COMPLIANCE,
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

  describe('checkEligibility', () => {
    it('should check student eligibility successfully', async () => {
      const eligibilityRequest = {
        studentId: 'student-123',
        semester: 'Fall 2024',
      };

      const mockResponse = {
        eligible: true,
        gpa: 3.5,
        creditHours: 30,
        progressTowardDegree: 75,
        violations: [],
      };

      mockPost.mockResolvedValueOnce(mockResponse);

      const result = await complianceService.checkEligibility(eligibilityRequest, mockContext);

      expect(result).toEqual(mockResponse);
      expect(mockPost).toHaveBeenCalledWith('/check-eligibility', eligibilityRequest, mockContext);
    });

    it('should detect eligibility violations', async () => {
      const eligibilityRequest = {
        studentId: 'student-123',
        semester: 'Fall 2024',
      };

      const mockResponse = {
        eligible: false,
        gpa: 2.0,
        creditHours: 24,
        progressTowardDegree: 60,
        violations: [
          { rule: 'GPA_MINIMUM', message: 'GPA below 2.3 threshold' },
        ],
      };

      mockPost.mockResolvedValueOnce(mockResponse);

      const result = await complianceService.checkEligibility(eligibilityRequest, mockContext);

      expect(result.eligible).toBe(false);
      expect(result.violations).toHaveLength(1);
    });
  });

  describe('getStatus', () => {
    it('should retrieve current eligibility status', async () => {
      const studentId = 'student-123';
      const mockStatus = {
        studentId,
        eligible: true,
        lastChecked: new Date().toISOString(),
        nextReview: new Date().toISOString(),
      };

      mockGet.mockResolvedValueOnce(mockStatus);

      const result = await complianceService.getStatus(studentId, mockContext);

      expect(result).toEqual(mockStatus);
      expect(mockGet).toHaveBeenCalledWith(`/status/${studentId}`, mockContext);
    });
  });

  describe('checkInitialEligibility', () => {
    it('should check initial eligibility for freshmen', async () => {
      const initialRequest = {
        studentId: 'student-123',
        highSchoolGPA: 3.8,
        satScore: 1200,
        coreCoursesCompleted: 16,
      };

      const mockResponse = {
        eligible: true,
        qualifierStatus: 'Full Qualifier',
        requirements: {
          gpa: 'Met',
          testScore: 'Met',
          coreCourses: 'Met',
        },
      };

      mockPost.mockResolvedValueOnce(mockResponse);

      const result = await complianceService.checkInitialEligibility(initialRequest, mockContext);

      expect(result).toEqual(mockResponse);
      expect(mockPost).toHaveBeenCalledWith('/initial-eligibility', initialRequest, mockContext);
    });

    it('should identify partial qualifiers', async () => {
      const initialRequest = {
        studentId: 'student-123',
        highSchoolGPA: 2.5,
        satScore: 900,
        coreCoursesCompleted: 16,
      };

      const mockResponse = {
        eligible: false,
        qualifierStatus: 'Partial Qualifier',
        requirements: {
          gpa: 'Not Met',
          testScore: 'Not Met',
          coreCourses: 'Met',
        },
      };

      mockPost.mockResolvedValueOnce(mockResponse);

      const result = await complianceService.checkInitialEligibility(initialRequest, mockContext);

      expect(result.qualifierStatus).toBe('Partial Qualifier');
    });
  });

  describe('checkContinuingEligibility', () => {
    it('should check continuing eligibility', async () => {
      const continuingRequest = {
        studentId: 'student-123',
        currentGPA: 3.2,
        creditsCompleted: 60,
        percentTowardDegree: 50,
      };

      const mockResponse = {
        eligible: true,
        requirements: {
          gpa: 'Met',
          credits: 'Met',
          progress: 'Met',
        },
      };

      mockPost.mockResolvedValueOnce(mockResponse);

      const result = await complianceService.checkContinuingEligibility(
        continuingRequest,
        mockContext
      );

      expect(result).toEqual(mockResponse);
      expect(mockPost).toHaveBeenCalledWith('/continuing', continuingRequest, mockContext);
    });
  });

  describe('getViolations', () => {
    it('should retrieve eligibility violations', async () => {
      const studentId = 'student-123';
      const mockViolations = [
        {
          id: 'v1',
          rule: 'GPA_MINIMUM',
          severity: 'high',
          date: new Date().toISOString(),
        },
        {
          id: 'v2',
          rule: 'CREDIT_HOURS',
          severity: 'medium',
          date: new Date().toISOString(),
        },
      ];

      mockGet.mockResolvedValueOnce(mockViolations);

      const result = await complianceService.getViolations(studentId, mockContext);

      expect(result).toEqual(mockViolations);
      expect(result).toHaveLength(2);
      expect(mockGet).toHaveBeenCalledWith(`/violations/${studentId}`, mockContext);
    });

    it('should return empty array when no violations', async () => {
      const studentId = 'student-123';
      mockGet.mockResolvedValueOnce([]);

      const result = await complianceService.getViolations(studentId, mockContext);

      expect(result).toHaveLength(0);
    });
  });

  describe('updateRules', () => {
    it('should update NCAA rules (admin only)', async () => {
      const newRules = {
        gpaMinimum: 2.3,
        creditHoursMinimum: 24,
        progressPercentage: 40,
      };

      mockPost.mockResolvedValueOnce({ success: true });

      const result = await complianceService.updateRules(newRules, mockContext);

      expect(result.success).toBe(true);
      expect(mockPost).toHaveBeenCalledWith('/update-rules', newRules, mockContext);
    });

    it('should handle rule update failures', async () => {
      const newRules = { invalid: 'data' };
      mockPost.mockRejectedValueOnce(new Error('Invalid rules format'));

      await expect(
        complianceService.updateRules(newRules, mockContext)
      ).rejects.toThrow('Invalid rules format');
    });
  });

  describe('getAuditLog', () => {
    it('should retrieve compliance audit log', async () => {
      const studentId = 'student-123';
      const mockAuditLog = {
        data: [
          {
            id: 'log1',
            action: 'ELIGIBILITY_CHECK',
            timestamp: new Date().toISOString(),
            result: 'ELIGIBLE',
          },
          {
            id: 'log2',
            action: 'RULE_UPDATE',
            timestamp: new Date().toISOString(),
            result: 'SUCCESS',
          },
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 2,
          totalPages: 1,
        },
      };

      mockGet.mockResolvedValueOnce(mockAuditLog);

      const result = await complianceService.getAuditLog(studentId, mockContext);

      expect(result).toEqual(mockAuditLog);
      expect(result.data).toHaveLength(2);
      expect(mockGet).toHaveBeenCalledWith(`/audit-log/${studentId}`, mockContext);
    });
  });

  describe('health', () => {
    it('should check service health', async () => {
      mockHealthCheck.mockResolvedValueOnce({ status: 'healthy' });

      const result = await complianceService.health();

      expect(result).toEqual({ status: 'healthy' });
      expect(mockHealthCheck).toHaveBeenCalled();
    });
  });
});
