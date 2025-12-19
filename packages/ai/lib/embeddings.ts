/**
 * Embeddings utilities for generating vector embeddings using OpenAI
 * 
 * These functions provide semantic similarity search capabilities by converting
 * text into high-dimensional vector representations.
 */

import { openai } from './chat'

/**
 * Generate embedding for a single text string
 * 
 * @param text - The text to generate an embedding for
 * @returns Promise resolving to a 1536-dimensional embedding vector
 * 
 * @example
 * ```typescript
 * const embedding = await generateEmbedding("NCAA academic requirements")
 * // Returns: [0.123, -0.456, 0.789, ...] (1536 numbers)
 * ```
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-large',
    input: text,
    dimensions: 1536,
  })
  
  return response.data[0].embedding
}

/**
 * Generate embeddings for multiple text strings in a single batch
 * 
 * This is more efficient than calling generateEmbedding multiple times
 * as it makes a single API call for all texts.
 * 
 * @param texts - Array of texts to generate embeddings for
 * @returns Promise resolving to an array of 1536-dimensional embedding vectors
 * 
 * @example
 * ```typescript
 * const embeddings = await generateEmbeddings([
 *   "Student athlete academic progress",
 *   "NCAA compliance requirements"
 * ])
 * // Returns: [[0.123, ...], [0.456, ...]]
 * ```
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-large',
    input: texts,
    dimensions: 1536,
  })
  
  return response.data.map(d => d.embedding)
}
