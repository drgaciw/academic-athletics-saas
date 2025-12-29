# Turborepo Optimization Skill

Optimize build performance, manage cache, and troubleshoot Turborepo issues.

## Usage

When builds are slow, failing, or behaving unexpectedly, use this skill to:
1. Analyze build performance
2. Optimize task dependencies
3. Manage Turborepo cache
4. Debug common build issues
5. Configure remote caching

## Analyzing Build Performance

### Check Task Execution

```bash
# Dry run to see task graph
pnpm run build --dry-run

# Verbose output to see what's running
pnpm run build --verbose

# Show execution summary
pnpm run build --summarize
```

### Identify Bottlenecks

```bash
# Time individual builds
time pnpm run build --filter @aah/main
time pnpm run build --filter @aah/database

# Check parallel execution
pnpm run build --concurrency 10 --verbose
```

## Cache Management

### View Cache Status

```bash
# Check if task is cached
pnpm run build --filter @aah/main --dry-run

# Force run without cache (for testing)
pnpm run build --force

# Clear Turborepo cache
rm -rf .turbo
```

### Cache Outputs Configuration

Edit `turbo.json` to ensure proper outputs:

```json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [
        ".next/**",           // Next.js apps
        "!.next/cache/**",    // Exclude Next.js cache
        "dist/**",            // Services & packages
        "!dist/cache/**"      // Exclude any cache dirs
      ],
      "cache": true
    },
    "dev": {
      "cache": false,         // Never cache dev
      "persistent": true
    },
    "type-check": {
      "cache": true,
      "outputs": []           // Type checking has no outputs
    },
    "lint": {
      "cache": true,
      "outputs": []
    },
    "test": {
      "cache": true,
      "outputs": ["coverage/**"]
    }
  }
}
```

## Build Optimization Strategies

### 1. Optimize Task Dependencies

**Current pattern:**
```json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"]  // Build dependencies first
    }
  }
}
```

**For independent tasks:**
```json
{
  "pipeline": {
    "lint": {
      "cache": true
      // No dependsOn - runs in parallel
    },
    "type-check": {
      "cache": true
      // No dependsOn - runs in parallel
    }
  }
}
```

### 2. Selective Builds

```bash
# Build only affected packages
pnpm run build --filter @aah/main

# Build with dependencies
pnpm run build --filter @aah/main...

# Build dependents
pnpm run build --filter ...@aah/database

# Build changed since git ref
pnpm run build --filter=[main]
```

### 3. Parallel Execution

```bash
# Increase concurrency (default is CPU cores - 1)
pnpm run build --concurrency 10

# Or set in turbo.json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "cache": true
    }
  },
  "globalDependencies": [".env"],
  "globalEnv": ["NODE_ENV"],
  "concurrency": 10
}
```

## Remote Caching (Optional)

### Vercel Remote Cache

```bash
# Login to Vercel
npx turbo login

# Link repository
npx turbo link

# Builds will now use remote cache
pnpm run build
```

### Custom Remote Cache

Add to `turbo.json`:

```json
{
  "remoteCache": {
    "signature": true
  }
}
```

## Common Build Issues & Fixes

### Issue 1: "Cannot find module @aah/database"

**Root cause:** Prisma client not generated or package not built

**Fix:**
```bash
pnpm run db:generate
pnpm run build --filter @aah/database
pnpm run build
```

### Issue 2: Lockfile out of sync

**Root cause:** pnpm-lock.yaml doesn't match package.json

**Fix:**
```bash
pnpm install --no-frozen-lockfile
```

### Issue 3: Stale cache causing issues

**Root cause:** Cached outputs from old builds

**Fix:**
```bash
# Clear Turborepo cache
rm -rf .turbo

# Clear all build outputs
rm -rf apps/*/.next
rm -rf packages/*/dist
rm -rf services/*/dist

# Rebuild
pnpm run build
```

### Issue 4: Services failing with declaration errors

**Root cause:** Services have `--dts` flag

**Fix:**
```json
// services/*/package.json
{
  "scripts": {
    "build": "tsup src/index.ts --format esm,cjs"
    // Remove --dts if present
  }
}
```

### Issue 5: Build hanging or running too long

**Root cause:** Circular dependencies or incorrect task graph

**Fix:**
```bash
# Check for circular deps
pnpm list -r --depth -1

# Visualize task graph
pnpm run build --graph

# Check turbo.json dependencies
cat turbo.json
```

### Issue 6: Next.js apps not rebuilding

**Root cause:** Cached Next.js build

**Fix:**
```bash
# Clear Next.js cache
rm -rf apps/*/.next

# Force rebuild
pnpm run build --force --filter @aah/main
```

## Performance Benchmarking

### Measure Build Times

```bash
# Full build from scratch
rm -rf .turbo apps/*/.next packages/*/dist services/*/dist
time pnpm run build

# Cached build (should be much faster)
time pnpm run build

# Selective build
time pnpm run build --filter @aah/main
```

### Expected Performance

- **First build (cold):** 2-5 minutes (depending on machine)
- **Cached build (warm):** 5-30 seconds
- **Selective build:** 30-120 seconds

## Turborepo Configuration Best Practices

```json
// turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"],
      "cache": true
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "type-check": {
      "cache": true,
      "outputs": []
    },
    "lint": {
      "cache": true,
      "outputs": []
    },
    "test": {
      "dependsOn": ["^build"],
      "cache": true,
      "outputs": ["coverage/**"]
    },
    "db:generate": {
      "cache": true,
      "outputs": ["node_modules/.prisma/**"]
    }
  },
  "globalDependencies": [
    ".env",
    ".env.local",
    "turbo.json"
  ],
  "globalEnv": [
    "NODE_ENV",
    "DATABASE_URL",
    "CLERK_SECRET_KEY"
  ]
}
```

## Advanced: Custom Turborepo Scripts

### Build Changed Packages Only

```bash
# Since last commit
pnpm run build --filter=[HEAD^]

# Since main branch
pnpm run build --filter=[main]

# Since specific commit
pnpm run build --filter=[abc123]
```

### Parallel Task Execution

```json
// package.json
{
  "scripts": {
    "check-all": "turbo run type-check lint test --parallel"
  }
}
```

## Monitoring & Debugging

### Enable Verbose Logging

```bash
export TURBO_LOG_VERBOSITY=debug
pnpm run build
```

### Generate Build Graph

```bash
pnpm run build --graph
# Opens visualization of task dependencies
```

### Check What Changed

```bash
# See what Turbo thinks changed
pnpm run build --filter=[HEAD^] --dry-run
```

## Optimization Checklist

- [ ] Task dependencies correctly configured in turbo.json
- [ ] Outputs properly specified for each task
- [ ] Cache enabled for appropriate tasks
- [ ] No `--dts` flags on service builds
- [ ] Prisma client generated before builds
- [ ] No circular workspace dependencies
- [ ] External dependencies marked in tsup configs
- [ ] .turbo directory in .gitignore
- [ ] Remote caching configured (optional)
- [ ] Build times acceptable (< 5 min cold, < 30s warm)

## Useful Commands Reference

```bash
# Performance
pnpm run build --dry-run              # Preview task graph
pnpm run build --summarize            # Show summary
pnpm run build --graph                # Visualize dependencies
time pnpm run build                   # Measure build time

# Cache
pnpm run build --force                # Skip cache
rm -rf .turbo                         # Clear cache
pnpm run build --filter @aah/main     # Selective build

# Debugging
pnpm run build --verbose              # Verbose output
pnpm list -r --depth -1               # List workspaces
cat turbo.json                        # Check config

# Cleanup
rm -rf apps/*/.next                   # Clear Next.js builds
rm -rf packages/*/dist                # Clear package builds
rm -rf services/*/dist                # Clear service builds
pnpm install --no-frozen-lockfile     # Fix lockfile
```

Remember: Turborepo caching is your friend - configure it correctly and builds will be lightning fast!
