import { Hono } from 'hono';
import { z } from 'zod';
import { travelLetterGenerator } from '../services/travelLetterGenerator';

const app = new Hono();

// Validation schema
const travelLetterSchema = z.object({
  studentName: z.string().min(1),
  studentId: z.string().min(1),
  sport: z.string().min(1),
  travelDates: z.object({
    start: z.string(),
    end: z.string(),
  }),
  destination: z.string().min(1),
  event: z.string().min(1),
  courses: z.array(
    z.object({
      code: z.string(),
      name: z.string(),
      instructor: z.string(),
      meetingTimes: z.string().optional(),
    })
  ),
  advisor: z
    .object({
      name: z.string(),
      title: z.string(),
      phone: z.string().optional(),
      email: z.string().email().optional(),
    })
    .optional(),
  generatedBy: z.string().optional(),
});

/**
 * POST /api/integration/travel-letter
 * Generate an official travel letter
 */
app.post('/', async (c) => {
  try {
    const body = await c.req.json();

    // Validate request body
    const validation = travelLetterSchema.safeParse(body);
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

    // Generate travel letter
    const result = await travelLetterGenerator.generateLetter(data);

    if (!result.success) {
      return c.json(
        {
          error: {
            code: 'GENERATION_ERROR',
            message: result.error || 'Failed to generate travel letter',
            timestamp: new Date().toISOString(),
          },
        },
        500
      );
    }

    return c.json({
      success: true,
      url: result.url,
      message: 'Travel letter generated successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Travel letter route error:', error);
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
 * POST /api/integration/travel-letter/preview
 * Generate a travel letter preview without saving
 */
app.post('/preview', async (c) => {
  try {
    const body = await c.req.json();

    const validation = travelLetterSchema.safeParse(body);
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

    // Generate preview
    const result = await travelLetterGenerator.generatePreview(data);

    if (!result.success || !result.pdfBuffer) {
      return c.json(
        {
          error: {
            code: 'GENERATION_ERROR',
            message: result.error || 'Failed to generate preview',
            timestamp: new Date().toISOString(),
          },
        },
        500
      );
    }

    // Return PDF as binary response
    return c.body(result.pdfBuffer, 200, {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline; filename="travel-letter-preview.pdf"',
    });
  } catch (error) {
    console.error('Travel letter preview error:', error);
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
 * POST /api/integration/travel-letter/bulk
 * Generate multiple travel letters
 */
app.post('/bulk', async (c) => {
  try {
    const body = await c.req.json();

    if (!Array.isArray(body.letters)) {
      return c.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Request must contain a "letters" array',
            timestamp: new Date().toISOString(),
          },
        },
        400
      );
    }

    // Validate all letters
    const validations = body.letters.map((letter: any) =>
      travelLetterSchema.safeParse(letter)
    );

    const errors = validations
      .map((v, i) => (v.success ? null : { index: i, errors: v.error.errors }))
      .filter((e) => e !== null);

    if (errors.length > 0) {
      return c.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Some letters have invalid data',
            details: errors,
            timestamp: new Date().toISOString(),
          },
        },
        400
      );
    }

    const letters = validations.map((v) => v.data!);

    // Generate all letters
    const results = await travelLetterGenerator.generateBulkLetters(letters);

    const successful = results.filter((r) => r.success);
    const failed = results.filter((r) => !r.success);

    return c.json({
      success: failed.length === 0,
      total: results.length,
      successful: successful.length,
      failed: failed.length,
      results: results.map((r) => ({
        success: r.success,
        url: r.url,
        error: r.error,
      })),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Bulk travel letter error:', error);
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

export default app;
