import { Hono } from 'hono';
import { z } from 'zod';
import { emailService } from '../services/emailService';

const app = new Hono();

// Validation schema
const absenceNotificationSchema = z.object({
  facultyEmail: z.string().email(),
  studentName: z.string().min(1),
  studentEmail: z.string().email(),
  absenceDate: z.string(),
  reason: z.string().min(1),
  courseName: z.string().optional(),
  additionalNotes: z.string().optional(),
});

const bulkAbsenceSchema = z.object({
  notifications: z.array(absenceNotificationSchema),
});

/**
 * POST /api/integration/absence-notification
 * Send absence notification email to faculty
 */
app.post('/', async (c) => {
  try {
    const body = await c.req.json();

    // Validate request body
    const validation = absenceNotificationSchema.safeParse(body);
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

    // Send absence notification
    const result = await emailService.sendAbsenceNotification({
      facultyEmail: data.facultyEmail,
      studentName: data.studentName,
      studentEmail: data.studentEmail,
      absenceDate: data.absenceDate,
      reason: data.reason,
      courseName: data.courseName,
    });

    if (!result.success) {
      return c.json(
        {
          error: {
            code: 'EMAIL_SEND_ERROR',
            message: result.error || 'Failed to send absence notification',
            timestamp: new Date().toISOString(),
          },
        },
        500
      );
    }

    return c.json({
      success: true,
      messageId: result.messageId,
      message: 'Absence notification sent successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Absence notification route error:', error);
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
 * POST /api/integration/absence-notification/bulk
 * Send multiple absence notifications
 */
app.post('/bulk', async (c) => {
  try {
    const body = await c.req.json();

    // Validate request body
    const validation = bulkAbsenceSchema.safeParse(body);
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

    const { notifications } = validation.data;

    // Send all notifications
    const results = await Promise.all(
      notifications.map((notification) =>
        emailService.sendAbsenceNotification({
          facultyEmail: notification.facultyEmail,
          studentName: notification.studentName,
          studentEmail: notification.studentEmail,
          absenceDate: notification.absenceDate,
          reason: notification.reason,
          courseName: notification.courseName,
        })
      )
    );

    const successful = results.filter((r) => r.success);
    const failed = results.filter((r) => !r.success);

    return c.json({
      success: failed.length === 0,
      total: results.length,
      successful: successful.length,
      failed: failed.length,
      results: results.map((r) => ({
        success: r.success,
        messageId: r.messageId,
        error: r.error,
      })),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Bulk absence notification error:', error);
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
 * POST /api/integration/absence-notification/travel
 * Send travel notification with travel letter
 */
app.post('/travel', async (c) => {
  try {
    const body = await c.req.json();

    const schema = z.object({
      facultyEmail: z.string().email(),
      studentName: z.string().min(1),
      studentEmail: z.string().email(),
      travelDates: z.object({
        start: z.string(),
        end: z.string(),
      }),
      destination: z.string().min(1),
      sport: z.string().min(1),
      coursesAffected: z.array(z.string()),
      letterUrl: z.string().url().optional(),
    });

    const validation = schema.safeParse(body);
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

    // Send travel notification
    const result = await emailService.sendTravelNotification({
      facultyEmail: data.facultyEmail,
      studentName: data.studentName,
      studentEmail: data.studentEmail,
      travelDates: data.travelDates,
      destination: data.destination,
      sport: data.sport,
      coursesAffected: data.coursesAffected,
      letterUrl: data.letterUrl,
    });

    if (!result.success) {
      return c.json(
        {
          error: {
            code: 'EMAIL_SEND_ERROR',
            message: result.error || 'Failed to send travel notification',
            timestamp: new Date().toISOString(),
          },
        },
        500
      );
    }

    return c.json({
      success: true,
      messageId: result.messageId,
      message: 'Travel notification sent successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Travel notification route error:', error);
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
