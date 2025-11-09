# Environment Validation - Quick Command Reference

## Installation

```bash
# Install dependencies (already done)
pnpm install

# Verify config package
pnpm list zod
# Should show zod@3.23.8 in packages/config
```

## Development

### Test Environment Validation

```bash
# Test AI service (example with validation)
pnpm --filter @aah/service-ai dev

# Test with invalid env (should fail fast)
DATABASE_URL=invalid pnpm --filter @aah/service-ai dev

# Test with missing required var (should fail fast)
unset OPENAI_API_KEY && pnpm --filter @aah/service-ai dev
```

### Type Checking

```bash
# Check all packages
turbo run type-check

# Check specific service
pnpm --filter @aah/service-ai type-check

# Check config package
pnpm --filter @aah/config type-check
```

## Migration Commands

### Migrate a Backend Service

```bash
# 1. Create env.ts
cat > services/{service}/src/config/env.ts << 'EOF'
import { {service}ServiceEnvSchema, validateEnv, type {Service}ServiceEnv } from '@aah/config/env'

export const env: {Service}ServiceEnv = validateEnv({service}ServiceEnvSchema)
export { isProduction, isDevelopment, isTest } from '@aah/config/env'
EOF

# 2. Test the service
pnpm --filter @aah/service-{service} dev

# 3. Check for TypeScript errors
pnpm --filter @aah/service-{service} type-check
```

### Migrate a Frontend App

```bash
# 1. Install @t3-oss/env-nextjs
pnpm --filter @aah/app-{app} add @t3-oss/env-nextjs

# 2. Create env.mjs (see ENV_VALIDATION_SUMMARY.md for template)

# 3. Test the app
pnpm --filter @aah/app-{app} dev
```

## Debugging

### View Environment Schema

```bash
# Open the schema file
cat packages/config/env/index.ts | grep -A 20 "aiServiceEnvSchema"
```

### Test Validation Manually

```bash
# Create test script
cat > test-env.ts << 'EOF'
import { validateEnv, aiServiceEnvSchema } from '@aah/config/env'

try {
  const env = validateEnv(aiServiceEnvSchema, {
    DATABASE_URL: 'postgresql://localhost:5432/db',
    OPENAI_API_KEY: 'sk-test',
    ANTHROPIC_API_KEY: 'sk-ant-test',
    CLERK_SECRET_KEY: 'test',
    JWT_SECRET: '12345678901234567890123456789012',
    ENCRYPTION_KEY: '12345678901234567890123456789012',
  })
  console.log('✅ Validation passed')
  console.log('Port:', env.PORT)
} catch (error) {
  console.error('❌ Validation failed:', error)
}
EOF

# Run test
npx tsx test-env.ts

# Cleanup
rm test-env.ts
```

### Check What Env Vars a Service Needs

```bash
# View service schema
cat packages/config/env/index.ts | grep -A 30 "aiServiceEnvSchema"

# Or use TypeScript to explore
npx tsx -e "
import { aiServiceEnvSchema } from '@aah/config/env'
console.log(aiServiceEnvSchema.shape)
"
```

## Troubleshooting

### "Cannot find module '@aah/config/env'"

```bash
# Rebuild config package
turbo run build --filter=@aah/config --force
pnpm install
```

### "Environment validation failed"

```bash
# Check which vars are invalid
pnpm --filter @aah/service-ai dev 2>&1 | grep -A 20 "Invalid environment"

# Copy .env.example if missing
cp .env.example .env

# Or copy service-specific example
cp services/ai/.env.example services/ai/.env
```

### TypeScript Errors

```bash
# Clear cache and rebuild
rm -rf node_modules/.cache
turbo run type-check --force

# Or rebuild everything
rm -rf node_modules pnpm-lock.yaml .turbo
pnpm install
turbo run build
```

## Verification

### Check Migration Status

```bash
# Check if service has env.ts
ls -la services/*/src/config/env.ts

# Check if service uses validated env
grep -r "from './env'" services/*/src/config/index.ts
```

### Test All Services

```bash
# Start all services (will validate env for each)
turbo run dev

# Or test individually
for service in user advising compliance monitoring support integration ai; do
  echo "Testing $service..."
  pnpm --filter @aah/service-$service dev &
  sleep 2
  kill %1
done
```

## Useful Aliases

Add to your `~/.bashrc` or `~/.zshrc`:

```bash
# Environment validation shortcuts
alias env-check='turbo run type-check'
alias env-test='pnpm --filter @aah/service-ai dev'
alias env-schema='cat packages/config/env/index.ts'

# Service testing
alias test-ai='pnpm --filter @aah/service-ai dev'
alias test-user='pnpm --filter @aah/service-user dev'
alias test-all='turbo run dev'
```

## Quick Reference

| Command | Purpose |
|---------|---------|
| `pnpm install` | Install dependencies |
| `turbo run type-check` | Check all TypeScript |
| `pnpm --filter @aah/service-ai dev` | Test AI service |
| `cat packages/config/env/index.ts` | View schemas |
| `npx tsx test-env.ts` | Test validation manually |

## Documentation

- **Full Guide**: `.kiro/specs/microservices-architecture/ENV_VALIDATION_ROLLOUT.md`
- **Summary**: `ENVIRONMENT_VALIDATION_SUMMARY.md`
- **Task Doc**: `.kiro/specs/microservices-architecture/TASK_1.1_ENV_VALIDATION.md`
- **Schemas**: `packages/config/env/index.ts`

---

**Quick Start**: Run `pnpm install` then `pnpm --filter @aah/service-ai dev` to see validation in action!
