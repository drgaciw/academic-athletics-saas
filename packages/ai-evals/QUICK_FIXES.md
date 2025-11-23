# AI Evals Quick Fixes - Immediate Actions

This document outlines quick wins that can be implemented immediately to improve code quality and eliminate technical debt.

## Priority 1: Critical Type Safety Issues

### Fix 1: Remove `as any` Type Casts in AI SDK Calls

**Files to Update:**
- `src/base-runner.ts` (lines 280, 759, 764)
- `src/runners/base-runner.ts` (lines 243, 261)
- `src/scorers.ts` (lines 654, 760, 764)

**Search Pattern:**
```bash
# Find all instances
grep -rn "as any" src/
```

**Quick Fix:**

```typescript
// BEFORE (src/runners/base-runner.ts:243)
const result = await generateObject({
  model: provider(modelName),
  schema,
  prompt,
  temperature: config.temperature,
  maxTokens: config.maxTokens,
  ...config.additionalParams,
} as any);

// AFTER
import type { LanguageModelV1 } from '@ai-sdk/provider';

const result = await generateObject({
  model: provider(modelName) as LanguageModelV1,
  schema,
  prompt,
  temperature: config.temperature,
  maxTokens: config.maxTokens,
});
```

**Command to Apply:**
```bash
cd packages/ai-evals
# Update package.json to move @ai-sdk/provider to dependencies
pnpm add @ai-sdk/provider@^2.0.0
```

---

### Fix 2: Standardize Token Usage Extraction

**Create New File:** `src/utils/token-utils.ts`

```typescript
import type { TokenUsage } from '../types';

/**
 * Normalize token usage from AI SDK response
 * Handles multiple field name variations from different providers
 */
export function normalizeTokenUsage(usage: any): TokenUsage {
  const prompt = Number(
    usage?.promptTokens ??
    usage?.prompt_tokens ??
    usage?.inputTokens ??
    usage?.input_tokens ??
    0
  );

  const completion = Number(
    usage?.completionTokens ??
    usage?.completion_tokens ??
    usage?.outputTokens ??
    usage?.output_tokens ??
    0
  );

  const total = Number(
    usage?.totalTokens ??
    usage?.total_tokens ??
    0
  ) || (prompt + completion);

  return { prompt, completion, total };
}

/**
 * Type guard to check if usage has expected structure
 */
export function isValidUsage(usage: any): usage is TokenUsage {
  return (
    typeof usage === 'object' &&
    usage !== null &&
    typeof usage.prompt === 'number' &&
    typeof usage.completion === 'number' &&
    typeof usage.total === 'number'
  );
}
```

**Update BaseRunner to Use Utility:**

```typescript
// In src/runners/base-runner.ts
import { normalizeTokenUsage } from '../utils/token-utils';

// Replace lines 248-251 and 266-269
return {
  output: result.object as TOutput,
  tokenUsage: normalizeTokenUsage(result.usage),
};

// And for text generation:
return {
  output: this.parseOutput(result.text),
  tokenUsage: normalizeTokenUsage(result.usage),
};
```

---

## Priority 2: Configuration Updates

### Fix 3: Update Jest Configuration

**File:** `jest.config.js`

```javascript
// REPLACE ENTIRE FILE
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          esModuleInterop: true,
          isolatedModules: true,
        },
      },
    ],
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

---

### Fix 4: Update TypeScript Configuration

**File:** `tsconfig.json`

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
    "declarationMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts", "**/*.spec.ts"]
}
```

---

## Priority 3: Code Organization

### Fix 5: Consolidate BaseRunner Implementations

**Action Plan:**

1. **Identify Usage:**
```bash
# Find all imports from the legacy base-runner
grep -rn "from './base-runner'" src/
grep -rn "from '../base-runner'" src/
```

2. **Update Imports:**
```typescript
// BEFORE
import { SimpleRunner, JSONRunner } from '../base-runner';
import { BaseRunner } from './base-runner';

// AFTER
import { SimpleRunner, JSONRunner, BaseRunner } from './runners/base-runner';
```

3. **Update Index Exports:**

**File:** `src/index.ts`

```typescript
// BEFORE
export * from './base-runner'

// AFTER
export * from './runners/base-runner'
```

4. **Delete Legacy File:**
```bash
rm src/base-runner.ts
```

5. **Move Exports:**
Ensure `src/runners/base-runner.ts` exports everything that was in `src/base-runner.ts`:

```typescript
// At the end of src/runners/base-runner.ts
export class SimpleRunner extends BaseRunner {
  // ... existing implementation
}

export class JSONRunner extends BaseRunner {
  // ... existing implementation
}

export function createRunner(
  type: 'simple' | 'json' = 'simple',
  config?: BaseRunnerConfig
): BaseRunner {
  switch (type) {
    case 'simple':
      return new SimpleRunner(config);
    case 'json':
      return new JSONRunner(config);
    default:
      throw new Error(`Unknown runner type: ${type}`);
  }
}
```

---

## Priority 4: Documentation

### Fix 6: Add Type Documentation

**File:** `src/types/index.ts`

Add JSDoc comments to key interfaces:

```typescript
/**
 * Token usage statistics from model inference
 *
 * @property prompt - Number of tokens in the prompt/input
 * @property completion - Number of tokens in the completion/output
 * @property total - Total tokens used (prompt + completion)
 */
export interface TokenUsage {
  prompt: number;
  completion: number;
  total: number;
}

/**
 * Runner configuration for model execution
 *
 * @property modelId - Model identifier in format "provider/model" or "model"
 * @property temperature - Sampling temperature (0-2, default 0.7)
 * @property maxTokens - Maximum tokens to generate (default 2000)
 * @property timeout - Request timeout in milliseconds (default 30000)
 * @property retries - Number of retry attempts on failure (default 3)
 * @property additionalParams - Provider-specific additional parameters
 */
export interface RunnerConfig {
  modelId: string;
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
  retries?: number;
  additionalParams?: Record<string, any>;
}
```

---

## Automated Fix Script

Create a script to apply some fixes automatically:

**File:** `scripts/apply-quick-fixes.sh`

```bash
#!/bin/bash
set -e

echo "Applying AI Evals Quick Fixes..."

# 1. Install missing dependency
echo "Installing @ai-sdk/provider..."
pnpm add @ai-sdk/provider@^2.0.0

# 2. Create token utils
echo "Creating token utils..."
mkdir -p src/utils
cat > src/utils/token-utils.ts << 'EOF'
import type { TokenUsage } from '../types';

export function normalizeTokenUsage(usage: any): TokenUsage {
  const prompt = Number(
    usage?.promptTokens ??
    usage?.prompt_tokens ??
    usage?.inputTokens ??
    usage?.input_tokens ??
    0
  );

  const completion = Number(
    usage?.completionTokens ??
    usage?.completion_tokens ??
    usage?.outputTokens ??
    usage?.output_tokens ??
    0
  );

  const total = Number(
    usage?.totalTokens ??
    usage?.total_tokens ??
    0
  ) || (prompt + completion);

  return { prompt, completion, total };
}

export function isValidUsage(usage: any): usage is TokenUsage {
  return (
    typeof usage === 'object' &&
    usage !== null &&
    typeof usage.prompt === 'number' &&
    typeof usage.completion === 'number' &&
    typeof usage.total === 'number'
  );
}
EOF

# 3. Update index exports
echo "Updating index exports..."
cat > src/utils/index.ts << 'EOF'
export * from './token-utils';
EOF

echo "Quick fixes applied! Please review changes and run tests."
echo ""
echo "Next steps:"
echo "1. Run: pnpm test"
echo "2. Fix any remaining type errors"
echo "3. Commit changes"
```

---

## Testing Checklist

After applying fixes, verify:

- [ ] `pnpm build` succeeds without errors
- [ ] `pnpm type-check` passes
- [ ] `pnpm test` all tests pass
- [ ] No `as any` type casts remain (search for them)
- [ ] Token usage is correctly extracted in all runners
- [ ] Integration tests with OpenAI/Anthropic work
- [ ] Cost calculation is accurate

---

## Commands to Run

```bash
# Navigate to package
cd packages/ai-evals

# Install dependencies
pnpm install

# Apply automated fixes
chmod +x scripts/apply-quick-fixes.sh
./scripts/apply-quick-fixes.sh

# Verify changes
pnpm build
pnpm type-check
pnpm test

# Review changes
git status
git diff
```

---

## Expected Outcomes

After applying these quick fixes:

1. **Type Safety**: No more `as any` bypassing type checking
2. **Consistency**: Token usage extracted uniformly across all runners
3. **Maintainability**: Cleaner code structure with utilities
4. **Modern Standards**: Up-to-date Jest and TypeScript configurations
5. **Better DX**: Improved autocomplete and error messages in IDEs

---

## Estimated Time

- **Automated Fixes**: 15 minutes
- **Manual Type Fixes**: 1-2 hours
- **Testing & Verification**: 1 hour
- **Total**: 2-3 hours

---

## Risk Assessment

**Low Risk:**
- Jest configuration update
- TypeScript configuration update
- Adding utility functions

**Medium Risk:**
- Removing `as any` casts (may reveal type errors)
- Consolidating BaseRunner files (may break imports)

**Mitigation:**
- Create feature branch
- Run comprehensive tests
- Review changes before merging
- Keep MODERNIZATION_PLAN.md for larger changes

---

**Document Version:** 1.0
**Last Updated:** 2025-11-21
