# AI Agents Quick Start Guide

Get started with the Athletic Academics Hub AI agent system in 5 minutes.

## Installation

```bash
# Install dependencies (already done)
npm install

# Set up environment variables
cp .env.example .env
```

## Environment Variables

```bash
# Required
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...

# Optional (for observability)
LANGFUSE_PUBLIC_KEY=pk-...
LANGFUSE_SECRET_KEY=sk-...
LANGFUSE_HOST=https://cloud.langfuse.com
```

## Basic Usage

### 1. Execute a Single Agent

```typescript
import { createAdvisingAgent } from '@aah/ai/agents'

const agent = createAdvisingAgent()

const response = await agent.execute({
  userId: 'S12345',
  agentType: 'advising',
  message: 'I need help selecting courses for Fall 2024',
})

console.log(response.content)
```

### 2. Use the Orchestrator (Recommended)

```typescript
import { executeAgentWorkflow } from '@aah/ai'

// Automatic agent selection
const result = await executeAgentWorkflow({
  userId: 'S12345',
  message: 'Am I eligible to compete?',
})

console.log('Agent used:', result.agentsUsed[0])
console.log('Response:', result.response.content)
console.log('Cost:', result.totalCost)
```

### 3. Multi-Agent Workflow

```typescript
import { createOrchestrator } from '@aah/ai'

const orchestrator = createOrchestrator()

const result = await orchestrator.executeMultiAgent(
  {
    userId: 'S12345',
    message: 'Check my eligibility and recommend courses',
  },
  ['compliance', 'advising']
)

console.log('Agents used:', result.agentsUsed)
console.log('Total cost:', result.totalCost)
```

### 4. Streaming Responses

```typescript
import { createAdvisingAgent } from '@aah/ai/agents'

const agent = createAdvisingAgent()

const stream = await agent.executeStreaming({
  userId: 'S12345',
  agentType: 'advising',
  message: 'Help me plan my courses',
  streaming: true,
})

for await (const chunk of stream) {
  process.stdout.write(chunk)
}
```

## Available Agents

### Advising Agent
**Use for**: Course selection, scheduling, degree planning

```typescript
import { createAdvisingAgent } from '@aah/ai/agents'

const agent = createAdvisingAgent()

// Helper methods
await agent.recommendCourses({
  studentId: 'S12345',
  semester: 'Fall 2024',
  targetCredits: 15,
})

await agent.checkScheduleConflicts({
  studentId: 'S12345',
  courseCodes: ['MATH 201', 'BUS 301'],
  semester: 'Fall 2024',
})
```

### Compliance Agent
**Use for**: NCAA eligibility, rule interpretation

```typescript
import { createComplianceAgent } from '@aah/ai/agents'

const agent = createComplianceAgent()

// Helper methods
await agent.checkEligibility({
  studentId: 'S12345',
  sport: 'Football',
  includeDetails: true,
})

await agent.simulateScenario({
  studentId: 'S12345',
  scenario: { dropCourse: 'MATH 201' },
})
```

### Intervention Agent
**Use for**: At-risk student support, intervention planning

```typescript
import { createInterventionAgent } from '@aah/ai/agents'

const agent = createInterventionAgent()

// Helper methods
await agent.assessRisk({
  studentId: 'S12345',
  timeframe: 'semester',
})

await agent.generateInterventionPlan({
  studentId: 'S12345',
  concerns: ['Low GPA', 'Poor attendance'],
  urgency: 'high',
})
```

### Administrative Agent
**Use for**: Email, documents, scheduling

```typescript
import { createAdministrativeAgent } from '@aah/ai/agents'

const agent = createAdministrativeAgent()

// Helper methods
await agent.sendNotification({
  to: ['student@university.edu'],
  subject: 'Course Registration Reminder',
  body: 'Registration opens tomorrow...',
})

await agent.generateTravelLetter({
  studentId: 'S12345',
  travelDates: {
    departureDate: '2024-11-22',
    returnDate: '2024-11-24',
  },
  destination: 'Tech University',
  reason: 'Away game',
})
```

### General Assistant
**Use for**: Information retrieval, routing

```typescript
import { createGeneralAssistant } from '@aah/ai/agents'

const assistant = createGeneralAssistant()

// Classify intent
const routing = await assistant.classifyAndRoute(
  'I need help with courses'
)

console.log(routing.recommendedAgent) // 'advising'
```

## Tools

### Using Tools Directly

```typescript
import { globalToolRegistry } from '@aah/ai'

const tool = globalToolRegistry.get('searchCourses')

const result = await tool.execute(
  {
    query: 'calculus',
    semester: 'Fall 2024',
  },
  {
    userId: 'S12345',
    userRoles: ['advisor'],
  }
)
```

### Available Tools by Category

**Student Data** (5 tools):
- getStudentProfile
- getAcademicRecords
- getAthleticSchedule
- getPerformanceMetrics
- getDegreeProgress

**Compliance** (5 tools):
- checkEligibility
- searchNCAARules
- simulateScenario
- getComplianceHistory
- calculateProgressTowardDegree

**Advising** (6 tools):
- searchCourses
- checkConflicts
- getDegreeRequirements
- calculateProgress
- recommendCourses
- getPrerequisites

**Administrative** (6 tools):
- sendEmail
- generateTravelLetter
- scheduleEvent
- generateReport
- createReminder
- logInteraction

## Observability

### View Traces in Langfuse

```bash
# Access Langfuse dashboard
https://cloud.langfuse.com

# Filter by agent type
tag:advising
tag:compliance

# View metrics
- Token usage
- Costs
- Duration
- Success rates
```

### Custom Tracing

```typescript
import { AgentTracer } from '@aah/ai'

const tracer = new AgentTracer('advising', request)

tracer.startSpan('custom-operation')
// ... your code ...
tracer.endSpan({ result: 'success' })

tracer.complete(response)
```

## Error Handling

### With Retry

```typescript
import { createOrchestrator } from '@aah/ai'

const orchestrator = createOrchestrator()

const result = await orchestrator.executeWithRetry(
  {
    userId: 'S12345',
    message: 'Help me',
  },
  3 // Max retries
)
```

### With Fallback

```typescript
const orchestrator = createOrchestrator({
  enableFallback: true, // Falls back to general assistant
})

const result = await orchestrator.executeWorkflow(request)
```

### Custom Error Handling

```typescript
import { AgentError, toAgentError } from '@aah/ai'

try {
  const result = await agent.execute(request)
} catch (error) {
  const agentError = toAgentError(error)
  
  if (agentError.recoverable) {
    // Retry
  } else {
    // Handle non-recoverable error
  }
}
```

## Configuration

### Agent Configuration

```typescript
import { createAdvisingAgent } from '@aah/ai/agents'

const agent = createAdvisingAgent()

// Access configuration
console.log(agent.config.model.name) // 'claude-sonnet-4-20250514'
console.log(agent.config.maxSteps) // 10
console.log(agent.config.tools) // ['searchCourses', ...]
```

### Orchestrator Configuration

```typescript
import { createOrchestrator } from '@aah/ai'

const orchestrator = createOrchestrator({
  autoRoute: true,
  enableMultiAgent: true,
  maxAgentsPerWorkflow: 3,
  executionTimeout: 60000,
  enableFallback: true,
})
```

## Testing

### Unit Test Example

```typescript
import { createAdvisingAgent } from '@aah/ai/agents'

describe('AdvisingAgent', () => {
  it('should recommend courses', async () => {
    const agent = createAdvisingAgent()
    
    const response = await agent.recommendCourses({
      studentId: 'S12345',
      semester: 'Fall 2024',
      targetCredits: 15,
    })
    
    expect(response.status).toBe('completed')
    expect(response.content).toContain('course')
  })
})
```

### Integration Test Example

```typescript
import { executeAgentWorkflow } from '@aah/ai'

describe('Agent Integration', () => {
  it('should execute workflow', async () => {
    const result = await executeAgentWorkflow({
      userId: 'S12345',
      message: 'Help me select courses',
    })
    
    expect(result.success).toBe(true)
    expect(result.agentsUsed).toContain('advising')
  })
})
```

## Common Patterns

### 1. Course Recommendation Flow

```typescript
import { createOrchestrator } from '@aah/ai'

const orchestrator = createOrchestrator()

// Automatically uses compliance + advising agents
const result = await orchestrator.executeSmartWorkflow({
  userId: 'S12345',
  message: 'I need courses for next semester but want to make sure I stay eligible',
})
```

### 2. Eligibility Check with Explanation

```typescript
import { createComplianceAgent } from '@aah/ai/agents'

const agent = createComplianceAgent()

const response = await agent.checkEligibility({
  studentId: 'S12345',
  sport: 'Football',
  includeDetails: true, // Get detailed explanations
})
```

### 3. At-Risk Student Intervention

```typescript
import { createInterventionAgent } from '@aah/ai/agents'

const agent = createInterventionAgent()

// Assess risk
const riskAssessment = await agent.assessRisk({
  studentId: 'S12345',
  timeframe: 'semester',
})

// Generate plan
const plan = await agent.generateInterventionPlan({
  studentId: 'S12345',
  concerns: ['Low GPA', 'Poor attendance'],
  urgency: 'high',
})

// Schedule follow-up
await agent.scheduleFollowUp({
  studentId: 'S12345',
  reason: 'Check progress on tutoring',
  suggestedDate: '2024-11-20',
})
```

### 4. Automated Travel Notification

```typescript
import { createAdministrativeAgent } from '@aah/ai/agents'

const agent = createAdministrativeAgent()

const result = await agent.generateTravelLetter({
  studentId: 'S12345',
  travelDates: {
    departureDate: '2024-11-22',
    returnDate: '2024-11-24',
  },
  destination: 'Tech University',
  reason: 'Away game vs Tech',
})

// Letter is generated and faculty are notified
console.log('Notified faculty:', result.notifiedFaculty)
```

## Performance Tips

1. **Use Caching**: Enable response caching for common queries
2. **Selective Tools**: Only load relevant tools per agent
3. **Streaming**: Use streaming for better UX on long responses
4. **Batch Operations**: Group similar requests when possible
5. **Monitor Costs**: Track token usage via Langfuse

## Troubleshooting

### Agent Not Responding

```typescript
// Check timeout configuration
const orchestrator = createOrchestrator({
  executionTimeout: 120000, // Increase to 2 minutes
})
```

### High Costs

```typescript
// Use caching
import { withCache } from '@aah/ai'

const cachedExecute = withCache(agent.execute.bind(agent), {
  ttl: 3600000, // 1 hour
})
```

### Wrong Agent Selected

```typescript
// Explicitly specify agent
const result = await executeAgentWorkflow({
  userId: 'S12345',
  agentType: 'compliance', // Force specific agent
  message: 'Check eligibility',
})
```

## Next Steps

1. **Read Documentation**: Check [BEST_PRACTICES.md](./BEST_PRACTICES.md)
2. **Review Examples**: See [TASK_4_SPECIALIZED_AGENTS.md](../.kiro/specs/ai-agents-implementation/TASK_4_SPECIALIZED_AGENTS.md)
3. **Explore Tools**: Review [TASK_2.1_TOOL_REGISTRY.md](../.kiro/specs/ai-agents-implementation/TASK_2.1_TOOL_REGISTRY.md)
4. **Check Observability**: Read [TASK_1.3_LANGFUSE_INTEGRATION.md](../.kiro/specs/ai-agents-implementation/TASK_1.3_LANGFUSE_INTEGRATION.md)

## Support

- **Documentation**: See `/packages/ai/` directory
- **Examples**: See `/.kiro/specs/ai-agents-implementation/` directory
- **Issues**: Check TypeScript diagnostics for type errors

## License

Part of the Athletic Academics Hub platform.
