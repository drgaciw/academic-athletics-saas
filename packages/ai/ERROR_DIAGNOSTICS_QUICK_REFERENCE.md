# Error Diagnostics Agent - Quick Reference

## Quick Start

```typescript
import { createErrorDiagnosticsAgent, quickErrorAnalysis } from '@aah/ai'

// Quick analysis
const analysis = await quickErrorAnalysis(error, {
  service: 'compliance',
  userId: 'user123',
})

// Full agent
const agent = createErrorDiagnosticsAgent()
const result = await agent.analyzeError({ error, context })
```

## API Endpoints

| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/api/ai/error-diagnostics/analyze` | POST | Analyze specific error | User |
| `/api/ai/error-diagnostics/patterns` | POST | Detect error patterns | User |
| `/api/ai/error-diagnostics/fix` | POST | Get fix recommendation | User |
| `/api/ai/error-diagnostics/compliance-impact` | POST | Assess NCAA impact | User |
| `/api/ai/error-diagnostics/report` | POST | Generate error report | Admin |
| `/api/ai/error-diagnostics/ferpa-check` | POST | Validate FERPA | User |
| `/api/ai/error-diagnostics/predict` | POST | Predict errors | User |

## Common Use Cases

### 1. Analyze Error in Try-Catch

```typescript
try {
  await riskyOperation()
} catch (error) {
  const analysis = await quickErrorAnalysis(error, {
    service: 'compliance',
    userId: req.userId,
    correlationId: req.correlationId,
  })
  console.log('Analysis:', analysis.content)
}
```

### 2. Daily Pattern Detection

```typescript
// Cron job
const agent = createErrorDiagnosticsAgent()
const patterns = await agent.detectPatterns({
  timeRange: {
    start: new Date(Date.now() - 24 * 60 * 60 * 1000),
    end: new Date(),
  },
})
```

### 3. Validate FERPA Before Logging

```typescript
const agent = createErrorDiagnosticsAgent()
const validation = await agent.validateFERPACompliance({
  errorLogs: [{ message: error.message }],
  service: 'user',
})

if (!validation.content.includes('compliant')) {
  error.message = sanitizePII(error.message)
}
```

### 4. Pre-Deployment Check

```typescript
// CI/CD pipeline
const agent = createErrorDiagnosticsAgent()
const prediction = await agent.predictErrors({
  service: 'compliance',
  changes: { files: ['...'], description: '...' },
  deploymentTarget: 'production',
})

if (prediction.content.includes('HIGH RISK')) {
  throw new Error('Deployment blocked')
}
```

## Agent Methods

```typescript
const agent = createErrorDiagnosticsAgent()

// Analyze error
await agent.analyzeError({ error, context })

// Detect patterns
await agent.detectPatterns({ timeRange, services, minOccurrences })

// Suggest fix
await agent.suggestFix({ errorCode, errorMessage, service })

// Assess compliance impact
await agent.assessComplianceImpact({ error, affectedStudents, service })

// Validate FERPA
await agent.validateFERPACompliance({ errorLogs, service })

// Predict errors
await agent.predictErrors({ service, changes, deploymentTarget })

// Generate report
await agent.generateErrorReport({ timeRange, services, severity })
```

## Tools Available

1. **analyzeError** - Deep error analysis
2. **detectErrorPatterns** - Pattern detection
3. **getErrorHistory** - Historical data
4. **checkFERPACompliance** - PII validation
5. **assessNCAAComplianceImpact** - Compliance check
6. **generateFixRecommendation** - Fix generation

## Response Format

```typescript
{
  content: string,           // AI-generated analysis
  toolInvocations: [...],    // Tools used
  duration: number,          // Execution time (ms)
  cost: number,              // Cost in USD
  usage: {                   // Token usage
    promptTokens: number,
    completionTokens: number,
    totalTokens: number
  }
}
```

## Error Codes

| Code | Description |
|------|-------------|
| `ANALYSIS_ERROR` | Failed to analyze error |
| `PATTERN_DETECTION_ERROR` | Failed to detect patterns |
| `FIX_SUGGESTION_ERROR` | Failed to suggest fix |
| `COMPLIANCE_ASSESSMENT_ERROR` | Failed to assess compliance |
| `REPORT_GENERATION_ERROR` | Failed to generate report |
| `FERPA_VALIDATION_ERROR` | Failed to validate FERPA |
| `ERROR_PREDICTION_ERROR` | Failed to predict errors |

## Best Practices

### ✅ DO

- Provide rich error context (service, userId, correlationId)
- Validate FERPA compliance before logging
- Run pattern detection regularly (daily)
- Use pre-deployment checks in CI/CD
- Monitor Langfuse for traces

### ❌ DON'T

- Log PII without validation
- Ignore critical compliance impacts
- Skip error analysis in production
- Deploy without predictive checks
- Forget to sanitize error messages

## Performance

- **Latency**: 1-5 seconds per request
- **Cost**: $0.002-0.008 per request
- **Rate Limit**: 100 requests/minute
- **Token Limit**: 2M tokens/day

## Monitoring

View traces in Langfuse:
- https://cloud.langfuse.com/project/{project-id}/traces

Track metrics:
- Error analysis volume
- Pattern detection frequency
- Fix success rate
- FERPA violations detected
- NCAA compliance impacts

## Troubleshooting

### Agent not analyzing errors

```typescript
// Check tools are registered
import { getToolsForAgentType } from '@aah/ai'
const tools = getToolsForAgentType('error_diagnostics')
console.log('Tools:', tools.map(t => t.name))
```

### High cost

```typescript
// Implement caching
import { globalResponseCache } from '@aah/ai'
const cached = await globalResponseCache.getCachedResponse(...)
if (cached) return cached
```

### FERPA validation not working

```typescript
// Update PII patterns in checkFERPACompliance tool
const piiPatterns = {
  studentId: /\b[A-Z]\d{7}\b/g,
  ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
  // Add custom patterns
}
```

## Examples

See [ERROR_DIAGNOSTICS_GUIDE.md](./ERROR_DIAGNOSTICS_GUIDE.md) for detailed examples.

## Support

- [Full Guide](./ERROR_DIAGNOSTICS_GUIDE.md)
- [Implementation Summary](../../.kiro/specs/ai-agents-implementation/ERROR_DIAGNOSTICS_IMPLEMENTATION.md)
- [Agent Source](./agents/error-diagnostics-agent.ts)
- [Tools Source](./tools/error-diagnostics-tools.ts)

---

**Version**: 1.0.0  
**Last Updated**: November 8, 2025
