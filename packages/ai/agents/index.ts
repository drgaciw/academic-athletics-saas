/**
 * Agent Implementations Index
 * 
 * Central export point for all specialized agents
 */

// Export agent classes
export * from './advising-agent'
export * from './compliance-agent'
export * from './intervention-agent'
export * from './administrative-agent'
export * from './general-assistant'
export * from './error-diagnostics-agent'

// Import for convenience
import { createAdvisingAgent, type AdvisingAgent } from './advising-agent'
import { createComplianceAgent, type ComplianceAgent } from './compliance-agent'
import { createInterventionAgent, type InterventionAgent } from './intervention-agent'
import { createAdministrativeAgent, type AdministrativeAgent } from './administrative-agent'
import { createGeneralAssistant, type GeneralAssistant } from './general-assistant'
import type { AgentType } from '../types/agent.types'

/**
 * Agent factory - creates agent instance by type
 */
export function createAgent(agentType: AgentType): 
  | AdvisingAgent 
  | ComplianceAgent 
  | InterventionAgent 
  | AdministrativeAgent 
  | GeneralAssistant {
  switch (agentType) {
    case 'advising':
      return createAdvisingAgent()
    case 'compliance':
      return createComplianceAgent()
    case 'intervention':
      return createInterventionAgent()
    case 'administrative':
      return createAdministrativeAgent()
    case 'general':
      return createGeneralAssistant()
    default:
      throw new Error(`Unknown agent type: ${agentType}`)
  }
}

/**
 * Agent registry for quick access
 */
export const agentRegistry = {
  advising: createAdvisingAgent,
  compliance: createComplianceAgent,
  intervention: createInterventionAgent,
  administrative: createAdministrativeAgent,
  general: createGeneralAssistant,
}

/**
 * Get agent description
 */
export function getAgentDescription(agentType: AgentType): string {
  const descriptions: Record<AgentType, string> = {
    advising: 'Expert academic advisor for course selection, degree planning, and schedule management',
    compliance: 'NCAA Division I compliance specialist for eligibility verification and rule interpretation',
    intervention: 'Proactive academic support specialist for identifying and supporting at-risk students',
    administrative: 'Automation specialist for email, documents, scheduling, and administrative tasks',
    general: 'Helpful general assistant for information retrieval and routing to specialized agents',
  }

  return descriptions[agentType] || 'Unknown agent'
}

/**
 * Get agent capabilities
 */
export function getAgentCapabilities(agentType: AgentType): string[] {
  const capabilities: Record<AgentType, string[]> = {
    advising: [
      'Course search and recommendations',
      'Schedule conflict detection',
      'Degree progress tracking',
      'Prerequisite verification',
      'Academic planning',
    ],
    compliance: [
      'NCAA eligibility verification',
      'Rule interpretation with citations',
      'Scenario simulation (what-if analysis)',
      'Progress-toward-degree calculations',
      'Compliance history review',
    ],
    intervention: [
      'Risk assessment and identification',
      'Performance trend analysis',
      'Personalized intervention planning',
      'Resource connection (tutoring, mentoring)',
      'Follow-up scheduling and monitoring',
    ],
    administrative: [
      'Email notifications',
      'Travel letter generation',
      'Calendar event scheduling',
      'Report generation',
      'Reminder creation',
      'Interaction logging',
    ],
    general: [
      'Information retrieval',
      'FAQ answering',
      'Knowledge base search',
      'Platform guidance',
      'Intent classification and routing',
    ],
  }

  return capabilities[agentType] || []
}
