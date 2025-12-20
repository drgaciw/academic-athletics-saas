/**
 * Advising Service Integration Tests
 *
 * Tests the full advising flow including schedule generation,
 * conflict detection, course recommendations, and degree progress tracking.
 */

import { AdvisingService, advisingService } from '../../advisingService';
import { UserRole, type RequestContext } from '../../../middleware/authentication';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('AdvisingService Integration Tests', () => {
  const studentContext: RequestContext = {
    userId: 'student-123',
    clerkId: 'clerk_student123',
    role: UserRole.STUDENT,
    correlationId: 'corr-advising-123',
    timestamp: new Date('2024-01-15T10:00:00Z'),
  };

  const advisorContext: RequestContext = {
    userId: 'advisor-123',
    clerkId: 'clerk_advisor123',
    role: UserRole.ADVISOR,
    correlationId: 'corr-advising-456',
    timestamp: new Date('2024-01-15T10:00:00Z'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Schedule Generation Flow', () => {
    it('should generate an optimal course schedule', async () => {
      const scheduleRequest = {
        studentId: 'student-123',
        termId: 'fall-2024',
        preferredCourses: ['ECON201', 'COMM150', 'PSYCH101'],
        constraints: {
          maxCredits: 15,
          noClassesBefore: '09:00',
          noClassesAfter: '14:00', // Afternoon practice
          practiceSchedule: [
            { day: 'MONDAY', start: '14:00', end: '18:00' },
            { day: 'WEDNESDAY', start: '14:00', end: '18:00' },
            { day: 'FRIDAY', start: '14:00', end: '18:00' },
          ],
          preferredDays: ['TUESDAY', 'THURSDAY'],
        },
      };

      const expectedResponse = {
        schedule: [
          {
            courseId: 'course-1',
            courseName: 'Microeconomics',
            courseCode: 'ECON201',
            credits: 3,
            instructor: 'Dr. Smith',
            meetingTimes: [
              { day: 'TUESDAY', start: '09:30', end: '10:45', location: 'Econ Hall 201' },
              { day: 'THURSDAY', start: '09:30', end: '10:45', location: 'Econ Hall 201' },
            ],
          },
          {
            courseId: 'course-2',
            courseName: 'Public Speaking',
            courseCode: 'COMM150',
            credits: 3,
            instructor: 'Prof. Johnson',
            meetingTimes: [
              { day: 'TUESDAY', start: '11:00', end: '12:15', location: 'Comm Building 105' },
              { day: 'THURSDAY', start: '11:00', end: '12:15', location: 'Comm Building 105' },
            ],
          },
          {
            courseId: 'course-3',
            courseName: 'Introduction to Psychology',
            courseCode: 'PSYCH101',
            credits: 3,
            instructor: 'Dr. Williams',
            meetingTimes: [
              { day: 'MONDAY', start: '09:00', end: '09:50', location: 'Psych Hall 100' },
              { day: 'WEDNESDAY', start: '09:00', end: '09:50', location: 'Psych Hall 100' },
              { day: 'FRIDAY', start: '09:00', end: '09:50', location: 'Psych Hall 100' },
            ],
          },
        ],
        conflicts: [],
        warnings: ['MWF class ends 10 minutes before practice - allow travel time'],
        totalCredits: 9,
        generatedAt: '2024-01-15T10:00:00Z',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => expectedResponse,
      });

      const result = await advisingService.generateSchedule(scheduleRequest, studentContext);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];

      expect(url).toContain('/schedule');
      expect(options.method).toBe('POST');

      const body = JSON.parse(options.body);
      expect(body.constraints.noClassesAfter).toBe('14:00');

      expect(result.schedule).toHaveLength(3);
      expect(result.totalCredits).toBe(9);
      expect(result.conflicts).toHaveLength(0);
    });

    it('should detect and report schedule conflicts', async () => {
      const expectedResponse = {
        schedule: [
          {
            courseId: 'course-1',
            courseCode: 'ECON201',
            courseName: 'Microeconomics',
            credits: 3,
            meetingTimes: [{ day: 'TUESDAY', start: '10:00', end: '11:15' }],
          },
        ],
        conflicts: [
          {
            type: 'TIME_OVERLAP',
            course1: { code: 'ECON201', time: 'Tue 10:00-11:15' },
            course2: { code: 'MATH201', time: 'Tue 10:30-11:45' },
            overlapMinutes: 45,
            suggestion: 'Choose different section of MATH201 (Section 002: MWF 9:00)',
          },
          {
            type: 'PRACTICE_CONFLICT',
            course: { code: 'CHEM101L', time: 'Mon 14:00-17:00' },
            practice: { day: 'MONDAY', start: '14:00', end: '18:00' },
            suggestion: 'CHEM101L conflicts with Monday practice',
          },
        ],
        warnings: [],
        totalCredits: 3,
        unscheduledCourses: ['MATH201', 'CHEM101L'],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => expectedResponse,
      });

      const result = await advisingService.generateSchedule(
        {
          studentId: 'student-123',
          termId: 'fall-2024',
          preferredCourses: ['ECON201', 'MATH201', 'CHEM101L'],
        },
        studentContext
      );

      expect(result.conflicts).toHaveLength(2);
      expect(result.conflicts[0].type).toBe('TIME_OVERLAP');
      expect(result.conflicts[1].type).toBe('PRACTICE_CONFLICT');
      expect(result.unscheduledCourses).toContain('MATH201');
    });

    it('should handle no available sections', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          schedule: [],
          conflicts: [],
          warnings: ['All sections of requested courses conflict with constraints'],
          totalCredits: 0,
          unscheduledCourses: ['ECON201', 'MATH201'],
          suggestions: [
            'Relax time constraints',
            'Consider alternative courses',
            'Check summer session availability',
          ],
        }),
      });

      const result = await advisingService.generateSchedule(
        {
          studentId: 'student-123',
          termId: 'fall-2024',
          preferredCourses: ['ECON201', 'MATH201'],
          constraints: { noClassesBefore: '12:00', noClassesAfter: '13:00' },
        },
        studentContext
      );

      expect(result.schedule).toHaveLength(0);
      expect(result.suggestions).toBeDefined();
    });
  });

  describe('Conflict Detection', () => {
    it('should check for scheduling conflicts', async () => {
      const expectedConflicts = {
        hasConflicts: true,
        conflicts: [
          {
            type: 'TRAVEL_TIME',
            fromCourse: 'ECON201',
            fromLocation: 'Econ Hall',
            toCourse: 'CHEM101',
            toLocation: 'Science Building',
            availableTime: 10,
            requiredTime: 15,
            day: 'TUESDAY',
          },
        ],
        schedule: [
          { courseCode: 'ECON201', day: 'TUESDAY', start: '09:30', end: '10:20' },
          { courseCode: 'CHEM101', day: 'TUESDAY', start: '10:30', end: '11:20' },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => expectedConflicts,
      });

      const result = await advisingService.checkConflicts('student-123', advisorContext);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url] = mockFetch.mock.calls[0];

      expect(url).toContain('/conflicts/student-123');
      expect(result.hasConflicts).toBe(true);
      expect(result.conflicts[0].type).toBe('TRAVEL_TIME');
    });

    it('should return no conflicts for valid schedule', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          hasConflicts: false,
          conflicts: [],
          schedule: [
            { courseCode: 'ECON201', day: 'TUESDAY', start: '09:00', end: '10:15' },
            { courseCode: 'COMM150', day: 'TUESDAY', start: '11:00', end: '12:15' },
          ],
        }),
      });

      const result = await advisingService.checkConflicts('student-456', studentContext);

      expect(result.hasConflicts).toBe(false);
      expect(result.conflicts).toHaveLength(0);
    });
  });

  describe('Course Recommendations', () => {
    it('should get personalized course recommendations', async () => {
      const recommendRequest = {
        studentId: 'student-123',
        termId: 'fall-2024',
        filters: {
          fulfillRequirements: true,
          matchInterests: true,
          optimizeGpa: true,
        },
      };

      const expectedResponse = {
        recommendations: [
          {
            courseId: 'course-101',
            courseCode: 'ECON201',
            courseName: 'Microeconomics',
            credits: 3,
            fulfills: ['Social Science Requirement', 'Business Minor'],
            difficulty: 'MODERATE',
            athleteSuccessRate: 0.85,
            averageGrade: 'B+',
            rationale: 'Fulfills multiple requirements with high athlete success rate',
            priority: 1,
          },
          {
            courseId: 'course-102',
            courseCode: 'COMM150',
            courseName: 'Public Speaking',
            credits: 3,
            fulfills: ['Communication Requirement'],
            difficulty: 'EASY',
            athleteSuccessRate: 0.92,
            averageGrade: 'A-',
            rationale: 'Communication elective with excellent athlete performance',
            priority: 2,
          },
        ],
        degreeProgress: {
          currentProgress: 45,
          afterEnrollment: 51,
          remainingRequirements: 12,
        },
        gpaProjection: {
          current: 3.2,
          projected: 3.25,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => expectedResponse,
      });

      const result = await advisingService.getRecommendations(recommendRequest, advisorContext);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];

      expect(url).toContain('/recommend');
      expect(options.method).toBe('POST');

      expect(result.recommendations).toHaveLength(2);
      expect(result.recommendations[0].athleteSuccessRate).toBeGreaterThan(0.8);
    });

    it('should recommend courses to maintain eligibility', async () => {
      const expectedResponse = {
        recommendations: [
          {
            courseCode: 'MATH099',
            courseName: 'Math Foundations',
            credits: 3,
            rationale: 'GPA booster - historically strong athlete performance',
            eligibilityImpact: {
              currentGpaDeficit: 0.15,
              projectedImprovement: 0.2,
              eligibilityRisk: 'LOW after completion',
            },
            priority: 1,
            urgency: 'HIGH',
          },
        ],
        eligibilityWarning: 'Current GPA 1.85 is below 2.0 minimum',
        requiredAction: 'Must raise GPA by 0.15 points to maintain eligibility',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => expectedResponse,
      });

      const result = await advisingService.getRecommendations(
        { studentId: 'at-risk-student', termId: 'spring-2024' },
        advisorContext
      );

      expect(result.eligibilityWarning).toBeDefined();
      expect(result.recommendations[0].urgency).toBe('HIGH');
    });
  });

  describe('Degree Progress Tracking', () => {
    it('should track comprehensive degree progress', async () => {
      const expectedProgress = {
        studentId: 'student-123',
        major: 'Business Administration',
        minor: 'Communications',
        totalCreditsRequired: 120,
        creditsCompleted: 75,
        creditsInProgress: 15,
        percentComplete: 62.5,
        projectedGraduation: 'May 2026',
        requirements: [
          {
            category: 'Core Requirements',
            required: 30,
            completed: 30,
            remaining: 0,
            status: 'COMPLETE',
          },
          {
            category: 'Major Requirements',
            required: 45,
            completed: 27,
            remaining: 18,
            status: 'IN_PROGRESS',
            courses: [
              { code: 'BUS301', name: 'Business Strategy', status: 'NOT_STARTED' },
              { code: 'BUS302', name: 'Operations Management', status: 'NOT_STARTED' },
            ],
          },
          {
            category: 'Minor Requirements',
            required: 18,
            completed: 9,
            remaining: 9,
            status: 'IN_PROGRESS',
          },
          {
            category: 'General Education',
            required: 27,
            completed: 24,
            remaining: 3,
            status: 'ALMOST_COMPLETE',
          },
        ],
        eligibilityProgress: {
          meetsNcaaProgress: true,
          progressPercent: 65,
          requiredPercent: 60, // For 3rd year
        },
        advisorNotes: 'On track for graduation. Consider summer courses for minor.',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => expectedProgress,
      });

      const result = await advisingService.getDegreeProgress('student-123', studentContext);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url] = mockFetch.mock.calls[0];

      expect(url).toContain('/degree-progress/student-123');
      expect(result.percentComplete).toBe(62.5);
      expect(result.requirements).toHaveLength(4);
      expect(result.eligibilityProgress.meetsNcaaProgress).toBe(true);
    });

    it('should flag insufficient progress toward degree', async () => {
      const expectedProgress = {
        studentId: 'student-at-risk',
        major: 'Engineering',
        totalCreditsRequired: 128,
        creditsCompleted: 40,
        percentComplete: 31.25,
        projectedGraduation: 'May 2027',
        requirements: [],
        eligibilityProgress: {
          meetsNcaaProgress: false,
          progressPercent: 31,
          requiredPercent: 40, // For 2nd year
          deficit: 9,
        },
        warnings: [
          'Progress toward degree below NCAA requirement',
          'Must complete 9% more credits by end of term',
        ],
        recommendations: [
          'Schedule meeting with academic advisor',
          'Consider course overload if GPA permits',
          'Explore summer course options',
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => expectedProgress,
      });

      const result = await advisingService.getDegreeProgress('student-at-risk', advisorContext);

      expect(result.eligibilityProgress.meetsNcaaProgress).toBe(false);
      expect(result.eligibilityProgress.deficit).toBe(9);
      expect(result.warnings).toHaveLength(2);
    });
  });

  describe('Schedule Validation', () => {
    it('should validate a proposed schedule', async () => {
      const validateRequest = {
        studentId: 'student-123',
        termId: 'fall-2024',
        proposedCourses: ['ECON201', 'MATH201', 'COMM150', 'PSYCH101', 'HIST200'],
      };

      const expectedResponse = {
        isValid: true,
        totalCredits: 15,
        validation: {
          creditLimit: { passed: true, limit: 18, proposed: 15 },
          prerequisites: { passed: true, issues: [] },
          timeConflicts: { passed: true, conflicts: [] },
          practiceConflicts: { passed: true, conflicts: [] },
          eligibilityImpact: { passed: true, projectedGpa: 3.1, maintainsEligibility: true },
        },
        warnings: [],
        recommendations: [],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => expectedResponse,
      });

      const result = await advisingService.validateSchedule(validateRequest, studentContext);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];

      expect(url).toContain('/validate-schedule');
      expect(options.method).toBe('POST');

      expect(result.isValid).toBe(true);
      expect(result.validation.creditLimit.passed).toBe(true);
    });

    it('should reject schedule with prerequisite issues', async () => {
      const expectedResponse = {
        isValid: false,
        totalCredits: 15,
        validation: {
          creditLimit: { passed: true, limit: 18, proposed: 15 },
          prerequisites: {
            passed: false,
            issues: [
              {
                course: 'ECON301',
                missingPrerequisite: 'ECON201',
                message: 'ECON201 required before taking ECON301',
              },
            ],
          },
          timeConflicts: { passed: true, conflicts: [] },
          practiceConflicts: { passed: true, conflicts: [] },
        },
        warnings: [],
        recommendations: ['Add ECON201 to schedule or wait until it is completed'],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => expectedResponse,
      });

      const result = await advisingService.validateSchedule(
        {
          studentId: 'student-123',
          termId: 'fall-2024',
          proposedCourses: ['ECON301', 'MATH201'],
        },
        studentContext
      );

      expect(result.isValid).toBe(false);
      expect(result.validation.prerequisites.passed).toBe(false);
      expect(result.validation.prerequisites.issues[0].missingPrerequisite).toBe('ECON201');
    });

    it('should warn about credit overload', async () => {
      const expectedResponse = {
        isValid: true, // Can still be valid but with warnings
        totalCredits: 21,
        validation: {
          creditLimit: {
            passed: false,
            limit: 18,
            proposed: 21,
            requiresApproval: true,
          },
          prerequisites: { passed: true, issues: [] },
          timeConflicts: { passed: true, conflicts: [] },
        },
        warnings: [
          'Schedule exceeds standard 18 credit limit',
          'Requires advisor approval for overload',
        ],
        recommendations: [
          'Consider dropping one course',
          'Consult with advisor about workload',
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => expectedResponse,
      });

      const result = await advisingService.validateSchedule(
        {
          studentId: 'student-123',
          termId: 'fall-2024',
          proposedCourses: ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7'],
        },
        advisorContext
      );

      expect(result.totalCredits).toBe(21);
      expect(result.validation.creditLimit.requiresApproval).toBe(true);
      expect(result.warnings).toContain('Schedule exceeds standard 18 credit limit');
    });
  });

  describe('Travel Schedule Integration', () => {
    it('should account for team travel in scheduling', async () => {
      const scheduleRequest = {
        studentId: 'student-123',
        termId: 'fall-2024',
        preferredCourses: ['ECON201'],
        constraints: {
          travelDates: [
            { start: '2024-10-15', end: '2024-10-18', event: 'Away Game @ State U' },
            { start: '2024-11-01', end: '2024-11-03', event: 'Tournament' },
          ],
        },
      };

      const expectedResponse = {
        schedule: [
          {
            courseCode: 'ECON201',
            courseName: 'Microeconomics',
            meetingTimes: [
              { day: 'TUESDAY', start: '09:30', end: '10:45' },
              { day: 'THURSDAY', start: '09:30', end: '10:45' },
            ],
          },
        ],
        travelImpact: {
          missedClasses: [
            { course: 'ECON201', date: '2024-10-15', type: 'lecture' },
            { course: 'ECON201', date: '2024-10-17', type: 'lecture' },
            { course: 'ECON201', date: '2024-11-01', type: 'lecture' },
          ],
          totalMissed: 3,
          percentageImpact: 8.3,
        },
        recommendations: [
          'Contact professor about makeup work policy',
          'Request lecture recordings for travel dates',
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => expectedResponse,
      });

      const result = await advisingService.generateSchedule(scheduleRequest, studentContext);

      expect(result.travelImpact).toBeDefined();
      expect(result.travelImpact.missedClasses).toHaveLength(3);
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
        advisingService.getDegreeProgress('nonexistent', advisorContext)
      ).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it('should handle invalid term', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          error: {
            code: 'INVALID_TERM',
            message: 'Term invalid-term is not a valid term',
          },
        }),
      });

      await expect(
        advisingService.generateSchedule(
          { studentId: 'student-123', termId: 'invalid-term' },
          studentContext
        )
      ).rejects.toMatchObject({
        statusCode: 400,
      });
    });

    it('should handle course not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          error: {
            code: 'COURSE_NOT_FOUND',
            message: 'Course FAKE999 not found in catalog',
          },
        }),
      });

      await expect(
        advisingService.generateSchedule(
          { studentId: 'student-123', termId: 'fall-2024', preferredCourses: ['FAKE999'] },
          studentContext
        )
      ).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });
});
