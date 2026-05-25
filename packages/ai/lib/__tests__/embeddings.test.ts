/**
 * Tests for embeddings module
 */

jest.mock('../chat', () => ({
  openai: {
    embeddings: {
      create: jest.fn(),
    },
  },
}))

import { generateEmbedding, generateEmbeddings } from '../embeddings'
import { openai } from '../chat'

const mockCreate = openai.embeddings.create as jest.Mock

describe('embeddings', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('generateEmbedding', () => {
    it('should generate embedding for a single text', async () => {
      const mockEmbedding = Array.from({ length: 1536 }, (_, i) => i / 1536)
      mockCreate.mockResolvedValue({
        data: [{ embedding: mockEmbedding }],
      })

      const text = 'This is a test text'
      const result = await generateEmbedding(text)

      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBe(1536)
      expect(mockCreate).toHaveBeenCalledWith({
        model: 'text-embedding-3-large',
        input: text,
        dimensions: 1536,
      })
    })

    it('should throw error for empty text', async () => {
      mockCreate.mockRejectedValue(new Error('Invalid input'))

      await expect(generateEmbedding('')).rejects.toThrow('Invalid input')
    })
  })

  describe('generateEmbeddings', () => {
    it('should generate embeddings for multiple texts', async () => {
      const mockEmbeddings = [
        Array.from({ length: 1536 }, (_, i) => i / 1536),
        Array.from({ length: 1536 }, (_, i) => (i + 1) / 1536),
      ]
      mockCreate.mockResolvedValue({
        data: mockEmbeddings.map((embedding) => ({ embedding })),
      })

      const texts = ['First text', 'Second text']
      const result = await generateEmbeddings(texts)

      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBe(texts.length)
    })

    it('should return empty array for empty input', async () => {
      mockCreate.mockResolvedValue({
        data: [],
      })

      const result = await generateEmbeddings([])
      expect(result).toEqual([])
    })
  })
})
