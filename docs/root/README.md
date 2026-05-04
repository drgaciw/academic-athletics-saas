# Athletic Academics Hub (AAH)

NCAA Division I academic support platform for student-athletes.

Status note:
- This repository contains substantial platform infrastructure and service implementation.
- Some Markdown completion reports and future-planning documents describe capabilities that are only partially implemented or not yet implemented.
- Treat `docs/prd.md` and `docs/tech-spec.md` as target-state product/spec documents unless a feature is explicitly verified in code.

## Repository Structure

```text
.
├── apps/
│   ├── main/        # Main Next.js application (port 3000)
│   ├── student/     # Student-facing Next.js application (port 3001)
│   └── admin/       # Admin Next.js application (port 3002)
├── packages/
│   ├── ai/          # Shared AI agents, tools, and utilities
│   ├── ai-evals/    # AI evaluation framework package
│   ├── api-utils/   # Shared API helpers and middleware
│   ├── auth/        # Authentication and RBAC helpers
│   ├── config/      # Shared config/package defaults
│   ├── database/    # Prisma schema and database client
│   └── ui/          # Shared UI components, hooks, and providers
├── services/
│   ├── user/        # User/profile service
│   ├── advising/    # Advising and scheduling service
│   ├── compliance/  # NCAA compliance and eligibility service
│   ├── monitoring/  # Alerts, performance, and intervention service
│   ├── support/     # Tutoring, study hall, mentoring, workshops
│   ├── integration/ # SIS/LMS/calendar/email/transcript integrations
│   └── ai/          # AI service APIs and orchestration
└── docs/            # Product, technical, and implementation docs
```

## Tooling

- Package manager: `pnpm` only
- Monorepo/build system: Turborepo
- Frontend: Next.js 14, React 18, Tailwind CSS
- Backend/services: Hono-based services and Next.js route handlers
- Database: Prisma + Postgres
- Auth: Clerk
- AI: Vercel AI SDK, OpenAI, Anthropic

## Getting Started

Prerequisites:
- Node.js 18+
- pnpm 8.15.0+ (`packageManager` is pinned to `pnpm@8.15.0`)

1. Install dependencies

```bash
pnpm install
```

2. Configure environment variables

```bash
cp .env.example .env
```

If `.env.example` is incomplete for your workflow, refer to service/app-specific docs and existing `.env` conventions in the repo.

3. Generate Prisma client

```bash
pnpm run db:generate
```

4. Push database schema for local development

```bash
pnpm run db:push
```

5. Start the repo

```bash
pnpm run dev
```

Useful scoped dev commands:

```bash
pnpm run dev:main
pnpm run dev:student
pnpm run dev:admin
pnpm run dev:services
```

## Common Commands

```bash
pnpm run dev
pnpm run build
pnpm run test
pnpm run type-check
pnpm run lint
pnpm run format:check
pnpm run db:generate
pnpm run db:push
pnpm run db:migrate
pnpm run db:studio
```

## Workspace Notes

- Root workspace scripts are defined in `package.json`.
- The repo uses pnpm workspaces for `apps/*`, `packages/*`, and `services/*`.
- Some packages and services are more mature than others; verify status with fresh build/test/type-check commands before assuming a completion report is current.

## Documentation Guide

Start here:
- `../README.md`

Primary product/spec docs:
- `../prd.md`
- `../tech-spec.md`
- `../frontend-ui-tech-spec.md`

Implementation and audit docs:
- `../reports/requirements-gap-analysis-remediation-plan.md`
- `../reports/requirements-gap-analysis-task-list.md`
- `../plans/README.md`

Important caution:
- Some docs in this repository are implementation summaries for past work and may overstate current verified status.
- Planned work should be treated as roadmap material unless corresponding code paths, schema, routes, and verification commands confirm delivery.
