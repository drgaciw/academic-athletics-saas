import { z } from "zod";

export const ActionTierSchema = z.enum([
  "TIER_1_AUTONOMOUS",
  "TIER_2_STAFF_REVIEW",
  "TIER_3_COMPLIANCE_GATE",
]);

export const ProposalStatusSchema = z.enum([
  "PENDING",
  "APPROVED",
  "REJECTED",
  "EXECUTED",
  "CANCELLED",
]);

export const ActionProposalSchema = z.object({
  id: z.string(),
  tier: ActionTierSchema,
  agentType: z.string(),
  actionName: z.string(),
  studentAthleteId: z.string(),
  summary: z.string(),
  reasoning: z.string(),
  bylawCitations: z.array(z.string()).optional(),
  proposedPayload: z.record(z.unknown()),
  status: ProposalStatusSchema,
  requestedByAgent: z.string(),
  reviewedBy: z.string().optional(),
  reviewerNotes: z.string().optional(),
  createdAt: z.string(),
  reviewedAt: z.string().optional(),
  executedAt: z.string().optional(),
});

export const AIAuditEntrySchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  actor: z.object({
    id: z.string(),
    role: z.string(),
    isAi: z.boolean(),
  }),
  actionType: z.string(),
  tier: ActionTierSchema,
  studentAthleteId: z.string().optional(),
  bylawCited: z.string().optional(),
  details: z.record(z.unknown()),
  outcome: z.enum(["SUCCESS", "PROPOSAL_STAGED", "DENIED", "ERROR"]),
});
