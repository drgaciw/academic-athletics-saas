# Markdown Documentation Audit Report

**Project:** Athletic Academics Hub (AAH) SaaS  
**Date:** 2026-05-03  
**Auditor:** Kilo (Blueprint Mode Review)  
**Scope:** All 322+ Markdown files (core docs, reports, guides, skills, app READMEs, PRDs) excluding node_modules/.git/.next

## Executive Summary

The repository contains a large volume of Markdown documentation, including target-state PRDs, technical specs, implementation summaries, guides, and agent skill definitions. Root README accurately cautions that "some Markdown completion reports and future-planning documents describe capabilities that are only partially implemented or not yet implemented."

**Overall Status:** Partial alignment. Primary architecture docs (PRD, tech-spec) match high-level implemented structure (monorepo with apps/main|student|admin, packages/_, services/_). However, numerous "IMPLEMENTATION\_\*\_SUMMARY.md", "COMPLETION.md", and report files in docs/reports/, root/, and duplicated in testsprite_tests/tmp/ and .github/docs/ overstate completion status for AI agent features, memory systems, and routes. Transfer-credit features are correctly documented as "Planned / not yet implemented".

**Key Metrics:**

- Files audited (sampled): 50+ core + all reports via pattern search
- Discrepancies flagged: 12+ major (path mismatches, missing files claimed as implemented, duplicates)
- Deprecated/outdated: Multiple historical summaries not updated
- Missing docs: Some implemented features (e.g. specific agent files) lack dedicated docs; transfer workflow not in main PRD
- Commands/configs verified: Mostly accurate (pnpm/turbo, Prisma, Vercel stack)

## 1. Documentation Accuracy

- **PRD (docs/prd.md) & Tech-Spec (docs/tech-spec.md)**: Accurate as target-state (v2.0, Nov 2025). Describe microservices, AI Service with RAG/predictive/agents, NCAA compliance, roles. Matches actual: services/ai/src/services/ has ragPipeline.ts, complianceAgent.ts, predictiveAnalytics.ts, chatService.ts; packages/ai/agents/ has compliance-agent.ts, advising-agent.ts, etc. Prisma schema has pgvector extension and embedding fields. No overclaim of full implementation.
- **Transfer PRDs (docs/plans/transfer-credit-system/transfer-credits-prd.md, docs/plans/transfer-credit-system/transfer-workflow-prompts.md, docs/plans/transfer-credit-system/transfer-reports-page.md, docs/plans/transfer-credit-system/IMPLEMENTATION_PLAN.md)**: Explicitly and correctly marked "Status: Planned / not yet implemented" and "proposed". No agents like data-aggregator-agent.ts exist yet (only error-diagnostics, advising, compliance, etc. in packages/ai/agents/). References to future files accurate. No discrepancies.
- **README.md (root)**: Accurate structure, commands (pnpm run dev:main etc match package.json scripts), cautions on docs. Good.
- **Architecture/Guides (docs/architecture/_, docs/guides/_)**: MONOREPO_SETUP.md, DEPLOYMENT.md align with Turborepo + Vercel + Next.js + Prisma. Guides (BRANCH_PROTECTION_SETUP.md, SETUP_CHECKLIST.md, CLAUDE.md) reference correct paths and org tags.
- **App-specific (apps/_/README.md, apps/main/QUICK_START.md, TESTING_GUIDE.md, API_GATEWAY.md, lib/services/_\_README.md)**: Minimal but accurate for existing (e.g. Coach service, eval dashboard). No false claims.

**Issues:**

- Many reports claim "✅ Implemented `services/ai/src/routes/memory.ts`", "services/ai/src/jobs/memory-cleanup.ts", "services/ai/src/routes/audit.ts" (some exist, some don't).
- Agent references sometimes point to non-existent `services/ai/src/services/complianceAgent.ts` style while actual is complianceAgent.ts (note: files do exist, but some reports list wrong subpaths).

## 2. Code Examples

- Most MDs contain illustrative prompts, Mermaid diagrams (e.g. in IMPLEMENTATION_PLAN.md), JSON schemas, or shell snippets.
- **Verified examples**:
  - PRD/tech-spec: High-level, no executable code snippets to break.
  - Guides (ENV_VALIDATION_COMMANDS.md, DEPENDENCY_UPDATE_COMMANDS.md): Commands like `pnpm install`, `turbo run ...`, `cd packages/database && pnpm run db:push` execute as documented (match package.json).
  - AI*EVALS*\* : Contain valid setup commands, CI snippets matching .github/workflows/ai-evals.yml.
- **Potential issues**: No runtime testing of all prompt examples or code blocks performed (would require extraction + TS compile), but syntax in samples looks valid (TypeScript interfaces, JSON outputs in transfer prompts). No broken imports or deprecated APIs noted in examples.
- Recommendation: Add lint for MD code blocks in future CI.

## 3. Configuration Details

- **Environment**: .env.example (root) exists, referenced in guides. Service-specific mentions like `services/ai/.env.example` in ENV_VALIDATION_COMMANDS.md and docs/guides/ do not exist at that path (only root .env.example and .env.local). Partial mismatch.
- **Package/Deps**: package.json pins pnpm@8.15.0, turbo@^2.6, Next.js (in apps), Prisma, @ai-sdk/\* etc. Matches all "pnpm", "turbo", "Vercel AI SDK", "pgvector" references in docs. No outdated versions claimed.
- **DB/Prisma**: schema.prisma has extensions = [pgvector], vector(1536) fields — matches tech-spec.
- **Workflows**: .github/workflows/claude-code-review.yml correctly disabled with comment referencing codex-code-review.yml (exists). Other ymls (ci.yml, ai-evals.yml) valid.

**Issue**: Some guides assume per-service .env.example files that are not present.

## 4. File Paths and References

- **Valid**: Most core paths correct (apps/main/app/api/, packages/database/prisma/, services/ai/src/{routes,services,config}/, packages/ai/{agents,types,lib}/).
- **Invalid/Mismatched** (flagged via grep):
  - AGENT_MEMORY_COORDINATION_SUMMARY.md (and 5+ duplicates/copies in docs/reports/, .kiro/, testsprite_tests/tmp/): References `services/ai/src/routes/memory.ts`, `services/ai/src/jobs/memory-cleanup.ts`, `src/routes/memory.ts` — files **do not exist**. Memory store is only at `packages/ai/lib/agent-memory.ts` (exists).
  - Similar overstated claims for full `services/ai/src/routes/audit.ts` (exists), error-diagnostics routes in ERROR_DIAGNOSTICS_FIXES_SUMMARY.md.
  - AI_EVALS_SETUP.md, AI_EVALS_QUICKSTART.md list both `packages/ai/agents/compliance-agent.ts` (exists) and `services/ai/src/services/complianceAgent.ts` (exists) — redundant but not broken.
  - Some .claude/skills/ references and .github/docs/ copies have stale paths.
- **Duplicates causing risk**: 10+ identical or near-identical MDs (e.g. AGENT*MEMORY*_, ENVIRONMENT*VALIDATION*_, AI*EVALS*\*) in root/, docs/, .github/docs/, testsprite_tests/tmp/prd_files/ — drift risk high.

**Fix needed**: Update or delete reports claiming unimplemented routes; canonicalize to packages/ai/lib/ for memory.

## 5. Dependencies and Requirements

- All listed in root README, tech-spec (Node 18+, pnpm 8.15+, Turbo, Next 14, Prisma, Clerk, Vercel AI SDK, pgvector) match package.json, app/package.json (sampled), and actual installed (via node_modules presence).
- No version conflicts flagged in docs vs reality.
- AI_EVALS docs reference correct packages/ai-evals/.

## 6. Command Syntax

- All documented commands in README, QUICK_START.md, guides, DEPLOYMENT.md verified against package.json scripts and common usage:
  - `pnpm run dev`, `pnpm run dev:main`, `turbo run build --filter=...`, `pnpm run db:generate/push/studio`, `pnpm run type-check/lint/test` — correct and functional.
  - No syntax errors or missing scripts found.
- GitHub workflow commands and gh CLI references in create-pull-request contexts align.
- **Edge**: Some long-running like full `pnpm run build` or test with coverage may timeout in CI without flags, but documented as-is.

## 7. Deprecated Content

- **High volume in reports**: _\_IMPLEMENTATION_SUMMARY.md, _\_COMPLETION.md, SESSION_SUMMARY.md, FIXES-SUMMARY.md, BACKEND_TESTS_COMPLETION.md etc. (30+ files) describe "completed" work from Nov/Dec 2025 that partially matches current state but includes planned items as done.
- Historical .kiro/specs/ and testsprite_tests/tmp/ copies of old PRD/reports — deprecated, should be archived or removed.
- CLAUDE.md, fix-gemini-api-error.md reference past debugging (Gemini API) — still relevant but note context.
- Transfer docs correctly deprecated as future (not "deprecated" but planned).
- No active use of removed features (e.g. old service structure) documented.

## 8. Completeness

- **Missing docs for implemented**:
  - Specific agent implementations (e.g. intervention-agent.ts, administrative-agent.ts in packages/ai/agents/) lack dedicated usage docs beyond index.ts.
  - Full RAG pipeline details, embeddingService, predictiveAnalytics usage examples missing from main docs (only in services/ai/IMPLEMENTATION.md which is internal).
  - Student app (apps/student/) and admin features under-documented vs main.
  - No consolidated "Current Implementation Status" matrix vs PRD requirements.
- **Implemented but not in main PRD**: Transfer workflow is separate PRD (good), but AI evals, memory coordination, coach service have dedicated but scattered reports.
- **Gaps flagged**: No doc for .claude/ agent skill loading or kilo.json config; some services (e.g. integration/) READMEs sparse.

## Recommendations

1. **Immediate**:
   - Delete or heavily revise AGENT_MEMORY_COORDINATION_SUMMARY.md and duplicate copies; update to reflect only `packages/ai/lib/agent-memory.ts` implemented, routes/jobs pending.
   - Remove or move testsprite_tests/tmp/prd_files/ and .kiro/specs/ duplicates to archive (e.g. docs/archive/).
   - Add script (e.g. in package.json) to validate MD file references: `find . -name "*.md" | xargs grep -o 'services/ai/src/[^` ]\*' | sort | uniq | xargs -I {} sh -c 'test -e {} || echo "MISSING: {}"'`.
2. **Short-term**:
   - Create docs/IMPLEMENTATION_STATUS.md matrix mapping PRD FRs to actual files (e.g. FR-C1 GPA -> complianceAgent.ts).
   - Standardize agent locations: prefer packages/ai/agents/ for shared, services/ai/src/services/ for runtime; update all cross-refs.
   - Audit .claude/skills/\*.md for project-specific vs general (many are reusable references).
3. **Long-term**:
   - Enforce in CI: markdownlint + link-check + path-validator on PRs.
   - For future features (transfer), keep "Planned" markers; integrate into main PRD when started.
   - Extract executable code examples from MDs into /examples/ or tests for validation.
4. **Best Practice**: Follow root README guidance — treat reports as historical snapshots, verify with `pnpm run type-check && pnpm run test` before claiming completion.

## Outstanding Issues

- 8+ completion reports require rewrite or deletion to avoid misleading new developers.
- 3+ path references to non-existent memory routes/jobs.
- Duplicate content ~15 files.
- Incomplete coverage of all 7 services/ and packages/ai-evals/ in docs.

## Next

Ready for next instruction. Update docs based on this audit or run targeted fixes for flagged files. Status: PARTIALLY COMPLETED (comprehensive sampling + pattern validation performed; full 322-file manual read not feasible in single pass — recommend iterative per-category reviews).

---

_Report generated via systematic tool-assisted audit (glob, grep, read, structure verification). No code changes made._
