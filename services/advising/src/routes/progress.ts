// ============================================================================
// DEGREE PROGRESS ROUTES
// ============================================================================

import { Hono } from 'hono'
import { DegreeAuditService } from '../services/degreeAudit'
import type { ApiResponse, DegreeProgressResponse } from '../types'

const app = new Hono()
const degreeAuditService = new DegreeAuditService()

/**
 * GET /api/advising/degree-progress/:id
 * Get degree progress for a student
 */
app.get('/degree-progress/:id', async (c) => {
  try {
    const studentId = c.req.param('id')
    const degreeProgram = c.req.query('degreeProgram')

    const progress = await degreeAuditService.getDegreeProgress({
      studentId,
      degreeProgram
    })

    const response: ApiResponse<DegreeProgressResponse> = {
      success: true,
      data: progress,
      timestamp: new Date().toISOString()
    }

    return c.json(response)
  } catch (error) {
    console.error('Error fetching degree progress:', error)

    return c.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch degree progress'
      },
      timestamp: new Date().toISOString()
    }, 500)
  }
})

/**
 * GET /api/advising/degree-progress/:id/summary
 * Get a summary of degree progress
 */
app.get('/degree-progress/:id/summary', async (c) => {
  try {
    const studentId = c.req.param('id')
    const degreeProgram = c.req.query('degreeProgram')

    const progress = await degreeAuditService.getDegreeProgress({
      studentId,
      degreeProgram
    })

    const summary = {
      completionPercentage: progress.completionPercentage,
      totalCreditsCompleted: progress.totalCreditsCompleted,
      totalCreditsRequired: progress.totalCreditsRequired,
      estimatedGraduation: progress.estimatedGraduation,
      onTrack: progress.onTrack,
      categoriesCompleted: progress.requirements.filter(r => r.status === 'COMPLETED').length,
      categoriesInProgress: progress.requirements.filter(r => r.status === 'IN_PROGRESS').length,
      categoriesNotStarted: progress.requirements.filter(r => r.status === 'NOT_STARTED').length
    }

    const response: ApiResponse<typeof summary> = {
      success: true,
      data: summary,
      timestamp: new Date().toISOString()
    }

    return c.json(response)
  } catch (error) {
    console.error('Error fetching degree progress summary:', error)

    return c.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch degree progress summary'
      },
      timestamp: new Date().toISOString()
    }, 500)
  }
})

/**
 * POST /api/advising/degree-progress/:id/check-course
 * Check if a course satisfies degree requirements
 */
app.post('/degree-progress/:id/check-course', async (c) => {
  try {
    const studentId = c.req.param('id')
    const { courseCode, degreeProgram } = await c.req.json()

    if (!courseCode || !degreeProgram) {
      return c.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'courseCode and degreeProgram are required'
        },
        timestamp: new Date().toISOString()
      }, 400)
    }

    const result = await degreeAuditService.checkCourseSatisfiesRequirement(
      studentId,
      courseCode,
      degreeProgram
    )

    const response: ApiResponse<typeof result> = {
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    }

    return c.json(response)
  } catch (error) {
    console.error('Error checking course requirement:', error)

    return c.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to check course requirement'
      },
      timestamp: new Date().toISOString()
    }, 500)
  }
})

export default app
