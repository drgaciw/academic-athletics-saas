import { encoding_for_model, Tiktoken } from 'tiktoken'
import { AIModel, TokenUsage } from '../types'
import { calculateCost } from '../config'

// Cache encoders to avoid repeated initialization
const encoderCache = new Map<string, Tiktoken>()

/**
 * Get encoder for a specific model
 */
function getEncoder(model: string): Tiktoken {
  if (encoderCache.has(model)) {
    return encoderCache.get(model)!
  }

  let encoder: Tiktoken
  try {
    // Map model names to tiktoken model names
    const modelMap: Record<string, any> = {
      'gpt-4': 'gpt-4',
      'gpt-4-turbo': 'gpt-4',
      'gpt-4o': 'gpt-4',
      'gpt-4o-mini': 'gpt-4',
      'gpt-3.5-turbo': 'gpt-3.5-turbo',
    }

    const tiktokenModel = modelMap[model] || 'gpt-4'
    encoder = encoding_for_model(tiktokenModel as any)
    encoderCache.set(model, encoder)
  } catch (error) {
    // Fallback to cl100k_base encoding
    encoder = encoding_for_model('gpt-4')
    encoderCache.set(model, encoder)
  }

  return encoder
}

/**
 * Count tokens in a text string
 */
export function countTokens(text: string, model: string = 'gpt-4'): number {
  if (!text || text.length === 0) return 0

  try {
    const encoder = getEncoder(model)
    const tokens = encoder.encode(text)
    return tokens.length
  } catch (error) {
    // Fallback to approximate counting (4 chars per token)
    return Math.ceil(text.length / 4)
  }
}

/**
 * Count tokens in an array of messages
 */
export function countMessageTokens(
  messages: Array<{ role: string; content: string; name?: string }>,
  model: string = 'gpt-4'
): number {
  let totalTokens = 0

  // Base tokens per message
  const tokensPerMessage = model.startsWith('gpt-4') ? 3 : 4
  const tokensPerName = model.startsWith('gpt-4') ? 1 : -1

  for (const message of messages) {
    totalTokens += tokensPerMessage
    totalTokens += countTokens(message.role, model)
    totalTokens += countTokens(message.content, model)

    if (message.name) {
      totalTokens += countTokens(message.name, model)
      totalTokens += tokensPerName
    }
  }

  // Base tokens for reply priming
  totalTokens += 3

  return totalTokens
}

/**
 * Estimate tokens for Claude models (approximate)
 */
export function countClaudeTokens(text: string): number {
  // Claude uses a similar tokenization to GPT-4
  // Approximate: 1 token ≈ 4 characters for English text
  return Math.ceil(text.length / 3.5)
}

/**
 * Truncate text to fit within token limit
 */
export function truncateToTokenLimit(
  text: string,
  maxTokens: number,
  model: string = 'gpt-4',
  suffix: string = '...'
): string {
  const currentTokens = countTokens(text, model)

  if (currentTokens <= maxTokens) {
    return text
  }

  // Binary search for the right length
  let left = 0
  let right = text.length
  let result = text

  while (left < right) {
    const mid = Math.floor((left + right) / 2)
    const truncated = text.substring(0, mid) + suffix
    const tokens = countTokens(truncated, model)

    if (tokens <= maxTokens) {
      result = truncated
      left = mid + 1
    } else {
      right = mid
    }
  }

  return result
}

/**
 * Split text into chunks that fit within token limit
 */
export function chunkText(
  text: string,
  maxTokensPerChunk: number,
  overlap: number = 50,
  model: string = 'gpt-4'
): string[] {
  const chunks: string[] = []
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0)

  let currentChunk = ''
  let currentTokens = 0

  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i].trim() + '.'
    const sentenceTokens = countTokens(sentence, model)

    // If single sentence exceeds limit, split it by words
    if (sentenceTokens > maxTokensPerChunk) {
      if (currentChunk) {
        chunks.push(currentChunk.trim())
        currentChunk = ''
        currentTokens = 0
      }

      const words = sentence.split(/\s+/)
      let wordChunk = ''
      let wordTokens = 0

      for (const word of words) {
        const wordToken = countTokens(word + ' ', model)

        if (wordTokens + wordToken > maxTokensPerChunk) {
          chunks.push(wordChunk.trim())
          wordChunk = word + ' '
          wordTokens = wordToken
        } else {
          wordChunk += word + ' '
          wordTokens += wordToken
        }
      }

      if (wordChunk) {
        chunks.push(wordChunk.trim())
      }
      continue
    }

    // Add sentence to current chunk if it fits
    if (currentTokens + sentenceTokens <= maxTokensPerChunk) {
      currentChunk += sentence + ' '
      currentTokens += sentenceTokens
    } else {
      // Save current chunk and start new one
      if (currentChunk) {
        chunks.push(currentChunk.trim())
      }

      // Add overlap from previous chunk
      if (overlap > 0 && chunks.length > 0) {
        const prevWords = currentChunk.split(/\s+/)
        const overlapWords = prevWords.slice(-overlap).join(' ')
        currentChunk = overlapWords + ' ' + sentence + ' '
        currentTokens = countTokens(currentChunk, model)
      } else {
        currentChunk = sentence + ' '
        currentTokens = sentenceTokens
      }
    }
  }

  // Add final chunk
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim())
  }

  return chunks
}

/**
 * Calculate comprehensive token usage and cost
 */
export function calculateTokenUsage(
  promptTokens: number,
  completionTokens: number,
  model: AIModel
): TokenUsage {
  const totalTokens = promptTokens + completionTokens
  const estimatedCost = calculateCost(model, promptTokens, completionTokens)

  return {
    promptTokens,
    completionTokens,
    totalTokens,
    estimatedCost,
    model,
  }
}

/**
 * Format token usage for display
 */
export function formatTokenUsage(usage: TokenUsage): string {
  return (
    `Tokens: ${usage.totalTokens.toLocaleString()} ` +
    `(prompt: ${usage.promptTokens.toLocaleString()}, ` +
    `completion: ${usage.completionTokens.toLocaleString()}) | ` +
    `Cost: $${usage.estimatedCost.toFixed(6)} | ` +
    `Model: ${usage.model}`
  )
}

/**
 * Check if messages fit within model's context window
 */
export function fitsInContextWindow(
  messages: Array<{ role: string; content: string }>,
  model: string,
  maxTokens: number
): { fits: boolean; tokenCount: number; maxTokens: number } {
  const tokenCount = countMessageTokens(messages, model)

  return {
    fits: tokenCount <= maxTokens,
    tokenCount,
    maxTokens,
  }
}

/**
 * Optimize messages to fit within context window
 */
export function optimizeMessages(
  messages: Array<{ role: string; content: string; name?: string }>,
  maxTokens: number,
  model: string = 'gpt-4'
): Array<{ role: string; content: string; name?: string }> {
  const currentTokens = countMessageTokens(messages, model)

  if (currentTokens <= maxTokens) {
    return messages
  }

  // Strategy: Keep system message and most recent messages
  const optimized = [...messages]
  let systemMessage = optimized.find((m) => m.role === 'system')

  // Remove middle messages until we fit
  while (countMessageTokens(optimized, model) > maxTokens && optimized.length > 2) {
    // Find and remove the oldest non-system message
    const indexToRemove = optimized.findIndex(
      (m, i) => m.role !== 'system' && i < optimized.length - 1
    )

    if (indexToRemove !== -1) {
      optimized.splice(indexToRemove, 1)
    } else {
      break
    }
  }

  // If still too large, truncate the oldest user message
  if (countMessageTokens(optimized, model) > maxTokens) {
    const oldestUserIndex = optimized.findIndex((m) => m.role === 'user')
    if (oldestUserIndex !== -1) {
      const availableTokens = maxTokens - countMessageTokens(optimized.filter((_, i) => i !== oldestUserIndex), model)
      optimized[oldestUserIndex].content = truncateToTokenLimit(
        optimized[oldestUserIndex].content,
        Math.max(100, availableTokens),
        model
      )
    }
  }

  return optimized
}

/**
 * Estimate embedding tokens (for text-embedding models)
 */
export function estimateEmbeddingTokens(texts: string[]): number {
  return texts.reduce((total, text) => total + countTokens(text, 'gpt-4'), 0)
}

/**
 * Calculate batch processing cost for embeddings
 */
export function calculateEmbeddingCost(texts: string[], model: string = 'text-embedding-3-large'): {
  totalTokens: number
  estimatedCost: number
  tokensPerText: number[]
} {
  const tokensPerText = texts.map((text) => countTokens(text, 'gpt-4'))
  const totalTokens = tokensPerText.reduce((sum, tokens) => sum + tokens, 0)

  const pricing = {
    'text-embedding-3-small': 0.02,
    'text-embedding-3-large': 0.13,
  }

  const costPerMillion = pricing[model as keyof typeof pricing] || 0.13
  const estimatedCost = (totalTokens / 1_000_000) * costPerMillion

  return {
    totalTokens,
    estimatedCost,
    tokensPerText,
  }
}

/**
 * Clean up encoders (call on shutdown)
 */
export function cleanupEncoders(): void {
  for (const encoder of encoderCache.values()) {
    encoder.free()
  }
  encoderCache.clear()
}
