# AI Agent Best Practices

Quick reference guide for implementing AI agents following Claude Cookbooks patterns.

## 1. Prompt Engineering

### ✅ DO: Use Structured XML Prompts

```typescript
import { createSystemPrompt } from '@aah/ai'

const prompt = createSystemPrompt({
  role: 'You are an expert academic advisor',
  context: 'You help student-athletes at NCAA Division I institutions',
  capabilities: [
    'Search course catalogs',
    'Check scheduling conflicts',
    'Track degree progress'
  ],
  constraints: [
    'Always verify NCAA eligibility',
    'Respect FERPA privacy rules',
    'Use tools to verify information'
  ],
  examples: [{
    input: 'I need help selecting courses',
    output: 'Let me help you. I\'ll check your degree requirements...'
  }],
  outputFormat: 'Provide step-by-step recommendations with reasoning'
})
```

### ❌ DON'T: Use Plain String Prompts

```typescript
// Bad - no structure
const prompt = 'You are an advisor. Help students with courses.'
```

## 2. Tool Definitions

### ✅ DO: Provide Detailed Tool Descriptions

```typescript
import { createTool } from '@aah/ai'
import { z } from 'zod'

const searchCourses = createTool({
  name: 'searchCourses',
  description: 'Search course catalog for available courses',
  parameters: z.object({
    query: z.string().describe('Search query (course code, title, or keywords)'),
    semester: z.enum(['fall', 'spring', 'summer']),
    year: z.number().int().min(2020)
  }),
  execute: async (params) => {
    // Implementation
  },
  category: 'advising',
  usageGuidance: 'Use this when student asks about course availability',
  examples: [
    'searchCourses({ query: "MATH 201", semester: "fall", year: 2024 })',
    'searchCourses({ query: "calculus", semester: "spring", year: 2025 })'
  ],
  returnFormat: 'Array of courses with code, title, credits, schedule, seats'
})
```

### ❌ DON'T: Use Minimal Descriptions

```typescript
// Bad - Claude won't know when/how to use this
const tool = {
  name: 'search',
  description: 'Search',
  parameters: z.object({ q: z.string() })
}
```

## 3. Agentic Workflows

### ✅ DO: Use Plan → Execute → Reflect

```typescript
import { AgenticWorkflow } from '@aah/ai'

// Phase 1: Planning
const plan = await AgenticWorkflow.plan({
  model,
  goal: 'Help student select optimal courses for next semester',
  availableTools: ['searchCourses', 'checkConflicts', 'getDegreeRequirements'],
  context: { studentId, currentSemester }
})

// Phase 2: Execution
const state = await AgenticWorkflow.execute({
  model,
  plan,
  tools,
  state,
  onStepComplete: async (step, checkpoint) => {
    console.log(`Completed step ${step.stepNumber}`)
  }
})

// Phase 3: Reflection
const reflection = await AgenticWorkflow.reflect({
  model,
  state,
  goal: plan.goal
})

console.log('Success:', reflection.success)
console.log('Improvements:', reflection.improvements)
```

### ❌ DON'T: Execute Without Planning

```typescript
// Bad - no planning, no reflection, no error recovery
const result = await generateText({ model, prompt, tools })
```

## 4. Safety & Security

### ✅ DO: Sanitize Input and Validate Output

```typescript
import { sanitizeInput, validateOutput, withSafety } from '@aah/ai'

// Option 1: Manual
const { sanitized, warnings, blocked } = sanitizeInput(userMessage, {
  removePII: true,
  checkInjection: true,
  checkHarmful: true
})

if (blocked) {
  throw new Error('Input blocked due to safety concerns')
}

const result = await agent.execute({ message: sanitized })

const { valid, sanitized: output } = validateOutput(result.content)

// Option 2: Wrapper (recommended)
const safeExecute = withSafety(agent.execute.bind(agent), {
  sanitizeInput: true,
  validateOutput: true,
  logViolations: true
})

const result = await safeExecute(request)
```

### ❌ DON'T: Trust User Input Directly

```typescript
// Bad - no sanitization, PII leakage risk
const result = await agent.execute({ message: userInput })
return result.content // May contain PII or system prompts
```

## 5. Performance Optimization

### ✅ DO: Use Caching and Batching

```typescript
import { withCache, createCachedPrompt, executeToolsInParallel } from '@aah/ai'

// Response caching
const cachedExecute = withCache(agent.execute.bind(agent), {
  ttl: 3600000, // 1 hour
  keyGenerator: (req) => `${req.agentType}:${req.message}`
})

// Prompt caching (Claude-specific)
const messages = createCachedPrompt({
  systemPrompt: ADVISING_AGENT_PROMPT,
  context: JSON.stringify(studentContext),
  cacheControl: 'ephemeral'
})

// Parallel tool execution
const [courses, conflicts, requirements] = await executeToolsInParallel([
  () => searchCourses(params1),
  () => checkConflicts(params2),
  () => getDegreeRequirements(params3)
])
```

### ❌ DON'T: Execute Tools Sequentially

```typescript
// Bad - slow, expensive
const courses = await searchCourses(params1)
const conflicts = await checkConflicts(params2)
const requirements = await getDegreeRequirements(params3)
```

## 6. Context Management

### ✅ DO: Compress Long Conversations

```typescript
import { compressMessages, isContextWindowNearLimit } from '@aah/ai'

if (isContextWindowNearLimit(currentTokens, maxTokens, 0.8)) {
  // Semantic compression with LLM
  messages = await compressMessages(messages, model, 2, 5)
  
  // Or simple compression without LLM
  messages = compressMessagesSimple(messages, 2, 5)
}
```

### ❌ DON'T: Let Context Grow Unbounded

```typescript
// Bad - will hit token limits
messages.push({ role: 'user', content: newMessage })
// No compression, no summarization
```

## 7. Error Handling

### ✅ DO: Implement Retry Logic and Self-Correction

```typescript
import { executeWithRetry, executeWithTimeout } from '@aah/ai'

// Retry with exponential backoff
const result = await executeWithRetry(
  () => agent.execute(request),
  maxRetries: 3,
  baseDelay: 1000
)

// Timeout protection
const result = await executeWithTimeout(
  () => agent.execute(request),
  timeoutMs: 30000,
  operation: 'Agent execution'
)

// Agentic workflow includes automatic self-correction
const state = await AgenticWorkflow.execute({
  model,
  plan,
  tools,
  state
})
// Automatically attempts to correct errors
```

### ❌ DON'T: Fail Without Recovery

```typescript
// Bad - no retry, no fallback
try {
  const result = await agent.execute(request)
} catch (error) {
  throw error // Just fails
}
```

## 8. Tool Result Formatting

### ✅ DO: Use XML for Structured Data

```typescript
// In tool execution
return `<tool_result tool="searchCourses" success="true">
<data>
<courses>
  <course>
    <code>MATH 201</code>
    <title>Calculus I</title>
    <credits>4</credits>
    <schedule>MWF 9:00-9:50 AM</schedule>
  </course>
</courses>
</data>
</tool_result>`
```

### ❌ DON'T: Return Unstructured JSON

```typescript
// Bad - harder for Claude to parse reliably
return JSON.stringify({ courses: [...] })
```

## 9. Thinking Tags

### ✅ DO: Encourage Chain-of-Thought

```typescript
// In system prompt
outputFormat: `When solving problems:
1. Use <thinking> tags to show your reasoning
2. Break down complex problems
3. Verify your logic before responding

Example:
<thinking>
User wants MATH 201. Need to:
1. Check course availability
2. Verify prerequisites
3. Check for conflicts
</thinking>

Let me search for MATH 201...`
```

### ❌ DON'T: Skip Reasoning Steps

```typescript
// Bad - no transparency in decision-making
outputFormat: 'Just provide the answer'
```

## 10. Permission Checks

### ✅ DO: Validate Permissions Before Tool Execution

```typescript
import { checkPermission } from '@aah/ai'

const { allowed, reason } = checkPermission(
  userRoles,
  ['read:student', 'write:grades'],
  'update student grades'
)

if (!allowed) {
  throw new PermissionDeniedError(userId, 'grades', 'write')
}
```

### ❌ DON'T: Skip Authorization

```typescript
// Bad - security risk
const result = await updateGrades(studentId, grades)
// No permission check
```

## Quick Checklist

Before deploying an agent, verify:

- [ ] System prompt uses XML structure with role, context, capabilities, constraints
- [ ] Tools have detailed descriptions with usage guidance and examples
- [ ] Complex tasks use Plan → Execute → Reflect pattern
- [ ] Input sanitization removes PII and checks for injection
- [ ] Output validation prevents PII leakage
- [ ] Response caching enabled for repeated queries
- [ ] Prompt caching enabled for Claude (if using Anthropic)
- [ ] Context compression implemented for long conversations
- [ ] Retry logic with exponential backoff
- [ ] Permission checks before tool execution
- [ ] Tool results formatted with XML
- [ ] Thinking tags encouraged in prompts
- [ ] Error handling with self-correction
- [ ] Rate limiting implemented
- [ ] Audit logging for compliance

## Performance Targets

| Metric | Target | How to Achieve |
|--------|--------|----------------|
| Response Quality | +20-30% | Structured XML prompts |
| Tool Accuracy | +40% | Detailed tool descriptions |
| Complex Task Success | 90%+ | Agentic workflows |
| Latency (cached) | <500ms | Prompt + response caching |
| Token Usage | -50-70% | Selective tool loading |
| Cost per Request | -70% | Caching + optimization |
| Security Incidents | -95% | Input/output validation |

## Resources

- [Claude Cookbooks](https://github.com/anthropics/claude-cookbooks)
- [Vercel AI SDK Docs](https://sdk.vercel.ai/docs)
- [Langfuse Observability](https://langfuse.com/docs)
- [Implementation Review](./.kiro/specs/ai-agents-implementation/CLAUDE_COOKBOOKS_REVIEW.md)
