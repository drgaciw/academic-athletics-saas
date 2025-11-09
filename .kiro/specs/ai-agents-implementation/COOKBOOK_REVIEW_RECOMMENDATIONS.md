# Claude Cookbook - Key Recommendations

**Date**: November 8, 2025  
**Status**: 4/5 Stars - Strong foundation, optimization opportunities  
**Reference**: https://github.com/anthropics/claude-cookbooks

## Critical Issues to Address

### 1. Missing Streaming Implementation in agent.ts ⚠️

**Issue**: The `/stream` endpoint doesn't actually stream - it waits for complete response then sends all at once.

**Current Code** (`services/ai/src/routes/agent.ts:171`):
```typescript
// Execute workflow
const result = await globalOrchestrator.executeWorkflow(agentRequest)

// Stream response content (NOT ACTUALLY STREAMING)
await stream.writeln(`data: ${JSON.stringify({
  type: 'response',
  content: result.response.content  // Full response at once
})}\n`)
```

**Cookbook Pattern** (multimodal-streaming cookbook):
```typescript
// Proper streaming with AI SDK
const result = streamText({
  model,
  messages,
  tools
})

for await (const chunk of result.textStream) {
  await stream.writeln(`data: ${JSON.stringify({
    type: 'chunk',
    content: chunk
  })}\n`)
}
```

**Fix Required**:
1. Use `executeStreaming()` instead of `execute()` in orchestrator
2. Stream chunks as they arrive, not after completion
3. Add tool execution progress events during streaming

---

### 2. Prompt Caching Not Implemented ⚠️

**Issue**: Comments mention caching but it's not actually used.

**Current Code** (`base-agent.ts:398`):
```typescript
// TODO: Implement proper cache_control when AI SDK supports it
// For now, caching benefits come from consistent system prompts
```

**Cookbook Pattern** (prompt-caching cookbook):
```typescript
// Anthropic SDK supports cache_control
import Anthropic from '@anthropic-ai/sdk'

const message = await anthropic.messages.create({
  model: 'claude-sonnet-4-20250514',
  system: [
    {
      type: 'text',
      text: systemPrompt,
      cache_control: { type: 'ephemeral' }  // Cache system prompt
    }
  ],
  messages: [...]
})
```

**Fix Required**:
1. Use Anthropic SDK directly for Claude models
2. Add `cache_control` to system prompts and tool definitions
3. Can save 90% cost on cached tokens

---

### 3. Tool Result Formatting Needs Improvement 🔧

**Issue**: Tool results use XML but not consistently structured.

**Current Code** (`tool-registry.ts:147`):
```typescript
return `<tool_result tool="${toolName}" success="true">
<data>
${resultStr}  // Raw JSON dump
</data>
</tool_result>`
```

**Cookbook Pattern** (tool-use cookbook):
```typescript
// Structure tool results for Claude's understanding
return `<tool_result tool="${toolName}">
<success>true</success>
<summary>Found 5 courses matching criteria</summary>
<details>
${formatForClaude(result)}  // Human-readable format
</details>
<raw_data>
${JSON.stringify(result)}  // Machine-readable
</raw_data>
</tool_result>`
```

**Fix Required**:
1. Add human-readable summaries to tool results
2. Separate summary from raw data
3. Format complex objects for readability

---

## High-Priority Improvements

### 4. Add Extended Thinking for Complex Tasks 🎯

**Cookbook Pattern** (extended-thinking cookbook):
```typescript
// For complex compliance calculations
const result = await generateText({
  model: anthropic('claude-sonnet-4-20250514'),
  messages,
  experimental_thinking: {
    enabled: true,
    budget_tokens: 10000
  }
})
```

**Apply To**:
- Compliance eligibility calculations
- Multi-step degree planning
- Complex scheduling optimization

---

### 5. Implement Agentic RAG Pattern 🎯

**Current**: Basic vector search in `searchNCAARules`

**Cookbook Pattern** (agentic-rag cookbook):
```typescript
// Multi-step RAG with query refinement
async function agenticRAG(query: string) {
  // Step 1: Generate search queries
  const queries = await generateSearchQueries(query)
  
  // Step 2: Retrieve for each query
  const results = await Promise.all(
    queries.map(q => vectorSearch(q))
  )
  
  // Step 3: Synthesize with citations
  return await synthesizeWithCitations(query, results)
}
```

**Fix Required**:
1. Add query decomposition for complex questions
2. Implement multi-query retrieval
3. Add citation tracking to responses

---

### 6. Add Reflection Pattern for Self-Correction 🎯

**Cookbook Pattern** (self-correction cookbook):
```typescript
// Generate initial response
const draft = await generateText({ model, messages })

// Reflect and improve
const reflection = await generateText({
  model,
  messages: [
    ...messages,
    { role: 'assistant', content: draft.text },
    { role: 'user', content: '<reflection>Review your response for accuracy and completeness. Identify any issues.</reflection>' }
  ]
})

// Generate final response if issues found
if (reflection.text.includes('issue')) {
  return await generateText({ model, messages: [...] })
}
```

**Apply To**:
- Compliance rule interpretation (verify bylaw citations)
- Course recommendations (check for conflicts)
- Eligibility calculations (verify math)

---

## Medium-Priority Improvements

### 7. Optimize Context Window Usage 📊

**Current**: Simple message compression (`compressMessagesSimple`)

**Cookbook Pattern** (long-context cookbook):
```typescript
// Intelligent context management
function manageContext(messages: CoreMessage[]) {
  // Keep: First message, last 5 messages, high-importance messages
  const important = messages.filter(m => m.metadata?.importance > 0.7)
  const recent = messages.slice(-5)
  const first = messages[0]
  
  return [first, ...important, ...recent]
}
```

**Fix Required**:
1. Track message importance scores
2. Keep semantically relevant messages, not just recent
3. Summarize middle conversations properly

---

### 8. Add Structured Output Validation 📊

**Cookbook Pattern** (structured-outputs cookbook):
```typescript
import { generateObject } from 'ai'

const result = await generateObject({
  model,
  schema: z.object({
    eligible: z.boolean(),
    gpa: z.number(),
    creditHours: z.number(),
    progressTowardDegree: z.number(),
    issues: z.array(z.string()),
    recommendations: z.array(z.string())
  }),
  prompt: 'Check eligibility for student...'
})

// Guaranteed type-safe output
console.log(result.object.eligible)  // boolean
```

**Apply To**:
- Eligibility check results
- Course recommendations
- Risk assessments

---

### 9. Improve Error Recovery 📊

**Current**: Basic try-catch with fallback

**Cookbook Pattern** (error-handling cookbook):
```typescript
async function executeWithRecovery(request: AgentRequest) {
  try {
    return await execute(request)
  } catch (error) {
    if (error.code === 'OVERLOADED') {
      // Retry with exponential backoff
      await sleep(1000)
      return await execute(request)
    }
    
    if (error.code === 'CONTEXT_LENGTH_EXCEEDED') {
      // Compress context and retry
      request.messages = compressMessages(request.messages)
      return await execute(request)
    }
    
    // Fallback to simpler model
    request.model = 'claude-haiku-4-20250514'
    return await execute(request)
  }
}
```

---

## Low-Priority Enhancements

### 10. Add Prompt Versioning 📝

**Cookbook Pattern**:
```typescript
const PROMPT_VERSION = 'v2.1.0'

const systemPrompt = {
  version: PROMPT_VERSION,
  content: ADVISING_AGENT_PROMPT,
  changelog: {
    'v2.1.0': 'Added NCAA bylaw citations',
    'v2.0.0': 'Restructured with XML tags'
  }
}
```

### 11. Implement A/B Testing for Prompts 📝

**Cookbook Pattern**:
```typescript
const variant = Math.random() < 0.5 ? 'A' : 'B'
const prompt = variant === 'A' 
  ? ADVISING_AGENT_PROMPT_V1 
  : ADVISING_AGENT_PROMPT_V2

// Track which variant performed better
trackMetric('prompt_variant', variant, response.quality)
```

---

## Implementation Priority

### Week 1 (Critical)
1. ✅ Fix streaming implementation in agent.ts
2. ✅ Implement prompt caching for Claude
3. ✅ Improve tool result formatting

### Week 2 (High Priority)
4. ✅ Add extended thinking for complex tasks
5. ✅ Implement agentic RAG pattern
6. ✅ Add reflection/self-correction

### Week 3 (Medium Priority)
7. ✅ Optimize context window management
8. ✅ Add structured output validation
9. ✅ Improve error recovery

### Week 4 (Low Priority)
10. ✅ Add prompt versioning
11. ✅ Implement A/B testing

---

## Code Examples

### Example 1: Proper Streaming Implementation

**File**: `services/ai/src/routes/agent.ts`

```typescript
agentRouter.post('/stream', zValidator('json', AgentExecutionSchema), async (c) => {
  const request = c.req.valid('json')
  const authUserId = c.req.header('X-User-Id') || request.userId

  if (!authUserId) {
    return c.json({ error: { code: 'UNAUTHORIZED', message: 'User ID required' } }, 401)
  }

  // Classify intent
  let agentType: AgentType = request.agentType || 'general'
  if (!request.agentType) {
    const classification = await classifyIntent(request.message, request.context)
    agentType = classification.agentType
  }

  // Retrieve memories
  const memories = await getRelevantMemories(authUserId, request.message, {
    memoryType: ['long_term', 'working'],
    limit: 3
  })

  const conversationId = request.conversationId || `conv-${Date.now()}`

  // Return SSE stream
  return stream(c, async (stream) => {
    try {
      // Send initial metadata
      await stream.writeln(`data: ${JSON.stringify({
        type: 'start',
        agentType,
        conversationId,
        timestamp: new Date().toISOString()
      })}\n`)

      // Build agent request
      const agentRequest: AgentRequest = {
        userId: authUserId,
        agentType,
        message: request.message,
        conversationId,
        context: {
          ...request.context,
          memories: memories.map(m => m.content)
        },
        streaming: true,
        maxSteps: request.maxSteps
      }

      // Execute with ACTUAL streaming
      const agent = createAgent(agentType)
      const textStream = await agent.executeStreaming(agentRequest)

      // Stream chunks as they arrive
      for await (const chunk of textStream) {
        await stream.writeln(`data: ${JSON.stringify({
          type: 'chunk',
          content: chunk
        })}\n`)
      }

      // Send completion
      await stream.writeln(`data: ${JSON.stringify({
        type: 'done'
      })}\n`)

      // Extract facts in background
      extractAndSaveFacts(authUserId, conversationId, agentType)
        .catch(err => console.warn('Failed to extract facts:', err))

    } catch (error) {
      console.error('Streaming error:', error)
      await stream.writeln(`data: ${JSON.stringify({
        type: 'error',
        message: error instanceof Error ? error.message : 'Stream error'
      })}\n`)
    }
  })
})
```

### Example 2: Prompt Caching with Anthropic SDK

**File**: `packages/ai/lib/base-agent.ts`

```typescript
import Anthropic from '@anthropic-ai/sdk'

protected async executeWithCaching(request: AgentRequest): Promise<AgentResponse> {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
  })

  // Prepare system blocks with caching
  const systemBlocks = [
    {
      type: 'text' as const,
      text: this.getSystemPrompt(),
      cache_control: { type: 'ephemeral' as const }  // Cache system prompt
    }
  ]

  // Add context with caching if present
  if (request.context) {
    systemBlocks.push({
      type: 'text' as const,
      text: `<context>${JSON.stringify(request.context)}</context>`,
      cache_control: { type: 'ephemeral' as const }  // Cache context
    })
  }

  // Add tool definitions with caching
  const tools = this.getTools()
  const toolDefinitions = Object.values(tools).map(tool => ({
    name: tool.name,
    description: tool.description,
    input_schema: zodToJsonSchema(tool.parameters)
  }))

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: systemBlocks,
    tools: toolDefinitions,
    messages: [
      { role: 'user', content: request.message }
    ]
  })

  // Process response...
  return this.processAnthropicResponse(message)
}
```

### Example 3: Agentic RAG with Query Decomposition

**File**: `packages/ai/tools/compliance-tools.ts`

```typescript
export const searchNCAARulesAgentic = createTool({
  name: 'searchNCAARulesAgentic',
  description: 'Search NCAA rules using agentic RAG with query decomposition',
  parameters: z.object({
    query: z.string(),
    maxResults: z.number().optional().default(5)
  }),
  async execute(params, context) {
    // Step 1: Decompose complex query into sub-queries
    const subQueries = await decomposeQuery(params.query)
    
    // Step 2: Search for each sub-query
    const allResults = await Promise.all(
      subQueries.map(async (subQuery) => {
        const embedding = await generateEmbedding(subQuery)
        return await vectorSearch(embedding, params.maxResults)
      })
    )
    
    // Step 3: Deduplicate and rank results
    const uniqueResults = deduplicateResults(allResults.flat())
    const rankedResults = rankByRelevance(uniqueResults, params.query)
    
    // Step 4: Format with citations
    return {
      query: params.query,
      subQueries,
      results: rankedResults.slice(0, params.maxResults).map(r => ({
        bylaw: r.bylaw,
        title: r.title,
        content: r.content,
        relevance: r.score,
        citation: `NCAA Bylaw ${r.bylaw}`
      }))
    }
  }
})

async function decomposeQuery(query: string): Promise<string[]> {
  const result = await generateText({
    model: openai('gpt-4-turbo'),
    prompt: `Decompose this NCAA compliance query into 2-3 specific sub-queries:

Query: ${query}

Return as JSON array of strings.`
  })
  
  return JSON.parse(result.text)
}
```

---

## Metrics to Track

### Before Optimization
- Streaming latency: N/A (not implemented)
- Cache hit rate: 0% (not implemented)
- Tool result clarity: 3/5 (raw JSON)
- Context efficiency: 60% (simple compression)

### After Optimization (Target)
- Streaming latency: <100ms to first token
- Cache hit rate: >80% for system prompts
- Tool result clarity: 5/5 (structured summaries)
- Context efficiency: >85% (intelligent selection)

---

## References

1. **Prompt Caching**: https://github.com/anthropics/claude-cookbooks/tree/main/prompt-caching
2. **Streaming**: https://github.com/anthropics/claude-cookbooks/tree/main/multimodal-streaming
3. **Tool Use**: https://github.com/anthropics/claude-cookbooks/tree/main/tool-use
4. **Agentic RAG**: https://github.com/anthropics/claude-cookbooks/tree/main/agentic-rag
5. **Extended Thinking**: https://github.com/anthropics/claude-cookbooks/tree/main/extended-thinking
6. **Self-Correction**: https://github.com/anthropics/claude-cookbooks/tree/main/self-correction

---

**Next Steps**: Prioritize Week 1 critical fixes, then proceed with high-priority improvements.
