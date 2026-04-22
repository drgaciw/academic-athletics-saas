import { Hono } from 'hono';
import { z } from 'zod';
import { prisma } from '@aah/database';
import { emailService } from '../services/emailService';

const app = new Hono();

// Validation schema
const reminderSchema = z.object({
  userId: z.string().min(1),
  message: z.string().min(1),
  reminderDate: z.string().datetime(),
  channel: z.enum(['email', 'sms', 'push']).optional().default('email'),
  recurring: z.boolean().optional(),
});

/**
 * POST /api/integration/reminders
 * Create a new reminder
 */
app.post('/', async (c) => {
  try {
    const body = await c.req.json();

    // Validate request body
    const validation = reminderSchema.safeParse(body);
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

    const { userId, message, reminderDate, channel, recurring } = validation.data;
    const startTime = new Date(reminderDate);
    const endTime = new Date(startTime.getTime() + 3600000); // Default 1 hour duration

    // Create CalendarEvent as the storage mechanism for the reminder
    // We use eventType = 'PERSONAL' or 'MEETING' with metadata indicating it's a reminder
    const event = await prisma.calendarEvent.create({
      data: {
        userId,
        title: `Reminder: ${message}`,
        description: message,
        startTime,
        endTime,
        eventType: 'PERSONAL', // Using PERSONAL as a generic type
        metadata: {
            type: 'REMINDER',
            channel,
            recurring
        },
      },
    });

    // If the reminder is immediate (within 5 minutes), send it now
    const timeDiff = startTime.getTime() - Date.now();
    let sentImmediate = false;

    if (timeDiff <= 5 * 60 * 1000 && timeDiff >= -5 * 60 * 1000) {
        if (channel === 'email') {
            // Fetch user email
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { email: true, firstName: true }
            });

            if (user && user.email) {
                await emailService.sendEmail({
                    to: user.email,
                    subject: `Reminder: ${message}`,
                    text: `Hi ${user.firstName || 'there'},\n\nHere is your reminder:\n\n${message}\n\nBest,\nAcademic Athletics Hub`
                });
                sentImmediate = true;
            }
        }
    }

    return c.json({
      success: true,
      reminderId: event.id,
      status: sentImmediate ? 'sent' : 'scheduled',
      scheduledFor: startTime.toISOString(),
      message: 'Reminder created successfully',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Create reminder route error:', error);
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
