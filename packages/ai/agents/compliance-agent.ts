/**
 * Compliance Agent
 * 
 * Specialized agent for NCAA Division I compliance, eligibility checking,
 * and rule interpretation
 */

import { BaseAgent } from '../lib/base-agent'
import { globalToolRegistry } from '../lib/tool-registry'
import { getToolsForAgentType } from '../tools'
import { COMPLIANCE_AGENT_PROMPT } from '../lib/prompt-templates'
import type { AgentConfig, AgentRequest, ToolExecutionContext } from '../types/agent.types'
import type { CoreTool } from 'ai'

/**
 * Compliance Agent Configuration
 */
const COMPLIANCE_AGENT_CONFIG: AgentConfig = {
  type: 'compliance',
  name: 'NCAA Compliance Agent',
  description: 'Expert NCAA Division I compliance specialist for eligibility verification and rule interpretation',
  systemPrompt: COMPLIANCE_AGENT_PROMPT,
  tools: getToolsForAgentType('compliance'),
  model: {
    provider: 'anthropic',
    name: 'claude-sonnet-4-20250514',
    temperature: 0.3, // Lower temperature for more precise compliance answers
    maxTokens: 4096,
  },
  maxSteps: 10,
  streaming: true,
  memoryEnabled: true,
  rateLimits: {
    requestsPerMinute: 60,
    tokensPerDay: 1000000,
  },
}

/**
 * Compliance Agent Class
 * 
 * Handles NCAA compliance queries including:
 * - Eligibility verification
 * - Rule interpretation with bylaw citations
 * - Scenario simulation (what-if analysis)
 * - Progress-toward-degree calculations
 * - Compliance history review
 */
export class ComplianceAgent extends BaseAgent {
  constructor() {
    super(COMPLIANCE_AGENT_CONFIG)
  }

  /**
   * Get system prompt for compliance agent
   */
  protected getSystemPrompt(): string {
    return this.config.systemPrompt
  }

  /**
   * Get tools for compliance agent
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
    return ['compliance_officer']
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
   * Compliance-specific workflow helpers
   */

  /**
   * Check student eligibility
   */
  async checkEligibility(params: {
    studentId: string
    sport?: string
    includeDetails?: boolean
  }) {
    const request: AgentRequest = {
      userId: params.studentId,
      agentType: 'compliance',
      message: `Can you check my NCAA eligibility status? ${
        params.sport ? `I play ${params.sport}.` : ''
      } ${params.includeDetails ? 'Please include detailed explanations.' : ''}`,
      context: {
        studentId: params.studentId,
        sport: params.sport,
        includeDetails: params.includeDetails,
      },
    }

    return this.execute(request)
  }

  /**
   * Search NCAA rules
   */
  async searchRules(params: {
    query: string
    maxResults?: number
  }) {
    const request: AgentRequest = {
      userId: 'system',
      agentType: 'compliance',
      message: `Can you find NCAA rules about: ${params.query}`,
      context: {
        query: params.query,
        maxResults: params.maxResults,
      },
    }

    return this.execute(request)
  }

  /**
   * Simulate scenario
   */
  async simulateScenario(params: {
    studentId: string
    scenario: {
      dropCourse?: string
      addCourse?: string
      projectedGrades?: Record<string, string>
      withdrawFromSemester?: boolean
    }
  }) {
    const scenarioDesc: string[] = []
    if (params.scenario.dropCourse) {
      scenarioDesc.push(`drop ${params.scenario.dropCourse}`)
    }
    if (params.scenario.addCourse) {
      scenarioDesc.push(`add ${params.scenario.addCourse}`)
    }
    if (params.scenario.withdrawFromSemester) {
      scenarioDesc.push('withdraw from this semester')
    }

    const request: AgentRequest = {
      userId: params.studentId,
      agentType: 'compliance',
      message: `What would happen to my eligibility if I ${scenarioDesc.join(' and ')}?`,
      context: {
        studentId: params.studentId,
        scenario: params.scenario,
      },
    }

    return this.execute(request)
  }

  /**
   * Calculate progress toward degree
   */
  async calculateProgress(params: {
    studentId: string
    projectedCredits?: number
  }) {
    const request: AgentRequest = {
      userId: params.studentId,
      agentType: 'compliance',
      message: `Can you calculate my progress-toward-degree percentage? ${
        params.projectedCredits
          ? `Include ${params.projectedCredits} projected credits from this semester.`
          : ''
      }`,
      context: {
        studentId: params.studentId,
        projectedCredits: params.projectedCredits,
      },
    }

    return this.execute(request)
  }

  /**
   * Review compliance history
   */
  async reviewHistory(params: {
    studentId: string
    includeViolations?: boolean
  }) {
    const request: AgentRequest = {
      userId: params.studentId,
      agentType: 'compliance',
      message: `Can you review my compliance history? ${
        params.includeViolations ? 'Include any violations if present.' : ''
      }`,
      context: {
        studentId: params.studentId,
        includeViolations: params.includeViolations,
      },
    }

    return this.execute(request)
  }
}

/**
 * Create compliance agent instance
 */
export function createComplianceAgent(): ComplianceAgent {
  return new ComplianceAgent()
}

/**
 * Execute compliance workflow
 */
export async function executeComplianceWorkflow(request: AgentRequest) {
  const agent = createComplianceAgent()
  return agent.execute(request)
}
