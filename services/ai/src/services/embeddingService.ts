import OpenAI from 'openai'
import { prisma } from '@aah/database'
import { AI_CONFIG } from '../config'
import { EmbeddingRequest, EmbeddingResponse } from '../types'
import { estimateEmbeddingTokens, calculateEmbeddingCost } from '../utils/tokens'
import { hashContent } from '../utils/security'

const openai = new OpenAI({
  apiKey: AI_CONFIG.openai.apiKey,
  organization: AI_CONFIG.openai.organization,
})

export class EmbeddingService {
  /**
   * Generate embeddings for text array
   */
  async generateEmbeddings(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    const {
      texts,
      model = 'text-embedding-3-large',
      dimensions = AI_CONFIG.rag.embeddingDimensions,
    } = request

    // Validate input
    if (texts.length === 0) {
      throw new Error('No texts provided for embedding generation')
    }

    if (texts.length > 100) {
      throw new Error('Maximum 100 texts per batch. Please split into multiple requests.')
    }

    // Calculate cost estimate
    const costEstimate = calculateEmbeddingCost(texts, model)
    console.log(
      `Generating embeddings for ${texts.length} texts. ` +
        `Estimated tokens: ${costEstimate.totalTokens}, ` +
        `Cost: $${costEstimate.estimatedCost.toFixed(6)}`
    )

    try {
      // Generate embeddings via OpenAI API
      const response = await openai.embeddings.create({
        model,
        input: texts,
        dimensions: model === 'text-embedding-3-large' ? dimensions : undefined,
      })

      const embeddings = response.data.map((item) => item.embedding)

      return {
        embeddings,
        model,
        dimensions: embeddings[0]?.length || dimensions,
        tokens: response.usage.total_tokens,
      }
    } catch (error) {
      console.error('Error generating embeddings:', error)
      throw new Error(
        `Failed to generate embeddings: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Generate and store single embedding
   */
  async storeEmbedding(
    content: string,
    metadata: {
      contentType: string
      source: string
      title?: string
      section?: string
    }
  ): Promise<string> {
    const contentHash = hashContent(content)

    // Check if embedding already exists
    const existing = await prisma.vectorEmbedding.findUnique({
      where: { contentHash },
    })

    if (existing) {
      console.log('Embedding already exists for content hash:', contentHash)
      return existing.id
    }

    // Generate embedding
    const { embeddings } = await this.generateEmbeddings({
      texts: [content],
      model: 'text-embedding-3-large',
    })

    // Store in database
    const vectorEmbedding = await prisma.vectorEmbedding.create({
      data: {
        contentType: metadata.contentType,
        contentHash,
        embedding: embeddings[0],
        metadata: {
          source: metadata.source,
          title: metadata.title,
          section: metadata.section,
          content: content.substring(0, 500), // Store preview
          fullLength: content.length,
        },
      },
    })

    return vectorEmbedding.id
  }

  /**
   * Batch store embeddings
   */
  async batchStoreEmbeddings(
    items: Array<{
      content: string
      metadata: {
        contentType: string
        source: string
        title?: string
        section?: string
      }
    }>
  ): Promise<{ created: number; skipped: number; errors: number }> {
    let created = 0
    let skipped = 0
    let errors = 0

    // Process in batches of 50
    const batchSize = 50
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize)

      // Check for existing embeddings
      const contentHashes = batch.map((item) => hashContent(item.content))
      const existing = await prisma.vectorEmbedding.findMany({
        where: { contentHash: { in: contentHashes } },
        select: { contentHash: true },
      })

      const existingHashes = new Set(existing.map((e) => e.contentHash))

      // Filter out existing
      const newItems = batch.filter((item) => !existingHashes.has(hashContent(item.content)))
      skipped += batch.length - newItems.length

      if (newItems.length === 0) continue

      try {
        // Generate embeddings for new items
        const { embeddings } = await this.generateEmbeddings({
          texts: newItems.map((item) => item.content),
          model: 'text-embedding-3-large',
        })

        // Store all embeddings
        const createPromises = newItems.map((item, idx) =>
          prisma.vectorEmbedding.create({
            data: {
              contentType: item.metadata.contentType,
              contentHash: hashContent(item.content),
              embedding: embeddings[idx],
              metadata: {
                source: item.metadata.source,
                title: item.metadata.title,
                section: item.metadata.section,
                content: item.content.substring(0, 500),
                fullLength: item.content.length,
              },
            },
          })
        )

        await Promise.all(createPromises)
        created += newItems.length
      } catch (error) {
        console.error('Error in batch embedding:', error)
        errors += newItems.length
      }
    }

    return { created, skipped, errors }
  }

  /**
   * Semantic similarity search
   */
  async semanticSearch(
    query: string,
    options: {
      limit?: number
      minScore?: number
      contentType?: string[]
      source?: string[]
    } = {}
  ): Promise<
    Array<{
      id: string
      content: string
      score: number
      metadata: any
    }>
  > {
    const { limit = 10, minScore = 0.7, contentType, source } = options

    // Generate query embedding
    const { embeddings } = await this.generateEmbeddings({
      texts: [query],
      model: 'text-embedding-3-large',
    })

    const queryEmbedding = embeddings[0]

    // Build SQL query with pgvector
    let whereClause = ''
    const params: any[] = []

    if (contentType && contentType.length > 0) {
      whereClause += ' AND "contentType" = ANY($2)'
      params.push(contentType)
    }

    if (source && source.length > 0) {
      const sourceParam = contentType ? '$3' : '$2'
      whereClause += ` AND (metadata->>'source') = ANY(${sourceParam})`
      params.push(source)
    }

    // Execute similarity search
    const results = await prisma.$queryRawUnsafe<
      Array<{
        id: string
        metadata: any
        contentType: string
        similarity: number
      }>
    >(
      `
      SELECT
        id,
        metadata,
        "contentType",
        1 - (embedding <=> $1::vector) as similarity
      FROM "VectorEmbedding"
      WHERE 1 = 1 ${whereClause}
      ORDER BY embedding <=> $1::vector
      LIMIT ${limit}
    `,
      `[${queryEmbedding.join(',')}]`,
      ...params
    )

    // Filter by minimum score and format results
    return results
      .filter((r) => r.similarity >= minScore)
      .map((r) => ({
        id: r.id,
        content: r.metadata.content || '',
        score: r.similarity,
        metadata: {
          contentType: r.contentType,
          source: r.metadata.source,
          title: r.metadata.title,
          section: r.metadata.section,
        },
      }))
  }

  /**
   * Delete embeddings by content type or source
   */
  async deleteEmbeddings(filter: { contentType?: string; source?: string }): Promise<number> {
    const where: any = {}

    if (filter.contentType) {
      where.contentType = filter.contentType
    }

    if (filter.source) {
      where.metadata = {
        path: ['source'],
        equals: filter.source,
      }
    }

    const result = await prisma.vectorEmbedding.deleteMany({ where })
    return result.count
  }

  /**
   * Get embedding statistics
   */
  async getStatistics(): Promise<{
    total: number
    byContentType: Record<string, number>
    bySource: Record<string, number>
    avgDimensions: number
  }> {
    const total = await prisma.vectorEmbedding.count()

    const byContentType = await prisma.vectorEmbedding.groupBy({
      by: ['contentType'],
      _count: true,
    })

    // Get unique sources from metadata
    const allEmbeddings = await prisma.vectorEmbedding.findMany({
      select: { metadata: true },
    })

    const bySource: Record<string, number> = {}
    for (const embedding of allEmbeddings) {
      const source = (embedding.metadata as any)?.source || 'unknown'
      bySource[source] = (bySource[source] || 0) + 1
    }

    return {
      total,
      byContentType: Object.fromEntries(byContentType.map((item) => [item.contentType, item._count])),
      bySource,
      avgDimensions: AI_CONFIG.rag.embeddingDimensions,
    }
  }

  /**
   * Reindex all embeddings (for model updates)
   */
  async reindexEmbeddings(
    filter?: { contentType?: string; source?: string },
    newModel: 'text-embedding-3-small' | 'text-embedding-3-large' = 'text-embedding-3-large'
  ): Promise<{ updated: number; errors: number }> {
    // Get embeddings to reindex
    const where: any = {}
    if (filter?.contentType) where.contentType = filter.contentType
    if (filter?.source) {
      where.metadata = {
        path: ['source'],
        equals: filter.source,
      }
    }

    const embeddings = await prisma.vectorEmbedding.findMany({ where })

    let updated = 0
    let errors = 0

    // Process in batches
    const batchSize = 50
    for (let i = 0; i < embeddings.length; i += batchSize) {
      const batch = embeddings.slice(i, i + batchSize)

      try {
        // Extract content from metadata
        const texts = batch.map((e) => (e.metadata as any)?.content || '')

        // Generate new embeddings
        const { embeddings: newEmbeddings } = await this.generateEmbeddings({
          texts,
          model: newModel,
        })

        // Update embeddings
        const updatePromises = batch.map((embedding, idx) =>
          prisma.vectorEmbedding.update({
            where: { id: embedding.id },
            data: { embedding: newEmbeddings[idx] },
          })
        )

        await Promise.all(updatePromises)
        updated += batch.length
      } catch (error) {
        console.error('Error reindexing batch:', error)
        errors += batch.length
      }
    }

    return { updated, errors }
  }
}

export const embeddingService = new EmbeddingService()
