// Configuration
export * from './config'

// Types
export * from './types'
export * from './types/agent.types'

// Providers
export * from './lib/providers'

// Langfuse
export * from './lib/langfuse-client'

// Service Clients
export * from './lib/service-client'

// Errors
export {
  ToolExecutionError,
  AgentPlanningError,
  ContextWindowError,
  RateLimitError,
  PermissionDeniedError,
  InvalidInputError,
  TimeoutError,
  isRecoverableError,
  toAgentError,
} from './lib/errors'

// Base Agent
export * from './lib/base-agent'

// Agent Utilities
export * from './lib/agent-utils'

// Agent Orchestrator (NEW)
export * from './lib/agent-orchestrator'

// Prompt Templates (NEW)
export * from './lib/prompt-templates'

// Tool Registry (NEW)
export * from './lib/tool-registry'

// Agentic Workflows (NEW)
export * from './lib/agentic-workflow'

// Safety & Security (NEW)
export * from './lib/safety'

// Performance (NEW)
export * from './lib/performance'

// Intent Classification (NEW)
export * from './lib/intent-classifier'

// State Management (NEW)
export * from './lib/state-manager'

// Cache Management (NEW)
export * from './lib/cache-manager'

// Prompt Compression (NEW)
export type { CompressionStrategy, CompressionOptions, CompressionResult } from './lib/prompt-compression'
export { PromptCompressor, globalCompressor, compressContent, autoCompress } from './lib/prompt-compression'

// Feedback Management (NEW) - Temporarily disabled due to Prisma schema issues
// export * from './lib/feedback-manager'

// Configuration Management (NEW)
export * from './lib/config-manager'

// Agent Memory (NEW) - Temporarily disabled due to Prisma schema issues
// export * from './lib/agent-memory'

// Audit Logging (NEW)
export * from './lib/audit-logger'

// Tools (NEW)
export * from './tools'

// Agents (NEW)
export * from './agents'

// Existing exports
export { selectModel } from './lib/chat'
export * from './lib/embeddings'
export * from './lib/rag'
