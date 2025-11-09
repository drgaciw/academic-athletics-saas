# API Reference

Complete API documentation for the AI Evaluation Framework. This reference covers all public interfaces, types, and methods.

## Table of Contents

- [Core Types](#core-types)
- [Dataset Manager API](#dataset-manager-api)
- [Runner API](#runner-api)
- [Scorer API](#scorer-api)
- [Orchestrator API](#orchestrator-api)
- [Safety & Compliance API](#safety--compliance-api)
- [Utility Functions](#utility-functions)

## Core Types

### TestCase

Represents a single unit of evaluation.

```typescript
interface TestCase<TInput = any, TOutput = any> {
  id: string;
  input: TInput;
  expected: TOutput;
  metadata: TestCaseMetadata;
}

interface TestCaseMetadata {
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  tags: string[];
  createdAt: Date;
  source: 'production' | 'synthetic' | 'edge-case';
  description?: string;
  reference?: string;
}
```

**Example**:

```typescript
const testCase: TestCase = {
  id: 'compliance-001',
  input: {
    studentId: 'STU123',
    gpa: 2.5,
    creditHours: 24,
    progressTowardDegree: 42,
  },
  expected: {
    eligible: true,
    issues: [],
    recommendations: [],
  },
  metadata: {
    difficulty: 'medium',
    category: 'continuing-eligibility',
    tags: ['gpa', 'credits'],
    createdAt: new Date(),
    source: 'synthetic',
    description: 'Student meeting minimum requirements',
  },
};
```

### Dataset

Collection of test cases with versioning and schema validation.

```typescript
interface Dataset<TInput = any, TOutput = any> {
  id: string;
  name: string;
  description: string;
  version: string;
  testCases: TestCase<TInput, TOutput>[];
  schema: DatasetSchema<TInput, TOutput>;
  createdAt: Date;
  updatedAt: Date;
  metadata?: {
    author?: string;
    purpose?: string;
    relatedDatasets?: string[];
    [key: string]: any;
  };
}

interface DatasetSchema<TInput = any, TOutput = any> {
  input: z.ZodSchema<TInput>;
  output: z.ZodSchema<TOutput>;
}
```

### RunResult

Result of executing a single test case.

```typescript
interface RunResult<TOutput = any> {
  testCaseId: string;
  input: any;
  expected: TOutput;
  actual: TOutput;
  metadata: {
    modelId: string;
    latency: number; // milliseconds
    tokenUsage: TokenUsage;
    cost: number; // USD
    timestamp: Date;
    error?: string;
  };
}

interface TokenUsage {
  prompt: number;
  completion: number;
  total: number;
}
```

### Score

Result of evaluating an output.

```typescript
interface Score {
  passed: boolean;
  score: number; // 0.0 to 1.0
  confidence?: number;
  explanation?: string;
  breakdown?: ScoreBreakdown;
}

interface ScoreBreakdown {
  accuracy?: number;
  completeness?: number;
  relevance?: number;
  helpfulness?: number;
  [dimension: string]: number | undefined;
}
```

### EvalReport

Comprehensive evaluation report.

```typescript
interface EvalReport {
  jobId: string;
  summary: {
    totalTests: number;
    passed: number;
    failed: number;
    accuracy: number;
    avgLatency: number;
    totalCost: number;
    duration: number;
    status: JobStatus;
  };
  runSummaries: RunSummary[];
  scoringResults: ScoringResult[];
  metrics: Metrics;
  regressions: Regression[];
  recommendations: Recommendation[];
  executionMetrics?: ExecutionMetrics;
  generatedAt: Date;
}
```

## Dataset Manager API

### Class: `DatasetManager`

Manages dataset storage, loading, and validation.

#### Constructor

```typescript
constructor(datasetsDir?: string)
```

**Parameters**:
- `datasetsDir` (optional): Directory to store datasets. Defaults to `./datasets`

**Example**:

```typescript
import { DatasetManager } from '@aah/ai-evals';

const manager = new DatasetManager('./my-datasets');
await manager.initialize();
```

#### Methods

##### `initialize()`

Initializes the datasets directory.

```typescript
async initialize(): Promise<void>
```

**Example**:

```typescript
await manager.initialize();
```

---

##### `createDataset(config)`

Creates a new dataset.

```typescript
async createDataset<TInput, TOutput>(
  config: DatasetConfig<TInput, TOutput>
): Promise<Dataset<TInput, TOutput>>
```

**Parameters**:
- `config`: Dataset configuration
  - `name`: Dataset name
  - `description`: Dataset description
  - `schema`: Zod schemas for input and output validation
  - `version` (optional): Version string (defaults to "1.0.0")
  - `metadata` (optional): Additional metadata

**Returns**: Created dataset

**Example**:

```typescript
import { z } from 'zod';

const dataset = await manager.createDataset({
  name: 'compliance-eligibility',
  description: 'NCAA compliance eligibility test cases',
  schema: {
    input: z.object({
      studentId: z.string(),
      gpa: z.number(),
      creditHours: z.number(),
    }),
    output: z.object({
      eligible: z.boolean(),
      issues: z.array(z.string()),
    }),
  },
  version: '1.0.0',
  metadata: {
    author: 'QA Team',
    purpose: 'Regression testing',
  },
});
```

---

##### `loadDataset(id, options?)`

Loads a dataset by ID.

```typescript
async loadDataset<TInput, TOutput>(
  datasetId: string,
  options?: LoadOptions
): Promise<Dataset<TInput, TOutput>>
```

**Parameters**:
- `datasetId`: Unique dataset identifier
- `options` (optional):
  - `validate`: Validate dataset schema (default: `true`)
  - `lazy`: Lazy load test cases (default: `false`)
  - `version`: Load specific version (default: latest)

**Returns**: Loaded dataset

**Throws**: Error if dataset not found or validation fails

**Example**:

```typescript
const dataset = await manager.loadDataset('compliance-eligibility', {
  validate: true,
  lazy: false,
});

console.log(`Loaded ${dataset.testCases.length} test cases`);
```

---

##### `listDatasets()`

Lists all available datasets.

```typescript
async listDatasets(): Promise<Array<{
  id: string;
  name: string;
  version: string;
  testCaseCount: number;
}>>
```

**Returns**: Array of dataset summaries

**Example**:

```typescript
const datasets = await manager.listDatasets();
datasets.forEach(ds => {
  console.log(`${ds.name} v${ds.version}: ${ds.testCaseCount} tests`);
});
```

---

##### `addTestCase(datasetId, testCase)`

Adds a test case to an existing dataset.

```typescript
async addTestCase<TInput, TOutput>(
  datasetId: string,
  testCase: Omit<TestCase<TInput, TOutput>, 'id'>
): Promise<void>
```

**Parameters**:
- `datasetId`: Target dataset ID
- `testCase`: Test case data (ID will be auto-generated)

**Example**:

```typescript
await manager.addTestCase('compliance-eligibility', {
  input: { studentId: 'STU456', gpa: 3.0, creditHours: 30 },
  expected: { eligible: true, issues: [] },
  metadata: {
    difficulty: 'easy',
    category: 'continuing-eligibility',
    tags: ['gpa'],
    createdAt: new Date(),
    source: 'synthetic',
  },
});
```

---

##### `updateTestCase(datasetId, testCaseId, updates)`

Updates an existing test case.

```typescript
async updateTestCase<TInput, TOutput>(
  datasetId: string,
  testCaseId: string,
  updates: Partial<TestCase<TInput, TOutput>>
): Promise<void>
```

**Example**:

```typescript
await manager.updateTestCase('compliance-eligibility', 'test-001', {
  expected: { eligible: false, issues: ['GPA too low'] },
  metadata: {
    difficulty: 'hard',
    tags: ['gpa', 'edge-case'],
  },
});
```

---

##### `removeTestCase(datasetId, testCaseId)`

Removes a test case from a dataset.

```typescript
async removeTestCase(
  datasetId: string,
  testCaseId: string
): Promise<void>
```

**Example**:

```typescript
await manager.removeTestCase('compliance-eligibility', 'test-001');
```

---

##### `validateDataset(dataset)`

Validates dataset structure and schema compliance.

```typescript
validateDataset<TInput, TOutput>(
  dataset: Dataset<TInput, TOutput>
): ValidationResult

interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}
```

**Example**:

```typescript
const result = manager.validateDataset(dataset);
if (!result.valid) {
  console.error('Validation errors:', result.errors);
}
if (result.warnings.length > 0) {
  console.warn('Validation warnings:', result.warnings);
}
```

---

##### `exportDataset(datasetId, options)`

Exports a dataset in specified format.

```typescript
async exportDataset(
  datasetId: string,
  options: ExportOptions
): Promise<string>

interface ExportOptions {
  format: 'json' | 'csv' | 'yaml';
  includeMetadata?: boolean;
  pretty?: boolean;
}
```

**Example**:

```typescript
const json = await manager.exportDataset('compliance-eligibility', {
  format: 'json',
  includeMetadata: true,
  pretty: true,
});

await writeFile('./export.json', json);
```

---

##### `deleteDataset(datasetId)`

Deletes a dataset permanently.

```typescript
async deleteDataset(datasetId: string): Promise<void>
```

**Example**:

```typescript
await manager.deleteDataset('old-dataset');
```

## Runner API

### Class: `BaseRunner`

Abstract base class for all runners. Do not instantiate directly.

```typescript
abstract class BaseRunner<TInput, TOutput> {
  constructor(config: RunnerConfig);

  abstract executeModel(input: TInput): Promise<TOutput>;

  async runTestCase(testCase: TestCase<TInput, TOutput>): Promise<RunResult<TOutput>>;
  async runDataset(dataset: Dataset<TInput, TOutput>): Promise<RunSummary>;
}
```

### RunnerConfig

```typescript
interface RunnerConfig {
  modelId: string;
  temperature?: number;
  maxTokens?: number;
  timeout?: number; // milliseconds
  retries?: number;
  additionalParams?: Record<string, any>;
}
```

### Class: `ComplianceRunner`

Executes NCAA compliance eligibility checks.

```typescript
class ComplianceRunner extends BaseRunner<ComplianceInput, ComplianceOutput>
```

**Example**:

```typescript
import { ComplianceRunner } from '@aah/ai-evals';

const runner = new ComplianceRunner({
  modelId: 'openai/gpt-4-turbo',
  temperature: 0.1,
  timeout: 30000,
  retries: 3,
});

const result = await runner.runTestCase(testCase);
console.log(`Actual: ${JSON.stringify(result.actual)}`);
console.log(`Latency: ${result.metadata.latency}ms`);
console.log(`Cost: $${result.metadata.cost}`);
```

### Class: `ConversationalRunner`

Executes conversational AI responses.

```typescript
class ConversationalRunner extends BaseRunner<ConversationalInput, ConversationalOutput>
```

**Example**:

```typescript
import { ConversationalRunner } from '@aah/ai-evals';

const runner = new ConversationalRunner({
  modelId: 'anthropic/claude-sonnet-4',
  temperature: 0.7,
  maxTokens: 1000,
});

const result = await runner.runTestCase({
  id: 'conv-001',
  input: {
    message: 'What are the NCAA GPA requirements?',
    context: {
      userId: 'user123',
      role: 'student-athlete',
    },
  },
  expected: {
    answer: expect.stringContaining('2.3'),
    tone: 'helpful',
  },
  metadata: { /* ... */ },
});
```

### Class: `AdvisingRunner`

Executes course recommendation logic.

```typescript
class AdvisingRunner extends BaseRunner<AdvisingInput, AdvisingOutput>
```

### Class: `RiskPredictionRunner`

Executes student risk prediction models.

```typescript
class RiskPredictionRunner extends BaseRunner<RiskPredictionInput, RiskPredictionOutput>
```

### Class: `RAGRunner`

Executes RAG (Retrieval-Augmented Generation) pipelines.

```typescript
class RAGRunner extends BaseRunner<RAGInput, RAGOutput>
```

**Example**:

```typescript
import { RAGRunner } from '@aah/ai-evals';

const runner = new RAGRunner({
  modelId: 'openai/gpt-4-turbo',
  additionalParams: {
    embeddingModel: 'text-embedding-3-large',
    maxDocuments: 5,
  },
});

const result = await runner.runTestCase({
  id: 'rag-001',
  input: {
    query: 'What is the 40/60/80 rule?',
    maxDocuments: 5,
  },
  expected: {
    answer: expect.stringContaining('progress toward degree'),
    sources: expect.arrayContaining([
      expect.objectContaining({ relevanceScore: expect.any(Number) }),
    ]),
  },
  metadata: { /* ... */ },
});
```

## Scorer API

### Interface: `Scorer`

Base interface for all scorers.

```typescript
interface Scorer {
  score(
    expected: any,
    actual: any,
    config: ScorerConfig
  ): Promise<Score>;
}
```

### Class: `ExactMatchScorer`

Performs exact match comparison for structured outputs.

```typescript
class ExactMatchScorer implements Scorer {
  async score(expected: any, actual: any): Promise<Score>;
}
```

**Best for**: JSON objects, enums, boolean values, structured data

**Example**:

```typescript
import { ExactMatchScorer } from '@aah/ai-evals';

const scorer = new ExactMatchScorer();

const score = await scorer.score(
  { eligible: true, issues: [] },
  { eligible: true, issues: [] }
);

console.log(score);
// {
//   passed: true,
//   score: 1.0,
//   explanation: "Exact match"
// }
```

---

### Class: `SemanticSimilarityScorer`

Compares text outputs using embedding-based similarity.

```typescript
class SemanticSimilarityScorer implements Scorer {
  constructor(config?: {
    embeddingModel?: string;
    threshold?: number;
  });

  async score(
    expected: string,
    actual: string,
    config?: ScorerConfig
  ): Promise<Score>;
}
```

**Best for**: Text responses, paraphrasing, conceptual similarity

**Parameters**:
- `embeddingModel`: OpenAI embedding model (default: `text-embedding-3-large`)
- `threshold`: Similarity threshold for pass/fail (default: `0.85`)

**Example**:

```typescript
import { SemanticSimilarityScorer } from '@aah/ai-evals';

const scorer = new SemanticSimilarityScorer({
  embeddingModel: 'text-embedding-3-small',
  threshold: 0.80,
});

const score = await scorer.score(
  'Student-athletes must maintain a 2.3 GPA',
  'Athletes need at least a 2.3 grade point average'
);

console.log(score);
// {
//   passed: true,
//   score: 0.92,
//   confidence: 0.95,
//   explanation: "High semantic similarity (0.92)"
// }
```

---

### Class: `LLMJudgeScorer`

Uses an LLM to evaluate output quality on multiple dimensions.

```typescript
class LLMJudgeScorer implements Scorer {
  constructor(config: {
    judgeModel: string;
    rubric?: EvalRubric;
    temperature?: number;
  });

  async score(
    expected: any,
    actual: any,
    config?: ScorerConfig
  ): Promise<Score>;
}

interface EvalRubric {
  dimensions: Array<{
    name: string;
    description: string;
    weight: number;
  }>;
  passingScore: number;
}
```

**Best for**: Quality assessment, tone evaluation, helpfulness, nuanced evaluation

**Example**:

```typescript
import { LLMJudgeScorer } from '@aah/ai-evals';

const scorer = new LLMJudgeScorer({
  judgeModel: 'openai/gpt-4-turbo',
  rubric: {
    dimensions: [
      { name: 'accuracy', description: 'Factual correctness', weight: 0.4 },
      { name: 'helpfulness', description: 'Usefulness of response', weight: 0.3 },
      { name: 'clarity', description: 'Clear communication', weight: 0.3 },
    ],
    passingScore: 0.7,
  },
  temperature: 0.1,
});

const score = await scorer.score(expectedAnswer, actualAnswer);

console.log(score);
// {
//   passed: true,
//   score: 0.85,
//   breakdown: {
//     accuracy: 0.9,
//     helpfulness: 0.8,
//     clarity: 0.85
//   },
//   explanation: "Strong response across all dimensions..."
// }
```

---

### Class: `PrecisionRecallScorer`

Calculates precision, recall, and F1 scores for multi-label outputs.

```typescript
class PrecisionRecallScorer implements Scorer {
  async score(
    expected: string[],
    actual: string[],
    config?: ScorerConfig
  ): Promise<Score>;
}
```

**Best for**: Classification tasks, multi-label predictions, risk factors

**Example**:

```typescript
import { PrecisionRecallScorer } from '@aah/ai-evals';

const scorer = new PrecisionRecallScorer();

const score = await scorer.score(
  ['academic-risk', 'attendance-risk'],
  ['academic-risk', 'attendance-risk', 'injury-risk']
);

console.log(score);
// {
//   passed: true,
//   score: 0.67, // F1 score
//   breakdown: {
//     precision: 0.67,
//     recall: 1.0,
//     f1: 0.80
//   }
// }
```

---

### Class: `RecallAtKScorer`

Measures retrieval quality for RAG systems.

```typescript
class RecallAtKScorer implements Scorer {
  constructor(k: number);

  async score(
    expected: string[],
    actual: Array<{ documentId: string }>,
    config?: ScorerConfig
  ): Promise<Score>;
}
```

**Best for**: RAG retrieval quality, search relevance

**Example**:

```typescript
import { RecallAtKScorer } from '@aah/ai-evals';

const scorer = new RecallAtKScorer(5); // Recall@5

const score = await scorer.score(
  ['doc-1', 'doc-2', 'doc-3'], // Expected relevant docs
  [
    { documentId: 'doc-1' },
    { documentId: 'doc-2' },
    { documentId: 'doc-4' },
    { documentId: 'doc-5' },
    { documentId: 'doc-3' },
  ] // Top 5 retrieved docs
);

console.log(score);
// {
//   passed: true,
//   score: 1.0, // All 3 expected docs in top 5
//   explanation: "Recall@5: 3/3 relevant documents retrieved"
// }
```

## Orchestrator API

### Class: `EvalOrchestrator`

Main orchestrator for coordinating evaluation operations.

```typescript
class EvalOrchestrator {
  constructor(config?: EvalOrchestratorConfig);

  // Job management
  createJob(config: JobConfig): string;
  async executeJob(jobId: string, ...): Promise<EvalReport>;
  async cancelJob(jobId: string): Promise<void>;
  getJob(jobId: string): EvalJob | null;
  getProgress(jobId: string): JobProgress | null;

  // Baseline management
  storeBaseline(name: string, description: string, runId: string, metrics: Metrics): string;
  setActiveBaseline(baselineId: string): void;
  getActiveBaseline(): Baseline | null;
  getAllBaselines(): Baseline[];
  compareToBaseline(currentMetrics: Metrics, currentRunId: string, baselineId?: string): BaselineComparison;

  // Reporting
  generateReport(jobId: string): EvalReport;
  exportReport(report: EvalReport, options: ExportOptions): string;
  getQueueStats(): QueueStats;
}
```

#### Constructor

```typescript
constructor(config?: EvalOrchestratorConfig)

interface EvalOrchestratorConfig {
  maxConcurrentJobs?: number;
  workerConfig?: WorkerConfig;
}

interface WorkerConfig {
  maxWorkers?: number;
  concurrency?: number;
  rateLimit?: {
    requestsPerMinute: number;
    tokensPerMinute?: number;
  };
}
```

**Example**:

```typescript
import { EvalOrchestrator } from '@aah/ai-evals';

const orchestrator = new EvalOrchestrator({
  maxConcurrentJobs: 5,
  workerConfig: {
    maxWorkers: 4,
    concurrency: 10,
    rateLimit: {
      requestsPerMinute: 100,
      tokensPerMinute: 100000,
    },
  },
});
```

#### `createJob(config)`

Creates and queues an evaluation job.

```typescript
createJob(config: JobConfig): string

interface JobConfig {
  datasetIds: string[];
  runnerConfigs: RunnerConfig[];
  scorerConfig: ScorerConfig;
  baseline?: string;
  parallel?: boolean;
  concurrency?: number;
}
```

**Example**:

```typescript
const jobId = orchestrator.createJob({
  datasetIds: ['compliance-eligibility', 'compliance-gpa'],
  runnerConfigs: [
    { modelId: 'openai/gpt-4-turbo', temperature: 0.1 },
    { modelId: 'anthropic/claude-sonnet-4', temperature: 0.1 },
  ],
  scorerConfig: {
    strategy: 'exact',
  },
  baseline: 'baseline-v1',
  parallel: true,
  concurrency: 10,
});

console.log(`Job created: ${jobId}`);
```

#### `executeJob(jobId, datasets, runExecutor, scorer)`

Executes an evaluation job end-to-end.

```typescript
async executeJob(
  jobId: string,
  datasets: Dataset[],
  runExecutor: (task: ExecutionTask) => Promise<RunResult>,
  scorer: (result: RunResult, config: ScorerConfig) => Promise<Score>
): Promise<EvalReport>
```

**Example**:

```typescript
const datasets = await Promise.all(
  datasetIds.map(id => datasetManager.loadDataset(id))
);

const runExecutor = async (task) => {
  const runner = new ComplianceRunner(task.runnerConfig);
  return runner.runTestCase(task.testCase);
};

const scorer = async (result, config) => {
  const exactMatch = new ExactMatchScorer();
  return exactMatch.score(result.expected, result.actual, config);
};

const report = await orchestrator.executeJob(
  jobId,
  datasets,
  runExecutor,
  scorer
);

console.log(`Report: ${report.summary.accuracy}% accuracy`);
```

#### `storeBaseline(name, description, runId, metrics)`

Stores a new baseline for regression detection.

```typescript
storeBaseline(
  name: string,
  description: string,
  runId: string,
  metrics: Metrics
): string
```

**Example**:

```typescript
const baselineId = orchestrator.storeBaseline(
  'Production Baseline v1.0',
  'Initial production baseline after launch',
  report.jobId,
  report.metrics
);

console.log(`Baseline created: ${baselineId}`);
```

#### `setActiveBaseline(baselineId)`

Sets the active baseline for comparisons.

```typescript
setActiveBaseline(baselineId: string): void
```

**Example**:

```typescript
orchestrator.setActiveBaseline(baselineId);
```

#### `compareToBaseline(currentMetrics, currentRunId, baselineId?)`

Compares current metrics to a baseline.

```typescript
compareToBaseline(
  currentMetrics: Metrics,
  currentRunId: string,
  baselineId?: string
): BaselineComparison
```

**Example**:

```typescript
const comparison = orchestrator.compareToBaseline(
  report.metrics,
  report.jobId,
  baselineId
);

console.log(`Regressions: ${comparison.summary.totalRegressions}`);
console.log(`Critical: ${comparison.summary.criticalRegressions}`);

comparison.regressions.forEach(reg => {
  console.log(`${reg.testCaseId}: ${reg.metric} dropped ${reg.percentChange}%`);
});
```

#### `exportReport(report, options)`

Exports a report in the specified format.

```typescript
exportReport(
  report: EvalReport,
  options: ExportOptions
): string

interface ExportOptions {
  format: 'json' | 'csv' | 'html';
  includeDetails?: boolean;
  includeScoringBreakdown?: boolean;
  includeRawResults?: boolean;
  includeRecommendations?: boolean;
}
```

**Example**:

```typescript
const html = orchestrator.exportReport(report, {
  format: 'html',
  includeDetails: true,
  includeScoringBreakdown: true,
  includeRecommendations: true,
});

await writeFile('./report.html', html);
```

## Safety & Compliance API

### Class: `PIIDetector`

Detects personally identifiable information (PII) in text.

```typescript
class PIIDetector {
  constructor(config?: PIIDetectorConfig);

  scan(text: string): PIIDetection[];
  sanitize(text: string): string;
}

interface PIIDetection {
  type: PIIType;
  value: string;
  confidence: number;
  position: { start: number; end: number };
  context: string;
}
```

**Example**:

```typescript
import { PIIDetector } from '@aah/ai-evals';

const detector = new PIIDetector();

const detections = detector.scan(
  'Contact John Doe at john.doe@university.edu or 555-123-4567'
);

console.log(detections);
// [
//   { type: 'NAME', value: 'John Doe', confidence: 0.95, ... },
//   { type: 'EMAIL', value: 'john.doe@university.edu', confidence: 1.0, ... },
//   { type: 'PHONE', value: '555-123-4567', confidence: 0.98, ... }
// ]

const sanitized = detector.sanitize(text);
console.log(sanitized);
// "Contact [NAME] at [EMAIL] or [PHONE]"
```

### Class: `FERPAComplianceChecker`

Validates FERPA compliance for datasets.

```typescript
class FERPAComplianceChecker {
  checkDataset(dataset: Dataset): FERPAComplianceResult[];
  validateAnonymization(data: any): boolean;
  auditAccess(log: DatasetAuditLog): void;
}
```

**Example**:

```typescript
import { FERPAComplianceChecker } from '@aah/ai-evals';

const checker = new FERPAComplianceChecker();

const results = checker.checkDataset(dataset);
results.forEach(result => {
  if (!result.compliant) {
    console.error(`FERPA violation: ${result.requirement}`);
    result.violations.forEach(v => {
      console.error(`  - ${v.description} (${v.severity})`);
    });
  }
});
```

## Utility Functions

### `calculateMetrics(results, scores)`

Calculates aggregate metrics from results.

```typescript
function calculateMetrics(
  results: RunResult[],
  scores: Score[]
): Metrics
```

### `generateRecommendations(report)`

Generates actionable recommendations from a report.

```typescript
function generateRecommendations(
  report: EvalReport
): Recommendation[]
```

### `formatCost(cost)`

Formats cost for display.

```typescript
function formatCost(cost: number): string
// Example: formatCost(0.00123) => "$0.0012"
```

### `formatLatency(ms)`

Formats latency for display.

```typescript
function formatLatency(ms: number): string
// Example: formatLatency(1234) => "1.23s"
```

---

**API Version**: 1.0.0
**Last Updated**: 2025-01-08
**Breaking Changes**: See CHANGELOG.md
