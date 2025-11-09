# Environment Validation Rollout Plan

**Date**: November 8, 2025  
**Status**: 🟡 In Progress  
**Change**: Centralized environment variable validation using `@aah/config/env`

## Overview

The `packages/config` package now exports centralized environment variable validation using Zod schemas. This provides:

- ✅ **Type-safe environment variables** across all services
- ✅ **Runtime validation** on service startup
- ✅ **Single source of truth** for env schemas
- ✅ **Better developer experience** with autocomplete

## Changes Made

### 1. packages/config/package.json

```json
{
  "exports": {
    "./env": "./env/index.ts"  // NEW EXPORT
  },
  "dependencies": {
    "zod": "^3.23.8",           // NEW DEPENDENCY
  },
  "devDependencies": {
    "@types/node": "^20.0.0"    // ADDED FOR process.env
  }
}
```

### 2. packages/config/env/index.ts

**Created comprehensive environment validation with:**
- Base schema for shared variables
- Service-specific schemas for each microservice
- Type-safe exports
- Utility functions

## Impact Analysis

### ✅ No Breaking Changes
- All changes are **additive only**
- Existing code continues to work
- Services can migrate incrementally

### 🎯 Affected Services

| Service | Status | Priority | Effort |
|---------|--------|----------|--------|
| AI Service | 🟡 Partial | High | 30 min |
| User Service | ⏳ Pending | High | 20 min |
| Advising Service | ⏳ Pending | Medium | 20 min |
| Compliance Service | ⏳ Pending | Medium | 20 min |
| Monitoring Service | ⏳ Pending | Medium | 20 min |
| Support Service | ⏳ Pending | Low | 20 min |
| Integration Service | ⏳ Pending | Medium | 20 min |
| Frontend Apps | ⏳ Pending | Low | 15 min each |

## Implementation Steps

### Phase 1: Install Dependencies (5 min)

```bash
# From project root
pnpm install

# This will install zod in packages/config
# and update all service dependencies
```

### Phase 2: Update Each Service (20-30 min per service)

For each service in `/services/*`:

#### Step 1: Add Config Dependency

```json
// services/{service}/package.json
{
  "dependencies": {
    "@aah/config": "*"  // Add if not present
  }
}
```

#### Step 2: Create env.ts

```typescript
// services/{service}/src/config/env.ts
import { {service}ServiceEnvSchema, validateEnv, type {Service}ServiceEnv } from '@aah/config/env'

export const env: {Service}ServiceEnv = validateEnv({service}ServiceEnvSchema)

export { isProduction, isDevelopment, isTest } from '@aah/config/env'
```

#### Step 3: Update config/index.ts

```typescript
// services/{service}/src/config/index.ts
import { env } from './env'

export const config = {
  port: env.PORT,
  serviceName: env.SERVICE_NAME,
  database: {
    url: env.DATABASE_URL,
    pool: {
      min: env.DATABASE_POOL_MIN,
      max: env.DATABASE_POOL_MAX,
    },
  },
  // ... use env.* instead of process.env.*
}

export { env }
```

#### Step 4: Update index.ts

```typescript
// services/{service}/src/index.ts
import { env } from './config/env'

// Validate on startup
console.log(`✅ ${env.SERVICE_NAME} environment validated`)
console.log(`🚀 Starting on port ${env.PORT}`)

// ... rest of service startup
```

### Phase 3: Update Frontend Apps (15 min per app)

For Next.js apps in `/apps/*`:

#### Create env.mjs

```javascript
// apps/{app}/env.mjs
import { createEnv } from "@t3-oss/env-nextjs"
import { z } from "zod"

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    CLERK_SECRET_KEY: z.string().min(1),
    // ... server-only vars
  },
  client: {
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
    // ... client vars
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  },
})
```

#### Update next.config.js

```javascript
// apps/{app}/next.config.js
import "./env.mjs"

export default {
  // ... config
}
```

## Service-Specific Schemas

### User Service

```typescript
export const userServiceEnvSchema = baseEnvSchema.extend({
  PORT: z.coerce.number().default(3001),
  SERVICE_NAME: z.string().default('user-service'),
})
```

### Advising Service

```typescript
export const advisingServiceEnvSchema = baseEnvSchema.extend({
  PORT: z.coerce.number().default(3002),
  SERVICE_NAME: z.string().default('advising-service'),
  AI_SERVICE_URL: z.string().url(),
})
```

### Compliance Service

```typescript
export const complianceServiceEnvSchema = baseEnvSchema.extend({
  PORT: z.coerce.number().default(3003),
  SERVICE_NAME: z.string().default('compliance-service'),
  NCAA_RULE_VERSION: z.string().default('2024-2025'),
  NCAA_API_ENABLED: z.coerce.boolean().default(false),
})
```

### Monitoring Service

```typescript
export const monitoringServiceEnvSchema = baseEnvSchema.extend({
  PORT: z.coerce.number().default(3004),
  SERVICE_NAME: z.string().default('monitoring-service'),
  PUSHER_APP_ID: z.string().optional(),
  PUSHER_KEY: z.string().optional(),
  PUSHER_SECRET: z.string().optional(),
  PUSHER_CLUSTER: z.string().default('us2'),
  AI_SERVICE_URL: z.string().url(),
})
```

### Support Service

```typescript
export const supportServiceEnvSchema = baseEnvSchema.extend({
  PORT: z.coerce.number().default(3005),
  SERVICE_NAME: z.string().default('support-service'),
})
```

### Integration Service

```typescript
export const integrationServiceEnvSchema = baseEnvSchema.extend({
  PORT: z.coerce.number().default(3006),
  SERVICE_NAME: z.string().default('integration-service'),
  RESEND_API_KEY: z.string().optional(),
  SENDGRID_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().email(),
  EMAIL_FROM_NAME: z.string(),
  BLOB_READ_WRITE_TOKEN: z.string().optional(),
  CANVAS_API_URL: z.string().url().optional(),
  CANVAS_API_TOKEN: z.string().optional(),
})
```

### AI Service

```typescript
export const aiServiceEnvSchema = baseEnvSchema.extend({
  PORT: z.coerce.number().default(3007),
  SERVICE_NAME: z.string().default('ai-service'),
  OPENAI_API_KEY: z.string().min(1),
  ANTHROPIC_API_KEY: z.string().min(1),
  OPENAI_DEFAULT_MODEL: z.string().default('gpt-4-turbo-preview'),
  ANTHROPIC_DEFAULT_MODEL: z.string().default('claude-3-5-sonnet-20241022'),
  AI_MAX_TOKENS: z.coerce.number().default(4096),
  AI_TEMPERATURE: z.coerce.number().default(0.7),
  AI_STREAMING_ENABLED: z.coerce.boolean().default(true),
  LANGFUSE_PUBLIC_KEY: z.string().optional(),
  LANGFUSE_SECRET_KEY: z.string().optional(),
  LANGFUSE_HOST: z.string().url().default('https://cloud.langfuse.com'),
})
```

## Benefits

### 1. Type Safety

```typescript
// Before
const port = parseInt(process.env.PORT || '3001')  // Could be NaN

// After
import { env } from './config/env'
const port = env.PORT  // Guaranteed to be a number
```

### 2. Runtime Validation

```typescript
// Service fails fast on startup if env is invalid
// No more runtime errors from missing/invalid env vars
```

### 3. Autocomplete

```typescript
import { env } from './config/env'

env.  // IDE shows all available env vars with types
```

### 4. Documentation

```typescript
// Schema serves as documentation
PORT: z.coerce.number().default(3001).describe('Service port number')
```

## Testing

### Unit Tests

```typescript
import { validateEnv, aiServiceEnvSchema } from '@aah/config/env'

describe('Environment Validation', () => {
  it('should validate valid environment', () => {
    const env = validateEnv(aiServiceEnvSchema, {
      DATABASE_URL: 'postgresql://localhost:5432/db',
      OPENAI_API_KEY: 'sk-test',
      ANTHROPIC_API_KEY: 'sk-ant-test',
      // ... other required vars
    })
    
    expect(env.PORT).toBe(3007)
    expect(env.OPENAI_API_KEY).toBe('sk-test')
  })
  
  it('should throw on invalid environment', () => {
    expect(() => {
      validateEnv(aiServiceEnvSchema, {
        DATABASE_URL: 'invalid-url',  // Invalid URL
      })
    }).toThrow('Environment validation failed')
  })
  
  it('should apply defaults', () => {
    const env = validateEnv(aiServiceEnvSchema, {
      DATABASE_URL: 'postgresql://localhost:5432/db',
      OPENAI_API_KEY: 'sk-test',
      ANTHROPIC_API_KEY: 'sk-ant-test',
      // PORT not provided
    })
    
    expect(env.PORT).toBe(3007)  // Default applied
  })
})
```

### Integration Tests

```bash
# Test service startup with invalid env
DATABASE_URL=invalid pnpm --filter @aah/service-ai dev
# Should fail with clear error message

# Test service startup with valid env
pnpm --filter @aah/service-ai dev
# Should start successfully
```

## Migration Checklist

### Per Service

- [ ] Add `@aah/config` dependency
- [ ] Create `src/config/env.ts`
- [ ] Update `src/config/index.ts` to use `env`
- [ ] Update `src/index.ts` to validate on startup
- [ ] Replace all `process.env.*` with `env.*`
- [ ] Add unit tests for env validation
- [ ] Update service README with env requirements
- [ ] Test service startup locally
- [ ] Test service in preview deployment

### Global

- [ ] Update root `.env.example` with all required vars
- [ ] Update `DEPLOYMENT.md` with env validation info
- [ ] Update `MONOREPO_SETUP.md` with new patterns
- [ ] Create migration guide for team
- [ ] Update CI/CD to validate env before deployment

## Rollback Plan

If issues arise:

```bash
# Revert packages/config changes
git checkout packages/config/package.json
git checkout packages/config/env/index.ts

# Reinstall dependencies
pnpm install

# Services will continue using process.env directly
```

## Timeline

- **Phase 1** (Day 1): Install dependencies, fix TypeScript errors
- **Phase 2** (Day 2-3): Migrate all services
- **Phase 3** (Day 4): Migrate frontend apps
- **Phase 4** (Day 5): Testing and documentation
- **Phase 5** (Day 6): Deploy to preview
- **Phase 6** (Day 7): Deploy to production

## Success Criteria

- [ ] All services start successfully with validated env
- [ ] No TypeScript errors related to env vars
- [ ] All tests pass
- [ ] Documentation updated
- [ ] Team trained on new patterns
- [ ] Preview deployment successful
- [ ] Production deployment successful

## Support

- **Documentation**: See `packages/config/env/index.ts`
- **Examples**: See service-specific schemas above
- **Issues**: Check TypeScript diagnostics for env-related errors

---

**Status**: 🟡 Phase 1 Complete - Dependencies Installed  
**Next**: Phase 2 - Migrate Services  
**Owner**: Development Team  
**Priority**: Medium (Non-breaking, incremental rollout)
