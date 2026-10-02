---
name: cross-repo-contract-sync
description: >-
  Audits, synchronizes, and validates Prisma data schemas, TypeScript interfaces, and API contracts
  across the 4 multi-repo subprojects (athletic-academics-hub-gcp, academic-compliance-hub-glm,
  academic-athletics-saas-gemini, academic-athletics-saas-kiro).
  Use when modifying Prisma schemas, adding new AI agent memory/task tables, comparing database
  models across stacks, or verifying cross-project contract parity.
  WHEN: "sync schemas", "compare prisma", "cross repo sync", "verify contracts",
  "check schema divergence", "contract diff", "schema parity".
---

# Cross-Repo Contract & Schema Synchronizer Skill

This skill provides tooling and guidelines to maintain schema and data model consistency across the 4 Athletic Academics Hub subprojects:

1. `athletic-academics-hub-gcp` (Angular / Node / Express / Prisma)
2. `academic-compliance-hub-glm` (Next.js / Hono / Turborepo / Prisma)
3. `academic-athletics-saas-kiro` (Next.js / Clerk / Turborepo / Prisma)
4. `academic-athletics-saas-gemini` (Next.js / Clerk / Turborepo / Prisma)

---

## 1. Running the Automated Schema Parity Tool

A bundled Python synchronizer is available in `scripts/sync_contracts.py`.

### View Overall Model Availability Matrix

```bash
python .agents/skills/cross-repo-contract-sync/scripts/sync_contracts.py
```

### Display All Models in a Formatted Matrix

```bash
python .agents/skills/cross-repo-contract-sync/scripts/sync_contracts.py --models
```

### Inspect Field-Level Differences for a Specific Model

```bash
python .agents/skills/cross-repo-contract-sync/scripts/sync_contracts.py --diff AgentMemory
python .agents/skills/cross-repo-contract-sync/scripts/sync_contracts.py --diff ComplianceAudit
```

### Export Machine-Readable JSON Analysis

```bash
python .agents/skills/cross-repo-contract-sync/scripts/sync_contracts.py --json
```

---

## 2. Canonical Model Requirements

When introducing new models or fields to support agentic functionality (e.g. `AgentMemory`, `AIAuditLog`, `ActionProposal`), consult `references/canonical_models.json` to ensure field naming and types align across all repositories:

- **`AgentMemory`**: Requires `userId`, `memoryType` (`working` | `session` | `long_term`), `content`, `embedding` (Unsupported("vector(1536)") or float array), `importance`, and `confidence`.
- **`AIAuditLog`**: Requires `agentType`, `actionType`, `studentAthleteId`, `proposedChanges`, `approvalStatus` (`PENDING` | `APPROVED` | `REJECTED`), and `reviewedBy`.
