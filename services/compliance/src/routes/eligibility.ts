/**
 * General Eligibility Check Route
 * POST /api/compliance/check-eligibility
 */

import { Hono } from 'hono'
import { z } from 'zod'
import { prisma } from '@aah/database'
import { RuleEngine } from '../services/ruleEngine'
import { checkInitialEligibility } from '../services/initialEligibility'
import { checkContinuingEligibility } from '../services/continuingEligibility'
import { logComplianceCheck } from '../services/auditLogger'
import { StudentData, NCAADivision, EligibilityRule, RuleCategory } from '../types'

const app = new Hono()

const checkEligibilitySchema = z.object({
  studentId: z.string(),
  checkType: z.enum(['full', 'initial', 'continuing']).optional().default('full'),
})

app.post('/', async (c) => {
  try {
    const body = await c.req.json()
    const { studentId, checkType } = checkEligibilitySchema.parse(body)

    // Get user ID from auth context (assuming middleware sets this)
    const performedBy = c.get('userId') || 'system'

    // Fetch student data from database
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { id: studentId },
      include: {
        user: true,
      },
    })

    if (!studentProfile) {
      return c.json({ error: 'Student not found' }, 404)
    }

    // Build student data object
    const studentData: StudentData = {
      id: studentProfile.id,
      firstName: studentProfile.user?.firstName || undefined,
      lastName: studentProfile.user?.lastName || undefined,
      sport: studentProfile.sport || undefined,
      academicYear: studentProfile.academicYear || 1,
      cumulativeGpa: studentProfile.gpa || 0,
      totalCreditHours: studentProfile.creditHours || 0,
      degreeRequirementHours: 120, // Default, should come from program
      progressTowardDegree: studentProfile.progressPercent || 0,
    }

    // Determine which checks to run
    let result
    let rulesApplied: string[] = []

    if (checkType === 'initial' || studentData.academicYear === 1) {
      result = await checkInitialEligibility(studentData)
      rulesApplied = [
        'NCAA-DI-16-CORE',
        'NCAA-DI-10-7-RULE',
        'NCAA-DI-CORE-GPA',
        'NCAA-DI-SLIDING-SCALE',
      ]
    } else if (checkType === 'continuing') {
      result = await checkContinuingEligibility(studentData)
      rulesApplied = [
        'NCAA-DI-24-18-RULE',
        'NCAA-DI-40-60-80-RULE',
        'NCAA-DI-GPA-THRESHOLDS',
        'NCAA-DI-FULL-TIME',
        'NCAA-DI-6-HOUR',
      ]
    } else {
      // Full check - run both initial and continuing
      const initialResult = await checkInitialEligibility(studentData)
      const continuingResult = await checkContinuingEligibility(studentData)

      result = {
        isEligible: initialResult.isEligible && continuingResult.isEligible,
        status:
          initialResult.isEligible && continuingResult.isEligible
            ? initialResult.status
            : 'INELIGIBLE',
        violations: [...initialResult.violations, ...continuingResult.violations],
        warnings: [...initialResult.warnings, ...continuingResult.warnings],
        recommendations: Array.from(
          new Set([
            ...initialResult.recommendations,
            ...continuingResult.recommendations,
          ])
        ),
        nextReviewDate: continuingResult.nextReviewDate,
        metadata: {
          ...initialResult.metadata,
          ...continuingResult.metadata,
          checkType: 'full',
        },
      }

      rulesApplied = [
        'NCAA-DI-16-CORE',
        'NCAA-DI-10-7-RULE',
        'NCAA-DI-CORE-GPA',
        'NCAA-DI-SLIDING-SCALE',
        'NCAA-DI-24-18-RULE',
        'NCAA-DI-40-60-80-RULE',
        'NCAA-DI-GPA-THRESHOLDS',
        'NCAA-DI-FULL-TIME',
        'NCAA-DI-6-HOUR',
      ]
    }

    // Update student eligibility status in database
    await prisma.studentProfile.update({
      where: { id: studentId },
      data: {
        eligibilityStatus: result.status,
      },
    })

    // Create compliance record
    const checkId = `check-${Date.now()}-${Math.random().toString(36).substring(7)}`

    await prisma.complianceRecord.create({
      data: {
        id: checkId,
        studentId: studentProfile.id,
        termGpa: studentData.termGpa || 0,
        cumulativeGpa: studentData.cumulativeGpa,
        creditHours: studentData.totalCreditHours,
        progressPercent: studentData.progressTowardDegree,
        isEligible: result.isEligible,
        violations: result.violations.length > 0 ? result.violations : null,
        ruleVersion: '2025.1',
      },
    })

    // Log to audit trail
    await logComplianceCheck(studentId, checkType, result, performedBy, {
      rulesApplied,
    })

    return c.json({
      studentId,
      checkId,
      timestamp: new Date(),
      result,
      rulesApplied,
      ruleVersion: '2025.1',
    })
  } catch (error) {
    console.error('Error checking eligibility:', error)
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Invalid request data', details: error.errors }, 400)
    }
    return c.json({ error: 'Internal server error' }, 500)
  }
})

export default app
