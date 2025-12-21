/**
 * AI SDK Configuration
 * 
 * Centralized configuration for AI agents, models, and providers
 */

export const aiConfig = {
  // Model Configuration
  models: {
    // OpenAI Models
    openai: {
      gpt51codexmax: 'gpt-5.1-codex-max',
      gpt4: 'gpt-4-turbo-preview',
      gpt4mini: 'gpt-4o-mini',
      gpt35turbo: 'gpt-3.5-turbo',
      embedding: 'text-embedding-3-large',
    },
    // Anthropic Models
    anthropic: {
      opus: 'claude-opus-4-20250514',
      sonnet: 'claude-sonnet-4-20250514',
      haiku: 'claude-3-5-haiku-20241022',
    },
  },

  // Agent Configuration
  agents: {
    maxSteps: 10,
    defaultTemperature: 0.7,
    streamingEnabled: true,
  },

  // Token Limits
  tokenLimits: {
    gpt51codexmax: 256000,
    gpt4: 128000,
    gpt4mini: 128000,
    gpt35turbo: 16385,
    claude: 200000,
  },

  // Cost per 1M tokens (in USD)
  costs: {
    gpt51codexmax: {
      input: 15.0,
      output: 45.0,
    },
    gpt4: {
      input: 10.0,
      output: 30.0,
    },
    gpt4mini: {
      input: 0.15,
      output: 0.60,
    },
    claudeOpus: {
      input: 15.0,
      output: 75.0,
    },
    claudeSonnet: {
      input: 3.0,
      output: 15.0,
    },
    claudeHaiku: {
      input: 0.25,
      output: 1.25,
    },
  },

  // Langfuse Configuration
  langfuse: {
    enabled: process.env.LANGFUSE_PUBLIC_KEY !== undefined,
    publicKey: process.env.LANGFUSE_PUBLIC_KEY,
    secretKey: process.env.LANGFUSE_SECRET_KEY,
    host: process.env.LANGFUSE_HOST || 'https://cloud.langfuse.com',
  },

  // Rate Limiting
  rateLimits: {
    requestsPerMinute: 60,
    tokensPerDay: 1000000,
  },
}

export type AIConfig = typeof aiConfig
