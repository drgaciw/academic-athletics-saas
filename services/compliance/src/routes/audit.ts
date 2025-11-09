/**
 * Audit Log Route
 * GET /api/compliance/audit-log/:studentId
 */

import { Hono } from 'hono'
import { getAuditLog, getAuditSummary } from '../services/auditLogger'

const app = new Hono()

/**
 * Get audit log for a student
 */
app.get('/:studentId', async (c) => {
  try {
    const studentId = c.req.param('studentId')
    const limit = parseInt(c.req.query('limit') || '50')
    const offset = parseInt(c.req.query('offset') || '0')

    const logs = await getAuditLog(studentId, limit, offset)
    const summary = await getAuditSummary(studentId)

    return c.json({
      studentId,
      summary,
      logs,
      pagination: {
        limit,
        offset,
        hasMore: logs.length === limit,
      },
    })
  } catch (error) {
    console.error('Error retrieving audit log:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

/**
 * Get audit summary only
 */
app.get('/:studentId/summary', async (c) => {
  try {
    const studentId = c.req.param('studentId')
    const summary = await getAuditSummary(studentId)

    return c.json({
      studentId,
      summary,
    })
  } catch (error) {
    console.error('Error retrieving audit summary:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

/**
 * Get audit log with filters
 */
app.get('/:studentId/filtered', async (c) => {
  try {
    const studentId = c.req.param('studentId')
    const checkType = c.req.query('checkType')
    const result = c.req.query('result')
    const limit = parseInt(c.req.query('limit') || '50')

    let logs = await getAuditLog(studentId, limit, 0)

    // Apply filters
    if (checkType) {
      logs = logs.filter((log) => log.checkType === checkType)
    }

    if (result) {
      logs = logs.filter((log) => log.result === result)
    }

    return c.json({
      studentId,
      filters: {
        checkType,
        result,
      },
      total: logs.length,
      logs,
    })
  } catch (error) {
    console.error('Error retrieving filtered audit log:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

export default app
