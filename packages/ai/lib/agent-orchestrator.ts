/**
 * Agent Orchestrator
 * 
 * Coordinates agent selection, execution, and multi-agent workflows
 * Implements intelligent routing and state management
 */

import { createAgent, createGeneralAssistant } from '../agents'
import { AgentTracer } from './langfuse-client'
import type {
  AgentType,
  AgentRequest,
  AgentResponse,
  AgentState,
  MultiAgentWorkflow,
  AgentCollaborationContext,
} from '../types/agent.types'

/**
 * Orchestrator Configuration
 */
export interface OrchestratorConfig {
  /** Enable automatic agent routing */
  autoRoute?: boolean
  
  /** Enable multi-agent workflows */
  enableMultiAgent?: boolean
  
  /** Maximum agents in a workflow */
  maxAgentsPerWorkflow?: number
  
  /** Timeout for agent execution (ms) */
  executionTimeout?: number
  
  /** Enable fallback to general assistant */
  enableFallback?: boolean
}

/**
 * Workflow execution result
 */
export interface WorkflowResult {
  /** Primary response */
  response: AgentResponse
  
  /** Agents involved */
  agentsUsed: AgentType[]
  
  /** Workflow state */
  workflowState?: MultiAgentWorkflow
  
  /** Total duration */
  totalDuration: number
  
  /** Total cost */
  totalCost: number
  
  /** Success status */
  success: boolean
}

/**
 * Agent Orchestrator Class
 * 
 * Manages agent lifecycle, routing, and coordination
 */
export class AgentOrchestrator {
  private config: OrchestratorConfig
  private activeWorkflows: Map<string, MultiAgentWorkflow> = new Map()

  constructor(config: OrchestratorConfig = {}) {
    this.config = {
      autoRoute: true,
      enableMultiAgent: true,
      maxAgentsPerWorkflow: 3,
      executionTimeout: 60000, // 60 seconds
      enableFallback: true,
      ...config,
    }
  }

  /**
   * Execute workflow with automatic agent selection
   */
  async executeWorkflow(request: AgentRequest): Promise<WorkflowResult> {
    const startTime = Date.now()
    const workflowId = `workflow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    try {
      // Determine agent type
      let agentType = request.agentType

      if (this.config.autoRoute && !agentType) {
        agentType = await this.classifyIntent(request.message, request.context)
      }

      // Execute single agent workflow
      const result = await this.executeSingleAgent(agentType, request)

      return {
        response: result,
        agentsUsed: [agentType],
        totalDuration: Date.now() - startTime,
        totalCost: result.cost,
        success: result.status === 'completed',
      }
    } catch (error) {
      // Fallback to general assistant if enabled
      if (this.config.enableFallback) {
        console.warn('Primary agent failed, falling back to general assistant:', error)
        
        const fallbackResult = await this.executeSingleAgent('general', request)
        
        return {
          response: fallbackResult,
          agentsUsed: ['general'],
          totalDuration: Date.now() - startTime,
          totalCost: fallbackResult.cost,
          success: fallbackResult.status === 'completed',
        }
      }

      throw error
    }
  }

  /**
   * Execute single agent
   */
  async executeSingleAgent(
    agentType: AgentType,
    request: AgentRequest
  ): Promise<AgentResponse> {
    // Create agent instance
    const agent = createAgent(agentType)

    // Set timeout
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Agent execution timeout after ${this.config.executionTimeout}ms`))
      }, this.config.executionTimeout)
    })

    // Execute with timeout
    const response = await Promise.race([
      agent.execute({ ...request, agentType }),
      timeoutPromise,
    ])

    return response
  }

  /**
   * Execute multi-agent workflow
   * 
   * Coordinates multiple agents working together on a complex task
   */
  async executeMultiAgent(
    request: AgentRequest,
    agentSequence: AgentType[]
  ): Promise<WorkflowResult> {
    if (!this.config.enableMultiAgent) {
      throw new Error('Multi-agent workflows are disabled')
    }

    if (agentSequence.length > this.config.maxAgentsPerWorkflow!) {
      throw new Error(
        `Too many agents in workflow. Max: ${this.config.maxAgentsPerWorkflow}`
      )
    }

    const startTime = Date.now()
    const workflowId = `workflow-${Date.now()}`

    // Initialize workflow state
    const workflow: MultiAgentWorkflow = {
      id: workflowId,
      name: `Multi-agent workflow: ${agentSequence.join(' → ')}`,
      agents: agentSequence,
      currentAgent: agentSequence[0],
      state: {
        originalRequest: request,
        agentResults: {},
        sharedContext: request.context || {},
      },
      stepsCompleted: 0,
      status: 'running',
    }

    this.activeWorkflows.set(workflowId, workflow)

    const responses: AgentResponse[] = []
    let totalCost = 0

    try {
      // Execute agents sequentially
      for (let i = 0; i < agentSequence.length; i++) {
        const agentType = agentSequence[i]
        workflow.currentAgent = agentType

        // Build context from previous agents
        const collaborationContext: AgentCollaborationContext = {
          workflowId,
          previousResults: workflow.state.agentResults,
          sharedContext: workflow.state.sharedContext,
          strategy: 'sequential',
        }

        // Create request for this agent
        const agentRequest: AgentRequest = {
          ...request,
          agentType,
          context: {
            ...request.context,
            collaboration: collaborationContext,
            previousAgent: i > 0 ? agentSequence[i - 1] : undefined,
            nextAgent: i < agentSequence.length - 1 ? agentSequence[i + 1] : undefined,
          },
        }

        // Execute agent
        const response = await this.executeSingleAgent(agentType, agentRequest)

        responses.push(response)
        totalCost += response.cost

        // Store result in workflow state
        workflow.state.agentResults[agentType] = {
          response: response.content,
          toolsUsed: response.toolInvocations.map((t) => t.toolName),
          duration: response.duration,
          cost: response.cost,
        }

        workflow.stepsCompleted++

        // Check if workflow should continue
        if (response.status === 'failed') {
          workflow.status = 'failed'
          break
        }
      }

      workflow.status = 'completed'

      // Return final agent's response as primary
      const finalResponse = responses[responses.length - 1]

      return {
        response: finalResponse,
        agentsUsed: agentSequence,
        workflowState: workflow,
        totalDuration: Date.now() - startTime,
        totalCost,
        success: workflow.status === 'completed',
      }
    } catch (error) {
      workflow.status = 'failed'
      throw error
    } finally {
      this.activeWorkflows.delete(workflowId)
    }
  }

  /**
   * Classify intent and determine appropriate agent
   */
  async classifyIntent(
    message: string,
    context?: Record<string, any>
  ): Promise<AgentType> {
    // Use general assistant for classification
    const assistant = createGeneralAssistant()
    const routing = await assistant.classifyAndRoute(message)

    // Log classification
    console.log('Intent classification:', {
      message: message.substring(0, 100),
      intent: routing.intent,
      confidence: routing.confidence,
      recommendedAgent: routing.recommendedAgent,
    })

    return routing.recommendedAgent
  }

  /**
   * Execute with automatic retry on failure
   */
  async executeWithRetry(
    request: AgentRequest,
    maxRetries: number = 2
  ): Promise<WorkflowResult> {
    let lastError: Error | undefined

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await this.executeWorkflow(request)
      } catch (error) {
        lastError = error as Error
        console.warn(`Attempt ${attempt + 1} failed:`, error)

        // Don't retry on last attempt
        if (attempt === maxRetries - 1) {
          throw lastError
        }

        // Wait before retry (exponential backoff)
        await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, attempt)))
      }
    }

    throw lastError || new Error('Max retries exceeded')
  }

  /**
   * Get active workflow by ID
   */
  getWorkflow(workflowId: string): MultiAgentWorkflow | undefined {
    return this.activeWorkflows.get(workflowId)
  }

  /**
   * Cancel active workflow
   */
  cancelWorkflow(workflowId: string): boolean {
    const workflow = this.activeWorkflows.get(workflowId)
    if (workflow) {
      workflow.status = 'cancelled'
      this.activeWorkflows.delete(workflowId)
      return true
    }
    return false
  }

  /**
   * Get all active workflows
   */
  getActiveWorkflows(): MultiAgentWorkflow[] {
    return Array.from(this.activeWorkflows.values())
  }

  /**
   * Suggest multi-agent workflow for complex queries
   */
  suggestWorkflow(message: string): AgentType[] | null {
    const messageLower = message.toLowerCase()

    // Course selection with eligibility check
    if (
      (messageLower.includes('course') || messageLower.includes('class')) &&
      (messageLower.includes('eligib') || messageLower.includes('ncaa'))
    ) {
      return ['compliance', 'advising']
    }

    // At-risk student needing intervention and advising
    if (
      (messageLower.includes('struggling') || messageLower.includes('failing')) &&
      (messageLower.includes('course') || messageLower.includes('help'))
    ) {
      return ['intervention', 'advising']
    }

    // Comprehensive student review
    if (
      messageLower.includes('review') &&
      (messageLower.includes('progress') || messageLower.includes('status'))
    ) {
      return ['compliance', 'advising', 'intervention']
    }

    // Travel with notification
    if (messageLower.includes('travel') && messageLower.includes('notify')) {
      return ['administrative', 'advising']
    }

    // No multi-agent workflow needed
    return null
  }

  /**
   * Execute smart workflow (auto-detects if multi-agent is needed)
   */
  async executeSmartWorkflow(request: AgentRequest): Promise<WorkflowResult> {
    // Check if multi-agent workflow is suggested
    const suggestedWorkflow = this.suggestWorkflow(request.message)

    if (suggestedWorkflow && this.config.enableMultiAgent) {
      console.log('Executing multi-agent workflow:', suggestedWorkflow)
      return this.executeMultiAgent(request, suggestedWorkflow)
    }

    // Execute single agent workflow
    return this.executeWorkflow(request)
  }
}

/**
 * Create orchestrator instance
 */
export function createOrchestrator(config?: OrchestratorConfig): AgentOrchestrator {
  return new AgentOrchestrator(config)
}

/**
 * Global orchestrator instance
 */
export const globalOrchestrator = createOrchestrator()

/**
 * Convenience function for executing workflows
 */
export async function executeAgentWorkflow(
  request: AgentRequest
): Promise<WorkflowResult> {
  return globalOrchestrator.executeWorkflow(request)
}

/**
 * Convenience function for smart workflow execution
 */
export async function executeSmartWorkflow(
  request: AgentRequest
): Promise<WorkflowResult> {
  return globalOrchestrator.executeSmartWorkflow(request)
}
