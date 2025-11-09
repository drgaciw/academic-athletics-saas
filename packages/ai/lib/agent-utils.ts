/**
 * Agent Utility Functions
 * 
 * Helper functions for agent execution, retry logic, and error handling
 */

import type { AgentRequest, AgentResponse, AgentState } from '../types/agent.types'
import { AgentError, isRecoverableError } from './errors'

/**
 * Sleep utility for retry delays
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Execute function with retry logic and exponential backoff
 */
export async function executeWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | undefined

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error

      // Don't retry if error is not recoverable
      if (!isRecoverableError(lastError)) {
        throw lastError
      }

      // Don't retry on last attempt
      if (attempt === maxRetries - 1) {
        throw lastError
      }

      // Calculate delay with exponential backoff
      const delay = baseDelay * Math.pow(2, attempt)
      console.warn(
        `Attempt ${attempt + 1} failed, retrying in ${delay}ms...`,
        lastError.message
      )

      await sleep(delay)
    }
  }

  throw lastError || new Error('Max retries exceeded')
}

/**
 * Execute with timeout
 */
export async function executeWithTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number,
  operation: string = 'Operation'
): Promise<T> {
  return Promise.race([
    fn(),
    new Promise<T>((_, reject) =>
      setTimeout(
        () => reject(new Error(`${operation} timed out after ${timeoutMs}ms`)),
        timeoutMs
      )
    ),
  ])
}

/**
 * Execute with fallback
 */
export async function executeWithFallback<T>(
  primary: () => Promise<T>,
  fallback: () => Promise<T>,
  onFallback?: (error: Error) => void
): Promise<T> {
  try {
    return await primary()
  } catch (error) {
    if (onFallback) {
      onFallback(error as Error)
    }
    return await fallback()
  }
}

/**
 * Validate agent request
 */
export function validateAgentRequest(request: AgentRequest): void {
  if (!request.userId) {
    throw new AgentError('INVALID_INPUT', 'userId is required')
  }

  if (!request.agentType) {
    throw new AgentError('INVALID_INPUT', 'agentType is required')
  }

  if (!request.message || request.message.trim().length === 0) {
    throw new AgentError('INVALID_INPUT', 'message is required and cannot be empty')
  }

  if (request.maxSteps && request.maxSteps < 1) {
    throw new AgentError('INVALID_INPUT', 'maxSteps must be at least 1')
  }
}

/**
 * Sanitize user input to prevent prompt injection
 */
export function sanitizeUserInput(input: string): string {
  // Remove potential prompt injection patterns
  const dangerousPatterns = [
    /ignore previous instructions/gi,
    /disregard all prior/gi,
    /system:/gi,
    /you are now/gi,
    /<\|im_start\|>/gi,
    /<\|im_end\|>/gi,
    /\[INST\]/gi,
    /\[\/INST\]/gi,
  ]

  let sanitized = input

  dangerousPatterns.forEach((pattern) => {
    sanitized = sanitized.replace(pattern, '')
  })

  return sanitized.trim()
}

/**
 * Truncate text to maximum length
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text
  }

  return text.substring(0, maxLength - 3) + '...'
}

/**
 * Format agent response for display
 */
export function formatAgentResponse(response: AgentResponse): string {
  const parts: string[] = []

  parts.push(`Agent: ${response.agentType}`)
  parts.push(`Status: ${response.status}`)
  parts.push(`Duration: ${response.duration}ms`)
  parts.push(`Tokens: ${response.usage.totalTokens}`)
  parts.push(`Cost: $${response.cost.toFixed(4)}`)

  if (response.toolInvocations.length > 0) {
    parts.push(`Tools used: ${response.toolInvocations.map((t) => t.toolName).join(', ')}`)
  }

  if (response.error) {
    parts.push(`Error: ${response.error.message}`)
  }

  return parts.join('\n')
}

/**
 * Calculate token count estimate (rough approximation)
 */
export function estimateTokenCount(text: string): number {
  // Rough estimate: ~4 characters per token
  return Math.ceil(text.length / 4)
}

/**
 * Check if context window is approaching limit
 */
export function isContextWindowNearLimit(
  currentTokens: number,
  maxTokens: number,
  threshold: number = 0.8
): boolean {
  return currentTokens >= maxTokens * threshold
}

/**
 * Compress messages by summarizing older ones
 * Uses LLM to create semantic summary (requires model parameter)
 * 
 * For simple compression without LLM, use compressMessagesSimple()
 */
export async function compressMessages(
  messages: any[],
  model: any,
  keepFirst: number = 2,
  keepLast: number = 5
): Promise<any[]> {
  if (messages.length <= keepFirst + keepLast) {
    return messages
  }

  const first = messages.slice(0, keepFirst)
  const last = messages.slice(-keepLast)
  const middle = messages.slice(keepFirst, -keepLast)

  // Generate semantic summary using LLM
  const { generateText } = await import('ai')
  
  const summaryPrompt = `<messages_to_summarize>
${middle.map((m, i) => `${m.role}: ${m.content}`).join('\n\n')}
</messages_to_summarize>

<instructions>
Create a concise summary of the above conversation that preserves:
1. Key facts and decisions
2. Important context for future messages
3. User preferences or constraints mentioned
4. Any unresolved questions or action items

Keep the summary under 200 words.
</instructions>`

  const result = await generateText({
    model,
    prompt: summaryPrompt,
    temperature: 0.3,
  })

  const summary = {
    role: 'system',
    content: `<conversation_summary>
${result.text}
</conversation_summary>`,
  }

  return [...first, summary, ...last]
}

/**
 * Simple message compression without LLM
 */
export function compressMessagesSimple(
  messages: any[],
  keepFirst: number = 2,
  keepLast: number = 5
): any[] {
  if (messages.length <= keepFirst + keepLast) {
    return messages
  }

  const first = messages.slice(0, keepFirst)
  const last = messages.slice(-keepLast)
  const middle = messages.slice(keepFirst, -keepLast)

  const summary = {
    role: 'system',
    content: `<conversation_summary>
Previous ${middle.length} messages covered general discussion.
Key topics may include course selection, eligibility, and scheduling.
</conversation_summary>`,
  }

  return [...first, summary, ...last]
}

/**
 * Extract keywords from text
 */
export function extractKeywords(text: string, maxKeywords: number = 10): string[] {
  // Simple keyword extraction (can be enhanced with NLP)
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter((word) => word.length > 3)

  // Count word frequency
  const frequency = new Map<string, number>()
  words.forEach((word) => {
    frequency.set(word, (frequency.get(word) || 0) + 1)
  })

  // Sort by frequency and return top keywords
  return Array.from(frequency.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxKeywords)
    .map(([word]) => word)
}

/**
 * Generate unique ID
 */
export function generateId(): string {
  return crypto.randomUUID()
}

/**
 * Parse agent type from string
 */
export function parseAgentType(type: string): string {
  const validTypes = ['advising', 'compliance', 'intervention', 'administrative', 'general']
  const normalized = type.toLowerCase().trim()

  if (validTypes.includes(normalized)) {
    return normalized
  }

  throw new AgentError('INVALID_INPUT', `Invalid agent type: ${type}`)
}

/**
 * Create error response
 */
export function createErrorResponse(
  requestId: string,
  agentType: string,
  error: Error,
  duration: number
): AgentResponse {
  const agentError = error instanceof AgentError ? error : new AgentError(
    'UNKNOWN',
    error.message,
    { originalError: error }
  )

  return {
    requestId,
    agentType: agentType as any,
    content: '',
    steps: [],
    toolInvocations: [],
    usage: {
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
    },
    cost: 0,
    duration,
    status: 'failed',
    error: agentError.toJSON(),
  }
}
