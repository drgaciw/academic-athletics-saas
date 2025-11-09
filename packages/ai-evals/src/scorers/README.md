# AI Evaluation Framework - Scorers

Comprehensive scoring system for evaluating AI outputs across multiple dimensions.

## Overview

The scorers module provides five main types of evaluation:

1. **ExactMatchScorer** - Deep equality checking with diff reporting
2. **SemanticSimilarityScorer** - Embedding-based semantic comparison
3. **LLMJudgeScorer** - LLM-powered quality assessment with rubrics
4. **PrecisionRecallScorer** - Classification metrics (precision, recall, F1)
5. **RecallAtKScorer** - Retrieval quality evaluation for RAG systems

Plus a **Metric Aggregation System** for analyzing results across test suites.

## Quick Start

```typescript
import {
  ExactMatchScorer,
  SemanticSimilarityScorer,
  LLMJudgeScorer,
  f1Scorer,
  recallAtK,
  calculateMetrics,
} from '@aah/ai-evals/scorers';

// Exact match for structured outputs
const exactMatch = new ExactMatchScorer();
const result1 = exactMatch.score(
  { status: 'ELIGIBLE', gpa: 3.5 },
  { status: 'ELIGIBLE', gpa: 3.5 }
);

// Semantic similarity for free-form text
const semantic = new SemanticSimilarityScorer({
  apiKey: process.env.OPENAI_API_KEY!,
  threshold: 0.85,
});
const result2 = await semantic.score(
  'Student is eligible for competition',
  'The student meets all eligibility requirements'
);

// LLM judge for quality assessment
const judge = new LLMJudgeScorer({
  apiKey: process.env.OPENAI_API_KEY!,
  provider: 'openai',
});
const result3 = await judge.score(actualOutput, expectedOutput);

// Classification metrics
const f1 = f1Scorer({ minScore: 0.7 });
const result4 = f1.score([1, 1, 0, 0], [1, 0, 1, 0]);

// RAG retrieval quality
const recall = recallAtK(5, { minRecall: 0.8 });
const result5 = recall.score(
  ['doc1', 'doc2', 'doc3'],
  ['doc1', 'doc2']
);
```

## Scorer Details

### 1. ExactMatchScorer

Perfect for structured outputs, enums, and compliance status validation.

**Use Cases:**
- Compliance status validation (ELIGIBLE, INELIGIBLE)
- Enum classification tasks
- Structured JSON output validation
- Binary yes/no decisions

**Features:**
- Deep equality checking
- Detailed diff reporting
- Configurable comparison (case, whitespace, key order)
- Path ignoring for dynamic fields

**Example:**

```typescript
import { ExactMatchScorer } from '@aah/ai-evals/scorers';

const scorer = new ExactMatchScorer({
  ignoreKeyOrder: true,
  caseInsensitive: false,
  trimWhitespace: true,
  ignorePaths: ['root.metadata.timestamp'],
});

const actual = {
  status: 'ELIGIBLE',
  category: 'CONTINUING',
  violations: [],
  metadata: { timestamp: 1234567890 },
};

const expected = {
  status: 'ELIGIBLE',
  category: 'CONTINUING',
  violations: [],
  metadata: { timestamp: 9999999999 }, // Ignored
};

const result = scorer.score(actual, expected);
// result.score = 1.0
// result.passed = true
// result.reason = "Output matches expected value exactly"
```

**Configuration:**

```typescript
interface ExactMatchScorerConfig {
  ignoreKeyOrder?: boolean;      // Default: true
  caseInsensitive?: boolean;     // Default: false
  trimWhitespace?: boolean;      // Default: true
  ignorePaths?: string[];        // Paths to ignore (supports wildcards)
}
```

### 2. SemanticSimilarityScorer

Evaluates semantic similarity using OpenAI embeddings.

**Use Cases:**
- Paraphrased or rephrased responses
- Conceptual similarity in free-form text
- RAG response quality evaluation
- When exact match is too strict

**Features:**
- OpenAI embedding-based comparison
- Cosine similarity calculation
- Configurable threshold
- Built-in embedding cache

**Example:**

```typescript
import { SemanticSimilarityScorer } from '@aah/ai-evals/scorers';

const scorer = new SemanticSimilarityScorer({
  apiKey: process.env.OPENAI_API_KEY!,
  model: 'text-embedding-3-large',
  threshold: 0.85,
  cacheEmbeddings: true,
});

const actual = 'The student is eligible to compete.';
const expected = 'Student meets eligibility requirements for competition.';

const result = await scorer.score(actual, expected);
// result.score = 0.92 (cosine similarity)
// result.passed = true (>= 0.85 threshold)
```

**Configuration:**

```typescript
interface SemanticSimilarityScorerConfig {
  apiKey: string;                // Required
  model?: string;                // Default: 'text-embedding-3-large'
  threshold?: number;            // Default: 0.8
  cacheEmbeddings?: boolean;     // Default: true
}
```

### 3. LLMJudgeScorer

Uses LLMs to evaluate output quality with customizable rubrics.

**Use Cases:**
- Subjective quality assessment (helpfulness, tone, clarity)
- Nuanced correctness evaluation
- Multi-dimensional quality scoring
- Complex reasoning evaluation

**Features:**
- Customizable evaluation rubrics
- Multi-criteria scoring with weights
- Support for OpenAI and Anthropic
- Structured output for consistency

**Example:**

```typescript
import { LLMJudgeScorer, CommonRubrics } from '@aah/ai-evals/scorers';

const scorer = new LLMJudgeScorer({
  apiKey: process.env.OPENAI_API_KEY!,
  provider: 'openai',
  model: 'gpt-4o',
  rubric: CommonRubrics.conversationQuality(),
  temperature: 0.0,
});

const result = await scorer.score(
  actualResponse,
  expectedResponse,
  { input: userQuery }
);

// result.score = 0.85
// result.breakdown = { Relevance: 0.9, Helpfulness: 0.85, ... }
// result.reason = "Detailed reasoning from LLM"
```

**Custom Rubrics:**

```typescript
const customRubric: EvaluationRubric = {
  criteria: [
    {
      name: 'Accuracy',
      description: 'How accurate is the compliance assessment?',
      weight: 3.0,
      scale: { min: 1, max: 5 },
    },
    {
      name: 'Completeness',
      description: 'Are all relevant rules considered?',
      weight: 2.0,
      scale: { min: 1, max: 5 },
    },
  ],
  instructions: 'Evaluate NCAA compliance accuracy',
  includeReasoning: true,
};
```

**Pre-built Rubrics:**

```typescript
import { CommonRubrics } from '@aah/ai-evals/scorers';

CommonRubrics.factualAccuracy()        // Correctness, Completeness, Precision
CommonRubrics.conversationQuality()    // Relevance, Helpfulness, Engagement, Safety
CommonRubrics.technicalAccuracy()      // Technical Correctness, Clarity, Practicality
```

### 4. PrecisionRecallScorer

Evaluates classification performance with precision, recall, and F1 scores.

**Use Cases:**
- Risk prediction evaluation
- Binary classification tasks
- Multi-class classification
- Eligibility prediction

**Features:**
- Precision, recall, and F1 metrics
- Configurable threshold for probability outputs
- Per-class metrics
- Confusion matrix breakdown

**Example:**

```typescript
import { f1Scorer, precisionScorer, recallScorer } from '@aah/ai-evals/scorers';

// F1 Score
const scorer = f1Scorer({ minScore: 0.7, threshold: 0.5 });

const predictions = [1, 1, 0, 0, 1]; // Risk predictions
const labels = [1, 1, 1, 0, 0];      // Actual outcomes

const result = scorer.score(predictions, labels);
// result.score = 0.67 (F1)
// result.breakdown = {
//   precision: 0.67,
//   recall: 0.67,
//   f1: 0.67,
//   truePositives: 2,
//   falsePositives: 1,
//   falseNegatives: 1,
// }
```

**Input Formats:**

```typescript
// Arrays
scorer.score([1, 1, 0], [1, 0, 1]);

// Booleans
scorer.score([true, false], [true, true]);

// Probabilities with threshold
scorer.score([0.9, 0.3, 0.7], [1, 0, 1]);

// Object format
scorer.score({
  predictions: [1, 1, 0],
  labels: [1, 0, 1],
}, null);
```

### 5. RecallAtKScorer

Evaluates retrieval quality using Recall@K metric.

**Use Cases:**
- RAG retrieval quality evaluation
- Document ranking assessment
- Search result relevance
- Recommendation system evaluation

**Features:**
- Configurable K value
- Multiple K evaluation with RecallAtKSuite
- Flexible input formats
- Document ID extraction

**Example:**

```typescript
import { recallAtK, CommonRecallConfigs } from '@aah/ai-evals/scorers';

// Single K value
const scorer = recallAtK(5, { minRecall: 0.8 });

const retrieved = ['doc1', 'doc2', 'doc3', 'doc4', 'doc5'];
const relevant = ['doc1', 'doc3', 'doc5'];

const result = scorer.score(retrieved, relevant);
// result.score = 1.0 (all 3 relevant docs in top 5)
// result.breakdown = {
//   recall: 1.0,
//   relevantInTopK: 3,
//   totalRelevant: 3,
//   k: 5,
// }

// Multiple K values
import { RecallAtKSuite } from '@aah/ai-evals/scorers';

const suite = new RecallAtKSuite([1, 3, 5, 10]);
const result = suite.score(retrieved, relevant);
// result.breakdown = {
//   'recall@1': 0.33,
//   'recall@3': 0.67,
//   'recall@5': 1.0,
//   'recall@10': 1.0,
// }
```

**Pre-built Configs:**

```typescript
import { CommonRecallConfigs } from '@aah/ai-evals/scorers';

CommonRecallConfigs.rag()             // k=5, minRecall=0.8
CommonRecallConfigs.search()          // k=10, minRecall=0.7
CommonRecallConfigs.recommendation()  // k=3, minRecall=0.9
CommonRecallConfigs.multiLevel()      // k=[1,3,5,10]
```

## Metric Aggregation System

Calculate aggregate metrics across test suites.

**Features:**
- Overall statistics (pass rate, average score, std dev)
- Confidence intervals
- Category-specific breakdowns
- Scorer-specific breakdowns
- Percentile calculations

**Example:**

```typescript
import { calculateMetrics, formatMetricsReport } from '@aah/ai-evals/scorers';
import type { TestCaseResult } from '@aah/ai-evals/scorers';

const results: TestCaseResult[] = [
  {
    id: 'compliance_test_1',
    category: 'compliance',
    scorerResults: [
      {
        scorerName: 'ExactMatch',
        result: { score: 1.0, passed: true },
      },
    ],
    passed: true,
  },
  {
    id: 'rag_test_1',
    category: 'rag',
    scorerResults: [
      {
        scorerName: 'RecallAt5',
        result: { score: 0.8, passed: true },
      },
      {
        scorerName: 'SemanticSimilarity',
        result: { score: 0.85, passed: true },
      },
    ],
    passed: true,
  },
  // ... more results
];

const metrics = calculateMetrics(results);

console.log(`Pass Rate: ${(metrics.passRate * 100).toFixed(1)}%`);
console.log(`Average Score: ${metrics.averageScore.toFixed(3)}`);
console.log(`95% CI: [${metrics.confidenceInterval![0].toFixed(3)}, ${metrics.confidenceInterval![1].toFixed(3)}]`);

// Category breakdown
console.log(metrics.byCategory['compliance']);
// { count: 5, passRate: 0.8, averageScore: 0.85, medianScore: 0.9 }

// Scorer breakdown
console.log(metrics.byScorer['RecallAt5']);
// { count: 10, passRate: 0.9, averageScore: 0.88, medianScore: 0.9 }

// Format as report
const report = formatMetricsReport(metrics);
console.log(report);
```

**Output Formats:**

```typescript
import { metricsToJSON, metricsToCSV } from '@aah/ai-evals/scorers';

// JSON export
const json = metricsToJSON(metrics);
fs.writeFileSync('metrics.json', json);

// CSV export
const csv = metricsToCSV(results);
fs.writeFileSync('results.csv', csv);
```

## Best Practices

### 1. Choosing the Right Scorer

- **ExactMatchScorer**: Use for deterministic, structured outputs (compliance status, classifications)
- **SemanticSimilarityScorer**: Use for free-form text where paraphrasing is acceptable
- **LLMJudgeScorer**: Use for subjective quality assessment or complex reasoning
- **PrecisionRecallScorer**: Use for classification and prediction tasks
- **RecallAtKScorer**: Use for RAG retrieval and ranking evaluation

### 2. Combining Multiple Scorers

```typescript
const testCase = {
  id: 'compliance_check_1',
  category: 'compliance',
  scorerResults: [
    {
      scorerName: 'ExactMatch',
      result: exactMatch.score(output, expected),
    },
    {
      scorerName: 'LLMJudge',
      result: await judge.score(output, expected, { input }),
    },
  ],
  passed: false, // Fails if ANY scorer fails
};
```

### 3. Configuring Thresholds

```typescript
// Strict evaluation (high confidence)
const strictScorer = new SemanticSimilarityScorer({
  apiKey: process.env.OPENAI_API_KEY!,
  threshold: 0.95,
});

// Lenient evaluation (allow variation)
const lenientScorer = new SemanticSimilarityScorer({
  apiKey: process.env.OPENAI_API_KEY!,
  threshold: 0.75,
});
```

### 4. Performance Optimization

```typescript
// Enable embedding caching for repeated evaluations
const scorer = new SemanticSimilarityScorer({
  apiKey: process.env.OPENAI_API_KEY!,
  cacheEmbeddings: true, // Reduces API calls
});

// Batch evaluations to minimize API overhead
const results = await Promise.all(
  testCases.map(tc => scorer.score(tc.output, tc.expected))
);
```

## TypeScript Types

All scorers implement the `Scorer` interface:

```typescript
interface Scorer {
  name: string;
  score(
    output: unknown,
    expected: unknown,
    context?: ScoringContext
  ): Promise<ScorerResult> | ScorerResult;
}

interface ScorerResult {
  score: number;
  passed: boolean;
  reason?: string;
  breakdown?: Record<string, number>;
  metadata?: Record<string, unknown>;
}
```

## Testing

All scorers include comprehensive test coverage:

```bash
# Run all scorer tests
npm test src/scorers/__tests__

# Run specific scorer tests
npm test exact-match.test.ts
npm test precision-recall.test.ts
npm test recall-at-k.test.ts
npm test metrics.test.ts
```

## Examples

See `/packages/ai-evals/examples/scorers/` for complete examples:
- Compliance evaluation pipeline
- RAG quality assessment
- Risk prediction evaluation
- Multi-scorer test suites

## API Reference

Full API documentation available in TypeScript definitions and inline JSDoc comments.
