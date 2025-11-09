# Error Diagnostics Agent - Implementation Guide

## Overview

The Error Diagnostics Agent is a specialized AI agent that analyzes errors across all microservices in the Athletic Academics Hub platform, provides root cause analysis, and suggests fixes while maintaining FERPA compliance and NCAA requirements.

## Features

### 1. Error Analysis
- Deep root cause identification
- Impact assessment (severity, affected users, services)
- NCAA compliance risk evaluation
- FERPA violation detection
- Cross-service dependency analysis

### 2. Pattern Detection
- Recurring error identification across services
- Trend analysis (increasing, stable, decreasing)
- Common root cause detection
- Systemic issue identification

### 3. Fix Recommendations
- Step-by-step fix instructions
- Code examples (TypeScript/Prisma/Next.js)
- Testing recommendations
- Deployment considerations
- Monitoring strategies

### 4. Compliance Validation
- FERPA compliance checking (PII exposure detection)
- NCAA compliance impact assessment
- Data integrity risk evaluation
- Required corrective actions

### 5. Predictive Analysis
- Error prediction from code changes
- Integration risk assessment
- Performance impact analysis
- Security concern identification

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Error Diagnostics Agent                    │
│                                                              │
│  • Analyzes errors across all services                      │
│  • Detects patterns and trends                              │
│  • Validates FERPA/NCAA compliance                          │
│  • Generates fix recommendations                            │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                  Error Diagnostics Tools                     │
│                                                              │
│  • analyzeError - Deep error analysis                       │
│  • detectErrorPatterns - Pattern detection                  │
│  • getErrorHistory - Historical data                        │
│  • checkFERPACompliance - PII validation                    │
│  • assessNCAAComplianceImpact - Compliance check            │
│  • generateFixRecommendation - Fix suggestions              │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    Data Sources                              │
│                                                              │
│  • Langfuse/Helicone - AI observability                     │
│  • Vercel Logs - Application logs                           │
│  • Sentry - Error tracking                                  │
│  • Database - Historical error data                         │
└─────────────────────────────────────────────────────────────┘
```

## API Endpoints

### POST /api/ai/error-diagnostics/analyze

Analyze a specific error with root cause and fix recommendations.

**Request**:
```json
{
  "errorMessage": "Database connection timeout",
  "stackTrace": "Error: timeout\n  at Connection.query...",
  "service": "compliance",
  "correlationId": "abc-123",
  "metadata": {
    "query": "SELECT * FROM students...",
    "duration": 30000
  },
  "userId": "user123"
}
```

**Response**:
```json
{
  "success": true,
  "analysis": {
    "errorId": "err-1699459200000",
    "service": "compliance",
    "response": "Root Cause: Database connection pool exhausted...",
    "toolsUsed": ["analyzeError", "getErrorHistory"],
    "duration": 2500,
    "cost": 0.003
  }
}
```

### POST /api/ai/error-diagnostics/patterns

Detect recurring error patterns across services.

**Request**:
```json
{
  "timeRange": {
    "start": "2024-11-01T00:00:00Z",
    "end": "2024-11-08T00:00:00Z"
  },
  "services": ["compliance", "advising"],
  "minOccurrences": 5
}
```

**Response**:
```json
{
  "success": true,
  "patterns": {
    "response": "Detected 3 recurring patterns:\n1. DATABASE_TIMEOUT (47 occurrences)...",
    "toolsUsed": ["detectErrorPatterns"],
    "duration": 3200,
    "cost": 0.005
  }
}
```

### POST /api/ai/error-diagnostics/fix

Get detailed fix recommendation with code examples.

**Request**:
```json
{
  "errorCode": "DB_TIMEOUT",
  "errorMessage": "Query execution timeout",
  "service": "compliance",
  "context": {
    "query": "Complex eligibility calculation",
    "affectedUsers": 15
  }
}
```

**Response**:
```json
{
  "success": true,
  "fix": {
    "response": "Fix Recommendation:\n1. Increase query timeout...\n\nCode Example:\n```typescript\n...",
    "toolsUsed": ["generateFixRecommendation"],
    "duration": 2800,
    "cost": 0.004
  }
}
```

### POST /api/ai/error-diagnostics/compliance-impact

Assess NCAA compliance impact of an error.

**Request**:
```json
{
  "errorMessage": "GPA calculation failed for student",
  "service": "compliance",
  "affectedStudents": ["S12345", "S67890"]
}
```

**Response**:
```json
{
  "success": true,
  "impact": {
    "response": "NCAA Compliance Impact:\nSeverity: CRITICAL\nAffected Areas: Eligibility tracking, GPA calculation...",
    "toolsUsed": ["assessNCAAComplianceImpact"],
    "duration": 1800,
    "cost": 0.002
  }
}
```

### POST /api/ai/error-diagnostics/report

Generate comprehensive error report (Admin only).

**Request**:
```json
{
  "timeRange": {
    "start": "2024-11-01T00:00:00Z",
    "end": "2024-11-08T00:00:00Z"
  },
  "services": ["compliance", "advising", "monitoring"],
  "severity": "high",
  "includeResolutions": true
}
```

**Response**:
```json
{
  "success": true,
  "report": {
    "response": "Error Report (Nov 1-8, 2024)\n\nExecutive Summary:\n- Total Errors: 127...",
    "toolsUsed": ["detectErrorPatterns", "getErrorHistory"],
    "duration": 5000,
    "cost": 0.008
  }
}
```

### POST /api/ai/error-diagnostics/ferpa-check

Validate error logs for FERPA compliance.

**Request**:
```json
{
  "errorLogs": [
    {
      "message": "Student S12345 not found in database",
      "metadata": { "query": "SELECT * FROM students WHERE id = 'S12345'" }
    },
    {
      "message": "Invalid email format: john.doe@university.edu"
    }
  ],
  "service": "user"
}
```

**Response**:
```json
{
  "success": true,
  "validation": {
    "response": "FERPA Compliance Violations Found:\n1. Student ID exposed in error message...",
    "toolsUsed": ["checkFERPACompliance"],
    "duration": 1500,
    "cost": 0.002
  }
}
```

### POST /api/ai/error-diagnostics/predict

Predict potential errors from code changes.

**Request**:
```json
{
  "service": "compliance",
  "changes": {
    "files": ["src/lib/eligibility.ts", "src/routes/check.ts"],
    "description": "Refactored eligibility calculation logic"
  },
  "deploymentTarget": "production"
}
```

**Response**:
```json
{
  "success": true,
  "prediction": {
    "response": "Potential Error Risks:\n1. Breaking change in eligibility API...",
    "toolsUsed": ["predictErrors"],
    "duration": 2200,
    "cost": 0.003
  }
}
```

## Usage Examples

### Example 1: Analyze Production Error

```typescript
import { createErrorDiagnosticsAgent } from '@aah/ai'

const agent = createErrorDiagnosticsAgent()

try {
  // Some operation that fails
  await prisma.student.findMany({ where: { ... } })
} catch (error) {
  // Analyze the error
  const analysis = await agent.analyzeError({
    error,
    context: {
      service: 'compliance',
      userId: 'user123',
      correlationId: 'req-abc-123',
    },
  })

  console.log('Error Analysis:', analysis.content)
  console.log('Tools Used:', analysis.toolInvocations.map(t => t.toolName))
}
```

### Example 2: Detect Patterns in Logs

```typescript
const agent = createErrorDiagnosticsAgent()

const patterns = await agent.detectPatterns({
  timeRange: {
    start: new Date('2024-11-01'),
    end: new Date('2024-11-08'),
  },
  services: ['compliance', 'advising'],
  minOccurrences: 5,
})

console.log('Error Patterns:', patterns.content)
```

### Example 3: Get Fix Recommendation

```typescript
const agent = createErrorDiagnosticsAgent()

const fix = await agent.suggestFix({
  errorCode: 'DB_TIMEOUT',
  errorMessage: 'Query execution timeout after 30 seconds',
  service: 'compliance',
  context: {
    query: 'Complex eligibility calculation',
    affectedUsers: 15,
  },
})

console.log('Fix Recommendation:', fix.content)
```

### Example 4: Validate FERPA Compliance

```typescript
const agent = createErrorDiagnosticsAgent()

const validation = await agent.validateFERPACompliance({
  errorLogs: [
    {
      message: 'Student S12345 not found',
      metadata: { query: 'SELECT * FROM students WHERE id = "S12345"' },
    },
  ],
  service: 'user',
})

console.log('FERPA Validation:', validation.content)
```

### Example 5: Assess NCAA Compliance Impact

```typescript
const agent = createErrorDiagnosticsAgent()

const impact = await agent.assessComplianceImpact({
  error: 'GPA calculation failed',
  service: 'compliance',
  affectedStudents: ['S12345', 'S67890'],
})

console.log('Compliance Impact:', impact.content)
```

## Integration with Existing Services

### 1. User Service

```typescript
// services/user/src/middleware/error-handler.ts
import { quickErrorAnalysis } from '@aah/ai'

export async function errorHandler(error: Error, context: any) {
  // Log error
  console.error('User service error:', error)

  // Analyze error with AI
  const analysis = await quickErrorAnalysis(error, {
    service: 'user',
    userId: context.userId,
    correlationId: context.correlationId,
  })

  // Log analysis
  console.log('AI Analysis:', analysis.content)

  // Return error response
  return {
    error: {
      code: 'USER_SERVICE_ERROR',
      message: error.message,
      analysisId: analysis.metadata?.errorId,
    },
  }
}
```

### 2. Compliance Service

```typescript
// services/compliance/src/lib/error-tracking.ts
import { createErrorDiagnosticsAgent } from '@aah/ai'

export async function trackComplianceError(error: Error, studentIds: string[]) {
  const agent = createErrorDiagnosticsAgent()

  // Assess NCAA compliance impact
  const impact = await agent.assessComplianceImpact({
    error,
    service: 'compliance',
    affectedStudents: studentIds,
  })

  // If critical, notify compliance officer
  if (impact.content.includes('CRITICAL')) {
    await notifyComplianceOfficer({
      error: error.message,
      impact: impact.content,
      affectedStudents: studentIds,
    })
  }

  return impact
}
```

### 3. AI Service (Self-Monitoring)

```typescript
// services/ai/src/middleware/ai-error-handler.ts
import { createErrorDiagnosticsAgent } from '@aah/ai'

export async function handleAIServiceError(error: Error, context: any) {
  // Don't create infinite loop - only analyze non-diagnostics errors
  if (context.route?.includes('error-diagnostics')) {
    console.error('Error diagnostics agent error:', error)
    return
  }

  const agent = createErrorDiagnosticsAgent()

  const analysis = await agent.analyzeError({
    error,
    context: {
      service: 'ai',
      userId: context.userId,
      correlationId: context.correlationId,
    },
  })

  console.log('AI Service Error Analysis:', analysis.content)
}
```

## Best Practices

### 1. Error Context

Always provide rich context when analyzing errors:

```typescript
const analysis = await agent.analyzeError({
  error: error,
  context: {
    service: 'compliance',
    userId: 'user123',
    correlationId: 'req-abc-123',
    stackTrace: error.stack,
    metadata: {
      operation: 'eligibility_check',
      studentId: 'S12345',
      timestamp: new Date().toISOString(),
    },
  },
})
```

### 2. FERPA Compliance

Always validate error logs before storing or displaying:

```typescript
// Before logging errors
const validation = await agent.validateFERPACompliance({
  errorLogs: [{ message: error.message, metadata: error.metadata }],
  service: 'compliance',
})

if (!validation.content.includes('compliant')) {
  // Sanitize error message before logging
  error.message = sanitizePII(error.message)
}
```

### 3. Pattern Detection

Run pattern detection regularly to identify systemic issues:

```typescript
// Daily cron job
async function dailyErrorAnalysis() {
  const agent = createErrorDiagnosticsAgent()

  const patterns = await agent.detectPatterns({
    timeRange: {
      start: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
      end: new Date(),
    },
    minOccurrences: 3,
  })

  // Alert if critical patterns found
  if (patterns.content.includes('critical')) {
    await sendAlert('Critical error patterns detected', patterns.content)
  }
}
```

### 4. Predictive Analysis

Use before deployments to catch potential issues:

```typescript
// In CI/CD pipeline
async function preDeploymentCheck(changes: { files: string[]; description: string }) {
  const agent = createErrorDiagnosticsAgent()

  const prediction = await agent.predictErrors({
    service: 'compliance',
    changes,
    deploymentTarget: 'production',
  })

  // Block deployment if high-risk issues found
  if (prediction.content.includes('HIGH RISK')) {
    throw new Error('Deployment blocked: High-risk changes detected')
  }
}
```

## Monitoring & Observability

### Langfuse Integration

The agent automatically traces all operations to Langfuse:

```typescript
// View traces in Langfuse dashboard
// https://cloud.langfuse.com/project/{project-id}/traces

// Traces include:
// - Error analysis duration
// - Tool invocations
// - Token usage
// - Cost per analysis
// - Success/failure rates
```

### Metrics to Track

1. **Error Analysis Volume**: Number of errors analyzed per day
2. **Pattern Detection**: Number of patterns identified
3. **Fix Success Rate**: Percentage of fixes that resolved issues
4. **FERPA Violations**: Number of PII exposures detected
5. **NCAA Impact**: Number of compliance-critical errors
6. **Response Time**: Average time to analyze errors
7. **Cost**: Total cost of error diagnostics

## Security & Compliance

### FERPA Compliance

- All error logs are validated for PII exposure
- Student IDs, emails, SSNs are detected and flagged
- Recommendations provided for sanitization
- Audit trail maintained for all validations

### NCAA Compliance

- Errors affecting eligibility tracking are flagged
- Impact on compliance reporting is assessed
- Required corrective actions are identified
- Notification requirements are determined

### Access Control

- Error analysis: Available to all authenticated users
- Pattern detection: Available to support staff and admins
- Report generation: Admin only
- FERPA validation: Compliance officers and admins

## Troubleshooting

### Issue: Agent not analyzing errors

**Solution**: Check that error diagnostics tools are registered:

```typescript
import { getToolsForAgentType } from '@aah/ai'

const tools = getToolsForAgentType('error_diagnostics')
console.log('Available tools:', tools.map(t => t.name))
```

### Issue: FERPA validation not detecting PII

**Solution**: Update PII patterns in `checkFERPACompliance` tool:

```typescript
const piiPatterns = {
  studentId: /\b[A-Z]\d{7}\b/g,
  ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  phone: /\b(\+\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/g,
}
```

### Issue: High cost for error analysis

**Solution**: Implement caching for similar errors:

```typescript
import { globalResponseCache } from '@aah/ai'

// Cache error analysis results
const cacheKey = `error-analysis:${errorCode}:${service}`
const cached = await globalResponseCache.getCachedResponse('error_diagnostics', cacheKey, {})

if (cached) {
  return cached
}

const analysis = await agent.analyzeError({ error, context })

await globalResponseCache.cacheResponse('error_diagnostics', cacheKey, {}, analysis.content, 3600000) // 1 hour
```

## Future Enhancements

1. **Automated Fix Application**: Apply fixes automatically for known issues
2. **Machine Learning**: Train models on historical error patterns
3. **Real-time Monitoring**: Stream error analysis in real-time
4. **Integration with Sentry**: Direct integration with error tracking
5. **Slack Notifications**: Send alerts to Slack channels
6. **Dashboard**: Visual dashboard for error trends and patterns

## Support

For issues or questions:
- Check [Implementation Plan](../../.kiro/specs/ai-agents-implementation/tasks.md)
- Review [Error Diagnostics Tools](../tools/error-diagnostics-tools.ts)
- Contact AI team

---

**Version**: 1.0.0  
**Last Updated**: November 8, 2025  
**Status**: Production Ready
