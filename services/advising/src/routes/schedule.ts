/**
 * Schedule Routes
 * Generate course schedules with conflict detection
 */

import { Hono } from 'hono'
import { getUser, checkPermission } from '@aah/auth'
import {
  successResponse,
  validateRequest,
  ForbiddenError,
} from '@aah/api-utils'
import { z } from 'zod'
import { schedulingEngine, type Course, type ScheduleConstraints } from '../services/scheduling-engine'

const routes = new Hono()

const scheduleSchema = z.object({
  studentId: z.string().min(1),
  courseIds: z.array(z.string()).min(1),
  constraints: z.object({
    minCredits: z.number().min(1).default(12),
    maxCredits: z.number().max(21).default(18),
    preferredDays: z.array(z.string()).optional(),
    avoidMornings: z.boolean().optional(),
    avoidEvenings: z.boolean().optional(),
  }).optional(),
})

/**
 * POST /api/advising/schedule
 * Generate optimized course schedule
 */
routes.post(
  '/schedule',
  validateRequest(scheduleSchema, 'json'),
  async (c) => {
    const currentUser = getUser(c)
    const correlationId = c.get('correlationId')
    const data = c.get('validated_json')

    try {
      checkPermission(c, 'advising:schedule')
    } catch (error) {
      throw new ForbiddenError('You do not have permission to generate schedules')
    }

    // Mock course data (in production, fetch from database)
    const courses: Course[] = data.courseIds.map((id, idx) => ({
      id,
      code: `COURSE${idx + 1}`,
      name: `Course ${idx + 1}`,
      credits: 3,
      sections: [
        {
          id: `${id}-001`,
          courseId: id,
          instructor: 'Dr. Smith',
          capacity: 30,
          enrolled: 20,
          schedule: [
            {
              day: 'MON',
              startTime: '09:00',
              endTime: '10:30',
              location: 'Room 101',
            },
            {
              day: 'WED',
              startTime: '09:00',
              endTime: '10:30',
              location: 'Room 101',
            },
          ],
        },
      ],
    }))

    const constraints: ScheduleConstraints = {
      minCredits: data.constraints?.minCredits || 12,
      maxCredits: data.constraints?.maxCredits || 18,
      avoidMornings: data.constraints?.avoidMornings,
      avoidEvenings: data.constraints?.avoidEvenings,
      athleticCommitments: [], // Fetch from database in production
    }

    const result = schedulingEngine.generateSchedule(courses, constraints)

    return c.json(successResponse({
      studentId: data.studentId,
      schedule: result.schedule,
      conflicts: result.conflicts,
      totalCredits: result.totalCredits,
      success: result.success,
      message: result.message,
    }, correlationId))
  }
)

export default routes
