/**
 * Langfuse Client
 * 
 * Comprehensive observability and tracing for AI agents
 * Implements best practices for agent monitoring and debugging
 */

import { Langfuse } from 'langfuse'
import type { 
  LangfuseTraceClient, 
  LangfuseSpanClient, 
  LangfuseGenerationClient 
} from 'langfuse'
import { aiConfig } from '../config'
import type { 
  AgentType, 
  AgentRequest, 
  AgentResponse, 
  AgentStep,
  ToolInvocation 
} from '../types/agent.types'

let langfuseInstance: Langfuse | null = null

/**
 * Get or create Langfuse instance
 */
export function getLangfuse(): Langfuse | null {
  if (!aiConfig.langfuse.enabled) {
    console.warn('Langfuse is not enabled. Set LANGFUSE_PUBLIC_KEY and LANGFUSE_SECRET_KEY environment variables.')
    return null
  }

  if (!langfuseInstance) {
    langfuseInstance = new Langfuse({
      publicKey: aiConfig.langfuse.publicKey!,
      secretKey: aiConfig.langfuse.secretKey!,
      baseUrl: aiConfig.langfuse.host,
      flushAt: 1, // Flush immediately for development
      flushInterval: 1000, // Flush every second
    })
  }

  return langfuseInstance
}

/**
 * Shutdown Langfuse client gracefully
 */
export async function shutdownLangfuse() {
  if (langfuseInstance) {
    await langfuseInstance.shutdownAsync()
    langfuseInstance = null
  }
}

/**
 * Create a trace for agent execution
 */
export function createAgentTrace(params: {
  name: string
  userId?: string
  sessionId?: string
  metadata?: Record<string, any>
  tags?: string[]
}) {
  const langfuse = getLangfuse()
  if (!langfuse) return null

  return langfuse.trace({
    name: params.name,
    userId: params.userId,
    sessionId: params.sessionId,
    metadata: params.metadata,
    tags: params.tags,
  })
}

/**
 * Agent Execution Tracer
 * 
 * Comprehensive tracing wrapper for agent execution
 */
export class AgentTracer {
  private trace: LangfuseTraceClient | null
  private currentSpan: LangfuseSpanClient | null = null
  private startTime: number

  constructor(
    agentType: AgentType,
    request: AgentRequest
  ) {
    this.startTime = Date.now()
    this.trace = createAgentTrace({
      name: `${agentType}-agent`,
      userId: request.userId,
      sessionId: request.conversationId,
      metadata: {
        agentType,
        requestId: request.id,
        message: request.message,
        context: request.context,
        streaming: request.streaming,
        maxSteps: request.maxSteps,
      },
      tags: [agentType, 'agent-execution'],
    })
  }

  /**
   * Start a new span for a phase of execution
   */
  startSpan(name: string, metadata?: Record<string, any>): LangfuseSpanClient | null {
    if (!this.trace) return null

    this.currentSpan = this.trace.span({
      name,
      metadata,
      startTime: new Date(),
    })

    return this.currentSpan
  }

  /**
   * End the current span
   */
  endSpan(output?: any, metadata?: Record<string, any>) {
    if (this.currentSpan) {
      this.currentSpan.end({
        output,
        metadata,
      })
      this.currentSpan = null
    }
  }

  /**
   * Track a generation (LLM call)
   */
  trackGeneration(params: {
    name: string
    model: string
    input: any
    output?: string
    usage?: {
      promptTokens: number
      completionTokens: number
      totalTokens: number
    }
    metadata?: Record<string, any>
  }): LangfuseGenerationClient | null {
    if (!this.trace) return null

    const generation = this.trace.generation({
      name: params.name,
      model: params.model,
      input: params.input,
      output: params.output,
      usage: params.usage ? {
        promptTokens: params.usage.promptTokens,
        completionTokens: params.usage.completionTokens,
        totalTokens: params.usage.totalTokens,
      } : undefined,
      metadata: params.metadata,
    })

    // Calculate and add cost
    if (params.usage) {
      const cost = calculateCost(
        params.model,
        params.usage.promptTokens,
        params.usage.completionTokens
      )
      generation.update({
        metadata: {
          ...params.metadata,
          cost,
        },
      })
    }

    return generation
  }

  /**
   * Track tool invocation
   */
  trackToolInvocation(tool: ToolInvocation) {
    if (!this.trace) return

    const span = this.trace.span({
      name: `tool:${tool.toolName}`,
      metadata: {
        toolName: tool.toolName,
        parameters: tool.parameters,
        result: tool.result,
        error: tool.error,
        latency: tool.latency,
        confirmationRequired: tool.confirmationRequired,
        confirmed: tool.confirmed,
      },
      startTime: new Date(tool.timestamp.getTime() - tool.latency),
    })

    // End the span immediately
    span.end({
      output: tool.result,
    })

    if (tool.error) {
      span.update({
        statusMessage: tool.error.message,
      })
    }
  }

  /**
   * Track agent step
   */
  trackStep(step: AgentStep) {
    if (!this.trace) return

    const span = this.trace.span({
      name: `step-${step.stepNumber}`,
      metadata: {
        stepNumber: step.stepNumber,
        type: step.type,
        description: step.description,
        toolCalls: step.toolCalls?.length || 0,
        duration: step.duration,
      },
      startTime: step.timestamp,
    })

    // End span immediately
    span.end({
      output: step.response,
    })

    if (step.error) {
      span.update({
        statusMessage: step.error.message,
      })
    }

    // Track individual tool calls within the step
    if (step.toolCalls) {
      for (const toolCall of step.toolCalls) {
        const toolSpan = this.trace.span({
          name: `tool:${toolCall.toolName}`,
          metadata: {
            toolName: toolCall.toolName,
            parameters: toolCall.parameters,
          },
          startTime: toolCall.timestamp,
        })
        toolSpan.end()
      }
    }
  }

  /**
   * Complete the trace with final response
   */
  complete(response: AgentResponse) {
    if (!this.trace) return

    const duration = Date.now() - this.startTime

    this.trace.update({
      output: {
        content: response.content,
        status: response.status,
        steps: response.steps.length,
        toolInvocations: response.toolInvocations.length,
      },
      metadata: {
        duration,
        usage: response.usage,
        cost: response.cost,
        status: response.status,
        error: response.error,
      },
      tags: [
        response.agentType,
        response.status,
        response.error ? 'error' : 'success',
      ],
    })

    // Track all tool invocations
    for (const tool of response.toolInvocations) {
      this.trackToolInvocation(tool)
    }

    // Track all steps
    for (const step of response.steps) {
      this.trackStep(step)
    }
  }

  /**
   * Mark trace as failed
   */
  fail(error: Error, metadata?: Record<string, any>) {
    if (!this.trace) return

    this.trace.update({
      metadata: {
        ...metadata,
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
      },
      tags: ['error', 'failed'],
    })
  }

  /**
   * Add event to trace
   */
  event(name: string, metadata?: Record<string, any>) {
    if (!this.trace) return

    this.trace.event({
      name,
      metadata,
    })
  }

  /**
   * Get trace ID for reference
   */
  getTraceId(): string | null {
    return this.trace?.id || null
  }
}

/**
 * Helper to track token usage and costs
 */
export function calculateCost(
  model: string,
  promptTokens: number,
  completionTokens: number
): number {
  const costs = aiConfig.costs

  let inputCost = 0
  let outputCost = 0

  if (model.includes('gpt-4-turbo') || model.includes('gpt-4')) {
    inputCost = costs.gpt4.input
    outputCost = costs.gpt4.output
  } else if (model.includes('gpt-4o-mini')) {
    inputCost = costs.gpt4mini.input
    outputCost = costs.gpt4mini.output
  } else if (model.includes('claude-opus')) {
    inputCost = costs.claudeOpus.input
    outputCost = costs.claudeOpus.output
  } else if (model.includes('claude-sonnet')) {
    inputCost = costs.claudeSonnet.input
    outputCost = costs.claudeSonnet.output
  } else if (model.includes('claude') && model.includes('haiku')) {
    inputCost = costs.claudeHaiku.input
    outputCost = costs.claudeHaiku.output
  }

  // Calculate cost per million tokens
  const totalCost = (promptTokens * inputCost + completionTokens * outputCost) / 1000000

  return totalCost
}

/**
 * Wrapper function to trace agent execution
 */
export async function traceAgentExecution<T>(
  agentType: AgentType,
  request: AgentRequest,
  executeFn: (tracer: AgentTracer) => Promise<T>
): Promise<T> {
  const tracer = new AgentTracer(agentType, request)

  try {
    const result = await executeFn(tracer)
    return result
  } catch (error) {
    tracer.fail(error as Error)
    throw error
  }
}

/**
 * Track RAG retrieval
 */
export function trackRAGRetrieval(
  trace: LangfuseTraceClient | null,
  params: {
    query: string
    results: any[]
    retrievalTime: number
    metadata?: Record<string, any>
  }
) {
  if (!trace) return

  trace.span({
    name: 'rag-retrieval',
    metadata: {
      query: params.query,
      resultCount: params.results.length,
      retrievalTime: params.retrievalTime,
      ...params.metadata,
    },
    input: { query: params.query },
    output: { results: params.results },
  })
}

/**
 * Track embedding generation
 */
export function trackEmbedding(
  trace: LangfuseTraceClient | null,
  params: {
    text: string
    model: string
    dimensions: number
    duration: number
  }
) {
  if (!trace) return

  trace.span({
    name: 'embedding-generation',
    metadata: {
      model: params.model,
      dimensions: params.dimensions,
      duration: params.duration,
      textLength: params.text.length,
    },
  })
}

/**
 * Batch tracking for multiple operations
 */
export class BatchTracker {
  private operations: Array<{
    name: string
    startTime: number
    endTime?: number
    metadata?: Record<string, any>
  }> = []

  start(name: string, metadata?: Record<string, any>) {
    this.operations.push({
      name,
      startTime: Date.now(),
      metadata,
    })
  }

  end(name: string, metadata?: Record<string, any>) {
    const op = this.operations.find((o) => o.name === name && !o.endTime)
    if (op) {
      op.endTime = Date.now()
      op.metadata = { ...op.metadata, ...metadata }
    }
  }

  getMetrics() {
    return this.operations.map((op) => ({
      name: op.name,
      duration: op.endTime ? op.endTime - op.startTime : null,
      metadata: op.metadata,
    }))
  }

  logToTrace(trace: LangfuseTraceClient | null) {
    if (!trace) return

    for (const op of this.operations) {
      if (op.endTime) {
        const span = trace.span({
          name: op.name,
          metadata: {
            ...op.metadata,
            duration: op.endTime - op.startTime,
          },
          startTime: new Date(op.startTime),
        })
        span.end()
      }
    }
  }
}
