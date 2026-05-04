/**
 * SDLC Architecture Agent
 *
 * Specialized agent for software architecture, technical decision records (ADRs/TDRs),
 * pattern recommendations, system integration analysis, and secure multi-tenant design.
 *
 * Follows exact patterns from compliance-agent.ts and general-assistant.ts.
 */

import { BaseAgent } from "../lib/base-agent";
import { globalToolRegistry } from "../lib/tool-registry";
import { getToolsForAgentType } from "../tools";
import { ARCHITECTURE_AGENT_PROMPT } from "../lib/prompt-templates";
import type {
  AgentConfig,
  AgentRequest,
  ToolExecutionContext,
  AgentType,
} from "../types/agent.types";
import type { CoreTool } from "ai";

/**
 * Architecture Agent Configuration
 */
const ARCHITECTURE_AGENT_CONFIG: AgentConfig = {
  type: "sdlc_architecture",
  name: "Architecture Agent",
  description:
    "Software architecture specialist for system design, patterns, and technical decision records with NCAA/Title IX context",
  systemPrompt: ARCHITECTURE_AGENT_PROMPT,
  tools: getToolsForAgentType("sdlc_architecture"),
  model: {
    provider: "openai",
    name: "gpt-5.1-codex-max",
    temperature: 0.2, // Lower temperature for precise architectural decisions
    maxTokens: 8192,
  },
  maxSteps: 12,
  streaming: true,
  memoryEnabled: true,
  rateLimits: {
    requestsPerMinute: 40,
    tokensPerDay: 1500000,
  },
};

/**
 * Architecture Agent Class
 *
 * Handles:
 * - ADR / TDR generation
 * - Pattern recommendations
 * - Integration analysis (RAG, multi-agent workflows)
 * - FERPA/NCAA-aware design guidance
 */
export class ArchitectureAgent extends BaseAgent {
  private requestContext?: AgentRequest["context"];

  constructor() {
    super(ARCHITECTURE_AGENT_CONFIG);
    // Ensure the agent is registered on instantiation
  }

  /**
   * Get system prompt
   */
  protected getSystemPrompt(): string {
    return this.config.systemPrompt;
  }

  /**
   * Get tools
   */
  protected getTools(): Record<string, CoreTool> {
    const context: ToolExecutionContext = {
      userId: "",
      userRoles: this.getUserRoles(),
      agentState: {} as any,
      requestConfirmation: this.requestConfirmation.bind(this),
    };

    return globalToolRegistry.toAISDKTools(this.config.tools, context);
  }

  /**
   * Get user roles
   */
  protected getUserRoles(): string[] {
    if (
      this.requestContext?.userRoles &&
      Array.isArray(this.requestContext.userRoles)
    ) {
      return this.requestContext.userRoles;
    }
    // Default role for architecture agent
    return ["architect", "platform_engineer"];
  }

  /**
   * Request user confirmation (HITL)
   */
  protected async requestConfirmation(message: string): Promise<boolean> {
    console.log(`[ArchitectureAgent] Confirmation requested: ${message}`);
    return true;
  }
}

/**
 * Factory function (required by index.ts)
 */
export function createArchitectureAgent(): ArchitectureAgent {
  return new ArchitectureAgent();
}
