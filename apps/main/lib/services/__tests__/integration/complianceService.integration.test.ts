/**
 * Compliance Service Integration Tests
 *
 * Tests the full compliance flow including eligibility checks,
 * NCAA rule validation, violations, and audit logging.
 */

import { ComplianceService, complianceService } from '../../complianceService';
import { UserRole, type RequestContext } from '../../../middleware/authentication';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('ComplianceService Integration Tests', () => {
  const studentContext: RequestContext = {
    userId: 'student-123',
    clerkId: 'clerk_student123',
    role: UserRole.STUDENT,
    correlationId: 'corr-compliance-123',
    timestamp: new Date('2024-01-15T10:00:00Z'),
  };

  const complianceOfficerContext: RequestContext = {
    userId: 'compliance-officer-123',
    clerkId: 'clerk_compliance123',
    role: UserRole.COMPLIANCE,
    correlationId: 'corr-compliance-456',
    timestamp: new Date('2024-01-15T10:00:00Z'),
  };

  const adminContext: RequestContext = {
    userId: 'admin-123',
    clerkId: 'clerk_admin123',
    role: UserRole.ADMIN,
    correlationId: 'corr-compliance-789',
    timestamp: new Date('2024-01-15T10:00:00Z'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Eligibility Check Flow', () => {
    it('should check eligibility for an eligible student', async () => {
      const checkRequest = {
        studentId: 'student-123',
        termId: 'spring-2024',
      };

      const expectedResponse = {
        isEligible: true,
        status: 'ELIGIBLE',
        violations: [],
        warnings: [
          {
            code: 'GPA_NEAR_THRESHOLD',
            message: 'GPA is within 0.3 of minimum requirement',
            severity: 'LOW',
          },
        ],
        recommendations: ['Consider enrolling in GPA-boosting electives'],
        checkedAt: '2024-01-15T10:00:00Z',
        ruleVersion: 'NCAA-2024-v1.2',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => expectedResponse,
      });

      const result = await complianceService.checkEligibility(checkRequest, studentContext);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];

      expect(url).toContain('/check-eligibility');
      expect(options.method).toBe('POST');

      expect(result.isEligible).toBe(true);
      expect(result.status).toBe('ELIGIBLE');
      expect(result.violations).toHaveLength(0);
      expect(result.warnings).toHaveLength(1);
    });

    it('should check eligibility for an ineligible student', async () => {
      const expectedResponse = {
        isEligible: false,
        status: 'INELIGIBLE',
        violations: [
          {
            ruleId: 'NCAA-14.4.3.1',
            ruleName: 'Minimum GPA Requirement',
            severity: 'CRITICAL',
            message: 'Cumulative GPA of 1.8 is below the required 2.0 minimum',
            details: {
              currentGpa: 1.8,
              requiredGpa: 2.0,
              deficit: 0.2,
            },
          },
          {
            ruleId: 'NCAA-14.4.3.2',
            ruleName: 'Progress Toward Degree',
            severity: 'HIGH',
            message: 'Student has not completed 40% of degree requirements',
            details: {
              currentProgress: 35,
              requiredProgress: 40,
            },
          },
        ],
        warnings: [],
        recommendations: [
          'Schedule meeting with academic advisor immediately',
          'Enroll in academic recovery program',
          'Consider course load reduction',
        ],
        checkedAt: '2024-01-15T10:00:00Z',
        ruleVersion: 'NCAA-2024-v1.2',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => expectedResponse,
      });

      const result = await complianceService.checkEligibility(
        { studentId: 'student-456' },
        complianceOfficerContext
      );

      expect(result.isEligible).toBe(false);
      expect(result.status).toBe('INELIGIBLE');
      expect(result.violations).toHaveLength(2);
      expect(result.violations[0].severity).toBe('CRITICAL');
    });

    it('should return conditionally eligible status', async () => {
      const expectedResponse = {
        isEligible: true,
        status: 'CONDITIONALLY_ELIGIBLE',
        violations: [],
        warnings: [
          {
            code: 'PENDING_GRADES',
            message: 'Final grades for 2 courses are pending',
            severity: 'MEDIUM',
          },
        ],
        conditions: [
          'Must maintain C or better in MATH201',
          'Must complete 6 credits by end of term',
        ],
        recommendations: [],
        checkedAt: '2024-01-15T10:00:00Z',
        ruleVersion: 'NCAA-2024-v1.2',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => expectedResponse,
      });

      const result = await complianceService.checkEligibility(
        { studentId: 'student-789' },
        studentContext
      );

      expect(result.status).toBe('CONDITIONALLY_ELIGIBLE');
      expect(result.conditions).toHaveLength(2);
    });
  });

  describe('Initial Eligibility (Freshmen)', () => {
    it('should check initial eligibility for incoming freshman', async () => {
      const initialEligibilityRequest = {
        studentId: 'freshman-123',
        highSchoolGpa: 3.2,
        satScore: 1100,
        actScore: 24,
        coreCredits: 16,
        coreCourses: [
          { subject: 'ENGLISH', years: 4 },
          { subject: 'MATH', years: 3 },
          { subject: 'SCIENCE', years: 2 },
          { subject: 'SOCIAL_STUDIES', years: 2 },
          { subject: 'ADDITIONAL_CORE', years: 5 },
        ],
      };

      const expectedResponse = {
        isEligible: true,
        status: 'ACADEMIC_QUALIFIER',
        coreGpa: 3.2,
        slidingScaleResult: {
          gpaRequired: 2.3,
          testScoreRequired: 900,
          meetsRequirement: true,
        },
        coreCoursesVerification: {
          required: 16,
          completed: 16,
          meetsTenSevenRule: true,
        },
        amateurStatus: 'VERIFIED',
        checkedAt: '2024-01-15T10:00:00Z',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => expectedResponse,
      });

      const result = await complianceService.checkInitialEligibility(
        initialEligibilityRequest,
        complianceOfficerContext
      );

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url] = mockFetch.mock.calls[0];

      expect(url).toContain('/initial-eligibility');
      expect(result.status).toBe('ACADEMIC_QUALIFIER');
      expect(result.slidingScaleResult.meetsRequirement).toBe(true);
    });

    it('should identify academic redshirt eligibility', async () => {
      const expectedResponse = {
        isEligible: false,
        status: 'ACADEMIC_REDSHIRT',
        coreGpa: 2.2,
        slidingScaleResult: {
          gpaRequired: 2.3,
          testScoreRequired: 1000,
          meetsRequirement: false,
        },
        restrictions: [
          'Cannot compete during first year',
          'Can practice with team',
          'Can receive athletic scholarship',
        ],
        remediation: ['Complete 9 credits with 2.0+ GPA to become eligible'],
        checkedAt: '2024-01-15T10:00:00Z',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => expectedResponse,
      });

      const result = await complianceService.checkInitialEligibility(
        { studentId: 'freshman-456', highSchoolGpa: 2.2, satScore: 950 },
        complianceOfficerContext
      );

      expect(result.status).toBe('ACADEMIC_REDSHIRT');
      expect(result.restrictions).toContain('Cannot compete during first year');
    });
  });

  describe('Continuing Eligibility', () => {
    it('should verify continuing eligibility requirements', async () => {
      const continuingRequest = {
        studentId: 'student-123',
        termId: 'spring-2024',
        yearInSchool: 3,
      };

      const expectedResponse = {
        isEligible: true,
        status: 'ELIGIBLE',
        progressTowardDegree: {
          required: 60, // 60% for third year
          actual: 65,
          meetRequirement: true,
        },
        gpaRequirement: {
          required: 2.0,
          actual: 2.8,
          meetRequirement: true,
        },
        creditHours: {
          required: 18, // Per academic year
          completed: 24,
          meetRequirement: true,
        },
        fullTimeEnrollment: {
          required: 12,
          enrolled: 15,
          meetRequirement: true,
        },
        checkedAt: '2024-01-15T10:00:00Z',
        ruleVersion: 'NCAA-2024-v1.2',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => expectedResponse,
      });

      const result = await complianceService.checkContinuingEligibility(
        continuingRequest,
        complianceOfficerContext
      );

      expect(result.isEligible).toBe(true);
      expect(result.progressTowardDegree.meetRequirement).toBe(true);
      expect(result.gpaRequirement.meetRequirement).toBe(true);
    });

    it('should detect progress toward degree violation (40/60/80 rule)', async () => {
      const expectedResponse = {
        isEligible: false,
        status: 'INELIGIBLE',
        violations: [
          {
            ruleId: 'NCAA-14.4.3.3',
            ruleName: 'Progress Toward Degree (40/60/80 Rule)',
            severity: 'CRITICAL',
            message: 'Fourth-year student has not completed 80% of degree requirements',
            details: {
              yearInSchool: 4,
              requiredProgress: 80,
              actualProgress: 72,
              deficit: 8,
            },
          },
        ],
        progressTowardDegree: {
          required: 80,
          actual: 72,
          meetRequirement: false,
        },
        remediation: [
          'Must complete 8% more of degree requirements to regain eligibility',
          'Consider summer session enrollment',
        ],
        checkedAt: '2024-01-15T10:00:00Z',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => expectedResponse,
      });

      const result = await complianceService.checkContinuingEligibility(
        { studentId: 'student-senior', yearInSchool: 4 },
        complianceOfficerContext
      );

      expect(result.isEligible).toBe(false);
      expect(result.violations[0].ruleId).toBe('NCAA-14.4.3.3');
    });
  });

  describe('Eligibility Status', () => {
    it('should get current eligibility status', async () => {
      const expectedStatus = {
        studentId: 'student-123',
        currentStatus: 'ELIGIBLE',
        lastChecked: '2024-01-15T08:00:00Z',
        validUntil: '2024-05-15T23:59:59Z',
        gpa: 3.2,
        creditsCompleted: 75,
        progressPercent: 62,
        eligibilityClock: {
          yearsUsed: 2,
          yearsRemaining: 3,
          redshirtAvailable: true,
        },
        upcomingDeadlines: [
          { name: 'Mid-term grade check', date: '2024-03-01' },
          { name: 'Fall registration', date: '2024-04-15' },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => expectedStatus,
      });

      const result = await complianceService.getEligibilityStatus('student-123', studentContext);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url] = mockFetch.mock.calls[0];

      expect(url).toContain('/status/student-123');
      expect(result.currentStatus).toBe('ELIGIBLE');
      expect(result.eligibilityClock.yearsRemaining).toBe(3);
    });
  });

  describe('Violations Management', () => {
    it('should get all violations for a student', async () => {
      const expectedViolations = [
        {
          id: 'viol-1',
          ruleId: 'NCAA-14.4.3.1',
          ruleName: 'Minimum GPA Requirement',
          severity: 'HIGH',
          status: 'RESOLVED',
          message: 'GPA fell below 2.0 in Fall 2023',
          detectedAt: '2023-12-15T00:00:00Z',
          resolvedAt: '2024-01-10T00:00:00Z',
          resolution: 'GPA restored to 2.1 after grade appeal',
        },
        {
          id: 'viol-2',
          ruleId: 'NCAA-14.5.1',
          ruleName: 'Full-Time Enrollment',
          severity: 'MEDIUM',
          status: 'ACTIVE',
          message: 'Dropped below 12 credits during add/drop',
          detectedAt: '2024-01-12T00:00:00Z',
          resolvedAt: null,
          resolution: null,
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => expectedViolations,
      });

      const result = await complianceService.getViolations('student-123', complianceOfficerContext);

      expect(result).toHaveLength(2);
      expect(result[0].status).toBe('RESOLVED');
      expect(result[1].status).toBe('ACTIVE');
    });

    it('should filter violations by status', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => [
          {
            id: 'viol-2',
            ruleId: 'NCAA-14.5.1',
            severity: 'MEDIUM',
            status: 'ACTIVE',
          },
        ],
      });

      const result = await complianceService.getViolations(
        'student-123',
        complianceOfficerContext,
        { status: 'ACTIVE' }
      );

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('ACTIVE');
    });
  });

  describe('Audit Logging', () => {
    it('should get compliance audit log', async () => {
      const expectedAuditLog = {
        studentId: 'student-123',
        entries: [
          {
            id: 'audit-1',
            action: 'ELIGIBILITY_CHECK',
            performedBy: 'compliance-officer-123',
            performedAt: '2024-01-15T10:00:00Z',
            result: 'ELIGIBLE',
            details: { gpa: 3.2, credits: 75 },
          },
          {
            id: 'audit-2',
            action: 'VIOLATION_CREATED',
            performedBy: 'system',
            performedAt: '2024-01-12T00:00:00Z',
            result: 'VIOLATION',
            details: { ruleId: 'NCAA-14.5.1', severity: 'MEDIUM' },
          },
          {
            id: 'audit-3',
            action: 'STATUS_CHANGE',
            performedBy: 'compliance-officer-456',
            performedAt: '2024-01-10T00:00:00Z',
            result: 'ELIGIBLE',
            previousStatus: 'INELIGIBLE',
            details: { reason: 'Grade appeal approved' },
          },
        ],
        pagination: {
          page: 1,
          pageSize: 20,
          totalEntries: 45,
          totalPages: 3,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => expectedAuditLog,
      });

      const result = await complianceService.getAuditLog('student-123', complianceOfficerContext);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url] = mockFetch.mock.calls[0];

      expect(url).toContain('/audit-log/student-123');
      expect(result.entries).toHaveLength(3);
      expect(result.pagination.totalEntries).toBe(45);
    });

    it('should paginate audit log results', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          studentId: 'student-123',
          entries: [],
          pagination: { page: 2, pageSize: 20, totalEntries: 45, totalPages: 3 },
        }),
      });

      await complianceService.getAuditLog('student-123', complianceOfficerContext, {
        page: 2,
        pageSize: 20,
      });

      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain('page=2');
    });
  });

  describe('NCAA Rules Management (Admin)', () => {
    it('should update NCAA rules', async () => {
      const rulesUpdate = {
        ruleId: 'NCAA-14.4.3.1',
        updates: {
          minimumGpa: 2.0,
          effectiveDate: '2024-08-01',
          description: 'Updated minimum GPA requirement',
        },
        reason: 'NCAA rule change for 2024-2025 academic year',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          success: true,
          ruleId: 'NCAA-14.4.3.1',
          version: 'v2024.2',
          effectiveDate: '2024-08-01',
        }),
      });

      const result = await complianceService.updateRules(rulesUpdate, adminContext);

      expect(result.success).toBe(true);
      expect(result.version).toBe('v2024.2');
    });

    it('should reject rules update from non-admin', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          error: {
            code: 'FORBIDDEN',
            message: 'Only administrators can update NCAA rules',
          },
        }),
      });

      await expect(
        complianceService.updateRules(
          { ruleId: 'NCAA-14.4.3.1', updates: {} },
          complianceOfficerContext
        )
      ).rejects.toMatchObject({
        statusCode: 403,
      });
    });
  });

  describe('Batch Eligibility Checks', () => {
    it('should check eligibility for multiple students', async () => {
      const batchRequest = {
        studentIds: ['student-1', 'student-2', 'student-3'],
        termId: 'spring-2024',
      };

      const expectedResponse = {
        results: [
          { studentId: 'student-1', isEligible: true, status: 'ELIGIBLE' },
          { studentId: 'student-2', isEligible: false, status: 'INELIGIBLE' },
          { studentId: 'student-3', isEligible: true, status: 'CONDITIONALLY_ELIGIBLE' },
        ],
        summary: {
          total: 3,
          eligible: 1,
          conditionallyEligible: 1,
          ineligible: 1,
        },
        checkedAt: '2024-01-15T10:00:00Z',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => expectedResponse,
      });

      const result = await complianceService.batchCheckEligibility(
        batchRequest,
        complianceOfficerContext
      );

      expect(result.results).toHaveLength(3);
      expect(result.summary.eligible).toBe(1);
      expect(result.summary.ineligible).toBe(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle student not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          error: {
            code: 'STUDENT_NOT_FOUND',
            message: 'Student profile not found',
          },
        }),
      });

      await expect(
        complianceService.checkEligibility({ studentId: 'nonexistent' }, complianceOfficerContext)
      ).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it('should handle missing academic records', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 422,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          error: {
            code: 'INCOMPLETE_RECORDS',
            message: 'Student has incomplete academic records',
            details: {
              missing: ['transcript', 'enrollment_verification'],
            },
          },
        }),
      });

      await expect(
        complianceService.checkEligibility({ studentId: 'student-incomplete' }, studentContext)
      ).rejects.toMatchObject({
        statusCode: 422,
      });
    });

    it('should handle compliance service timeout', async () => {
      mockFetch.mockImplementationOnce(() => new Promise(() => {}));

      const promise = complianceService.checkEligibility(
        { studentId: 'student-123' },
        studentContext
      );

      await jest.advanceTimersByTimeAsync(31000);

      await expect(promise).rejects.toThrow();
    });
  });

  describe('Role-Based Access', () => {
    it('should allow student to check own eligibility', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ isEligible: true, status: 'ELIGIBLE' }),
      });

      const result = await complianceService.checkEligibility(
        { studentId: 'student-123' },
        studentContext
      );

      expect(result.isEligible).toBe(true);
    });

    it('should prevent student from checking other student eligibility', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          error: {
            code: 'FORBIDDEN',
            message: 'Cannot access other student records',
          },
        }),
      });

      await expect(
        complianceService.checkEligibility({ studentId: 'other-student' }, studentContext)
      ).rejects.toMatchObject({
        statusCode: 403,
      });
    });

    it('should allow compliance officer to access any student', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ isEligible: true, status: 'ELIGIBLE' }),
      });

      const result = await complianceService.checkEligibility(
        { studentId: 'any-student' },
        complianceOfficerContext
      );

      expect(result.isEligible).toBe(true);
    });
  });
});
