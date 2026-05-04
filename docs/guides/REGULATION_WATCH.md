# Regulation Watch

## Environment

| Variable | Service | Purpose |
|----------|---------|--------|
| `REGULATION_CRON_SECRET` | `services/compliance` | `X-Regulation-Cron-Secret` for `POST /internal/cron/regulation-check` |
| `CRON_SECRET` | `apps/main` (Vercel Cron) | `Authorization: Bearer ...` for `GET /api/cron/regulation-check` |
| `REGULATION_CRON_SECRET` | `apps/main` | Forwarded to compliance (defaults to `CRON_SECRET` if unset) |

In production, set both cron secrets and configure Vercel Cron `Authorization` header to match `CRON_SECRET`.

## Database

Apply schema updates:

```bash
pnpm db:push
# or
pnpm db:migrate
```

Adds Prisma models: `RegulationSource`, `RegulationCheckRun`, `RegulationDocumentSnapshot`, `RegulationChange`, `RegulationAcknowledgement`, `RegulationAudienceMapping`, and `UserRole.COMPLIANCE`.

## Roles

- **COMPLIANCE** / **ADMIN**: full dashboard at `/compliance` (Next app), acknowledgement via server actions.
- **COACH**: digest on `/coach/dashboard` and full coach-visible list at `/coach/updates`.

JWT/RBAC in the compliance service uses `@aah/auth` permissions (`compliance:read`, `compliance:write`, `compliance:admin`).

## Rollout

1. Run ingestion only (cron) and verify sources in the compliance UI.
2. Train compliance users on acknowledgement workflow.
3. Enable coach-visible items (`coachVisible` is set automatically for selected sources/materiality; tune in `services/compliance/src/regulation/service.ts`).
