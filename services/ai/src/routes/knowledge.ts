import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { embeddingService } from '../services/embeddingService'
import { SemanticSearchSchema } from '../types'

export const knowledgeRouter = new Hono()

/**
 * POST /api/ai/knowledge/search - Semantic search knowledge base
 */
knowledgeRouter.post('/search', zValidator('json', SemanticSearchSchema), async (c) => {
  try {
    const { query, filters, limit, minScore } = c.req.valid('json')

    const results = await embeddingService.semanticSearch(query, {
      limit,
      minScore,
      contentType: filters?.contentType,
      source: filters?.source,
    })

    return c.json({
      results,
      count: results.length,
      query,
    })
  } catch (error) {
    console.error('Knowledge search error:', error)
    return c.json(
      {
        error: {
          code: 'SEARCH_ERROR',
          message: 'Failed to search knowledge base',
        },
      },
      500
    )
  }
})

/**
 * GET /api/ai/knowledge/stats - Get knowledge base statistics
 */
knowledgeRouter.get('/stats', async (c) => {
  try {
    const stats = await embeddingService.getStatistics()
    return c.json(stats)
  } catch (error) {
    console.error('Stats error:', error)
    return c.json(
      {
        error: {
          code: 'STATS_ERROR',
          message: 'Failed to get statistics',
        },
      },
      500
    )
  }
})
