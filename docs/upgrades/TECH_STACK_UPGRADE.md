# Tech Stack Upgrade (May 2026)

Phased upgrade of the AAH monorepo to current stable toolchain versions.

## Target versions

| Layer | Version |
| --- | --- |
| Node | >=20.19.0 (CI: 22) |
| pnpm | 10.11.0 |
| TypeScript | 5.9.x |
| Next.js | 16.2.6 |
| React | 19.2.6 |
| Clerk | @clerk/nextjs ^7.4.x |
| Prisma | 7.8.0 |
| Vercel AI SDK | ai ^6.0.191 (unified via pnpm override) |
| @ai-sdk/* | ^3.0.65 |
| Zod | ^4.4.3 |
| Tailwind CSS | ^4.3.0 |
| ESLint | ^9.x (flat config in apps) |
| Jest | ^30.4.x |

## Verification

```bash
pnpm install
pnpm db:generate
pnpm type-check   # 14 packages
pnpm build        # apps + services
pnpm test         # some packages require env keys (OPENAI_API_KEY)
pnpm lint
```

## Notable breaking changes

### Clerk 7
- `useSignIn()` returns signal-based API; legacy custom sign-in uses `@clerk/nextjs/legacy`
- `auth()` is async in server components/middleware
- `SignedIn`/`SignedOut` removed; use `useAuth()` or Clerk components

### Prisma 7
- `prisma.config.ts` for datasource URL
- Generator: `prisma-client` with output under `packages/database/generated/client`
- Shared client via `@aah/database` with `@prisma/adapter-pg`

### AI SDK 6
- `CoreMessage` → `ModelMessage`, `CoreTool` → `Tool`
- `useChat` uses `DefaultChatTransport` and `sendMessage`; local input state
- Usage: `inputTokens` / `outputTokens`

### Zod 4
- `z.record()` requires key + value schemas
- `ZodError.issues` replaces `.errors`

### Tailwind 4
- CSS-first: `@import "tailwindcss"`, `@theme`, `@source`
- `@tailwindcss/postcss` in PostCSS config
