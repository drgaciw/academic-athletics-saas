/**
 * AI SDK Providers
 * 
 * Initializes and exports AI SDK providers for OpenAI and Anthropic
 */

import { createOpenAI } from '@ai-sdk/openai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { aiConfig } from '../config'

// Initialize OpenAI provider
export const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
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
        return openai(aiConfig.models.openai.gpt4)
      case 'complex':
        return openai(aiConfig.models.openai.gpt51codexmax)
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
      return openai(aiConfig.models.openai.gpt51codexmax)
  }
}

/**
 * Get model for embeddings
 */
export function getEmbeddingModel() {
  return openai.embedding(aiConfig.models.openai.embedding)
}
