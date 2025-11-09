/**
 * Initial Eligibility Check Route
 * POST /api/compliance/initial-eligibility
 */

import { Hono } from 'hono'
import { z } from 'zod'
import { checkInitialEligibility, calculateCoreGPA } from '../services/initialEligibility'
import { logComplianceCheck } from '../services/auditLogger'
import { StudentData, CoreCourse, CoreCourseCategory } from '../types'

const app = new Hono()

const coreCourseSchema = z.object({
  id: z.string(),
  subject: z.string(),
  courseNumber: z.string(),
  name: z.string(),
  grade: z.string(),
  gradePoints: z.number().min(0).max(4),
  creditHours: z.number().min(0),
  category: z.nativeEnum(CoreCourseCategory),
  completedBeforeSeniorYear: z.boolean(),
})

const initialEligibilitySchema = z.object({
  studentId: z.string(),
  coreCourses: z.array(coreCourseSchema),
  testScores: z
    .object({
      satTotal: z.number().min(400).max(1600).optional(),
      actComposite: z.number().min(1).max(36).optional(),
    })
    .optional(),
})

app.post('/', async (c) => {
  try {
    const body = await c.req.json()
    const { studentId, coreCourses, testScores } = initialEligibilitySchema.parse(body)

    const performedBy = c.get('userId') || 'system'

    // Build student data object
    const studentData: StudentData = {
      id: studentId,
      academicYear: 1,
      cumulativeGpa: calculateCoreGPA(coreCourses),
      totalCreditHours: coreCourses.reduce((sum, c) => sum + c.creditHours, 0),
      degreeRequirementHours: 120,
      progressTowardDegree: 0,
      coreCourses,
      testScores,
    }

    // Run initial eligibility check
    const result = await checkInitialEligibility(studentData)

    // Log to audit trail
    await logComplianceCheck(studentId, 'initial_eligibility', result, performedBy, {
      totalCoreCourses: coreCourses.length,
      coreGpa: studentData.cumulativeGpa,
      testScores,
    })

    return c.json({
      studentId,
      timestamp: new Date(),
      result,
      coreGpa: studentData.cumulativeGpa.toFixed(3),
      totalCoreCourses: coreCourses.length,
      rulesApplied: [
        'NCAA-DI-16-CORE',
        'NCAA-DI-10-7-RULE',
        'NCAA-DI-CORE-GPA',
        'NCAA-DI-SLIDING-SCALE',
      ],
    })
  } catch (error) {
    console.error('Error checking initial eligibility:', error)
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Invalid request data', details: error.errors }, 400)
    }
    return c.json({ error: 'Internal server error' }, 500)
  }
})

export default app
