/**
 * Agent Types and Interfaces
 * 
 * Core type definitions for AI agents, tools, and workflows
 */

import { z } from 'zod'
import type { CoreMessage, CoreTool } from 'ai'

// ============================================================================
// Agent Types
// ============================================================================

/**
 * Supported agent types in the system
 */
export type AgentType = 
  | 'advising'
  | 'compliance'
  | 'intervention'
  | 'administrative'
  | 'general'

/**
 * Agent execution status
 */
export type AgentStatus = 
  | 'pending'
  | 'running'
  | 'paused'
  | 'completed'
  | 'failed'
  | 'cancelled'

/**
 * Task complexity levels for model selection
 */
export type TaskComplexity = 'simple' | 'moderate' | 'complex'

/**
 * LLM provider options
 */
export type LLMProvider = 'openai' | 'anthropic'

// ============================================================================
// Agent Request/Response
// ============================================================================

/**
 * Request to execute an agent
 */
export interface AgentRequest {
  /** Unique request ID */
  id?: string
  
  /** User making the request */
  userId: string
  
  /** Type of agent to execute */
  agentType: AgentType
  
  /** User's message or query */
  message: string
  
  /** Conversation ID for context */
  conversationId?: string
  
  /** Additional context */
  context?: Record<string, any>
  
  /** Streaming enabled */
  streaming?: boolean
  
  /** Maximum steps for agent execution */
  maxSteps?: number
  
  /** Model preference */
  modelPreference?: {
    provider?: LLMProvider
    complexity?: TaskComplexity
  }
}

/**
 * Response from agent execution
 */
export interface AgentResponse {
  /** Request ID */
  requestId: string
  
  /** Agent type that handled the request */
  agentType: AgentType
  
  /** Response content */
  content: string
  
  /** Steps executed */
  steps: AgentStep[]
  
  /** Tools invoked */
  toolInvocations: ToolInvocation[]
  
  /** Token usage */
  usage: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  
  /** Cost in USD */
  cost: number
  
  /** Execution time in ms */
  duration: number
  
  /** Status */
  status: AgentStatus
  
  /** Error if failed */
  error?: AgentError
  
  /** Metadata */
  metadata?: Record<string, any>
}

// ============================================================================
// Agent State
// ============================================================================

/**
 * Agent execution state
 */
export interface AgentState {
  /** Unique state ID */
  id: string
  
  /** User ID */
  userId: string
  
  /** Agent type */
  agentType: AgentType
  
  /** Current status */
  status: AgentStatus
  
  /** Current step number */
  currentStep: number
  
  /** Maximum steps allowed */
  maxSteps: number
  
  /** Conversation messages */
  messages: CoreMessage[]
  
  /** Tool results from execution */
  toolResults: ToolResult[]
  
  /** Step history */
  stepHistory: AgentStep[]
  
  /** Additional metadata */
  metadata: Record<string, any>
  
  /** Created timestamp */
  createdAt: Date
  
  /** Last updated timestamp */
  updatedAt: Date
  
  /** Completed timestamp */
  completedAt?: Date
}

// ============================================================================
// Agent Steps
// ============================================================================

/**
 * A single step in agent execution
 */
export interface AgentStep {
  /** Step number */
  stepNumber: number
  
  /** Step type */
  type: 'thinking' | 'tool_call' | 'response' | 'error'
  
  /** Step description */
  description: string
  
  /** Tool calls in this step */
  toolCalls?: ToolCall[]
  
  /** Response generated */
  response?: string
  
  /** Error if step failed */
  error?: AgentError
  
  /** Timestamp */
  timestamp: Date
  
  /** Duration in ms */
  duration?: number
}

// ============================================================================
// Tools
// ============================================================================

/**
 * Tool definition with Zod schema
 */
export interface ToolDefinition {
  /** Unique tool identifier */
  id: string
  
  /** Tool name */
  name: string
  
  /** Tool description for LLM */
  description: string
  
  /** Zod schema for parameters */
  parameters: z.ZodType<any>
  
  /** Tool execution function */
  execute: (params: any, context?: ToolExecutionContext) => Promise<any>
  
  /** Required permissions */
  requiredPermissions?: string[]
  
  /** Whether tool requires user confirmation */
  requiresConfirmation?: boolean
  
  /** Tool category */
  category?: ToolCategory
  
  /** Metadata */
  metadata?: Record<string, any>
}

/**
 * Tool categories
 */
export type ToolCategory =
  | 'student_data'
  | 'compliance'
  | 'advising'
  | 'integration'
  | 'analytics'
  | 'administrative'

/**
 * Tool execution context
 */
export interface ToolExecutionContext {
  /** User making the request */
  userId: string
  
  /** User roles */
  userRoles: string[]
  
  /** Agent state */
  agentState: AgentState
  
  /** Request confirmation if needed */
  requestConfirmation?: (message: string) => Promise<boolean>
  
  /** Additional context */
  metadata?: Record<string, any>
}

/**
 * Tool call made by agent
 */
export interface ToolCall {
  /** Tool call ID */
  id: string
  
  /** Tool name */
  toolName: string
  
  /** Parameters passed */
  parameters: Record<string, any>
  
  /** Timestamp */
  timestamp: Date
}

/**
 * Tool invocation with result
 */
export interface ToolInvocation extends ToolCall {
  /** Result from tool execution */
  result?: any
  
  /** Error if tool failed */
  error?: AgentError
  
  /** Execution time in ms */
  latency: number
  
  /** Whether confirmation was required */
  confirmationRequired?: boolean
  
  /** Whether user confirmed */
  confirmed?: boolean
}

/**
 * Tool result
 */
export interface ToolResult {
  /** Tool name */
  toolName: string
  
  /** Result data */
  data: any
  
  /** Success status */
  success: boolean
  
  /** Error if failed */
  error?: string
  
  /** Timestamp */
  timestamp: Date
}

// ============================================================================
// Agent Configuration
// ============================================================================

/**
 * Agent configuration
 */
export interface AgentConfig {
  /** Agent type */
  type: AgentType
  
  /** Agent name */
  name: string
  
  /** Agent description */
  description: string
  
  /** System prompt template */
  systemPrompt: string
  
  /** Available tools */
  tools: string[]
  
  /** Model configuration */
  model: {
    provider: LLMProvider
    name: string
    temperature?: number
    maxTokens?: number
    topP?: number
  }
  
  /** Maximum steps */
  maxSteps: number
  
  /** Streaming enabled */
  streaming: boolean
  
  /** Memory enabled */
  memoryEnabled: boolean
  
  /** Rate limits */
  rateLimits?: {
    requestsPerMinute?: number
    tokensPerDay?: number
  }
}

// ============================================================================
// Errors
// ============================================================================

/**
 * Agent error
 */
export interface AgentError {
  /** Error code */
  code: string
  
  /** Error message */
  message: string
  
  /** Error details */
  details?: any
  
  /** Stack trace */
  stack?: string
  
  /** Timestamp */
  timestamp: Date
  
  /** Recoverable */
  recoverable: boolean
}

/**
 * Error codes
 */
export enum AgentErrorCode {
  TOOL_EXECUTION_FAILED = 'TOOL_EXECUTION_FAILED',
  PLANNING_FAILED = 'PLANNING_FAILED',
  CONTEXT_WINDOW_EXCEEDED = 'CONTEXT_WINDOW_EXCEEDED',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  INVALID_INPUT = 'INVALID_INPUT',
  TIMEOUT = 'TIMEOUT',
  UNKNOWN = 'UNKNOWN',
}

// ============================================================================
// Memory
// ============================================================================

/**
 * Memory types
 */
export type MemoryType = 'short_term' | 'long_term' | 'working'

/**
 * Agent memory entry
 */
export interface AgentMemory {
  /** Memory ID */
  id: string
  
  /** User ID */
  userId: string
  
  /** Memory type */
  memoryType: MemoryType
  
  /** Content */
  content: string
  
  /** Vector embedding */
  embedding?: number[]
  
  /** Metadata */
  metadata: Record<string, any>
  
  /** Expiration date */
  expiresAt?: Date
  
  /** Created timestamp */
  createdAt: Date
}

/**
 * Conversation memory
 */
export interface ConversationMemory {
  /** Conversation ID */
  conversationId: string
  
  /** Messages */
  messages: CoreMessage[]
  
  /** Context */
  context: Record<string, any>
  
  /** Created timestamp */
  createdAt: Date
  
  /** Expires timestamp */
  expiresAt: Date
}

// ============================================================================
// Metrics
// ============================================================================

/**
 * Agent execution metrics
 */
export interface AgentMetrics {
  /** Task ID */
  taskId: string
  
  /** Agent type */
  agentType: AgentType
  
  /** Duration in ms */
  duration: number
  
  /** Token usage */
  tokenUsage: number
  
  /** Cost in USD */
  cost: number
  
  /** Number of tool invocations */
  toolInvocations: number
  
  /** Success status */
  success: boolean
  
  /** Error type if failed */
  errorType?: string
  
  /** Timestamp */
  timestamp: Date
}

/**
 * Agent feedback
 */
export interface AgentFeedback {
  /** Feedback ID */
  id: string
  
  /** Task ID */
  taskId: string
  
  /** User ID */
  userId: string
  
  /** Rating (1-5) */
  rating: number
  
  /** Feedback text */
  feedbackText?: string
  
  /** Was helpful */
  wasHelpful: boolean
  
  /** Flagged as issue */
  flaggedIssue: boolean
  
  /** Created timestamp */
  createdAt: Date
}

// ============================================================================
// Streaming
// ============================================================================

/**
 * Stream event types
 */
export type StreamEventType =
  | 'start'
  | 'thinking'
  | 'tool_call'
  | 'tool_result'
  | 'text_delta'
  | 'step_finish'
  | 'finish'
  | 'error'

/**
 * Stream event
 */
export interface StreamEvent {
  /** Event type */
  type: StreamEventType
  
  /** Event data */
  data: any
  
  /** Timestamp */
  timestamp: Date
}

// ============================================================================
// Orchestration
// ============================================================================

/**
 * Multi-agent workflow
 */
export interface MultiAgentWorkflow {
  /** Workflow ID */
  id: string
  
  /** Workflow name */
  name: string
  
  /** Agents involved */
  agents: AgentType[]
  
  /** Current agent */
  currentAgent: AgentType
  
  /** Workflow state */
  state: Record<string, any>
  
  /** Steps completed */
  stepsCompleted: number
  
  /** Status */
  status: AgentStatus
}

/**
 * Agent collaboration context
 */
export interface AgentCollaborationContext {
  /** Workflow ID */
  workflowId: string
  
  /** Previous agent results */
  previousResults: Record<AgentType, any>
  
  /** Shared context */
  sharedContext: Record<string, any>
  
  /** Coordination strategy */
  strategy: 'sequential' | 'parallel' | 'hierarchical'
}
