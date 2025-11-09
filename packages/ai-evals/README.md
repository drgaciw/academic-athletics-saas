# AI Evaluation Framework (@aah/ai-evals)

Comprehensive evaluation system for AI agents and models in the Athletic Academics Hub platform.

## Features

- **Dataset Management**: Create, load, and manage test datasets with versioning
- **Multiple Scorers**: Exact match, semantic similarity, LLM-as-judge, and custom scorers
- **Model Comparison**: Compare different models and configurations side-by-side
- **Baseline Tracking**: Track performance over time and detect regressions
- **Compliance Testing**: Ensure FERPA and NCAA compliance
- **Safety Testing**: Test for prompt injection, PII leakage, and jailbreaks
- **CLI Interface**: Run evaluations from command line
- **Dashboard**: Web interface for viewing results and managing datasets
- **CI/CD Integration**: Automated testing in GitHub Actions

## Installation

```bash
cd packages/ai-evals
pnpm install
```

## Quick Start

### 1. Create a Dataset

```typescript
import { createDataset } from '@aah/ai-evals'

const dataset = await createDataset({
  id: 'compliance-basic',
  name: 'NCAA Compliance - Basic',
  description: 'Basic NCAA Division I eligibility checks',
  version: '1.0.0',
  testCases: [
    {
      id: 'test-1',
      name: 'Initial Eligibility - Pass',
      input: 'Check eligibility for student with 3.5 GPA and 16 core courses',
      expected: { eligible: true, status: 'ELIGIBLE' },
      category: 'compliance',
      difficulty: 2,
    },
    // ... more test cases
  ],
})
```

### 2. Run Evaluation (Coming Soon)

```typescript
import { runEvaluation } from '@aah/ai-evals'

const report = await runEvaluation({
  datasetId: 'compliance-basic',
  modelConfig: {
    provider: 'openai',
    model: 'gpt-4',
    temperature: 0,
  },
  scorerConfig: {
    type: 'exact-match',
  },
})

console.log(`Pass rate: ${report.metrics.passRate * 100}%`)
```

### 3. Compare Models (Coming Soon)

```typescript
import { compareModels } from '@aah/ai-evals'

const comparison = await compareModels({
  datasetId: 'compliance-basic',
  models: [
    { provider: 'openai', model: 'gpt-4' },
    { provider: 'openai', model: 'gpt-4-mini' },
    { provider: 'anthropic', model: 'claude-3-5-sonnet-20241022' },
  ],
})
```

## CLI Usage (Coming Soon)

```bash
# Run evaluation
pnpm eval --dataset compliance-basic --model gpt-4

# Compare models
pnpm compare --dataset compliance-basic --models gpt-4,gpt-4-mini,claude-3-5-sonnet

# Generate report
pnpm report --run-id abc123 --format html --output report.html
```

## Dataset Structure

```json
{
  "id": "compliance-basic",
  "name": "NCAA Compliance - Basic",
  "description": "Basic NCAA Division I eligibility checks",
  "version": "1.0.0",
  "testCases": [
    {
      "id": "test-1",
      "name": "Initial Eligibility - Pass",
      "input": "Check eligibility for student with 3.5 GPA and 16 core courses",
      "expected": {
        "eligible": true,
        "status": "ELIGIBLE"
      },
      "category": "compliance",
      "difficulty": 2,
      "tags": ["initial-eligibility", "gpa", "core-courses"]
    }
  ],
  "metadata": {
    "createdAt": "2025-11-08T00:00:00Z",
    "updatedAt": "2025-11-08T00:00:00Z",
    "author": "AI Team"
  }
}
```

## Scorer Types

### Exact Match
Perfect for structured outputs (JSON, enums, classifications):
```typescript
{
  type: 'exact-match',
  threshold: 1.0
}
```

### Semantic Similarity
For natural language responses:
```typescript
{
  type: 'semantic-similarity',
  threshold: 0.85,
  params: {
    model: 'text-embedding-3-large'
  }
}
```

### LLM-as-Judge
For quality assessment:
```typescript
{
  type: 'llm-judge',
  threshold: 0.8,
  params: {
    rubric: 'accuracy, helpfulness, tone',
    model: 'gpt-4'
  }
}
```

### Custom
For domain-specific metrics:
```typescript
{
  type: 'custom',
  params: {
    scorerFunction: (expected, actual) => {
      // Custom scoring logic
      return { value: 0.9, passed: true }
    }
  }
}
```

## Roadmap

### Phase 1: Core Infrastructure ✅
- [x] Type definitions
- [x] Dataset manager
- [x] Package setup

### Phase 2: Runners & Scorers (In Progress)
- [ ] Base runner implementation
- [ ] Exact match scorer
- [ ] Semantic similarity scorer
- [ ] LLM-as-judge scorer
- [ ] Specialized runners (compliance, advising, etc.)

### Phase 3: Orchestration
- [ ] Eval orchestrator
- [ ] Parallel execution
- [ ] Baseline comparison
- [ ] Report generation

### Phase 4: Persistence
- [ ] Database schema
- [ ] Result storage
- [ ] Historical analysis

### Phase 5: CLI & Dashboard
- [ ] Command-line interface
- [ ] Web dashboard
- [ ] Report export

### Phase 6: CI/CD Integration
- [ ] GitHub Actions workflow
- [ ] PR status checks
- [ ] Deployment blocking

## Development

```bash
# Type check
pnpm type-check

# Build
pnpm build

# Run tests
pnpm test
```

## License

Proprietary - Athletic Academics Hub

## Support

For questions or issues, contact the AI Team.
