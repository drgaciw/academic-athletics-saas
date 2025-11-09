/**
 * Caching Strategies (Task 12.1)
 *
 * Implements response caching, embedding caching, and database query result caching
 * with TTL, LRU eviction, and cache invalidation strategies.
 */

import crypto from 'crypto';

/**
 * Cache entry with TTL
 */
interface CacheEntry<T> {
  value: T;
  timestamp: number;
  size: number; // Size in bytes
  accessCount: number;
  lastAccessed: number;
}

/**
 * Cache statistics
 */
export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  size: number;
  maxSize: number;
  entries: number;
  evictions: number;
  memoryUsage: number; // Bytes
  avgAccessTime: number; // Milliseconds
}

/**
 * LRU Cache with TTL support
 */
export class LRUCache<T = any> {
  private cache = new Map<string, CacheEntry<T>>();
  private maxSize: number;
  private ttl: number; // Time to live in milliseconds
  private hits = 0;
  private misses = 0;
  private evictions = 0;
  private accessTimes: number[] = [];

  constructor(options: { maxSize?: number; ttl?: number } = {}) {
    this.maxSize = options.maxSize ?? 100;
    this.ttl = options.ttl ?? 3600000; // Default 1 hour
  }

  /**
   * Get value from cache
   */
  get(key: string): T | undefined {
    const startTime = Date.now();
    const entry = this.cache.get(key);

    if (!entry) {
      this.misses++;
      this.recordAccessTime(Date.now() - startTime);
      return undefined;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      this.misses++;
      this.recordAccessTime(Date.now() - startTime);
      return undefined;
    }

    // Update access metadata
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    this.hits++;
    this.recordAccessTime(Date.now() - startTime);

    return entry.value;
  }

  /**
   * Set value in cache
   */
  set(key: string, value: T): void {
    // Evict if at capacity
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLRU();
    }

    const size = this.estimateSize(value);

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      size,
      accessCount: 0,
      lastAccessed: Date.now(),
    });
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete entry from cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
    this.evictions = 0;
    this.accessTimes = [];
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    let oldestKey: string | undefined;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.evictions++;
    }
  }

  /**
   * Estimate size of value in bytes
   */
  private estimateSize(value: any): number {
    if (typeof value === 'string') {
      return value.length * 2; // 2 bytes per char in UTF-16
    }
    if (typeof value === 'number') {
      return 8; // 64-bit number
    }
    if (typeof value === 'boolean') {
      return 4;
    }
    if (Array.isArray(value)) {
      return JSON.stringify(value).length * 2;
    }
    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value).length * 2;
    }
    return 0;
  }

  /**
   * Record access time for statistics
   */
  private recordAccessTime(time: number): void {
    this.accessTimes.push(time);
    // Keep only last 1000 access times
    if (this.accessTimes.length > 1000) {
      this.accessTimes.shift();
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const totalRequests = this.hits + this.misses;
    const hitRate = totalRequests > 0 ? this.hits / totalRequests : 0;

    let totalMemory = 0;
    for (const entry of this.cache.values()) {
      totalMemory += entry.size;
    }

    const avgAccessTime =
      this.accessTimes.length > 0
        ? this.accessTimes.reduce((a, b) => a + b, 0) / this.accessTimes.length
        : 0;

    return {
      hits: this.hits,
      misses: this.misses,
      hitRate,
      size: this.cache.size,
      maxSize: this.maxSize,
      entries: this.cache.size,
      evictions: this.evictions,
      memoryUsage: totalMemory,
      avgAccessTime,
    };
  }

  /**
   * Get all keys
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Remove expired entries
   */
  removeExpired(): number {
    const now = Date.now();
    let removed = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.ttl) {
        this.cache.delete(key);
        removed++;
      }
    }

    return removed;
  }
}

/**
 * Response cache for AI model outputs
 * Uses content-based hashing for cache keys
 */
export class ResponseCache {
  private cache: LRUCache<any>;

  constructor(options: { maxSize?: number; ttl?: number } = {}) {
    this.cache = new LRUCache({
      maxSize: options.maxSize ?? 500,
      ttl: options.ttl ?? 7200000, // Default 2 hours
    });
  }

  /**
   * Generate cache key from input and model config
   */
  private generateKey(input: any, modelConfig: any): string {
    const data = JSON.stringify({ input, modelConfig });
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Get cached response
   */
  get(input: any, modelConfig: any): any | undefined {
    const key = this.generateKey(input, modelConfig);
    return this.cache.get(key);
  }

  /**
   * Cache response
   */
  set(input: any, modelConfig: any, response: any): void {
    const key = this.generateKey(input, modelConfig);
    this.cache.set(key, response);
  }

  /**
   * Check if response is cached
   */
  has(input: any, modelConfig: any): boolean {
    const key = this.generateKey(input, modelConfig);
    return this.cache.has(key);
  }

  /**
   * Clear cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return this.cache.getStats();
  }

  /**
   * Remove expired entries
   */
  removeExpired(): number {
    return this.cache.removeExpired();
  }
}

/**
 * Embedding cache for semantic similarity scoring
 * Optimized for vector storage
 */
export class EmbeddingCache {
  private cache: LRUCache<number[]>;

  constructor(options: { maxSize?: number; ttl?: number } = {}) {
    this.cache = new LRUCache({
      maxSize: options.maxSize ?? 1000,
      ttl: options.ttl ?? 86400000, // Default 24 hours (embeddings are expensive)
    });
  }

  /**
   * Generate cache key from text
   */
  private generateKey(text: string): string {
    return crypto.createHash('sha256').update(text).digest('hex');
  }

  /**
   * Get cached embedding
   */
  get(text: string): number[] | undefined {
    const key = this.generateKey(text);
    return this.cache.get(key);
  }

  /**
   * Cache embedding
   */
  set(text: string, embedding: number[]): void {
    const key = this.generateKey(text);
    this.cache.set(key, embedding);
  }

  /**
   * Check if embedding is cached
   */
  has(text: string): boolean {
    const key = this.generateKey(text);
    return this.cache.has(key);
  }

  /**
   * Batch get embeddings
   */
  batchGet(texts: string[]): Map<string, number[] | undefined> {
    const results = new Map<string, number[] | undefined>();
    for (const text of texts) {
      results.set(text, this.get(text));
    }
    return results;
  }

  /**
   * Batch set embeddings
   */
  batchSet(embeddings: Map<string, number[]>): void {
    for (const [text, embedding] of embeddings.entries()) {
      this.set(text, embedding);
    }
  }

  /**
   * Clear cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return this.cache.getStats();
  }

  /**
   * Remove expired entries
   */
  removeExpired(): number {
    return this.cache.removeExpired();
  }
}

/**
 * Database query result cache
 */
export class QueryCache {
  private cache: LRUCache<any>;

  constructor(options: { maxSize?: number; ttl?: number } = {}) {
    this.cache = new LRUCache({
      maxSize: options.maxSize ?? 200,
      ttl: options.ttl ?? 300000, // Default 5 minutes
    });
  }

  /**
   * Generate cache key from query and params
   */
  private generateKey(query: string, params?: any): string {
    const data = JSON.stringify({ query, params });
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Get cached query result
   */
  get(query: string, params?: any): any | undefined {
    const key = this.generateKey(query, params);
    return this.cache.get(key);
  }

  /**
   * Cache query result
   */
  set(query: string, params: any | undefined, result: any): void {
    const key = this.generateKey(query, params);
    this.cache.set(key, result);
  }

  /**
   * Check if query result is cached
   */
  has(query: string, params?: any): boolean {
    const key = this.generateKey(query, params);
    return this.cache.has(key);
  }

  /**
   * Invalidate cache entries matching pattern
   */
  invalidate(pattern: RegExp | string): number {
    let invalidated = 0;
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        invalidated++;
      }
    }

    return invalidated;
  }

  /**
   * Clear cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return this.cache.getStats();
  }

  /**
   * Remove expired entries
   */
  removeExpired(): number {
    return this.cache.removeExpired();
  }
}

/**
 * Cache invalidation strategies
 */
export class CacheInvalidator {
  private caches: Map<string, LRUCache<any>> = new Map();

  /**
   * Register cache for invalidation
   */
  register(name: string, cache: LRUCache<any>): void {
    this.caches.set(name, cache);
  }

  /**
   * Invalidate all caches
   */
  invalidateAll(): void {
    for (const cache of this.caches.values()) {
      cache.clear();
    }
  }

  /**
   * Invalidate specific cache
   */
  invalidate(name: string): boolean {
    const cache = this.caches.get(name);
    if (cache) {
      cache.clear();
      return true;
    }
    return false;
  }

  /**
   * Remove expired entries from all caches
   */
  removeExpired(): Map<string, number> {
    const results = new Map<string, number>();
    for (const [name, cache] of this.caches.entries()) {
      results.set(name, cache.removeExpired());
    }
    return results;
  }

  /**
   * Get statistics for all caches
   */
  getStats(): Map<string, CacheStats> {
    const stats = new Map<string, CacheStats>();
    for (const [name, cache] of this.caches.entries()) {
      stats.set(name, cache.getStats());
    }
    return stats;
  }

  /**
   * Schedule periodic cleanup
   */
  scheduleCleanup(intervalMs: number = 300000): NodeJS.Timeout {
    return setInterval(() => {
      this.removeExpired();
    }, intervalMs);
  }
}

/**
 * Global cache manager
 */
export class CacheManager {
  private static instance: CacheManager;

  public responseCache: ResponseCache;
  public embeddingCache: EmbeddingCache;
  public queryCache: QueryCache;
  private invalidator: CacheInvalidator;
  private cleanupInterval?: NodeJS.Timeout;

  private constructor() {
    this.responseCache = new ResponseCache();
    this.embeddingCache = new EmbeddingCache();
    this.queryCache = new QueryCache();
    this.invalidator = new CacheInvalidator();

    // Register caches for management
    this.invalidator.register('response', (this.responseCache as any).cache);
    this.invalidator.register('embedding', (this.embeddingCache as any).cache);
    this.invalidator.register('query', (this.queryCache as any).cache);
  }

  /**
   * Get singleton instance
   */
  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  /**
   * Clear all caches
   */
  clearAll(): void {
    this.invalidator.invalidateAll();
  }

  /**
   * Get statistics for all caches
   */
  getAllStats(): {
    response: CacheStats;
    embedding: CacheStats;
    query: CacheStats;
  } {
    return {
      response: this.responseCache.getStats(),
      embedding: this.embeddingCache.getStats(),
      query: this.queryCache.getStats(),
    };
  }

  /**
   * Start automatic cleanup
   */
  startCleanup(intervalMs: number = 300000): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.cleanupInterval = this.invalidator.scheduleCleanup(intervalMs);
  }

  /**
   * Stop automatic cleanup
   */
  stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
    }
  }
}

/**
 * Export singleton instance
 */
export const cacheManager = CacheManager.getInstance();
