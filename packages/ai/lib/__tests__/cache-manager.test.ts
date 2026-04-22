
import { ResponseCache } from '../cache-manager'

// Mock the embeddings module
jest.mock('../embeddings', () => ({
  generateEmbedding: jest.fn().mockImplementation(async (text: string) => {
    // Return a simple embedding based on text length for testing
    // We create a mock embedding that is somewhat deterministic but simulates similarity
    // Here we use a simple vector where the first element is significant
    // If texts are same length, they get same embedding (simplified)
    const val = text.length / 100
    return [val, 1 - val, 0.5]
  })
}))

describe('ResponseCache Semantic Search', () => {
  let responseCache: ResponseCache

  beforeEach(() => {
    responseCache = new ResponseCache()
    jest.clearAllMocks()
  })

  it('should find similar response', async () => {
    const query = 'What is the weather?'

    // Let's use exact match first to verify basic flow
    const agentType = 'weather-agent'
    const context = { userId: '1' }
    const response = 'It is sunny.'

    await responseCache.cacheResponse(agentType, query, context, response)

    // Exact match query (should have same embedding)
    const result = await responseCache.findSimilarResponse(agentType, query)
    expect(result).toBe(response)
  })

  it('should find semantically similar response', async () => {
    const agentType = 'weather-agent'
    const context = { userId: '1' }
    const response = 'It is sunny.'

    // Original query: 10 chars
    const query1 = '1234567890'
    await responseCache.cacheResponse(agentType, query1, context, response)

    // Similar query: 10 chars (same embedding in our mock)
    const query2 = '0987654321'

    const result = await responseCache.findSimilarResponse(agentType, query2)
    expect(result).toBe(response)
  })

  it('should not return dissimilar response', async () => {
    const agentType = 'weather-agent'
    const context = { userId: '1' }
    const response = 'It is sunny.'

    // Original query: 10 chars
    // Embedding: [0.1, 0.9, 0.5]
    const query1 = '1234567890'
    await responseCache.cacheResponse(agentType, query1, context, response)

    // Dissimilar query: 80 chars
    // Embedding: [0.8, 0.2, 0.5]
    // Dot product: 0.1*0.8 + 0.9*0.2 + 0.5*0.5 = 0.08 + 0.18 + 0.25 = 0.51
    // Mags: sqrt(0.01+0.81+0.25) = sqrt(1.07) ~= 1.03
    //       sqrt(0.64+0.04+0.25) = sqrt(0.93) ~= 0.96
    // Similarity ~= 0.51 / (1.03 * 0.96) ~= 0.51 / 0.99 ~= 0.51
    // Threshold is 0.9 by default.

    const query2 = 'x'.repeat(80)

    const result = await responseCache.findSimilarResponse(agentType, query2)
    expect(result).toBeNull()
  })

  it('should handle different agent types', async () => {
    const context = { userId: '1' }
    const response1 = 'Response 1'
    const query = 'query'

    await responseCache.cacheResponse('agent1', query, context, response1)

    // Search with different agent
    const result = await responseCache.findSimilarResponse('agent2', query)
    expect(result).toBeNull()
  })

  it('should handle embedding generation failure during caching gracefully', async () => {
    const { generateEmbedding } = jest.requireMock('../embeddings')
    generateEmbedding.mockRejectedValueOnce(new Error('Embedding API error'))

    const agentType = 'weather-agent'
    const context = { userId: '1' }
    const response = 'It is sunny.'
    const query = 'What is the weather?'

    // cacheResponse should not throw even if embedding fails
    await expect(
      responseCache.cacheResponse(agentType, query, context, response)
    ).resolves.not.toThrow()
  })

  it('should return null when embedding generation fails during search', async () => {
    const { generateEmbedding } = jest.requireMock('../embeddings')
    generateEmbedding.mockRejectedValueOnce(new Error('Embedding API error'))

    const result = await responseCache.findSimilarResponse('weather-agent', 'some query')
    expect(result).toBeNull()
  })

  it('should handle legacy string-only cached values', async () => {
    const agentType = 'weather-agent'
    const key = `response:${agentType}:legacykey`
    // Directly set a legacy string value in the underlying storage
    const storage = (responseCache as unknown as { storage: { set: (k: string, v: unknown, ttl: number) => Promise<void> } }).storage
    await storage.set(key, 'legacy string response', 3600000)

    const cached = await responseCache.getCachedResponse(agentType, 'any query')
    // Should not throw - exact lookup won't match but verifies no error from legacy values
    expect(cached).toBeNull()
  })

  it('should select best match when multiple similar entries exist', async () => {
    const agentType = 'search-agent'
    const context = { userId: '1' }

    // 10 chars -> embedding [0.1, 0.9, 0.5]
    await responseCache.cacheResponse(agentType, '1234567890', context, 'response-10-chars')
    // 20 chars -> embedding [0.2, 0.8, 0.5]
    await responseCache.cacheResponse(agentType, '12345678901234567890', context, 'response-20-chars')

    // Query with 10 chars should best match the 10-char entry
    const result = await responseCache.findSimilarResponse(agentType, '0987654321')
    expect(result).toBe('response-10-chars')
  })
})

