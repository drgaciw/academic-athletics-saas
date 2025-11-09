# Troubleshooting Guide

Common issues and solutions for the AI Evaluation Framework.

## Table of Contents

- [Setup and Installation Issues](#setup-and-installation-issues)
- [Configuration Problems](#configuration-problems)
- [Execution Errors](#execution-errors)
- [Scoring Issues](#scoring-issues)
- [Performance Problems](#performance-problems)
- [API and Network Errors](#api-and-network-errors)
- [Database and Storage Issues](#database-and-storage-issues)
- [Debugging Strategies](#debugging-strategies)

## Setup and Installation Issues

### Package Installation Fails

**Problem**: `npm install` fails with dependency errors

**Solution**:
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and lock file
rm -rf node_modules pnpm-lock.yaml

# Reinstall with force
pnpm install --force

# If still failing, check Node version
node --version  # Should be 18.x or higher
```

---

### TypeScript Compilation Errors

**Problem**: TypeScript fails to compile with type errors

**Solution**:
```bash
# Regenerate types
cd packages/ai-evals
npm run build

# Check TypeScript version
npx tsc --version  # Should be 5.x

# Clean build artifacts
rm -rf dist
npm run build
```

---

### Missing Environment Variables

**Problem**: `Error: OPENAI_API_KEY environment variable required`

**Solution**:
```bash
# Copy example env file
cp .env.example .env

# Edit and add your API keys
# Required variables:
# - OPENAI_API_KEY
# - ANTHROPIC_API_KEY (optional)
# - DATABASE_URL

# Verify environment variables
node -e "console.log(process.env.OPENAI_API_KEY ? 'Set' : 'Missing')"
```

---

## Configuration Problems

### Dataset Not Found

**Problem**: `Error: Dataset not found: compliance-eligibility`

**Solution**:
```typescript
// Check available datasets
const manager = new DatasetManager();
const datasets = await manager.listDatasets();
console.log('Available datasets:', datasets.map(d => d.id));

// Create dataset if missing
const dataset = await manager.createDataset({
  name: 'compliance-eligibility',
  description: 'Compliance eligibility tests',
  schema: { /* ... */ },
});
```

---

### Invalid Dataset Schema

**Problem**: `ValidationError: Test case does not match schema`

**Solution**:
```typescript
// Validate individual test case against schema
import { z } from 'zod';

const schema = z.object({
  studentId: z.string(),
  gpa: z.number(),
  creditHours: z.number(),
});

try {
  schema.parse(testCase.input);
} catch (error) {
  console.error('Schema validation failed:', error.errors);
  // Fix the test case based on error details
}
```

**Common schema mistakes**:
- Using string instead of number: `gpa: "2.5"` should be `gpa: 2.5`
- Missing required fields
- Wrong field names (case-sensitive)
- Array vs object confusion

---

### Configuration File Not Loaded

**Problem**: CLI ignores configuration file

**Solution**:
```bash
# Check config file location and name
ls -la ai-evals.config.yaml

# Explicitly specify config file
ai-evals run --config ./my-config.yaml

# Validate YAML syntax
npx js-yaml ai-evals.config.yaml

# Check for hidden characters or encoding issues
cat -A ai-evals.config.yaml
```

---

## Execution Errors

### Test Execution Timeout

**Problem**: `Error: Test execution timed out after 30000ms`

**Solution**:
```typescript
// Increase timeout in runner config
const runner = new ComplianceRunner({
  modelId: 'openai/gpt-4-turbo',
  timeout: 60000, // Increase to 60 seconds
  retries: 3,
});

// Or globally in orchestrator
const orchestrator = new EvalOrchestrator({
  workerConfig: {
    timeout: 60000,
  },
});
```

**When to increase timeout**:
- Complex prompts requiring longer processing
- Using slower models
- Large context windows
- Network latency issues

---

### Model Execution Fails

**Problem**: `Error: Model execution failed: 500 Internal Server Error`

**Diagnosis**:
```typescript
// Enable debug logging
process.env.DEBUG = 'ai-evals:*';

// Add detailed error handling
try {
  const result = await runner.runTestCase(testCase);
} catch (error) {
  console.error('Full error:', error);
  console.error('Test case:', JSON.stringify(testCase, null, 2));
  console.error('Runner config:', runner.config);
}
```

**Common causes**:
1. Invalid API credentials
2. Rate limiting
3. Malformed prompts
4. Model availability issues
5. Network problems

**Solutions**:
- Verify API key: `curl https://api.openai.com/v1/models -H "Authorization: Bearer $OPENAI_API_KEY"`
- Check API status: https://status.openai.com
- Reduce concurrency to avoid rate limits
- Add retry logic with exponential backoff

---

### Job Stuck in Running State

**Problem**: Job never completes, stuck at "running"

**Diagnosis**:
```typescript
// Check job progress
const progress = orchestrator.getProgress(jobId);
console.log('Progress:', progress);

// Check for errors
const job = orchestrator.getJob(jobId);
console.log('Errors:', job?.errors);

// Check queue stats
const stats = orchestrator.getQueueStats();
console.log('Queue stats:', stats);
```

**Solutions**:
```typescript
// Cancel stuck job
await orchestrator.cancelJob(jobId);

// Re-run with lower concurrency
const newJobId = orchestrator.createJob({
  // ... config
  concurrency: 5, // Reduce from 10
});

// Add timeout to job execution
const timeoutPromise = new Promise((_, reject) =>
  setTimeout(() => reject(new Error('Job timeout')), 300000)
);

const report = await Promise.race([
  orchestrator.executeJob(jobId, datasets, runExecutor, scorer),
  timeoutPromise,
]);
```

---

## Scoring Issues

### Scores Don't Match Expectations

**Problem**: All tests fail even when outputs look correct

**Solution**:
```typescript
// Debug individual test case
const result = await runner.runTestCase(testCase);
console.log('Expected:', JSON.stringify(result.expected, null, 2));
console.log('Actual:', JSON.stringify(result.actual, null, 2));

const score = await scorer.score(result.expected, result.actual);
console.log('Score:', score);
console.log('Explanation:', score.explanation);

// Common issues:
// 1. Extra whitespace
const cleanExpected = result.expected.trim();
const cleanActual = result.actual.trim();

// 2. Different ordering
const sortedExpected = [...result.expected].sort();
const sortedActual = [...result.actual].sort();

// 3. Type mismatch (string vs number)
console.log('Types:', typeof result.expected, typeof result.actual);
```

---

### Semantic Similarity Scorer Always Fails

**Problem**: Semantic similarity scores are always low

**Diagnosis**:
```typescript
// Test embedding generation
const scorer = new SemanticSimilarityScorer();
const text1 = "Student must have 2.3 GPA";
const text2 = "Athletes need at least 2.3 grade point average";

const score = await scorer.score(text1, text2);
console.log('Similarity score:', score.score);

// If consistently low, check:
// 1. API key is valid
// 2. Embedding model is accessible
// 3. Texts are in same language
// 4. Threshold is appropriate
```

**Solution**:
```typescript
// Adjust threshold
const scorer = new SemanticSimilarityScorer({
  threshold: 0.75, // Lower from default 0.85
});

// Use different embedding model
const scorer = new SemanticSimilarityScorer({
  embeddingModel: 'text-embedding-3-large', // More accurate
});
```

---

### LLM Judge Scores Are Inconsistent

**Problem**: LLM judge gives different scores for same inputs

**Cause**: LLM judges have inherent randomness

**Solution**:
```typescript
// Use lower temperature for consistency
const scorer = new LLMJudgeScorer({
  judgeModel: 'gpt-4-turbo',
  temperature: 0.0, // Reduce from default
});

// Run multiple times and average
async function consistentScore(expected, actual) {
  const runs = 3;
  const scores = [];

  for (let i = 0; i < runs; i++) {
    const score = await scorer.score(expected, actual);
    scores.push(score.score);
  }

  const avgScore = scores.reduce((a, b) => a + b) / runs;
  return {
    score: avgScore,
    passed: avgScore >= 0.7,
    confidence: 1 - (Math.max(...scores) - Math.min(...scores)),
  };
}
```

---

## Performance Problems

### Evaluations Are Too Slow

**Problem**: Evaluations take hours to complete

**Diagnosis**:
```typescript
// Measure execution time per component
console.time('Dataset loading');
const dataset = await manager.loadDataset('compliance-eligibility');
console.timeEnd('Dataset loading');

console.time('Model execution');
const result = await runner.runTestCase(testCase);
console.timeEnd('Model execution');

console.time('Scoring');
const score = await scorer.score(result.expected, result.actual);
console.timeEnd('Scoring');
```

**Optimizations**:

1. **Increase Parallelism**:
```typescript
const orchestrator = new EvalOrchestrator({
  workerConfig: {
    maxWorkers: 8, // Increase workers
    concurrency: 20, // Increase concurrency
  },
});
```

2. **Enable Caching**:
```typescript
// Cache embeddings for semantic similarity
const embeddingCache = new Map();

class CachedSemanticSimilarityScorer extends SemanticSimilarityScorer {
  async score(expected, actual) {
    const cacheKey = `${expected}|${actual}`;
    if (embeddingCache.has(cacheKey)) {
      return embeddingCache.get(cacheKey);
    }
    const score = await super.score(expected, actual);
    embeddingCache.set(cacheKey, score);
    return score;
  }
}
```

3. **Optimize Dataset Loading**:
```typescript
// Use lazy loading for large datasets
const dataset = await manager.loadDataset('large-dataset', {
  lazy: true,
});

// Process in chunks
const chunkSize = 100;
for (let i = 0; i < dataset.testCases.length; i += chunkSize) {
  const chunk = dataset.testCases.slice(i, i + chunkSize);
  await processChunk(chunk);
}
```

---

### High Memory Usage

**Problem**: Process runs out of memory

**Solution**:
```typescript
// Monitor memory usage
setInterval(() => {
  const usage = process.memoryUsage();
  console.log(`Memory: ${(usage.heapUsed / 1024 / 1024).toFixed(2)} MB`);
}, 5000);

// Process in smaller batches
const BATCH_SIZE = 50;
for (let i = 0; i < testCases.length; i += BATCH_SIZE) {
  const batch = testCases.slice(i, i + BATCH_SIZE);
  await processBatch(batch);

  // Force garbage collection (with --expose-gc flag)
  if (global.gc) {
    global.gc();
  }
}

// Run with increased memory
// node --max-old-space-size=4096 ./cli.js run
```

---

### Rate Limiting Issues

**Problem**: `Error: Rate limit exceeded`

**Solution**:
```typescript
// Configure rate limiting
const orchestrator = new EvalOrchestrator({
  workerConfig: {
    rateLimit: {
      requestsPerMinute: 50, // Reduce from 100
      tokensPerMinute: 50000, // Add token limit
    },
  },
});

// Add exponential backoff
async function executeWithBackoff(fn, maxRetries = 5) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.message.includes('rate limit')) {
        const delay = Math.pow(2, i) * 1000;
        console.log(`Rate limited. Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
  throw new Error('Max retries exceeded');
}
```

---

## API and Network Errors

### Connection Refused

**Problem**: `Error: connect ECONNREFUSED`

**Diagnosis**:
```bash
# Check network connectivity
ping api.openai.com

# Check DNS resolution
nslookup api.openai.com

# Test API endpoint
curl -I https://api.openai.com/v1/models

# Check firewall/proxy settings
echo $HTTP_PROXY
echo $HTTPS_PROXY
```

**Solution**:
```typescript
// Configure proxy if needed
const runner = new ComplianceRunner({
  modelId: 'openai/gpt-4-turbo',
  additionalParams: {
    httpAgent: new HttpsProxyAgent(process.env.HTTP_PROXY),
  },
});

// Use alternative endpoint if available
process.env.OPENAI_BASE_URL = 'https://alternative-endpoint.com/v1';
```

---

### SSL Certificate Errors

**Problem**: `Error: unable to verify the first certificate`

**NOT RECOMMENDED - Security Risk**:
```typescript
// Temporary workaround for development only
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
```

**Proper Solution**:
```bash
# Update CA certificates
sudo apt-get update
sudo apt-get install ca-certificates

# Or use custom CA bundle
export NODE_EXTRA_CA_CERTS=/path/to/ca-bundle.crt
```

---

## Database and Storage Issues

### Dataset File Corruption

**Problem**: `Error: Unexpected token in JSON`

**Solution**:
```bash
# Validate JSON syntax
jq . datasets/compliance-eligibility.json

# If corrupted, restore from backup
cp datasets/.backup/compliance-eligibility.json datasets/

# Or recreate from source
npm run datasets:rebuild
```

---

### Database Connection Errors

**Problem**: `Error: Connection terminated unexpectedly`

**Diagnosis**:
```typescript
// Test database connection
import { prisma } from '@aah/database';

try {
  await prisma.$connect();
  console.log('Database connected');

  const result = await prisma.$queryRaw`SELECT 1`;
  console.log('Query successful:', result);
} catch (error) {
  console.error('Database error:', error);
} finally {
  await prisma.$disconnect();
}
```

**Solution**:
```bash
# Check DATABASE_URL environment variable
echo $DATABASE_URL

# Test connection with psql
psql $DATABASE_URL

# Verify Prisma schema is up to date
cd packages/database
npm run db:generate
```

---

## Debugging Strategies

### Enable Debug Logging

```bash
# Enable all debug logs
export DEBUG=ai-evals:*

# Enable specific components
export DEBUG=ai-evals:runner,ai-evals:scorer

# Run with verbose output
ai-evals run --verbose
```

---

### Isolate the Problem

```typescript
// Test each component individually

// 1. Test dataset loading
const dataset = await manager.loadDataset('compliance-eligibility');
console.log('Dataset loaded:', dataset.testCases.length, 'tests');

// 2. Test single runner
const runner = new ComplianceRunner(config);
const result = await runner.runTestCase(dataset.testCases[0]);
console.log('Runner result:', result);

// 3. Test scorer
const scorer = new ExactMatchScorer();
const score = await scorer.score(result.expected, result.actual);
console.log('Score:', score);

// 4. Test orchestrator
const orchestrator = new EvalOrchestrator();
const jobId = orchestrator.createJob(jobConfig);
console.log('Job created:', jobId);
```

---

### Use Minimal Reproduction

```typescript
// Create minimal test case
const minimalTest: TestCase = {
  id: 'debug-001',
  input: { studentId: 'TEST', gpa: 2.5, creditHours: 24 },
  expected: { eligible: true, issues: [] },
  metadata: {
    difficulty: 'easy',
    category: 'debug',
    tags: ['debug'],
    createdAt: new Date(),
    source: 'synthetic',
  },
};

// Run with detailed logging
try {
  console.log('Input:', JSON.stringify(minimalTest.input, null, 2));
  const result = await runner.runTestCase(minimalTest);
  console.log('Output:', JSON.stringify(result.actual, null, 2));
  console.log('Metadata:', result.metadata);
} catch (error) {
  console.error('Error:', error);
  console.error('Stack:', error.stack);
}
```

---

### Check Dependencies

```bash
# List installed versions
npm list @aah/ai-evals
npm list openai
npm list @anthropic-ai/sdk

# Check for security vulnerabilities
npm audit

# Update dependencies
npm update

# Verify peer dependencies
npm ls --depth=0
```

---

### Common Error Messages

| Error Message | Likely Cause | Solution |
|---------------|--------------|----------|
| `ENOENT: no such file or directory` | Missing dataset file | Create dataset or check path |
| `ValidationError: Test case...` | Schema mismatch | Fix test case to match schema |
| `Error: 401 Unauthorized` | Invalid API key | Check environment variables |
| `Error: 429 Too Many Requests` | Rate limit exceeded | Reduce concurrency or add delays |
| `Error: ETIMEDOUT` | Network timeout | Increase timeout or check connection |
| `Error: Prisma Client...` | Database issue | Run `npm run db:generate` |
| `TypeError: Cannot read property...` | Null/undefined value | Add null checks or default values |

---

### Getting Help

If you're still stuck:

1. **Check existing issues**: https://github.com/your-org/athletic-academics-hub/issues
2. **Search documentation**: Use Ctrl+F in docs
3. **Enable debug mode**: `DEBUG=ai-evals:* ai-evals run`
4. **Create minimal reproduction**: Isolate the problem
5. **Ask for help**: Post in #ai-evals Slack channel with:
   - Framework version
   - Node.js version
   - Full error message
   - Minimal code to reproduce
   - What you've already tried

---

**Last Updated**: 2025-01-08
**Framework Version**: 1.0.0
