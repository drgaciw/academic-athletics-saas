/**
 * Cache Manager
 * 
 * Implements caching strategies for agent responses and tool results
 * Reduces latency and costs through intelligent caching
 */

import { createHash } from 'crypto'
import { Redis } from '@upstash/redis'
import { generateEmbedding } from './embeddings'

/**
 * Cache entry
 */
export interface CacheEntry<T> {
  key: string
  value: T
  timestamp: number
  ttl: number
  hits: number
  size: number
}

/**
 * Cache statistics
 */
export interface CacheStats {
  hits: number
  misses: number
  hitRate: number
  totalEntries: number
  totalSize: number
  evictions: number
}

/**
 * Cache storage interface
 */
export interface CacheStorage {
  get<T>(key: string): Promise<T | null>
  set<T>(key: string, value: T, ttl: number): Promise<void>
  delete(key: string): Promise<void>
  clear(): Promise<void>
  keys(): Promise<string[]>
  entries<T>(prefix?: string): Promise<[string, T][]>
}

/**
 * In-memory cache storage with LRU eviction
 */
export class InMemoryCacheStorage implements CacheStorage {
  private cache: Map<string, CacheEntry<any>> = new Map()
  private maxSize: number
  private maxEntries: number

  constructor(maxSize: number = 100 * 1024 * 1024, maxEntries: number = 1000) {
    this.maxSize = maxSize // 100MB default
    this.maxEntries = maxEntries
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key)

    if (!entry) return null

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    // Update hits and move to end (LRU)
    entry.hits++
    this.cache.delete(key)
    this.cache.set(key, entry)

    return entry.value as T
  }

  async set<T>(key: string, value: T, ttl: number): Promise<void> {
    const size = this.estimateSize(value)

    // Evict if necessary
    await this.evictIfNeeded(size)

    const entry: CacheEntry<T> = {
      key,
      value,
      timestamp: Date.now(),
      ttl,
      hits: 0,
      size,
    }

    this.cache.set(key, entry)
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key)
  }

  async clear(): Promise<void> {
    this.cache.clear()
  }

  async keys(): Promise<string[]> {
    return Array.from(this.cache.keys())
  }

  async entries<T>(prefix?: string): Promise<[string, T][]> {
    // Return entries without modifying LRU
    const allEntries = Array.from(this.cache.entries());

    if (prefix) {
      return allEntries
        .filter(([key]) => key.startsWith(prefix))
        .map(([key, entry]) => [key, entry.value as T]);
    }

    return allEntries.map(([key, entry]) => [key, entry.value as T]);
  }

  private estimateSize(value: any): number {
    return JSON.stringify(value).length
  }

  private async evictIfNeeded(newEntrySize: number): Promise<void> {
    const currentSize = Array.from(this.cache.values()).reduce(
      (sum, entry) => sum + entry.size,
      0
    )

    // Evict by LRU if over size limit
    while (
      (currentSize + newEntrySize > this.maxSize ||
        this.cache.size >= this.maxEntries) &&
      this.cache.size > 0
    ) {
      const firstKey = this.cache.keys().next().value
      if (firstKey) {
        this.cache.delete(firstKey)
      } else {
        break
      }
    }
  }

  getTotalSize(): number {
    return Array.from(this.cache.values()).reduce(
      (sum, entry) => sum + entry.size,
      0
    )
  }
}

/**
 * Redis cache storage (for production)
 */
export class RedisCacheStorage implements CacheStorage {
  private client: Redis

  constructor(redisUrl?: string) {
    if (redisUrl) {
      this.client = new Redis({ url: redisUrl, token: process.env.KV_REST_API_TOKEN || '' })
    } else {
      this.client = Redis.fromEnv()
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      return await this.client.get<T>(key)
    } catch (error) {
      console.error('Redis get error:', error)
      return null
    }
  }

  async set<T>(key: string, value: T, ttl: number): Promise<void> {
    try {
      await this.client.set(key, value, { px: ttl })
    } catch (error) {
      console.error('Redis set error:', error)
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.client.del(key)
    } catch (error) {
      console.error('Redis delete error:', error)
    }
  }

  async clear(): Promise<void> {
    try {
      await this.client.flushdb()
    } catch (error) {
      console.error('Redis clear error:', error)
    }
  }

  async keys(): Promise<string[]> {
    try {
      const keys: string[] = []
      let cursor = 0

      do {
        const [nextCursor, batchKeys] = await this.client.scan(cursor, { count: 100 })
        cursor = Number(nextCursor)
        keys.push(...batchKeys)
      } while (cursor !== 0)

      return keys
    } catch (error) {
      console.error('Redis keys error:', error)
      return []
    }
  }

  async entries<T>(prefix?: string): Promise<[string, T][]> {
    try {
      const keys: string[] = []
      let cursor = 0
      const match = prefix ? `${prefix}*` : '*'

      do {
        const [nextCursor, batchKeys] = await this.client.scan(cursor, { match, count: 100 })
        cursor = Number(nextCursor)
        keys.push(...batchKeys)
      } while (cursor !== 0)

      if (keys.length === 0) return []

      // Fetch in batches to avoid huge payloads
      const result: [string, T][] = []
      const batchSize = 100

      for (let i = 0; i < keys.length; i += batchSize) {
        const batchKeys = keys.slice(i, i + batchSize)
        if (batchKeys.length === 0) continue

        const values = await this.client.mget<T[]>(...batchKeys)

        for (let j = 0; j < batchKeys.length; j++) {
          if (values[j] !== null) {
            result.push([batchKeys[j], values[j]])
          }
        }
      }

      return result
    } catch (error) {
      console.error('Redis entries error:', error)
      return []
    }
  }
}

/**
 * Cache Manager Class
 */
export class CacheManager {
  protected storage: CacheStorage
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    hitRate: 0,
    totalEntries: 0,
    totalSize: 0,
    evictions: 0,
  }

  constructor(storage?: CacheStorage) {
    this.storage = storage || new InMemoryCacheStorage()
  }

  /**
   * Generate cache key from parameters
   */
  generateKey(prefix: string, params: Record<string, any>): string {
    const normalized = JSON.stringify(params, Object.keys(params).sort())
    const hash = createHash('sha256').update(normalized).digest('hex').substring(0, 16)
    return `${prefix}:${hash}`
  }

  /**
   * Get cached value
   */
  async get<T>(key: string): Promise<T | null> {
    const value = await this.storage.get<T>(key)

    if (value !== null) {
      this.stats.hits++
    } else {
      this.stats.misses++
    }

    this.updateHitRate()

    return value
  }

  /**
   * Set cached value
   */
  async set<T>(key: string, value: T, ttl: number = 300000): Promise<void> {
    await this.storage.set(key, value, ttl)
    this.stats.totalEntries++
  }

  /**
   * Get or compute value
   */
  async getOrCompute<T>(
    key: string,
    compute: () => Promise<T>,
    ttl: number = 300000
  ): Promise<T> {
    const cached = await this.get<T>(key)

    if (cached !== null) {
      return cached
    }

    const value = await compute()
    await this.set(key, value, ttl)

    return value
  }

  /**
   * Delete cached value
   */
  async delete(key: string): Promise<void> {
    await this.storage.delete(key)
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    await this.storage.clear()
    this.resetStats()
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats }
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      hitRate: 0,
      totalEntries: 0,
      totalSize: 0,
      evictions: 0,
    }
  }

  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0
  }
}

/**
 * Tool Result Cache
 * 
 * Specialized cache for tool execution results
 */
export class ToolResultCache extends CacheManager {
  /**
   * Cache tool result
   */
  async cacheToolResult(
    toolName: string,
    params: Record<string, any>,
    result: any,
    ttl: number = 300000 // 5 minutes default
  ): Promise<void> {
    const key = this.generateKey(`tool:${toolName}`, params)
    await this.set(key, result, ttl)
  }

  /**
   * Get cached tool result
   */
  async getCachedToolResult(
    toolName: string,
    params: Record<string, any>
  ): Promise<any | null> {
    const key = this.generateKey(`tool:${toolName}`, params)
    return await this.get(key)
  }

  /**
   * Execute tool with caching
   */
  async executeWithCache<T>(
    toolName: string,
    params: Record<string, any>,
    execute: () => Promise<T>,
    ttl: number = 300000
  ): Promise<T> {
    const key = this.generateKey(`tool:${toolName}`, params)
    return await this.getOrCompute(key, execute, ttl)
  }
}

/**
 * Interface for cached response values
 */
export interface CachedResponseValue {
  response: string
  query: string
  embedding?: number[]
}

/**
 * Helper to calculate cosine similarity
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0)
  const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0))
  const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0))
  if (magA === 0 || magB === 0) return 0
  return dotProduct / (magA * magB)
}

/**
 * Response Cache
 * 
 * Specialized cache for agent responses
 */
export class ResponseCache extends CacheManager {
  /**
   * Cache agent response
   */
  async cacheResponse(
    agentType: string,
    query: string,
    context: Record<string, any>,
    response: string,
    ttl: number = 600000 // 10 minutes default
  ): Promise<void> {
    const key = this.generateKey(`response:${agentType}`, { query, context })

    let embedding: number[] | undefined
    try {
      embedding = await generateEmbedding(query)
    } catch (error) {
      console.warn('Failed to generate embedding for cache:', error)
      // Continue without embedding
    }

    const value: CachedResponseValue = {
      response,
      query,
      embedding
    }

    await this.set(key, value, ttl)
  }

  /**
   * Get cached response
   */
  async getCachedResponse(
    agentType: string,
    query: string,
    context: Record<string, any>
  ): Promise<string | null> {
    const key = this.generateKey(`response:${agentType}`, { query, context })
    const value = await this.get<CachedResponseValue | string>(key)

    if (!value) return null

    if (typeof value === 'string') {
      return value
    }

    return value.response
  }

  /**
   * Check if query is similar to cached queries (fuzzy matching)
   */
  async findSimilarResponse(
    agentType: string,
    query: string,
    similarityThreshold: number = 0.9
  ): Promise<string | null> {
    let queryEmbedding: number[]
    try {
      queryEmbedding = await generateEmbedding(query)
    } catch (error) {
      console.warn('Failed to generate embedding for search:', error)
      return null
    }

    const prefix = `response:${agentType}`

    // Get entries with matching prefix to search
    // WARNING: This iterates all keys matching the prefix.
    // This linear scan (O(N)) is not scalable for production use with large datasets.
    // Ideally, a vector database or Redis Vector Search should be used.
    // This implementation is a fallback for small-scale or development environments.
    const entries = await this.storage.entries<CachedResponseValue | string>(prefix)

    let bestMatch: { response: string; score: number } | null = null

    for (const [key, value] of entries) {
      // Keys are already filtered by prefix if the storage supports it
      // But double check just in case
      if (!key.startsWith(prefix)) continue

      if (typeof value === 'string' || !value.embedding) continue

      const score = cosineSimilarity(queryEmbedding, value.embedding)

      if (score >= similarityThreshold) {
        if (!bestMatch || score > bestMatch.score) {
          bestMatch = { response: value.response, score }
        }
      }
    }

    return bestMatch ? bestMatch.response : null
  }
}

/**
 * Global cache instances
 */
export const globalToolCache = new ToolResultCache()
export const globalResponseCache = new ResponseCache()

/**
 * Convenience functions
 */
export async function cacheToolResult(
  toolName: string,
  params: Record<string, any>,
  result: any,
  ttl?: number
): Promise<void> {
  return globalToolCache.cacheToolResult(toolName, params, result, ttl)
}

export async function getCachedToolResult(
  toolName: string,
  params: Record<string, any>
): Promise<any | null> {
  return globalToolCache.getCachedToolResult(toolName, params)
}

export async function cacheResponse(
  agentType: string,
  query: string,
  context: Record<string, any>,
  response: string,
  ttl?: number
): Promise<void> {
  return globalResponseCache.cacheResponse(agentType, query, context, response, ttl)
}

export async function getCachedResponse(
  agentType: string,
  query: string,
  context: Record<string, any>
): Promise<string | null> {
  return globalResponseCache.getCachedResponse(agentType, query, context)
}
