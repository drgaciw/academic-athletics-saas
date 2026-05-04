/**
 * Business Financial Agent
 *
 * Specialized agent for NCAA Division I financial analysis:
 * scholarship budgeting & forecasting, Title IX EADA equity reporting,
 * budget variance analysis, and revenue/ROI modeling.
 * All data remains de-identified and aggregated.
 *
 * Implements the same BaseAgent + factory pattern as Architecture and Security agents.
 */

import { BaseAgent } from "../lib/base-agent";
import { globalToolRegistry } from "../lib/tool-registry";
import { getToolsForAgentType } from "../tools";
import { FINANCIAL_AGENT_PROMPT } from "../lib/prompt-templates";
import type {
  AgentConfig,
  AgentRequest,
  ToolExecutionContext,
} from "../types/agent.types";
import type { CoreTool } from "ai";

/**
 * Financial Agent Configuration
 */
const FINANCIAL_AGENT_CONFIG: AgentConfig = {
  type: "business_financial",
  name: "Financial Agent",
  description:
    "Financial analyst for budget forecasting, scholarship modeling, and NCAA/Title IX compliance reporting",
  systemPrompt: FINANCIAL_AGENT_PROMPT,
  tools: getToolsForAgentType("business_financial"),
  model: {
    provider: "openai",
    name: "gpt-5.1-codex-max",
    temperature: 0.1, // Very low temperature for factual financial modeling
    maxTokens: 8192,
  },
  maxSteps: 10,
  streaming: true,
  memoryEnabled: true,
  rateLimits: {
    requestsPerMinute: 25,
    tokensPerDay: 800000,
  },
};

/**
 * Financial Agent class
 */
export class FinancialAgent extends BaseAgent {
  private requestContext?: AgentRequest["context"];

  constructor() {
    super(FINANCIAL_AGENT_CONFIG);
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
    return ["financial_analyst", "athletic_director", "compliance_officer"];
  }

  protected async requestConfirmation(message: string): Promise<boolean> {
    console.log(`[FinancialAgent] Confirmation requested: ${message}`);
    return true;
  }
}

/**
 * Factory function required by index.ts
 */
export function createFinancialAgent(): FinancialAgent {
  return new FinancialAgent();
}

export type FinancialAgentType = FinancialAgent;
