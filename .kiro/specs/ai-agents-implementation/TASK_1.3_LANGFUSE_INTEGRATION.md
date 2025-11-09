# Task 1.3: Langfuse Integration - COMPLETE ✅

**Date**: November 8, 2025  
**Status**: ✅ Complete  
**Requirements**: 10.1, 10.2, 10.3, 10.4, 10.5

## Overview

Implemented comprehensive Langfuse integration for AI agent observability and tracing. The system provides detailed tracking of agent execution, tool invocations, token usage, costs, and errors.

## Implementation

### 1. Enhanced Langfuse Client (`packages/ai/lib/langfuse-client.ts`)

#### Core Features

**AgentTracer Class** - Comprehensive tracing wrapper:
```typescript
const tracer = new AgentTracer(agentType, request)

// Track execution phases
tracer.startSpan('initialize-state')
tracer.endSpan({ stateId: state.id })

// Track LLM generations
tracer.trackGeneration({
  name: 'agent-execution',
  model: 'claude-sonnet-4',
  input: messages,
  output: result.text,
  usage: { promptTokens, completionTokens, totalTokens }
})

// Track tool invocations
tracer.trackToolInvocation(toolInvocation)

// Track agent steps
tracer.trackStep(agentStep)

// Complete trace
tracer.complete(response)

// Or mark as failed
tracer.fail(error, metadata)
```

#### Key Methods

1. **`createAgentTrace()`** - Create root trace for agent execution
   - Tracks userId, sessionId, metadata, tags
   - Returns LangfuseTraceClient for nested tracking

2. **`AgentTracer.startSpan()`** - Start execution phase
   - Tracks initialization, tool loading, LLM execution
   - Supports nested spans for complex workflows

3. **`AgentTracer.trackGeneration()`** - Track LLM calls
   - Records model, input, output, token usage
   - Automatically calculates and logs costs
   - Supports streaming and non-streaming

4. **`AgentTracer.trackToolInvocation()`** - Track tool execution
   - Logs tool name, parameters, results, errors
   - Tracks latency and confirmation status
   - Creates nested spans for tool calls

5. **`AgentTracer.trackStep()`** - Track agent reasoning steps
   - Records step number, type, description
   - Tracks tool calls within steps
   - Logs errors and duration

6. **`AgentTracer.complete()`** - Finalize successful trace
   - Logs final response, status, metrics
   - Tracks all steps and tool invocations
   - Calculates total cost and duration

7. **`AgentTracer.fail()`** - Mark trace as failed
   - Logs error details, stack trace
   - Tags trace for error analysis
   - Preserves partial execution data

#### Utility Functions

**`calculateCost()`** - Calculate LLM costs:
```typescript
const cost = calculateCost(
  'claude-sonnet-4',
  promptTokens: 1000,
  completionTokens: 500
)
// Returns cost in USD based on model pricing
```

**`traceAgentExecution()`** - Wrapper for automatic tracing:
```typescript
const result = await traceAgentExecution(
  agentType,
  request,
  async (tracer) => {
    // Your agent logic here
    tracer.startSpan('planning')
    // ...
    return response
  }
)
```

**`trackRAGRetrieval()`** - Track RAG operations:
```typescript
trackRAGRetrieval(trace, {
  query: 'NCAA eligibility rules',
  results: documents,
  retrievalTime: 150,
  metadata: { vectorStore: 'pgvector' }
})
```

**`trackEmbedding()`** - Track embedding generation:
```typescript
trackEmbedding(trace, {
  text: 'Course description',
  model: 'text-embedding-3-large',
  dimensions: 1536,
  duration: 50
})
```

**`BatchTracker`** - Track multiple operations:
```typescript
const batch = new BatchTracker()
batch.start('load-tools')
// ... operations ...
batch.end('load-tools', { toolCount: 10 })
batch.logToTrace(trace)
```

### 2. BaseAgent Integration

Updated `BaseAgent` class to use `AgentTracer`:

```typescript
async execute(request: AgentRequest): Promise<AgentResponse> {
  const tracer = new AgentTracer(this.config.type, request)

  try {
    // Track initialization
    tracer.startSpan('initialize-state')
    const state = await this.initializeState(request)
    tracer.endSpan({ stateId: state.id })

    // Track tool loading
    tracer.startSpan('load-tools')
    const tools = this.getTools()
    tracer.endSpan({ toolCount: Object.keys(tools).length })

    // Track LLM execution
    tracer.startSpan('llm-execution')
    const result = await generateText({ model, messages, tools })
    tracer.endSpan()

    // Track generation with usage
    tracer.trackGeneration({
      name: 'agent-execution',
      model: this.config.model.name,
      input: messages,
      output: result.text,
      usage: result.usage
    })

    // Build response
    const response = { ... }

    // Complete trace
    tracer.complete(response)

    return response
  } catch (error) {
    tracer.fail(error)
    throw error
  }
}
```

### 3. Streaming Support

Enhanced streaming execution with tracing:

```typescript
async executeStreaming(request: AgentRequest) {
  const tracer = new AgentTracer(this.config.type, request)

  try {
    // ... initialization ...

    const result = await streamText({
      model,
      messages,
      tools,
      onStepFinish: async (step) => {
        await this.onStepFinish(state, step)
        // Track each step as it completes
        const agentStep = state.stepHistory[state.stepHistory.length - 1]
        if (agentStep) {
          tracer.trackStep(agentStep)
        }
      }
    })

    // Track generation start
    const generation = tracer.trackGeneration({
      name: 'agent-streaming',
      model: this.config.model.name,
      input: messages,
      metadata: { streaming: true }
    })

    // Wrap stream to track completion
    return this.wrapStreamWithTracking(
      result.textStream,
      tracer,
      generation,
      state
    )
  } catch (error) {
    tracer.fail(error)
    throw error
  }
}
```

## Features

### ✅ Comprehensive Tracing

- **Execution Phases**: Track initialization, tool loading, LLM calls
- **Nested Spans**: Support for complex multi-step workflows
- **Tool Invocations**: Detailed logging of all tool executions
- **Agent Steps**: Track reasoning steps with tool calls
- **Streaming**: Real-time tracking of streaming responses

### ✅ Token Usage & Cost Tracking

- **Automatic Calculation**: Costs calculated based on model pricing
- **Per-Generation Tracking**: Track usage for each LLM call
- **Cumulative Metrics**: Total tokens and costs per execution
- **Model-Specific Pricing**: Support for GPT-4, Claude, etc.

### ✅ Error Tracking

- **Detailed Error Logs**: Stack traces, error codes, messages
- **Partial Execution Data**: Preserve data even on failure
- **Error Tagging**: Tag traces for easy filtering
- **Recoverable vs Non-Recoverable**: Distinguish error types

### ✅ Performance Monitoring

- **Duration Tracking**: Measure execution time for all operations
- **Latency Metrics**: Track tool invocation latency
- **Bottleneck Identification**: Identify slow operations
- **Batch Operations**: Track multiple operations efficiently

### ✅ RAG & Embedding Support

- **RAG Retrieval Tracking**: Log queries, results, retrieval time
- **Embedding Generation**: Track embedding model usage
- **Vector Search Metrics**: Monitor search performance
- **Knowledge Base Usage**: Track document retrieval patterns

## Configuration

### Environment Variables

```bash
# Langfuse Configuration
LANGFUSE_PUBLIC_KEY=pk_...
LANGFUSE_SECRET_KEY=sk_...
LANGFUSE_HOST=https://cloud.langfuse.com  # Optional, defaults to cloud

# Enable/Disable
# Langfuse is automatically enabled when keys are present
```

### Config File (`packages/ai/config.ts`)

```typescript
export const aiConfig = {
  langfuse: {
    enabled: process.env.LANGFUSE_PUBLIC_KEY !== undefined,
    publicKey: process.env.LANGFUSE_PUBLIC_KEY,
    secretKey: process.env.LANGFUSE_SECRET_KEY,
    host: process.env.LANGFUSE_HOST || 'https://cloud.langfuse.com',
  },
  // ... other config
}
```

## Usage Examples

### Basic Agent Tracing

```typescript
import { AgentTracer } from '@aah/ai'

const tracer = new AgentTracer('advising', request)

try {
  // Your agent logic
  tracer.startSpan('planning')
  const plan = await createPlan()
  tracer.endSpan({ steps: plan.steps.length })

  tracer.startSpan('execution')
  const result = await executePlan(plan)
  tracer.endSpan()

  tracer.complete(response)
} catch (error) {
  tracer.fail(error)
}
```

### Tool Invocation Tracking

```typescript
// Automatically tracked in BaseAgent
const toolInvocation: ToolInvocation = {
  id: 'tool-123',
  toolName: 'searchCourses',
  parameters: { query: 'MATH 201' },
  result: courses,
  latency: 150,
  timestamp: new Date()
}

tracer.trackToolInvocation(toolInvocation)
```

### RAG Pipeline Tracking

```typescript
import { trackRAGRetrieval, trackEmbedding } from '@aah/ai'

// Track embedding generation
trackEmbedding(trace, {
  text: query,
  model: 'text-embedding-3-large',
  dimensions: 1536,
  duration: 50
})

// Track retrieval
trackRAGRetrieval(trace, {
  query,
  results: documents,
  retrievalTime: 150,
  metadata: {
    vectorStore: 'pgvector',
    similarityThreshold: 0.7
  }
})
```

### Batch Operation Tracking

```typescript
import { BatchTracker } from '@aah/ai'

const batch = new BatchTracker()

batch.start('load-student-data')
const student = await loadStudent(studentId)
batch.end('load-student-data', { studentId })

batch.start('load-courses')
const courses = await loadCourses()
batch.end('load-courses', { courseCount: courses.length })

batch.start('check-eligibility')
const eligible = await checkEligibility(student)
batch.end('check-eligibility', { eligible })

// Log all operations to trace
batch.logToTrace(trace)
```

## Langfuse Dashboard

### Traces View

View all agent executions with:
- Request ID, user ID, session ID
- Agent type and status
- Duration and cost
- Token usage
- Error details

### Generations View

Detailed LLM call tracking:
- Model used
- Input/output tokens
- Cost per generation
- Latency
- Success/failure rate

### Spans View

Execution phase breakdown:
- Initialization time
- Tool loading time
- LLM execution time
- Tool invocation time
- Total duration

### Metrics Dashboard

Aggregate metrics:
- Total requests per agent type
- Average duration
- Total cost
- Token usage trends
- Error rates
- Tool usage patterns

## Benefits

### 🔍 Observability

- **Full Visibility**: See every step of agent execution
- **Debug Easily**: Identify issues with detailed traces
- **Performance Insights**: Find bottlenecks and optimize
- **Cost Tracking**: Monitor and control LLM costs

### 📊 Analytics

- **Usage Patterns**: Understand how agents are used
- **Tool Effectiveness**: Measure tool success rates
- **Model Performance**: Compare different models
- **User Behavior**: Analyze user interaction patterns

### 🐛 Debugging

- **Error Context**: Full context for every error
- **Partial Execution**: See what succeeded before failure
- **Tool Failures**: Identify problematic tool calls
- **Streaming Issues**: Debug streaming problems

### 💰 Cost Management

- **Real-Time Costs**: Track costs as they occur
- **Budget Alerts**: Set up cost alerts in Langfuse
- **Model Comparison**: Compare costs across models
- **Optimization**: Identify expensive operations

## Testing

### Manual Testing

```bash
# Set environment variables
export LANGFUSE_PUBLIC_KEY=pk_...
export LANGFUSE_SECRET_KEY=sk_...

# Run agent
npm run dev

# Check Langfuse dashboard
# https://cloud.langfuse.com
```

### Automated Testing

```typescript
import { getLangfuse, AgentTracer } from '@aah/ai'

describe('Langfuse Integration', () => {
  it('should create trace for agent execution', async () => {
    const tracer = new AgentTracer('advising', mockRequest)
    expect(tracer.getTraceId()).toBeTruthy()
  })

  it('should track tool invocations', async () => {
    const tracer = new AgentTracer('advising', mockRequest)
    tracer.trackToolInvocation(mockToolInvocation)
    // Verify in Langfuse dashboard
  })

  it('should calculate costs correctly', () => {
    const cost = calculateCost('claude-sonnet-4', 1000, 500)
    expect(cost).toBeGreaterThan(0)
  })
})
```

## Next Steps

### Task 2.1: Create ToolRegistry Class

Now that we have comprehensive tracing, we can:
1. Track tool registration and usage
2. Monitor tool performance and latency
3. Identify frequently used tools
4. Optimize tool selection based on metrics

### Task 4.x: Implement Specialized Agents

Each agent will automatically benefit from:
1. Detailed execution traces
2. Cost tracking per agent type
3. Performance monitoring
4. Error analysis

### Task 8.x: Observability Dashboards

Build custom dashboards using Langfuse data:
1. Agent performance comparison
2. Cost analysis by agent type
3. Tool usage patterns
4. Error rate trends

## References

- [Langfuse Documentation](https://langfuse.com/docs)
- [Langfuse TypeScript SDK](https://langfuse.com/docs/sdk/typescript)
- [Vercel AI SDK Integration](https://langfuse.com/docs/integrations/vercel-ai-sdk)
- [Best Practices](../../../packages/ai/BEST_PRACTICES.md)

## Completion Checklist

- [x] Enhanced Langfuse client with AgentTracer class
- [x] Integrated tracing into BaseAgent
- [x] Added streaming support with tracking
- [x] Implemented tool invocation tracking
- [x] Added step-by-step execution tracking
- [x] Implemented cost calculation
- [x] Added error tracking and logging
- [x] Created RAG and embedding tracking utilities
- [x] Implemented batch operation tracking
- [x] Updated documentation
- [x] Tested with manual execution

**Status**: ✅ COMPLETE - Ready for Task 2.1
