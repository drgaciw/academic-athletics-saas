# AI-Evals Developer Experience Guide

Quick reference for working with the improved ai-evals package.

## Table of Contents
- [Quick Start](#quick-start)
- [New Import Patterns](#new-import-patterns)
- [Error Handling](#error-handling)
- [Test Utilities](#test-utilities)
- [TypeScript Tips](#typescript-tips)
- [Debugging](#debugging)

---

## Quick Start

### Installation

```bash
cd packages/ai-evals
pnpm install
```

### Type Checking

```bash
# Check for type errors
pnpm run type-check

# Watch mode
pnpm run type-check -- --watch
```

### Testing

```bash
# Run tests
pnpm run test

# Watch mode
pnpm run test -- --watch

# With coverage
pnpm run test -- --coverage
```

---

## New Import Patterns

### Path Aliases (Recommended)

Instead of deep nested imports, use path aliases:

```typescript
// ❌ Avoid: Deep nesting
import { TestCase } from '../../../types';
import { BaseRunner } from '../../runners/base-runner';
import { ExactMatchScorer } from '../../../scorers/exact-match';

// ✅ Prefer: Path aliases
import type { TestCase } from '@/types';
import { BaseRunner } from '@/runners';
import { ExactMatchScorer } from '@/scorers';
```

### Available Path Aliases

| Alias | Maps To | Usage |
|-------|---------|-------|
| `@/types` | `./src/types` | Type imports |
| `@/errors` | `./src/errors` | Error classes |
| `@/runners` | `./src/runners` | Runner classes |
| `@/scorers` | `./src/scorers` | Scorer classes |
| `@/datasets` | `./src/datasets` | Dataset utilities |
| `@/utils` | `./src/utils` | Utility functions |
| `@/monitoring` | `./src/monitoring` | Monitoring tools |
| `@/safety` | `./src/safety` | Safety features |

### Type vs Value Imports

Use `type` keyword for type-only imports:

```typescript
// Type imports (no runtime code)
import type { TestCase, Dataset, Score } from '@/types';

// Value imports (runtime code)
import { createRunner, createScorer } from '@/runners';
import { factories } from '@/__tests__/factories';

// Mixed
import { BaseRunner } from '@/runners';
import type { RunnerConfig } from '@/types';
```

**Why?** This enables better tree-shaking and faster builds.

---

## Error Handling

### Error Hierarchy

All errors extend from `EvalError` with structured context:

```typescript
import {
  EvalError,
  DatasetError,
  DatasetValidationError,
  ModelExecutionError,
  ScoringError,
  getErrorMessage,
} from '@/errors';
```

### Throwing Errors

**❌ Avoid: Generic errors**
```typescript
throw new Error('Something went wrong');
```

**✅ Prefer: Specific error types with context**
```typescript
throw new DatasetValidationError(
  `Invalid input field "gpa": expected number, got string`,
  dataset.id,
  testCase.id,
  'input.gpa'
);
```

### Catching Errors

**❌ Avoid: Losing context**
```typescript
try {
  await operation();
} catch (error) {
  console.log('Failed:', error);
  throw new Error('Operation failed');
}
```

**✅ Prefer: Preserve context**
```typescript
import { wrapError, getErrorMessage } from '@/errors';

try {
  await operation();
} catch (error) {
  throw wrapError(error, {
    operation: 'loadDataset',
    datasetId: id,
    attempt: attemptNumber,
  });
}
```

### Error Utilities

```typescript
// Get error message safely
const message = getErrorMessage(error);

// Check if error is retryable
if (isRetryableError(error)) {
  await retry();
}

// Wrap with additional context
throw wrapError(error, { userId, operation });
```

### Error Examples

```typescript
// Dataset errors
throw new DatasetFileError(
  'Failed to read dataset file',
  'dataset-001',
  '/path/to/file.json',
  'read',
  originalError
);

// Model errors
throw new ModelTimeoutError(
  'gpt-4o',
  'test-001',
  30000 // timeout in ms
);

// Rate limit errors
throw new ModelRateLimitError(
  'claude-sonnet-4',
  'test-002',
  60000 // retry after 60 seconds
);

// Configuration errors
throw new ConfigurationError(
  'Invalid scorer type',
  'scorer.type',
  'string',
  'undefined'
);
```

---

## Test Utilities

### Test Factories

Use factories instead of manual test data creation:

**❌ Avoid: Manual creation**
```typescript
const testCase: TestCase = {
  id: 'test-001',
  name: 'Test Case 1',
  category: 'compliance',
  input: { studentId: 'SA001', gpa: 3.5 },
  expected: { eligible: true },
  metadata: {
    source: 'synthetic',
    difficulty: 'easy',
    category: 'compliance',
    tags: ['gpa'],
    createdAt: new Date().toISOString(),
  }
};
```

**✅ Prefer: Factories**
```typescript
import { factories } from '@/__tests__/factories';

const testCase = factories.testCase({
  category: 'compliance',
  input: { studentId: 'SA001', gpa: 3.5 },
  expected: { eligible: true },
  metadata: { tags: ['gpa'] },
});
```

### Available Factories

```typescript
// Single items
factories.testCase(overrides?)
factories.dataset(overrides?)
factories.runResult(overrides?)
factories.score(overrides?)
factories.tokenUsage(overrides?)
factories.runnerConfig(overrides?)
factories.scorerConfig(overrides?)

// Batch creation
factories.testCases(count, template?)
factories.datasetWithTestCases(count, overrides?)

// ID generation
factories.generateId(prefix)
```

### Example Test

```typescript
import { factories } from '@/__tests__/factories';
import { ExactMatchScorer } from '@/scorers';

describe('ExactMatchScorer', () => {
  it('should pass for exact match', async () => {
    const scorer = new ExactMatchScorer();

    const score = await scorer.score(
      'test-001',
      { answer: '4' },
      { answer: '4' },
      { latencyMs: 100 }
    );

    expect(score.passed).toBe(true);
    expect(score.value).toBe(1.0);
  });

  it('should fail for mismatch', async () => {
    const scorer = new ExactMatchScorer();

    const score = await scorer.score(
      'test-002',
      { answer: '4' },
      { answer: '5' },
      { latencyMs: 100 }
    );

    expect(score.passed).toBe(false);
    expect(score.value).toBe(0.0);
    expect(score.explanation).toContain('Mismatch');
  });
});
```

### Batch Test Creation

```typescript
// Create 10 test cases
const testCases = factories.testCases(10, {
  category: 'compliance',
  metadata: { difficulty: 'medium' },
});

// Create dataset with 50 test cases
const largeDataset = factories.datasetWithTestCases(50, {
  name: 'Large Compliance Dataset',
  description: 'Comprehensive compliance test suite',
});
```

---

## TypeScript Tips

### Enable Strict Mode

The tsconfig now uses strict mode. This catches more errors:

```typescript
// ❌ Will error: implicit any
function process(data) {
  return data.value;
}

// ✅ Explicit types
function process(data: { value: number }): number {
  return data.value;
}
```

### Use Type Guards

```typescript
// Check types at runtime
function isTestCase(obj: unknown): obj is TestCase {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'input' in obj &&
    'expected' in obj
  );
}

// Usage
if (isTestCase(data)) {
  // TypeScript knows data is TestCase here
  console.log(data.id);
}
```

### Generic Types

Use generic types consistently:

```typescript
// ❌ Avoid: Non-generic
function loadDataset(id: string): Promise<Dataset> {
  // ...
}

// ✅ Prefer: Generic
function loadDataset<TInput, TOutput>(
  id: string
): Promise<Dataset<TInput, TOutput>> {
  // ...
}
```

---

## Debugging

### Enable Debug Mode

```bash
# Enable debug logging
export DEBUG_EVALS=true

# Run with debug
DEBUG_EVALS=true pnpm run test
```

### VSCode Debug Configuration

Add to `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Tests",
      "program": "${workspaceFolder}/packages/ai-evals/node_modules/.bin/jest",
      "args": [
        "--runInBand",
        "--no-cache",
        "${file}"
      ],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen",
      "env": {
        "DEBUG_EVALS": "true"
      }
    }
  ]
}
```

### Common Issues

#### "Cannot find module '@/types'"

**Solution:** Restart TypeScript server in IDE
- VSCode: `Cmd/Ctrl + Shift + P` → "TypeScript: Restart TS Server"

#### Type errors after updating types

**Solution:** Clean and rebuild
```bash
rm -rf dist
pnpm run build
pnpm run type-check
```

#### Import errors in tests

**Solution:** Check Jest moduleNameMapper in `jest.config.js`:
```javascript
moduleNameMapper: {
  '^@/(.*)$': '<rootDir>/src/$1',
}
```

---

## Best Practices

### 1. Always Use Type Imports for Types

```typescript
// ✅ Good
import type { TestCase } from '@/types';
import { BaseRunner } from '@/runners';

// ❌ Avoid
import { TestCase, BaseRunner } from '@/types';
```

### 2. Throw Specific Errors

```typescript
// ✅ Good
throw new DatasetValidationError(message, datasetId, testCaseId);

// ❌ Avoid
throw new Error(message);
```

### 3. Use Factories in Tests

```typescript
// ✅ Good
const testCase = factories.testCase({ input, expected });

// ❌ Avoid
const testCase = { id: '...', name: '...', /* etc */ };
```

### 4. Preserve Error Context

```typescript
// ✅ Good
catch (error) {
  throw wrapError(error, context);
}

// ❌ Avoid
catch (error) {
  throw new Error('Failed');
}
```

### 5. Document Complex Types

```typescript
/**
 * Configuration for the evaluation runner
 *
 * @property modelId - Model identifier (e.g., 'openai/gpt-4')
 * @property temperature - Sampling temperature (0-1)
 */
export interface RunnerConfig {
  modelId: string;
  temperature?: number;
}
```

---

## Resources

- **Full DX Review:** `docs/reports/ai-evals-dx-review.md`
- **Implementation Summary:** `docs/reports/ai-evals-dx-improvements-summary.md`
- **Checklist:** `DX-IMPROVEMENTS-CHECKLIST.md`
- **TypeScript Docs:** https://www.typescriptlang.org/docs/

---

## Getting Help

If you encounter issues:

1. Check type errors: `pnpm run type-check`
2. Review error message for context
3. Check this guide for patterns
4. Review the DX review document
5. Ask for help in the team channel

---

**Last Updated:** 2025-11-21
**Status:** Phase 1 Complete (P0 improvements implemented)
