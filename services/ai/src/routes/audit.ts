/**
 * Audit Logging API Routes
 * 
 * Provides access to AI agent audit logs for compliance and monitoring
 * FERPA compliant with role-based access control
 */

import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import {
  queryAuditLogs,
  getAuditStatistics,
  getUserActivity,
  getComplianceReport,
  type AuditQueryFilters,
} from '@aah/ai'
import { isAdmin, isAdminOrStaff } from '../utils/auth'

const app = new Hono()

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const queryLogsSchema = z.object({
  userId: z.string().optional(),
  agentType: z.enum(['advising', 'compliance', 'intervention', 'admin', 'general']).optional(),
  actionType: z.string().optional(),
  toolName: z.string().optional(),
  conversationId: z.string().optional(),
  taskId: z.string().optional(),
  success: z.boolean().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.number().int().min(1).max(1000).optional(),
})

const statisticsSchema = z.object({
  userId: z.string().optional(),
  agentType: z.enum(['advising', 'compliance', 'intervention', 'admin', 'general']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
})

const userActivitySchema = z.object({
  days: z.number().int().min(1).max(365).optional(),
})

const complianceReportSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
})

// =============================================================================
// ROUTES
// =============================================================================

/**
 * Query audit logs
 * GET /api/ai/audit/logs
 * 
 * Query parameters:
 * - userId: Filter by user ID
 * - agentType: Filter by agent type
 * - actionType: Filter by action type (AGENT_EXECUTION, TOOL_INVOCATION)
 * - toolName: Filter by tool name
 * - conversationId: Filter by conversation ID
 * - taskId: Filter by task ID
 * - success: Filter by success status
 * - startDate: Filter by start date (ISO 8601)
 * - endDate: Filter by end date (ISO 8601)
 * - limit: Maximum number of results (default: 100, max: 1000)
 * 
 * Requires: Admin or Staff role
 */
app.get(
  '/logs',
  zValidator('query', queryLogsSchema),
  async (c) => {
    try {
      const query = c.req.valid('query')
      const authUserId = c.req.header('X-User-Id')

      if (!authUserId) {
        return c.json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        }, 401)
      }

      // Check if user has admin/staff role if querying for other users
      let targetUserId = query.userId
      if (targetUserId && targetUserId !== authUserId) {
        const isAuthorized = await isAdminOrStaff(authUserId)
        if (!isAuthorized) {
          return c.json({
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'You can only query your own logs',
            },
          }, 403)
        }
      } else {
        targetUserId = authUserId
      }

      const filters: AuditQueryFilters = {
        userId: targetUserId,
        agentType: query.agentType as any,
        actionType: query.actionType,
        toolName: query.toolName,
        conversationId: query.conversationId,
        taskId: query.taskId,
        success: query.success,
        startDate: query.startDate ? new Date(query.startDate) : undefined,
        endDate: query.endDate ? new Date(query.endDate) : undefined,
        limit: query.limit || 100,
      }

      const logs = await queryAuditLogs(filters)

      return c.json({
        success: true,
        data: {
          logs,
          count: logs.length,
          filters,
        },
      })
    } catch (error) {
      console.error('Error querying audit logs:', error)
      return c.json({
        success: false,
        error: {
          code: 'QUERY_FAILED',
          message: 'Failed to query audit logs',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      }, 500)
    }
  }
)

/**
 * Get audit statistics
 * GET /api/ai/audit/statistics
 * 
 * Query parameters:
 * - userId: Filter by user ID
 * - agentType: Filter by agent type
 * - startDate: Filter by start date (ISO 8601)
 * - endDate: Filter by end date (ISO 8601)
 * 
 * Requires: Admin or Staff role
 */
app.get(
  '/statistics',
  zValidator('query', statisticsSchema),
  async (c) => {
    try {
      const query = c.req.valid('query')
      const authUserId = c.req.header('X-User-Id')

      if (!authUserId) {
        return c.json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        }, 401)
      }

      // Only admin/staff can access statistics
      const isAuthorized = await isAdminOrStaff(authUserId)
      if (!isAuthorized) {
        return c.json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Access denied: Requires Admin or Staff role',
          },
        }, 403)
      }

      const filters: AuditQueryFilters = {
        userId: query.userId,
        agentType: query.agentType as any,
        startDate: query.startDate ? new Date(query.startDate) : undefined,
        endDate: query.endDate ? new Date(query.endDate) : undefined,
      }

      const statistics = await getAuditStatistics(filters)

      return c.json({
        success: true,
        data: statistics,
      })
    } catch (error) {
      console.error('Error getting audit statistics:', error)
      return c.json({
        success: false,
        error: {
          code: 'STATISTICS_FAILED',
          message: 'Failed to get audit statistics',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      }, 500)
    }
  }
)

/**
 * Get user activity summary
 * GET /api/ai/audit/activity/:userId
 * 
 * Query parameters:
 * - days: Number of days to look back (default: 30, max: 365)
 * 
 * Requires: User must be querying their own activity or have admin role
 */
app.get(
  '/activity/:userId',
  zValidator('query', userActivitySchema),
  async (c) => {
    try {
      const userId = c.req.param('userId')
      const query = c.req.valid('query')
      const authUserId = c.req.header('X-User-Id')

      if (!authUserId) {
        return c.json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        }, 401)
      }

      // Users can only query their own activity (unless admin)
      if (userId !== authUserId) {
        const isAuthorized = await isAdmin(authUserId)
        if (!isAuthorized) {
          return c.json({
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'You can only query your own activity',
            },
          }, 403)
        }
      }

      const activity = await getUserActivity(userId, query.days || 30)

      return c.json({
        success: true,
        data: activity,
      })
    } catch (error) {
      console.error('Error getting user activity:', error)
      return c.json({
        success: false,
        error: {
          code: 'ACTIVITY_FAILED',
          message: 'Failed to get user activity',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      }, 500)
    }
  }
)

/**
 * Get compliance report
 * POST /api/ai/audit/compliance-report
 * 
 * Body:
 * - startDate: Start date (ISO 8601)
 * - endDate: End date (ISO 8601)
 * 
 * Requires: Admin role
 */
app.post(
  '/compliance-report',
  zValidator('json', complianceReportSchema),
  async (c) => {
    try {
      const body = c.req.valid('json')
      const authUserId = c.req.header('X-User-Id')

      if (!authUserId) {
        return c.json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        }, 401)
      }

      const isAuthorized = await isAdmin(authUserId)
      if (!isAuthorized) {
        return c.json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Access denied: Requires Admin role',
          },
        }, 403)
      }

      const startDate = new Date(body.startDate)
      const endDate = new Date(body.endDate)

      const report = await getComplianceReport(startDate, endDate)

      return c.json({
        success: true,
        data: {
          ...report,
          period: {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            days: Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)),
          },
        },
      })
    } catch (error) {
      console.error('Error generating compliance report:', error)
      return c.json({
        success: false,
        error: {
          code: 'REPORT_FAILED',
          message: 'Failed to generate compliance report',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      }, 500)
    }
  }
)

/**
 * Get audit log by ID
 * GET /api/ai/audit/logs/:logId
 * 
 * Requires: User must own the log or have admin role
 */
app.get('/logs/:logId', async (c) => {
  try {
    const logId = c.req.param('logId')
    const authUserId = c.req.header('X-User-Id')

    if (!authUserId) {
      return c.json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      }, 401)
    }

    const { prisma } = await import('@aah/database')

    try {
      const log = await prisma.aIAuditLog.findUnique({
        where: { id: logId },
      })

      if (!log) {
        return c.json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Audit log not found',
          },
        }, 404)
      }

      // Users can only view their own logs (unless admin)
      if (log.userId !== authUserId) {
        const isAuthorized = await isAdmin(authUserId)
        if (!isAuthorized) {
          return c.json({
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'You can only view your own audit logs',
            },
          }, 403)
        }
      }

      return c.json({
        success: true,
        data: log,
      })
    } catch (dbError) {
      throw dbError
    }
  } catch (error) {
    console.error('Error getting audit log:', error)
    return c.json({
      success: false,
      error: {
        code: 'FETCH_FAILED',
        message: 'Failed to fetch audit log',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    }, 500)
  }
})

export default app
