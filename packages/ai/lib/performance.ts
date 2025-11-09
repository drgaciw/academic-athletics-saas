/**
 * Performance Optimization Utilities
 * 
 * Implements performance patterns from Claude Cookbooks:
 * - Response caching
 * - Prompt caching (Claude-specific)
 * - Parallel tool execution
 * - Streaming optimization
 */

// Use Web Crypto API for browser compatibility
function createHash(algorithm: string) {
  return {
    update(data: string) {
      return {
        digest(encoding: string) {
          // Simple hash for cache keys (not cryptographically secure)
          let hash = 0
          for (let i = 0; i < data.length; i++) {
            const char = data.charCodeAt(i)
            hash = ((hash << 5) - hash) + char
            hash = hash & hash
          }
          return Math.abs(hash).toString(16)
        }
      }
    }
  }
}

/**
 * Cache interface
 */
export interface Cache {
  get(key: string): Promise<any | null>
  set(key: string, value: any, ttl?: number): Promise<void>
  delete(key: string): Promise<void>
  clear(): Promise<void>
}

/**
 * In-memory cache implementation
 */
export class MemoryCache implements Cache {
  private cache: Map<string, { value: any; expiresAt: number }> = new Map()

  async get(key: string): Promise<any | null> {
    const entry = this.cache.get(key)
    if (!entry) return null

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }

    return entry.value
  }

  async set(key: string, value: any, ttl: number = 3600000): Promise<void> {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttl,
    })
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key)
  }

  async clear(): Promise<void> {
    this.cache.clear()
  }
}

/**
 * Global cache instance
 */
export const globalCache = new MemoryCache()

/**
 * Generate cache key from request
 */
export function generateCacheKey(
  agentType: string,
  message: string,
  context?: Record<string, any>
): string {
  const data = JSON.stringify({ agentType, message, context })
  return createHash('sha256').update(data).digest('hex')
}

/**
 * Cached agent execution wrapper
 */
export function withCache<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: {
    cache?: Cache
    ttl?: number
    keyGenerator?: (...args: any[]) => string
  } = {}
): T {
  const cache = options.cache || globalCache
  const ttl = options.ttl || 3600000 // 1 hour default

  return (async (...args: any[]) => {
    // Generate cache key
    const key = options.keyGenerator
      ? options.keyGenerator(...args)
      : generateCacheKey(args[0]?.agentType || 'unknown', args[0]?.message || '', args[0]?.context)

    // Check cache
    const cached = await cache.get(key)
    if (cached) {
      return { ...cached, fromCache: true }
    }

    // Execute function
    const result = await fn(...args)

    // Cache result
    await cache.set(key, result, ttl)

    return result
  }) as T
}

/**
 * Prompt caching for Claude (Anthropic-specific)
 * 
 * Claude supports caching of system prompts and context
 * to reduce latency and costs for repeated requests
 */
export function createCachedPrompt(config: {
  systemPrompt: string
  context?: string
  cacheControl?: 'ephemeral'
}): any[] {
  const messages: any[] = []

  // System prompt with cache control
  messages.push({
    role: 'system',
    content: [
      {
        type: 'text',
        text: config.systemPrompt,
        cache_control: { type: config.cacheControl || 'ephemeral' },
      },
    ],
  })

  // Context with cache control
  if (config.context) {
    messages.push({
      role: 'system',
      content: [
        {
          type: 'text',
          text: config.context,
          cache_control: { type: config.cacheControl || 'ephemeral' },
        },
      ],
    })
  }

  return messages
}

/**
 * Parallel tool execution
 * 
 * Execute multiple independent tools in parallel
 */
export async function executeToolsInParallel<T>(
  tools: Array<() => Promise<T>>
): Promise<T[]> {
  return Promise.all(tools.map((tool) => tool()))
}

/**
 * Batch similar requests
 */
export class RequestBatcher<T, R> {
  private queue: Array<{
    request: T
    resolve: (result: R) => void
    reject: (error: Error) => void
  }> = []
  private timer: ReturnType<typeof setTimeout> | null = null
  private processing = false

  constructor(
    private batchFn: (requests: T[]) => Promise<R[]>,
    private options: {
      maxBatchSize?: number
      maxWaitMs?: number
    } = {}
  ) {}

  async add(request: T): Promise<R> {
    return new Promise<R>((resolve, reject) => {
      this.queue.push({ request, resolve, reject })

      // Process immediately if batch is full
      if (this.queue.length >= (this.options.maxBatchSize || 10)) {
        this.processBatch()
      } else if (!this.timer) {
        // Otherwise, wait for more requests
        this.timer = setTimeout(() => {
          this.processBatch()
        }, this.options.maxWaitMs || 100)
      }
    })
  }

  private async processBatch(): Promise<void> {
    if (this.processing || this.queue.length === 0) return

    this.processing = true
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }

    const batch = this.queue.splice(0, this.options.maxBatchSize || 10)

    try {
      const results = await this.batchFn(batch.map((item) => item.request))

      batch.forEach((item, index) => {
        item.resolve(results[index])
      })
    } catch (error) {
      batch.forEach((item) => {
        item.reject(error as Error)
      })
    } finally {
      this.processing = false

      // Process next batch if queue has items
      if (this.queue.length > 0) {
        this.processBatch()
      }
    }
  }
}

/**
 * Streaming optimization
 * 
 * Buffer and batch streaming chunks for better performance
 */
export class StreamBuffer {
  private buffer: string[] = []
  private timer: ReturnType<typeof setTimeout> | null = null

  constructor(
    private onFlush: (text: string) => void,
    private options: {
      maxBufferSize?: number
      flushIntervalMs?: number
    } = {}
  ) {}

  add(chunk: string): void {
    this.buffer.push(chunk)

    // Flush if buffer is full
    if (this.buffer.length >= (this.options.maxBufferSize || 10)) {
      this.flush()
    } else if (!this.timer) {
      // Otherwise, schedule flush
      this.timer = setTimeout(() => {
        this.flush()
      }, this.options.flushIntervalMs || 50)
    }
  }

  flush(): void {
    if (this.buffer.length === 0) return

    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }

    const text = this.buffer.join('')
    this.buffer = []
    this.onFlush(text)
  }

  destroy(): void {
    this.flush()
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }
  }
}

/**
 * Token usage optimization
 * 
 * Estimate and optimize token usage
 */
export function optimizePrompt(prompt: string, maxTokens: number): string {
  const estimatedTokens = Math.ceil(prompt.length / 4)

  if (estimatedTokens <= maxTokens) {
    return prompt
  }

  // Truncate to fit within token limit
  const targetLength = maxTokens * 4
  const truncated = prompt.substring(0, targetLength - 100) // Leave buffer

  return truncated + '\n\n[Content truncated to fit token limit]'
}

/**
 * Selective tool loading
 * 
 * Load only relevant tools based on query
 */
export async function selectRelevantTools(
  query: string,
  availableTools: Array<{ name: string; description: string }>,
  maxTools: number = 10
): Promise<string[]> {
  // Simple keyword matching (can be enhanced with embeddings)
  const queryLower = query.toLowerCase()
  const keywords = queryLower.split(/\s+/)

  const scored = availableTools.map((tool) => {
    const descLower = tool.description.toLowerCase()
    let score = 0

    // Score based on keyword matches
    for (const keyword of keywords) {
      if (descLower.includes(keyword)) {
        score += 1
      }
      if (tool.name.toLowerCase().includes(keyword)) {
        score += 2 // Name matches are more important
      }
    }

    return { name: tool.name, score }
  })

  // Sort by score and return top N
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, maxTools)
    .map((t) => t.name)
}

/**
 * Measure execution time
 */
export async function measureTime<T>(
  fn: () => Promise<T>,
  label?: string
): Promise<{ result: T; duration: number }> {
  const start = Date.now()
  const result = await fn()
  const duration = Date.now() - start

  if (label) {
    console.log(`${label}: ${duration}ms`)
  }

  return { result, duration }
}
