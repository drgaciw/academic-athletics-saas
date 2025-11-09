# Design Document

## Overview

The AI Evaluation Framework provides a comprehensive testing infrastructure for all AI-powered features in the Athletic Academics Hub platform. The system follows the three-component architecture outlined in Vercel's evals guide: datasets (test cases), runners (execution layer), and scorers (grading mechanisms). The framework integrates with the existing Turborepo monorepo structure, leverages the Vercel AI SDK for model-agnostic testing, and connects to CI/CD pipelines for automated regression detection.

The design prioritizes flexibility (easy model swapping), maintainability (clear separation of concerns), and actionability (detailed failure reports). By implementing this framework, the platform can confidently iterate on AI features while maintaining high quality standards for student-athlete support.

## Architecture

### High-Level System Design

```
┌─────────────────────────────────────────────────────────────┐
│                     CI/CD Pipeline                          │
│  (GitHub Actions triggers eval runs on PR/push)             │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  Eval Orchestrator                          │
│  - Selects test suites based on code changes                │
│  - Manages parallel execution                               │
│  - Aggregates results and generates reports                 │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        ▼            ▼            ▼
   ┌─────────┐  ┌─────────┐  ┌─────────┐
   │ Dataset │  │ Runner  │  │ Scorer  │
   │ Manager │  │ Engine  │  │ Engine  │
   └─────────┘  └─────────┘  └─────────┘
        │            │            │
        │            ▼            │
        │    ┌──────────────┐    │
        │    │  AI Services │    │
        │    │  - OpenAI    │    │
        │    │  - Anthropic │    │
        │    │  - Local     │    │
        │    └──────────────┘    │
        │                        │
        └────────────┬───────────┘
                     ▼
        ┌────────────────────────┐
        │   Results Database     │
        │   (Vercel Postgres)    │
        └────────────────────────┘
                     │
                     ▼
        ┌────────────────────────┐
        │  Reporting Dashboard   │
        │  (Next.js Admin UI)    │
        └────────────────────────┘
```

### Component Interaction Flow

1. **Trigger**: Code changes or manual invocation trigger eval runs
2. **Orchestration**: Orchestrator selects relevant test suites and configures execution
3. **Dataset Loading**: Dataset Manager loads test cases with inputs and expected outputs
4. **Execution**: Runner Engine feeds inputs to AI services and collects outputs
5. **Scoring**: Scorer Engine evaluates outputs against expected results
6. **Storage**: Results are persisted to database with full context
7. **Reporting**: Dashboard displays results, trends, and failure analysis

## Components and Interfaces

### 1. Dataset Manager

**Purpose**: Manages test case collections with versioning and metadata

**Location**: `packages/ai-evals/src/datasets/`

**Core Types**:

```typescript
interface TestCase<TInput = any, TOutput = any> {
  id: string;
  input: TInput;
  expected: TOutput;
  metadata: {
    difficulty: 'easy' | 'medium' | 'hard';
    category: string;
    tags: string[];
    createdAt: Date;
    source: 'production' | 'synthetic' | 'edge-case';
  };
}

interface Dataset<TInput = any, TOutput = any> {
  id: string;
  name: string;
  description: string;
  version: string;
  testCases: TestCase<TInput, TOutput>[];
  schema: {
    input: z.ZodSchema<TInput>;
    output: z.ZodSchema<TOutput>;
  };
}
```

**Key Methods**:

- `loadDataset(id: string): Promise<Dataset>` - Load dataset by ID
- `createDataset(config: DatasetConfig): Promise<Dataset>` - Create new dataset
- `addTestCase(datasetId: string, testCase: TestCase): Promise<void>` - Add test case
- `validateDataset(dataset: Dataset): ValidationResult` - Validate schema compliance
- `exportDataset(datasetId: string, format: 'json' | 'csv'): Promise<string>` - Export dataset

**Dataset Organization**:

```
packages/ai-evals/datasets/
├── compliance/
│   ├── eligibility-checks.json
│   ├── gpa-calculations.json
│   └── progress-toward-degree.json
├── advising/
│   ├── course-recommendations.json
│   ├── schedule-conflicts.json
│   └── prerequisite-chains.json
├── conversational/
│   ├── general-queries.json
│   ├── policy-questions.json
│   └── edge-cases.json
├── risk-prediction/
│   ├── historical-outcomes.json
│   └── feature-importance.json
└── rag/
    ├── retrieval-quality.json
    └── answer-accuracy.json
```

### 2. Runner Engine

**Purpose**: Executes test cases against AI systems in a model-agnostic way

**Location**: `packages/ai-evals/src/runners/`

**Core Types**:

```typescript
interface RunnerConfig {
  modelId: string; // e.g., 'openai/gpt-4', 'anthropic/claude-sonnet-4'
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
  retries?: number;
}

interface RunResult<TOutput = any> {
  testCaseId: string;
  input: any;
  expected: TOutput;
  actual: TOutput;
  metadata: {
    modelId: string;
    latency: number;
    tokenUsage: {
      prompt: number;
      completion: number;
      total: number;
    };
    cost: number;
    timestamp: Date;
  };
}

interface RunSummary {
  datasetId: string;
  runId: string;
  config: RunnerConfig;
  results: RunResult[];
  startTime: Date;
  endTime: Date;
  totalDuration: number;
}
```

**Key Methods**:

- `runEval(dataset: Dataset, config: RunnerConfig): Promise<RunSummary>` - Execute full dataset
- `runTestCase(testCase: TestCase, config: RunnerConfig): Promise<RunResult>` - Execute single test
- `runComparison(dataset: Dataset, configs: RunnerConfig[]): Promise<ComparisonReport>` - Compare models

**Runner Implementations**:

- `ComplianceRunner` - Tests NCAA compliance checking
- `AdvisingRunner` - Tests course recommendation logic
- `ConversationalRunner` - Tests chat responses
- `RiskPredictionRunner` - Tests risk scoring
- `RAGRunner` - Tests retrieval and answer generation

### 3. Scorer Engine

**Purpose**: Evaluates output quality using multiple grading strategies

**Location**: `packages/ai-evals/src/scorers/`

**Core Types**:

```typescript
interface ScorerConfig {
  strategy: 'exact' | 'semantic' | 'llm-judge' | 'custom';
  threshold?: number;
  judgeModelId?: string; // For LLM-as-judge
  customScorer?: (expected: any, actual: any) => Promise<Score>;
}

interface Score {
  passed: boolean;
  score: number; // 0.0 to 1.0
  confidence?: number;
  explanation?: string;
  breakdown?: Record<string, number>;
}

interface ScoringResult {
  testCaseId: string;
  score: Score;
  scorerConfig: ScorerConfig;
}
```

**Scoring Strategies**:

1. **Exact Match Scorer**
   - Use case: Structured outputs (JSON, enums, classifications)
   - Implementation: Deep equality check
   - Example: NCAA eligibility status (eligible/ineligible/review)

2. **Semantic Similarity Scorer**
   - Use case: Natural language responses where wording varies
   - Implementation: Embedding-based cosine similarity
   - Example: Conversational AI responses

3. **LLM-as-Judge Scorer**
   - Use case: Complex quality assessment (helpfulness, tone, accuracy)
   - Implementation: Prompt another LLM to grade on rubric
   - Example: Advising recommendation quality

4. **Custom Scorer**
   - Use case: Domain-specific metrics
   - Implementation: User-defined scoring function
   - Example: Risk prediction precision/recall

**Key Methods**:

- `scoreResult(result: RunResult, config: ScorerConfig): Promise<ScoringResult>` - Score single result
- `scoreResults(results: RunResult[], config: ScorerConfig): Promise<ScoringResult[]>` - Batch scoring
- `calculateMetrics(scoringResults: ScoringResult[]): Metrics` - Aggregate metrics

### 4. Eval Orchestrator

**Purpose**: Coordinates eval execution, manages parallelization, generates reports

**Location**: `packages/ai-evals/src/orchestrator/`

**Core Types**:

```typescript
interface EvalJob {
  id: string;
  datasetIds: string[];
  runnerConfigs: RunnerConfig[];
  scorerConfig: ScorerConfig;
  baseline?: string; // Baseline run ID for comparison
  parallel?: boolean;
}

interface EvalReport {
  jobId: string;
  summary: {
    totalTests: number;
    passed: number;
    failed: number;
    accuracy: number;
    avgLatency: number;
    totalCost: number;
  };
  runSummaries: RunSummary[];
  scoringResults: ScoringResult[];
  regressions: Regression[];
  recommendations: string[];
}

interface Regression {
  testCaseId: string;
  metric: string;
  baseline: number;
  current: number;
  percentChange: number;
  severity: 'critical' | 'major' | 'minor';
}
```

**Key Methods**:

- `createJob(config: EvalJob): Promise<string>` - Create eval job
- `executeJob(jobId: string): Promise<EvalReport>` - Execute job
- `compareToBaseline(runId: string, baselineId: string): Promise<ComparisonReport>` - Detect regressions
- `generateReport(jobId: string): Promise<EvalReport>` - Generate comprehensive report

### 5. Results Database Schema

**Purpose**: Persist eval results for historical analysis and trend tracking

**Location**: `packages/database/prisma/schema.prisma`

**Schema**:

```prisma
model EvalRun {
  id            String   @id @default(cuid())
  datasetId     String
  datasetVersion String
  modelId       String
  config        Json
  startTime     DateTime
  endTime       DateTime
  status        String   // 'running' | 'completed' | 'failed'
  
  results       EvalResult[]
  metrics       EvalMetrics?
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model EvalResult {
  id            String   @id @default(cuid())
  runId         String
  testCaseId    String
  input         Json
  expected      Json
  actual        Json
  passed        Boolean
  score         Float
  latency       Int
  tokenUsage    Json
  cost          Float
  
  run           EvalRun  @relation(fields: [runId], references: [id])
  
  createdAt     DateTime @default(now())
}

model EvalMetrics {
  id            String   @id @default(cuid())
  runId         String   @unique
  accuracy      Float
  avgLatency    Float
  totalCost     Float
  passRate      Float
  breakdown     Json     // Category-specific metrics
  
  run           EvalRun  @relation(fields: [runId], references: [id])
  
  createdAt     DateTime @default(now())
}

model EvalBaseline {
  id            String   @id @default(cuid())
  name          String
  description   String
  runId         String
  isActive      Boolean  @default(false)
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

### 6. Reporting Dashboard

**Purpose**: Visualize eval results, trends, and regressions

**Location**: `apps/web/app/admin/evals/`

**Key Views**:

1. **Overview Dashboard**
   - Recent eval runs with pass/fail status
   - Trend charts for accuracy over time
   - Cost and latency metrics
   - Active regressions alert

2. **Run Details**
   - Individual test case results
   - Failed test case analysis
   - Model comparison view
   - Export results

3. **Dataset Management**
   - Browse and edit datasets
   - Add new test cases
   - Version history
   - Import/export

4. **Baseline Management**
   - Set active baselines
   - Compare runs to baseline
   - Regression threshold configuration

## Data Models

### Test Case Examples

**NCAA Compliance Test Case**:

```json
{
  "id": "compliance-001",
  "input": {
    "studentId": "SA12345",
    "gpa": 2.8,
    "creditHours": 24,
    "progressTowardDegree": 0.35,
    "semester": "fall-2025"
  },
  "expected": {
    "eligible": true,
    "issues": [],
    "recommendations": []
  },
  "metadata": {
    "difficulty": "easy",
    "category": "gpa-check",
    "tags": ["ncaa", "eligibility", "gpa"],
    "createdAt": "2025-01-15T00:00:00Z",
    "source": "synthetic"
  }
}
```

**Conversational AI Test Case**:

```json
{
  "id": "chat-001",
  "input": {
    "message": "What are the NCAA GPA requirements for freshman eligibility?",
    "context": {
      "userId": "user123",
      "role": "student-athlete"
    }
  },
  "expected": {
    "answer": "NCAA Division I requires incoming freshmen to have a minimum 2.3 GPA in core courses. The specific GPA requirement depends on your SAT/ACT scores using the sliding scale.",
    "citations": ["ncaa-manual-14.3"],
    "tone": "helpful",
    "followUpSuggestions": [
      "What are core courses?",
      "How does the sliding scale work?"
    ]
  },
  "metadata": {
    "difficulty": "medium",
    "category": "policy-question",
    "tags": ["ncaa", "eligibility", "gpa", "freshman"],
    "createdAt": "2025-01-15T00:00:00Z",
    "source": "production"
  }
}
```

**Advising Test Case**:

```json
{
  "id": "advising-001",
  "input": {
    "studentId": "SA12345",
    "major": "Business Administration",
    "completedCourses": ["ECON101", "MATH110"],
    "semester": "spring-2026",
    "athleticSchedule": {
      "practices": ["MWF 2-5pm"],
      "games": ["Sat 1pm"]
    }
  },
  "expected": {
    "recommendations": [
      {
        "courseId": "ECON201",
        "reason": "Required for major, prerequisite satisfied",
        "conflicts": []
      },
      {
        "courseId": "ACCT101",
        "reason": "Core business requirement",
        "conflicts": []
      }
    ],
    "warnings": [
      "MGMT301 conflicts with practice schedule"
    ]
  },
  "metadata": {
    "difficulty": "hard",
    "category": "schedule-conflict",
    "tags": ["advising", "scheduling", "athletics"],
    "createdAt": "2025-01-15T00:00:00Z",
    "source": "edge-case"
  }
}
```

## Error Handling

### Failure Categories

1. **Test Execution Failures**
   - Timeout: Test exceeds configured time limit
   - API Error: Model provider returns error
   - Network Error: Connection issues
   - Rate Limit: Provider rate limit exceeded

2. **Scoring Failures**
   - Schema Mismatch: Output doesn't match expected schema
   - Judge Failure: LLM-as-judge returns invalid response
   - Threshold Not Met: Score below passing threshold

3. **System Failures**
   - Database Error: Cannot persist results
   - Configuration Error: Invalid runner/scorer config
   - Resource Exhaustion: Out of memory/disk space

### Error Handling Strategy

```typescript
interface EvalError {
  type: 'execution' | 'scoring' | 'system';
  severity: 'fatal' | 'error' | 'warning';
  message: string;
  testCaseId?: string;
  stack?: string;
  retryable: boolean;
}

// Retry logic with exponential backoff
async function executeWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (!isRetryable(error) || attempt === maxRetries - 1) {
        throw error;
      }
      const delay = baseDelay * Math.pow(2, attempt);
      await sleep(delay);
    }
  }
  throw new Error('Max retries exceeded');
}
```

### Graceful Degradation

- If a single test case fails, continue with remaining tests
- If a model provider is unavailable, skip that configuration
- If scoring fails, mark as "needs manual review"
- If database is unavailable, write results to local file

## Testing Strategy

### Unit Tests

- Dataset validation logic
- Scorer implementations
- Metric calculations
- Error handling

### Integration Tests

- End-to-end eval execution
- Database persistence
- Model provider integration
- Report generation

### Performance Tests

- Large dataset execution time
- Parallel execution scaling
- Database query performance
- Memory usage under load

### Test Coverage Goals

- Core eval logic: 90%+
- Scorer implementations: 85%+
- Runner implementations: 80%+
- Orchestration logic: 85%+

## Security and Compliance

### Data Protection

1. **PII Handling**
   - Anonymize student data in test cases
   - Encrypt sensitive fields in database
   - Redact PII from logs and reports

2. **Access Control**
   - Role-based access to eval dashboard
   - Audit logging for dataset modifications
   - API key rotation for model providers

3. **FERPA Compliance**
   - No real student data in test datasets
   - Synthetic data generation for realistic tests
   - Data retention policies for eval results

### Safety Testing

1. **Adversarial Inputs**
   - Prompt injection attempts
   - Data exfiltration attempts
   - Jailbreak attempts

2. **Output Validation**
   - PII leakage detection
   - Inappropriate content filtering
   - Hallucination detection

## Performance Considerations

### Optimization Strategies

1. **Parallel Execution**
   - Run independent test cases concurrently
   - Batch API requests where possible
   - Use worker threads for CPU-intensive scoring

2. **Caching**
   - Cache model responses for identical inputs
   - Cache embeddings for semantic similarity
   - Use Vercel AI Gateway for automatic caching

3. **Resource Management**
   - Rate limiting to avoid provider throttling
   - Connection pooling for database
   - Memory-efficient streaming for large datasets

### Performance Targets

- Single test case execution: < 5 seconds
- Full dataset (100 cases): < 10 minutes
- Report generation: < 30 seconds
- Dashboard page load: < 2 seconds

## Integration Points

### CI/CD Integration

**GitHub Actions Workflow**:

```yaml
name: AI Evals

on:
  pull_request:
    paths:
      - 'packages/ai/**'
      - 'services/ai/**'
      - 'packages/ai-evals/**'

jobs:
  run-evals:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run evals:run
      - uses: actions/upload-artifact@v3
        with:
          name: eval-results
          path: eval-results.json
```

### Vercel AI SDK Integration

```typescript
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';

// Model-agnostic runner
async function runWithModel(modelId: string, input: any, schema: any) {
  const { object } = await generateObject({
    model: modelId, // Swap models easily
    schema,
    prompt: input.prompt,
  });
  return object;
}
```

### Monitoring Integration

- Send eval metrics to Vercel Analytics
- Alert on regression detection via Slack/email
- Track eval costs in monitoring dashboard
- Log eval runs to Langfuse/Helicone for observability

## Deployment Strategy

### Phase 1: Foundation (Week 1-2)

- Set up package structure
- Implement core types and interfaces
- Create dataset manager
- Build basic runner for one use case

### Phase 2: Core Features (Week 3-4)

- Implement all scorer strategies
- Build orchestrator
- Set up database schema
- Create CLI for running evals

### Phase 3: Integration (Week 5-6)

- Integrate with CI/CD
- Build reporting dashboard
- Add baseline comparison
- Implement regression detection

### Phase 4: Polish (Week 7-8)

- Add remaining use case runners
- Expand test datasets
- Performance optimization
- Documentation and training

## Future Enhancements

1. **Automated Dataset Generation**
   - Use LLMs to generate synthetic test cases
   - Automatically extract test cases from production logs
   - Active learning to identify gaps in coverage

2. **Advanced Scoring**
   - Multi-dimensional quality metrics
   - User feedback integration
   - A/B testing framework

3. **Cost Optimization**
   - Smart model selection based on task complexity
   - Caching strategies for repeated inputs
   - Budget alerts and limits

4. **Continuous Evaluation**
   - Real-time eval on production traffic (shadow mode)
   - Automatic baseline updates
   - Drift detection

5. **Collaborative Features**
   - Team annotations on test cases
   - Shared baseline configurations
   - Cross-team eval sharing
