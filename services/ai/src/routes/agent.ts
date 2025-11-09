import { Hono } from 'hono'
import { stream } from 'hono/streaming'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { 
  globalOrchestrator,
  classifyIntent,
  globalStateManager,
  getRelevantMemories,
  extractAndSaveFacts,
  logAgentResponse,
  type AgentRequest,
  type AgentType
} from '@aah/ai'

export const agentRouter = new Hono()

/**
 * Request schema for agent execution
 */
const AgentExecutionSchema = z.object({
  message: z.string().min(1).max(10000),
  userId: z.string(),
  agentType: z.enum(['advising', 'compliance', 'intervention', 'administrative', 'general']).optional(),
  conversationId: z.string().optional(),
  context: z.record(z.unknown()).optional(),
  streaming: z.boolean().optional().default(true),
  maxSteps: z.number().min(1).max(20).optional().default(10),
})

/**
 * POST /api/ai/agent/execute - Execute agent workflow
 */
agentRouter.post('/execute', zValidator('json', AgentExecutionSchema), async (c) => {
  try {
    const request = c.req.valid('json')
    const authUserId = c.req.header('X-User-Id') || request.userId

    if (!authUserId) {
      return c.json({ error: { code: 'UNAUTHORIZED', message: 'User ID required' } }, 401)
    }

    // Classify intent if agent type not specified
    let agentType: AgentType = request.agentType || 'general'
    if (!request.agentType) {
      const classification = await classifyIntent(request.message, request.context)
      agentType = classification.agentType
      console.log(`Intent classified as: ${agentType} (confidence: ${classification.confidence.toFixed(2)})`)
    }

    // Retrieve relevant memories
    const memories = await getRelevantMemories(authUserId, request.message, {
      memoryType: ['long_term', 'working'],
      limit: 3
    })

    // Build agent request
    const agentRequest: AgentRequest = {
      userId: authUserId,
      agentType,
      message: request.message,
      conversationId: request.conversationId || `conv-${Date.now()}`,
      context: {
        ...request.context,
        memories: memories.map(m => m.content)
      },
      streaming: request.streaming,
      maxSteps: request.maxSteps
    }

    // Execute workflow
    const result = await globalOrchestrator.executeWorkflow(agentRequest)

    // Log agent execution for audit trail
    await logAgentResponse(
      authUserId,
      agentType,
      {
        message: request.message,
        conversationId: agentRequest.conversationId,
        userRole: c.req.header('X-User-Role'),
        ipAddress: c.req.header('X-Forwarded-For') || c.req.header('X-Real-IP'),
        userAgent: c.req.header('User-Agent'),
      },
      result.response
    ).catch((err) => console.warn('Failed to log audit:', err))

    // Extract and save facts from conversation
    if (agentRequest.conversationId) {
      await extractAndSaveFacts(
        authUserId,
        agentRequest.conversationId,
        agentType
      ).catch((err) => console.warn('Failed to extract facts:', err))
    }

    return c.json({
      success: result.success,
      agentType: result.agentsUsed[0],
      response: result.response.content,
      steps: result.response.steps,
      toolInvocations: result.response.toolInvocations,
      usage: result.response.usage,
      cost: result.totalCost,
      duration: result.totalDuration,
      conversationId: agentRequest.conversationId
    })
  } catch (error) {
    console.error('Agent execution error:', error)
    return c.json(
      {
        error: {
          code: 'EXECUTION_ERROR',
          message: error instanceof Error ? error.message : 'Failed to execute agent',
        },
      },
      500
    )
  }
})

/**
 * POST /api/ai/agent/stream - Execute agent workflow with streaming
 */
agentRouter.post('/stream', zValidator('json', AgentExecutionSchema), async (c) => {
  try {
    const request = c.req.valid('json')
    const authUserId = c.req.header('X-User-Id') || request.userId

    if (!authUserId) {
      return c.json({ error: { code: 'UNAUTHORIZED', message: 'User ID required' } }, 401)
    }

    // Classify intent if needed
    let agentType: AgentType = request.agentType || 'general'
    if (!request.agentType) {
      const classification = await classifyIntent(request.message, request.context)
      agentType = classification.agentType
    }

    // Retrieve memories
    const memories = await getRelevantMemories(authUserId, request.message, {
      memoryType: ['long_term', 'working'],
      limit: 3
    })

    const conversationId = request.conversationId || `conv-${Date.now()}`

    // Return SSE stream
    return stream(c, async (stream) => {
      stream.onAbort(() => {
        console.log('Client aborted stream')
      })

      try {
        // Send initial metadata
        await stream.writeln(`data: ${JSON.stringify({
          type: 'start',
          agentType,
          conversationId,
          timestamp: new Date().toISOString()
        })}\n`)

        // Send memory context
        if (memories.length > 0) {
          await stream.writeln(`data: ${JSON.stringify({
            type: 'context',
            memories: memories.map(m => ({ content: m.content }))
          })}\n`)
        }

        // Build agent request
        const agentRequest: AgentRequest = {
          userId: authUserId,
          agentType,
          message: request.message,
          conversationId,
          context: {
            ...request.context,
            memories: memories.map(m => m.content)
          },
          streaming: true,
          maxSteps: request.maxSteps
        }

        // Execute workflow
        const result = await globalOrchestrator.executeWorkflow(agentRequest)

        // Stream response content
        await stream.writeln(`data: ${JSON.stringify({
          type: 'response',
          content: result.response.content
        })}\n`)

        // Stream tool invocations
        for (const tool of result.response.toolInvocations) {
          await stream.writeln(`data: ${JSON.stringify({
            type: 'tool',
            toolName: tool.toolName,
            parameters: tool.parameters,
            result: tool.result,
            latency: tool.latency
          })}\n`)
        }

        // Send completion
        await stream.writeln(`data: ${JSON.stringify({
          type: 'done',
          usage: result.response.usage,
          cost: result.totalCost,
          duration: result.totalDuration
        })}\n`)

        // Log audit trail in background
        logAgentResponse(
          authUserId,
          agentType,
          {
            message: request.message,
            conversationId,
            userRole: c.req.header('X-User-Role'),
            ipAddress: c.req.header('X-Forwarded-For') || c.req.header('X-Real-IP'),
            userAgent: c.req.header('User-Agent'),
          },
          result.response
        ).catch((err) => console.warn('Failed to log audit:', err))

        // Extract facts in background
        extractAndSaveFacts(authUserId, conversationId, agentType)
          .catch((err) => console.warn('Failed to extract facts:', err))

      } catch (error) {
        console.error('Streaming error:', error)
        await stream.writeln(`data: ${JSON.stringify({
          type: 'error',
          message: error instanceof Error ? error.message : 'Stream error'
        })}\n`)
      }
    })
  } catch (error) {
    console.error('Stream setup error:', error)
    return c.json(
      {
        error: {
          code: 'STREAM_ERROR',
          message: error instanceof Error ? error.message : 'Failed to setup stream',
        },
      },
      500
    )
  }
})

/**
 * POST /api/ai/agent/advising - Execute advising agent
 */
agentRouter.post('/advising', zValidator('json', AgentExecutionSchema.omit({ agentType: true })), async (c) => {
  const request = c.req.valid('json')
  const headers = new Headers(c.req.raw.headers)
  headers.set('Content-Type', 'application/json')
  
  const executeUrl = c.req.url.replace('/advising', '/execute')
  const executeReq = new Request(executeUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({ ...request, agentType: 'advising' })
  })
  
  return agentRouter.fetch(executeReq)
})

/**
 * POST /api/ai/agent/compliance - Execute compliance agent
 */
agentRouter.post('/compliance', zValidator('json', AgentExecutionSchema.omit({ agentType: true })), async (c) => {
  const request = c.req.valid('json')
  const headers = new Headers(c.req.raw.headers)
  headers.set('Content-Type', 'application/json')
  
  const executeUrl = c.req.url.replace('/compliance', '/execute')
  const executeReq = new Request(executeUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({ ...request, agentType: 'compliance' })
  })
  
  return agentRouter.fetch(executeReq)
})

/**
 * POST /api/ai/agent/intervention - Execute intervention agent
 */
agentRouter.post('/intervention', zValidator('json', AgentExecutionSchema.omit({ agentType: true })), async (c) => {
  const request = c.req.valid('json')
  const headers = new Headers(c.req.raw.headers)
  headers.set('Content-Type', 'application/json')
  
  const executeUrl = c.req.url.replace('/intervention', '/execute')
  const executeReq = new Request(executeUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({ ...request, agentType: 'intervention' })
  })
  
  return agentRouter.fetch(executeReq)
})

/**
 * POST /api/ai/agent/admin - Execute administrative agent
 */
agentRouter.post('/admin', zValidator('json', AgentExecutionSchema.omit({ agentType: true })), async (c) => {
  const request = c.req.valid('json')
  const headers = new Headers(c.req.raw.headers)
  headers.set('Content-Type', 'application/json')
  
  const executeUrl = c.req.url.replace('/admin', '/execute')
  const executeReq = new Request(executeUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({ ...request, agentType: 'administrative' })
  })
  
  return agentRouter.fetch(executeReq)
})

/**
 * GET /api/ai/agent/status/:taskId - Get agent task status
 */
agentRouter.get('/status/:taskId', async (c) => {
  try {
    const taskId = c.req.param('taskId')

    // Load state from database
    const state = await globalStateManager.loadState(taskId)

    if (!state) {
      return c.json({
        error: {
          code: 'NOT_FOUND',
          message: 'Task not found'
        }
      }, 404)
    }

    return c.json({
      taskId: state.id,
      status: state.status,
      agentType: state.agentType,
      currentStep: state.currentStep,
      maxSteps: state.maxSteps,
      progress: Math.round((state.currentStep / state.maxSteps) * 100),
      createdAt: state.createdAt,
      updatedAt: state.updatedAt,
      completedAt: state.completedAt
    })
  } catch (error) {
    console.error('Task status error:', error)
    return c.json(
      {
        error: {
          code: 'STATUS_ERROR',
          message: 'Failed to get task status',
        },
      },
      500
    )
  }
})

/**
 * POST /api/ai/agent/cancel/:taskId - Cancel running agent task
 */
agentRouter.post('/cancel/:taskId', async (c) => {
  try {
    const taskId = c.req.param('taskId')

    await globalStateManager.cancelWorkflow(taskId)

    return c.json({
      success: true,
      message: 'Task cancelled successfully'
    })
  } catch (error) {
    console.error('Task cancellation error:', error)
    return c.json(
      {
        error: {
          code: 'CANCEL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to cancel task',
        },
      },
      500
    )
  }
})

/**
 * GET /api/ai/agent/history/:userId - Get agent interaction history
 */
agentRouter.get('/history/:userId', async (c) => {
  try {
    const userId = c.req.param('userId')
    const authUserId = c.req.header('X-User-Id')

    // Verify user can access this history
    if (authUserId !== userId) {
      return c.json({
        error: {
          code: 'FORBIDDEN',
          message: 'Cannot access other user history'
        }
      }, 403)
    }

    const limit = parseInt(c.req.query('limit') || '20')
    const states = await globalStateManager.listUserStates(userId)

    return c.json({
      userId,
      history: states.slice(0, limit).map(state => ({
        taskId: state.id,
        agentType: state.agentType,
        status: state.status,
        createdAt: state.createdAt,
        completedAt: state.completedAt,
        duration: state.completedAt 
          ? state.completedAt.getTime() - state.createdAt.getTime()
          : null
      })),
      total: states.length
    })
  } catch (error) {
    console.error('History fetch error:', error)
    return c.json(
      {
        error: {
          code: 'HISTORY_ERROR',
          message: 'Failed to fetch history',
        },
      },
      500
    )
  }
})


/**
 * GET /api/ai/agent/audit/logs - Query audit logs
 */
agentRouter.get('/audit/logs', async (c) => {
  try {
    const authUserId = c.req.header('X-User-Id')
    const userRole = c.req.header('X-User-Role')

    if (!authUserId) {
      return c.json({ error: { code: 'UNAUTHORIZED', message: 'User ID required' } }, 401)
    }

    // Only admins can query all logs, users can only see their own
    const userId = userRole === 'ADMIN' ? c.req.query('userId') : authUserId

    const { queryAuditLogs } = await import('@aah/ai')

    const logs = await queryAuditLogs({
      userId,
      agentType: c.req.query('agentType') as any,
      actionType: c.req.query('actionType'),
      toolName: c.req.query('toolName'),
      conversationId: c.req.query('conversationId'),
      taskId: c.req.query('taskId'),
      success: c.req.query('success') === 'true' ? true : c.req.query('success') === 'false' ? false : undefined,
      startDate: c.req.query('startDate') ? new Date(c.req.query('startDate')!) : undefined,
      endDate: c.req.query('endDate') ? new Date(c.req.query('endDate')!) : undefined,
      limit: c.req.query('limit') ? parseInt(c.req.query('limit')!) : 100,
    })

    return c.json({
      logs,
      count: logs.length
    })
  } catch (error) {
    console.error('Audit logs query error:', error)
    return c.json(
      {
        error: {
          code: 'QUERY_ERROR',
          message: 'Failed to query audit logs',
        },
      },
      500
    )
  }
})

/**
 * GET /api/ai/agent/audit/statistics - Get audit statistics
 */
agentRouter.get('/audit/statistics', async (c) => {
  try {
    const authUserId = c.req.header('X-User-Id')
    const userRole = c.req.header('X-User-Role')

    if (!authUserId) {
      return c.json({ error: { code: 'UNAUTHORIZED', message: 'User ID required' } }, 401)
    }

    // Only admins can query all stats, users can only see their own
    const userId = userRole === 'ADMIN' ? c.req.query('userId') : authUserId

    const { getAuditStatistics } = await import('@aah/ai')

    const stats = await getAuditStatistics({
      userId,
      agentType: c.req.query('agentType') as any,
      startDate: c.req.query('startDate') ? new Date(c.req.query('startDate')!) : undefined,
      endDate: c.req.query('endDate') ? new Date(c.req.query('endDate')!) : undefined,
    })

    return c.json({ statistics: stats })
  } catch (error) {
    console.error('Audit statistics error:', error)
    return c.json(
      {
        error: {
          code: 'STATISTICS_ERROR',
          message: 'Failed to get audit statistics',
        },
      },
      500
    )
  }
})

/**
 * GET /api/ai/agent/audit/activity/:userId - Get user activity summary
 */
agentRouter.get('/audit/activity/:userId', async (c) => {
  try {
    const userId = c.req.param('userId')
    const authUserId = c.req.header('X-User-Id')
    const userRole = c.req.header('X-User-Role')

    // Users can only see their own activity, admins can see anyone's
    if (authUserId !== userId && userRole !== 'ADMIN') {
      return c.json({
        error: {
          code: 'FORBIDDEN',
          message: 'Cannot access other user activity'
        }
      }, 403)
    }

    const days = c.req.query('days') ? parseInt(c.req.query('days')!) : 30

    const { getUserActivity } = await import('@aah/ai')

    const activity = await getUserActivity(userId, days)

    return c.json({ activity })
  } catch (error) {
    console.error('User activity error:', error)
    return c.json(
      {
        error: {
          code: 'ACTIVITY_ERROR',
          message: 'Failed to get user activity',
        },
      },
      500
    )
  }
})

/**
 * GET /api/ai/agent/audit/compliance - Get compliance report (admin only)
 */
agentRouter.get('/audit/compliance', async (c) => {
  try {
    const userRole = c.req.header('X-User-Role')

    if (userRole !== 'ADMIN') {
      return c.json({
        error: {
          code: 'FORBIDDEN',
          message: 'Admin access required'
        }
      }, 403)
    }

    const startDate = c.req.query('startDate') 
      ? new Date(c.req.query('startDate')!) 
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Default: last 30 days

    const endDate = c.req.query('endDate') 
      ? new Date(c.req.query('endDate')!) 
      : new Date()

    const { getComplianceReport } = await import('@aah/ai')

    const report = await getComplianceReport(startDate, endDate)

    return c.json({ 
      report,
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      }
    })
  } catch (error) {
    console.error('Compliance report error:', error)
    return c.json(
      {
        error: {
          code: 'REPORT_ERROR',
          message: 'Failed to generate compliance report',
        },
      },
      500
    )
  }
})
