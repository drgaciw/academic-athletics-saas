/**
 * Audit Logger
 * 
 * Comprehensive audit logging for agent actions and tool invocations
 * Ensures FERPA compliance and NCAA audit requirements
 */

import type { AgentType, AgentResponse, ToolInvocation } from '../types/agent.types'

/**
 * Audit log entry for agent execution
 */
export interface AgentAuditEntry {
  userId: string
  agentType: AgentType
  conversationId?: string
  taskId?: string
  inputSummary: string
  outputSummary: string
  modelUsed: string
  tokenCount: number
  latencyMs: number
  cost: number
  success: boolean
  errorMessage?: string
  errorCode?: string
  userRole?: string
  ipAddress?: string
  userAgent?: string
  metadata?: Record<string, any>
}

/**
 * Audit log entry for tool invocation
 */
export interface ToolAuditEntry {
  userId: string
  agentType?: AgentType
  conversationId?: string
  taskId?: string
  toolName: string
  toolParameters: Record<string, any>
  toolResult: any
  modelUsed: string
  latencyMs: number
  success: boolean
  errorMessage?: string
  errorCode?: string
  userRole?: string
  metadata?: Record<string, any>
}

/**
 * Audit query filters
 */
export interface AuditQueryFilters {
  userId?: string
  agentType?: AgentType
  actionType?: string
  toolName?: string
  conversationId?: string
  taskId?: string
  success?: boolean
  startDate?: Date
  endDate?: Date
  limit?: number
}

/**
 * Audit statistics
 */
export interface AuditStatistics {
  totalActions: number
  successRate: number
  averageLatency: number
  totalCost: number
  totalTokens: number
  actionsByType: Record<string, number>
  agentsByType: Record<AgentType, number>
  toolsByName: Record<string, number>
  errorsByCode: Record<string, number>
}

/**
 * Audit Logger Class
 */
export class AuditLogger {
  /**
   * Log agent execution
   */
  async logAgentExecution(entry: AgentAuditEntry): Promise<void> {
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()

    try {
      await prisma.aIAuditLog.create({
        data: {
          userId: entry.userId,
          actionType: 'AGENT_EXECUTION',
          inputSummary: this.truncate(entry.inputSummary, 1000),
          outputSummary: this.truncate(entry.outputSummary, 1000),
          modelUsed: entry.modelUsed,
          tokenCount: entry.tokenCount,
          latencyMs: entry.latencyMs,
          cost: entry.cost,
          metadata: {
            agentType: entry.agentType,
            conversationId: entry.conversationId,
            taskId: entry.taskId,
            success: entry.success,
            errorMessage: entry.errorMessage,
            errorCode: entry.errorCode,
            userRole: entry.userRole,
            ipAddress: entry.ipAddress,
            userAgent: entry.userAgent,
            ...(entry.metadata || {}),
          },
        },
      })
    } catch (error) {
      console.error('Failed to log agent execution:', error)
      // Don't throw - audit logging should not break the application
    } finally {
      await prisma.$disconnect()
    }
  }

  /**
   * Log tool invocation
   */
  async logToolInvocation(entry: ToolAuditEntry): Promise<void> {
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()

    try {
      await prisma.aIAuditLog.create({
        data: {
          userId: entry.userId,
          actionType: 'TOOL_INVOCATION',
          inputSummary: entry.toolName,
          outputSummary: null,
          modelUsed: entry.modelUsed,
          tokenCount: 0, // Tools don't use tokens directly
          latencyMs: entry.latencyMs,
          cost: 0, // Tool cost tracked at agent level
          metadata: {
            agentType: entry.agentType,
            conversationId: entry.conversationId,
            taskId: entry.taskId,
            toolName: entry.toolName,
            toolParameters: entry.toolParameters,
            toolResult: this.sanitizeToolResult(entry.toolResult),
            success: entry.success,
            errorMessage: entry.errorMessage,
            errorCode: entry.errorCode,
            userRole: entry.userRole,
            ...(entry.metadata || {}),
          },
        },
      })
    } catch (error) {
      console.error('Failed to log tool invocation:', error)
    } finally {
      await prisma.$disconnect()
    }
  }

  /**
   * Log agent response with all tool invocations
   */
  async logAgentResponse(
    userId: string,
    agentType: AgentType,
    request: {
      message: string
      conversationId?: string
      taskId?: string
      userRole?: string
      ipAddress?: string
      userAgent?: string
    },
    response: AgentResponse
  ): Promise<void> {
    // Log main agent execution
    await this.logAgentExecution({
      userId,
      agentType,
      conversationId: request.conversationId,
      taskId: request.taskId,
      inputSummary: request.message,
      outputSummary: response.content,
      modelUsed: this.extractModelFromMetadata(response.metadata),
      tokenCount: response.usage.totalTokens,
      latencyMs: response.duration,
      cost: response.cost,
      success: response.status === 'completed',
      errorMessage: response.error?.message,
      errorCode: response.error?.code,
      userRole: request.userRole,
      ipAddress: request.ipAddress,
      userAgent: request.userAgent,
      metadata: {
        steps: response.steps.length,
        toolInvocations: response.toolInvocations.length,
        ...response.metadata,
      },
    })

    // Log each tool invocation
    for (const tool of response.toolInvocations) {
      await this.logToolInvocation({
        userId,
        agentType,
        conversationId: request.conversationId,
        taskId: request.taskId,
        toolName: tool.toolName,
        toolParameters: tool.parameters,
        toolResult: tool.result,
        modelUsed: this.extractModelFromMetadata(response.metadata),
        latencyMs: tool.latency,
        success: !tool.error,
        errorMessage: tool.error?.message,
        errorCode: tool.error?.code,
        userRole: request.userRole,
        metadata: {
          confirmationRequired: tool.confirmationRequired,
          confirmed: tool.confirmed,
        },
      })
    }
  }

  /**
   * Query audit logs
   */
  async queryLogs(filters: AuditQueryFilters): Promise<any[]> {
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()

    try {
      const where: any = {}

      if (filters.userId) where.userId = filters.userId
      if (filters.agentType) where.agentType = filters.agentType
      if (filters.actionType) where.actionType = filters.actionType
      if (filters.toolName) where.toolName = filters.toolName
      if (filters.conversationId) where.conversationId = filters.conversationId
      if (filters.taskId) where.taskId = filters.taskId
      if (filters.success !== undefined) where.success = filters.success

      if (filters.startDate || filters.endDate) {
        where.timestamp = {}
        if (filters.startDate) where.timestamp.gte = filters.startDate
        if (filters.endDate) where.timestamp.lte = filters.endDate
      }

      const logs = await prisma.aIAuditLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: filters.limit || 100,
      })

      return logs
    } finally {
      await prisma.$disconnect()
    }
  }

  /**
   * Get audit statistics
   */
  async getStatistics(filters: AuditQueryFilters): Promise<AuditStatistics> {
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()

    try {
      const where: any = {}

      if (filters.userId) where.userId = filters.userId
      if (filters.agentType) where.agentType = filters.agentType
      if (filters.startDate || filters.endDate) {
        where.timestamp = {}
        if (filters.startDate) where.timestamp.gte = filters.startDate
        if (filters.endDate) where.timestamp.lte = filters.endDate
      }

      const logs = await prisma.aIAuditLog.findMany({ where })

      const totalActions = logs.length
      const successCount = logs.filter((l) => {
        const meta = l.metadata as any
        return meta?.success === true
      }).length
      const successRate = totalActions > 0 ? successCount / totalActions : 0

      const totalLatency = logs.reduce((sum, l) => sum + l.latencyMs, 0)
      const averageLatency = totalActions > 0 ? totalLatency / totalActions : 0

      const totalCost = logs.reduce((sum, l) => sum + (l.cost || 0), 0)
      const totalTokens = logs.reduce((sum, l) => sum + l.tokenCount, 0)

      const actionsByType: Record<string, number> = {}
      const agentsByType: Record<AgentType, number> = {} as any
      const toolsByName: Record<string, number> = {}
      const errorsByCode: Record<string, number> = {}

      for (const log of logs) {
        const meta = log.metadata as any
        
        // Count by action type
        actionsByType[log.actionType] = (actionsByType[log.actionType] || 0) + 1

        // Count by agent type
        if (meta?.agentType) {
          agentsByType[meta.agentType as AgentType] =
            (agentsByType[meta.agentType as AgentType] || 0) + 1
        }

        // Count by tool name
        if (meta?.toolName) {
          toolsByName[meta.toolName] = (toolsByName[meta.toolName] || 0) + 1
        }

        // Count by error code
        if (meta?.errorCode) {
          errorsByCode[meta.errorCode] = (errorsByCode[meta.errorCode] || 0) + 1
        }
      }

      return {
        totalActions,
        successRate,
        averageLatency,
        totalCost,
        totalTokens,
        actionsByType,
        agentsByType,
        toolsByName,
        errorsByCode,
      }
    } finally {
      await prisma.$disconnect()
    }
  }

  /**
   * Get user activity summary
   */
  async getUserActivity(
    userId: string,
    days: number = 30
  ): Promise<{
    totalActions: number
    agentUsage: Record<AgentType, number>
    toolUsage: Record<string, number>
    averageLatency: number
    totalCost: number
    recentErrors: Array<{ timestamp: Date; errorCode: string; errorMessage: string }>
  }> {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const stats = await this.getStatistics({
      userId,
      startDate,
    })

    const logs = await this.queryLogs({
      userId,
      startDate,
      success: false,
      limit: 10,
    })

    return {
      totalActions: stats.totalActions,
      agentUsage: stats.agentsByType,
      toolUsage: stats.toolsByName,
      averageLatency: stats.averageLatency,
      totalCost: stats.totalCost,
      recentErrors: logs.map((log) => ({
        timestamp: log.timestamp,
        errorCode: log.errorCode || 'UNKNOWN',
        errorMessage: log.errorMessage || 'No error message',
      })),
    }
  }

  /**
   * Get compliance report
   */
  async getComplianceReport(
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalActions: number
    uniqueUsers: number
    actionsByType: Record<string, number>
    toolInvocations: number
    dataAccessEvents: number
    failedActions: number
    averageResponseTime: number
  }> {
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()

    try {
      const logs = await prisma.aIAuditLog.findMany({
        where: {
          timestamp: {
            gte: startDate,
            lte: endDate,
          },
        },
      })

      const uniqueUsers = new Set(logs.map((l) => l.userId)).size
      const toolInvocations = logs.filter((l) => l.actionType === 'TOOL_INVOCATION').length
      const dataAccessEvents = logs.filter((l) => {
        const meta = l.metadata as any
        return ['getStudentProfile', 'getAcademicRecords', 'getAthleticSchedule'].includes(
          meta?.toolName || ''
        )
      }).length
      const failedActions = logs.filter((l) => {
        const meta = l.metadata as any
        return meta?.success === false
      }).length

      const totalLatency = logs.reduce((sum, l) => sum + l.latencyMs, 0)
      const averageResponseTime = logs.length > 0 ? totalLatency / logs.length : 0

      const actionsByType: Record<string, number> = {}
      for (const log of logs) {
        actionsByType[log.actionType] = (actionsByType[log.actionType] || 0) + 1
      }

      return {
        totalActions: logs.length,
        uniqueUsers,
        actionsByType,
        toolInvocations,
        dataAccessEvents,
        failedActions,
        averageResponseTime,
      }
    } finally {
      await prisma.$disconnect()
    }
  }

  /**
   * Delete old audit logs (for GDPR compliance)
   */
  async deleteOldLogs(olderThanDays: number = 365): Promise<number> {
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()

    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays)

      const result = await prisma.aIAuditLog.deleteMany({
        where: {
          timestamp: {
            lt: cutoffDate,
          },
        },
      })

      return result.count
    } finally {
      await prisma.$disconnect()
    }
  }

  // Helper methods

  private truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength - 3) + '...'
  }

  private sanitizeToolResult(result: any): any {
    // Remove sensitive data from tool results before logging
    if (!result) return result

    const sanitized = JSON.parse(JSON.stringify(result))

    // Remove common sensitive fields
    const sensitiveFields = [
      'password',
      'token',
      'apiKey',
      'secret',
      'ssn',
      'creditCard',
    ]

    const removeSensitiveFields = (obj: any) => {
      if (typeof obj !== 'object' || obj === null) return

      for (const key of Object.keys(obj)) {
        if (sensitiveFields.some((field) => key.toLowerCase().includes(field))) {
          obj[key] = '[REDACTED]'
        } else if (typeof obj[key] === 'object') {
          removeSensitiveFields(obj[key])
        }
      }
    }

    removeSensitiveFields(sanitized)
    return sanitized
  }

  private extractModelFromMetadata(metadata?: Record<string, any>): string {
    if (!metadata) return 'unknown'
    return metadata.model || metadata.modelUsed || 'unknown'
  }
}

/**
 * Global audit logger instance
 */
export const globalAuditLogger = new AuditLogger()

/**
 * Convenience functions
 */
export async function logAgentExecution(entry: AgentAuditEntry): Promise<void> {
  return globalAuditLogger.logAgentExecution(entry)
}

export async function logToolInvocation(entry: ToolAuditEntry): Promise<void> {
  return globalAuditLogger.logToolInvocation(entry)
}

export async function logAgentResponse(
  userId: string,
  agentType: AgentType,
  request: {
    message: string
    conversationId?: string
    taskId?: string
    userRole?: string
    ipAddress?: string
    userAgent?: string
  },
  response: AgentResponse
): Promise<void> {
  return globalAuditLogger.logAgentResponse(userId, agentType, request, response)
}

export async function queryAuditLogs(filters: AuditQueryFilters): Promise<any[]> {
  return globalAuditLogger.queryLogs(filters)
}

export async function getAuditStatistics(
  filters: AuditQueryFilters
): Promise<AuditStatistics> {
  return globalAuditLogger.getStatistics(filters)
}

export async function getUserActivity(userId: string, days?: number) {
  return globalAuditLogger.getUserActivity(userId, days)
}

export async function getComplianceReport(startDate: Date, endDate: Date) {
  return globalAuditLogger.getComplianceReport(startDate, endDate)
}
