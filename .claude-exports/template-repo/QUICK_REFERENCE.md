# Claude Code Agents & Skills - Quick Reference

One-page cheat sheet for Turborepo monorepo development.

---

## 🤖 Agents (Autonomous Problem Solvers)

| Agent | Use When | Example Prompt |
|-------|----------|----------------|
| **Turborepo Architect** | Build optimization, caching, workspace deps | "Optimize build pipeline" |
| **Next.js App Developer** | App Router features, pages, API routes | "Add dashboard with SSR" |
| **Shadcn Component Builder** | UI components, design system | "Create StudentCard component" |
| **Service Developer** | Microservices, API endpoints | "Build compliance service" |
| **Prisma Schema Manager** | Database schema, migrations | "Add ComplianceRecord model" |

---

## 🛠️ Skills (Step-by-Step Guides)

| Skill | Purpose | Quick Command |
|-------|---------|---------------|
| **Add Workspace Package** | Install dependencies | `pnpm add <pkg> --filter @aah/main` |
| **Create New Service** | Scaffold Hono service | Follow service template |
| **Shadcn Component Operations** | Add/customize components | `npx shadcn-ui@latest add <component>` |
| **Turborepo Optimization** | Speed up builds | `rm -rf .turbo && pnpm build` |
| **Debug Build Issues** | Fix build failures | Check error patterns |

---

## 🚀 Common Commands

### Build & Dev
```bash
pnpm run dev                  # All apps
pnpm run dev:main             # Main app only
pnpm run build                # Build everything
pnpm run build --filter @aah/main  # Build specific app
```

### Database
```bash
pnpm run db:generate          # After schema changes
pnpm run db:push              # Push to dev database
pnpm run db:migrate           # Create migration
```

### Debugging
```bash
pnpm run type-check           # TypeScript errors
pnpm run build --verbose      # Detailed build output
rm -rf .turbo                 # Clear build cache
pnpm install --no-frozen-lockfile  # Fix lockfile
```

### Workspace Management
```bash
pnpm add <pkg> --filter @aah/<workspace>  # Add to workspace
pnpm list -r --depth -1       # List workspaces
pnpm why <pkg>                # Check why package is installed
```

---

## 🔧 Quick Fixes

### "Cannot find module '@aah/database'"
```bash
pnpm run db:generate
pnpm run build --filter @aah/database
pnpm run build
```

### "Module has no exported member 'X'"
```bash
# Check exports in packages/ui/src/index.ts
pnpm run build --filter @aah/ui
```

### "pnpm-lock.yaml is out of date"
```bash
pnpm install --no-frozen-lockfile
```

### "Build is slow"
```bash
rm -rf .turbo
pnpm run build --summarize
```

### "Type errors after schema change"
```bash
pnpm run db:generate
pnpm run build --filter @aah/database
pnpm run type-check
```

---

## 📁 Project Structure

```
apps/          # Next.js applications
  main/        # @aah/main
  student/     # @aah/student
  admin/       # @aah/admin

packages/      # Shared packages
  database/    # @aah/database (Prisma)
  ui/          # @aah/ui (Shadcn)
  auth/        # @aah/auth (Clerk)
  ai/          # @aah/ai (AI SDK)

services/      # Hono microservices
  user/        # @aah/service-user
  compliance/  # @aah/service-compliance
  advising/    # @aah/service-advising
```

---

## 💡 Critical Rules

### ✅ DO
- Use `pnpm` (never npm or yarn)
- Run `pnpm run db:generate` after schema changes
- Import from workspace aliases: `@aah/ui`, `@aah/database`
- Use Server Components by default in Next.js
- Add authentication to all API routes

### ❌ DON'T
- Add `--dts` flag to service builds
- Query relations that don't exist (check CLAUDE.md)
- Import from `'ai/react'` (use `'ai'` instead)
- Use `"use client"` unless necessary
- Commit without running `pnpm run build`

---

## 🎯 Workflow Templates

### Add New Feature
1. **Prisma Schema Manager** → Update schema
2. **Service Developer** → Create backend service
3. **Shadcn Component Builder** → Build UI components
4. **Next.js App Developer** → Integrate in app
5. **Turborepo Architect** → Verify builds

### Fix Build Error
1. **Debug Build Issues** → Diagnose
2. **Turborepo Optimization** → Clear cache
3. **Prisma Schema Manager** → Regenerate if needed
4. Rebuild and verify

### Optimize Performance
1. **Turborepo Optimization** → Analyze
2. **Turborepo Architect** → Fix bottlenecks
3. Measure improvement

---

## 📞 When to Use What

| Task | Agent/Skill | Time |
|------|-------------|------|
| "Build failing" | Debug Build Issues | 2-5 min |
| "Add button component" | Shadcn Component Operations | 5 min |
| "Create new service" | Service Developer + Create New Service | 15 min |
| "Slow builds" | Turborepo Optimization | 10 min |
| "Add new page" | Next.js App Developer | 10-20 min |
| "Update schema" | Prisma Schema Manager | 10 min |
| "Install package" | Add Workspace Package | 2 min |

---

## 🔗 Import Patterns

### Next.js Apps
```typescript
import { prisma } from '@aah/database';
import { Button } from '@aah/ui/button';
import { auth } from '@aah/auth';
import { useChat } from 'ai';  // NOT 'ai/react'
```

### Hono Services
```typescript
import { prisma } from '@aah/database';
import { Hono } from 'hono';
import { z } from 'zod';
```

### Shared Packages
```typescript
// packages/ui/src/index.ts
export { Button } from './components/ui/button';
```

---

## 🎨 Shadcn Components

**Most Common:**
```bash
npx shadcn-ui@latest add button card dialog form input
npx shadcn-ui@latest add table badge alert select
```

**Usage:**
```typescript
import { Button } from '@aah/ui/button';
import { Card, CardHeader, CardContent } from '@aah/ui/card';
```

---

## 🗄️ Prisma Patterns

### Correct Relations
```typescript
// ✅ CORRECT - Go through studentProfile
const user = await prisma.user.findUnique({
  include: {
    studentProfile: {
      include: { complianceRecords: true }
    }
  }
});

// ❌ WRONG - User doesn't have complianceRecords
const user = await prisma.user.findUnique({
  include: { complianceRecords: true }
});
```

### Transactions
```typescript
await prisma.$transaction(async (tx) => {
  await tx.user.create({ data: {...} });
  await tx.auditLog.create({ data: {...} });
});
```

---

## 🚨 Emergency Fixes

### Nuclear Option (Last Resort)
```bash
rm -rf node_modules
rm -rf pnpm-lock.yaml
rm -rf .turbo
rm -rf apps/*/.next
rm -rf packages/*/dist
rm -rf services/*/dist
pnpm install
pnpm run db:generate
pnpm run build
```

### Quick Reset
```bash
rm -rf .turbo
pnpm run db:generate
pnpm run build
```

---

## 📊 Performance Targets

| Metric | Target | Command |
|--------|--------|---------|
| Cold build | < 5 min | `time pnpm build` |
| Warm build | < 30 sec | `time pnpm build` (cached) |
| Type check | < 1 min | `time pnpm type-check` |
| Dev startup | < 10 sec | `pnpm dev:main` |

---

## 💾 Save This!

Print this page and keep it at your desk, or bookmark in your IDE.

**File location:** `.claude/QUICK_REFERENCE.md`

---

**Pro Tip:** Reference agents and skills by name in your AI prompts for instant expert help! 🎯
