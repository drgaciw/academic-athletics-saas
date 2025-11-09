# AI Evaluation Framework - Scorers Quick Reference

## Import

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

## ExactMatchScorer

**For**: Structured outputs, enums, compliance status

```typescript
const scorer = new ExactMatchScorer({
  ignoreKeyOrder: true,
  caseInsensitive: false,
  trimWhitespace: true,
  ignorePaths: ['root.metadata.timestamp'],
});

const result = scorer.score(actual, expected);
// result.score: 1.0 or 0.0
// result.passed: boolean
// result.metadata.differences: detailed diff array
```

## SemanticSimilarityScorer

**For**: Free-form text, paraphrasing, conceptual similarity

```typescript
const scorer = new SemanticSimilarityScorer({
  apiKey: process.env.OPENAI_API_KEY!,
  threshold: 0.85,
  cacheEmbeddings: true,
});

const result = await scorer.score(actual, expected);
// result.score: 0.0-1.0 (cosine similarity)
// result.passed: score >= threshold
```

## LLMJudgeScorer

**For**: Subjective quality, multi-dimensional scoring

```typescript
import { LLMJudgeScorer, CommonRubrics } from '@aah/ai-evals';

const scorer = new LLMJudgeScorer({
  apiKey: process.env.OPENAI_API_KEY!,
  provider: 'openai',
  rubric: CommonRubrics.conversationQuality(),
});

const result = await scorer.score(actual, expected, { input: query });
// result.score: 0.0-1.0 (weighted average)
// result.breakdown: { Accuracy: 0.9, Helpfulness: 0.85, ... }
// result.reason: detailed LLM reasoning
```

### Pre-built Rubrics
```typescript
CommonRubrics.factualAccuracy()
CommonRubrics.conversationQuality()
CommonRubrics.technicalAccuracy()
```

## PrecisionRecallScorer

**For**: Classification, risk prediction

```typescript
import { f1Scorer, precisionScorer, recallScorer } from '@aah/ai-evals';

const scorer = f1Scorer({ minScore: 0.7 });

const result = scorer.score(predictions, labels);
// result.score: F1 score (0.0-1.0)
// result.breakdown: { precision, recall, f1, truePositives, ... }
```

### Input Formats
```typescript
// Binary arrays
scorer.score([1, 1, 0], [1, 0, 1]);

// Probabilities (with threshold)
scorer.score([0.9, 0.3, 0.7], [1, 0, 1]);

// Object format
scorer.score({ predictions: [...], labels: [...] }, null);
```

## RecallAtKScorer

**For**: RAG retrieval, document ranking

```typescript
import { recallAtK, CommonRecallConfigs } from '@aah/ai-evals';

const scorer = recallAtK(5, { minRecall: 0.8 });

const result = scorer.score(retrieved, relevant);
// result.score: Recall@K (0.0-1.0)
// result.breakdown: { relevantInTopK, totalRelevant, k }
```

### Pre-built Configs
```typescript
CommonRecallConfigs.rag()             // k=5, minRecall=0.8
CommonRecallConfigs.search()          // k=10, minRecall=0.7
CommonRecallConfigs.recommendation()  // k=3, minRecall=0.9
CommonRecallConfigs.multiLevel()      // k=[1,3,5,10]
```

## Metric Aggregation

**For**: Test suite analysis, reporting

```typescript
import { calculateMetrics, formatMetricsReport } from '@aah/ai-evals';

const results: TestCaseResult[] = [
  {
    id: 'test1',
    category: 'compliance',
    scorerResults: [
      {
        scorerName: 'ExactMatch',
        result: { score: 1.0, passed: true },
      },
    ],
    passed: true,
  },
  // ... more results
];

const metrics = calculateMetrics(results);
// metrics.passRate: overall pass rate
// metrics.averageScore: mean score
// metrics.confidenceInterval: [lower, upper]
// metrics.byCategory: category breakdown
// metrics.byScorer: scorer breakdown

// Print report
console.log(formatMetricsReport(metrics));
```

## Decision Matrix

| Task | Scorer | API Required |
|------|--------|--------------|
| Compliance status validation | ExactMatch | ❌ |
| Enum/classification verification | ExactMatch | ❌ |
| Free-form text comparison | SemanticSimilarity | ✅ OpenAI |
| Response quality assessment | LLMJudge | ✅ OpenAI/Anthropic |
| Risk prediction accuracy | PrecisionRecall (F1) | ❌ |
| RAG retrieval quality | RecallAtK | ❌ |
| Document ranking | RecallAtK | ❌ |

## Common Patterns

### Multi-Scorer Evaluation
```typescript
const testCase = {
  id: 'compliance_1',
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

### Batch Processing
```typescript
const results = await Promise.all(
  testCases.map(tc => scorer.score(tc.output, tc.expected))
);
```

### Custom Thresholds
```typescript
// Strict
const strict = new SemanticSimilarityScorer({ threshold: 0.95 });

// Balanced
const balanced = new SemanticSimilarityScorer({ threshold: 0.85 });

// Lenient
const lenient = new SemanticSimilarityScorer({ threshold: 0.75 });
```

## Environment Setup

```bash
# Required for SemanticSimilarityScorer and LLMJudgeScorer
export OPENAI_API_KEY=sk-...

# Alternative for LLMJudgeScorer (Anthropic)
export ANTHROPIC_API_KEY=sk-ant-...
```

## Example: Complete Test Suite

```typescript
import {
  ExactMatchScorer,
  SemanticSimilarityScorer,
  f1Scorer,
  recallAtK,
  calculateMetrics,
  formatMetricsReport,
} from '@aah/ai-evals';

async function runEvaluation() {
  const exactMatch = new ExactMatchScorer();
  const semantic = new SemanticSimilarityScorer({
    apiKey: process.env.OPENAI_API_KEY!,
  });
  const f1 = f1Scorer();
  const recall = recallAtK(5);

  const results = [];

  // Compliance test
  results.push({
    id: 'compliance_1',
    category: 'compliance',
    scorerResults: [
      {
        scorerName: 'ExactMatch',
        result: exactMatch.score(complianceOutput, expected),
      },
    ],
    passed: true,
  });

  // RAG test
  results.push({
    id: 'rag_1',
    category: 'rag',
    scorerResults: [
      {
        scorerName: 'RecallAt5',
        result: recall.score(retrieved, relevant),
      },
      {
        scorerName: 'Semantic',
        result: await semantic.score(ragOutput, expected),
      },
    ],
    passed: true,
  });

  // Calculate and display metrics
  const metrics = calculateMetrics(results);
  console.log(formatMetricsReport(metrics));
}
```

## Testing

```bash
# Run all scorer tests
npm test src/scorers/__tests__

# Run specific tests
npm test exact-match.test.ts
npm test precision-recall.test.ts
npm test recall-at-k.test.ts
npm test metrics.test.ts
```

## Full Documentation

- **Main README**: `/packages/ai-evals/src/scorers/README.md`
- **Examples**: `/packages/ai-evals/examples/scorers-usage.ts`
- **Implementation Details**: `/packages/ai-evals/SCORERS_IMPLEMENTATION.md`
