import { Hono } from 'hono';
import { z } from 'zod';
import { emailService } from '../services/emailService';

const app = new Hono();

// Validation schema
const emailSchema = z.object({
  to: z.union([z.string().email(), z.array(z.string().email())]),
  from: z.string().email().optional(),
  subject: z.string().min(1),
  html: z.string().optional(),
  text: z.string().optional(),
  cc: z.union([z.string().email(), z.array(z.string().email())]).optional(),
  bcc: z.union([z.string().email(), z.array(z.string().email())]).optional(),
  replyTo: z.string().email().optional(),
  attachments: z
    .array(
      z.object({
        filename: z.string(),
        content: z.string(),
        contentType: z.string().optional(),
      })
    )
    .optional(),
});

const bulkEmailSchema = z.object({
  emails: z.array(emailSchema),
});

/**
 * POST /api/integration/email/send
 * Send a single email
 */
app.post('/send', async (c) => {
  try {
    const body = await c.req.json();

    // Validate request body
    const validation = emailSchema.safeParse(body);
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

    // Ensure at least html or text is provided
    if (!data.html && !data.text) {
      return c.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Either html or text content must be provided',
            timestamp: new Date().toISOString(),
          },
        },
        400
      );
    }

    // Send email
    const result = await emailService.sendEmail(data);

    if (!result.success) {
      return c.json(
        {
          error: {
            code: 'EMAIL_SEND_ERROR',
            message: result.error || 'Failed to send email',
            timestamp: new Date().toISOString(),
          },
        },
        500
      );
    }

    return c.json({
      success: true,
      messageId: result.messageId,
      message: 'Email sent successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Email send route error:', error);
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
 * POST /api/integration/email/send-bulk
 * Send multiple emails
 */
app.post('/send-bulk', async (c) => {
  try {
    const body = await c.req.json();

    // Validate request body
    const validation = bulkEmailSchema.safeParse(body);
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

    const { emails } = validation.data;

    // Validate each email has content
    for (let i = 0; i < emails.length; i++) {
      if (!emails[i].html && !emails[i].text) {
        return c.json(
          {
            error: {
              code: 'VALIDATION_ERROR',
              message: `Email at index ${i} must have either html or text content`,
              timestamp: new Date().toISOString(),
            },
          },
          400
        );
      }
    }

    // Send all emails
    const results = await emailService.sendBulkEmails(emails);

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
    console.error('Bulk email send error:', error);
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
 * GET /api/integration/email/health
 * Check email service health
 */
app.get('/health', async (c) => {
  try {
    const isConfigured = !!process.env.RESEND_API_KEY;

    return c.json({
      status: isConfigured ? 'healthy' : 'not_configured',
      provider: 'resend',
      configured: isConfigured,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Email health check error:', error);
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
