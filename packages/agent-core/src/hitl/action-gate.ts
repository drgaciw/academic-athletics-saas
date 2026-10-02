/**
 * Action Gate — Enforces Tiered Human-in-the-Loop Governance
 */

import {
  ActionTier,
  ActionProposal,
  ProposalStatus,
} from "../types/hitl.types.js";

export interface ActionGateConfig {
  onProposalCreated?: (proposal: ActionProposal) => Promise<void> | void;
  onProposalApproved?: (proposal: ActionProposal) => Promise<void> | void;
  onProposalRejected?: (proposal: ActionProposal) => Promise<void> | void;
}

export class ActionGate {
  private proposals: Map<string, ActionProposal> = new Map();
  private config: ActionGateConfig;

  constructor(config: ActionGateConfig = {}) {
    this.config = config;
  }

  /**
   * Determine the regulatory authorization tier for a given action name.
   */
  public classifyActionTier(actionName: string): ActionTier {
    const tier3Actions = [
      "certify_official_eligibility",
      "approve_full_time_drop_waiver",
      "submit_official_apr_report",
      "grant_medical_hardship_waiver",
      "declare_competition_ineligibility",
    ];

    const tier2Actions = [
      "commit_course_registration",
      "assign_mandatory_tutoring",
      "place_on_academic_probation",
      "dispatch_coach_alert",
      "commit_transfer_credit_equivalency",
    ];

    if (tier3Actions.includes(actionName)) {
      return "TIER_3_COMPLIANCE_GATE";
    }

    if (tier2Actions.includes(actionName)) {
      return "TIER_2_STAFF_REVIEW";
    }

    return "TIER_1_AUTONOMOUS";
  }

  /**
   * Stage a high-stakes proposal requiring human approval.
   */
  public async stageProposal(params: {
    agentType: string;
    actionName: string;
    studentAthleteId: string;
    summary: string;
    reasoning: string;
    bylawCitations?: string[];
    payload: Record<string, unknown>;
  }): Promise<ActionProposal> {
    const tier = this.classifyActionTier(params.actionName);
    const id = `PROP-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    const proposal: ActionProposal = {
      id,
      tier,
      agentType: params.agentType,
      actionName: params.actionName,
      studentAthleteId: params.studentAthleteId,
      summary: params.summary,
      reasoning: params.reasoning,
      bylawCitations: params.bylawCitations || [],
      proposedPayload: params.payload,
      status: "PENDING",
      requestedByAgent: params.agentType,
      createdAt: new Date().toISOString(),
    };

    this.proposals.set(id, proposal);

    if (this.config.onProposalCreated) {
      await this.config.onProposalCreated(proposal);
    }

    return proposal;
  }

  /**
   * Approve a staged proposal by an authorized staff member (Advisor / Compliance Officer).
   */
  public async approveProposal(
    proposalId: string,
    reviewerId: string,
    reviewerNotes?: string,
  ): Promise<ActionProposal> {
    const proposal = this.proposals.get(proposalId);
    if (!proposal) {
      throw new Error(`Proposal not found: ${proposalId}`);
    }

    if (proposal.status !== "PENDING") {
      throw new Error(`Cannot approve proposal in status: ${proposal.status}`);
    }

    proposal.status = "APPROVED";
    proposal.reviewedBy = reviewerId;
    proposal.reviewerNotes = reviewerNotes;
    proposal.reviewedAt = new Date().toISOString();

    if (this.config.onProposalApproved) {
      await this.config.onProposalApproved(proposal);
    }

    return proposal;
  }

  /**
   * Reject a staged proposal.
   */
  public async rejectProposal(
    proposalId: string,
    reviewerId: string,
    rejectionReason: string,
  ): Promise<ActionProposal> {
    const proposal = this.proposals.get(proposalId);
    if (!proposal) {
      throw new Error(`Proposal not found: ${proposalId}`);
    }

    if (proposal.status !== "PENDING") {
      throw new Error(`Cannot reject proposal in status: ${proposal.status}`);
    }

    proposal.status = "REJECTED";
    proposal.reviewedBy = reviewerId;
    proposal.reviewerNotes = rejectionReason;
    proposal.reviewedAt = new Date().toISOString();

    if (this.config.onProposalRejected) {
      await this.config.onProposalRejected(proposal);
    }

    return proposal;
  }

  public getProposal(proposalId: string): ActionProposal | undefined {
    return this.proposals.get(proposalId);
  }

  public listPendingProposals(studentAthleteId?: string): ActionProposal[] {
    const all = Array.from(this.proposals.values());
    return all.filter((p) => {
      const isPending = p.status === "PENDING";
      return studentAthleteId
        ? isPending && p.studentAthleteId === studentAthleteId
        : isPending;
    });
  }
}
