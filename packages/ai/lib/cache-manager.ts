/**
 * Cache Manager
 * 
 * Implements caching strategies for agent responses and tool results
 * Reduces latency and costs through intelligent caching
 */

import { createHash } from 'crypto'

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
  private client: any // Redis client

  constructor(redisUrl?: string) {
    // In production, initialize Redis client
    // For now, this is a placeholder
    console.warn('Redis cache storage not yet implemented, using in-memory fallback')
  }

  async get<T>(key: string): Promise<T | null> {
    // TODO: Implement Redis get
    return null
  }

  async set<T>(key: string, value: T, ttl: number): Promise<void> {
    // TODO: Implement Redis set with TTL
  }

  async delete(key: string): Promise<void> {
    // TODO: Implement Redis delete
  }

  async clear(): Promise<void> {
    // TODO: Implement Redis clear
  }

  async keys(): Promise<string[]> {
    // TODO: Implement Redis keys
    return []
  }
}

/**
 * Cache Manager Class
 */
export class CacheManager {
  private storage: CacheStorage
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
    await this.set(key, response, ttl)
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
    return await this.get(key)
  }

  /**
   * Check if query is similar to cached queries (fuzzy matching)
   */
  async findSimilarResponse(
    agentType: string,
    query: string,
    similarityThreshold: number = 0.9
  ): Promise<string | null> {
    // TODO: Implement semantic similarity search
    // For now, just do exact match
    return null
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
