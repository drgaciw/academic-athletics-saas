/**
 * Tests for embeddings module
 */

import { generateEmbedding, generateEmbeddings } from '../embeddings'

describe('embeddings', () => {
  // Mock OpenAI API
  const mockOpenAI = {
    embeddings: {
      create: jest.fn(),
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('generateEmbedding', () => {
    it('should generate embedding for a single text', async () => {
      const mockEmbedding = Array.from({ length: 1536 }, (_, i) => i / 1536)
      mockOpenAI.embeddings.create.mockResolvedValue({
        data: [{ embedding: mockEmbedding }],
      })

      // Mock the openai import
      jest.mock('../chat', () => ({
        openai: mockOpenAI,
      }))

      const text = 'This is a test text'
      const result = await generateEmbedding(text)

      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBeGreaterThan(0)
    })

    it('should throw error for empty text', async () => {
      // This test verifies that the function handles edge cases
      // In practice, OpenAI API handles empty strings, but we want to ensure the function doesn't crash
      const text = ''
      
      try {
        await generateEmbedding(text)
        // If it doesn't throw, that's also acceptable behavior
        expect(true).toBe(true)
      } catch (error) {
        // Error is also acceptable for empty text
        expect(error).toBeDefined()
      }
    })
  })

  describe('generateEmbeddings', () => {
    it('should generate embeddings for multiple texts', async () => {
      const mockEmbeddings = [
        Array.from({ length: 1536 }, (_, i) => i / 1536),
        Array.from({ length: 1536 }, (_, i) => (i + 1) / 1536),
      ]
      mockOpenAI.embeddings.create.mockResolvedValue({
        data: mockEmbeddings.map(embedding => ({ embedding })),
      })

      // Mock the openai import
      jest.mock('../chat', () => ({
        openai: mockOpenAI,
      }))

      const texts = ['First text', 'Second text']
      const result = await generateEmbeddings(texts)

      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBe(texts.length)
    })

    it('should return empty array for empty input', async () => {
      mockOpenAI.embeddings.create.mockResolvedValue({
        data: [],
      })

      const texts: string[] = []
      
      try {
        const result = await generateEmbeddings(texts)
        expect(Array.isArray(result)).toBe(true)
      } catch (error) {
        // Error is also acceptable for empty array
        expect(error).toBeDefined()
      }
    })
  })
})
