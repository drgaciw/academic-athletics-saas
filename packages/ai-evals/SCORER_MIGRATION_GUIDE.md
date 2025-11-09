# Scorer Migration Guide

## Overview

This guide helps you migrate from basic scoring implementations to the comprehensive AI Evaluation Framework scorers.

## Migration Path

### From Simple Equality Checks → ExactMatchScorer

**Before**:
```typescript
function checkEqual(actual: any, expected: any): boolean {
  return JSON.stringify(actual) === JSON.stringify(expected);
}
```

**After**:
```typescript
import { ExactMatchScorer } from '@aah/ai-evals';

const scorer = new ExactMatchScorer({
  ignoreKeyOrder: true,
  ignorePaths: ['metadata.timestamp'],
});

const result = scorer.score(actual, expected);
// result.score: 1.0 or 0.0
// result.passed: boolean
// result.metadata.differences: detailed diff
```

**Benefits**:
- Detailed diff reporting with paths
- Configurable comparison options
- Ignore dynamic fields (timestamps, IDs)
- Better error messages

---

### From Manual String Comparison → SemanticSimilarityScorer

**Before**:
```typescript
function checkSimilarity(actual: string, expected: string): boolean {
  return actual.toLowerCase().includes(expected.toLowerCase());
}
```

**After**:
```typescript
import { SemanticSimilarityScorer } from '@aah/ai-evals';

const scorer = new SemanticSimilarityScorer({
  apiKey: process.env.OPENAI_API_KEY!,
  threshold: 0.85,
});

const result = await scorer.score(actual, expected);
// result.score: cosine similarity (0-1)
// result.passed: score >= threshold
```

**Benefits**:
- True semantic understanding
- Handles paraphrasing
- Configurable threshold
- Built-in caching

---

### From Manual Accuracy Calculation → PrecisionRecallScorer

**Before**:
```typescript
function calculateAccuracy(predictions: number[], labels: number[]): number {
  let correct = 0;
  for (let i = 0; i < predictions.length; i++) {
    if (predictions[i] === labels[i]) correct++;
  }
  return correct / predictions.length;
}
```

**After**:
```typescript
import { f1Scorer } from '@aah/ai-evals';

const scorer = f1Scorer({ minScore: 0.7 });

const result = scorer.score(predictions, labels);
// result.score: F1 score
// result.breakdown: { precision, recall, f1, truePositives, ... }
// result.passed: F1 >= minScore
```

**Benefits**:
- Precision, recall, and F1 metrics
- Confusion matrix breakdown
- Configurable threshold
- Multiple input formats

---

### From Manual Top-K Checking → RecallAtKScorer

**Before**:
```typescript
function checkTopK(retrieved: string[], relevant: string[], k: number): boolean {
  const topK = retrieved.slice(0, k);
  const found = relevant.filter(r => topK.includes(r)).length;
  return found / relevant.length >= 0.8;
}
```

**After**:
```typescript
import { recallAtK } from '@aah/ai-evals';

const scorer = recallAtK(5, { minRecall: 0.8 });

const result = scorer.score(retrieved, relevant);
// result.score: Recall@K
// result.breakdown: { relevantInTopK, totalRelevant, k }
// result.metadata.missedDocuments: docs not in top-K
```

**Benefits**:
- Standard Recall@K metric
- Multiple K evaluation with suite
- Missed document reporting
- Pre-built configurations

---

### From Custom Test Aggregation → Metric Aggregation System

**Before**:
```typescript
function aggregateResults(results: any[]): any {
  const passed = results.filter(r => r.passed).length;
  const passRate = passed / results.length;
  const avgScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;

  return { passed, passRate, avgScore };
}
```

**After**:
```typescript
import { calculateMetrics, formatMetricsReport } from '@aah/ai-evals';

const metrics = calculateMetrics(results);
// metrics.totalCases
// metrics.passRate
// metrics.averageScore
// metrics.confidenceInterval
// metrics.byCategory
// metrics.byScorer
// metrics.customMetrics (percentiles, etc.)

console.log(formatMetricsReport(metrics));
```

**Benefits**:
- Comprehensive statistics
- Category/scorer breakdowns
- Confidence intervals
- Percentile calculations
- Multiple export formats

---

## Common Migration Patterns

### Pattern 1: Single Scorer to Multi-Scorer

**Before**:
```typescript
const result = exactMatchCheck(output, expected);
```

**After**:
```typescript
const testCase = {
  id: 'test_1',
  scorerResults: [
    {
      scorerName: 'ExactMatch',
      result: exactMatch.score(output, expected),
    },
    {
      scorerName: 'Semantic',
      result: await semantic.score(output, expected),
    },
  ],
  passed: false, // Fails if ANY scorer fails
};
```

### Pattern 2: Basic Stats to Comprehensive Metrics

**Before**:
```typescript
const stats = {
  total: results.length,
  passed: results.filter(r => r.passed).length,
};
```

**After**:
```typescript
const metrics = calculateMetrics(results);
// Access comprehensive stats:
// - metrics.passRate
// - metrics.averageScore
// - metrics.confidenceInterval
// - metrics.byCategory
// - metrics.customMetrics.p95
```

### Pattern 3: Manual Threshold to Configured Scorer

**Before**:
```typescript
const similarity = calculateSimilarity(a, b);
const passed = similarity > 0.8;
```

**After**:
```typescript
const scorer = new SemanticSimilarityScorer({
  apiKey: process.env.OPENAI_API_KEY!,
  threshold: 0.8,
});

const result = await scorer.score(a, b);
// result.passed automatically determined
```

---

## Feature Mapping

| Old Approach | New Scorer | Key Benefit |
|--------------|-----------|-------------|
| `JSON.stringify() ===` | ExactMatchScorer | Detailed diffs, config options |
| String `.includes()` | SemanticSimilarityScorer | True semantic understanding |
| Manual accuracy calc | PrecisionRecallScorer | Full classification metrics |
| Custom top-K check | RecallAtKScorer | Standard metric, reporting |
| Simple averaging | Metric Aggregation | Statistics, CI, breakdowns |

---

## Step-by-Step Migration

### Step 1: Install and Import

```typescript
import {
  ExactMatchScorer,
  SemanticSimilarityScorer,
  LLMJudgeScorer,
  f1Scorer,
  recallAtK,
  calculateMetrics,
} from '@aah/ai-evals';
```

### Step 2: Replace Simple Checks

**Find**:
```typescript
if (actual === expected) {
  // pass
}
```

**Replace**:
```typescript
const scorer = new ExactMatchScorer();
const result = scorer.score(actual, expected);
if (result.passed) {
  // pass
}
```

### Step 3: Add Detailed Scoring

**Find**:
```typescript
const passed = checkCondition(output);
results.push({ passed, score: passed ? 1 : 0 });
```

**Replace**:
```typescript
const result = scorer.score(output, expected);
results.push({
  id: 'test_1',
  scorerResults: [
    {
      scorerName: 'ExactMatch',
      result,
    },
  ],
  passed: result.passed,
});
```

### Step 4: Use Metric Aggregation

**Find**:
```typescript
const passRate = results.filter(r => r.passed).length / results.length;
console.log(`Pass Rate: ${passRate}`);
```

**Replace**:
```typescript
const metrics = calculateMetrics(results);
console.log(formatMetricsReport(metrics));
// Or access specific metrics:
console.log(`Pass Rate: ${metrics.passRate}`);
console.log(`Average Score: ${metrics.averageScore}`);
console.log(`95% CI: [${metrics.confidenceInterval![0]}, ${metrics.confidenceInterval![1]}]`);
```

---

## Configuration Migration

### Environment Variables

**Add to `.env`**:
```bash
# For SemanticSimilarityScorer and LLMJudgeScorer
OPENAI_API_KEY=sk-...

# Alternative for LLMJudgeScorer
ANTHROPIC_API_KEY=sk-ant-...
```

### TypeScript Configuration

No changes needed. All scorers are fully typed.

---

## Testing Migration

### Before: Manual Test Cases

```typescript
describe('Compliance Tests', () => {
  it('should pass for eligible status', () => {
    const result = checkEligibility({ gpa: 3.5 });
    expect(result.status).toBe('ELIGIBLE');
  });
});
```

### After: Scorer-Based Tests

```typescript
import { ExactMatchScorer } from '@aah/ai-evals';

describe('Compliance Tests', () => {
  const scorer = new ExactMatchScorer();

  it('should pass for eligible status', () => {
    const actual = checkEligibility({ gpa: 3.5 });
    const expected = { status: 'ELIGIBLE', violations: [] };

    const result = scorer.score(actual, expected);
    expect(result.passed).toBe(true);
    expect(result.score).toBe(1.0);
  });
});
```

---

## Performance Considerations

### Before Migration
- Basic equality: O(1) - 0ms
- String comparison: O(n) - <1ms
- No caching

### After Migration
- ExactMatchScorer: O(n) - <5ms (deep comparison)
- SemanticSimilarityScorer: ~100ms first call, ~5ms cached
- LLMJudgeScorer: ~1-3 seconds per evaluation
- PrecisionRecallScorer: O(n) - <1ms
- RecallAtKScorer: O(k) - <1ms

### Optimization Tips

1. **Enable Caching**:
```typescript
const scorer = new SemanticSimilarityScorer({
  apiKey: process.env.OPENAI_API_KEY!,
  cacheEmbeddings: true, // 80% hit rate reduction
});
```

2. **Batch Processing**:
```typescript
const results = await Promise.all(
  testCases.map(tc => scorer.score(tc.output, tc.expected))
);
```

3. **Use Appropriate Scorer**:
- ExactMatch for structured data (fastest)
- Semantic for free-form text (moderate)
- LLMJudge only when necessary (slowest)

---

## Troubleshooting

### Issue: "API key required"

**Solution**: Set environment variables
```bash
export OPENAI_API_KEY=sk-...
```

### Issue: "Embedding cache too large"

**Solution**: Disable cache or clear periodically
```typescript
scorer.clearCache();
// or
const scorer = new SemanticSimilarityScorer({
  apiKey: process.env.OPENAI_API_KEY!,
  cacheEmbeddings: false,
});
```

### Issue: "LLM evaluation timeout"

**Solution**: Use faster model or increase timeout
```typescript
const scorer = new LLMJudgeScorer({
  apiKey: process.env.OPENAI_API_KEY!,
  model: 'gpt-4o-mini', // Faster, cheaper
});
```

---

## Checklist

- [ ] Install `@aah/ai-evals` package
- [ ] Add environment variables (if using Semantic/LLM scorers)
- [ ] Replace simple equality checks with ExactMatchScorer
- [ ] Replace string comparisons with SemanticSimilarityScorer
- [ ] Replace accuracy calculations with PrecisionRecallScorer
- [ ] Replace top-K checks with RecallAtKScorer
- [ ] Update test aggregation with calculateMetrics
- [ ] Enable embedding cache for performance
- [ ] Update test cases to use scorers
- [ ] Review and optimize scorer selection

---

## Support

For questions or issues:
- Documentation: `/packages/ai-evals/src/scorers/README.md`
- Examples: `/packages/ai-evals/examples/scorers-usage.ts`
- Quick Reference: `/packages/ai-evals/SCORERS_QUICK_REFERENCE.md`
