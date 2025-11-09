# Dependency Standardization - Implementation Plan

**Date**: November 8, 2025  
**Trigger**: User Service package.json update  
**Status**: 🟡 In Progress

## Overview

The User Service was updated with modern dependency patterns that need to be propagated across all microservices for consistency and maintainability.

## Changes Required

### 1. **Hono v4 Upgrade** (Breaking Changes)

**Affected Services**: All 7 microservices
- services/user ✅ (already updated)
- services/ai
- services/advising
- services/compliance
- services/integration
- services/monitoring
- services/support
- packages/api-utils

**Breaking Changes in Hono v4**:
- Context API changes: `c.req.json()` is now async
- Middleware signature changes
- Type inference improvements
- Better TypeScript support

### 2. **Workspace Protocol Standardization**

**Change**: `"@aah/package": "*"` → `"@aah/package": "workspace:*"`

**Benefits**:
- Explicit workspace dependency declaration
- Better PNPM workspace resolution
- Prevents accidental external package resolution
- Clearer dependency graph

### 3. **Shared Package Dependencies**

**Add to all services**:
- `@aah/api-utils`: Shared API utilities (errors, responses, validation)
- `@aah/config`: Shared configuration (env validation, constants)

### 4. **Testing Infrastructure**

**Add to all services**:
```json
"scripts": {
  "test": "jest",
  "test:watch": "jest --watch",
  "test:coverage": "jest --coverage"
},
"devDependencies": {
  "jest": "^29.7.0",
  "@types/jest": "^29.5.0"
}
```

### 5. **Package Metadata**

**Add to all services**:
- `description`: Clear service description
- `keywords`: Relevant keywords for searchability
- `engines`: Node.js version requirement

## Implementation Order

### Phase 1: Foundation (Critical)
1. ✅ Update `packages/api-utils` to Hono v4
2. Update all service package.json files
3. Update service code for Hono v4 compatibility

### Phase 2: Testing Infrastructure
4. Add Jest configuration to each service
5. Create initial test files
6. Update CI/CD to run tests

### Phase 3: Documentation
7. Update service README files
8. Document breaking changes
9. Update monorepo documentation

## Detailed Changes by Service

### services/ai/package.json

```json
{
  "name": "@aah/service-ai",
  "version": "2.0.0",
  "private": true,
  "description": "AI microservice for conversational interfaces, RAG pipelines, and agentic workflows",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsup src/index.ts --format esm,cjs --dts",
    "type-check": "tsc --noEmit",
    "start": "node dist/index.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  },
  "dependencies": {
    "hono": "^4.0.0",
    "@aah/database": "workspace:*",
    "@aah/auth": "workspace:*",
    "@aah/api-utils": "workspace:*",
    "@aah/config": "workspace:*",
    "@aah/ai": "workspace:*",
    "compromise": "^14.14.0",
    "jsonwebtoken": "^9.0.2",
    "crypto-js": "^4.2.0"
  },
  "devDependencies": {
    "tsx": "^4.7.0",
    "tsup": "^8.0.0",
    "typescript": "^5.3.0",
    "@types/node": "^20.10.0",
    "@types/jsonwebtoken": "^9.0.5",
    "@types/crypto-js": "^4.2.2",
    "jest": "^29.7.0",
    "@types/jest": "^29.5.0"
  },
  "keywords": ["ai", "llm", "rag", "agents", "conversational-ai"],
  "engines": {
    "node": ">=18.0.0"
  }
}
```

### services/advising/package.json

```json
{
  "name": "@aah/service-advising",
  "version": "2.0.0",
  "private": true,
  "description": "Advising Service - Course selection, scheduling, conflict detection, and degree progress tracking",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsup src/index.ts --format esm,cjs --dts",
    "type-check": "tsc --noEmit",
    "start": "node dist/index.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint src --ext .ts"
  },
  "dependencies": {
    "hono": "^4.0.0",
    "@aah/database": "workspace:*",
    "@aah/auth": "workspace:*",
    "@aah/api-utils": "workspace:*",
    "@aah/config": "workspace:*",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "tsx": "^4.7.0",
    "tsup": "^8.0.0",
    "typescript": "^5.3.0",
    "@types/node": "^20.10.0",
    "jest": "^29.7.0",
    "@types/jest": "^29.5.0"
  },
  "keywords": [
    "advising",
    "scheduling",
    "academic",
    "course-selection",
    "conflict-detection",
    "degree-audit",
    "csp-solver"
  ],
  "engines": {
    "node": ">=18.0.0"
  }
}
```

### services/compliance/package.json

```json
{
  "name": "@aah/service-compliance",
  "version": "2.0.0",
  "private": true,
  "description": "NCAA Division I compliance service for eligibility tracking and rule enforcement",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsup src/index.ts --format esm,cjs --dts",
    "type-check": "tsc --noEmit",
    "start": "node dist/index.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  },
  "dependencies": {
    "hono": "^4.0.0",
    "@aah/database": "workspace:*",
    "@aah/auth": "workspace:*",
    "@aah/api-utils": "workspace:*",
    "@aah/config": "workspace:*",
    "zod": "^3.22.4",
    "date-fns": "^3.0.0"
  },
  "devDependencies": {
    "tsx": "^4.7.0",
    "tsup": "^8.0.0",
    "typescript": "^5.3.0",
    "@types/node": "^20.10.0",
    "jest": "^29.7.0",
    "@types/jest": "^29.5.0"
  },
  "keywords": ["ncaa", "compliance", "eligibility", "division-i"],
  "engines": {
    "node": ">=18.0.0"
  }
}
```

### services/integration/package.json

```json
{
  "name": "@aah/service-integration",
  "version": "2.0.0",
  "private": true,
  "description": "Integration service for external systems (LMS, SIS, email, calendar)",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsup src/index.ts --format esm,cjs --dts",
    "type-check": "tsc --noEmit",
    "start": "node dist/index.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  },
  "dependencies": {
    "hono": "^4.0.0",
    "@aah/database": "workspace:*",
    "@aah/auth": "workspace:*",
    "@aah/api-utils": "workspace:*",
    "@aah/config": "workspace:*",
    "zod": "^3.22.4",
    "resend": "^3.2.0",
    "googleapis": "^133.0.0",
    "@microsoft/microsoft-graph-client": "^3.0.7",
    "@vercel/blob": "^0.22.0",
    "pdfkit": "^0.14.0",
    "canvas-api": "^1.0.0",
    "axios": "^1.6.7"
  },
  "devDependencies": {
    "tsx": "^4.7.0",
    "tsup": "^8.0.0",
    "typescript": "^5.3.0",
    "@types/node": "^20.10.0",
    "@types/pdfkit": "^0.13.0",
    "jest": "^29.7.0",
    "@types/jest": "^29.5.0"
  },
  "keywords": ["integration", "lms", "sis", "email", "calendar"],
  "engines": {
    "node": ">=18.0.0"
  }
}
```

### services/monitoring/package.json

```json
{
  "name": "@aah/service-monitoring",
  "version": "2.0.0",
  "private": true,
  "description": "Monitoring service for academic performance tracking and real-time alerts",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsup src/index.ts --format esm,cjs --dts",
    "type-check": "tsc --noEmit",
    "start": "node dist/index.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  },
  "dependencies": {
    "hono": "^4.0.0",
    "@aah/database": "workspace:*",
    "@aah/auth": "workspace:*",
    "@aah/api-utils": "workspace:*",
    "@aah/config": "workspace:*",
    "pusher": "^5.2.0",
    "pusher-js": "^8.4.0-rc2",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "tsx": "^4.7.0",
    "tsup": "^8.0.0",
    "typescript": "^5.3.0",
    "@types/node": "^20.10.0",
    "jest": "^29.7.0",
    "@types/jest": "^29.5.0"
  },
  "keywords": ["monitoring", "analytics", "alerts", "performance-tracking"],
  "engines": {
    "node": ">=18.0.0"
  }
}
```

### services/support/package.json

```json
{
  "name": "@aah/service-support",
  "version": "2.0.0",
  "private": true,
  "description": "Support service for tutoring, study halls, and life skills programs",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsup src/index.ts --format esm,cjs --dts",
    "type-check": "tsc --noEmit",
    "start": "node dist/index.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  },
  "dependencies": {
    "hono": "^4.0.0",
    "@aah/database": "workspace:*",
    "@aah/auth": "workspace:*",
    "@aah/api-utils": "workspace:*",
    "@aah/config": "workspace:*",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "tsx": "^4.7.0",
    "tsup": "^8.0.0",
    "typescript": "^5.3.0",
    "@types/node": "^20.10.0",
    "jest": "^29.7.0",
    "@types/jest": "^29.5.0"
  },
  "keywords": ["tutoring", "study-hall", "mentoring", "life-skills"],
  "engines": {
    "node": ">=18.0.0"
  }
}
```

### packages/api-utils/package.json

```json
{
  "name": "@aah/api-utils",
  "version": "1.0.0",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "description": "Shared API utilities for microservices (errors, responses, validation, logging)",
  "exports": {
    ".": "./src/index.ts",
    "./errors": "./src/utils/errors.ts",
    "./responses": "./src/utils/responses.ts",
    "./validation": "./src/utils/validation.ts",
    "./logging": "./src/utils/logging.ts",
    "./http": "./src/utils/http.ts",
    "./rateLimit": "./src/utils/rateLimit.ts",
    "./types": "./src/types/index.ts"
  },
  "scripts": {
    "type-check": "tsc --noEmit",
    "test": "jest",
    "test:watch": "jest --watch"
  },
  "dependencies": {
    "hono": "^4.0.0",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "@types/node": "^20.10.0",
    "jest": "^29.7.0",
    "@types/jest": "^29.5.0"
  },
  "keywords": ["api", "utilities", "middleware", "validation"],
  "engines": {
    "node": ">=18.0.0"
  }
}
```

## Hono v4 Code Migration

### Breaking Changes to Address

1. **Async JSON parsing**:
```typescript
// Before (Hono v3)
const body = c.req.json()

// After (Hono v4)
const body = await c.req.json()
```

2. **Context type improvements**:
```typescript
// Hono v4 has better type inference
// No code changes needed, but types will be more accurate
```

3. **Middleware signatures**:
```typescript
// Most middleware remains compatible
// Check custom middleware for any issues
```

## Testing Strategy

### Jest Configuration (jest.config.js)

Create in each service:
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
}
```

## Rollout Plan

### Step 1: Update Package Files (30 min)
- Update all 7 service package.json files
- Update packages/api-utils package.json
- Run `pnpm install` to update lockfile

### Step 2: Code Migration (1-2 hours)
- Search for `c.req.json()` calls
- Add `await` keyword where needed
- Test each service individually

### Step 3: Testing Setup (1 hour)
- Add jest.config.js to each service
- Create initial test files
- Verify tests run successfully

### Step 4: Verification (30 min)
- Run `turbo run build` - all services build
- Run `turbo run type-check` - no type errors
- Run `turbo run test` - all tests pass
- Start all services - no runtime errors

## Commands

```bash
# Update dependencies
pnpm install

# Build all services
turbo run build

# Type check all services
turbo run type-check

# Run all tests
turbo run test

# Test specific service
pnpm --filter @aah/service-user test

# Start all services
turbo run dev
```

## Risks & Mitigation

### Risk 1: Hono v4 Breaking Changes
**Mitigation**: Thorough testing of each service, gradual rollout

### Risk 2: Workspace Protocol Issues
**Mitigation**: PNPM handles this well, but verify with `pnpm list`

### Risk 3: Test Infrastructure Overhead
**Mitigation**: Start with minimal tests, expand gradually

## Success Criteria

- ✅ All services use Hono v4
- ✅ All services use `workspace:*` protocol
- ✅ All services have test infrastructure
- ✅ All services build without errors
- ✅ All services pass type checking
- ✅ All services start successfully
- ✅ No regression in functionality

## Timeline

- **Phase 1**: 2 hours (package updates + code migration)
- **Phase 2**: 1 hour (testing setup)
- **Phase 3**: 30 min (verification)
- **Total**: ~3.5 hours

## Next Steps

1. Review and approve this plan
2. Execute Phase 1 (package updates)
3. Execute Phase 2 (code migration)
4. Execute Phase 3 (testing setup)
5. Verify and deploy

---

**Status**: Ready for implementation  
**Priority**: High (consistency and maintainability)  
**Impact**: All microservices
