/**
 * Agent Implementations Index
 *
 * Central export point for all specialized agents
 */

// Export agent classes
export * from "./advising-agent";
export * from "./compliance-agent";
export * from "./intervention-agent";
export * from "./administrative-agent";
export * from "./general-assistant";
export * from "./error-diagnostics-agent";

// Import for convenience
import { createAdvisingAgent, type AdvisingAgent } from "./advising-agent";
import {
  createComplianceAgent,
  type ComplianceAgent,
} from "./compliance-agent";
import {
  createInterventionAgent,
  type InterventionAgent,
} from "./intervention-agent";
import {
  createAdministrativeAgent,
  type AdministrativeAgent,
} from "./administrative-agent";
import {
  createGeneralAssistant,
  type GeneralAssistant,
} from "./general-assistant";
import type { AgentType } from "../types/agent.types";

// MVP new agent factories
import {
  createArchitectureAgent,
  type ArchitectureAgent,
} from "./sdlc-architecture-agent";
import { createSecurityAgent, type SecurityAgent } from "./tech-security-agent";
import {
  createFinancialAgent,
  type FinancialAgent,
} from "./business-financial-agent";

/**
 * Agent factory - creates agent instance by type
 * Phase 0: MVP subset (architecture, security, financial) + legacy agents
 */
export function createAgent(
  agentType: AgentType,
):
  | AdvisingAgent
  | ComplianceAgent
  | InterventionAgent
  | AdministrativeAgent
  | GeneralAssistant
  | ArchitectureAgent
  | SecurityAgent
  | FinancialAgent {
  switch (agentType) {
    case "advising":
      return createAdvisingAgent();
    case "compliance":
      return createComplianceAgent();
    case "intervention":
      return createInterventionAgent();
    case "administrative":
      return createAdministrativeAgent();
    case "general":
      return createGeneralAssistant();
    // MVP SDLC/Tech/Business agents
    case "sdlc_architecture":
      return createArchitectureAgent();
    case "tech_security":
      return createSecurityAgent();
    case "business_financial":
      return createFinancialAgent();
    default:
      // placeholder for unimplemented prefixed agents (graceful degradation)
      if (
        typeof agentType === "string" &&
        (agentType.startsWith("sdlc_") ||
          agentType.startsWith("tech_") ||
          agentType.startsWith("business_"))
      ) {
        throw new Error(
          `Agent ${agentType} not yet implemented. Implement stub first.`,
        );
      }
      throw new Error(`Unknown agent type: ${agentType}`);
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
  sdlc_architecture: createArchitectureAgent,
  tech_security: createSecurityAgent,
  business_financial: createFinancialAgent,
};

/**
 * Get agent description
 */
export function getAgentDescription(agentType: AgentType): string {
  const descriptions: Partial<Record<AgentType, string>> = {
    advising:
      "Expert academic advisor for course selection, degree planning, and schedule management",
    compliance:
      "NCAA Division I compliance specialist for eligibility verification and rule interpretation",
    intervention:
      "Proactive academic support specialist for identifying and supporting at-risk students",
    administrative:
      "Automation specialist for email, documents, scheduling, and administrative tasks",
    general:
      "Helpful general assistant for information retrieval and routing to specialized agents",
    sdlc_architecture:
      "Software architecture specialist for system design, patterns, and technical decision records",
    tech_security:
      "Security specialist for OWASP, threat modeling, vulnerability scanning, and compliance automation",
    business_financial:
      "Financial analyst for budget forecasting, scholarship modeling, and NCAA/Title IX compliance reporting",
  };

  return descriptions[agentType] || "Unknown agent";
}

/**
 * Get agent capabilities
 */
export function getAgentCapabilities(agentType: AgentType): string[] {
  const capabilities: Partial<Record<AgentType, string[]>> = {
    advising: [
      "Course search and recommendations",
      "Schedule conflict detection",
      "Degree progress tracking",
      "Prerequisite verification",
      "Academic planning",
    ],
    compliance: [
      "NCAA eligibility verification",
      "Rule interpretation with citations",
      "Scenario simulation (what-if analysis)",
      "Progress-toward-degree calculations",
      "Compliance history review",
    ],
    intervention: [
      "Risk assessment and identification",
      "Performance trend analysis",
      "Personalized intervention planning",
      "Resource connection (tutoring, mentoring)",
      "Follow-up scheduling and monitoring",
    ],
    administrative: [
      "Email notifications",
      "Travel letter generation",
      "Calendar event scheduling",
      "Report generation",
      "Reminder creation",
      "Interaction logging",
    ],
    general: [
      "Information retrieval",
      "FAQ answering",
      "Knowledge base search",
      "Platform guidance",
      "Intent classification and routing",
    ],
    sdlc_architecture: [
      "System design and architecture review",
      "Pattern recommendation",
      "Technology stack selection",
      "Technical decision record (TDR) generation",
      "Integration point analysis",
    ],
    tech_security: [
      "OWASP Top-10 scanning guidance",
      "Threat modeling (STRIDE)",
      "Vulnerability assessment",
      "Security compliance mapping",
      "Incident response playbooks",
    ],
    business_financial: [
      "Scholarship and aid budget forecasting",
      "Athletic department financial KPIs",
      "NCAA/Title IX compliance reporting",
      "ROI and cost-benefit analysis",
      "Predictive revenue modeling",
    ],
  };

  return capabilities[agentType] || [];
}
