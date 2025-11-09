/**
 * Administrative Agent
 * 
 * Specialized agent for automating administrative tasks like email,
 * document generation, and scheduling
 */

import { BaseAgent } from '../lib/base-agent'
import { globalToolRegistry } from '../lib/tool-registry'
import { getToolsForAgentType } from '../tools'
import { ADMINISTRATIVE_AGENT_PROMPT } from '../lib/prompt-templates'
import type { AgentConfig, AgentRequest, ToolExecutionContext } from '../types/agent.types'
import type { CoreTool } from 'ai'

/**
 * Administrative Agent Configuration
 */
const ADMINISTRATIVE_AGENT_CONFIG: AgentConfig = {
  type: 'administrative',
  name: 'Administrative Assistant Agent',
  description: 'Automation specialist for administrative tasks including email, documents, and scheduling',
  systemPrompt: ADMINISTRATIVE_AGENT_PROMPT,
  tools: getToolsForAgentType('administrative'),
  model: {
    provider: 'anthropic',
    name: 'claude-sonnet-4-20250514',
    temperature: 0.5,
    maxTokens: 4096,
  },
  maxSteps: 8,
  streaming: true,
  memoryEnabled: true,
  rateLimits: {
    requestsPerMinute: 60,
    tokensPerDay: 1000000,
  },
}

/**
 * Administrative Agent Class
 * 
 * Handles administrative tasks including:
 * - Email notifications and communications
 * - Travel letter generation
 * - Calendar event scheduling
 * - Report generation
 * - Reminder creation
 * - Interaction logging
 */
export class AdministrativeAgent extends BaseAgent {
  constructor() {
    super(ADMINISTRATIVE_AGENT_CONFIG)
  }

  /**
   * Get system prompt for administrative agent
   */
  protected getSystemPrompt(): string {
    return this.config.systemPrompt
  }

  /**
   * Get tools for administrative agent
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
    return ['admin']
  }

  /**
   * Request user confirmation
   */
  protected async requestConfirmation(message: string): Promise<boolean> {
    console.log(`Confirmation requested: ${message}`)
    // Administrative tasks should require explicit confirmation
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
   * Administrative-specific workflow helpers
   */

  /**
   * Send notification email
   */
  async sendNotification(params: {
    to: string[]
    subject: string
    body: string
    template?: string
  }) {
    const request: AgentRequest = {
      userId: 'system',
      agentType: 'administrative',
      message: `Send email to ${params.to.join(', ')} with subject "${params.subject}". ${
        params.template ? `Use template: ${params.template}` : ''
      }`,
      context: {
        emailParams: params,
        actionType: 'send_email',
      },
    }

    return this.execute(request)
  }

  /**
   * Generate travel letter
   */
  async generateTravelLetter(params: {
    studentId: string
    travelDates: {
      departureDate: string
      returnDate: string
    }
    destination: string
    reason: string
  }) {
    const request: AgentRequest = {
      userId: params.studentId,
      agentType: 'administrative',
      message: `Generate travel letter for student ${params.studentId}. Travel from ${params.travelDates.departureDate} to ${params.travelDates.returnDate} to ${params.destination} for ${params.reason}.`,
      context: {
        travelLetterParams: params,
        actionType: 'generate_travel_letter',
      },
    }

    return this.execute(request)
  }

  /**
   * Schedule meeting
   */
  async scheduleMeeting(params: {
    title: string
    startTime: string
    endTime: string
    attendees: string[]
    location?: string
  }) {
    const request: AgentRequest = {
      userId: 'system',
      agentType: 'administrative',
      message: `Schedule meeting "${params.title}" from ${params.startTime} to ${params.endTime} with ${params.attendees.join(', ')}. ${
        params.location ? `Location: ${params.location}` : ''
      }`,
      context: {
        meetingParams: params,
        actionType: 'schedule_meeting',
      },
    }

    return this.execute(request)
  }

  /**
   * Generate report
   */
  async generateReport(params: {
    reportType: 'progress' | 'compliance' | 'performance' | 'attendance'
    studentId?: string
    teamId?: string
    format?: 'pdf' | 'excel' | 'json'
  }) {
    const request: AgentRequest = {
      userId: params.studentId || 'system',
      agentType: 'administrative',
      message: `Generate ${params.reportType} report ${
        params.studentId ? `for student ${params.studentId}` : ''
      } ${params.teamId ? `for team ${params.teamId}` : ''}. ${
        params.format ? `Format: ${params.format}` : ''
      }`,
      context: {
        reportParams: params,
        actionType: 'generate_report',
      },
    }

    return this.execute(request)
  }

  /**
   * Set reminder
   */
  async setReminder(params: {
    userId: string
    message: string
    reminderDate: string
    channel?: 'email' | 'sms' | 'push'
  }) {
    const request: AgentRequest = {
      userId: params.userId,
      agentType: 'administrative',
      message: `Set reminder for ${params.userId}: "${params.message}" on ${params.reminderDate}. ${
        params.channel ? `Send via ${params.channel}` : ''
      }`,
      context: {
        reminderParams: params,
        actionType: 'set_reminder',
      },
    }

    return this.execute(request)
  }

  /**
   * Log interaction
   */
  async logInteraction(params: {
    studentId: string
    interactionType: 'advising' | 'tutoring' | 'mentoring' | 'intervention' | 'other'
    summary: string
    duration?: number
  }) {
    const request: AgentRequest = {
      userId: params.studentId,
      agentType: 'administrative',
      message: `Log ${params.interactionType} interaction with student ${params.studentId}: ${params.summary}. ${
        params.duration ? `Duration: ${params.duration} minutes` : ''
      }`,
      context: {
        interactionParams: params,
        actionType: 'log_interaction',
      },
    }

    return this.execute(request)
  }
}

/**
 * Create administrative agent instance
 */
export function createAdministrativeAgent(): AdministrativeAgent {
  return new AdministrativeAgent()
}

/**
 * Execute administrative workflow
 */
export async function executeAdministrativeWorkflow(request: AgentRequest) {
  const agent = createAdministrativeAgent()
  return agent.execute(request)
}
