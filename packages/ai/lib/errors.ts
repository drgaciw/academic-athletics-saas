/**
 * Agent Error Classes
 * 
 * Custom error classes for agent execution failures
 */

import { AgentErrorCode } from '../types/agent.types'

/**
 * Base agent error class
 */
export class AgentError extends Error {
  public readonly code: string
  public readonly details?: any
  public readonly recoverable: boolean
  public readonly timestamp: Date

  constructor(
    code: string,
    message: string,
    details?: any,
    recoverable: boolean = false
  ) {
    super(message)
    this.name = 'AgentError'
    this.code = code
    this.details = details
    this.recoverable = recoverable
    this.timestamp = new Date()

    // Maintains proper stack trace for where error was thrown
    if (typeof (Error as any).captureStackTrace === 'function') {
      (Error as any).captureStackTrace(this, this.constructor)
    }
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
      recoverable: this.recoverable,
      timestamp: this.timestamp,
      stack: this.stack,
    }
  }
}

/**
 * Tool execution error
 */
export class ToolExecutionError extends AgentError {
  constructor(
    public readonly toolName: string,
    public readonly parameters: any,
    public readonly originalError: Error
  ) {
    super(
      AgentErrorCode.TOOL_EXECUTION_FAILED,
      `Tool ${toolName} failed: ${originalError.message}`,
      {
        toolName,
        parameters,
        originalError: originalError.message,
      },
      true // Recoverable - can retry
    )
    this.name = 'ToolExecutionError'
  }
}

/**
 * Agent planning error
 */
export class AgentPlanningError extends AgentError {
  constructor(
    public readonly agentType: string,
    public readonly step: number,
    public readonly reason: string
  ) {
    super(
      AgentErrorCode.PLANNING_FAILED,
      `Agent planning failed at step ${step}: ${reason}`,
      {
        agentType,
        step,
        reason,
      },
      true // Recoverable - can retry with different approach
    )
    this.name = 'AgentPlanningError'
  }
}

/**
 * Context window exceeded error
 */
export class ContextWindowError extends AgentError {
  constructor(
    public readonly tokenCount: number,
    public readonly maxTokens: number
  ) {
    super(
      AgentErrorCode.CONTEXT_WINDOW_EXCEEDED,
      `Context window exceeded: ${tokenCount}/${maxTokens} tokens`,
      {
        tokenCount,
        maxTokens,
      },
      true // Recoverable - can compress context
    )
    this.name = 'ContextWindowError'
  }
}

/**
 * Rate limit exceeded error
 */
export class RateLimitError extends AgentError {
  constructor(
    public readonly limit: number,
    public readonly period: string,
    public readonly retryAfter?: number
  ) {
    super(
      AgentErrorCode.RATE_LIMIT_EXCEEDED,
      `Rate limit exceeded: ${limit} requests per ${period}`,
      {
        limit,
        period,
        retryAfter,
      },
      true // Recoverable - can retry after delay
    )
    this.name = 'RateLimitError'
  }
}

/**
 * Permission denied error
 */
export class PermissionDeniedError extends AgentError {
  constructor(
    public readonly userId: string,
    public readonly resource: string,
    public readonly action: string
  ) {
    super(
      AgentErrorCode.PERMISSION_DENIED,
      `Permission denied: User ${userId} cannot ${action} ${resource}`,
      {
        userId,
        resource,
        action,
      },
      false // Not recoverable - user lacks permissions
    )
    this.name = 'PermissionDeniedError'
  }
}

/**
 * Invalid input error
 */
export class InvalidInputError extends AgentError {
  constructor(
    public readonly field: string,
    public readonly reason: string,
    public readonly value?: any
  ) {
    super(
      AgentErrorCode.INVALID_INPUT,
      `Invalid input for ${field}: ${reason}`,
      {
        field,
        reason,
        value,
      },
      false // Not recoverable - input is invalid
    )
    this.name = 'InvalidInputError'
  }
}

/**
 * Timeout error
 */
export class TimeoutError extends AgentError {
  constructor(
    public readonly operation: string,
    public readonly timeoutMs: number
  ) {
    super(
      AgentErrorCode.TIMEOUT,
      `Operation ${operation} timed out after ${timeoutMs}ms`,
      {
        operation,
        timeoutMs,
      },
      true // Recoverable - can retry
    )
    this.name = 'TimeoutError'
  }
}

/**
 * Helper to check if error is recoverable
 */
export function isRecoverableError(error: Error): boolean {
  if (error instanceof AgentError) {
    return error.recoverable
  }
  return false
}

/**
 * Helper to convert any error to AgentError
 */
export function toAgentError(error: unknown): AgentError {
  if (error instanceof AgentError) {
    return error
  }

  if (error instanceof Error) {
    return new AgentError(
      AgentErrorCode.UNKNOWN,
      error.message,
      { originalError: error.message },
      false
    )
  }

  return new AgentError(
    AgentErrorCode.UNKNOWN,
    'An unknown error occurred',
    { error },
    false
  )
}
