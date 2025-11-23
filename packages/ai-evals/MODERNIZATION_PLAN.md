# AI Evals Package Modernization Plan

## Legacy Analysis Summary

After comprehensive analysis of the `packages/ai-evals` codebase, I've identified critical legacy patterns, outdated dependencies, and architectural inconsistencies that require modernization.

**Analysis Date:** 2025-11-21
**Package Version:** 1.0.0
**AI SDK Version:** 5.0.95

---

## High Priority Modernizations

### 1. Consolidate Duplicate BaseRunner Implementations

**Current State:**
- Two separate BaseRunner files: `src/base-runner.ts` and `src/runners/base-runner.ts`
- Incompatible APIs and different implementation patterns
- Legacy file (`src/base-runner.ts`) uses older patterns with `maxOutputTokens`
- Modern file (`src/runners/base-runner.ts`) uses `maxTokens` (AI SDK v5 standard)

**Proposed Update:**
- Remove `src/base-runner.ts` entirely
- Consolidate all functionality into `src/runners/base-runner.ts`
- Update all imports to use the canonical location
- Ensure `src/index.ts` exports from the correct location

**Migration Steps:**
1. Audit all imports of `./base-runner` and `../base-runner`
2. Update imports to use `./runners/base-runner`
3. Delete `src/base-runner.ts`
4. Run tests to verify compatibility

**Effort Estimate:** Medium
**Risk Level:** Medium
**Impact:** Eliminates confusion, reduces maintenance burden

---

### 2. Fix AI SDK v5 Type Compatibility Issues

**Current State:**
```typescript
// Incorrect: Using 'as any' to bypass type checking
const result = await generateText({
  model: provider(modelName),
  prompt,
  temperature: config.temperature,
  maxTokens: config.maxTokens,
  ...config.additionalParams,
} as any);
```

**Rationale:**
- AI SDK v5 has stricter TypeScript types
- `as any` bypasses type safety and can hide errors
- Token usage field names changed in v5

**Proposed Update:**
```typescript
import { generateText } from 'ai';
import type { LanguageModelV1 } from '@ai-sdk/provider';

// Correct: Use proper typing with AI SDK v5
const result = await generateText({
  model: provider(modelName) as LanguageModelV1,
  prompt,
  temperature: config.temperature,
  maxTokens: config.maxTokens,
});

// Handle token usage with proper field names
const tokenUsage: TokenUsage = {
  prompt: result.usage.promptTokens,
  completion: result.usage.completionTokens,
  total: result.usage.totalTokens,
};
```

**Migration Steps:**
1. Install `@ai-sdk/provider@^2.0.0` as a dependency (currently devDependency)
2. Update all `generateText` calls to remove `as any` casts
3. Update all `generateObject` calls similarly
4. Update `embed` calls to use `openai.embedding()` pattern correctly
5. Create type guard utilities for model providers
6. Update token usage extraction to use consistent field names

**Code Examples:**

**Before:**
```typescript
const result = await generateText({
  model: openai(this.model) as any,
  prompt,
  temperature: 0,
  maxTokens: 500,
} as any);
```

**After:**
```typescript
import type { LanguageModelV1 } from '@ai-sdk/provider';

const result = await generateText({
  model: openai(this.model) as LanguageModelV1,
  prompt,
  temperature: 0,
  maxTokens: 500,
});
```

**Effort Estimate:** High
**Risk Level:** Medium
**Affected Files:**
- `src/base-runner.ts`
- `src/runners/base-runner.ts`
- `src/scorers.ts`
- `src/specialized-runners.ts`

---

### 3. Standardize Token Usage Field Names

**Current State:**
- Multiple token usage patterns across the codebase:
  - `promptTokens` / `completionTokens` / `totalTokens` (AI SDK v5)
  - `prompt` / `completion` / `total` (Internal types)
  - `inputTokens` / `outputTokens` (Anthropic)
  - `prompt_tokens` / `completion_tokens` (OpenAI API)

**Proposed Update:**
- Use `TokenUsage` interface consistently: `{ prompt, completion, total }`
- Create utility function for normalizing token usage from different sources
- Update all extraction logic to use the utility

**Migration Steps:**
1. Create `src/utils/token-utils.ts`:
```typescript
import type { TokenUsage } from '../types';

/**
 * Normalize token usage from AI SDK response
 */
export function normalizeTokenUsage(usage: any): TokenUsage {
  const prompt = usage?.promptTokens ??
                 usage?.prompt_tokens ??
                 usage?.inputTokens ??
                 usage?.input_tokens ?? 0;

  const completion = usage?.completionTokens ??
                     usage?.completion_tokens ??
                     usage?.outputTokens ??
                     usage?.output_tokens ?? 0;

  const total = usage?.totalTokens ??
                usage?.total_tokens ??
                (prompt + completion);

  return { prompt, completion, total };
}
```

2. Replace all token usage extraction with `normalizeTokenUsage()`
3. Remove duplicate normalization logic from BaseRunner classes

**Effort Estimate:** Medium
**Risk Level:** Low

---

### 4. Modernize Jest Configuration

**Current State:**
```javascript
// jest.config.js - DEPRECATED PATTERN
globals: {
  'ts-jest': {
    tsconfig: {
      esModuleInterop: true,
    },
  },
},
```

**Rationale:**
- `globals` configuration is deprecated in ts-jest v29+
- Can cause unexpected behavior with newer TypeScript versions
- Recommended to use top-level configuration or `ts-jest` transform options

**Proposed Update:**
```javascript
// jest.config.js - MODERN PATTERN
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        esModuleInterop: true,
        isolatedModules: true,
      },
    }],
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  moduleNameMapper: {
    '^@aah/(.*)$': '<rootDir>/../$1/src',
  },
};
```

**Migration Steps:**
1. Update `jest.config.js` to use modern configuration
2. Run tests to verify compatibility
3. Update coverage reports if needed

**Effort Estimate:** Low
**Risk Level:** Low

---

### 5. Update TypeScript Configuration

**Current State:**
```json
{
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "bundler"
  }
}
```

**Issues:**
- `moduleResolution: "bundler"` is experimental and can cause import issues
- May not work correctly with all tooling (Jest, ESLint, etc.)
- Better to use `node16` or `nodenext` for Node.js projects

**Proposed Update:**
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "module": "ESNext",
    "target": "ES2022",
    "lib": ["ES2022"],
    "moduleResolution": "node16",
    "types": ["node", "jest"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "declaration": true,
    "declarationMap": true,
    "allowImportingTsExtensions": false
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts", "**/*.spec.ts"]
}
```

**Rationale:**
- `node16` module resolution is stable and works with all Node.js tooling
- Matches Node.js ESM behavior more accurately
- Better IDE support and type checking

**Migration Steps:**
1. Update `tsconfig.json`
2. Fix any import errors that surface
3. Verify builds and tests pass
4. Update documentation if import patterns change

**Effort Estimate:** Medium
**Risk Level:** Medium

---

## Recommended Modernizations

### 6. Migrate to Modern TypeScript Utility Types

**Current State:**
- Custom `DeepPartial<T>` utility type defined in `utils.ts`
- Not using built-in TypeScript 5.x utility types

**Proposed Update:**
- Use TypeScript 5.x built-in utilities where possible
- Create more sophisticated utility types for better type inference

**Code Examples:**

**Current:**
```typescript
export type DeepPartial<T> = T extends object
  ? { [P in keyof T]?: DeepPartial<T[P]> }
  : T;
```

**Enhanced:**
```typescript
// Add more utility types
export type DeepPartial<T> = T extends object
  ? { [P in keyof T]?: DeepPartial<T[P]> }
  : T;

export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P];
};

export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

export type Awaitable<T> = T | Promise<T>;
```

**Effort Estimate:** Low
**Risk Level:** Low

---

### 7. Improve Async/Await Error Handling

**Current State:**
- Basic try-catch blocks without proper error typing
- Inconsistent error handling patterns across runners

**Proposed Update:**
```typescript
// Create typed error classes
export class EvaluationError extends Error {
  constructor(
    message: string,
    public code: string,
    public retryable: boolean = false,
    public cause?: Error
  ) {
    super(message);
    this.name = 'EvaluationError';
  }
}

export class ModelTimeoutError extends EvaluationError {
  constructor(timeoutMs: number, cause?: Error) {
    super(
      `Model request timeout after ${timeoutMs}ms`,
      'MODEL_TIMEOUT',
      true,
      cause
    );
  }
}

export class ModelRateLimitError extends EvaluationError {
  constructor(retryAfter?: number, cause?: Error) {
    super(
      `Model rate limit exceeded${retryAfter ? `, retry after ${retryAfter}s` : ''}`,
      'RATE_LIMIT',
      true,
      cause
    );
  }
}

// Use in runner
protected async executeWithRetry(
  testCase: TestCase,
  modelConfig: RunnerConfig
): Promise<ExecutionResult> {
  let lastError: EvaluationError | null = null;

  for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
    try {
      return await this.executeWithTimeout(context);
    } catch (error) {
      // Convert to typed error
      lastError = this.convertToEvaluationError(error);

      // Don't retry non-retryable errors
      if (!lastError.retryable) {
        throw lastError;
      }

      if (attempt < this.config.maxRetries) {
        await this.sleep(this.config.retryDelay);
      }
    }
  }

  throw lastError || new EvaluationError('Max retries exceeded', 'MAX_RETRIES');
}
```

**Effort Estimate:** Medium
**Risk Level:** Low

---

### 8. Enhance Type Safety for Dataset Schemas

**Current State:**
- Zod schemas are serialized/deserialized naively
- Schema validation happens but schemas aren't preserved correctly

**Proposed Update:**
- Use `zod-to-json-schema` for proper schema serialization
- Use schema descriptions for better documentation
- Implement schema version migration

**Migration Steps:**
1. Install `zod-to-json-schema` package:
```bash
pnpm add zod-to-json-schema
```

2. Update DatasetManager:
```typescript
import { zodToJsonSchema } from 'zod-to-json-schema';
import { z } from 'zod';

private serializeZodSchema(schema: z.ZodSchema): any {
  return zodToJsonSchema(schema, {
    name: schema.description || 'Schema',
    $refStrategy: 'none',
  });
}

private reconstructZodSchema(jsonSchema: any): z.ZodSchema {
  // For now, use z.any() but log a warning
  // A full implementation would use json-schema-to-zod
  console.warn('Schema reconstruction from JSON Schema not fully implemented');
  return z.any();
}
```

**Effort Estimate:** Medium
**Risk Level:** Low

---

### 9. Update Dependency Versions

**Current State:**
```json
{
  "ai": "^5.0.95",
  "@ai-sdk/openai": "^0.0.66",
  "@ai-sdk/anthropic": "^0.0.51"
}
```

**Proposed Update:**
Check for latest stable versions and update:
```json
{
  "ai": "^5.1.0",
  "@ai-sdk/openai": "^1.0.0",
  "@ai-sdk/anthropic": "^1.0.0",
  "@ai-sdk/provider": "^2.0.0"
}
```

**Migration Steps:**
1. Check current versions:
```bash
pnpm outdated
```

2. Update packages:
```bash
pnpm update ai @ai-sdk/openai @ai-sdk/anthropic
```

3. Review changelog for breaking changes
4. Update code to match new APIs
5. Run full test suite

**Effort Estimate:** Medium
**Risk Level:** Medium

---

## Breaking Changes & Considerations

### Potential Breaking Changes

1. **BaseRunner Import Path Changes**
   - Old: `import { BaseRunner } from '@aah/ai-evals/base-runner'`
   - New: `import { BaseRunner } from '@aah/ai-evals/runners/base-runner'`
   - Impact: All consumers of the package need to update imports

2. **Token Usage Field Names**
   - Internal types remain unchanged (`prompt`, `completion`, `total`)
   - But extraction logic is consolidated
   - Impact: Minimal, mostly internal changes

3. **TypeScript Module Resolution**
   - Changing from `bundler` to `node16` may require import path fixes
   - Impact: Development experience, may need to add `.js` extensions

### Migration Strategy

**Phase 1: Low-Risk Improvements (Week 1)**
- Update Jest configuration
- Add utility types
- Improve error handling
- Update documentation

**Phase 2: Medium-Risk Refactoring (Week 2)**
- Consolidate BaseRunner implementations
- Standardize token usage extraction
- Update TypeScript configuration
- Fix AI SDK type issues

**Phase 3: High-Risk Updates (Week 3)**
- Update dependency versions
- Test with all runners and scorers
- Update integration tests
- Deploy to staging

**Phase 4: Validation & Rollout (Week 4)**
- Comprehensive testing
- Performance benchmarking
- Documentation updates
- Production deployment

---

## Testing Strategy

### Unit Tests
- Verify all BaseRunner implementations work correctly
- Test token usage normalization with different providers
- Test error handling with typed errors
- Validate scorer functionality remains unchanged

### Integration Tests
- Test with actual OpenAI and Anthropic API calls
- Verify dataset loading/saving works correctly
- Test monitoring and alerting functionality
- Validate cost tracking accuracy

### Regression Tests
- Run full evaluation suite on existing datasets
- Compare results before/after modernization
- Verify performance metrics remain stable
- Check memory usage hasn't increased

---

## Rollback Strategy

### Preparation
1. Create feature branch: `feat/modernize-ai-evals`
2. Tag current version: `v1.0.0-pre-modernization`
3. Document all changes in CHANGELOG.md

### If Issues Arise
1. Revert to previous commit/tag
2. Document issues encountered
3. Create hotfix branch if needed
4. Re-plan modernization in phases

---

## Resources

### Documentation
- [AI SDK v5 Migration Guide](https://sdk.vercel.ai/docs/migration-guide)
- [ts-jest Configuration](https://kulshekhar.github.io/ts-jest/docs/getting-started/options/)
- [TypeScript 5.x Release Notes](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-0.html)

### Related Issues
- Duplicate BaseRunner implementations causing confusion
- Type safety issues with AI SDK v5
- Module resolution causing import errors in tests

---

## Success Metrics

1. **Code Quality**
   - Zero `as any` type casts
   - 100% TypeScript strict mode compliance
   - All tests passing

2. **Performance**
   - No regression in evaluation speed
   - Cost tracking remains accurate
   - Memory usage stable or improved

3. **Developer Experience**
   - Better IntelliSense/autocomplete
   - Clearer error messages
   - Easier to add new runners/scorers

4. **Maintainability**
   - Single source of truth for BaseRunner
   - Consistent patterns across codebase
   - Better documentation

---

## Next Steps

1. Review this modernization plan with the team
2. Get approval for breaking changes
3. Create GitHub issues for each modernization task
4. Schedule work across development sprints
5. Begin with Phase 1 low-risk improvements

---

**Document Version:** 1.0
**Last Updated:** 2025-11-21
**Prepared By:** Legacy Modernizer Agent
