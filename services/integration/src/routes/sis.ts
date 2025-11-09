import { Hono } from 'hono';
import { z } from 'zod';
import { sisConnector } from '../services/sisConnector';

const app = new Hono();

// Validation schemas
const importStudentSchema = z.object({
  studentId: z.string().min(1),
});

const importEnrollmentsSchema = z.object({
  studentId: z.string().min(1),
  term: z.string().optional(),
});

const batchImportSchema = z.object({
  studentIds: z.array(z.string().min(1)),
});

const termImportSchema = z.object({
  term: z.string().min(1),
});

/**
 * POST /api/integration/sis/import
 * Import all SIS data for a student (student info + enrollments + transcript)
 */
app.post('/import', async (c) => {
  try {
    const body = await c.req.json();

    // Validate request body
    const validation = importStudentSchema.safeParse(body);
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

    const { studentId } = validation.data;

    // Import all data
    const results = await sisConnector.importAllStudentData(studentId);

    const allSuccessful =
      results.student.success &&
      results.enrollments.success &&
      results.transcript.success;

    if (!allSuccessful) {
      const errors: string[] = [];
      if (!results.student.success) errors.push(...(results.student.errors || []));
      if (!results.enrollments.success) errors.push(...(results.enrollments.errors || []));
      if (!results.transcript.success) errors.push(...(results.transcript.errors || []));

      return c.json(
        {
          error: {
            code: 'IMPORT_ERROR',
            message: 'Failed to import some SIS data',
            details: errors,
            timestamp: new Date().toISOString(),
          },
        },
        500
      );
    }

    return c.json({
      success: true,
      studentId,
      data: {
        student: results.student.data,
        enrollments: results.enrollments.data,
        transcript: results.transcript.data,
      },
      recordsImported:
        (results.student.recordsImported || 0) +
        (results.enrollments.recordsImported || 0) +
        (results.transcript.recordsImported || 0),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('SIS import route error:', error);
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
 * POST /api/integration/sis/import/student
 * Import student profile data only
 */
app.post('/import/student', async (c) => {
  try {
    const body = await c.req.json();

    const validation = importStudentSchema.safeParse(body);
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

    const { studentId } = validation.data;

    const result = await sisConnector.importStudent(studentId);

    if (!result.success) {
      return c.json(
        {
          error: {
            code: 'IMPORT_ERROR',
            message: 'Failed to import student data',
            details: result.errors,
            timestamp: new Date().toISOString(),
          },
        },
        500
      );
    }

    return c.json({
      success: true,
      studentId,
      data: result.data,
      recordsImported: result.recordsImported,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('SIS student import route error:', error);
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
 * POST /api/integration/sis/import/enrollments
 * Import enrollment data for a student
 */
app.post('/import/enrollments', async (c) => {
  try {
    const body = await c.req.json();

    const validation = importEnrollmentsSchema.safeParse(body);
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

    const { studentId, term } = validation.data;

    const result = await sisConnector.importEnrollments(studentId, term);

    if (!result.success) {
      return c.json(
        {
          error: {
            code: 'IMPORT_ERROR',
            message: 'Failed to import enrollment data',
            details: result.errors,
            timestamp: new Date().toISOString(),
          },
        },
        500
      );
    }

    return c.json({
      success: true,
      studentId,
      term,
      data: result.data,
      recordsImported: result.recordsImported,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('SIS enrollment import route error:', error);
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
 * POST /api/integration/sis/import/transcript
 * Import transcript data for a student
 */
app.post('/import/transcript', async (c) => {
  try {
    const body = await c.req.json();

    const validation = importStudentSchema.safeParse(body);
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

    const { studentId } = validation.data;

    const result = await sisConnector.importTranscript(studentId);

    if (!result.success) {
      return c.json(
        {
          error: {
            code: 'IMPORT_ERROR',
            message: 'Failed to import transcript data',
            details: result.errors,
            timestamp: new Date().toISOString(),
          },
        },
        500
      );
    }

    return c.json({
      success: true,
      studentId,
      data: result.data,
      recordsImported: result.recordsImported,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('SIS transcript import route error:', error);
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
 * POST /api/integration/sis/import/batch
 * Batch import student data
 */
app.post('/import/batch', async (c) => {
  try {
    const body = await c.req.json();

    const validation = batchImportSchema.safeParse(body);
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

    const { studentIds } = validation.data;

    const result = await sisConnector.batchImportStudents(studentIds);

    return c.json({
      success: result.success,
      total: studentIds.length,
      recordsImported: result.recordsImported,
      data: result.data,
      errors: result.errors,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('SIS batch import route error:', error);
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
 * POST /api/integration/sis/import/term
 * Import all enrollments for a term
 */
app.post('/import/term', async (c) => {
  try {
    const body = await c.req.json();

    const validation = termImportSchema.safeParse(body);
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

    const { term } = validation.data;

    const result = await sisConnector.importTermEnrollments(term);

    if (!result.success) {
      return c.json(
        {
          error: {
            code: 'IMPORT_ERROR',
            message: 'Failed to import term enrollments',
            details: result.errors,
            timestamp: new Date().toISOString(),
          },
        },
        500
      );
    }

    return c.json({
      success: true,
      term,
      data: result.data,
      recordsImported: result.recordsImported,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('SIS term import route error:', error);
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
 * POST /api/integration/sis/verify-eligibility
 * Verify eligibility data completeness for a student
 */
app.post('/verify-eligibility', async (c) => {
  try {
    const body = await c.req.json();

    const validation = importStudentSchema.safeParse(body);
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

    const { studentId } = validation.data;

    const result = await sisConnector.verifyEligibilityData(studentId);

    return c.json({
      success: true,
      studentId,
      isValid: result.isValid,
      missingFields: result.missingFields,
      data: result.data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('SIS eligibility verification route error:', error);
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
 * GET /api/integration/sis/health
 * Check SIS connection health
 */
app.get('/health', async (c) => {
  try {
    const isConnected = await sisConnector.checkConnection();

    return c.json({
      status: isConnected ? 'healthy' : 'unavailable',
      connected: isConnected,
      configured: !!process.env.SIS_API_URL && !!process.env.SIS_API_KEY,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('SIS health check error:', error);
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
