# Examples and Code Patterns

Practical examples for common use cases in the AI Evaluation Framework.

## Table of Contents

- [Quick Start](#quick-start)
- [Dataset Management](#dataset-management)
- [Running Evaluations](#running-evaluations)
- [Custom Scorers](#custom-scorers)
- [Baseline Management](#baseline-management)
- [Advanced Patterns](#advanced-patterns)
- [Integration Examples](#integration-examples)

## Quick Start

### Minimal Example

```typescript
import {
  DatasetManager,
  ComplianceRunner,
  ExactMatchScorer,
  EvalOrchestrator,
} from '@aah/ai-evals';

// 1. Create dataset manager
const datasetManager = new DatasetManager();
await datasetManager.initialize();

// 2. Load dataset
const dataset = await datasetManager.loadDataset('compliance-eligibility');

// 3. Create runner
const runner = new ComplianceRunner({
  modelId: 'openai/gpt-4-turbo',
  temperature: 0.1,
});

// 4. Run first test
const result = await runner.runTestCase(dataset.testCases[0]);

// 5. Score result
const scorer = new ExactMatchScorer();
const score = await scorer.score(result.expected, result.actual);

console.log(`Passed: ${score.passed}, Score: ${score.score}`);
```

### Complete Workflow Example

```typescript
import {
  DatasetManager,
  EvalOrchestrator,
  ComplianceRunner,
  ExactMatchScorer,
} from '@aah/ai-evals';

async function runCompleteEvaluation() {
  // Initialize components
  const datasetManager = new DatasetManager();
  const orchestrator = new EvalOrchestrator({
    workerConfig: {
      concurrency: 10,
      rateLimit: { requestsPerMinute: 100 },
    },
  });

  // Load datasets
  const datasets = await Promise.all([
    datasetManager.loadDataset('compliance-eligibility'),
    datasetManager.loadDataset('compliance-gpa'),
  ]);

  // Create job
  const jobId = orchestrator.createJob({
    datasetIds: datasets.map(d => d.id),
    runnerConfigs: [
      { modelId: 'openai/gpt-4-turbo', temperature: 0.1 },
    ],
    scorerConfig: { strategy: 'exact' },
    parallel: true,
  });

  // Execute job
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

  // Print results
  console.log('Evaluation Complete!');
  console.log(`Accuracy: ${report.summary.accuracy}%`);
  console.log(`Total Cost: $${report.summary.totalCost.toFixed(4)}`);
  console.log(`Duration: ${report.summary.duration / 1000}s`);

  // Export report
  const html = orchestrator.exportReport(report, {
    format: 'html',
    includeDetails: true,
  });

  await writeFile('./report.html', html);

  return report;
}
```

## Dataset Management

### Creating a Dataset

```typescript
import { DatasetManager } from '@aah/ai-evals';
import { z } from 'zod';

const manager = new DatasetManager();

// Define schemas
const ComplianceInputSchema = z.object({
  studentId: z.string(),
  gpa: z.number(),
  creditHours: z.number(),
  progressTowardDegree: z.number(),
  semester: z.string(),
});

const ComplianceOutputSchema = z.object({
  eligible: z.boolean(),
  issues: z.array(z.string()),
  recommendations: z.array(z.string()),
});

// Create dataset
const dataset = await manager.createDataset({
  name: 'compliance-continuing-eligibility',
  description: 'Test cases for NCAA continuing eligibility rules',
  schema: {
    input: ComplianceInputSchema,
    output: ComplianceOutputSchema,
  },
  version: '1.0.0',
  metadata: {
    author: 'QA Team',
    purpose: 'Regression testing for Task 6.1',
    tags: ['compliance', 'ncaa', 'continuing-eligibility'],
  },
});

console.log(`Created dataset: ${dataset.id}`);
```

### Adding Test Cases

```typescript
// Add test cases to the dataset
const testCases = [
  {
    input: {
      studentId: 'STU001',
      gpa: 2.5,
      creditHours: 24,
      progressTowardDegree: 42,
      semester: 'Fall 2024',
    },
    expected: {
      eligible: true,
      issues: [],
      recommendations: [],
    },
    metadata: {
      difficulty: 'easy',
      category: 'baseline',
      tags: ['passing', 'minimum-requirements'],
      createdAt: new Date(),
      source: 'synthetic',
      description: 'Student meeting all minimum requirements',
    },
  },
  {
    input: {
      studentId: 'STU002',
      gpa: 1.9,
      creditHours: 18,
      progressTowardDegree: 35,
      semester: 'Fall 2024',
    },
    expected: {
      eligible: false,
      issues: ['GPA below 2.0 threshold', 'Insufficient progress (40% required)'],
      recommendations: [
        'Meet with academic advisor',
        'Enroll in additional courses',
      ],
    },
    metadata: {
      difficulty: 'medium',
      category: 'violations',
      tags: ['failing', 'gpa', 'progress'],
      createdAt: new Date(),
      source: 'synthetic',
      description: 'Multiple eligibility violations',
    },
  },
  {
    input: {
      studentId: 'STU003',
      gpa: 2.299,
      creditHours: 24,
      progressTowardDegree: 40,
      semester: 'Fall 2024',
    },
    expected: {
      eligible: false,
      issues: ['GPA slightly below 2.3 threshold'],
      recommendations: ['Academic support recommended'],
    },
    metadata: {
      difficulty: 'hard',
      category: 'edge-cases',
      tags: ['boundary', 'gpa'],
      createdAt: new Date(),
      source: 'edge-case',
      description: 'GPA just below threshold (edge case)',
    },
  },
];

for (const testCase of testCases) {
  await manager.addTestCase(dataset.id, testCase);
}

console.log(`Added ${testCases.length} test cases`);
```

### Loading and Filtering Datasets

```typescript
// Load full dataset
const dataset = await manager.loadDataset('compliance-eligibility');

// Filter test cases by difficulty
const hardCases = dataset.testCases.filter(
  tc => tc.metadata.difficulty === 'hard'
);

// Filter by category
const edgeCases = dataset.testCases.filter(
  tc => tc.metadata.category === 'edge-cases'
);

// Filter by tags
const gpaTests = dataset.testCases.filter(
  tc => tc.metadata.tags.includes('gpa')
);

console.log(`Hard cases: ${hardCases.length}`);
console.log(`Edge cases: ${edgeCases.length}`);
console.log(`GPA tests: ${gpaTests.length}`);
```

### Exporting Datasets

```typescript
// Export as JSON
const jsonExport = await manager.exportDataset('compliance-eligibility', {
  format: 'json',
  includeMetadata: true,
  pretty: true,
});

await writeFile('./datasets/compliance-eligibility.json', jsonExport);

// Export as CSV (flattened)
const csvExport = await manager.exportDataset('compliance-eligibility', {
  format: 'csv',
  includeMetadata: false,
});

await writeFile('./datasets/compliance-eligibility.csv', csvExport);
```

## Running Evaluations

### Single Model Evaluation

```typescript
import { ComplianceRunner, ExactMatchScorer } from '@aah/ai-evals';

async function evaluateSingleModel() {
  const runner = new ComplianceRunner({
    modelId: 'openai/gpt-4-turbo',
    temperature: 0.1,
    timeout: 30000,
    retries: 3,
  });

  const dataset = await datasetManager.loadDataset('compliance-eligibility');
  const scorer = new ExactMatchScorer();

  let passed = 0;
  let failed = 0;
  let totalCost = 0;

  for (const testCase of dataset.testCases) {
    const result = await runner.runTestCase(testCase);
    const score = await scorer.score(result.expected, result.actual);

    if (score.passed) {
      passed++;
    } else {
      failed++;
      console.log(`FAIL: ${testCase.id}`);
      console.log(`Expected: ${JSON.stringify(result.expected)}`);
      console.log(`Actual: ${JSON.stringify(result.actual)}`);
    }

    totalCost += result.metadata.cost;
  }

  console.log(`Passed: ${passed}/${dataset.testCases.length}`);
  console.log(`Accuracy: ${(passed / dataset.testCases.length * 100).toFixed(2)}%`);
  console.log(`Total Cost: $${totalCost.toFixed(4)}`);
}
```

### Model Comparison

```typescript
import { ModelComparison } from '@aah/ai-evals';

async function compareModels() {
  const comparison = new ModelComparison();

  const configs = [
    { modelId: 'openai/gpt-4-turbo', temperature: 0.1 },
    { modelId: 'anthropic/claude-sonnet-4', temperature: 0.1 },
    { modelId: 'openai/gpt-3.5-turbo', temperature: 0.1 },
  ];

  const dataset = await datasetManager.loadDataset('compliance-eligibility');

  const report = await comparison.compare(
    dataset,
    configs,
    { strategy: 'exact' }
  );

  // Print comparison table
  console.log('Model Comparison Results:\n');
  console.log('Model                        | Accuracy | Avg Latency | Total Cost | Winner Rate');
  console.log('---------------------------- | -------- | ----------- | ---------- | -----------');

  for (const [modelId, summary] of Object.entries(report.summary)) {
    console.log(
      `${modelId.padEnd(28)} | ${summary.avgScore.toFixed(2).padStart(8)} | ` +
      `${summary.avgLatency.toFixed(0).padStart(11)}ms | ` +
      `$${summary.totalCost.toFixed(4).padStart(9)} | ` +
      `${(summary.winRate * 100).toFixed(1).padStart(10)}%`
    );
  }

  // Find best model
  const bestModel = Object.entries(report.summary).reduce((best, [id, summary]) => {
    if (!best || summary.avgScore > best[1].avgScore) {
      return [id, summary];
    }
    return best;
  });

  console.log(`\nBest model: ${bestModel[0]} (${(bestModel[1].avgScore * 100).toFixed(2)}% accuracy)`);
}
```

### Feature-Specific Runners

#### Conversational AI

```typescript
import { ConversationalRunner, SemanticSimilarityScorer } from '@aah/ai-evals';

async function evaluateConversationalAI() {
  const runner = new ConversationalRunner({
    modelId: 'anthropic/claude-sonnet-4',
    temperature: 0.7,
    maxTokens: 1000,
  });

  const scorer = new SemanticSimilarityScorer({
    threshold: 0.85,
  });

  const testCase = {
    id: 'conv-001',
    input: {
      message: 'What are the NCAA GPA requirements for Division I athletes?',
      context: {
        userId: 'test-user',
        role: 'student-athlete',
      },
    },
    expected: {
      answer: 'NCAA Division I requires a minimum 2.3 GPA in core courses for initial eligibility...',
      tone: 'helpful',
    },
    metadata: {
      difficulty: 'medium',
      category: 'ncaa-rules',
      tags: ['gpa', 'eligibility'],
      createdAt: new Date(),
      source: 'synthetic',
    },
  };

  const result = await runner.runTestCase(testCase);
  const score = await scorer.score(
    result.expected.answer,
    result.actual.answer
  );

  console.log(`Question: ${testCase.input.message}`);
  console.log(`Answer: ${result.actual.answer}`);
  console.log(`Score: ${score.score} (${score.passed ? 'PASS' : 'FAIL'})`);
  console.log(`Latency: ${result.metadata.latency}ms`);
}
```

#### RAG Pipeline

```typescript
import { RAGRunner, RecallAtKScorer } from '@aah/ai-evals';

async function evaluateRAGPipeline() {
  const runner = new RAGRunner({
    modelId: 'openai/gpt-4-turbo',
    additionalParams: {
      embeddingModel: 'text-embedding-3-large',
      maxDocuments: 5,
    },
  });

  const scorer = new RecallAtKScorer(5);

  const testCase = {
    id: 'rag-001',
    input: {
      query: 'What is the 40/60/80 rule in NCAA compliance?',
      maxDocuments: 5,
    },
    expected: {
      answer: expect.stringContaining('progress toward degree'),
      sources: ['doc-ncaa-handbook-p42', 'doc-compliance-guide-p15'],
    },
    metadata: { /* ... */ },
  };

  const result = await runner.runTestCase(testCase);

  // Score retrieval quality
  const retrievalScore = await scorer.score(
    testCase.expected.sources,
    result.actual.sources
  );

  console.log(`Query: ${testCase.input.query}`);
  console.log(`Answer: ${result.actual.answer}`);
  console.log(`Retrieved ${result.actual.sources.length} documents`);
  console.log(`Retrieval quality: ${retrievalScore.score} (Recall@5)`);
}
```

## Custom Scorers

### Simple Custom Scorer

```typescript
import { Scorer, Score, ScorerConfig } from '@aah/ai-evals';

class PercentageErrorScorer implements Scorer {
  constructor(private maxError: number = 0.05) {} // 5% default

  async score(expected: number, actual: number, config?: ScorerConfig): Promise<Score> {
    const error = Math.abs(expected - actual) / expected;
    const passed = error <= this.maxError;
    const score = Math.max(0, 1 - (error / this.maxError));

    return {
      passed,
      score,
      explanation: `Error: ${(error * 100).toFixed(2)}% (max: ${(this.maxError * 100)}%)`,
    };
  }
}

// Usage
const scorer = new PercentageErrorScorer(0.10); // 10% tolerance
const score = await scorer.score(2.5, 2.6); // Expected: 2.5, Actual: 2.6
console.log(score); // { passed: true, score: 0.6, explanation: "Error: 4.00% (max: 10%)" }
```

### Multi-Dimensional Custom Scorer

```typescript
class CourseRecommendationScorer implements Scorer {
  async score(
    expected: CourseRecommendation[],
    actual: CourseRecommendation[],
    config?: ScorerConfig
  ): Promise<Score> {
    // 1. Check if all expected courses are recommended
    const expectedCourseIds = expected.map(c => c.courseId);
    const actualCourseIds = actual.map(c => c.courseId);

    const recall = expectedCourseIds.filter(id =>
      actualCourseIds.includes(id)
    ).length / expectedCourseIds.length;

    // 2. Check if conflict detection is accurate
    let conflictAccuracy = 0;
    for (const exp of expected) {
      const act = actual.find(a => a.courseId === exp.courseId);
      if (act) {
        const expConflicts = new Set(exp.conflicts);
        const actConflicts = new Set(act.conflicts);
        const intersection = new Set([...expConflicts].filter(x => actConflicts.has(x)));
        conflictAccuracy += intersection.size / expConflicts.size;
      }
    }
    conflictAccuracy /= expected.length;

    // 3. Calculate overall score
    const overallScore = (recall * 0.7) + (conflictAccuracy * 0.3);
    const passed = overallScore >= 0.75;

    return {
      passed,
      score: overallScore,
      breakdown: {
        recall,
        conflictAccuracy,
      },
      explanation: `Recall: ${(recall * 100).toFixed(0)}%, Conflict accuracy: ${(conflictAccuracy * 100).toFixed(0)}%`,
    };
  }
}
```

### Async Custom Scorer with LLM

```typescript
class ToneAndQualityScorer implements Scorer {
  constructor(private llmClient: any) {}

  async score(
    expected: { tone: string; quality: string },
    actual: { answer: string },
    config?: ScorerConfig
  ): Promise<Score> {
    const prompt = `Evaluate the following response on two dimensions:
1. Tone: Should be "${expected.tone}"
2. Quality: Should be "${expected.quality}"

Response: "${actual.answer}"

Provide scores from 0-10 for each dimension and explain your reasoning.`;

    const response = await this.llmClient.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
    });

    // Parse LLM response (simplified)
    const evaluation = this.parseEvaluation(response.choices[0].message.content);

    const toneScore = evaluation.tone / 10;
    const qualityScore = evaluation.quality / 10;
    const overallScore = (toneScore + qualityScore) / 2;

    return {
      passed: overallScore >= 0.7,
      score: overallScore,
      breakdown: {
        tone: toneScore,
        quality: qualityScore,
      },
      explanation: evaluation.explanation,
    };
  }

  private parseEvaluation(text: string) {
    // Parse LLM output (implementation depends on format)
    return {
      tone: 8,
      quality: 9,
      explanation: 'Response has appropriate professional tone and high quality.',
    };
  }
}
```

## Baseline Management

### Creating and Setting Baseline

```typescript
async function setupBaseline() {
  const orchestrator = new EvalOrchestrator();

  // Run initial evaluation
  const report = await runCompleteEvaluation();

  // Store as baseline
  const baselineId = orchestrator.storeBaseline(
    'Production Baseline v1.0',
    'Baseline after initial production deployment',
    report.jobId,
    report.metrics
  );

  // Set as active baseline
  orchestrator.setActiveBaseline(baselineId);

  console.log(`Baseline created: ${baselineId}`);
  console.log(`Metrics: ${JSON.stringify(report.metrics, null, 2)}`);

  return baselineId;
}
```

### Detecting Regressions

```typescript
async function checkForRegressions(baselineId: string) {
  const orchestrator = new EvalOrchestrator();

  // Run current evaluation
  const currentReport = await runCompleteEvaluation();

  // Compare to baseline
  const comparison = orchestrator.compareToBaseline(
    currentReport.metrics,
    currentReport.jobId,
    baselineId
  );

  // Check for critical regressions
  if (comparison.summary.criticalRegressions > 0) {
    console.error('❌ CRITICAL REGRESSIONS DETECTED!');

    comparison.regressions
      .filter(r => r.severity === 'critical')
      .forEach(regression => {
        console.error(`  Test: ${regression.testCaseId}`);
        console.error(`  Metric: ${regression.metric}`);
        console.error(`  Change: ${regression.percentChange.toFixed(2)}%`);
        console.error(`  Baseline: ${regression.baseline}`);
        console.error(`  Current: ${regression.current}`);
      });

    // Block deployment
    process.exit(1);
  } else if (comparison.summary.totalRegressions > 0) {
    console.warn('⚠️  Minor regressions detected');

    comparison.regressions.forEach(regression => {
      console.warn(`  ${regression.testCaseId}: ${regression.metric} ${regression.percentChange.toFixed(2)}%`);
    });
  } else {
    console.log('✅ No regressions detected');
  }

  // Report improvements
  if (comparison.summary.totalImprovements > 0) {
    console.log('🎉 Improvements detected:');
    comparison.improvements.forEach(improvement => {
      console.log(`  ${improvement.testCaseId}: ${improvement.metric} +${improvement.percentChange.toFixed(2)}%`);
    });
  }

  return comparison;
}
```

### Baseline Lifecycle

```typescript
async function manageBaselineLifecycle() {
  const orchestrator = new EvalOrchestrator();

  // 1. Create development baseline
  const devReport = await runCompleteEvaluation();
  const devBaseline = orchestrator.storeBaseline(
    'Development Baseline',
    'Baseline for dev environment',
    devReport.jobId,
    devReport.metrics
  );

  // 2. Promote to staging
  orchestrator.setActiveBaseline(devBaseline);
  const stagingReport = await runCompleteEvaluation();

  // 3. Compare and validate
  const comparison = orchestrator.compareToBaseline(
    stagingReport.metrics,
    stagingReport.jobId,
    devBaseline
  );

  if (comparison.summary.criticalRegressions === 0) {
    // 4. Create production baseline
    const prodBaseline = orchestrator.storeBaseline(
      'Production Baseline',
      'Promoted from staging',
      stagingReport.jobId,
      stagingReport.metrics
    );

    orchestrator.setActiveBaseline(prodBaseline);
    console.log('✅ Baseline promoted to production');
  } else {
    console.error('❌ Cannot promote: Critical regressions detected');
  }
}
```

## Advanced Patterns

### Parallel Execution with Progress Tracking

```typescript
async function parallelExecutionWithProgress() {
  const orchestrator = new EvalOrchestrator({
    workerConfig: {
      maxWorkers: 4,
      concurrency: 10,
      rateLimit: {
        requestsPerMinute: 100,
        tokensPerMinute: 100000,
      },
    },
  });

  const datasets = await loadMultipleDatasets();
  const jobId = orchestrator.createJob(/* ... */);

  // Monitor progress
  const progressInterval = setInterval(() => {
    const progress = orchestrator.getProgress(jobId);
    if (progress) {
      const percent = (progress.completedTests / progress.totalTests * 100).toFixed(1);
      console.log(`Progress: ${percent}% (${progress.completedTests}/${progress.totalTests})`);
    }
  }, 1000);

  const report = await orchestrator.executeJob(/* ... */);

  clearInterval(progressInterval);
  console.log('✅ Evaluation complete!');

  return report;
}
```

### Selective Test Execution

```typescript
async function runSelectiveTests() {
  const dataset = await datasetManager.loadDataset('compliance-eligibility');

  // Only run tests that failed in the last run
  const failedTestIds = await loadFailedTestIds();
  const testsToRun = dataset.testCases.filter(tc =>
    failedTestIds.includes(tc.id)
  );

  console.log(`Running ${testsToRun.length} failed tests`);

  const runner = new ComplianceRunner({ /* ... */ });
  const scorer = new ExactMatchScorer();

  for (const testCase of testsToRun) {
    const result = await runner.runTestCase(testCase);
    const score = await scorer.score(result.expected, result.actual);

    if (score.passed) {
      console.log(`✅ ${testCase.id} now passing`);
    } else {
      console.log(`❌ ${testCase.id} still failing`);
    }
  }
}
```

### Cost-Optimized Evaluation

```typescript
async function costOptimizedEvaluation() {
  // Use tiered scoring: cheap first, expensive only if needed
  const cheapScorer = new SemanticSimilarityScorer({
    threshold: 0.85,
  });

  const expensiveScorer = new LLMJudgeScorer({
    judgeModel: 'gpt-4-turbo',
  });

  const dataset = await datasetManager.loadDataset('conversational-ai');
  const runner = new ConversationalRunner({ /* ... */ });

  let totalCost = 0;
  let cheapScoringCount = 0;
  let expensiveScoringCount = 0;

  for (const testCase of dataset.testCases) {
    const result = await runner.runTestCase(testCase);
    totalCost += result.metadata.cost;

    // Try cheap scorer first
    const cheapScore = await cheapScorer.score(
      result.expected.answer,
      result.actual.answer
    );

    if (cheapScore.passed) {
      cheapScoringCount++;
      continue; // No need for expensive scoring
    }

    // Use expensive scorer for unclear cases
    const expensiveScore = await expensiveScorer.score(
      result.expected,
      result.actual
    );

    expensiveScoringCount++;
    totalCost += 0.01; // Approximate LLM judge cost
  }

  console.log(`Total cost: $${totalCost.toFixed(4)}`);
  console.log(`Cheap scoring: ${cheapScoringCount} tests`);
  console.log(`Expensive scoring: ${expensiveScoringCount} tests`);
}
```

## Integration Examples

### CI/CD Integration

```typescript
// .github/workflows/ai-evals.yml equivalent in code

async function cicdEvaluation() {
  try {
    // 1. Load baseline
    const orchestrator = new EvalOrchestrator();
    const baseline = orchestrator.getActiveBaseline();

    if (!baseline) {
      console.error('No baseline found. Create one first.');
      process.exit(1);
    }

    // 2. Run evaluation
    const report = await runCompleteEvaluation();

    // 3. Compare to baseline
    const comparison = orchestrator.compareToBaseline(
      report.metrics,
      report.jobId,
      baseline.id
    );

    // 4. Generate summary
    const summary = `
## AI Evaluation Results

**Status**: ${comparison.summary.criticalRegressions === 0 ? '✅ PASSED' : '❌ FAILED'}

### Metrics
- **Accuracy**: ${report.summary.accuracy.toFixed(2)}%
- **Total Tests**: ${report.summary.totalTests}
- **Passed**: ${report.summary.passed}
- **Failed**: ${report.summary.failed}
- **Cost**: $${report.summary.totalCost.toFixed(4)}

### Regressions
- **Critical**: ${comparison.summary.criticalRegressions}
- **Major**: ${comparison.summary.majorRegressions}
- **Minor**: ${comparison.summary.minorRegressions}

${comparison.regressions.length > 0 ? '### Details\n' + comparison.regressions.map(r =>
  `- **${r.testCaseId}**: ${r.metric} ${r.percentChange.toFixed(2)}% (${r.severity})`
).join('\n') : ''}
    `.trim();

    // 5. Post to PR (GitHub API)
    await postGitHubComment(summary);

    // 6. Set status
    if (comparison.summary.criticalRegressions > 0) {
      console.error('Critical regressions detected. Blocking deployment.');
      process.exit(1);
    } else {
      console.log('Evaluation passed!');
      process.exit(0);
    }
  } catch (error) {
    console.error('Evaluation failed:', error);
    process.exit(1);
  }
}
```

### Scheduled Monitoring

```typescript
async function scheduledMonitoring() {
  // Run daily at 2 AM
  cron.schedule('0 2 * * *', async () => {
    console.log('Running scheduled evaluation...');

    const report = await runCompleteEvaluation();

    // Check for degradation
    const baseline = orchestrator.getActiveBaseline();
    const comparison = orchestrator.compareToBaseline(
      report.metrics,
      report.jobId,
      baseline?.id
    );

    if (comparison.summary.criticalRegressions > 0) {
      // Send alert
      await sendSlackAlert({
        channel: '#ai-alerts',
        text: `🚨 Critical regression detected in AI models!`,
        attachments: [{
          color: 'danger',
          fields: comparison.regressions.map(r => ({
            title: r.testCaseId,
            value: `${r.metric}: ${r.percentChange.toFixed(2)}% drop`,
            short: true,
          })),
        }],
      });
    }

    // Save report
    await saveReportToS3(report);
  });
}
```

---

**Last Updated**: 2025-01-08
**Framework Version**: 1.0.0
