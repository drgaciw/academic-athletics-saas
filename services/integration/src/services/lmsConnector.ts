import axios, { AxiosInstance } from 'axios';

export interface LMSCourse {
  id: string;
  name: string;
  courseCode: string;
  enrollmentTerm?: string;
}

export interface LMSAssignment {
  id: string;
  courseId: string;
  name: string;
  dueAt?: string;
  pointsPossible?: number;
  submittedAt?: string;
  score?: number;
  grade?: string;
}

export interface LMSGrade {
  courseId: string;
  courseName: string;
  currentGrade?: string;
  currentScore?: number;
  finalGrade?: string;
  finalScore?: number;
}

export interface LMSSyncResult {
  success: boolean;
  data?: any;
  error?: string;
  provider: 'canvas' | 'blackboard';
}

/**
 * LMS Connector for Canvas and Blackboard integration
 * Syncs grades, assignments, and course data
 */
export class LMSConnector {
  private canvasClient: AxiosInstance | null = null;
  private blackboardClient: AxiosInstance | null = null;

  constructor() {
    // Initialize Canvas API client
    if (process.env.CANVAS_API_URL && process.env.CANVAS_API_TOKEN) {
      this.canvasClient = axios.create({
        baseURL: process.env.CANVAS_API_URL,
        headers: {
          'Authorization': `Bearer ${process.env.CANVAS_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      });
    }

    // Initialize Blackboard API client
    if (process.env.BLACKBOARD_API_URL && process.env.BLACKBOARD_API_TOKEN) {
      this.blackboardClient = axios.create({
        baseURL: process.env.BLACKBOARD_API_URL,
        headers: {
          'Authorization': `Bearer ${process.env.BLACKBOARD_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      });
    }
  }

  /**
   * Get Canvas courses for a student
   */
  async getCanvasCourses(studentId: string): Promise<LMSSyncResult> {
    try {
      if (!this.canvasClient) {
        throw new Error('Canvas API not configured');
      }

      const response = await this.canvasClient.get(`/api/v1/users/${studentId}/courses`, {
        params: {
          enrollment_state: 'active',
          include: ['term', 'total_scores'],
        },
      });

      const courses: LMSCourse[] = response.data.map((course: any) => ({
        id: course.id.toString(),
        name: course.name,
        courseCode: course.course_code,
        enrollmentTerm: course.enrollment_term_id?.toString(),
      }));

      return {
        success: true,
        data: courses,
        provider: 'canvas',
      };
    } catch (error) {
      console.error('Canvas courses fetch error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch Canvas courses',
        provider: 'canvas',
      };
    }
  }

  /**
   * Get Canvas assignments for a course
   */
  async getCanvasAssignments(courseId: string, studentId: string): Promise<LMSSyncResult> {
    try {
      if (!this.canvasClient) {
        throw new Error('Canvas API not configured');
      }

      const response = await this.canvasClient.get(
        `/api/v1/courses/${courseId}/assignments`,
        {
          params: {
            include: ['submission'],
            per_page: 100,
          },
        }
      );

      const assignments: LMSAssignment[] = response.data.map((assignment: any) => ({
        id: assignment.id.toString(),
        courseId: courseId,
        name: assignment.name,
        dueAt: assignment.due_at,
        pointsPossible: assignment.points_possible,
        submittedAt: assignment.submission?.submitted_at,
        score: assignment.submission?.score,
        grade: assignment.submission?.grade,
      }));

      return {
        success: true,
        data: assignments,
        provider: 'canvas',
      };
    } catch (error) {
      console.error('Canvas assignments fetch error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch Canvas assignments',
        provider: 'canvas',
      };
    }
  }

  /**
   * Get Canvas grades for a student
   */
  async getCanvasGrades(studentId: string): Promise<LMSSyncResult> {
    try {
      if (!this.canvasClient) {
        throw new Error('Canvas API not configured');
      }

      const coursesResult = await this.getCanvasCourses(studentId);
      if (!coursesResult.success || !coursesResult.data) {
        return coursesResult;
      }

      const grades: LMSGrade[] = [];

      for (const course of coursesResult.data) {
        try {
          const response = await this.canvasClient.get(
            `/api/v1/courses/${course.id}/students/submissions/${studentId}`,
            {
              params: {
                grouped: true,
              },
            }
          );

          const enrollments = await this.canvasClient.get(
            `/api/v1/courses/${course.id}/enrollments`,
            {
              params: {
                user_id: studentId,
              },
            }
          );

          const enrollment = enrollments.data[0];

          grades.push({
            courseId: course.id,
            courseName: course.name,
            currentGrade: enrollment?.grades?.current_grade,
            currentScore: enrollment?.grades?.current_score,
            finalGrade: enrollment?.grades?.final_grade,
            finalScore: enrollment?.grades?.final_score,
          });
        } catch (err) {
          console.error(`Error fetching grades for course ${course.id}:`, err);
          // Continue with other courses
        }
      }

      return {
        success: true,
        data: grades,
        provider: 'canvas',
      };
    } catch (error) {
      console.error('Canvas grades fetch error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch Canvas grades',
        provider: 'canvas',
      };
    }
  }

  /**
   * Get Blackboard courses for a student
   */
  async getBlackboardCourses(studentId: string): Promise<LMSSyncResult> {
    try {
      if (!this.blackboardClient) {
        throw new Error('Blackboard API not configured');
      }

      const response = await this.blackboardClient.get(
        `/learn/api/public/v3/users/${studentId}/courses`
      );

      const courses: LMSCourse[] = response.data.results.map((course: any) => ({
        id: course.id,
        name: course.name,
        courseCode: course.courseId,
        enrollmentTerm: course.termId,
      }));

      return {
        success: true,
        data: courses,
        provider: 'blackboard',
      };
    } catch (error) {
      console.error('Blackboard courses fetch error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch Blackboard courses',
        provider: 'blackboard',
      };
    }
  }

  /**
   * Get Blackboard grades for a student
   */
  async getBlackboardGrades(studentId: string, courseId: string): Promise<LMSSyncResult> {
    try {
      if (!this.blackboardClient) {
        throw new Error('Blackboard API not configured');
      }

      const response = await this.blackboardClient.get(
        `/learn/api/public/v2/courses/${courseId}/gradebook/columns`,
        {
          params: {
            userId: studentId,
          },
        }
      );

      return {
        success: true,
        data: response.data,
        provider: 'blackboard',
      };
    } catch (error) {
      console.error('Blackboard grades fetch error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch Blackboard grades',
        provider: 'blackboard',
      };
    }
  }

  /**
   * Sync all LMS data for a student
   */
  async syncStudentData(
    studentId: string,
    provider: 'canvas' | 'blackboard' = 'canvas'
  ): Promise<{
    courses: LMSSyncResult;
    grades: LMSSyncResult;
  }> {
    if (provider === 'canvas') {
      const courses = await this.getCanvasCourses(studentId);
      const grades = await this.getCanvasGrades(studentId);

      return { courses, grades };
    } else {
      const courses = await this.getBlackboardCourses(studentId);

      // For Blackboard, we need to fetch grades per course
      const allGrades: LMSGrade[] = [];
      if (courses.success && courses.data) {
        for (const course of courses.data) {
          const gradesResult = await this.getBlackboardGrades(studentId, course.id);
          if (gradesResult.success && gradesResult.data) {
            allGrades.push({
              courseId: course.id,
              courseName: course.name,
              currentGrade: gradesResult.data.grade,
              currentScore: gradesResult.data.score,
            });
          }
        }
      }

      return {
        courses,
        grades: {
          success: true,
          data: allGrades,
          provider: 'blackboard',
        },
      };
    }
  }

  /**
   * Batch sync multiple students
   */
  async batchSyncStudents(
    studentIds: string[],
    provider: 'canvas' | 'blackboard' = 'canvas'
  ): Promise<Record<string, { courses: LMSSyncResult; grades: LMSSyncResult }>> {
    const results: Record<string, any> = {};

    for (const studentId of studentIds) {
      results[studentId] = await this.syncStudentData(studentId, provider);

      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    return results;
  }

  /**
   * Check LMS connection health
   */
  async checkConnection(provider: 'canvas' | 'blackboard'): Promise<boolean> {
    try {
      if (provider === 'canvas' && this.canvasClient) {
        await this.canvasClient.get('/api/v1/accounts/self');
        return true;
      } else if (provider === 'blackboard' && this.blackboardClient) {
        await this.blackboardClient.get('/learn/api/public/v1/system/version');
        return true;
      }
      return false;
    } catch (error) {
      console.error(`${provider} connection check failed:`, error);
      return false;
    }
  }
}

export const lmsConnector = new LMSConnector();
