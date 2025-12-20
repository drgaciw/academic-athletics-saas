/**
 * Chat utilities for AI SDK
 * 
 * Legacy exports for backward compatibility
 * New code should use the providers from lib/providers.ts
 */

import { OpenAI } from 'openai'
import Anthropic from '@anthropic-ai/sdk'

// Legacy OpenAI and Anthropic clients (for backward compatibility)
export const legacyOpenai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export const legacyAnthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// Aliases for backward compatibility
/** @deprecated Use legacyOpenai or the AI SDK providers */
export const openaiLegacy = legacyOpenai

/** @deprecated Use legacyAnthropic or the AI SDK providers */
export const anthropicLegacy = legacyAnthropic

/**
 * @deprecated Use selectModel from lib/providers.ts instead
 */
export async function selectModelLegacy(queryLength: number, complexity: 'simple' | 'moderate' | 'complex') {
  if (complexity === 'simple' || queryLength < 50) {
    return { provider: 'openai', model: 'gpt-4o-mini' }
  } else if (complexity === 'moderate') {
    return { provider: 'anthropic', model: 'claude-sonnet-4-20250514' }
  } else {
    return { provider: 'anthropic', model: 'claude-opus-4-20250514' }
  }
}
