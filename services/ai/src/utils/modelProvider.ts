import { openai } from '@ai-sdk/openai'
import { anthropic } from '@ai-sdk/anthropic'

export function getLanguageModel(model: string) {
  if (model.startsWith('claude')) {
    return anthropic(model)
  }

  return openai(model)
}
