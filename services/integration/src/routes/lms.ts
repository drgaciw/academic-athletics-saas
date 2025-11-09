import { Hono } from 'hono';
import { z } from 'zod';
import { lmsConnector } from '../services/lmsConnector';

const app = new Hono();

// Validation schemas
const syncSchema = z.object({
  studentId: z.string().min(1),
  provider: z.enum(['canvas', 'blackboard']).default('canvas'),
});

const batchSyncSchema = z.object({
  studentIds: z.array(z.string().min(1)),
  provider: z.enum(['canvas', 'blackboard']).default('canvas'),
});

const coursesSchema = z.object({
  studentId: z.string().min(1),
  provider: z.enum(['canvas', 'blackboard']).default('canvas'),
});

const gradesSchema = z.object({
  studentId: z.string().min(1),
  provider: z.enum(['canvas', 'blackboard']).default('canvas'),
  courseId: z.string().optional(),
});

/**
 * POST /api/integration/lms/sync
 * Sync LMS data for a student (courses + grades)
 */
app.post('/sync', async (c) => {
  try {
    const body = await c.req.json();

    // Validate request body
    const validation = syncSchema.safeParse(body);
    if (!validation.success) {
      return c.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: validation.error.errors,
            timestamp: new Date().toISOString(),
          },
        },
        400
      );
    }

    const { studentId, provider } = validation.data;

    // Sync all data
    const result = await lmsConnector.syncStudentData(studentId, provider);

    if (!result.courses.success && !result.grades.success) {
      return c.json(
        {
          error: {
            code: 'SYNC_ERROR',
            message: 'Failed to sync LMS data',
            details: {
              coursesError: result.courses.error,
              gradesError: result.grades.error,
            },
            timestamp: new Date().toISOString(),
          },
        },
        500
      );
    }

    return c.json({
      success: true,
      provider,
      courses: {
        success: result.courses.success,
        count: result.courses.data?.length || 0,
        data: result.courses.data,
        error: result.courses.error,
      },
      grades: {
        success: result.grades.success,
        count: result.grades.data?.length || 0,
        data: result.grades.data,
        error: result.grades.error,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('LMS sync route error:', error);
    return c.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'An unexpected error occurred',
          timestamp: new Date().toISOString(),
        },
      },
      500
    );
  }
});

/**
 * POST /api/integration/lms/sync/batch
 * Batch sync LMS data for multiple students
 */
app.post('/sync/batch', async (c) => {
  try {
    const body = await c.req.json();

    // Validate request body
    const validation = batchSyncSchema.safeParse(body);
    if (!validation.success) {
      return c.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: validation.error.errors,
            timestamp: new Date().toISOString(),
          },
        },
        400
      );
    }

    const { studentIds, provider } = validation.data;

    // Batch sync
    const results = await lmsConnector.batchSyncStudents(studentIds, provider);

    const successCount = Object.values(results).filter(
      (r) => r.courses.success || r.grades.success
    ).length;

    return c.json({
      success: successCount > 0,
      provider,
      total: studentIds.length,
      successful: successCount,
      failed: studentIds.length - successCount,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('LMS batch sync route error:', error);
    return c.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'An unexpected error occurred',
          timestamp: new Date().toISOString(),
        },
      },
      500
    );
  }
});

/**
 * GET /api/integration/lms/courses/:studentId
 * Get courses for a student
 */
app.get('/courses/:studentId', async (c) => {
  try {
    const studentId = c.req.param('studentId');
    const provider = (c.req.query('provider') as 'canvas' | 'blackboard') || 'canvas';

    let result;

    if (provider === 'canvas') {
      result = await lmsConnector.getCanvasCourses(studentId);
    } else {
      result = await lmsConnector.getBlackboardCourses(studentId);
    }

    if (!result.success) {
      return c.json(
        {
          error: {
            code: 'FETCH_ERROR',
            message: result.error || 'Failed to fetch courses',
            timestamp: new Date().toISOString(),
          },
        },
        500
      );
    }

    return c.json({
      success: true,
      provider,
      count: result.data?.length || 0,
      courses: result.data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('LMS courses route error:', error);
    return c.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'An unexpected error occurred',
          timestamp: new Date().toISOString(),
        },
      },
      500
    );
  }
});

/**
 * GET /api/integration/lms/grades/:studentId
 * Get grades for a student
 */
app.get('/grades/:studentId', async (c) => {
  try {
    const studentId = c.req.param('studentId');
    const provider = (c.req.query('provider') as 'canvas' | 'blackboard') || 'canvas';
    const courseId = c.req.query('courseId');

    let result;

    if (provider === 'canvas') {
      result = await lmsConnector.getCanvasGrades(studentId);
    } else if (courseId) {
      result = await lmsConnector.getBlackboardGrades(studentId, courseId);
    } else {
      return c.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'courseId is required for Blackboard grades',
            timestamp: new Date().toISOString(),
          },
        },
        400
      );
    }

    if (!result.success) {
      return c.json(
        {
          error: {
            code: 'FETCH_ERROR',
            message: result.error || 'Failed to fetch grades',
            timestamp: new Date().toISOString(),
          },
        },
        500
      );
    }

    return c.json({
      success: true,
      provider,
      count: result.data?.length || 0,
      grades: result.data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('LMS grades route error:', error);
    return c.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'An unexpected error occurred',
          timestamp: new Date().toISOString(),
        },
      },
      500
    );
  }
});

/**
 * GET /api/integration/lms/assignments/:courseId
 * Get assignments for a course
 */
app.get('/assignments/:courseId', async (c) => {
  try {
    const courseId = c.req.param('courseId');
    const studentId = c.req.query('studentId');
    const provider = (c.req.query('provider') as 'canvas' | 'blackboard') || 'canvas';

    if (!studentId) {
      return c.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'studentId query parameter is required',
            timestamp: new Date().toISOString(),
          },
        },
        400
      );
    }

    if (provider !== 'canvas') {
      return c.json(
        {
          error: {
            code: 'NOT_SUPPORTED',
            message: 'Assignments endpoint currently only supports Canvas',
            timestamp: new Date().toISOString(),
          },
        },
        501
      );
    }

    const result = await lmsConnector.getCanvasAssignments(courseId, studentId);

    if (!result.success) {
      return c.json(
        {
          error: {
            code: 'FETCH_ERROR',
            message: result.error || 'Failed to fetch assignments',
            timestamp: new Date().toISOString(),
          },
        },
        500
      );
    }

    return c.json({
      success: true,
      provider,
      courseId,
      count: result.data?.length || 0,
      assignments: result.data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('LMS assignments route error:', error);
    return c.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'An unexpected error occurred',
          timestamp: new Date().toISOString(),
        },
      },
      500
    );
  }
});

/**
 * GET /api/integration/lms/health
 * Check LMS connection health
 */
app.get('/health', async (c) => {
  try {
    const provider = (c.req.query('provider') as 'canvas' | 'blackboard') || 'canvas';

    const isConnected = await lmsConnector.checkConnection(provider);

    return c.json({
      status: isConnected ? 'healthy' : 'unavailable',
      provider,
      connected: isConnected,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('LMS health check error:', error);
    return c.json(
      {
        error: {
          code: 'HEALTH_CHECK_ERROR',
          message: error instanceof Error ? error.message : 'Health check failed',
          timestamp: new Date().toISOString(),
        },
      },
      500
    );
  }
});

export default app;
