// Team analytics route
import { Hono } from 'hono'
import {
  getTeamAnalytics,
  getStudentComparison,
  getTeamTrends,
} from '../services/analyticsService'

const app = new Hono()

// GET /api/monitoring/analytics/team/:teamId
app.get('/team/:teamId', async (c) => {
  try {
    const teamId = c.req.param('teamId')
    const { term, academicYear } = c.req.query()

    const analytics = await getTeamAnalytics(teamId, term, academicYear)

    return c.json({
      success: true,
      data: analytics,
    })
  } catch (error: any) {
    console.error('Error fetching team analytics:', error)
    return c.json(
      {
        error: {
          code: 'ANALYTICS_FETCH_ERROR',
          message: error.message || 'Failed to fetch team analytics',
          timestamp: new Date().toISOString(),
        },
      },
      500
    )
  }
})

// GET /api/monitoring/analytics/comparison/:studentId/:teamId
app.get('/comparison/:studentId/:teamId', async (c) => {
  try {
    const { studentId, teamId } = c.req.param()

    const comparison = await getStudentComparison(studentId, teamId)

    return c.json({
      success: true,
      data: comparison,
    })
  } catch (error: any) {
    console.error('Error fetching student comparison:', error)
    return c.json(
      {
        error: {
          code: 'COMPARISON_FETCH_ERROR',
          message: error.message || 'Failed to fetch student comparison',
          timestamp: new Date().toISOString(),
        },
      },
      500
    )
  }
})

// GET /api/monitoring/analytics/trends/:teamId
app.get('/trends/:teamId', async (c) => {
  try {
    const teamId = c.req.param('teamId')
    const { numberOfTerms } = c.req.query()

    const trends = await getTeamTrends(
      teamId,
      numberOfTerms ? parseInt(numberOfTerms) : undefined
    )

    return c.json({
      success: true,
      data: trends,
    })
  } catch (error: any) {
    console.error('Error fetching team trends:', error)
    return c.json(
      {
        error: {
          code: 'TRENDS_FETCH_ERROR',
          message: error.message || 'Failed to fetch team trends',
          timestamp: new Date().toISOString(),
        },
      },
      500
    )
  }
})

export default app
