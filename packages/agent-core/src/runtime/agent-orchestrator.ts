/**
 * Unified Multi-Skill Agent Orchestrator
 * Integrates ToolRegistry, ActionGate (HITL), MemoryStore, and AuditLogger.
 */

import {
  ToolRegistry,
  ToolExecutionContext,
  ToolExecutionResult,
} from "./tool-registry.js";
import { ActionGate } from "../hitl/action-gate.js";
import { AIAuditLogger } from "../hitl/audit-logger.js";
import { IMemoryStore } from "../memory/memory-store.interface.js";
import { InMemoryStore } from "../memory/in-memory-store.js";
import { ActionProposal, ActionTier } from "../types/hitl.types.js";

export interface AgentOrchestratorConfig {
  toolRegistry?: ToolRegistry;
  actionGate?: ActionGate;
  memoryStore?: IMemoryStore;
  auditLogger?: AIAuditLogger;
}

export class AgentOrchestrator {
  public readonly toolRegistry: ToolRegistry;
  public readonly actionGate: ActionGate;
  public readonly memoryStore: IMemoryStore;
  public readonly auditLogger: AIAuditLogger;

  constructor(config: AgentOrchestratorConfig = {}) {
    this.toolRegistry = config.toolRegistry || new ToolRegistry();
    this.actionGate = config.actionGate || new ActionGate();
    this.memoryStore = config.memoryStore || new InMemoryStore();
    this.auditLogger = config.auditLogger || new AIAuditLogger();
  }

  /**
   * Execute an action with full regulatory HITL gatekeeping and audit logging.
   */
  public async dispatchAction(params: {
    actionName: string;
    input: unknown;
    context: ToolExecutionContext;
    summary?: string;
    reasoning?: string;
    bylawCitations?: string[];
  }): Promise<ToolExecutionResult> {
    const tier: ActionTier = this.actionGate.classifyActionTier(
      params.actionName,
    );

    // If Tier 2 or Tier 3: Intercept mutation and stage proposal for human sign-off
    if (tier !== "TIER_1_AUTONOMOUS") {
      const studentId = params.context.studentAthleteId || "GLOBAL";
      const proposal: ActionProposal = await this.actionGate.stageProposal({
        agentType: "unified-athletics-agent",
        actionName: params.actionName,
        studentAthleteId: studentId,
        summary: params.summary || `Proposed action: ${params.actionName}`,
        reasoning:
          params.reasoning ||
          `Action requires human compliance sign-off under ${tier}.`,
        bylawCitations: params.bylawCitations,
        payload: (params.input as Record<string, unknown>) || {},
      });

      await this.auditLogger.logEvent({
        actor: {
          id: params.context.userId,
          role: params.context.userRole,
          isAi: true,
        },
        actionType: params.actionName,
        tier,
        studentAthleteId: params.context.studentAthleteId,
        bylawCited: params.bylawCitations?.[0],
        details: { proposalId: proposal.id, summary: proposal.summary },
        outcome: "PROPOSAL_STAGED",
      });

      return {
        toolName: params.actionName,
        success: true,
        isStagedProposal: true,
        proposalId: proposal.id,
        data: {
          status: "STAGED_FOR_APPROVAL",
          proposalId: proposal.id,
          tier,
          message: `Action '${params.actionName}' requires authorized human approval (${tier}). Proposal has been staged for review.`,
          bylawCitations: params.bylawCitations || [],
        },
      };
    }

    // Tier 1: Autonomous Execution
    const result = await this.toolRegistry.executeTool(
      params.actionName,
      params.input,
      params.context,
    );

    await this.auditLogger.logEvent({
      actor: {
        id: params.context.userId,
        role: params.context.userRole,
        isAi: true,
      },
      actionType: params.actionName,
      tier: "TIER_1_AUTONOMOUS",
      studentAthleteId: params.context.studentAthleteId,
      details: { input: params.input, success: result.success },
      outcome: result.success ? "SUCCESS" : "ERROR",
    });

    return result;
  }

  /**
   * Execute an approved proposal once signed off by staff.
   */
  public async executeApprovedProposal(
    proposalId: string,
    reviewerContext: ToolExecutionContext,
  ): Promise<ToolExecutionResult> {
    const proposal = this.actionGate.getProposal(proposalId);
    if (!proposal) {
      throw new Error(`Proposal not found: ${proposalId}`);
    }

    if (proposal.status !== "APPROVED") {
      throw new Error(
        `Proposal is not in APPROVED status (current: ${proposal.status})`,
      );
    }

    const result = await this.toolRegistry.executeTool(
      proposal.actionName,
      proposal.proposedPayload,
      {
        ...reviewerContext,
        studentAthleteId: proposal.studentAthleteId,
      },
    );

    if (result.success) {
      proposal.status = "EXECUTED";
      proposal.executedAt = new Date().toISOString();
    }

    await this.auditLogger.logEvent({
      actor: {
        id: reviewerContext.userId,
        role: reviewerContext.userRole,
        isAi: false,
      },
      actionType: `${proposal.actionName}:EXECUTED`,
      tier: proposal.tier,
      studentAthleteId: proposal.studentAthleteId,
      bylawCited: proposal.bylawCitations?.[0],
      details: { proposalId, success: result.success },
      outcome: result.success ? "SUCCESS" : "ERROR",
    });

    return result;
  }
}
