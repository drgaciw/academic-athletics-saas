# Requirements Gap Analysis Task List

Source plan:
- `docs/reports/requirements-gap-analysis-remediation-plan.md`

Use this as the execution checklist for closing the documented gaps between requirements and implementation.

## P0 — Documentation Truth Reset

### P0.1 Re-baseline `packages/ai-evals` status docs
- [ ] Review current verification status for `packages/ai-evals`
- [ ] Update `packages/ai-evals/IMPLEMENTATION_COMPLETE.md`
- [ ] Update `packages/ai-evals/IMPLEMENTATION_SUMMARY.md`
- [ ] Update `packages/ai-evals/IMPLEMENTATION_CHECKLIST.md`
- [ ] Update `packages/ai-evals/DX-IMPROVEMENTS-CHECKLIST.md`
- [ ] Update all relevant `packages/ai-evals/TASKS_*.md` completion docs
- [ ] Add a “Verified Current Status” section to each ai-evals completion doc
- [ ] Remove or downgrade any unverified “production-ready”, “complete”, “100% complete”, or certification-style claims
- [ ] Confirm no ai-evals doc claims full completion while type-check or tests are failing

### P0.2 Fix stale root-level onboarding docs
- [ ] Update `README.md` to reflect current repo structure
- [ ] Update `README.md` to reflect `pnpm` as the package manager
- [ ] Verify app layout in docs matches `apps/main`, `apps/student`, `apps/admin`
- [ ] Review `CLAUDE.md` for guidance that conflicts with actual implementation
- [ ] Fix any conflicting contributor guidance in `CLAUDE.md`
- [ ] Add a short repo-status / known-incompleteness note where needed

### P0.3 Reclassify transfer-credit docs as planned work
- [ ] Decide whether transfer-credit docs stay at repo root or move under `docs/plans/`
- [x] Move or relabel `docs/plans/transfer-credit-system/transfer-credits-prd.md`
- [x] Move or relabel `docs/plans/transfer-credit-system/IMPLEMENTATION_PLAN.md`
- [x] Move or relabel `docs/plans/transfer-credit-system/transfer-workflow-prompts.md`
- [x] Move or relabel `docs/plans/transfer-credit-system/transfer-reports-page.md`
- [ ] Add a visible “Planned / not yet implemented” status banner to each transfer-credit doc
- [ ] Confirm no transfer-credit doc reads like shipped functionality

## P1 — `packages/ai-evals` Stabilization

### P1.1 Make ai-evals type-check pass
- [ ] Identify authoritative type surface for `packages/ai-evals`
- [ ] Consolidate duplicate type definitions
- [ ] Reconcile duplicate runner/base-runner implementations
- [ ] Fix broken exports/imports across runners, orchestrator, monitoring, safety, and datasets
- [ ] Add missing dependencies referenced by code, or remove dead code paths
- [ ] Resolve generic/type mismatches in runner and dataset APIs
- [ ] Run `pnpm --filter @aah/ai-evals type-check`
- [ ] Iterate until `pnpm --filter @aah/ai-evals type-check` exits 0

### P1.2 Make ai-evals tests fully green
- [ ] Investigate failing test in `src/runners/__tests__/base-runner.test.ts`
- [ ] Fix root cause of failing dataset-runner expectation
- [ ] Run tests with open-handle diagnostics if needed
- [ ] Fix leaked timers/open handles
- [ ] Run `pnpm --filter @aah/ai-evals test`
- [ ] Iterate until `pnpm --filter @aah/ai-evals test` exits 0

### P1.3 Align CLI docs with reality or finish the CLI
- [ ] Decide whether CLI is “experimental/skeleton” or a near-term delivery target
- [ ] If keeping experimental: update CLI docs to reflect current limitations
- [ ] If finishing CLI: add missing dependencies and package scripts
- [ ] Replace mock/TODO behavior in run/compare/report/dataset/config commands as needed
- [ ] Verify CLI commands actually run as documented
- [ ] Ensure docs accurately match implemented CLI behavior

### P1.4 Validate ai-evals datasets and artifacts
- [ ] Validate all JSON datasets under `packages/ai-evals/datasets/`
- [ ] Fix malformed JSON files
- [ ] Validate dataset structure against expected schema
- [ ] Add reusable dataset validation command or script
- [ ] Add dataset validation to CI or verification workflow

## P1 — Core Product Closure

### P1.5 Finish advising workflow integration in student UI
- [ ] Audit current placeholder/stub behavior in `apps/student/app/schedule/page.tsx`
- [ ] Connect student schedule page to real advising/service data
- [ ] Surface schedule conflicts in UI
- [ ] Surface recommendations in UI
- [ ] Surface degree-progress context in UI where appropriate
- [ ] Remove stubbed/mock behavior from the schedule page
- [ ] Verify schedule workflow works end-to-end

### P1.6 Complete compliance admin rule-management path
- [ ] Audit compliance service references to missing tables/models
- [ ] Reconcile Prisma schema with compliance rule-management requirements
- [ ] Ensure compliance rules/config routes are mounted
- [ ] Ensure rules/config routes are backed by real models
- [ ] Add or complete admin UI for rule/version management if still in scope
- [ ] Remove dead code paths referencing nonexistent DB structures
- [ ] Verify end-to-end compliance rule-management flow

### P1.7 Harden AI route auth and admin enforcement
- [ ] Audit all AI routes for authentication coverage
- [ ] Audit all AI routes for RBAC/admin-only enforcement
- [ ] Remove any “TODO/in production” assumptions from critical access-control paths
- [ ] Reconcile duplicate AI chat implementations if they create inconsistent behavior
- [ ] Verify all sensitive AI routes are explicitly protected

## P2 — Missing Product Surfaces

### P2.1 Faculty-facing portal/workflows
- [ ] Decide whether faculty workflows are in current scope
- [ ] If yes: define minimum faculty feature set for this release
- [ ] Implement faculty progress-report workflow
- [ ] Implement faculty absence/travel-letter workflow as needed
- [ ] Add faculty-facing pages/routes
- [ ] If no: downgrade docs to future scope

### P2.2 Support workflows: study hall, tutoring, mentoring, workshops
- [ ] Audit which support flows are currently static/mock-backed
- [ ] Connect tutoring UI to real booking/availability data
- [ ] Connect study hall UI to real attendance/check-in data
- [ ] Connect mentoring and workshop views to real service data
- [ ] Decide whether geolocation check-in is current scope or roadmap-only
- [ ] Decide whether virtual study hall is current scope or roadmap-only
- [ ] Update docs to match delivered scope

### P2.3 Monitoring/intervention UX
- [ ] Audit current monitoring/risk/intervention UI coverage
- [ ] Connect dashboards to real alert data
- [ ] Connect dashboards to real intervention-plan data
- [ ] Expose prioritized risk/intervention views for admin/coach/staff users
- [ ] Verify monitoring workflows are actionable end-to-end

### P2.4 Accommodation / disability support decision
- [ ] Decide whether accommodation/disability support is in active scope
- [ ] If yes: define required data model, security, and audit workflow
- [ ] Implement secure accommodation management flow
- [ ] If no: explicitly defer/remove from active-scope docs

## P3 — Strategic Scope and Process Cleanup

### P3.1 Decide fate of transfer-credit system
- [ ] Decide whether transfer-credit system is active roadmap, future plan, or out of scope
- [ ] If active roadmap: create a dedicated project plan and milestone breakdown
- [ ] If active roadmap: define schema for transfer transcript/equivalency/review queue
- [ ] If active roadmap: define OCR/ingestion architecture
- [ ] If active roadmap: define equivalency service/API skeleton
- [ ] If active roadmap: define registrar HITL review workflow
- [ ] If not active: keep docs clearly marked as planned only

### P3.2 Reconcile spec ambition with current delivery scope
- [ ] Split “current capabilities” from “planned roadmap” in major product docs
- [ ] Tag each major feature cluster as implemented / partial / planned
- [ ] Update PRD/spec summaries to reflect actual delivery state
- [ ] Remove ambiguity about what is shipped vs proposed

### P3.3 Add a repository-wide truth-maintenance process
- [ ] Define a standard “verification” section template for implementation summary docs
- [ ] Require fresh command-based evidence for completion claims
- [ ] Add verification notes to major completion reports
- [ ] Optionally add CI checks for status/verification consistency
- [ ] Document the rule: implemented != verified complete

## Verification Checklist
- [ ] No major Markdown file materially overstates implementation status
- [ ] `packages/ai-evals` docs match actual verification outcomes
- [ ] Transfer-credit docs are clearly marked as planned unless implementation exists
- [ ] Root onboarding docs match real repo structure and tooling
- [ ] Core “implemented” claims map to working end-to-end flows

## Suggested Execution Order
- [ ] Phase A: documentation truth reset
- [ ] Phase B: ai-evals stabilization
- [ ] Phase C: core product workflow closure
- [ ] Phase D: strategic scope decisions and process hardening
