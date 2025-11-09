import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { prisma } from '@aah/database'
import { FeedbackSchema } from '../types'

export const feedbackRouter = new Hono()

/**
 * POST /api/ai/feedback - Submit AI feedback
 */
feedbackRouter.post('/', zValidator('json', FeedbackSchema), async (c) => {
  try {
    const feedback = c.req.valid('json')
    const authUserId = c.req.header('X-User-Id')

    if (!authUserId) {
      return c.json({ error: { code: 'UNAUTHORIZED', message: 'User ID required' } }, 401)
    }

    await prisma.aIFeedback.create({
      data: {
        userId: authUserId,
        messageId: feedback.messageId,
        conversationId: feedback.conversationId,
        rating: feedback.rating,
        feedbackType: feedback.feedbackType,
        comment: feedback.comment,
        expectedResponse: feedback.expectedResponse,
      },
    })

    return c.json({ success: true, message: 'Feedback submitted' })
  } catch (error) {
    console.error('Feedback submission error:', error)
    return c.json(
      {
        error: {
          code: 'FEEDBACK_ERROR',
          message: 'Failed to submit feedback',
        },
      },
      500
    )
  }
})
