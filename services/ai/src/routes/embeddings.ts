import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { embeddingService } from '../services/embeddingService'
import { EmbeddingGenerationSchema } from '../types'

export const embeddingsRouter = new Hono()

/**
 * POST /api/ai/embeddings/generate - Generate embeddings (admin only)
 */
embeddingsRouter.post('/generate', zValidator('json', EmbeddingGenerationSchema), async (c) => {
  try {
    // Check admin role (would come from auth middleware)
    const userRole = c.req.header('X-User-Role')

    if (userRole !== 'ADMIN') {
      return c.json(
        {
          error: {
            code: 'FORBIDDEN',
            message: 'Admin access required',
          },
        },
        403
      )
    }

    const { texts, model, dimensions } = c.req.valid('json')

    const result = await embeddingService.generateEmbeddings({
      texts,
      model,
      dimensions,
    })

    return c.json(result)
  } catch (error) {
    console.error('Embedding generation error:', error)
    return c.json(
      {
        error: {
          code: 'GENERATION_ERROR',
          message: 'Failed to generate embeddings',
        },
      },
      500
    )
  }
})

/**
 * POST /api/ai/embeddings/batch - Batch store embeddings (admin only)
 */
embeddingsRouter.post('/batch', async (c) => {
  try {
    const userRole = c.req.header('X-User-Role')

    if (userRole !== 'ADMIN') {
      return c.json({ error: { code: 'FORBIDDEN', message: 'Admin access required' } }, 403)
    }

    const { items } = await c.req.json()

    if (!Array.isArray(items)) {
      return c.json({ error: { code: 'INVALID_INPUT', message: 'Items array required' } }, 400)
    }

    const result = await embeddingService.batchStoreEmbeddings(items)

    return c.json(result)
  } catch (error) {
    console.error('Batch embedding error:', error)
    return c.json(
      {
        error: {
          code: 'BATCH_ERROR',
          message: 'Failed to batch store embeddings',
        },
      },
      500
    )
  }
})
