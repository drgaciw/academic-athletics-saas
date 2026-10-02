/**
 * Reference Adapter: Integrating @aah/agent-core into Express / Node.js
 * Applicable to: athletic-academics-hub-gcp/backend or academic-athletics-saas-*
 */

import {
  AgentOrchestrator,
  createDefaultToolRegistry,
  InMemoryStore,
  ActionGate,
  AIAuditLogger,
  ToolExecutionContext,
} from "../dist/index.js";

// 1. Initialize the shared agent runtime
const toolRegistry = createDefaultToolRegistry();
const memoryStore = new InMemoryStore();
const actionGate = new ActionGate({
  onProposalCreated: async (proposal) => {
    console.log(
      `[ALERT] New staged proposal ${proposal.id} requires human approval (${proposal.tier}).`,
    );
    // Example: Dispatch webhook, push notification to advisor dashboard, or write to database
  },
  onProposalApproved: async (proposal) => {
    console.log(
      `[AUDIT] Proposal ${proposal.id} approved by ${proposal.reviewedBy}. Ready for execution.`,
    );
  },
});
const auditLogger = new AIAuditLogger();

export const agentOrchestrator = new AgentOrchestrator({
  toolRegistry,
  memoryStore,
  actionGate,
  auditLogger,
});

/**
 * Example Express Route Handlers
 */

// POST /api/agent/dispatch
export async function handleAgentAction(req: { body: any; auth: any }) {
  const context: ToolExecutionContext = {
    userId: req.auth.userId,
    userRole: req.auth.role, // 'STUDENT_ATHLETE' | 'ADVISOR' | 'COMPLIANCE_OFFICER'
    studentAthleteId: req.body.studentAthleteId,
    sessionId: req.body.sessionId,
  };

  const result = await agentOrchestrator.dispatchAction({
    actionName: req.body.actionName,
    input: req.body.input,
    context,
    summary: req.body.summary,
    reasoning: req.body.reasoning,
    bylawCitations: req.body.bylawCitations,
  });

  return result;
}

// POST /api/compliance/proposals/:id/approve
export async function handleApproveProposal(req: {
  params: { id: string };
  body: { notes?: string };
  auth: any;
}) {
  // Enforce staff RBAC
  if (!["ADVISOR", "COMPLIANCE_OFFICER", "ADMIN"].includes(req.auth.role)) {
    throw new Error(
      "Forbidden: Only authorized compliance staff may approve staged proposals.",
    );
  }

  const proposalId = req.params.id;
  const reviewerId = req.auth.userId;

  // 1. Sign off on proposal in the ActionGate
  await actionGate.approveProposal(proposalId, reviewerId, req.body.notes);

  // 2. Execute underlying high-stakes mutation
  const reviewerContext: ToolExecutionContext = {
    userId: reviewerId,
    userRole: req.auth.role,
  };

  const executionResult = await agentOrchestrator.executeApprovedProposal(
    proposalId,
    reviewerContext,
  );
  return executionResult;
}

// POST /api/compliance/proposals/:id/reject
export async function handleRejectProposal(req: {
  params: { id: string };
  body: { reason: string };
  auth: any;
}) {
  if (!["ADVISOR", "COMPLIANCE_OFFICER", "ADMIN"].includes(req.auth.role)) {
    throw new Error("Forbidden");
  }

  const proposal = await actionGate.rejectProposal(
    req.params.id,
    req.auth.userId,
    req.body.reason,
  );
  return { success: true, proposal };
}

// GET /api/compliance/proposals/pending
export async function handleListPendingProposals(req: {
  query: { studentId?: string };
}) {
  const proposals = actionGate.listPendingProposals(req.query.studentId);
  return { count: proposals.length, proposals };
}
