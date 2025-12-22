/**
 * Agent Memory System
 *
 * Manages short-term and long-term memory for agents
 * Enables context retention and fact storage across conversations
 */

import { embed } from 'ai'
import { openai } from '@ai-sdk/openai'
import { generateText } from 'ai'
import type { CoreMessage } from 'ai'
import type { AgentMemory, MemoryType } from '../types/agent.types'

/**
 * Memory entry for storage
 */
export interface MemoryEntry {
  userId: string
  memoryType: MemoryType
  content: string
  metadata: Record<string, any>
  confidence?: number
  importance?: number
  expiresAt?: Date
}

/**
 * Memory search options
 */
export interface MemorySearchOptions {
  memoryType?: MemoryType | MemoryType[]
  limit?: number
  minImportance?: number
  minConfidence?: number
  includeExpired?: boolean
}

/**
 * Memory search result
 */
export interface MemorySearchResult extends AgentMemory {
  similarity?: number
  relevanceScore?: number
}

/**
 * Conversation summary
 */
export interface ConversationSummary {
  conversationId: string
  summary: string
  keyPoints: string[]
  facts: string[]
  sentiment: 'positive' | 'neutral' | 'negative'
  topics: string[]
  tokenCount: number
}

/**
 * Agent Memory Store Class
 */
export class AgentMemoryStore {
  /**
   * Save conversation to short-term memory
   */
  async saveConversation(
    userId: string,
    conversationId: string,
    messages: CoreMessage[]
  ): Promise<void> {
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()

    try {
      // Use existing Conversation and Message models
      await prisma.conversation.upsert({
        where: { id: conversationId },
        create: {
          id: conversationId,
          userId,
          title: this.generateTitle(messages),
          status: 'active',
        },
        update: {
          updatedAt: new Date(),
        },
      })

      // Save messages
      for (const message of messages) {
        await prisma.message.create({
          data: {
            conversationId,
            role: message.role,
            content: message.content as string,
            timestamp: new Date(),
          },
        })
      }
    } finally {
      await prisma.$disconnect()
    }
  }

  /**
   * Save fact to long-term memory with embedding
   */
  async saveFact(entry: MemoryEntry): Promise<AgentMemory> {
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()

    try {
      // Generate embedding for semantic search
      const { embedding } = await embed({
        model: openai.embedding('text-embedding-3-large'),
        value: entry.content,
      })

      // Calculate importance if not provided
      const importance = entry.importance ?? (await this.calculateImportance(entry.content))

      const memory = await prisma.agentMemory.create({
        data: {
          userId: entry.userId,
          memoryType: entry.memoryType,
          content: entry.content,
          embedding: `[${embedding.join(',')}]`, // Store as string for pgvector
          metadata: entry.metadata,
          confidence: entry.confidence ?? 1.0,
          importance,
          expiresAt: entry.expiresAt,
        },
      })

      return this.mapToAgentMemory(memory)
    } finally {
      await prisma.$disconnect()
    }
  }

  /**
   * Get relevant memories using vector search
   */
  async getRelevantMemories(
    userId: string,
    query: string,
    options: MemorySearchOptions = {}
  ): Promise<MemorySearchResult[]> {
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()

    try {
      // Generate query embedding
      const { embedding: queryEmbedding } = await embed({
        model: openai.embedding('text-embedding-3-large'),
        value: query,
      })

      const limit = options.limit ?? 5
      const minImportance = options.minImportance ?? 0.0
      const minConfidence = options.minConfidence ?? 0.0

      // Build memory type filter
      let memoryTypeFilter = ''
      if (options.memoryType) {
        const types = Array.isArray(options.memoryType)
          ? options.memoryType
          : [options.memoryType]
        memoryTypeFilter = `AND memory_type IN (${types.map((t) => `'${t}'`).join(',')})`
      }

      // Build expiration filter
      const expirationFilter = options.includeExpired
        ? ''
        : `AND (expires_at IS NULL OR expires_at > NOW())`

      // Vector similarity search using pgvector
      const results = await prisma.$queryRawUnsafe<any[]>(`
        SELECT 
          id,
          user_id,
          memory_type,
          content,
          metadata,
          confidence,
          importance,
          access_count,
          last_accessed,
          expires_at,
          created_at,
          updated_at,
          1 - (embedding <=> '[${queryEmbedding.join(',')}]'::vector) as similarity
        FROM agent_memory
        WHERE user_id = '${userId}'
          ${memoryTypeFilter}
          ${expirationFilter}
          AND importance >= ${minImportance}
          AND confidence >= ${minConfidence}
        ORDER BY embedding <=> '[${queryEmbedding.join(',')}]'::vector
        LIMIT ${limit}
      `)

      // Update access count
      const memoryIds = results.map((r) => r.id)
      if (memoryIds.length > 0) {
        await prisma.agentMemory.updateMany({
          where: { id: { in: memoryIds } },
          data: {
            accessCount: { increment: 1 },
            lastAccessed: new Date(),
          },
        })
      }

      return results.map((r) => ({
        id: r.id,
        userId: r.user_id,
        memoryType: r.memory_type,
        content: r.content,
        embedding: undefined, // Don't return embedding
        metadata: r.metadata,
        confidence: r.confidence,
        importance: r.importance,
        expiresAt: r.expires_at,
        createdAt: r.created_at,
        similarity: r.similarity,
        relevanceScore: r.similarity * r.importance * r.confidence,
      }))
    } finally {
      await prisma.$disconnect()
    }
  }

  /**
   * Get conversation history
   */
  async getConversationHistory(
    conversationId: string,
    limit?: number
  ): Promise<CoreMessage[]> {
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()

    try {
      const messages = await prisma.message.findMany({
        where: { conversationId },
        orderBy: { timestamp: 'asc' },
        take: limit,
      })

      return messages.map((m) => ({
        role: m.role as any,
        content: m.content,
      }))
    } finally {
      await prisma.$disconnect()
    }
  }

  /**
   * Summarize conversation
   */
  async summarizeConversation(
    conversationId: string
  ): Promise<ConversationSummary> {
    const messages = await this.getConversationHistory(conversationId)

    if (messages.length === 0) {
      throw new Error('No messages found for conversation')
    }

    // Create conversation text
    const conversationText = messages
      .map((m) => `${m.role}: ${m.content}`)
      .join('\n')

    // Generate summary using LLM
    const { text } = await generateText({
      model: openai('gpt-4o-mini'),
      prompt: `Analyze this conversation and provide:
1. A concise summary (2-3 sentences)
2. Key points discussed (bullet points)
3. Important facts mentioned (bullet points)
4. Overall sentiment (positive/neutral/negative)
5. Main topics (comma-separated)

Conversation:
${conversationText}

Format your response as JSON with keys: summary, keyPoints, facts, sentiment, topics`,
      maxTokens: 1000,
    })

    try {
      const parsed = JSON.parse(text)
      return {
        conversationId,
        summary: parsed.summary,
        keyPoints: parsed.keyPoints || [],
        facts: parsed.facts || [],
        sentiment: parsed.sentiment || 'neutral',
        topics: parsed.topics || [],
        tokenCount: this.estimateTokens(conversationText),
      }
    } catch (error) {
      // Fallback if JSON parsing fails
      return {
        conversationId,
        summary: text.substring(0, 200),
        keyPoints: [],
        facts: [],
        sentiment: 'neutral',
        topics: [],
        tokenCount: this.estimateTokens(conversationText),
      }
    }
  }

  /**
   * Extract and save facts from conversation
   */
  async extractAndSaveFacts(
    userId: string,
    conversationId: string,
    agentType: string
  ): Promise<AgentMemory[]> {
    const summary = await this.summarizeConversation(conversationId)
    const savedMemories: AgentMemory[] = []

    // Save each fact as long-term memory
    for (const fact of summary.facts) {
      if (fact.trim().length > 10) {
        const memory = await this.saveFact({
          userId,
          memoryType: 'long_term',
          content: fact,
          metadata: {
            conversationId,
            agentType,
            topics: summary.topics,
            extractedAt: new Date().toISOString(),
          },
          importance: 0.7, // Facts are moderately important
        })
        savedMemories.push(memory)
      }
    }

    return savedMemories
  }

  /**
   * Delete expired memories
   */
  async cleanupExpiredMemories(): Promise<number> {
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()

    try {
      const result = await prisma.agentMemory.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      })

      return result.count
    } finally {
      await prisma.$disconnect()
    }
  }

  /**
   * Delete low-importance memories
   */
  async cleanupLowImportanceMemories(
    threshold: number = 0.2,
    maxAge: number = 30 * 24 * 60 * 60 * 1000 // 30 days
  ): Promise<number> {
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()

    try {
      const cutoffDate = new Date(Date.now() - maxAge)

      const result = await prisma.agentMemory.deleteMany({
        where: {
          importance: { lt: threshold },
          createdAt: { lt: cutoffDate },
        },
      })

      return result.count
    } finally {
      await prisma.$disconnect()
    }
  }

  /**
   * Get memory statistics for user
   */
  async getMemoryStats(userId: string): Promise<{
    totalMemories: number
    byType: Record<MemoryType, number>
    averageImportance: number
    oldestMemory: Date | null
    newestMemory: Date | null
  }> {
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()

    try {
      const memories = await prisma.agentMemory.findMany({
        where: { userId },
        select: {
          memoryType: true,
          importance: true,
          createdAt: true,
        },
      })

      const byType: Record<MemoryType, number> = {
        short_term: 0,
        long_term: 0,
        working: 0,
      }

      let totalImportance = 0

      for (const memory of memories) {
        byType[memory.memoryType as MemoryType]++
        totalImportance += memory.importance || 0
      }

      const dates = memories.map((m) => m.createdAt).sort()

      return {
        totalMemories: memories.length,
        byType,
        averageImportance: memories.length > 0 ? totalImportance / memories.length : 0,
        oldestMemory: dates[0] || null,
        newestMemory: dates[dates.length - 1] || null,
      }
    } finally {
      await prisma.$disconnect()
    }
  }

  // Helper methods

  private generateTitle(messages: CoreMessage[]): string {
    const firstUserMessage = messages.find((m) => m.role === 'user')
    if (firstUserMessage) {
      const content = firstUserMessage.content as string
      return content.substring(0, 50) + (content.length > 50 ? '...' : '')
    }
    return 'Conversation'
  }

  private async calculateImportance(content: string): Promise<number> {
    // Simple heuristic-based importance calculation
    let score = 0.5 // Base score

    // Longer content is often more important
    if (content.length > 100) score += 0.1
    if (content.length > 200) score += 0.1

    // Contains specific keywords
    const importantKeywords = [
      'important',
      'critical',
      'remember',
      'always',
      'never',
      'must',
      'required',
      'deadline',
      'goal',
    ]

    for (const keyword of importantKeywords) {
      if (content.toLowerCase().includes(keyword)) {
        score += 0.05
      }
    }

    return Math.min(score, 1.0)
  }

  private estimateTokens(text: string): number {
    // Rough estimate: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4)
  }

  private mapToAgentMemory(dbMemory: any): AgentMemory {
    return {
      id: dbMemory.id,
      userId: dbMemory.userId,
      memoryType: dbMemory.memoryType,
      content: dbMemory.content,
      embedding: undefined, // Don't expose embedding
      metadata: dbMemory.metadata,
      expiresAt: dbMemory.expiresAt,
      createdAt: dbMemory.createdAt,
    }
  }
}

/**
 * Global memory store instance
 */
export const globalMemoryStore = new AgentMemoryStore()

/**
 * Convenience functions
 */
export async function saveConversation(
  userId: string,
  conversationId: string,
  messages: CoreMessage[]
): Promise<void> {
  return globalMemoryStore.saveConversation(userId, conversationId, messages)
}

export async function saveFact(entry: MemoryEntry): Promise<AgentMemory> {
  return globalMemoryStore.saveFact(entry)
}

export async function getRelevantMemories(
  userId: string,
  query: string,
  options?: MemorySearchOptions
): Promise<MemorySearchResult[]> {
  return globalMemoryStore.getRelevantMemories(userId, query, options)
}

export async function summarizeConversation(
  conversationId: string
): Promise<ConversationSummary> {
  return globalMemoryStore.summarizeConversation(conversationId)
}

export async function extractAndSaveFacts(
  userId: string,
  conversationId: string,
  agentType: string
): Promise<AgentMemory[]> {
  return globalMemoryStore.extractAndSaveFacts(userId, conversationId, agentType)
}
