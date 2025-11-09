import { Hono } from 'hono'
import { validateRequest } from '../middleware/validation'
import { studyHallCheckInSchema } from '../types'
import { studyHallService } from '../services/studyHallService'
import { AppError } from '../middleware/errorHandler'

const studyHall = new Hono()

// POST /api/support/study-hall/checkin - Check in to study hall
studyHall.post('/checkin', validateRequest(studyHallCheckInSchema), async (c) => {
  const validatedData = c.get('validatedData')

  const attendance = await studyHallService.checkIn(validatedData)

  return c.json({
    message: 'Successfully checked in to study hall',
    attendance,
  }, 201)
})

// POST /api/support/study-hall/checkout - Check out from study hall
studyHall.post('/checkout', async (c) => {
  const { attendanceId, studentId } = await c.req.json()

  if (!attendanceId || !studentId) {
    throw new AppError(
      400,
      'MISSING_PARAMETERS',
      'attendanceId and studentId are required'
    )
  }

  const attendance = await studyHallService.checkOut(attendanceId, studentId)

  return c.json({
    message: 'Successfully checked out from study hall',
    attendance,
    duration: attendance.duration,
  })
})

// GET /api/support/study-hall/attendance/:studentId - Get attendance records
studyHall.get('/attendance/:studentId', async (c) => {
  const studentId = c.req.param('studentId')
  const limit = c.req.query('limit') ? parseInt(c.req.query('limit')!) : 10

  const records = await studyHallService.getAttendanceRecords(studentId, limit)

  return c.json({
    records,
    count: records.length,
  })
})

// GET /api/support/study-hall/stats/:studentId - Get student stats
studyHall.get('/stats/:studentId', async (c) => {
  const studentId = c.req.param('studentId')

  const stats = await studyHallService.getStudentStats(studentId)

  return c.json(stats)
})

export default studyHall
