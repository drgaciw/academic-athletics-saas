
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ResponseCache } from '../cache-manager'

// Mock the embeddings module
vi.mock('../embeddings', () => ({
  generateEmbedding: vi.fn().mockImplementation(async (text: string) => {
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
    vi.clearAllMocks()
  })

  it('should find similar response', async () => {
    const query = 'What is the weather?'
    const similarQuery = 'Tell me the weather' // Same length 19 chars? No.
    // 'What is the weather?' length 20.
    // 'Tell me the weather' length 19.

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
})
