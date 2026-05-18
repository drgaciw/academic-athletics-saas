## Learned User Preferences

- Prefer read-only git inspection by default; avoid destructive git commands (force push, hard reset, etc.) unless the user explicitly approves.
- Do not commit local agent or tool config directories (`.agents/`, `.codex/`, `.cursor/`, `.kilo/`) unless the user explicitly asks.

## Learned Workspace Facts

- Monorepo uses **pnpm** and **Turborepo**; **`apps/main`** is the coach/compliance/staff Next app (`app/` routes); **`apps/student`** is the student-athlete Next app (dashboard, `/chat`, schedule); **`apps/admin`** is the operational admin app with **Prisma-backed** student and compliance record views.
- Coach routes live under **`apps/main/app/coach/`** (e.g. dashboard, updates); server layouts gate access with **Clerk** and **Prisma** `user.role === 'COACH'`.
- Regulation/compliance UI includes **`apps/main/app/compliance/`** (e.g. changes detail) and **`apps/main/app/coach/updates/`**; list/detail patterns should align with existing auth and role checks before loading regulation data. Operational guide: **`docs/guides/REGULATION_WATCH.md`**.
- **`services/compliance`** is the **Hono** compliance microservice (eligibility, violations, audit, rule engine); **`apps/main/app/api/compliance/[...path]/route.ts`** BFF-proxies to it via **`getServiceUrl('compliance')`** (env defaults include localhost ports per service).
- **`services/ai`** is the **Hono** AI chat/RAG microservice; **`apps/main/app/api/ai/[...path]/route.ts`** BFF-proxies via **`getServiceUrl('ai')`** and forwards **`X-User-Id`** / **`X-User-Role`**. PRD v2.2 student policy: **`eligibilityResponseGuard`**, eligibility intent detection, and **buffered** (non-streaming) chat for **`userRole === 'STUDENT'`** so guards run before client-visible output.
- **`services/integration`** covers email (e.g. Resend), LMS/SIS routes, and related connectors; **`services/monitoring`** exposes alerts and **Pusher** for real-time channels; **`services/user`** handles **Clerk webhook** user sync.
- **PostgreSQL** + **Prisma** central schema in **`packages/database/prisma/schema.prisma`** (`@aah/database`); extensions include **pgvector**. **`UserRole`** includes **`COMPLIANCE`** for regulation workflows. New regulation/source/fetch-run entities belong here with **`prisma migrate`**, not ad hoc SQL long term.
- Student eligibility AI requirements live in **`docs/prd.md`** (v2.2) and **`docs/plans/student-facing-eligibility-ai/`**; student chat surfaces use **`StudentEligibilityDisclaimer`** from **`@aah/ui`** (`showStudentEligibilityDisclaimer` on **`ChatWidget`** in **`apps/student`**).
- **Vercel Cron** schedules are declared in **`vercel.json`** / **`apps/main/vercel.json`** (e.g. `/api/cron/...`); **`apps/main`** currently implements **`/api/cron/regulation-check`**—align other scheduled paths and middleware **`publicRoutes`** before production or remove stale cron entries.
