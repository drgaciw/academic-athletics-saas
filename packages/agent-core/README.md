# @aah/agent-core

Shared, framework-agnostic AI agent core, tool contracts, Zod schemas, and Human-in-the-Loop (HITL) compliance engine for **Athletic Academics Hub**.

Designed to be consumed seamlessly across any subproject in the workspace:

- `athletic-academics-hub-gcp` (Angular / Node / Express / GCP)
- `academic-compliance-hub-glm` (Next.js / Hono / Nitro / Turborepo)
- `academic-athletics-saas-kiro` (Next.js / Clerk / Turborepo)
- `academic-athletics-saas-gemini` (Next.js / Clerk / Turborepo)

---

## Key Features

1. **Single Unified Multi-Skill Agent**: Dynamic on-demand tool loading across 5 collegiate athletic academic domains:
   - **NCAA Division I Eligibility & Compliance**: PTD percentage calculation (40/60/80%), 6-hour term rule, 18-hour annual rule, 24-hour freshman rule, GPA minimums (1.8/1.9/2.0), and course drop simulation.
   - **Academic Advising & Schedule Optimizer**: Degree audit roadmaps, prerequisite sequencing, and conflict detection with mandatory CARA practice blocks (20 hrs/wk) and travel schedules.
   - **Academic Risk & Proactive Intervention**: Multi-factor predictive risk scoring (0-100), GPA trajectory, unexcused absence alerts, and tutor referral assignments.
   - **Document & Transcript Ingestion**: Structured parsing of high school, 2-4 junior college, and 4-4 transfer transcripts with grade validation and articulation mapping.
   - **APR & GSR Institutional Reporting**: Team Academic Progress Rate calculation (eligibility + retention points per term) and NCAA postseason penalty forecasting (930 cutoff).

2. **Tiered Human-in-the-Loop (HITL) Governance**:
   - **Tier 1 (Autonomous)**: Read queries, course availability checks, transcript summaries, schedule simulations, GPA projections.
   - **Tier 2 (Staff Review Required)**: Tutor assignments, faculty progress inquiries, study hall mandates, tentative transfer credit mappings.
   - **Tier 3 (Compliance Gate)**: Official NCAA eligibility certification, full-time enrollment drop waivers, APR report submission, medical hardship waiver filing.

3. **Tiered Memory System**:
   - **Working Memory**: In-flight task scratchpad and active tool execution trace.
   - **Session Memory**: Conversational thread history for multi-turn student/advisor dialogues.
   - **Long-Term Memory**: Durable semantic facts, student goals, and accommodations with vector cosine search.

---

## Quick Usage Example

```typescript
import {
  AgentOrchestrator,
  createDefaultToolRegistry,
  InMemoryStore,
  ActionGate,
  AIAuditLogger,
} from "@aah/agent-core";

// 1. Initialize runtime
const toolRegistry = createDefaultToolRegistry();
const memoryStore = new InMemoryStore();
const actionGate = new ActionGate();
const auditLogger = new AIAuditLogger();

const agent = new AgentOrchestrator({
  toolRegistry,
  memoryStore,
  actionGate,
  auditLogger,
});

// 2. Dispatch a Tier 1 Autonomous Query
const complianceReport = await agent.dispatchAction({
  actionName: "evaluate_ncaa_eligibility",
  input: {
    studentId: "ATH-101",
    studentName: "Marcus Vance",
    sport: "Men's Basketball",
    currentTermNumber: 5,
    enrolledCredits: 15,
    lastTermPassedCredits: 12,
    academicYearCredits: 26,
    cumulativeDegreeCredits: 52,
    totalDegreeCreditsRequired: 120,
    cumulativeGpa: 2.85,
    major: "Business Administration",
    majorDeclared: true,
  },
  context: {
    userId: "USR-1",
    userRole: "ADVISOR",
    studentAthleteId: "ATH-101",
  },
});

// 3. Dispatch a Tier 3 High-Stakes Action (Automatically Staged as Proposal)
const stagedProposalResult = await agent.dispatchAction({
  actionName: "certify_official_eligibility",
  input: { studentId: "ATH-101", term: "Spring 2027" },
  context: { userId: "USR-AI", userRole: "AGENT", studentAthleteId: "ATH-101" },
  bylawCitations: ["Bylaw 14.4.3.2.1"],
});
// stagedProposalResult.isStagedProposal === true
// stagedProposalResult.proposalId === "PROP-..."
```

---

## Building and Testing

```bash
# Install dependencies
npm install

# Compile TypeScript to dist/
npm run build

# Run comprehensive test suite
npm test
```
