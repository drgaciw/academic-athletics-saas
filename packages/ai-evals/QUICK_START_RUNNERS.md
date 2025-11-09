# Quick Start Guide: AI Evaluation Runners

This guide shows you how to quickly start using the AI evaluation runners.

## Installation

The runners are part of the `@aah/ai-evals` package. Dependencies are inherited from `@aah/ai` package which includes:

- Vercel AI SDK (`ai`)
- OpenAI SDK (`@ai-sdk/openai`)
- Anthropic SDK (`@ai-sdk/anthropic`)
- Zod for validation (`zod`)

## Basic Usage

### 1. Import a Runner

```typescript
import { ComplianceRunner } from '@aah/ai-evals/runners';
```

### 2. Create a Test Case

```typescript
import { TestCase, ComplianceInput, ComplianceOutput } from '@aah/ai-evals/types';

const testCase: TestCase<ComplianceInput, ComplianceOutput> = {
  id: 'compliance-001',
  input: {
    studentId: 'SA12345',
    gpa: 2.8,
    creditHours: 24,
    progressTowardDegree: 0.35,
    semester: 'fall-2025',
  },
  expected: {
    eligible: true,
    issues: [],
    recommendations: [],
  },
  metadata: {
    difficulty: 'easy',
    category: 'gpa-check',
    tags: ['ncaa', 'eligibility'],
    createdAt: new Date(),
    source: 'synthetic',
  },
};
```

### 3. Configure the Runner

```typescript
import { RunnerConfig } from '@aah/ai-evals/types';

const config: RunnerConfig = {
  modelId: 'gpt-4',
  temperature: 0.1,
  maxTokens: 1000,
  timeout: 30000, // 30 seconds
  retries: 3,
};
```

### 4. Run the Test

```typescript
const runner = new ComplianceRunner();
const result = await runner.runTestCase(testCase, config);

console.log('Result:', result.actual);
console.log('Latency:', result.metadata.latency, 'ms');
console.log('Cost:', result.metadata.cost, 'USD');
console.log('Tokens:', result.metadata.tokenUsage.total);
```

## All Available Runners

### ComplianceRunner
Tests NCAA eligibility checking.

```typescript
import { ComplianceRunner } from '@aah/ai-evals/runners';

const runner = new ComplianceRunner();
// Input: { studentId, gpa, creditHours, progressTowardDegree, semester }
// Output: { eligible, issues[], recommendations[] }
```

### ConversationalRunner
Tests chat response quality.

```typescript
import { ConversationalRunner } from '@aah/ai-evals/runners';

const runner = new ConversationalRunner();
// Input: { message, context: { userId, role, conversationHistory } }
// Output: { answer, citations[], tone, followUpSuggestions[] }
```

### AdvisingRunner
Tests course recommendations.

```typescript
import { AdvisingRunner } from '@aah/ai-evals/runners';

const runner = new AdvisingRunner();
// Input: { studentId, major, completedCourses[], semester, athleticSchedule }
// Output: { recommendations[], warnings[] }
```

### RiskPredictionRunner
Tests academic risk prediction.

```typescript
import { RiskPredictionRunner } from '@aah/ai-evals/runners';

const runner = new RiskPredictionRunner();
// Input: { studentId, academicMetrics, athleticMetrics, supportMetrics }
// Output: { riskScore, riskLevel, factors[], recommendations[] }
```

### RAGRunner
Tests retrieval-augmented generation.

```typescript
import { RAGRunner } from '@aah/ai-evals/runners';

const runner = new RAGRunner();
// Input: { query, context, maxDocuments }
// Output: { answer, sources[], confidence }
```

## Running Multiple Tests

### Sequential Execution

```typescript
const testCases = [testCase1, testCase2, testCase3];

const results = await runner.runDataset(testCases, config, {
  parallel: false,
  onProgress: (completed, total) => {
    console.log(`Progress: ${completed}/${total}`);
  },
});

console.log(`Completed ${results.length} tests`);
```

### Parallel Execution

```typescript
const results = await runner.runDataset(testCases, config, {
  parallel: true,
  concurrency: 5, // Run 5 tests at once
  onProgress: (completed, total) => {
    console.log(`Progress: ${completed}/${total}`);
  },
});
```

## Comparing Models

### Compare Multiple Models

```typescript
import { runModelComparison, formatComparisonReport } from '@aah/ai-evals/runners';

const configs = [
  { modelId: 'gpt-4', temperature: 0.3 },
  { modelId: 'gpt-4-turbo', temperature: 0.3 },
  { modelId: 'claude-sonnet-4', temperature: 0.3 },
];

const report = await runModelComparison(runner, testCases, configs, {
  parallel: true,
  concurrency: 3,
  scorerConfig: {
    strategy: 'exact', // Compare outputs exactly
  },
});

console.log(formatComparisonReport(report));
```

### Comparison Report Output

```
================================================================================
MODEL COMPARISON REPORT
================================================================================

Summary by Model:
--------------------------------------------------------------------------------
Model                         Avg Score   Win Rate    Avg Latency   Total Cost
--------------------------------------------------------------------------------
gpt-4                         0.950       60.0%       1200ms        $0.0150
claude-sonnet-4               0.920       40.0%       950ms         $0.0090
gpt-4-turbo                   0.900       0.0%        800ms         $0.0060

Total Duration: 25.50s
Test Cases: 10
Models Compared: 3
```

## Supported Models

### OpenAI Models

```typescript
{ modelId: 'gpt-4' }                 // GPT-4
{ modelId: 'gpt-4-turbo' }           // GPT-4 Turbo
{ modelId: 'gpt-3.5-turbo' }         // GPT-3.5 Turbo
{ modelId: 'openai/gpt-4' }          // Explicit provider
```

### Anthropic Models

```typescript
{ modelId: 'claude-opus-4' }         // Claude Opus 4
{ modelId: 'claude-sonnet-4' }       // Claude Sonnet 4
{ modelId: 'claude-haiku-4' }        // Claude Haiku 4
{ modelId: 'anthropic/claude-opus-4' } // Explicit provider
```

## Configuration Options

### Temperature

Controls randomness:
- `0.0-0.3`: Deterministic (good for evals)
- `0.4-0.7`: Balanced
- `0.8-1.0`: Creative (not recommended for evals)

```typescript
{ temperature: 0.1 } // Highly deterministic
```

### Max Tokens

Limits response length:

```typescript
{ maxTokens: 1000 } // Short responses
{ maxTokens: 2000 } // Medium responses (default)
{ maxTokens: 4000 } // Long responses
```

### Timeout

Maximum time to wait:

```typescript
{ timeout: 10000 }  // 10 seconds
{ timeout: 30000 }  // 30 seconds (default)
{ timeout: 60000 }  // 60 seconds
```

### Retries

Number of retry attempts:

```typescript
{ retries: 1 } // Retry once
{ retries: 3 } // Retry 3 times (default)
{ retries: 5 } // Retry 5 times
```

## Cost Tracking

Costs are automatically calculated based on token usage:

```typescript
const result = await runner.runTestCase(testCase, config);

console.log('Tokens used:', result.metadata.tokenUsage.total);
console.log('Cost:', result.metadata.cost.toFixed(4), 'USD');

// For a dataset
const results = await runner.runDataset(testCases, config);
const totalCost = results.reduce((sum, r) => sum + r.metadata.cost, 0);
console.log('Total cost:', totalCost.toFixed(4), 'USD');
```

## Error Handling

Errors are captured in result metadata:

```typescript
const result = await runner.runTestCase(testCase, config);

if (result.metadata.error) {
  console.error('Test failed:', result.metadata.error);
  // Result still includes timing and partial data
} else {
  console.log('Test passed:', result.actual);
}
```

## Progress Tracking

Track execution progress in real-time:

```typescript
await runner.runDataset(testCases, config, {
  onProgress: (completed, total) => {
    const percentage = ((completed / total) * 100).toFixed(1);
    console.log(`Progress: ${percentage}% (${completed}/${total})`);
  },
});
```

## Common Patterns

### Run Single Test with Logging

```typescript
const result = await runner.runTestCase(testCase, config);

console.log('Test Case:', result.testCaseId);
console.log('Model:', result.metadata.modelId);
console.log('Latency:', result.metadata.latency, 'ms');
console.log('Cost:', '$' + result.metadata.cost.toFixed(4));
console.log('Expected:', result.expected);
console.log('Actual:', result.actual);
```

### Run Dataset with Cost Monitoring

```typescript
const results = await runner.runDataset(testCases, config, {
  parallel: true,
  concurrency: 3,
});

const stats = {
  total: results.length,
  successful: results.filter(r => !r.metadata.error).length,
  failed: results.filter(r => r.metadata.error).length,
  totalCost: results.reduce((sum, r) => sum + r.metadata.cost, 0),
  avgLatency: results.reduce((sum, r) => sum + r.metadata.latency, 0) / results.length,
};

console.log('Statistics:', stats);
```

### Compare Models with Custom Scoring

```typescript
const report = await runModelComparison(runner, testCases, configs, {
  scorerConfig: {
    strategy: 'custom',
    customScorer: async (expected, actual) => {
      // Custom scoring logic
      const matches = expected.eligible === actual.eligible;
      return {
        passed: matches,
        score: matches ? 1.0 : 0.0,
        explanation: matches ? 'Eligibility matches' : 'Eligibility mismatch',
      };
    },
  },
});

console.log(formatComparisonReport(report));
```

## Tips for Best Results

### 1. Use Low Temperature for Consistency
```typescript
{ temperature: 0.1 } // More reproducible results
```

### 2. Monitor Costs
```typescript
const results = await runner.runDataset(testCases, config);
const cost = results.reduce((sum, r) => sum + r.metadata.cost, 0);
if (cost > 1.0) console.warn('High cost detected!');
```

### 3. Handle Rate Limits
```typescript
{
  parallel: true,
  concurrency: 3, // Lower concurrency = fewer rate limit issues
  retries: 5,     // More retries for rate limit recovery
}
```

### 4. Use Timeouts Appropriately
```typescript
{
  timeout: 60000, // Longer timeout for complex queries
  retries: 2,     // Fewer retries to avoid long waits
}
```

## Next Steps

1. **Read the full documentation**: `/packages/ai-evals/src/runners/README.md`
2. **Check examples**: `/packages/ai-evals/src/runners/examples.ts`
3. **Create test datasets**: Start building your test cases
4. **Run evaluations**: Test your AI features
5. **Compare models**: Find the best model for each use case

## Need Help?

- See full examples: `src/runners/examples.ts`
- Read detailed docs: `src/runners/README.md`
- Check tests: `src/runners/__tests__/`
- Review type definitions: `src/types/index.ts`

Happy evaluating! 🚀
