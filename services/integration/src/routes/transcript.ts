import { Hono } from 'hono';
import { z } from 'zod';
import { transcriptService } from '../services/transcriptService';

const app = new Hono();

// Validation schemas
const transcriptRequestSchema = z.object({
  studentId: z.string().min(1),
  studentName: z.string().min(1),
  studentEmail: z.string().email(),
  recipientName: z.string().optional(),
  recipientEmail: z.string().email().optional(),
  recipientAddress: z
    .object({
      street: z.string(),
      city: z.string(),
      state: z.string(),
      zip: z.string(),
    })
    .optional(),
  deliveryMethod: z.enum(['electronic', 'mail']),
  purpose: z.string().optional(),
  urgent: z.boolean().optional(),
});

const electronicTranscriptSchema = z.object({
  studentId: z.string().min(1),
  recipientEmail: z.string().email(),
  purpose: z.string().optional(),
});

const physicalTranscriptSchema = z.object({
  studentId: z.string().min(1),
  recipientName: z.string().min(1),
  recipientAddress: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    zip: z.string(),
  }),
  urgent: z.boolean().optional(),
});

const batchTranscriptSchema = z.object({
  requests: z.array(transcriptRequestSchema),
});

const verifyEnrollmentSchema = z.object({
  studentId: z.string().min(1),
});

/**
 * POST /api/integration/transcript/request
 * Request an official transcript
 */
app.post('/request', async (c) => {
  try {
    const body = await c.req.json();

    // Validate request body
    const validation = transcriptRequestSchema.safeParse(body);
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

    const data = validation.data;

    // Validate delivery requirements
    if (data.deliveryMethod === 'electronic' && !data.recipientEmail) {
      return c.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'recipientEmail is required for electronic delivery',
            timestamp: new Date().toISOString(),
          },
        },
        400
      );
    }

    if (data.deliveryMethod === 'mail' && !data.recipientAddress) {
      return c.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'recipientAddress is required for mail delivery',
            timestamp: new Date().toISOString(),
          },
        },
        400
      );
    }

    // Request transcript
    const result = await transcriptService.requestTranscript(data);

    if (!result.success) {
      return c.json(
        {
          error: {
            code: 'REQUEST_ERROR',
            message: result.error || 'Failed to request transcript',
            timestamp: new Date().toISOString(),
          },
        },
        500
      );
    }

    return c.json({
      success: true,
      requestId: result.requestId,
      status: result.status,
      message: 'Transcript request submitted successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Transcript request route error:', error);
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
 * POST /api/integration/transcript/request/electronic
 * Request electronic transcript delivery
 */
app.post('/request/electronic', async (c) => {
  try {
    const body = await c.req.json();

    const validation = electronicTranscriptSchema.safeParse(body);
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

    const { studentId, recipientEmail, purpose } = validation.data;

    const result = await transcriptService.sendElectronicTranscript({
      studentId,
      recipientEmail,
      purpose,
    });

    if (!result.success) {
      return c.json(
        {
          error: {
            code: 'REQUEST_ERROR',
            message: result.error || 'Failed to request electronic transcript',
            timestamp: new Date().toISOString(),
          },
        },
        500
      );
    }

    return c.json({
      success: true,
      requestId: result.requestId,
      status: result.status,
      message: 'Electronic transcript request submitted successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Electronic transcript route error:', error);
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
 * POST /api/integration/transcript/request/physical
 * Request physical transcript delivery
 */
app.post('/request/physical', async (c) => {
  try {
    const body = await c.req.json();

    const validation = physicalTranscriptSchema.safeParse(body);
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

    const { studentId, recipientName, recipientAddress, urgent } = validation.data;

    const result = await transcriptService.sendPhysicalTranscript({
      studentId,
      recipientName,
      recipientAddress,
      urgent,
    });

    if (!result.success) {
      return c.json(
        {
          error: {
            code: 'REQUEST_ERROR',
            message: result.error || 'Failed to request physical transcript',
            timestamp: new Date().toISOString(),
          },
        },
        500
      );
    }

    return c.json({
      success: true,
      requestId: result.requestId,
      status: result.status,
      message: 'Physical transcript request submitted successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Physical transcript route error:', error);
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
 * POST /api/integration/transcript/request/batch
 * Batch transcript requests
 */
app.post('/request/batch', async (c) => {
  try {
    const body = await c.req.json();

    const validation = batchTranscriptSchema.safeParse(body);
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

    const { requests } = validation.data;

    const results = await transcriptService.batchRequestTranscripts(requests);

    const successful = results.filter((r) => r.success);
    const failed = results.filter((r) => !r.success);

    return c.json({
      success: failed.length === 0,
      total: results.length,
      successful: successful.length,
      failed: failed.length,
      results: results.map((r) => ({
        success: r.success,
        requestId: r.requestId,
        status: r.status,
        error: r.error,
      })),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Batch transcript route error:', error);
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
 * GET /api/integration/transcript/:id
 * Get transcript request status
 */
app.get('/:id', async (c) => {
  try {
    const requestId = c.req.param('id');

    const result = await transcriptService.getTranscriptStatus(requestId);

    if (!result.success) {
      return c.json(
        {
          error: {
            code: 'FETCH_ERROR',
            message: result.error || 'Failed to get transcript status',
            timestamp: new Date().toISOString(),
          },
        },
        500
      );
    }

    return c.json({
      success: true,
      requestId: result.requestId,
      status: result.status,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Transcript status route error:', error);
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
 * GET /api/integration/transcript/history/:studentId
 * Get transcript request history for a student
 */
app.get('/history/:studentId', async (c) => {
  try {
    const studentId = c.req.param('studentId');

    const result = await transcriptService.getTranscriptHistory(studentId);

    if (!result.success) {
      return c.json(
        {
          error: {
            code: 'FETCH_ERROR',
            message: result.error || 'Failed to get transcript history',
            timestamp: new Date().toISOString(),
          },
        },
        500
      );
    }

    return c.json({
      success: true,
      studentId,
      count: result.requests?.length || 0,
      requests: result.requests,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Transcript history route error:', error);
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
 * DELETE /api/integration/transcript/:id
 * Cancel a transcript request
 */
app.delete('/:id', async (c) => {
  try {
    const requestId = c.req.param('id');

    const result = await transcriptService.cancelTranscriptRequest(requestId);

    if (!result.success) {
      return c.json(
        {
          error: {
            code: 'CANCEL_ERROR',
            message: result.error || 'Failed to cancel transcript request',
            timestamp: new Date().toISOString(),
          },
        },
        500
      );
    }

    return c.json({
      success: true,
      requestId: result.requestId,
      message: 'Transcript request cancelled successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Transcript cancel route error:', error);
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
 * POST /api/integration/transcript/verify/enrollment
 * Verify student enrollment via NSC
 */
app.post('/verify/enrollment', async (c) => {
  try {
    const body = await c.req.json();

    const validation = verifyEnrollmentSchema.safeParse(body);
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

    const result = await transcriptService.verifyEnrollment(studentId);

    if (!result.success) {
      return c.json(
        {
          error: {
            code: 'VERIFICATION_ERROR',
            message: result.error || 'Failed to verify enrollment',
            timestamp: new Date().toISOString(),
          },
        },
        500
      );
    }

    return c.json({
      success: true,
      studentId,
      isEnrolled: result.isEnrolled,
      enrollmentData: result.enrollmentData,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Enrollment verification route error:', error);
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
 * POST /api/integration/transcript/verify/degree
 * Verify student degree via NSC
 */
app.post('/verify/degree', async (c) => {
  try {
    const body = await c.req.json();

    const validation = verifyEnrollmentSchema.safeParse(body);
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

    const result = await transcriptService.verifyDegree(studentId);

    if (!result.success) {
      return c.json(
        {
          error: {
            code: 'VERIFICATION_ERROR',
            message: result.error || 'Failed to verify degree',
            timestamp: new Date().toISOString(),
          },
        },
        500
      );
    }

    return c.json({
      success: true,
      studentId,
      hasDegree: result.hasDegree,
      degreeData: result.degreeData,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Degree verification route error:', error);
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
 * GET /api/integration/transcript/health
 * Check transcript service health
 */
app.get('/health', async (c) => {
  try {
    const connections = await transcriptService.checkConnections();

    return c.json({
      status:
        connections.parchment || connections.nsc ? 'healthy' : 'unavailable',
      providers: {
        parchment: {
          connected: connections.parchment,
          configured:
            !!process.env.PARCHMENT_API_URL && !!process.env.PARCHMENT_API_KEY,
        },
        nsc: {
          connected: connections.nsc,
          configured: !!process.env.NSC_API_URL && !!process.env.NSC_API_KEY,
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Transcript health check error:', error);
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
