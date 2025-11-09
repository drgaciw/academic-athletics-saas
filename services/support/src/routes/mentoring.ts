import { Hono } from 'hono'
import { validateRequest } from '../middleware/validation'
import { scheduleMentoringSessionSchema } from '../types'
import { mentoringService } from '../services/mentoringService'
import { AppError } from '../middleware/errorHandler'

const mentoring = new Hono()

// GET /api/support/mentoring/matches/:studentId - Get mentor matches for a student
mentoring.get('/matches/:studentId', async (c) => {
  const studentId = c.req.param('studentId')

  const matches = await mentoringService.getMentorMatches(studentId)

  return c.json({
    matches,
    count: matches.length,
  })
})

// GET /api/support/mentoring/matches - Alternative endpoint without param
mentoring.get('/matches', async (c) => {
  const studentId = c.req.query('studentId')

  if (!studentId) {
    throw new AppError(400, 'MISSING_STUDENT_ID', 'studentId query parameter is required')
  }

  const matches = await mentoringService.getMentorMatches(studentId)

  return c.json({
    matches,
    count: matches.length,
  })
})

// POST /api/support/mentoring/session - Schedule a mentoring session
mentoring.post('/session', validateRequest(scheduleMentoringSessionSchema), async (c) => {
  const validatedData = c.get('validatedData')

  const session = await mentoringService.scheduleSession(validatedData)

  return c.json({
    message: 'Mentoring session scheduled successfully',
    session,
  }, 201)
})

// DELETE /api/support/mentoring/session/:sessionId - Cancel a mentoring session
mentoring.delete('/session/:sessionId', async (c) => {
  const sessionId = c.req.param('sessionId')
  const { userId } = await c.req.json()

  if (!userId) {
    throw new AppError(400, 'MISSING_USER_ID', 'userId is required')
  }

  const session = await mentoringService.cancelSession(sessionId, userId)

  return c.json({
    message: 'Mentoring session cancelled successfully',
    session,
  })
})

// GET /api/support/mentoring/sessions/:userId - Get mentoring sessions for a user
mentoring.get('/sessions/:userId', async (c) => {
  const userId = c.req.param('userId')

  const sessions = await mentoringService.getSessions(userId)

  return c.json({
    sessions,
    count: sessions.length,
  })
})

export default mentoring
