import { Hono } from 'hono'
import { validateRequest } from '../middleware/validation'
import { workshopRegistrationSchema } from '../types'
import { workshopService } from '../services/workshopService'
import { AppError } from '../middleware/errorHandler'

const workshop = new Hono()

// POST /api/support/workshop/register - Register for a workshop
workshop.post('/register', validateRequest(workshopRegistrationSchema), async (c) => {
  const validatedData = c.get('validatedData')

  const registration = await workshopService.registerForWorkshop(validatedData)

  return c.json({
    message: 'Successfully registered for workshop',
    registration,
  }, 201)
})

// DELETE /api/support/workshop/:registrationId - Cancel workshop registration
workshop.delete('/:registrationId', async (c) => {
  const registrationId = c.req.param('registrationId')
  const { studentId } = await c.req.json()

  if (!studentId) {
    throw new AppError(400, 'MISSING_STUDENT_ID', 'studentId is required')
  }

  const registration = await workshopService.cancelRegistration(registrationId, studentId)

  return c.json({
    message: 'Workshop registration cancelled successfully',
    registration,
  })
})

// GET /api/support/workshop/available - Get available workshops
workshop.get('/available', async (c) => {
  const workshops = await workshopService.getAvailableWorkshops()

  return c.json({
    workshops,
    count: workshops.length,
  })
})

// GET /api/support/workshop/registrations/:studentId - Get student registrations
workshop.get('/registrations/:studentId', async (c) => {
  const studentId = c.req.param('studentId')

  const registrations = await workshopService.getStudentRegistrations(studentId)

  return c.json({
    registrations,
    count: registrations.length,
  })
})

export default workshop
