/**
 * Prompt Compression
 * 
 * Reduces token usage through intelligent prompt compression
 * and conversation summarization
 */

import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'
import type { CoreMessage } from 'ai'

/**
 * Compression strategy
 */
export type CompressionStrategy = 
  | 'truncate' // Simple truncation
  | 'summarize' // LLM-based summarization
  | 'sliding_window' // Keep recent messages
  | 'semantic' // Keep semantically important messages

/**
 * Compression options
 */
export interface CompressionOptions {
  strategy: CompressionStrategy
  maxTokens: number
  preserveSystemMessage?: boolean
  preserveRecentMessages?: number
}

/**
 * Compression result
 */
export interface CompressionResult {
  messages: CoreMessage[]
  originalTokens: number
  compressedTokens: number
  compressionRatio: number
  strategy: CompressionStrategy
}

/**
 * Prompt Compressor Class
 */
export class PromptCompressor {
  /**
   * Compress messages to fit within token limit
   */
  async compress(
    messages: CoreMessage[],
    options: CompressionOptions
  ): Promise<CompressionResult> {
    const originalTokens = this.estimateTokens(messages)

    if (originalTokens <= options.maxTokens) {
      return {
        messages,
        originalTokens,
        compressedTokens: originalTokens,
        compressionRatio: 1.0,
        strategy: options.strategy,
      }
    }

    let compressedMessages: CoreMessage[]

    switch (options.strategy) {
      case 'truncate':
        compressedMessages = this.truncateMessages(messages, options)
        break
      case 'summarize':
        compressedMessages = await this.summarizeMessages(messages, options)
        break
      case 'sliding_window':
        compressedMessages = this.slidingWindowMessages(messages, options)
        break
      case 'semantic':
        compressedMessages = await this.semanticCompression(messages, options)
        break
      default:
        compressedMessages = this.truncateMessages(messages, options)
    }

    const compressedTokens = this.estimateTokens(compressedMessages)

    return {
      messages: compressedMessages,
      originalTokens,
      compressedTokens,
      compressionRatio: compressedTokens / originalTokens,
      strategy: options.strategy,
    }
  }

  /**
   * Truncate messages (simple strategy)
   */
  private truncateMessages(
    messages: CoreMessage[],
    options: CompressionOptions
  ): CoreMessage[] {
    const result: CoreMessage[] = []
    let tokenCount = 0

    // Preserve system message if requested
    if (options.preserveSystemMessage && messages[0]?.role === 'system') {
      result.push(messages[0])
      tokenCount += this.estimateTokens([messages[0]])
    }

    // Add messages from the end until we hit the limit
    const startIndex = options.preserveSystemMessage ? 1 : 0
    const messagesToProcess = messages.slice(startIndex).reverse()

    for (const message of messagesToProcess) {
      const messageTokens = this.estimateTokens([message])
      if (tokenCount + messageTokens > options.maxTokens) break

      result.unshift(message)
      tokenCount += messageTokens
    }

    return result
  }

  /**
   * Sliding window (keep recent messages)
   */
  private slidingWindowMessages(
    messages: CoreMessage[],
    options: CompressionOptions
  ): CoreMessage[] {
    const preserveCount = options.preserveRecentMessages || 5
    const systemMessage = messages[0]?.role === 'system' ? [messages[0]] : []
    const recentMessages = messages.slice(-preserveCount)

    return [...systemMessage, ...recentMessages]
  }

  /**
   * Summarize messages using LLM
   */
  private async summarizeMessages(
    messages: CoreMessage[],
    options: CompressionOptions
  ): Promise<CoreMessage[]> {
    const systemMessage = messages[0]?.role === 'system' ? [messages[0]] : []
    const preserveCount = options.preserveRecentMessages || 3
    const recentMessages = messages.slice(-preserveCount)

    // Messages to summarize (middle section)
    const startIndex = systemMessage.length
    const endIndex = messages.length - preserveCount
    const toSummarize = messages.slice(startIndex, endIndex)

    if (toSummarize.length === 0) {
      return messages
    }

    // Create summary
    const conversationText = toSummarize
      .map((m) => `${m.role}: ${m.content}`)
      .join('\n')

    try {
      const { text: summary } = await generateText({
        model: openai('gpt-4o-mini'),
        prompt: `Summarize this conversation concisely, preserving key facts and context:\n\n${conversationText}`,
        maxTokens: Math.floor(options.maxTokens * 0.3), // Use 30% of budget for summary
      })

      const summaryMessage: CoreMessage = {
        role: 'system',
        content: `Previous conversation summary: ${summary}`,
      }

      return [...systemMessage, summaryMessage, ...recentMessages]
    } catch (error) {
      console.warn('Summarization failed, falling back to truncation:', error)
      return this.truncateMessages(messages, options)
    }
  }

  /**
   * Semantic compression (keep important messages)
   */
  private async semanticCompression(
    messages: CoreMessage[],
    options: CompressionOptions
  ): Promise<CoreMessage[]> {
    // TODO: Implement semantic importance scoring
    // For now, fall back to sliding window
    return this.slidingWindowMessages(messages, options)
  }

  /**
   * Estimate token count (rough approximation)
   */
  private estimateTokens(messages: CoreMessage[]): number {
    const text = messages.map((m) => m.content).join(' ')
    // Rough estimate: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4)
  }

  /**
   * Compress single message content
   */
  async compressContent(content: string, maxTokens: number): Promise<string> {
    const currentTokens = this.estimateTokens([{ role: 'user', content }])

    if (currentTokens <= maxTokens) {
      return content
    }

    try {
      const { text } = await generateText({
        model: openai('gpt-4o-mini'),
        prompt: `Compress this text to under ${maxTokens} tokens while preserving key information:\n\n${content}`,
        maxTokens,
      })

      return text
    } catch (error) {
      console.warn('Content compression failed:', error)
      // Fallback: truncate
      const ratio = maxTokens / currentTokens
      const targetLength = Math.floor(content.length * ratio)
      return content.substring(0, targetLength) + '...'
    }
  }
}

/**
 * Global compressor instance
 */
export const globalCompressor = new PromptCompressor()

/**
 * Convenience function for message compression
 */
export async function compressMessages(
  messages: CoreMessage[],
  options: CompressionOptions
): Promise<CompressionResult> {
  return globalCompressor.compress(messages, options)
}

/**
 * Convenience function for content compression
 */
export async function compressContent(
  content: string,
  maxTokens: number
): Promise<string> {
  return globalCompressor.compressContent(content, maxTokens)
}

/**
 * Auto-compress messages if they exceed context window
 */
export async function autoCompress(
  messages: CoreMessage[],
  maxContextTokens: number = 8000
): Promise<CoreMessage[]> {
  const result = await compressMessages(messages, {
    strategy: 'summarize',
    maxTokens: maxContextTokens,
    preserveSystemMessage: true,
    preserveRecentMessages: 5,
  })

  if (result.compressionRatio < 1.0) {
    console.log(
      `Compressed conversation: ${result.originalTokens} → ${result.compressedTokens} tokens (${(result.compressionRatio * 100).toFixed(1)}%)`
    )
  }

  return result.messages
}
