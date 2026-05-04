# Requirements Gap Analysis Remediation Plan

## Purpose
This plan converts the current Markdown-vs-implementation audit into a prioritized remediation backlog. It focuses on closing the largest truth gaps between documented requirements and the actual implementation.

## Executive Summary
The repository has strong architectural foundations:
- pnpm/Turborepo monorepo
- broad Prisma schema coverage
- service-oriented backend structure
- gateway/API routing
- meaningful implementation across advising, compliance, AI, support, integration, and monitoring

However, several documentation sets overstate implementation completeness. The highest-risk gaps are:
1. `packages/ai-evals` completion claims exceed current verified state
2. transfer-credit system docs describe largely unimplemented functionality
3. core AAH product docs describe several partially implemented or missing end-user workflows
4. some project docs are stale or contradictory (`README.md`, parts of `CLAUDE.md`, implementation summaries)

---

## Priority Model
- P0 = correctness/trust blocker; docs or code are materially misleading or broken
- P1 = core product gap; important requirement not delivered end-to-end
- P2 = secondary feature gap; important but not blocking core platform credibility
- P3 = cleanup/documentation hardening

---

## P0 — Restore Documentation Truthfulness and Verification Integrity

### P0.1 Re-baseline `packages/ai-evals` status docs
Status: Required immediately

Problem:
Multiple ai-evals docs imply completion/production-readiness, but current verification shows:
- `pnpm --filter @aah/ai-evals type-check` fails
- `pnpm --filter @aah/ai-evals test` fails
- CLI/documented workflows are only partially implemented

Actions:
- Update these docs to reflect current state:
  - `packages/ai-evals/IMPLEMENTATION_COMPLETE.md`
  - `packages/ai-evals/IMPLEMENTATION_SUMMARY.md`
  - `packages/ai-evals/IMPLEMENTATION_CHECKLIST.md`
  - `packages/ai-evals/DX-IMPROVEMENTS-CHECKLIST.md`
  - `packages/ai-evals/TASKS_*.md`
- Add a “Verified Current Status” section to each completion doc:
  - build status
  - type-check status
  - test status
  - known gaps
- Remove or downgrade claims like “production-ready”, “complete”, “100% complete”, and certification-style language unless verified

Acceptance criteria:
- No ai-evals doc claims full completion while type-check or tests are failing
- All completion docs distinguish implemented code from verified operability

### P0.2 Fix stale root-level onboarding docs
Status: Required immediately

Problem:
`README.md` and some guidance docs do not accurately describe the current repo layout and tooling.

Actions:
- Update `README.md` to reflect:
  - `pnpm` usage only
  - current apps: `apps/main`, `apps/student`, `apps/admin`
  - actual services/packages
- Review `CLAUDE.md` for any repo guidance that conflicts with code reality
- Add a short “repo status / known incompleteness” note where appropriate

Acceptance criteria:
- README matches current repo structure and commands
- No critical contributor guidance contradicts implementation reality

### P0.3 Reclassify transfer-credit docs as planned work unless implementation starts now
Status: Required immediately

Problem:
These docs describe a concrete system that does not currently exist:
- `docs/plans/transfer-credit-system/transfer-credits-prd.md`
- `docs/plans/transfer-credit-system/IMPLEMENTATION_PLAN.md`
- `docs/plans/transfer-credit-system/transfer-workflow-prompts.md`
- `docs/plans/transfer-credit-system/transfer-reports-page.md`

Actions:
- Move them under a planning area or clearly mark them as proposed/future scope
- Recommended location:
  - `docs/plans/transfer-credit-system/`
- Add explicit status banner:
  - “Planned / not yet implemented”

Acceptance criteria:
- No reader can mistake transfer-credit docs for implemented functionality

---

## P1 — Fix `packages/ai-evals` to Match Its Own Checklists

### P1.1 Make ai-evals type-check pass
Status: High priority engineering task

Problem:
Type failures indicate architectural drift and duplicate abstractions.

Key issue clusters:
- duplicate type systems
- duplicate runner/base-runner paths
- export mismatches
- CLI dependencies missing
- orchestrator/reporting interfaces out of sync
- monitoring type/value export issues

Actions:
- Consolidate to one authoritative type surface
  - prefer one source of truth under `packages/ai-evals/src/types/`
- Remove or migrate duplicate legacy files where appropriate
- Reconcile runner configs, run result types, report types, metrics, baseline types
- Fix missing dependencies referenced by code or remove unused code paths
- Resolve invalid imports and broken generics

Acceptance criteria:
- `pnpm --filter @aah/ai-evals type-check` exits 0

### P1.2 Make ai-evals tests fully green
Status: High priority engineering task

Problem:
Current suite has one failing test and teardown leakage warnings.

Actions:
- Fix `src/runners/__tests__/base-runner.test.ts` failing expectation
- Investigate open handles/timers with `--detectOpenHandles`
- Ensure test fixtures and runner code align after type consolidation

Acceptance criteria:
- `pnpm --filter @aah/ai-evals test` exits 0
- No open-handle leakage warning remains

### P1.3 Align CLI docs with reality or finish the CLI
Status: High priority product/docs task

Problem:
CLI docs imply runnable workflows, but current implementation contains mock/TODO behavior and missing dependencies.

Actions:
Option A — Honest docs path:
- mark CLI as experimental/skeleton
- document implemented vs mock commands

Option B — Delivery path:
- add missing dependencies
- add actual package script(s)
- replace mock command behavior with real execution/reporting/dataset operations

Acceptance criteria:
- Either docs clearly say “skeleton/experimental”, or CLI is actually runnable as documented

### P1.4 Validate ai-evals datasets and artifacts
Status: High priority cleanup

Problem:
At least one adversarial dataset artifact is invalid JSON per audit findings.

Actions:
- validate all JSON datasets
- fix malformed files
- add CI validation for dataset JSON/schema

Acceptance criteria:
- all committed dataset files parse cleanly
- validation can be run in CI

---

## P1 — Close Core Product End-to-End Gaps

### P1.5 Finish advising workflow integration in student UI
Status: High priority product task

Problem:
Backend scheduling/advising capabilities are ahead of actual student-facing UX.

Actions:
- connect `apps/student/app/schedule/page.tsx` to real data/services
- surface conflict detection, schedule recommendations, and degree-progress context
- remove placeholder/stub behavior

Acceptance criteria:
- student schedule page uses real service-backed data
- conflicts and recommendations are visible in UI

### P1.6 Complete compliance admin rule-management path
Status: High priority product task

Problem:
Docs describe configurable compliance rules/admin workflows, but implementation is not wired end-to-end.

Actions:
- reconcile schema with compliance admin needs
- ensure any rules/config routes are mounted and backed by real models
- add admin UI for rule/version management if required by docs
- remove dead references to nonexistent tables/models

Acceptance criteria:
- compliance configuration is either fully supported or explicitly removed from docs
- no service references nonexistent DB tables/models

### P1.7 Harden AI route auth and admin enforcement
Status: High priority production-readiness task

Problem:
Some AI routes/tools appear partially protected or TODO-marked.

Actions:
- audit all AI routes for auth, RBAC, and admin-only enforcement
- remove “in production” TODO assumptions from live code paths
- unify duplicated AI chat behaviors if there are parallel implementations

Acceptance criteria:
- all AI routes have explicit auth/RBAC handling
- no route relies on comments/TODOs for critical access control

---

## P2 — Deliver Missing Product Surfaces Promised by AAH Docs

### P2.1 Faculty-facing portal/workflows
Problem:
Docs describe faculty participation, but implementation lacks a credible faculty product surface.

Actions:
- decide whether faculty is in scope now
- if yes: implement faculty pages/workflows for absence notices, progress reporting, travel letters
- if no: downgrade docs accordingly

Acceptance criteria:
- faculty feature set is either implemented or explicitly out of current scope

### P2.2 Support workflows: study hall, tutoring, mentoring, workshops
Problem:
Service layer exists, but many flows appear static/mock or incomplete.

Actions:
- inventory endpoints currently using mock behavior
- connect student/admin views to real data and booking/attendance flows
- decide whether geolocation and virtual study hall are real roadmap items or remove from near-term docs

Acceptance criteria:
- support features exposed in UI correspond to functioning backend workflows

### P2.3 Monitoring/intervention UX
Problem:
Monitoring backend exists, but proactive intervention features are not clearly delivered end-to-end.

Actions:
- connect dashboards to real alert/intervention data
- expose prioritized risk/intervention views for staff/coach/admin roles

Acceptance criteria:
- risk, alerts, and interventions are visible and actionable in UI

### P2.4 Accommodation / disability support decision
Problem:
PRD mentions accommodation workflows, but implementation evidence is weak.

Actions:
- either implement secure accommodation management and audit support
- or explicitly defer/remove from active-scope docs

Acceptance criteria:
- accommodation support is either a real feature or clearly documented as future scope

---

## P3 — Strategic Scope Decisions and Cleanup

### P3.1 Decide fate of transfer-credit system
Options:
1. Start implementation as a new initiative
2. Keep as future plan only
3. remove from active repo docs if out of strategy

If implementing, first milestone should be:
- schema for transfer transcript + equivalency + review queue
- OCR/ingestion pipeline design
- equivalency service/API skeleton
- registrar HITL review flow

### P3.2 Reconcile spec ambition with current delivery scope
Problem:
PRD/tech specs include many advanced features that are not yet delivered.

Actions:
- split docs into:
  - current platform capabilities
  - planned roadmap capabilities
- tag each major feature cluster as one of:
  - implemented
  - partial
  - planned

### P3.3 Add repository-wide truth maintenance process
Actions:
- add verification section to implementation summary docs
- require completion docs to include actual command output/status
- optionally add CI to validate markdown status badges/checks

Acceptance criteria:
- docs cannot easily drift into “complete” claims without fresh evidence

---

## Suggested Execution Order

### Phase A — Truth reset (fastest, highest value)
1. Update `README.md`
2. Reclassify transfer-credit docs as planned
3. Downgrade inaccurate ai-evals completion claims
4. Add verified-status notes to key summaries

### Phase B — ai-evals stabilization
5. Make ai-evals type-check pass
6. Make ai-evals tests green
7. Fix/clarify CLI
8. validate datasets

### Phase C — core product closure
9. finish advising schedule UX
10. complete compliance rule-management path
11. harden AI route auth/RBAC
12. close support and monitoring UI gaps

### Phase D — scope rationalization
13. decide on faculty portal
14. decide on accommodations workflow
15. decide on transfer-credit system initiative

---

## Concrete Deliverables

### Documentation deliverables
- Updated `README.md`
- Updated ai-evals completion/checklist docs
- transfer-credit docs moved or relabeled as planned
- new “current capability matrix” doc for AAH core platform

### Engineering deliverables
- ai-evals type-check passing
- ai-evals tests passing
- service/schema mismatches removed in compliance area
- advising schedule UI fully wired
- AI route access control audit completed

---

## Recommended Owners by Workstream
- Docs truth/reset: platform lead or repo maintainer
- ai-evals stabilization: ai-evals/package owner
- advising/compliance/AI integration: service owners
- faculty/support/monitoring product completion: frontend + service owners
- transfer-credit initiative: separate scoped project if retained

---

## Success Criteria
This remediation plan is complete when:
- no major Markdown doc materially overstates implementation
- ai-evals verification commands pass or docs explicitly describe current failures
- all “implemented” claims map to working code paths, not just schema or stubs
- planned work is clearly separated from shipped functionality
- highest-value user workflows are operational end-to-end
