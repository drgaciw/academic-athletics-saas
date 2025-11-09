# Agent Memory - Quick Start Guide

## Installation

Memory system is included in `@aah/ai` package. No additional installation needed.

## Basic Usage

### Save a Fact

```typescript
import { saveFact } from '@aah/ai'

await saveFact({
  userId: 'user123',
  memoryType: 'long_term',
  content: 'Student prefers morning classes',
  metadata: { 
    source: 'conversation',
    confidence: 0.9 
  },
  importance: 0.8
})
```

### Retrieve Relevant Memories

```typescript
import { getRelevantMemories } from '@aah/ai'

const memories = await getRelevantMemories(
  'user123',
  'When does the student like to have classes?',
  {
    memoryType: 'long_term',
    limit: 5,
    minImportance: 0.5
  }
)

// memories[0].content: "Student prefers morning classes"
// memories[0].relevanceScore: 0.92
```

### Summarize Conversation

```typescript
import { summarizeConversation } from '@aah/ai'

const summary = await summarizeConversation('conversation-id')

console.log(summary.summary)      // "Discussion about course selection..."
console.log(summary.keyPoints)    // ["Student needs 12 credits", ...]
console.log(summary.facts)        // ["Majoring in CS", ...]
```

### Extract Facts from Conversation

```typescript
import { extractAndSaveFacts } from '@aah/ai'

const facts = await extractAndSaveFacts(
  'user123',
  'conversation-id',
  'advising'
)

// Automatically extracts and saves important facts
```

## Memory Types

| Type | Purpose | Lifetime | Use Case |
|------|---------|----------|----------|
| `short_term` | Recent context | 24 hours | Conversation flow |
| `long_term` | Important facts | Indefinite | Preferences, goals |
| `working` | Temporary reasoning | 1 hour | Multi-step tasks |

## Agent Integration

### Enable Memory for Agent

```typescript
import { createAdvisingAgent } from '@aah/ai'

const agent = createAdvisingAgent({
  memoryEnabled: true  // Automatically retrieves relevant memories
})
```

### Memory is Retrieved Automatically

When memory is enabled, agents automatically:
1. Search for relevant memories based on user query
2. Include top 5 memories in context
3. Extract and save new facts after execution

## Advanced Usage

### Custom Importance Calculation

```typescript
await saveFact({
  userId: 'user123',
  memoryType: 'long_term',
  content: 'Student must graduate by May 2026',
  metadata: { type: 'deadline', critical: true },
  importance: 1.0,  // Maximum importance
  confidence: 1.0   // High confidence
})
```

### Filter by Memory Type

```typescript
const workingMemories = await getRelevantMemories(
  'user123',
  'current task context',
  {
    memoryType: 'working',  // Only working memory
    limit: 3
  }
)
```

### Set Expiration

```typescript
await saveFact({
  userId: 'user123',
  memoryType: 'working',
  content: 'Currently analyzing course conflicts',
  metadata: { task: 'scheduling' },
  expiresAt: new Date(Date.now() + 60 * 60 * 1000)  // 1 hour
})
```

### Get Memory Statistics

```typescript
import { globalMemoryStore } from '@aah/ai'

const stats = await globalMemoryStore.getMemoryStats('user123')

console.log(stats.totalMemories)      // 42
console.log(stats.byType.long_term)   // 30
console.log(stats.averageImportance)  // 0.65
```

## API Endpoints

### Search Memories
```http
GET /api/ai/memory/:userId/memories?query=courses&limit=10
```

### Save Fact
```http
POST /api/ai/memory/:userId/facts
Content-Type: application/json

{
  "content": "Student is majoring in Computer Science",
  "metadata": { "source": "profile" },
  "importance": 0.9
}
```

### Get Statistics
```http
GET /api/ai/memory/:userId/stats
```

## Best Practices

### 1. Set Appropriate Importance

```typescript
// Critical information
importance: 1.0  // Deadlines, requirements, constraints

// Important preferences
importance: 0.7-0.9  // User preferences, goals

// General context
importance: 0.5-0.7  // Background information

// Low priority
importance: 0.2-0.5  // Temporary notes
```

### 2. Use Metadata for Context

```typescript
metadata: {
  source: 'conversation' | 'profile' | 'system',
  agentType: 'advising' | 'compliance' | ...,
  category: 'preference' | 'fact' | 'goal',
  timestamp: new Date().toISOString()
}
```

### 3. Clean Up Regularly

```typescript
import { globalMemoryStore } from '@aah/ai'

// Clean expired memories
await globalMemoryStore.cleanupExpiredMemories()

// Clean low-importance old memories
await globalMemoryStore.cleanupLowImportanceMemories(
  0.2,  // threshold
  30 * 24 * 60 * 60 * 1000  // 30 days
)
```

### 4. Batch Operations

```typescript
// Save multiple facts efficiently
const facts = [
  'Student is majoring in CS',
  'Student plays basketball',
  'Student prefers morning classes'
]

await Promise.all(
  facts.map(content => saveFact({
    userId: 'user123',
    memoryType: 'long_term',
    content,
    metadata: { batch: true }
  }))
)
```

## Performance Tips

### 1. Limit Search Results

```typescript
// Good: Limit to what you need
const memories = await getRelevantMemories(userId, query, { limit: 5 })

// Bad: Retrieving too many
const memories = await getRelevantMemories(userId, query, { limit: 100 })
```

### 2. Filter by Importance

```typescript
// Only retrieve important memories
const memories = await getRelevantMemories(userId, query, {
  minImportance: 0.5,
  minConfidence: 0.7
})
```

### 3. Use Appropriate Memory Types

```typescript
// Short-term: Use existing Conversation/Message models
// Long-term: Use AgentMemory with embeddings
// Working: Use AgentMemory with short expiration
```

## Troubleshooting

### Memory Not Retrieved

**Check**:
1. Is `memoryEnabled: true` in agent config?
2. Are there memories with sufficient importance?
3. Is the query semantically similar to stored memories?

**Debug**:
```typescript
const memories = await getRelevantMemories(userId, query, {
  limit: 10,
  minImportance: 0.0  // Lower threshold
})
console.log('Found memories:', memories.length)
console.log('Relevance scores:', memories.map(m => m.relevanceScore))
```

### Slow Search

**Solutions**:
1. Reduce search limit
2. Increase importance threshold
3. Add HNSW index to database
4. Cache frequent queries

### High Costs

**Solutions**:
1. Cache embeddings for common queries
2. Use smaller embedding model
3. Batch embedding generation
4. Clean up old memories regularly

## Examples

### Example 1: Course Preference Memory

```typescript
// Save preference
await saveFact({
  userId: 'student123',
  memoryType: 'long_term',
  content: 'Student prefers courses with hands-on projects',
  metadata: { 
    category: 'preference',
    domain: 'learning_style'
  },
  importance: 0.8
})

// Later, when recommending courses
const memories = await getRelevantMemories(
  'student123',
  'What courses should I take?',
  { limit: 5 }
)
// Will retrieve the preference and use it in recommendations
```

### Example 2: Multi-Step Task Memory

```typescript
// Step 1: Save working memory
await saveFact({
  userId: 'student123',
  memoryType: 'working',
  content: 'Analyzing schedule conflicts for Fall 2026',
  metadata: { 
    task: 'scheduling',
    step: 1
  },
  expiresAt: new Date(Date.now() + 60 * 60 * 1000)  // 1 hour
})

// Step 2: Retrieve context
const context = await getRelevantMemories(
  'student123',
  'schedule conflicts',
  { memoryType: 'working' }
)
// Agent knows it's in the middle of scheduling task
```

### Example 3: Conversation Summarization

```typescript
// After long conversation
const summary = await summarizeConversation('conv-123')

// Save summary as long-term memory
await saveFact({
  userId: 'student123',
  memoryType: 'long_term',
  content: summary.summary,
  metadata: {
    type: 'conversation_summary',
    conversationId: 'conv-123',
    keyPoints: summary.keyPoints
  },
  importance: 0.7
})
```

## Migration Guide

### From No Memory to Memory-Enabled

```typescript
// Before
const agent = createAdvisingAgent()

// After
const agent = createAdvisingAgent({
  memoryEnabled: true
})

// That's it! Memory is automatically integrated
```

### Migrating Existing Data

```typescript
// Extract facts from existing conversations
const conversations = await prisma.conversation.findMany({
  where: { userId: 'student123' },
  include: { messages: true }
})

for (const conv of conversations) {
  await extractAndSaveFacts(
    conv.userId,
    conv.id,
    'general'
  )
}
```

## Resources

- [Full Implementation Plan](../../.kiro/specs/ai-agents-implementation/AGENT_MEMORY_IMPLEMENTATION_PLAN.md)
- [Memory System Summary](../../.kiro/specs/ai-agents-implementation/MEMORY_SYSTEM_SUMMARY.md)
- [Agent Types](./types/agent.types.ts)
- [Memory Store Implementation](./lib/agent-memory.ts)

## Support

For issues or questions:
1. Check [Troubleshooting](#troubleshooting) section
2. Review [Implementation Plan](../../.kiro/specs/ai-agents-implementation/AGENT_MEMORY_IMPLEMENTATION_PLAN.md)
3. Contact AI team

---

**Version**: 1.0.0  
**Last Updated**: November 8, 2025  
**Status**: Production Ready
