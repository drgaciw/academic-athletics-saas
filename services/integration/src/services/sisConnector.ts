import axios, { AxiosInstance } from 'axios';

export interface SISStudent {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  studentId: string;
  dateOfBirth?: string;
  enrollmentStatus: 'active' | 'inactive' | 'graduated' | 'withdrawn';
  admissionDate?: string;
  expectedGraduationDate?: string;
}

export interface SISEnrollment {
  studentId: string;
  courseId: string;
  courseName: string;
  courseCode: string;
  term: string;
  credits: number;
  status: 'enrolled' | 'dropped' | 'completed' | 'withdrawn';
  grade?: string;
  gradePoints?: number;
}

export interface SISTranscript {
  studentId: string;
  studentName: string;
  enrollments: SISEnrollment[];
  cumulativeGPA: number;
  totalCreditsEarned: number;
  totalCreditsAttempted: number;
  academicStanding: string;
}

export interface SISImportResult {
  success: boolean;
  recordsImported?: number;
  errors?: string[];
  data?: any;
}

/**
 * SIS (Student Information System) Connector
 * Imports enrollment, transcript, and student data
 */
export class SISConnector {
  private client: AxiosInstance | null = null;

  constructor() {
    // Initialize SIS API client
    if (process.env.SIS_API_URL && process.env.SIS_API_KEY) {
      this.client = axios.create({
        baseURL: process.env.SIS_API_URL,
        headers: {
          'Authorization': `Bearer ${process.env.SIS_API_KEY}`,
          'Content-Type': 'application/json',
          'X-API-Version': '2.0',
        },
        timeout: 60000, // Longer timeout for bulk operations
      });
    }
  }

  /**
   * Import student data from SIS
   */
  async importStudent(studentId: string): Promise<SISImportResult> {
    try {
      if (!this.client) {
        throw new Error('SIS API not configured');
      }

      const response = await this.client.get(`/students/${studentId}`);

      const student: SISStudent = {
        id: response.data.id,
        firstName: response.data.first_name,
        lastName: response.data.last_name,
        email: response.data.email,
        studentId: response.data.student_id,
        dateOfBirth: response.data.date_of_birth,
        enrollmentStatus: this.mapEnrollmentStatus(response.data.status),
        admissionDate: response.data.admission_date,
        expectedGraduationDate: response.data.expected_graduation_date,
      };

      return {
        success: true,
        recordsImported: 1,
        data: student,
      };
    } catch (error) {
      console.error('SIS student import error:', error);
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Failed to import student data'],
      };
    }
  }

  /**
   * Import enrollment data for a student
   */
  async importEnrollments(studentId: string, term?: string): Promise<SISImportResult> {
    try {
      if (!this.client) {
        throw new Error('SIS API not configured');
      }

      const params: any = {};
      if (term) {
        params.term = term;
      }

      const response = await this.client.get(`/students/${studentId}/enrollments`, { params });

      const enrollments: SISEnrollment[] = response.data.map((enrollment: any) => ({
        studentId: enrollment.student_id,
        courseId: enrollment.course_id,
        courseName: enrollment.course_name,
        courseCode: enrollment.course_code,
        term: enrollment.term,
        credits: enrollment.credits,
        status: this.mapEnrollmentStatus(enrollment.status),
        grade: enrollment.grade,
        gradePoints: enrollment.grade_points,
      }));

      return {
        success: true,
        recordsImported: enrollments.length,
        data: enrollments,
      };
    } catch (error) {
      console.error('SIS enrollment import error:', error);
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Failed to import enrollment data'],
      };
    }
  }

  /**
   * Import transcript data for a student
   */
  async importTranscript(studentId: string): Promise<SISImportResult> {
    try {
      if (!this.client) {
        throw new Error('SIS API not configured');
      }

      const response = await this.client.get(`/students/${studentId}/transcript`);

      const transcript: SISTranscript = {
        studentId: response.data.student_id,
        studentName: `${response.data.first_name} ${response.data.last_name}`,
        enrollments: response.data.enrollments.map((enrollment: any) => ({
          studentId: enrollment.student_id,
          courseId: enrollment.course_id,
          courseName: enrollment.course_name,
          courseCode: enrollment.course_code,
          term: enrollment.term,
          credits: enrollment.credits,
          status: 'completed',
          grade: enrollment.grade,
          gradePoints: enrollment.grade_points,
        })),
        cumulativeGPA: response.data.cumulative_gpa,
        totalCreditsEarned: response.data.total_credits_earned,
        totalCreditsAttempted: response.data.total_credits_attempted,
        academicStanding: response.data.academic_standing,
      };

      return {
        success: true,
        recordsImported: 1,
        data: transcript,
      };
    } catch (error) {
      console.error('SIS transcript import error:', error);
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Failed to import transcript data'],
      };
    }
  }

  /**
   * Batch import students
   */
  async batchImportStudents(studentIds: string[]): Promise<SISImportResult> {
    const results: SISStudent[] = [];
    const errors: string[] = [];

    for (const studentId of studentIds) {
      const result = await this.importStudent(studentId);

      if (result.success && result.data) {
        results.push(result.data);
      } else if (result.errors) {
        errors.push(`${studentId}: ${result.errors.join(', ')}`);
      }

      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return {
      success: errors.length === 0,
      recordsImported: results.length,
      data: results,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * Import all data for a student (student info + enrollments + transcript)
   */
  async importAllStudentData(studentId: string): Promise<{
    student: SISImportResult;
    enrollments: SISImportResult;
    transcript: SISImportResult;
  }> {
    const [student, enrollments, transcript] = await Promise.all([
      this.importStudent(studentId),
      this.importEnrollments(studentId),
      this.importTranscript(studentId),
    ]);

    return {
      student,
      enrollments,
      transcript,
    };
  }

  /**
   * Import enrollment data for a specific term
   */
  async importTermEnrollments(term: string): Promise<SISImportResult> {
    try {
      if (!this.client) {
        throw new Error('SIS API not configured');
      }

      const response = await this.client.get(`/enrollments`, {
        params: { term },
      });

      const enrollments: SISEnrollment[] = response.data.map((enrollment: any) => ({
        studentId: enrollment.student_id,
        courseId: enrollment.course_id,
        courseName: enrollment.course_name,
        courseCode: enrollment.course_code,
        term: enrollment.term,
        credits: enrollment.credits,
        status: this.mapEnrollmentStatus(enrollment.status),
        grade: enrollment.grade,
        gradePoints: enrollment.grade_points,
      }));

      return {
        success: true,
        recordsImported: enrollments.length,
        data: enrollments,
      };
    } catch (error) {
      console.error('SIS term enrollment import error:', error);
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Failed to import term enrollments'],
      };
    }
  }

  /**
   * Verify student eligibility data
   */
  async verifyEligibilityData(studentId: string): Promise<{
    isValid: boolean;
    missingFields: string[];
    data?: {
      hasValidGPA: boolean;
      hasValidCredits: boolean;
      hasCurrentEnrollment: boolean;
    };
  }> {
    try {
      const result = await this.importAllStudentData(studentId);

      const missingFields: string[] = [];
      const data = {
        hasValidGPA: false,
        hasValidCredits: false,
        hasCurrentEnrollment: false,
      };

      if (!result.student.success || !result.student.data) {
        missingFields.push('student profile');
      }

      if (!result.transcript.success || !result.transcript.data) {
        missingFields.push('transcript data');
      } else {
        const transcript = result.transcript.data as SISTranscript;
        data.hasValidGPA = transcript.cumulativeGPA > 0;
        data.hasValidCredits = transcript.totalCreditsEarned > 0;
      }

      if (!result.enrollments.success || !result.enrollments.data) {
        missingFields.push('enrollment data');
      } else {
        const enrollments = result.enrollments.data as SISEnrollment[];
        data.hasCurrentEnrollment = enrollments.some(e => e.status === 'enrolled');
      }

      return {
        isValid: missingFields.length === 0,
        missingFields,
        data: missingFields.length === 0 ? data : undefined,
      };
    } catch (error) {
      console.error('SIS eligibility verification error:', error);
      return {
        isValid: false,
        missingFields: ['system error'],
      };
    }
  }

  /**
   * Map enrollment status from SIS to our system
   */
  private mapEnrollmentStatus(status: string): any {
    const statusMap: Record<string, string> = {
      'active': 'enrolled',
      'enrolled': 'enrolled',
      'dropped': 'dropped',
      'withdrawn': 'withdrawn',
      'completed': 'completed',
      'finished': 'completed',
    };

    return statusMap[status.toLowerCase()] || status;
  }

  /**
   * Check SIS connection health
   */
  async checkConnection(): Promise<boolean> {
    try {
      if (!this.client) {
        return false;
      }

      await this.client.get('/health');
      return true;
    } catch (error) {
      console.error('SIS connection check failed:', error);
      return false;
    }
  }
}

export const sisConnector = new SISConnector();
