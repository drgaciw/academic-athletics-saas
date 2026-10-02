/**
 * Extensible Agent Tool Registry with Zod Validation
 */

import { z } from "zod";
import { ActionTier } from "../types/hitl.types.js";

export interface ToolExecutionContext {
  userId: string;
  userRole: string;
  studentAthleteId?: string;
  sessionId?: string;
  metadata?: Record<string, unknown>;
}

export interface AgentTool<TInput = unknown, TOutput = unknown> {
  name: string;
  description: string;
  domain:
    | "compliance"
    | "advising"
    | "risk_intervention"
    | "document_ingestion"
    | "apr_reporting"
    | "general";
  tier?: ActionTier;
  inputSchema: z.ZodType<TInput, z.ZodTypeDef, any>;
  execute: (input: TInput, context: ToolExecutionContext) => Promise<TOutput>;
}

export interface ToolExecutionResult {
  toolName: string;
  success: boolean;
  data?: unknown;
  error?: string;
  isStagedProposal?: boolean;
  proposalId?: string;
}

export class ToolRegistry {
  private tools: Map<string, AgentTool<any, any>> = new Map();

  public registerTool<TInput, TOutput>(tool: AgentTool<TInput, TOutput>): void {
    if (this.tools.has(tool.name)) {
      throw new Error(`Tool already registered: ${tool.name}`);
    }
    this.tools.set(tool.name, tool);
  }

  public getTool(name: string): AgentTool | undefined {
    return this.tools.get(name);
  }

  public getToolsByDomain(domain: string): AgentTool[] {
    return Array.from(this.tools.values()).filter((t) => t.domain === domain);
  }

  public getAllTools(): AgentTool[] {
    return Array.from(this.tools.values());
  }

  public async executeTool(
    name: string,
    rawInput: unknown,
    context: ToolExecutionContext,
  ): Promise<ToolExecutionResult> {
    const tool = this.tools.get(name);
    if (!tool) {
      return {
        toolName: name,
        success: false,
        error: `Tool not found in registry: ${name}`,
      };
    }

    // Validate input with Zod
    const parseResult = tool.inputSchema.safeParse(rawInput);
    if (!parseResult.success) {
      return {
        toolName: name,
        success: false,
        error: `Input validation failed: ${parseResult.error.message}`,
      };
    }

    try {
      const output = await tool.execute(parseResult.data, context);
      return {
        toolName: name,
        success: true,
        data: output,
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      return {
        toolName: name,
        success: false,
        error: `Tool execution failed: ${errorMsg}`,
      };
    }
  }
}
