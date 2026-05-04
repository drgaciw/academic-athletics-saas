# Project Improvement Plan

This document outlines a plan to improve the `academic-athletics-saas` project, focusing on maintainability, scalability, and developer experience.

## 1. Documentation Organization

**Problem:** The root directory is cluttered with numerous markdown files (e.g., `AGENT_MEMORY_COORDINATION_SUMMARY.md`, `AI_EVALS_SETUP.md`, `DEPLOYMENT.md`), making it difficult to navigate and find relevant information.

**Solution:**
- Create a `docs/` directory (if not already effectively used).
- Categorize and move markdown files into subdirectories within `docs/`:
    - `docs/architecture/`: `MONOREPO_SETUP.md`, `DEPLOYMENT.md`
    - `docs/ai-evals/`: `AI_EVALS_*.md`
    - `docs/reports/`: `*_SUMMARY.md` (or archive these if they are outdated session logs)
    - `docs/guides/`: `SETUP_CHECKLIST.md`, `CLAUDE.md`
- Update `README.md` to link to these new locations.

## 2. CI/CD Standardization

**Problem:** While there are some GitHub workflows (`ai-evals.yml`, `claude.yml`), there doesn't appear to be a comprehensive "CI" workflow that runs standard checks (build, lint, test) across the entire monorepo on every Pull Request.

**Solution:**
- Create `.github/workflows/ci.yml`.
- Configure it to run:
    - `pnpm install`
    - `pnpm run build` (using Turbo to cache and parallelize)
    - `pnpm run lint`
    - `pnpm run test`
- Ensure it triggers on `push` to `main` and `pull_request`.

## 3. Testing Strategy

**Problem:** There is an `integration-tests.ts` file in the root directory, which feels ad-hoc. Unit tests exist (Jest), but end-to-end or integration testing seems less structured.

**Solution:**
- Move `integration-tests.ts` to a dedicated `tests/integration` directory or a `packages/integration-tests` workspace.
- Set up a proper test runner for integration tests (if not already using Jest/Vitest for this).
- Consider adding Playwright or Cypress for end-to-end testing of the `apps/main` Next.js application.

## 4. Dependency Management

**Problem:** In a monorepo, dependency versions can drift between packages.

**Solution:**
- Install `syncpack` to ensure consistent dependency versions across `package.json` files.
- Add a `fix:deps` script to `package.json` to run `syncpack fix-mismatches`.

## 5. Developer Experience (DX)

**Problem:** No pre-commit hooks are visible in the root `package.json` scripts (though they might exist in `.husky` if hidden).

**Solution:**
- Install `husky` and `lint-staged`.
- Configure a pre-commit hook to run `lint-staged` to ensure no broken code or linting errors are committed.

## 6. Code Quality & Consistency

**Problem:** `tsconfig.base.json` exists, which is good. Ensure all packages extend this base config.

**Solution:**
- Audit all `tsconfig.json` files in `apps/*`, `packages/*`, and `services/*` to ensure they extend `tsconfig.base.json`.
- Standardize `eslint` configuration if not already done (create a `@aah/eslint-config` package if it doesn't exist).

## Implementation Phases

### Phase 1: Cleanup & Organization (Low Risk)
- Move documentation files.
- Setup `syncpack`.

### Phase 2: CI/CD & Quality (Medium Risk)
- Create `ci.yml`.
- Setup `husky` and `lint-staged`.

### Phase 3: Testing Infrastructure (Medium/High Risk)
- Refactor `integration-tests.ts`.
- Setup E2E testing framework.
