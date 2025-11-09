import { Hono } from 'hono'
import { stream } from 'hono/streaming'
import { zValidator } from '@hono/zod-validator'
import { chatService } from '../services/chatService'
import { ChatMessageSchema } from '../types'

export const chatRouter = new Hono()

/**
 * POST /api/ai/chat - Send chat message with streaming response
 */
chatRouter.post('/', zValidator('json', ChatMessageSchema), async (c) => {
  try {
    const { message, conversationId, userId, model, stream: shouldStream, context } = c.req.valid('json')

    // Get auth user (would come from middleware in production)
    const authUserId = c.req.header('X-User-Id') || userId

    if (!authUserId) {
      return c.json({ error: { code: 'UNAUTHORIZED', message: 'User ID required' } }, 401)
    }

    // Handle streaming response
    if (shouldStream !== false) {
      const result = await chatService.chat(authUserId, message, {
        conversationId,
        model,
        useRAG: true,
      })

      // Return Server-Sent Events stream
      return stream(c, async (stream) => {
        stream.onAbort(() => {
          console.log('Client aborted stream')
        })

        // Send conversation ID first
        await stream.write(`data: ${JSON.stringify({ type: 'conversation', conversationId: result.conversationId })}\n\n`)

        // Stream AI response
        const reader = result.stream.getReader()
        const decoder = new TextDecoder()

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value, { stream: true })
            await stream.write(`data: ${JSON.stringify({ type: 'delta', content: chunk })}\n\n`)
          }

          // Send completion signal
          await stream.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`)
        } catch (error) {
          console.error('Streaming error:', error)
          await stream.write(`data: ${JSON.stringify({ type: 'error', message: 'Stream error' })}\n\n`)
        }
      })
    }

    // Handle non-streaming response
    const result = await chatService.chatSync(authUserId, message, {
      conversationId,
      model,
      useRAG: true,
    })

    return c.json({
      conversationId: result.conversationId,
      response: result.response,
      model: result.model,
      tokenUsage: result.tokenUsage,
      cost: result.cost,
    })
  } catch (error) {
    console.error('Chat error:', error)
    return c.json(
      {
        error: {
          code: 'CHAT_ERROR',
          message: error instanceof Error ? error.message : 'Failed to process chat',
        },
      },
      500
    )
  }
})

/**
 * GET /api/ai/chat/history/:conversationId - Get conversation history
 */
chatRouter.get('/history/:conversationId', async (c) => {
  try {
    const conversationId = c.req.param('conversationId')
    const authUserId = c.req.header('X-User-Id')

    if (!authUserId) {
      return c.json({ error: { code: 'UNAUTHORIZED', message: 'User ID required' } }, 401)
    }

    const history = await chatService.getConversationHistory(conversationId)

    return c.json({
      conversationId,
      messages: history,
      count: history.length,
    })
  } catch (error) {
    console.error('History fetch error:', error)
    return c.json(
      {
        error: {
          code: 'HISTORY_ERROR',
          message: 'Failed to fetch conversation history',
        },
      },
      500
    )
  }
})

/**
 * GET /api/ai/chat/conversations - Get user's conversations
 */
chatRouter.get('/conversations', async (c) => {
  try {
    const authUserId = c.req.header('X-User-Id')

    if (!authUserId) {
      return c.json({ error: { code: 'UNAUTHORIZED', message: 'User ID required' } }, 401)
    }

    const limit = parseInt(c.req.query('limit') || '20')
    const conversations = await chatService.getUserConversations(authUserId, limit)

    return c.json({
      conversations,
      count: conversations.length,
    })
  } catch (error) {
    console.error('Conversations fetch error:', error)
    return c.json(
      {
        error: {
          code: 'FETCH_ERROR',
          message: 'Failed to fetch conversations',
        },
      },
      500
    )
  }
})

/**
 * DELETE /api/ai/chat/:conversationId - Delete conversation
 */
chatRouter.delete('/:conversationId', async (c) => {
  try {
    const conversationId = c.req.param('conversationId')
    const authUserId = c.req.header('X-User-Id')

    if (!authUserId) {
      return c.json({ error: { code: 'UNAUTHORIZED', message: 'User ID required' } }, 401)
    }

    await chatService.deleteConversation(conversationId, authUserId)

    return c.json({ success: true, message: 'Conversation deleted' })
  } catch (error) {
    console.error('Delete error:', error)
    return c.json(
      {
        error: {
          code: 'DELETE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to delete conversation',
        },
      },
      500
    )
  }
})
