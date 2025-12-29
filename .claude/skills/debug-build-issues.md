# Debug Build Issues Skill

Systematically troubleshoot and fix build failures in the monorepo.

## Usage

When builds fail or behave unexpectedly, use this skill to:
1. Identify the root cause
2. Apply targeted fixes
3. Verify the solution
4. Prevent recurrence

## Diagnostic Workflow

### Step 1: Identify Where It's Failing

```bash
# Run build with verbose output
pnpm run build --verbose

# Check specific workspace
pnpm run build --filter @aah/main --verbose

# Type check to isolate TypeScript errors
pnpm run type-check
```

**Note the error type:**
- Module not found → Dependency issue
- Type errors → TypeScript/Prisma issue
- Syntax errors → Code issue
- Build tool errors → Configuration issue

### Step 2: Check Common Culprits

Run this diagnostic checklist:

```bash
# 1. Check lockfile sync
pnpm install --no-frozen-lockfile

# 2. Check Prisma client
pnpm run db:generate

# 3. Check workspace list
pnpm list -r --depth -1

# 4. Clear caches
rm -rf .turbo
rm -rf apps/*/.next
rm -rf packages/*/dist
rm -rf services/*/dist

# 5. Rebuild from scratch
pnpm run build
```

## Common Error Patterns & Solutions

### Error: "Cannot find module '@aah/database'"

**Symptoms:**
```
Error: Cannot find module '@aah/database'
Module not found: Can't resolve '@aah/database'
```

**Root Causes:**
1. Prisma client not generated
2. Database package not built
3. Incorrect import path

**Solutions:**
```bash
# Generate Prisma client
pnpm run db:generate

# Build database package
pnpm run build --filter @aah/database

# Verify package exists
ls packages/database/dist

# Rebuild consuming packages
pnpm run build
```

**Verification:**
```bash
# Check Prisma client exists
ls node_modules/.prisma/client

# Type check
pnpm run type-check --filter @aah/main
```

---

### Error: "Module has no exported member 'X'"

**Symptoms:**
```
Module '"@aah/ui"' has no exported member 'Button'
```

**Root Causes:**
1. Component not exported from index.ts
2. UI package not rebuilt after changes
3. Incorrect import path

**Solutions:**
```bash
# Check exports
cat packages/ui/src/index.ts | grep Button

# Add missing export
echo "export { Button } from './components/ui/button';" >> packages/ui/src/index.ts

# Rebuild UI package
pnpm run build --filter @aah/ui

# Rebuild apps
pnpm run build
```

---

### Error: "Cannot read properties of undefined"

**Symptoms:**
```
TypeError: Cannot read properties of undefined (reading 'complianceRecords')
```

**Root Causes:**
1. Querying relations that don't exist
2. Missing includes in Prisma query
3. Data model mismatch

**Solutions:**

Check CLAUDE.md for correct relations:

```typescript
// ❌ WRONG - User doesn't have complianceRecords
const user = await prisma.user.findUnique({
  include: { complianceRecords: true }
});

// ✅ CORRECT - Go through studentProfile
const user = await prisma.user.findUnique({
  where: { id },
  include: {
    studentProfile: {
      include: { complianceRecords: true }
    }
  }
});
```

---

### Error: "Type 'X' is not assignable to type 'Y'"

**Symptoms:**
```
Type 'string | undefined' is not assignable to type 'string'
```

**Root Causes:**
1. Prisma schema changed but client not regenerated
2. TypeScript strictness issues
3. Missing null checks

**Solutions:**
```bash
# Regenerate Prisma client
pnpm run db:generate

# Rebuild database package
pnpm run build --filter @aah/database

# Type check to see all errors
pnpm run type-check
```

**Code fix:**
```typescript
// Add null checks
if (!user.studentProfile) {
  throw new Error('Student profile not found');
}

const sport = user.studentProfile.sport;
```

---

### Error: "pnpm-lock.yaml is out of date"

**Symptoms:**
```
ERR_PNPM_LOCKFILE_NOT_UP_TO_DATE
```

**Root Causes:**
1. package.json changed without updating lock
2. Merge conflicts
3. Different pnpm version

**Solutions:**
```bash
# Update lockfile
pnpm install --no-frozen-lockfile

# Verify pnpm version
pnpm --version  # Should be 8.15.0

# If wrong version, install correct one
npm install -g pnpm@8.15.0
```

---

### Error: "Build script not found"

**Symptoms:**
```
Error: No script named "build" found in @aah/service-user
```

**Root Causes:**
1. Missing build script in package.json
2. Typo in script name

**Solutions:**
```bash
# Check package.json
cat services/user/package.json | grep build

# Add build script
```

```json
{
  "scripts": {
    "build": "tsup src/index.ts --format esm,cjs"
  }
}
```

---

### Error: "External dependency not found"

**Symptoms:**
```
Error: Cannot find module '@ai-sdk/openai'
[plugin:vite:resolve] Cannot resolve dependency
```

**Root Causes:**
1. External dependency not marked in build config
2. Dependency not installed

**Solutions:**

For services using AI SDK:

```json
// services/ai/package.json
{
  "scripts": {
    "build": "tsup src/index.ts --format esm,cjs --external @ai-sdk/openai --external @ai-sdk/anthropic"
  }
}
```

Or in `tsup.config.ts`:

```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  external: ['@ai-sdk/openai', '@ai-sdk/anthropic'],
});
```

---

### Error: "Declaration file errors"

**Symptoms:**
```
Error: Cannot find type declarations for '@aah/service-user'
Duplicate identifier in declaration files
```

**Root Causes:**
1. Services generating .d.ts files (they shouldn't)
2. Conflicting type declarations

**Solutions:**

**CRITICAL:** Services should NOT generate declarations!

```json
// services/*/package.json
{
  "scripts": {
    "build": "tsup src/index.ts --format esm,cjs"
    // NO --dts flag!
  }
}
```

```bash
# Remove existing declarations
rm -rf services/*/dist/*.d.ts

# Rebuild
pnpm run build
```

---

### Error: "Next.js build fails"

**Symptoms:**
```
Error occurred prerendering page
Module not found in Next.js app
```

**Root Causes:**
1. Client Component using server-only code
2. Missing "use client" directive
3. Import from non-existent module

**Solutions:**

Check for client/server boundary issues:

```typescript
// If using hooks, add "use client"
"use client";

import { useState } from 'react';

export default function MyComponent() {
  const [state, setState] = useState();
  // ...
}
```

```bash
# Clear Next.js cache
rm -rf apps/main/.next

# Rebuild
pnpm run build --filter @aah/main
```

---

### Error: "Vercel deployment fails"

**Symptoms:**
```
Error: Build failed
Deployment failed
```

**Root Causes:**
1. Environment variables missing
2. Build works locally but not on Vercel
3. Vercel timeout

**Solutions:**

```bash
# Test production build locally
pnpm run build
NODE_ENV=production pnpm run build:main

# Check environment variables in Vercel dashboard
# Ensure these are set:
# - DATABASE_URL
# - CLERK_SECRET_KEY
# - OPENAI_API_KEY (if using AI)
```

Check `vercel.json`:

```json
{
  "buildCommand": "pnpm run build",
  "installCommand": "pnpm install --no-frozen-lockfile",
  "framework": "nextjs"
}
```

---

## Systematic Debugging Process

### 1. Reproduce Locally

```bash
# Clean environment
rm -rf node_modules
rm -rf .turbo
rm -rf apps/*/.next
rm -rf packages/*/dist
rm -rf services/*/dist

# Fresh install
pnpm install

# Try build
pnpm run build
```

### 2. Isolate the Issue

```bash
# Test each workspace
pnpm run build --filter @aah/database
pnpm run build --filter @aah/ui
pnpm run build --filter @aah/service-user
pnpm run build --filter @aah/main

# Which one fails?
```

### 3. Check Dependencies

```bash
# View dependency tree
pnpm list -r --depth -1

# Check for circular deps
pnpm why @aah/database

# Verify workspace protocol
cat apps/main/package.json | grep workspace
```

### 4. Verify Configuration

```bash
# Check tsconfig
cat tsconfig.json

# Check turbo.json
cat turbo.json

# Check specific package config
cat services/user/package.json
```

### 5. Apply Fix

Based on error type, apply appropriate solution from above.

### 6. Verify Fix

```bash
# Type check
pnpm run type-check

# Build
pnpm run build

# Run specific app
pnpm run dev:main

# Test functionality
```

## Prevention Checklist

After fixing the issue:

- [ ] Document what went wrong
- [ ] Update CLAUDE.md if pattern is common
- [ ] Add validation to prevent recurrence
- [ ] Check CI/CD configuration
- [ ] Review similar code for same issue
- [ ] Consider adding tests
- [ ] Update package.json scripts if needed

## Quick Reference: Build Commands

```bash
# Full diagnostics
pnpm install --no-frozen-lockfile
pnpm run db:generate
pnpm run type-check
pnpm run build --verbose

# Clean rebuild
rm -rf .turbo apps/*/.next packages/*/dist services/*/dist
pnpm run build

# Selective debugging
pnpm run build --filter @aah/database --verbose
pnpm run build --filter @aah/main --dry-run

# Cache management
rm -rf .turbo
pnpm run build --force
```

## When All Else Fails

```bash
# Nuclear option: complete reset
rm -rf node_modules
rm -rf pnpm-lock.yaml
rm -rf .turbo
rm -rf apps/*/.next
rm -rf apps/*/node_modules
rm -rf packages/*/dist
rm -rf packages/*/node_modules
rm -rf services/*/dist
rm -rf services/*/node_modules

# Fresh start
pnpm install
pnpm run db:generate
pnpm run build
```

Remember: Most build issues come down to stale caches, missing Prisma generation, or lockfile sync!
