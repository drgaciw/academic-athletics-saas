/**
 * AI SDK Providers
 * 
 * Initializes and exports AI SDK providers for OpenAI and Anthropic
 */

import { openai as createOpenAI } from '@ai-sdk/openai'
import { anthropic as createAnthropic } from '@ai-sdk/anthropic'
import { aiConfig } from '../config'

// Initialize OpenAI provider
export const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  compatibility: 'strict',
})

// Initialize Anthropic provider
export const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

/**
 * Select the optimal model based on task complexity and cost constraints
 */
export function selectModel(
  complexity: 'simple' | 'moderate' | 'complex',
  provider?: 'openai' | 'anthropic'
) {
  // If provider is specified, use that provider
  if (provider === 'openai') {
    switch (complexity) {
      case 'simple':
        return openai(aiConfig.models.openai.gpt4mini)
      case 'moderate':
      case 'complex':
        return openai(aiConfig.models.openai.gpt4)
    }
  }

  if (provider === 'anthropic') {
    switch (complexity) {
      case 'simple':
        return anthropic(aiConfig.models.anthropic.haiku)
      case 'moderate':
        return anthropic(aiConfig.models.anthropic.sonnet)
      case 'complex':
        return anthropic(aiConfig.models.anthropic.opus)
    }
  }

  // Default: Auto-select based on complexity
  switch (complexity) {
    case 'simple':
      return openai(aiConfig.models.openai.gpt4mini)
    case 'moderate':
      return anthropic(aiConfig.models.anthropic.sonnet)
    case 'complex':
      return anthropic(aiConfig.models.anthropic.opus)
  }
}

/**
 * Get model for embeddings
 */
export function getEmbeddingModel() {
  return openai.embedding(aiConfig.models.openai.embedding)
}
