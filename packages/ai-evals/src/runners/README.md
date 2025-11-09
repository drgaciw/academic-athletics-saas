# AI Evaluation Runners

This module provides the execution layer for the AI Evaluation Framework. Runners execute test cases against AI models and collect comprehensive performance metrics.

## Overview

The runner system is built on three main components:

1. **BaseRunner** - Abstract base class with common execution logic
2. **Specialized Runners** - Feature-specific implementations for each AI use case
3. **Model Comparison** - Utilities for comparing multiple models side-by-side

## Architecture

### BaseRunner

The `BaseRunner` abstract class provides:

- **Model-agnostic execution** using Vercel AI SDK
- **Retry logic** with exponential backoff
- **Timeout handling** for long-running requests
- **Token usage tracking** for cost analysis
- **Latency measurement** for performance monitoring
- **Error handling** with graceful degradation
- **Parallel execution** support with concurrency control

### Specialized Runners

Each AI feature has a dedicated runner implementation:

#### ComplianceRunner
Tests NCAA eligibility checking with structured output validation.

```typescript
import { ComplianceRunner } from './runners';

const runner = new ComplianceRunner();
const result = await runner.runTestCase(testCase, {
  modelId: 'gpt-4',
  temperature: 0.1,
  maxTokens: 1000,
});
```

#### ConversationalRunner
Tests chat response quality including accuracy, tone, and citations.

```typescript
import { ConversationalRunner } from './runners';

const runner = new ConversationalRunner();
const results = await runner.runDataset(testCases, {
  modelId: 'claude-sonnet-4',
  temperature: 0.7,
});
```

#### AdvisingRunner
Tests course recommendation quality with conflict detection.

```typescript
import { AdvisingRunner } from './runners';

const runner = new AdvisingRunner();
const results = await runner.runDataset(testCases, config, {
  parallel: true,
  concurrency: 3,
});
```

#### RiskPredictionRunner
Tests academic risk prediction accuracy and factor analysis.

```typescript
import { RiskPredictionRunner } from './runners';

const runner = new RiskPredictionRunner();
const result = await runner.runTestCase(testCase, config);
```

#### RAGRunner
Tests retrieval-augmented generation quality including retrieval accuracy and answer quality.

```typescript
import { RAGRunner } from './runners';

const runner = new RAGRunner();
const results = await runner.runDataset(testCases, config);
```

## Model Comparison

### Sequential Comparison

Run each model on all test cases sequentially (one model at a time):

```typescript
import { runModelComparison } from './runners';
import { AdvisingRunner } from './runners';

const runner = new AdvisingRunner();
const configs = [
  { modelId: 'gpt-4', temperature: 0.3 },
  { modelId: 'claude-sonnet-4', temperature: 0.3 },
  { modelId: 'gpt-4-turbo', temperature: 0.3 },
];

const report = await runModelComparison(runner, testCases, configs, {
  parallel: true, // Parallelize test cases within each model
  concurrency: 5,
  scorerConfig: { strategy: 'exact' },
});

console.log(formatComparisonReport(report));
```

### Parallel Comparison

Run all models simultaneously for each test case:

```typescript
import { runParallelComparison } from './runners';

const report = await runParallelComparison(runner, testCases, configs, {
  scorerConfig: {
    strategy: 'custom',
    customScorer: async (expected, actual) => ({
      passed: expected.eligible === actual.eligible,
      score: expected.eligible === actual.eligible ? 1.0 : 0.0,
    }),
  },
});
```

### Comparison Report

The comparison report includes:

- **Summary metrics** for each model (avg score, win rate, latency, cost)
- **Detailed results** for each test case
- **Winner determination** based on scoring
- **Cost and performance analysis**

```typescript
{
  datasetId: 'dataset_123',
  comparisonId: 'comparison_456',
  configs: [...],
  results: [
    {
      testCaseId: 'test-001',
      winner: 'gpt-4',
      models: {
        'gpt-4': { result: {...}, score: {...} },
        'claude-sonnet-4': { result: {...}, score: {...} }
      },
      metrics: {
        'gpt-4': { latency: 1234, cost: 0.003, score: 0.95 },
        'claude-sonnet-4': { latency: 987, cost: 0.002, score: 0.90 }
      }
    }
  ],
  summary: {
    'gpt-4': {
      avgLatency: 1234,
      totalCost: 0.015,
      avgScore: 0.93,
      winRate: 60.0
    },
    'claude-sonnet-4': {
      avgLatency: 987,
      totalCost: 0.010,
      avgScore: 0.88,
      winRate: 40.0
    }
  }
}
```

## Configuration Options

### RunnerConfig

```typescript
interface RunnerConfig {
  modelId: string;          // 'gpt-4', 'claude-sonnet-4', etc.
  temperature?: number;     // 0.0 - 2.0 (default: 0.7)
  maxTokens?: number;       // Max completion tokens (default: 2000)
  timeout?: number;         // Timeout in ms (default: 30000)
  retries?: number;         // Max retry attempts (default: 3)
  additionalParams?: {...}; // Provider-specific parameters
}
```

### Execution Options

```typescript
interface ExecutionOptions {
  parallel?: boolean;       // Run test cases in parallel (default: false)
  concurrency?: number;     // Max concurrent executions (default: 5)
  onProgress?: (completed: number, total: number) => void;
}
```

## Performance Tracking

### Metrics Collected

For each test case execution, runners collect:

- **Latency**: Time from request to response (milliseconds)
- **Token Usage**: Prompt tokens, completion tokens, total tokens
- **Cost**: Calculated based on model pricing (USD)
- **Timestamp**: When the test was executed
- **Error**: Error message if execution failed

### Cost Calculation

Costs are calculated based on current model pricing:

```typescript
const MODEL_PRICING = {
  'gpt-4': { input: 0.03, output: 0.06 },           // per 1K tokens
  'gpt-4-turbo': { input: 0.01, output: 0.03 },
  'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
  'claude-opus-4': { input: 0.015, output: 0.075 },
  'claude-sonnet-4': { input: 0.003, output: 0.015 },
  'claude-haiku-4': { input: 0.00025, output: 0.00125 },
};
```

## Error Handling

### Retry Logic

Automatic retry with exponential backoff for:
- Rate limit errors (429)
- Timeout errors
- Network errors (ECONNRESET, ETIMEDOUT)
- Server errors (500, 502, 503, 504)

### Timeout Handling

Each test case execution has a configurable timeout (default: 30 seconds). If exceeded, the execution is cancelled and marked as failed.

### Graceful Degradation

- Failed test cases return partial results with error information
- Dataset execution continues even if individual tests fail
- Error details are included in the result metadata

## Best Practices

### 1. Choose the Right Execution Mode

**Sequential** (parallel: false)
- Use when rate limits are a concern
- Use for debugging individual test cases
- Better for cost control

**Parallel** (parallel: true)
- Use for faster evaluation on large datasets
- Configure concurrency to respect rate limits
- Monitor costs closely

### 2. Configure Appropriate Timeouts

```typescript
const config: RunnerConfig = {
  modelId: 'gpt-4',
  timeout: 60000, // 60 seconds for complex tasks
};
```

### 3. Use Temperature Appropriately

- **Low temperature (0.0-0.3)**: For deterministic tasks (compliance, structured output)
- **Medium temperature (0.4-0.7)**: For conversational tasks
- **High temperature (0.8-1.0)**: For creative tasks (not recommended for evals)

### 4. Monitor Costs

```typescript
const results = await runner.runDataset(testCases, config);
const totalCost = results.reduce((sum, r) => sum + r.metadata.cost, 0);
console.log(`Total cost: $${totalCost.toFixed(4)}`);
```

### 5. Track Progress

```typescript
const results = await runner.runDataset(testCases, config, {
  onProgress: (completed, total) => {
    const percentage = (completed / total * 100).toFixed(1);
    console.log(`Progress: ${completed}/${total} (${percentage}%)`);
  },
});
```

## Examples

See [`examples.ts`](./examples.ts) for comprehensive usage examples including:

1. Single test case execution
2. Dataset evaluation
3. Model comparison
4. Parallel comparison
5. RAG evaluation with custom metrics
6. Batch evaluation with error handling

## Extending the Runners

To create a custom runner for a new AI feature:

```typescript
import { z } from 'zod';
import { BaseRunner } from './base-runner';

interface CustomInput {
  // Your input type
}

interface CustomOutput {
  // Your output type
}

export class CustomRunner extends BaseRunner<CustomInput, CustomOutput> {
  protected preparePrompt(input: CustomInput): string {
    // Create the prompt for the model
    return `Your prompt here: ${JSON.stringify(input)}`;
  }

  protected getOutputSchema(): z.ZodSchema<CustomOutput> {
    // Define the output schema for structured generation
    return z.object({
      field1: z.string(),
      field2: z.number(),
    });
  }

  protected parseOutput(output: string): CustomOutput {
    // Only needed if not using structured output
    // Parse text output into structured format
    return JSON.parse(output);
  }
}
```

## Integration with Scorers

Runners can be combined with scorers for automated evaluation:

```typescript
import { runModelComparison } from './runners';
import { ComplianceRunner } from './runners';

const report = await runModelComparison(runner, testCases, configs, {
  scorerConfig: {
    strategy: 'exact', // or 'semantic', 'llm-judge', 'custom'
    threshold: 0.8,
  },
});
```

## Troubleshooting

### Rate Limiting

If you hit rate limits:
1. Reduce `concurrency` in execution options
2. Increase `timeout` to allow for retry delays
3. Use sequential execution mode

### High Costs

To reduce costs:
1. Use cheaper models for initial testing (gpt-3.5-turbo, claude-haiku-4)
2. Reduce `maxTokens` where possible
3. Use smaller test datasets during development
4. Monitor costs with progress callbacks

### Timeouts

If tests frequently timeout:
1. Increase `timeout` in runner config
2. Reduce `maxTokens` to speed up generation
3. Simplify prompts where possible
4. Check network connectivity

### Inconsistent Results

To improve consistency:
1. Lower temperature (0.0-0.3)
2. Use deterministic models when available
3. Add more specific instructions in prompts
4. Increase test case diversity

## Related Documentation

- [Types Documentation](../types/README.md) - Type definitions
- [Scorers Documentation](../scorers/README.md) - Scoring strategies
- [Dataset Documentation](../datasets/README.md) - Dataset management
- [Examples](./examples.ts) - Code examples
