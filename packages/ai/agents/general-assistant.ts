/**
 * General Assistant Agent
 * 
 * General-purpose assistant for information retrieval and routing to specialized agents
 */

import { BaseAgent } from '../lib/base-agent'
import { globalToolRegistry } from '../lib/tool-registry'
import { getToolsForAgentType } from '../tools'
import { GENERAL_ASSISTANT_PROMPT } from '../lib/prompt-templates'
import type { AgentConfig, AgentRequest, AgentType, ToolExecutionContext } from '../types/agent.types'
import type { CoreTool } from 'ai'

/**
 * General Assistant Configuration
 */
const GENERAL_ASSISTANT_CONFIG: AgentConfig = {
  type: 'general',
  name: 'General Assistant',
  description: 'Helpful general assistant for information and routing to specialized agents',
  systemPrompt: GENERAL_ASSISTANT_PROMPT,
  tools: getToolsForAgentType('general'),
  model: {
    provider: 'openai',
    name: 'gpt-5.1-codex-max',
    temperature: 0.7,
    maxTokens: 4096,
  },
  maxSteps: 5,
  streaming: true,
  memoryEnabled: true,
  rateLimits: {
    requestsPerMinute: 100,
    tokensPerDay: 2000000,
  },
}

/**
 * General Assistant Class
 * 
 * Handles general queries including:
 * - Information retrieval (read-only)
 * - FAQ and knowledge base search
 * - Intent classification
 * - Routing to specialized agents
 * - Platform guidance
 */
export class GeneralAssistant extends BaseAgent {
  constructor() {
    super(GENERAL_ASSISTANT_CONFIG)
  }

  /**
   * Get system prompt for general assistant
   */
  protected getSystemPrompt(): string {
    return this.config.systemPrompt
  }

  /**
   * Get tools for general assistant
   */
  protected getTools(): Record<string, CoreTool> {
    const userRoles = this.getUserRoles()

    const context: ToolExecutionContext = {
      userId: '',
      userRoles,
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
    // General assistant has minimal permissions
    return ['student']
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
   * Classify intent and route to appropriate agent
   */
  async classifyAndRoute(message: string): Promise<{
    intent: string
    confidence: number
    recommendedAgent: AgentType
    reasoning: string
  }> {
    // Simple keyword-based classification
    // TODO: Enhance with embedding-based classification
    
    const message_lower = message.toLowerCase()

    // Advising keywords
    if (
      message_lower.includes('course') ||
      message_lower.includes('class') ||
      message_lower.includes('schedule') ||
      message_lower.includes('register') ||
      message_lower.includes('degree') ||
      message_lower.includes('major') ||
      message_lower.includes('prerequisite')
    ) {
      return {
        intent: 'academic_advising',
        confidence: 0.85,
        recommendedAgent: 'advising',
        reasoning: 'Query relates to courses, scheduling, or degree planning',
      }
    }

    // Compliance keywords
    if (
      message_lower.includes('eligib') ||
      message_lower.includes('ncaa') ||
      message_lower.includes('gpa') ||
      message_lower.includes('credit') ||
      message_lower.includes('progress toward degree') ||
      message_lower.includes('bylaw') ||
      message_lower.includes('rule')
    ) {
      return {
        intent: 'compliance_check',
        confidence: 0.9,
        recommendedAgent: 'compliance',
        reasoning: 'Query relates to NCAA eligibility or compliance rules',
      }
    }

    // Intervention keywords
    if (
      message_lower.includes('struggling') ||
      message_lower.includes('help') ||
      message_lower.includes('tutor') ||
      message_lower.includes('support') ||
      message_lower.includes('failing') ||
      message_lower.includes('behind')
    ) {
      return {
        intent: 'academic_support',
        confidence: 0.8,
        recommendedAgent: 'intervention',
        reasoning: 'Query indicates need for academic support or intervention',
      }
    }

    // Administrative keywords
    if (
      message_lower.includes('email') ||
      message_lower.includes('letter') ||
      message_lower.includes('travel') ||
      message_lower.includes('schedule meeting') ||
      message_lower.includes('report')
    ) {
      return {
        intent: 'administrative_task',
        confidence: 0.85,
        recommendedAgent: 'administrative',
        reasoning: 'Query relates to administrative tasks or document generation',
      }
    }

    // Default to general
    return {
      intent: 'general_inquiry',
      confidence: 0.6,
      recommendedAgent: 'general',
      reasoning: 'General inquiry that can be handled by general assistant',
    }
  }

  /**
   * General assistant-specific helpers
   */

  /**
   * Answer FAQ
   */
  async answerFAQ(question: string) {
    const request: AgentRequest = {
      userId: 'system',
      agentType: 'general',
      message: question,
      context: {
        queryType: 'faq',
      },
    }

    return this.execute(request)
  }

  /**
   * Provide platform guidance
   */
  async providePlatformGuidance(topic: string) {
    const request: AgentRequest = {
      userId: 'system',
      agentType: 'general',
      message: `How do I ${topic}?`,
      context: {
        queryType: 'platform_guidance',
        topic,
      },
    }

    return this.execute(request)
  }

  /**
   * Search knowledge base
   */
  async searchKnowledgeBase(query: string) {
    const request: AgentRequest = {
      userId: 'system',
      agentType: 'general',
      message: `Search knowledge base for: ${query}`,
      context: {
        queryType: 'knowledge_search',
        query,
      },
    }

    return this.execute(request)
  }
}

/**
 * Create general assistant instance
 */
export function createGeneralAssistant(): GeneralAssistant {
  return new GeneralAssistant()
}

/**
 * Execute general assistant workflow
 */
export async function executeGeneralAssistantWorkflow(request: AgentRequest) {
  const assistant = createGeneralAssistant()
  return assistant.execute(request)
}
