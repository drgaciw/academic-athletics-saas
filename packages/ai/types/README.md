# Agent Types

This directory contains TypeScript type definitions for the AI agent system.

## Files

### `agent.types.ts`

Core type definitions for AI agents, including:

- **Agent Types**: `AgentType`, `AgentStatus`, `TaskComplexity`, `LLMProvider`
- **Request/Response**: `AgentRequest`, `AgentResponse`
- **State Management**: `AgentState`, `AgentStep`
- **Tools**: `ToolDefinition`, `ToolCall`, `ToolInvocation`, `ToolResult`
- **Configuration**: `AgentConfig`
- **Errors**: `AgentError`, `AgentErrorCode`
- **Memory**: `AgentMemory`, `ConversationMemory`, `MemoryType`
- **Metrics**: `AgentMetrics`, `AgentFeedback`
- **Streaming**: `StreamEvent`, `StreamEventType`
- **Orchestration**: `MultiAgentWorkflow`, `AgentCollaborationContext`

## Usage Examples

### Creating an Agent Request

```typescript
import type { AgentRequest } from '@aah/ai'

const request: AgentRequest = {
  userId: 'user-123',
  agentType: 'advising',
  message: 'What courses should I take next semester?',
  conversationId: 'conv-456',
  streaming: true,
  maxSteps: 10,
  modelPreference: {
    provider: 'anthropic',
    complexity: 'moderate',
  },
}
```

### Defining a Tool

```typescript
import { z } from 'zod'
import type { ToolDefinition } from '@aah/ai'

const getStudentProfile: ToolDefinition = {
  id: 'get-student-profile',
  name: 'getStudentProfile',
  description: 'Retrieve student profile and academic records',
  parameters: z.object({
    studentId: z.string().describe('Student ID'),
    includeHistory: z.boolean().optional(),
  }),
  execute: async (params, context) => {
    // Implementation
    return { /* student data */ }
  },
  requiredPermissions: ['read:student'],
  category: 'student_data',
}
```

### Handling Agent Response

```typescript
import type { AgentResponse } from '@aah/ai'

function handleResponse(response: AgentResponse) {
  console.log(`Agent: ${response.agentType}`)
  console.log(`Status: ${response.status}`)
  console.log(`Content: ${response.content}`)
  console.log(`Steps: ${response.steps.length}`)
  console.log(`Tools used: ${response.toolInvocations.length}`)
  console.log(`Cost: $${response.cost.toFixed(4)}`)
  
  if (response.error) {
    console.error('Error:', response.error.message)
  }
}
```

### Working with Agent State

```typescript
import type { AgentState, AgentStep } from '@aah/ai'

const state: AgentState = {
  id: 'state-789',
  userId: 'user-123',
  agentType: 'compliance',
  status: 'running',
  currentStep: 3,
  maxSteps: 10,
  messages: [],
  toolResults: [],
  stepHistory: [],
  metadata: {},
  createdAt: new Date(),
  updatedAt: new Date(),
}
```

### Creating Agent Configuration

```typescript
import type { AgentConfig } from '@aah/ai'

const advisingAgentConfig: AgentConfig = {
  type: 'advising',
  name: 'Academic Advising Agent',
  description: 'Helps students with course selection and degree planning',
  systemPrompt: 'You are an expert academic advisor...',
  tools: ['searchCourses', 'checkConflicts', 'getDegreeRequirements'],
  model: {
    provider: 'anthropic',
    name: 'claude-sonnet-4-20250514',
    temperature: 0.7,
    maxTokens: 4096,
  },
  maxSteps: 10,
  streaming: true,
  memoryEnabled: true,
  rateLimits: {
    requestsPerMinute: 60,
    tokensPerDay: 1000000,
  },
}
```

## Type Safety

All types are fully typed with TypeScript for compile-time safety:

```typescript
// ✅ Type-safe
const request: AgentRequest = {
  userId: 'user-123',
  agentType: 'advising', // Only valid agent types allowed
  message: 'Help me',
}

// ❌ Compile error
const invalid: AgentRequest = {
  userId: 'user-123',
  agentType: 'invalid', // Error: Type '"invalid"' is not assignable
  message: 'Help me',
}
```

## Zod Integration

Tool definitions use Zod for runtime validation:

```typescript
import { z } from 'zod'

const toolParams = z.object({
  studentId: z.string().min(1),
  semester: z.enum(['fall', 'spring', 'summer']),
  year: z.number().int().min(2020),
})

// Runtime validation
const result = toolParams.parse({
  studentId: 'S12345',
  semester: 'fall',
  year: 2024,
})
```

## Error Handling

Use the `AgentError` type for structured error handling:

```typescript
import type { AgentError } from '@aah/ai'

function handleError(error: AgentError) {
  console.error(`Error [${error.code}]: ${error.message}`)
  
  if (error.recoverable) {
    console.log('This error is recoverable, retrying...')
  }
  
  if (error.details) {
    console.log('Details:', error.details)
  }
}
```

## Best Practices

1. **Always use type imports** for better tree-shaking:
   ```typescript
   import type { AgentRequest } from '@aah/ai'
   ```

2. **Validate tool parameters** with Zod schemas

3. **Handle errors gracefully** using the `AgentError` type

4. **Track metrics** using `AgentMetrics` for observability

5. **Use streaming** for better UX with long-running agents

6. **Implement proper state management** with `AgentState`

## Related Documentation

- [Base Agent Class](../lib/base-agent.ts)
- [Error Classes](../lib/errors.ts)
- [Agent Utilities](../lib/agent-utils.ts)
- [Main README](../README.md)
