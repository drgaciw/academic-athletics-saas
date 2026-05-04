## Learned User Preferences

## Learned Workspace Facts

- Monorepo uses **pnpm** and **Turborepo**; primary student/coach/compliance-facing Next app is **`apps/main`** (`app/` routes); **`apps/admin`** is the operational admin app with **Prisma-backed** student and compliance record views.
- Coach routes live under **`apps/main/app/coach/`** (e.g. dashboard, updates); server layouts gate access with **Clerk** and **Prisma** `user.role === 'COACH'`.
- Regulation/compliance UI includes **`apps/main/app/compliance/`** (e.g. changes detail) and **`apps/main/app/coach/updates/`**; list/detail patterns should align with existing auth and role checks before loading regulation data.
- **`services/compliance`** is the **Hono** compliance microservice (eligibility, violations, audit, rule engine); **`apps/main/app/api/compliance/[...path]/route.ts`** BFF-proxies to it via **`getServiceUrl('compliance')`** (env defaults include localhost ports per service).
- **`services/integration`** covers email (e.g. Resend), LMS/SIS routes, and related connectors; **`services/monitoring`** exposes alerts and **Pusher** for real-time channels; **`services/user`** handles **Clerk webhook** user sync.
- **PostgreSQL** + **Prisma** central schema in **`packages/database/prisma/schema.prisma`** (`@aah/database`); extensions include **pgvector**. New regulation/source/fetch-run entities belong here with **`prisma migrate`**, not ad hoc SQL long term.
- **Vercel Cron** schedules are declared in **`vercel.json`** / **`apps/main/vercel.json`** (e.g. `/api/cron/...`); periodic regulation checks fit that pattern once route handlers exist.
