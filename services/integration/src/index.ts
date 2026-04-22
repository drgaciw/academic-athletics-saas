import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';

// Import routes
import travelLetterRoutes from './routes/travelLetter';
import absenceRoutes from './routes/absence';
import emailRoutes from './routes/email';
import calendarRoutes from './routes/calendar';
import lmsRoutes from './routes/lms';
import sisRoutes from './routes/sis';
import transcriptRoutes from './routes/transcript';
import reminderRoutes from './routes/reminders';

const app = new Hono();

// Middleware
app.use('*', cors());
app.use('*', logger());
app.use('*', prettyJSON());

// Error handling middleware
app.onError((err, c) => {
  console.error('Integration Service Error:', err);

  return c.json({
    error: {
      code: err.name || 'INTERNAL_ERROR',
      message: err.message || 'An unexpected error occurred',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      timestamp: new Date().toISOString(),
      requestId: c.req.header('x-request-id') || crypto.randomUUID(),
    },
  }, 500);
});

// Health check
app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    service: 'integration',
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.route('/api/integration/travel-letter', travelLetterRoutes);
app.route('/api/integration/absence-notification', absenceRoutes);
app.route('/api/integration/email', emailRoutes);
app.route('/api/integration/calendar', calendarRoutes);
app.route('/api/integration/lms', lmsRoutes);
app.route('/api/integration/sis', sisRoutes);
app.route('/api/integration/transcript', transcriptRoutes);
app.route('/api/integration/reminders', reminderRoutes);

// 404 handler
app.notFound((c) => {
  return c.json({
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint not found',
      timestamp: new Date().toISOString(),
      requestId: c.req.header('x-request-id') || crypto.randomUUID(),
    },
  }, 404);
});

const port = process.env.PORT || 3006;

console.log(`Integration Service running on port ${port}`);

export default app;
