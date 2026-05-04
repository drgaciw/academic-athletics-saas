/**
 * Tech Security Agent
 *
 * Specialized agent for OWASP guidance, threat modeling (STRIDE), vulnerability assessment,
 * secure design reviews, and incident response playbooks for the AAH (Athletic Academics Hub) SaaS.
 *
 * Follows the exact factory + BaseAgent pattern implemented for ArchitectureAgent.
 */

import { BaseAgent } from "../lib/base-agent";
import { globalToolRegistry } from "../lib/tool-registry";
import { getToolsForAgentType } from "../tools";
import { SECURITY_AGENT_PROMPT } from "../lib/prompt-templates";
import type {
  AgentConfig,
  AgentRequest,
  ToolExecutionContext,
  AgentType,
} from "../types/agent.types";
import type { CoreTool } from "ai";

/**
 * Security Agent Configuration
 */
const SECURITY_AGENT_CONFIG: AgentConfig = {
  type: "tech_security",
  name: "Security Agent",
  description:
    "Security specialist for OWASP, threat modeling, vulnerability scanning, and compliance automation with NCAA/Title IX focus",
  systemPrompt: SECURITY_AGENT_PROMPT,
  tools: getToolsForAgentType("tech_security"),
  model: {
    provider: "openai",
    name: "gpt-5.1-codex-max",
    temperature: 0.15, // Very precise security guidance
    maxTokens: 8192,
  },
  maxSteps: 10,
  streaming: true,
  memoryEnabled: true,
  rateLimits: {
    requestsPerMinute: 30,
    tokensPerDay: 1000000,
  },
};

/**
 * Security Agent Class
 */
export class SecurityAgent extends BaseAgent {
  private requestContext?: AgentRequest["context"];

  constructor() {
    super(SECURITY_AGENT_CONFIG);
  }

  protected getSystemPrompt(): string {
    return this.config.systemPrompt;
  }

  protected getTools(): Record<string, CoreTool> {
    const context: ToolExecutionContext = {
      userId: "",
      userRoles: this.getUserRoles(),
      agentState: {} as any,
      requestConfirmation: this.requestConfirmation.bind(this),
    };
    return globalToolRegistry.toAISDKTools(this.config.tools, context);
  }

  protected getUserRoles(): string[] {
    if (
      this.requestContext?.userRoles &&
      Array.isArray(this.requestContext.userRoles)
    ) {
      return this.requestContext.userRoles;
    }
    return ["security_engineer", "compliance_officer"];
  }

  protected async requestConfirmation(message: string): Promise<boolean> {
    console.log(`[SecurityAgent] Confirmation requested: ${message}`);
    return true;
  }
}

/**
 * Factory (required by index.ts)
 */
export function createSecurityAgent(): SecurityAgent {
  return new SecurityAgent();
}

export type SecurityAgentType = SecurityAgent;
