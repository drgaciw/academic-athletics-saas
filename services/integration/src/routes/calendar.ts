import { Hono } from 'hono';
import { z } from 'zod';
import { calendarService } from '../services/calendarService';

const app = new Hono();

// Validation schemas
const calendarEventSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  startTime: z.string().transform((str) => new Date(str)),
  endTime: z.string().transform((str) => new Date(str)),
  location: z.string().optional(),
  attendees: z.array(z.string().email()).optional(),
  reminders: z
    .object({
      useDefault: z.boolean().optional(),
      overrides: z
        .array(
          z.object({
            method: z.enum(['email', 'popup']),
            minutes: z.number(),
          })
        )
        .optional(),
    })
    .optional(),
});

const syncEventSchema = z.object({
  provider: z.enum(['google', 'outlook', 'both']),
  accessToken: z.string().optional(),
  googleAccessToken: z.string().optional(),
  outlookAccessToken: z.string().optional(),
  event: calendarEventSchema,
  calendarId: z.string().optional(),
});

const updateEventSchema = z.object({
  provider: z.enum(['google', 'outlook']),
  accessToken: z.string(),
  eventId: z.string(),
  event: calendarEventSchema.partial(),
  calendarId: z.string().optional(),
});

/**
 * POST /api/integration/calendar/sync
 * Sync calendar event to Google Calendar or Outlook
 */
app.post('/sync', async (c) => {
  try {
    const body = await c.req.json();

    // Validate request body
    const validation = syncEventSchema.safeParse(body);
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

    // Determine access tokens based on provider
    let result;

    if (data.provider === 'google') {
      const token = data.accessToken || data.googleAccessToken;
      if (!token) {
        return c.json(
          {
            error: {
              code: 'MISSING_TOKEN',
              message: 'Google access token is required',
              timestamp: new Date().toISOString(),
            },
          },
          400
        );
      }

      result = await calendarService.createGoogleEvent(
        token,
        data.event,
        data.calendarId
      );
    } else if (data.provider === 'outlook') {
      const token = data.accessToken || data.outlookAccessToken;
      if (!token) {
        return c.json(
          {
            error: {
              code: 'MISSING_TOKEN',
              message: 'Outlook access token is required',
              timestamp: new Date().toISOString(),
            },
          },
          400
        );
      }

      result = await calendarService.createOutlookEvent(token, data.event);
    } else {
      // Sync to both
      if (!data.googleAccessToken && !data.outlookAccessToken) {
        return c.json(
          {
            error: {
              code: 'MISSING_TOKEN',
              message: 'At least one access token is required for syncing to both calendars',
              timestamp: new Date().toISOString(),
            },
          },
          400
        );
      }

      const results = await calendarService.syncToBothCalendars(
        data.googleAccessToken || null,
        data.outlookAccessToken || null,
        data.event
      );

      return c.json({
        success: true,
        results,
        message: 'Event synced to calendars',
        timestamp: new Date().toISOString(),
      });
    }

    if (!result.success) {
      return c.json(
        {
          error: {
            code: 'SYNC_ERROR',
            message: result.error || 'Failed to sync calendar event',
            timestamp: new Date().toISOString(),
          },
        },
        500
      );
    }

    return c.json({
      success: true,
      eventId: result.eventId,
      provider: result.provider,
      message: 'Calendar event synced successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Calendar sync route error:', error);
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
 * PUT /api/integration/calendar/update
 * Update a calendar event
 */
app.put('/update', async (c) => {
  try {
    const body = await c.req.json();

    // Validate request body
    const validation = updateEventSchema.safeParse(body);
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

    let result;

    if (data.provider === 'google') {
      result = await calendarService.updateGoogleEvent(
        data.accessToken,
        data.eventId,
        data.event,
        data.calendarId
      );
    } else {
      result = await calendarService.updateOutlookEvent(
        data.accessToken,
        data.eventId,
        data.event
      );
    }

    if (!result.success) {
      return c.json(
        {
          error: {
            code: 'UPDATE_ERROR',
            message: result.error || 'Failed to update calendar event',
            timestamp: new Date().toISOString(),
          },
        },
        500
      );
    }

    return c.json({
      success: true,
      eventId: result.eventId,
      provider: result.provider,
      message: 'Calendar event updated successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Calendar update route error:', error);
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
 * DELETE /api/integration/calendar/delete
 * Delete a calendar event
 */
app.delete('/delete', async (c) => {
  try {
    const body = await c.req.json();

    const schema = z.object({
      provider: z.enum(['google', 'outlook']),
      accessToken: z.string(),
      eventId: z.string(),
      calendarId: z.string().optional(),
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

    let result;

    if (data.provider === 'google') {
      result = await calendarService.deleteGoogleEvent(
        data.accessToken,
        data.eventId,
        data.calendarId
      );
    } else {
      result = await calendarService.deleteOutlookEvent(data.accessToken, data.eventId);
    }

    if (!result.success) {
      return c.json(
        {
          error: {
            code: 'DELETE_ERROR',
            message: result.error || 'Failed to delete calendar event',
            timestamp: new Date().toISOString(),
          },
        },
        500
      );
    }

    return c.json({
      success: true,
      eventId: result.eventId,
      provider: result.provider,
      message: 'Calendar event deleted successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Calendar delete route error:', error);
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
 * GET /api/integration/calendar/health
 * Check calendar service configuration
 */
app.get('/health', async (c) => {
  try {
    const googleConfigured =
      !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;
    const outlookConfigured = true; // Microsoft Graph uses runtime tokens

    return c.json({
      status: 'healthy',
      providers: {
        google: {
          configured: googleConfigured,
          status: googleConfigured ? 'available' : 'not_configured',
        },
        outlook: {
          configured: outlookConfigured,
          status: 'available',
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Calendar health check error:', error);
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
