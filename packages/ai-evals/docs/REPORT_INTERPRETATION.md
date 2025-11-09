# Report Interpretation Guide

Learn how to read, understand, and act on evaluation reports.

## Table of Contents

- [Report Overview](#report-overview)
- [Key Metrics Explained](#key-metrics-explained)
- [Understanding Scores](#understanding-scores)
- [Identifying Regressions](#identifying-regressions)
- [Performance Analysis](#performance-analysis)
- [Making Decisions](#making-decisions)
- [Examples](#examples)

## Report Overview

### Report Structure

An evaluation report contains:

1. **Summary**: High-level metrics and status
2. **Detailed Results**: Per-test-case results
3. **Regressions**: Performance drops vs baseline
4. **Improvements**: Performance gains
5. **Recommendations**: Actionable next steps
6. **Execution Metrics**: Performance and cost data

### Sample Report

```json
{
  "jobId": "eval-20250108-001",
  "summary": {
    "totalTests": 50,
    "passed": 45,
    "failed": 5,
    "accuracy": 90.0,
    "avgLatency": 1234,
    "totalCost": 0.0523,
    "duration": 67890,
    "status": "completed"
  },
  "metrics": {
    "totalTests": 50,
    "passed": 45,
    "failed": 5,
    "accuracy": 90.0,
    "passRate": 90.0,
    "avgScore": 0.92,
    "avgLatency": 1234,
    "totalCost": 0.0523,
    "breakdown": { /* ... */ }
  },
  "regressions": [ /* ... */ ],
  "recommendations": [ /* ... */ ]
}
```

## Key Metrics Explained

### Accuracy Metrics

**Accuracy** (0-100%)
- **Definition**: Percentage of tests that passed
- **Formula**: `(passed / totalTests) * 100`
- **Good**: >95%
- **Acceptable**: 90-95%
- **Needs Attention**: <90%

**Pass Rate** (0-100%)
- Same as accuracy, different terminology
- Used interchangeably

**Average Score** (0.0-1.0)
- **Definition**: Mean score across all tests
- **Interpretation**:
  - 0.95-1.0: Excellent
  - 0.85-0.95: Good
  - 0.75-0.85: Fair
  - <0.75: Needs improvement

### Performance Metrics

**Average Latency** (milliseconds)
- **Definition**: Mean response time per test
- **Benchmarks**:
  - <1000ms: Fast
  - 1000-2000ms: Good
  - 2000-5000ms: Acceptable
  - >5000ms: Slow

**Total Cost** (USD)
- **Definition**: Sum of all API costs
- **Per test**: Total cost / number of tests
- **Budget planning**: Track trends over time

**Duration** (milliseconds)
- **Definition**: Total time for all tests
- **Factors**: Parallelism, latency, retries

### Breakdown Metrics

**By Category**

```json
{
  "byCategory": {
    "continuing-eligibility": {
      "totalTests": 20,
      "passed": 19,
      "accuracy": 95.0,
      "avgScore": 0.96
    },
    "initial-eligibility": {
      "totalTests": 15,
      "passed": 13,
      "accuracy": 86.7,
      "avgScore": 0.89
    }
  }
}
```

**By Difficulty**

```json
{
  "byDifficulty": {
    "easy": {
      "totalTests": 20,
      "passed": 20,
      "passRate": 100.0
    },
    "medium": {
      "totalTests": 20,
      "passed": 18,
      "passRate": 90.0
    },
    "hard": {
      "totalTests": 10,
      "passed": 7,
      "passRate": 70.0
    }
  }
}
```

**Interpretation**:
- Easy tests should have ~100% pass rate
- Medium tests: 90-95% pass rate
- Hard tests: 70-85% pass rate acceptable

## Understanding Scores

### Score Types

#### Exact Match (0 or 1)

```json
{
  "passed": true,
  "score": 1.0,
  "explanation": "Exact match"
}
```

- **Binary**: Either matches exactly or doesn't
- **Best for**: Structured outputs (JSON, enums)

#### Semantic Similarity (0.0-1.0)

```json
{
  "passed": true,
  "score": 0.92,
  "confidence": 0.95,
  "explanation": "High semantic similarity (0.92)"
}
```

- **Continuous**: Similarity on scale
- **Threshold**: Typically 0.85
- **Best for**: Text responses

#### LLM Judge (0.0-1.0)

```json
{
  "passed": true,
  "score": 0.87,
  "breakdown": {
    "accuracy": 0.9,
    "helpfulness": 0.85,
    "clarity": 0.86
  },
  "explanation": "Strong response with minor clarity issues..."
}
```

- **Multi-dimensional**: Multiple criteria
- **Subjective**: Based on LLM evaluation
- **Best for**: Quality assessment

### Interpreting Borderline Scores

**Score: 0.84 (Threshold: 0.85)**
- Just below passing threshold
- Review manually
- May need threshold adjustment

**What to check**:
1. Is expected output too strict?
2. Is actual output acceptable despite low score?
3. Should threshold be lowered?

## Identifying Regressions

### Regression Structure

```json
{
  "testCaseId": "compliance-001",
  "metric": "accuracy",
  "baseline": 1.0,
  "current": 0.8,
  "percentChange": -20.0,
  "absoluteChange": -0.2,
  "severity": "major",
  "category": "continuing-eligibility"
}
```

### Severity Levels

**Critical**
- **Threshold**: >15% drop
- **Action**: Block deployment, fix immediately
- **Examples**:
  - Accuracy drops from 95% to 75%
  - Previously passing test now failing

**Major**
- **Threshold**: 10-15% drop
- **Action**: Investigate before deployment
- **Examples**:
  - Accuracy drops from 95% to 85%
  - Latency increases by 12%

**Minor**
- **Threshold**: 5-10% drop
- **Action**: Monitor, fix in next sprint
- **Examples**:
  - Accuracy drops from 95% to 90%
  - Cost increases by 8%

### Analyzing Regressions

**Step 1: Identify Pattern**
```
Are regressions:
- Isolated to specific category?
- Affecting specific difficulty level?
- Related to specific model change?
```

**Step 2: Review Failed Tests**
```typescript
// Filter failed tests
const failedTests = report.runSummaries
  .flatMap(run => run.results)
  .filter(result => !result.passed);

// Group by category
const byCategory = groupBy(failedTests, r => r.category);
```

**Step 3: Compare Outputs**
```
For each failed test:
- What was expected?
- What was actual?
- Why did it fail?
```

**Step 4: Root Cause**
```
Common causes:
- Prompt changes
- Model update
- Schema change
- Code regression
- Test case issue
```

## Performance Analysis

### Latency Analysis

**Comparing Latency Trends**

```
Baseline: 1200ms avg
Current: 1800ms avg
Change: +50%

Questions:
- Which tests are slower?
- Is it all tests or specific ones?
- Did model change?
- Network issues?
```

**By Test Category**

```
Category             | Baseline | Current | Change
---------------------|----------|---------|-------
Continuing Elig.     | 1100ms   | 1150ms  | +4.5%  ✅
Initial Elig.        | 1300ms   | 2400ms  | +85%   ❌
```

Analysis: Initial eligibility tests regressed significantly

### Cost Analysis

**Total Cost Trends**

```
Week 1: $1.20
Week 2: $1.25  (+4%)
Week 3: $1.80  (+44%)
Week 4: $1.75  (-3%)
```

**Red flags**:
- Sudden spikes (Week 3)
- Consistent upward trend

**Investigate**:
- Token usage increase
- More expensive model
- More test cases
- Retry increases

### Efficiency Metrics

**Parallel Efficiency**

```json
{
  "executionMetrics": {
    "parallelEfficiency": 0.75,
    "workerUtilization": 0.82
  }
}
```

- **0.9-1.0**: Excellent parallelization
- **0.7-0.9**: Good
- **<0.7**: Poor, increase workers

## Making Decisions

### Decision Matrix

| Accuracy | Regressions | Latency | Cost | Decision |
|----------|-------------|---------|------|----------|
| >95% | None | Good | Normal | ✅ Deploy |
| 90-95% | Minor | Good | Normal | ✅ Deploy with monitoring |
| 90-95% | Major | Good | Normal | ⚠️ Review before deploy |
| <90% | Any | Any | Any | ❌ Block deployment |
| Any | Critical | Any | Any | ❌ Block deployment |
| >95% | None | Poor | High | ⚠️ Optimize then deploy |

### Action Templates

**Scenario 1: Critical Regression**

```
Status: ❌ BLOCK DEPLOYMENT

Findings:
- 3 critical regressions detected
- Accuracy dropped from 95% to 78%
- Failures in compliance-eligibility category

Actions:
1. Rollback recent code changes
2. Review prompt modifications
3. Re-run tests on previous version
4. Fix root cause
5. Re-evaluate before deployment
```

**Scenario 2: Performance Degradation**

```
Status: ⚠️ REVIEW REQUIRED

Findings:
- Accuracy maintained at 94%
- Latency increased 65% (1200ms → 2000ms)
- Cost increased 40%

Actions:
1. Profile slow test cases
2. Check for model changes
3. Optimize prompts for token usage
4. Consider caching strategy
5. Set performance SLO
```

**Scenario 3: All Green**

```
Status: ✅ APPROVED FOR DEPLOYMENT

Findings:
- Accuracy: 96% (↑ from 95%)
- 2 improvements detected
- Latency stable
- Cost within budget

Actions:
1. Deploy to staging
2. Update baseline with current run
3. Document improvements
4. Share with team
```

## Examples

### Example 1: Reading a Full Report

```json
{
  "jobId": "eval-20250108-001",
  "summary": {
    "totalTests": 100,
    "passed": 92,
    "failed": 8,
    "accuracy": 92.0,
    "avgLatency": 1456,
    "totalCost": 0.0834,
    "status": "completed"
  },
  "regressions": [
    {
      "testCaseId": "compliance-gpa-edge-001",
      "metric": "accuracy",
      "baseline": 1.0,
      "current": 0.0,
      "percentChange": -100.0,
      "severity": "critical"
    }
  ],
  "recommendations": [
    {
      "type": "regression",
      "severity": "high",
      "title": "Critical regression in GPA validation",
      "description": "Test 'compliance-gpa-edge-001' now failing",
      "suggestedActions": [
        "Review recent prompt changes",
        "Verify GPA threshold logic",
        "Add more edge case tests"
      ]
    }
  ]
}
```

**Interpretation**:
1. **Overall**: 92% accuracy is below 95% target
2. **Critical Issue**: One test went from 100% to 0% (complete failure)
3. **Decision**: Block deployment
4. **Next Steps**: Follow recommendation to review GPA validation

### Example 2: Comparing Models

```json
{
  "summary": {
    "gpt-4-turbo": {
      "avgScore": 0.94,
      "avgLatency": 1200,
      "totalCost": 0.12,
      "winRate": 0.65
    },
    "claude-sonnet-4": {
      "avgScore": 0.91,
      "avgLatency": 900,
      "totalCost": 0.08,
      "winRate": 0.35
    }
  }
}
```

**Analysis**:
- **GPT-4 Turbo**: Higher accuracy, slower, more expensive, wins 65% of tests
- **Claude Sonnet 4**: Slightly lower accuracy, faster, cheaper

**Decision Framework**:
- If accuracy is critical: Use GPT-4 Turbo
- If cost/speed matters: Use Claude Sonnet 4
- Hybrid approach: Use Claude for simple, GPT-4 for complex

### Example 3: Trend Analysis

```
Run 1: 95% accuracy, $0.10 cost
Run 2: 94% accuracy, $0.11 cost
Run 3: 93% accuracy, $0.13 cost
Run 4: 91% accuracy, $0.16 cost
```

**Observations**:
- Declining accuracy trend
- Increasing cost trend

**Hypothesis**:
1. Model quality degrading?
2. Test cases getting harder?
3. More retry attempts?

**Investigation**:
- Review test case additions
- Check error rates
- Analyze token usage
- Compare model versions

---

**Last Updated**: 2025-01-08
**Framework Version**: 1.0.0
