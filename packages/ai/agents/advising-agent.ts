/**
 * Advising Agent
 * 
 * Specialized agent for academic advising, course recommendations,
 * and degree planning for student-athletes
 */

import { BaseAgent } from '../lib/base-agent'
import { globalToolRegistry } from '../lib/tool-registry'
import { getToolsForAgentType } from '../tools'
import { ADVISING_AGENT_PROMPT } from '../lib/prompt-templates'
import type { AgentConfig, AgentRequest, ToolExecutionContext } from '../types/agent.types'
import type { CoreTool } from 'ai'

/**
 * Advising Agent Configuration
 */
const ADVISING_AGENT_CONFIG: AgentConfig = {
  type: 'advising',
  name: 'Academic Advising Agent',
  description: 'Expert academic advisor for student-athletes specializing in course selection, degree planning, and NCAA compliance',
  systemPrompt: ADVISING_AGENT_PROMPT,
  tools: getToolsForAgentType('advising'),
  model: {
    provider: 'openai',
    name: 'gpt-5.1-codex-max',
    temperature: 0.7,
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
 * Advising Agent Class
 * 
 * Handles academic advising queries including:
 * - Course recommendations
 * - Schedule conflict detection
 * - Degree progress tracking
 * - Prerequisite verification
 * - NCAA eligibility considerations
 */
export class AdvisingAgent extends BaseAgent {
  constructor() {
    super(ADVISING_AGENT_CONFIG)
  }

  /**
   * Get system prompt for advising agent
   */
  protected getSystemPrompt(): string {
    return this.config.systemPrompt
  }

  /**
   * Get tools for advising agent
   */
  protected getTools(): Record<string, CoreTool> {
    // Create minimal context for tool registration
    // Full context will be set during execute()
    const context: ToolExecutionContext = {
      userId: '', // Will be set during execution
      userRoles: this.getUserRoles(),
      agentState: {} as any, // Will be set during execution
      requestConfirmation: this.requestConfirmation.bind(this),
    }

    // Convert tools to AI SDK format
    return globalToolRegistry.toAISDKTools(this.config.tools, context)
  }

  /**
   * Get user roles (override in production with actual role lookup)
   */
  protected getUserRoles(): string[] {
    // TODO: Get actual user roles from authentication context
    // For now, return advisor role
    return ['advisor']
  }

  /**
   * Request user confirmation for state-changing operations
   */
  protected async requestConfirmation(message: string): Promise<boolean> {
    // TODO: Implement actual confirmation UI flow
    // For now, auto-approve in development
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
   * Advising-specific workflow helpers
   */

  /**
   * Recommend courses for a student
   */
  async recommendCourses(params: {
    studentId: string
    semester: string
    targetCredits?: number
    preferences?: {
      avoidMornings?: boolean
      avoidAfternoons?: boolean
      onlinePreferred?: boolean
    }
  }) {
    const request: AgentRequest = {
      userId: params.studentId,
      agentType: 'advising',
      message: `I need course recommendations for ${params.semester}. ${
        params.targetCredits ? `I want to take ${params.targetCredits} credits.` : ''
      } ${
        params.preferences?.avoidAfternoons
          ? 'I have athletic practice in the afternoons, so I need morning or online classes.'
          : ''
      }`,
      context: {
        studentId: params.studentId,
        semester: params.semester,
        targetCredits: params.targetCredits,
        preferences: params.preferences,
      },
    }

    return this.execute(request)
  }

  /**
   * Check for scheduling conflicts
   */
  async checkScheduleConflicts(params: {
    studentId: string
    courseCodes: string[]
    semester: string
  }) {
    const request: AgentRequest = {
      userId: params.studentId,
      agentType: 'advising',
      message: `Can you check if these courses have any scheduling conflicts: ${params.courseCodes.join(', ')}? I'm registered for ${params.semester}.`,
      context: {
        studentId: params.studentId,
        courseCodes: params.courseCodes,
        semester: params.semester,
      },
    }

    return this.execute(request)
  }

  /**
   * Plan degree completion
   */
  async planDegreeCompletion(params: {
    studentId: string
    targetGraduation: string
  }) {
    const request: AgentRequest = {
      userId: params.studentId,
      agentType: 'advising',
      message: `I want to graduate by ${params.targetGraduation}. Can you help me plan out my remaining courses?`,
      context: {
        studentId: params.studentId,
        targetGraduation: params.targetGraduation,
      },
    }

    return this.execute(request)
  }

  /**
   * Verify prerequisites
   */
  async verifyPrerequisites(params: {
    studentId: string
    courseCode: string
  }) {
    const request: AgentRequest = {
      userId: params.studentId,
      agentType: 'advising',
      message: `Can I take ${params.courseCode}? Do I meet the prerequisites?`,
      context: {
        studentId: params.studentId,
        courseCode: params.courseCode,
      },
    }

    return this.execute(request)
  }
}

/**
 * Create advising agent instance
 */
export function createAdvisingAgent(): AdvisingAgent {
  return new AdvisingAgent()
}

/**
 * Execute advising workflow
 */
export async function executeAdvisingWorkflow(request: AgentRequest) {
  const agent = createAdvisingAgent()
  return agent.execute(request)
}
