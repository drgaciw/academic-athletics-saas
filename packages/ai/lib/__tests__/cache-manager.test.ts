
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Redis } from 'ioredis'
import { RedisCacheStorage, InMemoryCacheStorage, CacheManager } from '../cache-manager'

// Mock ioredis
const mockRedisInstance = {
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
  flushdb: vi.fn(),
  keys: vi.fn(),
  disconnect: vi.fn(),
}

vi.mock('ioredis', () => {
  return {
    Redis: class {
      constructor(url: string) {}
      get = mockRedisInstance.get
      set = mockRedisInstance.set
      del = mockRedisInstance.del
      flushdb = mockRedisInstance.flushdb
      keys = mockRedisInstance.keys
      disconnect = mockRedisInstance.disconnect
    }
  }
})

describe('RedisCacheStorage', () => {
  let redisStorage: RedisCacheStorage

  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks()

    // Create new instance
    redisStorage = new RedisCacheStorage('redis://localhost:6379')
  })

  // We can't easily check constructor arguments with this class mock approach directly on the class
  // unless we spy on it or use a different mock strategy.
  // But we can verify the instance methods are called.

  it('should get a value', async () => {
    const key = 'test-key'
    const value = { data: 'test-value' }

    // Mock redis get response
    mockRedisInstance.get.mockResolvedValue(JSON.stringify(value))

    const result = await redisStorage.get<typeof value>(key)

    expect(mockRedisInstance.get).toHaveBeenCalledWith(key)
    expect(result).toEqual(value)
  })

  it('should return null if key not found', async () => {
    const key = 'missing-key'

    mockRedisInstance.get.mockResolvedValue(null)

    const result = await redisStorage.get(key)

    expect(mockRedisInstance.get).toHaveBeenCalledWith(key)
    expect(result).toBeNull()
  })

  it('should set a value', async () => {
    const key = 'test-key'
    const value = { data: 'test-value' }
    const ttl = 1000

    await redisStorage.set(key, value, ttl)

    expect(mockRedisInstance.set).toHaveBeenCalledWith(key, JSON.stringify(value), 'PX', ttl)
  })

  it('should delete a value', async () => {
    const key = 'test-key'

    await redisStorage.delete(key)

    expect(mockRedisInstance.del).toHaveBeenCalledWith(key)
  })

  it('should clear all values', async () => {
    await redisStorage.clear()

    expect(mockRedisInstance.flushdb).toHaveBeenCalled()
  })
})
