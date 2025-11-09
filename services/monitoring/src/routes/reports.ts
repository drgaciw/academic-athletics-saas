// Progress reports route
import { Hono } from 'hono'
import { z } from 'zod'
import {
  submitProgressReport,
  getProgressReports,
  getProgressReport,
  reviewProgressReport,
  getReportsByInstructor,
  getUnreviewedReports,
  getReportSummary,
} from '../services/progressReport'

const app = new Hono()

// POST /api/monitoring/progress-report
app.post('/', async (c) => {
  try {
    const body = await c.req.json()

    const schema = z.object({
      studentId: z.string(),
      courseId: z.string(),
      courseName: z.string(),
      instructor: z.string(),
      term: z.string(),
      academicYear: z.string(),
      currentGrade: z.string().optional(),
      attendance: z.enum(['EXCELLENT', 'GOOD', 'FAIR', 'POOR']).optional(),
      effort: z.enum(['EXCELLENT', 'GOOD', 'FAIR', 'POOR']).optional(),
      comments: z.string().optional(),
      concerns: z.array(z.string()),
      recommendations: z.string().optional(),
      submittedBy: z.string(),
    })

    const validated = schema.parse(body)

    const report = await submitProgressReport(validated)

    return c.json({
      success: true,
      data: report,
    })
  } catch (error: any) {
    console.error('Error submitting progress report:', error)

    if (error.name === 'ZodError') {
      return c.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: error.errors,
            timestamp: new Date().toISOString(),
          },
        },
        400
      )
    }

    return c.json(
      {
        error: {
          code: 'REPORT_SUBMIT_ERROR',
          message: error.message || 'Failed to submit progress report',
          timestamp: new Date().toISOString(),
        },
      },
      500
    )
  }
})

// GET /api/monitoring/progress-report/student/:studentId
app.get('/student/:studentId', async (c) => {
  try {
    const studentId = c.req.param('studentId')
    const { term, academicYear } = c.req.query()

    const reports = await getProgressReports(studentId, term, academicYear)

    return c.json({
      success: true,
      data: reports,
    })
  } catch (error: any) {
    console.error('Error fetching progress reports:', error)
    return c.json(
      {
        error: {
          code: 'REPORTS_FETCH_ERROR',
          message: error.message || 'Failed to fetch progress reports',
          timestamp: new Date().toISOString(),
        },
      },
      500
    )
  }
})

// GET /api/monitoring/progress-report/:reportId
app.get('/:reportId', async (c) => {
  try {
    const reportId = c.req.param('reportId')

    const report = await getProgressReport(reportId)

    if (!report) {
      return c.json(
        {
          error: {
            code: 'REPORT_NOT_FOUND',
            message: 'Progress report not found',
            timestamp: new Date().toISOString(),
          },
        },
        404
      )
    }

    return c.json({
      success: true,
      data: report,
    })
  } catch (error: any) {
    console.error('Error fetching progress report:', error)
    return c.json(
      {
        error: {
          code: 'REPORT_FETCH_ERROR',
          message: error.message || 'Failed to fetch progress report',
          timestamp: new Date().toISOString(),
        },
      },
      500
    )
  }
})

// PUT /api/monitoring/progress-report/:reportId/review
app.put('/:reportId/review', async (c) => {
  try {
    const reportId = c.req.param('reportId')
    const body = await c.req.json()

    const schema = z.object({
      reviewerId: z.string(),
    })

    const { reviewerId } = schema.parse(body)

    const report = await reviewProgressReport(reportId, reviewerId)

    return c.json({
      success: true,
      data: report,
    })
  } catch (error: any) {
    console.error('Error reviewing progress report:', error)

    if (error.name === 'ZodError') {
      return c.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: error.errors,
            timestamp: new Date().toISOString(),
          },
        },
        400
      )
    }

    return c.json(
      {
        error: {
          code: 'REPORT_REVIEW_ERROR',
          message: error.message || 'Failed to review progress report',
          timestamp: new Date().toISOString(),
        },
      },
      500
    )
  }
})

// GET /api/monitoring/progress-report/instructor/:instructorId
app.get('/instructor/:instructorId', async (c) => {
  try {
    const instructorId = c.req.param('instructorId')
    const { term, academicYear } = c.req.query()

    const reports = await getReportsByInstructor(
      instructorId,
      term,
      academicYear
    )

    return c.json({
      success: true,
      data: reports,
    })
  } catch (error: any) {
    console.error('Error fetching instructor reports:', error)
    return c.json(
      {
        error: {
          code: 'REPORTS_FETCH_ERROR',
          message: error.message || 'Failed to fetch instructor reports',
          timestamp: new Date().toISOString(),
        },
      },
      500
    )
  }
})

// GET /api/monitoring/progress-report/unreviewed
app.get('/unreviewed', async (c) => {
  try {
    const reports = await getUnreviewedReports()

    return c.json({
      success: true,
      data: reports,
    })
  } catch (error: any) {
    console.error('Error fetching unreviewed reports:', error)
    return c.json(
      {
        error: {
          code: 'REPORTS_FETCH_ERROR',
          message: error.message || 'Failed to fetch unreviewed reports',
          timestamp: new Date().toISOString(),
        },
      },
      500
    )
  }
})

// GET /api/monitoring/progress-report/summary/:studentId/:term/:academicYear
app.get('/summary/:studentId/:term/:academicYear', async (c) => {
  try {
    const { studentId, term, academicYear } = c.req.param()

    const summary = await getReportSummary(studentId, term, academicYear)

    return c.json({
      success: true,
      data: summary,
    })
  } catch (error: any) {
    console.error('Error fetching report summary:', error)
    return c.json(
      {
        error: {
          code: 'SUMMARY_FETCH_ERROR',
          message: error.message || 'Failed to fetch report summary',
          timestamp: new Date().toISOString(),
        },
      },
      500
    )
  }
})

export default app
