/**
 * Base Agent Class
 * 
 * Abstract base class for all AI agents with common functionality
 */

import { streamText, generateText, type CoreMessage, type CoreTool } from 'ai'
import type {
  AgentType,
  AgentRequest,
  AgentResponse,
  AgentState,
  AgentConfig,
  AgentStep,
  ToolInvocation,
  AgentStatus,
} from '../types/agent.types'
import { selectModel } from './providers'
import { createAgentTrace, calculateCost } from './langfuse-client'
import { AgentError, toAgentError } from './errors'
import { sanitizeInput, validateOutput } from './safety'
import { compressMessagesSimple } from './agent-utils'

/**
 * Abstract base agent class
 */
export abstract class BaseAgent {
  protected config: AgentConfig

  constructor(config: AgentConfig) {
    this.config = config
  }

  /**
   * Get agent type
   */
  get type(): AgentType {
    return this.config.type
  }

  /**
   * Get agent name
   */
  get name(): string {
    return this.config.name
  }

  /**
   * Get system prompt
   */
  protected getSystemPrompt(): string {
    return this.config.systemPrompt
  }

  /**
   * Get available tools for this agent
   * Must be implemented by subclasses
   */
  protected abstract getTools(): Record<string, CoreTool>

  /**
   * Execute agent with streaming
   */
  async executeStreaming(request: AgentRequest): Promise<AsyncIterable<any>> {
    const { AgentTracer } = await import('./langfuse-client')
    const tracer = new AgentTracer(this.config.type, request)

    try {
      // Validate request
      this.validateRequest(request)

      // Initialize state
      tracer.startSpan('initialize-state')
      const state = await this.initializeState(request)
      tracer.endSpan({ stateId: state.id })

      // Get model
      const model = this.selectModel(request)

      // Get tools
      tracer.startSpan('load-tools')
      const tools = this.getTools()
      tracer.endSpan({ toolCount: Object.keys(tools).length })

      // Prepare messages
      const messages: CoreMessage[] = [
        { role: 'system', content: this.getSystemPrompt() },
        ...state.messages,
        { role: 'user', content: request.message },
      ]

      // Execute with streaming
      tracer.startSpan('llm-streaming')
      const result = await streamText({
        model,
        messages,
        tools,
        maxSteps: request.maxSteps || this.config.maxSteps,
        onStepFinish: async (step) => {
          await this.onStepFinish(state, step)
          // Track each step as it completes
          const agentStep = state.stepHistory[state.stepHistory.length - 1]
          if (agentStep) {
            tracer.trackStep(agentStep)
          }
        },
      })

      // Track generation start
      const generation = tracer.trackGeneration({
        name: 'agent-streaming',
        model: this.config.model.name,
        input: messages,
        metadata: {
          streaming: true,
          maxSteps: request.maxSteps || this.config.maxSteps,
        },
      })

      // Wrap stream to track completion
      const wrappedStream = this.wrapStreamWithTracking(
        result.textStream,
        tracer,
        generation,
        state
      )

      return wrappedStream
    } catch (error) {
      const agentError = toAgentError(error)
      tracer.fail(agentError)
      throw agentError
    }
  }

  /**
   * Wrap stream with tracking
   */
  private async *wrapStreamWithTracking(
    stream: AsyncIterable<any>,
    tracer: any,
    generation: any,
    state: AgentState
  ): AsyncIterable<any> {
    let fullText = ''
    let tokenCount = 0

    try {
      for await (const chunk of stream) {
        fullText += chunk
        tokenCount++
        yield chunk
      }

      // Update generation with final output
      if (generation) {
        generation.end({
          output: fullText,
          metadata: {
            streamedChunks: tokenCount,
            finalSteps: state.stepHistory.length,
          },
        })
      }

      tracer.endSpan({ fullText, tokenCount })
    } catch (error) {
      tracer.fail(error as Error)
      throw error
    }
  }

  /**
   * Execute agent without streaming
   */
  async execute(request: AgentRequest): Promise<AgentResponse> {
    const startTime = Date.now()
    const { AgentTracer } = await import('./langfuse-client')
    const tracer = new AgentTracer(this.config.type, request)

    try {
      // Sanitize input
      const { sanitized, warnings, blocked } = sanitizeInput(request.message, {
        removePII: true,
        checkInjection: true,
        checkHarmful: true,
      })

      if (blocked) {
        throw new Error('Input blocked due to safety concerns')
      }

      if (warnings.length > 0) {
        tracer.event('input-sanitization-warnings', { warnings })
      }

      // Use sanitized message
      const sanitizedRequest = { ...request, message: sanitized }

      // Validate request
      this.validateRequest(sanitizedRequest)

      // Initialize state
      tracer.startSpan('initialize-state')
      const state = await this.initializeState(request)
      tracer.endSpan({ stateId: state.id })

      // Get model
      const model = this.selectModel(request)

      // Get tools
      tracer.startSpan('load-tools')
      const tools = this.getTools()
      tracer.endSpan({ toolCount: Object.keys(tools).length })

      // Prepare messages
      const messages: CoreMessage[] = [
        { role: 'system', content: this.getSystemPrompt() },
        ...state.messages,
        { role: 'user', content: request.message },
      ]

      // Execute with generation tracking
      tracer.startSpan('llm-execution')
      const result = await generateText({
        model,
        messages,
        tools,
        maxSteps: request.maxSteps || this.config.maxSteps,
        onStepFinish: async (step) => {
          await this.onStepFinish(state, step)
        },
      })
      tracer.endSpan()

      // Track generation in Langfuse
      tracer.trackGeneration({
        name: 'agent-execution',
        model: this.config.model.name,
        input: messages,
        output: result.text,
        usage: {
          promptTokens: result.usage.promptTokens,
          completionTokens: result.usage.completionTokens,
          totalTokens: result.usage.totalTokens,
        },
        metadata: {
          maxSteps: request.maxSteps || this.config.maxSteps,
          actualSteps: state.stepHistory.length,
        },
      })

      // Calculate metrics
      const duration = Date.now() - startTime
      const cost = calculateCost(
        this.config.model.name,
        result.usage.promptTokens,
        result.usage.completionTokens
      )

      // Validate output
      const { valid, issues, sanitized: sanitizedOutput } = validateOutput(result.text)

      if (!valid) {
        tracer.event('output-validation-issues', { issues })
      }

      // Build response
      const response: AgentResponse = {
        requestId: sanitizedRequest.id || crypto.randomUUID(),
        agentType: this.config.type,
        content: sanitizedOutput, // Use sanitized output
        steps: state.stepHistory,
        toolInvocations: this.extractToolInvocations(result),
        usage: {
          promptTokens: result.usage.promptTokens,
          completionTokens: result.usage.completionTokens,
          totalTokens: result.usage.totalTokens,
        },
        cost,
        duration,
        status: 'completed',
      }

      // Complete trace
      tracer.complete(response)

      return response
    } catch (error) {
      const agentError = toAgentError(error)
      const duration = Date.now() - startTime

      // Mark trace as failed
      tracer.fail(agentError, {
        duration,
        agentType: this.config.type,
      })

      // Return error response
      return {
        requestId: request.id || crypto.randomUUID(),
        agentType: this.config.type,
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
  }

  /**
   * Initialize agent state
   */
  protected async initializeState(request: AgentRequest): Promise<AgentState> {
    return {
      id: crypto.randomUUID(),
      userId: request.userId,
      agentType: this.config.type,
      status: 'running',
      currentStep: 0,
      maxSteps: request.maxSteps || this.config.maxSteps,
      messages: [],
      toolResults: [],
      stepHistory: [],
      metadata: request.context || {},
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  }

  /**
   * Select model based on request
   */
  protected selectModel(request: AgentRequest) {
    const complexity = request.modelPreference?.complexity || 'moderate'
    const provider = request.modelPreference?.provider || this.config.model.provider

    return selectModel(complexity, provider)
  }

  /**
   * Prepare messages with caching and compression
   */
  protected async prepareMessages(request: AgentRequest, state: AgentState): Promise<CoreMessage[]> {
    const systemPrompt = this.getSystemPrompt()
    const contextStr = request.context ? JSON.stringify(request.context, null, 2) : ''

    const messages: CoreMessage[] = []

    // For Claude, use prompt caching
    const isClaudeModel = this.config.model.name.includes('claude')
    
    if (isClaudeModel) {
      // System prompt with cache control
      // Note: cache_control is Anthropic-specific and not in CoreMessage type
      // Using 'as any' to bypass type checking for provider-specific features
      messages.push({
        role: 'system',
        content: systemPrompt,
      } as CoreMessage)

      // Context with cache control if present
      if (contextStr) {
        messages.push({
          role: 'system',
          content: `<context>\n${contextStr}\n</context>`,
        } as CoreMessage)
      }
      
      // TODO: Implement proper cache_control when AI SDK supports it
      // For now, caching benefits come from consistent system prompts
    } else {
      // Standard system prompt for non-Claude models
      messages.push({ role: 'system', content: systemPrompt })
      if (contextStr) {
        messages.push({ role: 'system', content: `<context>\n${contextStr}\n</context>` })
      }
    }

    // Compress conversation history if needed
    let conversationMessages = state.messages
    if (conversationMessages.length > 10) {
      conversationMessages = compressMessagesSimple(conversationMessages, 2, 5)
    }

    // Add conversation history
    messages.push(...conversationMessages)

    // Add current message
    messages.push({ role: 'user', content: request.message })

    return messages
  }

  /**
   * Validate request
   */
  protected validateRequest(request: AgentRequest): void {
    if (!request.userId) {
      throw new Error('userId is required')
    }
    if (!request.message) {
      throw new Error('message is required')
    }
  }

  /**
   * Extract tool invocations from result
   */
  protected extractToolInvocations(result: any): ToolInvocation[] {
    const invocations: ToolInvocation[] = []

    if (result.steps) {
      for (const step of result.steps) {
        if (step.toolCalls) {
          for (const toolCall of step.toolCalls) {
            invocations.push({
              id: toolCall.toolCallId,
              toolName: toolCall.toolName,
              parameters: toolCall.args,
              result: toolCall.result,
              latency: 0, // Would need to track this separately
              timestamp: new Date(),
            })
          }
        }
      }
    }

    return invocations
  }

  /**
   * Handle step finish
   */
  protected async onStepFinish(state: AgentState, step: any): Promise<void> {
    state.currentStep++
    state.updatedAt = new Date()

    // Create step record
    const agentStep: AgentStep = {
      stepNumber: state.currentStep,
      type: this.determineStepType(step),
      description: this.getStepDescription(step),
      toolCalls: step.toolCalls?.map((tc: any) => ({
        id: tc.toolCallId,
        toolName: tc.toolName,
        parameters: tc.args,
        timestamp: new Date(),
      })),
      response: step.text,
      timestamp: new Date(),
    }

    state.stepHistory.push(agentStep)

    // Hook for subclasses
    await this.onStepComplete(state, agentStep)
  }

  /**
   * Hook for subclasses to handle step completion
   */
  protected async onStepComplete(state: AgentState, step: AgentStep): Promise<void> {
    // Override in subclasses if needed
  }

  /**
   * Determine step type
   */
  protected determineStepType(step: any): AgentStep['type'] {
    if (step.toolCalls && step.toolCalls.length > 0) {
      return 'tool_call'
    }
    if (step.text) {
      return 'response'
    }
    return 'thinking'
  }

  /**
   * Get step description
   */
  protected getStepDescription(step: any): string {
    if (step.toolCalls && step.toolCalls.length > 0) {
      const toolNames = step.toolCalls.map((tc: any) => tc.toolName).join(', ')
      return `Invoking tools: ${toolNames}`
    }
    if (step.text) {
      return 'Generating response'
    }
    return 'Thinking...'
  }
}
