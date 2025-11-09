# AI Evaluation Orchestrator

Comprehensive orchestration system for AI evaluation jobs implementing Tasks 5.1-5.4 of the AI Evaluation Framework.

## Overview

The orchestrator coordinates all aspects of evaluation execution:

- **Job Management** (Task 5.1): Creation, queuing, status tracking, and cancellation
- **Parallel Execution** (Task 5.2): Concurrent test execution with rate limiting
- **Baseline Comparison** (Task 5.3): Regression detection and severity classification
- **Report Generation** (Task 5.4): Comprehensive reporting with actionable recommendations

## Components

### 1. Job Manager (`job-manager.ts`)

Manages the complete lifecycle of evaluation jobs.

**Key Features:**
- Job creation with configurable parameters
- FIFO queue system with status tracking (pending, running, completed, failed, cancelled)
- Real-time progress tracking with time estimation
- Support for up to N concurrent jobs (configurable)
- Automatic cleanup of old jobs
- Error aggregation per job

**Usage Example:**
```typescript
import { JobManager } from './orchestrator';

const jobManager = new JobManager(5); // max 5 concurrent jobs

// Create a new job
const jobId = jobManager.createJob({
  datasetIds: ['compliance-dataset-1', 'advising-dataset-2'],
  runnerConfigs: [
    { modelId: 'openai/gpt-4', temperature: 0.7 },
    { modelId: 'anthropic/claude-sonnet-4', temperature: 0.7 },
  ],
  scorerConfig: { strategy: 'llm-judge', threshold: 0.7 },
  baseline: 'baseline-12345',
  parallel: true,
  concurrency: 10,
});

// Track progress
const progress = jobManager.getProgress(jobId);
console.log(`Progress: ${progress.progress}%`);
console.log(`ETA: ${progress.estimatedTimeRemaining}ms`);

// Cancel if needed
await jobManager.cancelJob(jobId);

// Get queue stats
const stats = jobManager.getQueueStats();
console.log(`Running: ${stats.running}, Pending: ${stats.pending}`);
```

### 2. Parallel Executor (`parallel-executor.ts`)

Executes test cases in parallel with configurable concurrency and intelligent rate limiting.

**Key Features:**
- Configurable worker pool for parallel execution
- Automatic rate limiting (requests per minute, tokens per minute)
- Real-time progress events (start, taskComplete, taskError, throttle, complete)
- Retry logic for transient errors
- Execution metrics (efficiency, utilization, throttle time)
- CPU-intensive worker pool for scoring operations

**Usage Example:**
```typescript
import { ParallelExecutor, ScoringWorkerPool } from './orchestrator';

const executor = new ParallelExecutor({
  maxWorkers: 4,
  concurrency: 10,
  rateLimit: {
    requestsPerMinute: 60,
    tokensPerMinute: 150000,
  },
});

// Listen to events
executor.on('taskComplete', ({ taskId, progress }) => {
  console.log(`Task ${taskId} complete. Overall progress: ${progress}%`);
});

executor.on('throttle', ({ reason, waitTime }) => {
  console.log(`Rate limited (${reason}), waiting ${waitTime}ms`);
});

// Execute tasks
const results = await executor.executeTasks(tasks, async (task) => {
  // Your task execution logic
  return await runTestCase(task);
});

// Get execution metrics
const metrics = executor.getMetrics();
console.log(`Parallel efficiency: ${metrics.parallelEfficiency * 100}%`);
console.log(`Worker utilization: ${metrics.workerUtilization * 100}%`);
console.log(`Time spent throttled: ${metrics.throttleTime}ms`);

// Use worker pool for CPU-intensive scoring
const scoringPool = new ScoringWorkerPool(4);
const scoreResult = await scoringPool.execute(async () => {
  return await computeExpensiveScore(result);
});
```

### 3. Baseline Comparator (`baseline-comparator.ts`)

Detects performance regressions by comparing current results to established baselines.

**Key Features:**
- Baseline storage and retrieval
- Active baseline management
- Configurable regression thresholds (critical, major, minor)
- Multi-metric comparison (accuracy, latency, cost, etc.)
- Category-specific regression detection
- Overall performance change calculation (weighted average)

**Usage Example:**
```typescript
import { BaselineComparator } from './orchestrator';

const comparator = new BaselineComparator({
  // Custom thresholds (optional)
  accuracy: { critical: 15, major: 7, minor: 3 },
  avgLatency: { critical: 60, major: 30, minor: 15 },
});

// Store a baseline
const baselineId = comparator.storeBaseline({
  name: 'GPT-4 v1.0',
  description: 'Initial GPT-4 baseline after prompt optimization',
  runId: 'run-abc123',
  metrics: currentMetrics,
});

// Set as active baseline
comparator.setActiveBaseline(baselineId);

// Compare new run to baseline
const comparison = comparator.compareToBaseline(
  newMetrics,
  'run-xyz789'
  // baselineId is optional, uses active baseline if omitted
);

// Analyze results
console.log(`Total regressions: ${comparison.summary.totalRegressions}`);
console.log(`Critical: ${comparison.summary.criticalRegressions}`);
console.log(`Overall change: ${comparison.summary.overallChange.toFixed(1)}%`);

// Review specific regressions
for (const regression of comparison.regressions) {
  if (regression.severity === 'critical') {
    console.log(`CRITICAL: ${regression.metric} dropped from ${regression.baseline} to ${regression.current} (${regression.percentChange.toFixed(1)}%)`);
  }
}

// Update thresholds if needed
comparator.updateThresholds('accuracy', {
  critical: 20,
  major: 10,
  minor: 5,
});
```

**Default Regression Thresholds:**
- **Accuracy**: Critical 10%, Major 5%, Minor 2%
- **Pass Rate**: Critical 10%, Major 5%, Minor 2%
- **Avg Score**: Critical 15%, Major 8%, Minor 3%
- **Avg Latency**: Critical 50%, Major 25%, Minor 10% (higher is worse)
- **Total Cost**: Critical 40%, Major 20%, Minor 10% (higher is worse)

### 4. Report Generator (`report-generator.ts`)

Creates comprehensive evaluation reports with metrics, regressions, and actionable recommendations.

**Key Features:**
- Summary statistics (accuracy, latency, cost, pass rate)
- Category-specific breakdowns
- Regression highlighting
- Actionable recommendations based on results
- Export in multiple formats (JSON, CSV, HTML)

**Usage Example:**
```typescript
import { ReportGenerator } from './orchestrator';

const reportGen = new ReportGenerator();

// Generate report
const report = reportGen.generateReport({
  jobId: 'job-123',
  runSummaries: runSummaries,
  scoringResults: scoringResults,
  regressions: regressions,
  executionMetrics: executionMetrics,
  status: 'completed',
});

// Review summary
console.log(`Accuracy: ${report.summary.accuracy.toFixed(1)}%`);
console.log(`Avg Latency: ${report.summary.avgLatency.toFixed(0)}ms`);
console.log(`Total Cost: $${report.summary.totalCost.toFixed(4)}`);

// Check recommendations
for (const rec of report.recommendations) {
  console.log(`[${rec.severity.toUpperCase()}] ${rec.title}`);
  console.log(rec.description);
  if (rec.suggestedActions) {
    rec.suggestedActions.forEach((action) => console.log(`  - ${action}`));
  }
}

// Export in different formats
const jsonReport = reportGen.exportReport(report, {
  format: 'json',
  includeDetails: true,
  includeRecommendations: true,
});

const csvReport = reportGen.exportReport(report, {
  format: 'csv',
  includeDetails: true,
});

const htmlReport = reportGen.exportReport(report, {
  format: 'html',
  includeDetails: true,
  includeRecommendations: true,
});

// Save to file
import fs from 'fs';
fs.writeFileSync('eval-report.html', htmlReport);
```

**Recommendation Types:**
- **Regression**: Critical/major regressions detected
- **Accuracy**: Overall or category-specific accuracy issues
- **Performance**: High latency or poor parallel efficiency
- **Cost**: Expensive evaluation runs

### 5. Main Orchestrator (`index.ts`)

Ties all components together for end-to-end evaluation execution.

**Usage Example:**
```typescript
import { EvalOrchestrator } from './orchestrator';

const orchestrator = new EvalOrchestrator({
  maxConcurrentJobs: 5,
  workerConfig: {
    maxWorkers: 4,
    concurrency: 10,
    rateLimit: {
      requestsPerMinute: 60,
      tokensPerMinute: 150000,
    },
  },
});

// Create job
const jobId = orchestrator.createJob({
  datasetIds: ['compliance-1', 'advising-1'],
  runnerConfigs: [{ modelId: 'openai/gpt-4' }],
  scorerConfig: { strategy: 'exact' },
  baseline: 'baseline-xyz',
});

// Execute job with custom runner and scorer
const report = await orchestrator.executeJob(
  jobId,
  datasets,
  async (task) => {
    // Run test case
    return await myRunner.runTestCase(task.testCase, task.runnerConfig);
  },
  async (result, scorerConfig) => {
    // Score result
    return await myScorer.score(result, scorerConfig);
  }
);

// Store as new baseline if good
if (report.summary.accuracy > 90 && report.regressions.length === 0) {
  const baselineId = orchestrator.storeBaseline(
    'GPT-4 v2.0',
    'Updated baseline after improvements',
    report.jobId,
    report.metrics
  );
  orchestrator.setActiveBaseline(baselineId);
}

// Export report
const htmlReport = orchestrator.exportReport(report, {
  format: 'html',
  includeDetails: true,
  includeRecommendations: true,
});
```

## Architecture

```
                                                             
                    EvalOrchestrator                         
  Coordinates all evaluation operations                     
                                                             
                             
                            <                   
                                               
         ¼                   ¼                   ¼
                                                     
  Job Manager      Parallel          Baseline        
                   Executor          Comparator      
 - Create jobs                                       
 - Queue mgmt      - Parallel exec   - Store         
 - Status track    - Rate limiting   - Compare       
 - Progress        - Worker pool     - Detect        
 - Cancellation    - Metrics           regressions   
                                                     
                                               
                            <                   
                             ¼
                                       
                    Report Generator   
                                       
                   - Calculate metrics 
                   - Recommendations   
                   - Export formats    
                                       
```

## Performance Characteristics

### Parallel Execution
- **Efficiency**: Typically 60-90% parallel efficiency depending on rate limits
- **Concurrency**: Configurable, typically 5-20 concurrent test cases
- **Throughput**: ~100 test cases in 10 minutes at 60 req/min rate limit

### Rate Limiting
- **Request-based**: Prevents API throttling
- **Token-based**: Manages costs and quotas
- **Smart throttling**: Waits exactly the minimum time needed

### Memory Usage
- **Job storage**: ~1KB per job
- **Progress tracking**: ~500 bytes per job
- **Baseline storage**: ~10KB per baseline

## Error Handling

The orchestrator implements comprehensive error handling:

1. **Transient Errors**: Automatic retry with exponential backoff
2. **Fatal Errors**: Job marked as failed, error details stored
3. **Graceful Degradation**: Single test failures don't stop entire job
4. **Error Aggregation**: All errors collected for analysis

## Integration with Runners and Scorers

The orchestrator is designed to work with any runner and scorer implementations:

```typescript
// Example integration
const orchestrator = new EvalOrchestrator();

// Use with compliance runner
import { ComplianceRunner } from '../runners/compliance-runner';
const complianceRunner = new ComplianceRunner();

const jobId = orchestrator.createJob({
  datasetIds: ['compliance-tests'],
  runnerConfigs: [{ modelId: 'openai/gpt-4' }],
  scorerConfig: { strategy: 'exact' },
});

const report = await orchestrator.executeJob(
  jobId,
  datasets,
  (task) => complianceRunner.runTestCase(task.testCase, task.runnerConfig),
  (result, config) => exactMatchScorer.score(result, config)
);
```

## Best Practices

1. **Job Configuration**
   - Set realistic concurrency based on rate limits
   - Use baseline comparison for regression detection
   - Choose appropriate scorer strategy for use case

2. **Rate Limiting**
   - Configure conservative limits to avoid throttling
   - Monitor throttle events and adjust if needed
   - Account for token limits, not just request limits

3. **Baseline Management**
   - Store baselines after significant improvements
   - Update active baseline regularly
   - Use descriptive names and version tracking

4. **Report Usage**
   - Review recommendations, especially high severity
   - Export reports for team sharing and auditing
   - Track metrics over time to identify trends

5. **Error Handling**
   - Review failed tests to identify patterns
   - Distinguish between test failures and execution errors
   - Use error logs for debugging

## Testing

Each component includes comprehensive unit tests:

```bash
# Run orchestrator tests
npm test -- orchestrator

# Test specific component
npm test -- job-manager
npm test -- parallel-executor
npm test -- baseline-comparator
npm test -- report-generator
```

## Future Enhancements

- **Database persistence**: Store jobs and baselines in database
- **Distributed execution**: Support for distributed worker pools
- **Real-time streaming**: Live progress updates via WebSockets
- **Advanced scheduling**: Cron-based recurring evaluations
- **Multi-tenant support**: Isolated job queues per tenant
