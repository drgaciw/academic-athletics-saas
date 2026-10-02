/**
 * Human-in-the-Loop (HITL) Governance & Audit Protocol Types
 */

export type ActionTier =
  | "TIER_1_AUTONOMOUS" // Read-only queries, calculations, draft schedules, simulations
  | "TIER_2_STAFF_REVIEW" // Advising notes, tutor referrals, study hall requirements
  | "TIER_3_COMPLIANCE_GATE"; // Official NCAA certification, enrollment drop waivers, APR filings

export type ProposalStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "EXECUTED"
  | "CANCELLED";

export interface ActionProposal {
  id: string;
  tier: ActionTier;
  agentType: string;
  actionName: string;
  studentAthleteId: string;
  summary: string;
  reasoning: string;
  bylawCitations?: string[];
  proposedPayload: Record<string, unknown>;
  status: ProposalStatus;
  requestedByAgent: string;
  reviewedBy?: string;
  reviewerNotes?: string;
  createdAt: string;
  reviewedAt?: string;
  executedAt?: string;
}

export interface AIAuditEntry {
  id: string;
  timestamp: string;
  actor: {
    id: string;
    role: string;
    isAi: boolean;
  };
  actionType: string;
  tier: ActionTier;
  studentAthleteId?: string;
  bylawCited?: string;
  details: Record<string, unknown>;
  outcome: "SUCCESS" | "PROPOSAL_STAGED" | "DENIED" | "ERROR";
}
