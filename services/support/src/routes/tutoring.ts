import { Hono } from 'hono'
import { validateRequest, validateQuery } from '../middleware/validation'
import { bookTutoringSchema, tutoringAvailabilitySchema } from '../types'
import { tutoringService } from '../services/tutoringService'
import { AppError } from '../middleware/errorHandler'

const tutoring = new Hono()

// POST /api/support/tutoring/book - Book a tutoring session
tutoring.post('/book', validateRequest(bookTutoringSchema), async (c) => {
  const validatedData = c.get('validatedData')

  const session = await tutoringService.bookSession(validatedData)

  return c.json({
    message: 'Tutoring session booked successfully',
    session,
  }, 201)
})

// GET /api/support/tutoring/availability - Check tutor availability
tutoring.get('/availability', async (c) => {
  const query = c.req.query()

  // Manual validation for query parameters
  if (!query.startDate || !query.endDate) {
    throw new AppError(
      400,
      'MISSING_PARAMETERS',
      'startDate and endDate are required'
    )
  }

  const params = {
    tutorId: query.tutorId,
    subject: query.subject,
    startDate: query.startDate,
    endDate: query.endDate,
  }

  const availability = await tutoringService.getTutorAvailability(params)

  return c.json({
    availability,
    count: availability.length,
  })
})

// GET /api/support/tutoring/sessions/:studentId - Get student's tutoring sessions
tutoring.get('/sessions/:studentId', async (c) => {
  const studentId = c.req.param('studentId')

  const sessions = await tutoringService.getStudentSessions(studentId)

  return c.json({
    sessions,
    count: sessions.length,
  })
})

// DELETE /api/support/tutoring/:sessionId - Cancel a tutoring session
tutoring.delete('/:sessionId', async (c) => {
  const sessionId = c.req.param('sessionId')
  const { studentId } = await c.req.json()

  if (!studentId) {
    throw new AppError(400, 'MISSING_STUDENT_ID', 'studentId is required')
  }

  const session = await tutoringService.cancelSession(sessionId, studentId)

  return c.json({
    message: 'Tutoring session cancelled successfully',
    session,
  })
})

export default tutoring
