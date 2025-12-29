/**
 * Intervention Agent
 * 
 * Specialized agent for proactive academic support and early intervention
 * for at-risk student-athletes
 */

import { BaseAgent } from '../lib/base-agent'
import { globalToolRegistry } from '../lib/tool-registry'
import { getToolsForAgentType } from '../tools'
import { INTERVENTION_AGENT_PROMPT } from '../lib/prompt-templates'
import type { AgentConfig, AgentRequest, ToolExecutionContext } from '../types/agent.types'
import type { CoreTool } from 'ai'

/**
 * Intervention Agent Configuration
 */
const INTERVENTION_AGENT_CONFIG: AgentConfig = {
  type: 'intervention',
  name: 'Academic Intervention Agent',
  description: 'Proactive academic support specialist for identifying and supporting at-risk student-athletes',
  systemPrompt: INTERVENTION_AGENT_PROMPT,
  tools: getToolsForAgentType('intervention'),
  model: {
    provider: 'openai',
    name: 'gpt-5.1-codex-max',
    temperature: 0.7,
    maxTokens: 4096,
  },
  maxSteps: 12, // More steps for complex intervention planning
  streaming: true,
  memoryEnabled: true,
  rateLimits: {
    requestsPerMinute: 60,
    tokensPerDay: 1000000,
  },
}

/**
 * Intervention Agent Class
 * 
 * Handles academic intervention including:
 * - Risk assessment and identification
 * - Performance trend analysis
 * - Personalized intervention planning
 * - Resource connection (tutoring, mentoring)
 * - Follow-up scheduling
 * - Progress monitoring
 */
export class InterventionAgent extends BaseAgent {
  constructor() {
    super(INTERVENTION_AGENT_CONFIG)
  }

  /**
   * Get system prompt for intervention agent
   */
  protected getSystemPrompt(): string {
    return this.config.systemPrompt
  }

  /**
   * Get tools for intervention agent
   */
  protected getTools(): Record<string, CoreTool> {
    // Create minimal context for tool registration
    // Full context will be set during execute()
    const context: ToolExecutionContext = {
      userId: '',
      userRoles: this.getUserRoles(),
      agentState: {} as any,
      requestConfirmation: this.requestConfirmation.bind(this),
    }

    return globalToolRegistry.toAISDKTools(this.config.tools, context)
  }

  /**
   * Get user roles
   */
  protected getUserRoles(): string[] {
    // TODO: Get actual user roles from authentication context
    return ['advisor', 'compliance_officer']
  }

  /**
   * Request user confirmation
   */
  protected async requestConfirmation(message: string): Promise<boolean> {
    console.log(`Confirmation requested: ${message}`)
    return true
  }

  /**
   * Override execute to set context
   * Note: Context is set in getTools() and updated during execution
   */
  async execute(request: AgentRequest) {
    return super.execute(request)
  }

  /**
   * Intervention-specific workflow helpers
   */

  /**
   * Assess student risk
   */
  async assessRisk(params: {
    studentId: string
    timeframe?: 'current' | 'semester' | 'year' | 'all'
  }) {
    const request: AgentRequest = {
      userId: params.studentId,
      agentType: 'intervention',
      message: `Can you assess the academic risk level for student ${params.studentId}? ${
        params.timeframe ? `Focus on ${params.timeframe} performance.` : ''
      }`,
      context: {
        studentId: params.studentId,
        timeframe: params.timeframe,
        assessmentType: 'risk',
      },
    }

    return this.execute(request)
  }

  /**
   * Generate intervention plan
   */
  async generateInterventionPlan(params: {
    studentId: string
    concerns: string[]
    urgency: 'low' | 'medium' | 'high'
  }) {
    const request: AgentRequest = {
      userId: params.studentId,
      agentType: 'intervention',
      message: `Student ${params.studentId} needs an intervention plan. Concerns: ${params.concerns.join(', ')}. Urgency: ${params.urgency}.`,
      context: {
        studentId: params.studentId,
        concerns: params.concerns,
        urgency: params.urgency,
        planType: 'intervention',
      },
    }

    return this.execute(request)
  }

  /**
   * Schedule follow-up
   */
  async scheduleFollowUp(params: {
    studentId: string
    reason: string
    suggestedDate?: string
  }) {
    const request: AgentRequest = {
      userId: params.studentId,
      agentType: 'intervention',
      message: `Schedule a follow-up meeting with student ${params.studentId}. Reason: ${params.reason}. ${
        params.suggestedDate ? `Suggested date: ${params.suggestedDate}` : ''
      }`,
      context: {
        studentId: params.studentId,
        reason: params.reason,
        suggestedDate: params.suggestedDate,
        actionType: 'schedule_followup',
      },
    }

    return this.execute(request)
  }

  /**
   * Connect to resources
   */
  async connectToResources(params: {
    studentId: string
    needs: string[]
  }) {
    const request: AgentRequest = {
      userId: params.studentId,
      agentType: 'intervention',
      message: `Student ${params.studentId} needs help with: ${params.needs.join(', ')}. Can you connect them with appropriate resources?`,
      context: {
        studentId: params.studentId,
        needs: params.needs,
        actionType: 'resource_connection',
      },
    }

    return this.execute(request)
  }

  /**
   * Monitor progress
   */
  async monitorProgress(params: {
    studentId: string
    since?: string
  }) {
    const request: AgentRequest = {
      userId: params.studentId,
      agentType: 'intervention',
      message: `Can you review the progress for student ${params.studentId}? ${
        params.since ? `Since ${params.since}.` : ''
      } Are there any improvements or new concerns?`,
      context: {
        studentId: params.studentId,
        since: params.since,
        actionType: 'progress_monitoring',
      },
    }

    return this.execute(request)
  }

  /**
   * Send outreach
   */
  async sendOutreach(params: {
    studentId: string
    message: string
    channel: 'email' | 'sms' | 'push'
  }) {
    const request: AgentRequest = {
      userId: params.studentId,
      agentType: 'intervention',
      message: `Send outreach to student ${params.studentId} via ${params.channel}: "${params.message}"`,
      context: {
        studentId: params.studentId,
        outreachMessage: params.message,
        channel: params.channel,
        actionType: 'outreach',
      },
    }

    return this.execute(request)
  }
}

/**
 * Create intervention agent instance
 */
export function createInterventionAgent(): InterventionAgent {
  return new InterventionAgent()
}

/**
 * Execute intervention workflow
 */
export async function executeInterventionWorkflow(request: AgentRequest) {
  const agent = createInterventionAgent()
  return agent.execute(request)
}
