# Agent Memory System - Full Stack Implementation Plan

**Date**: November 8, 2025  
**Status**: Schema Updated - Implementation Required  
**Related Tasks**: 5.1, 5.2, 5.3 from tasks.md

## Overview

The `AgentMemory` model has been added to the Prisma schema, enabling long-term memory storage with vector embeddings for AI agents. This document outlines all required updates across the full stack.

## Database Changes

### ✅ Completed: Prisma Schema Update

```prisma
model AgentMemory {
  id           String                      @id @default(cuid())
  userId       String
  user         User                        @relation(fields: [userId], references: [id], onDelete: Cascade)
  memoryType   String // short_term, long_term, working
  content      String                      @db.Text
  embedding    Unsupported("vector(1536)")?
  metadata     Json
  confidence   Float?                      @default(1.0)
  importance   Float?                      @default(0.5)
  accessCount  Int                         @default(0)
  lastAccessed DateTime?
  expiresAt    DateTime?
  createdAt    DateTime                    @default(now())
  updatedAt    DateTime                    @updatedAt

  @@index([userId, memoryType])
  @@index([userId, expiresAt])
  @@index([memoryType])
  @@index([importance])
  @@index([createdAt])
}
```

**Key Features**:
- Vector embeddings (1536 dimensions) for semantic search using pgvector
- Memory types: short_term, long_term, working
- Confidence and importance scoring
- Access tracking for memory optimization
- Automatic expiration support
- Cascading delete with User

### 🔄 Required: Database Migration

```bash
# Run in packages/database
npx prisma migrate dev --name add_agent_memory_model

# Or for production
npx prisma migrate deploy
```

**Migration SQL** (auto-generated):
```sql
-- CreateTable
CREATE TABLE "AgentMemory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "memoryType" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "embedding" vector(1536),
    "metadata" JSONB NOT NULL,
    "confidence" DOUBLE PRECISION DEFAULT 1.0,
    "importance" DOUBLE PRECISION DEFAULT 0.5,
    "accessCount" INTEGER NOT NULL DEFAULT 0,
    "lastAccessed" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentMemory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AgentMemory_userId_memoryType_idx" ON "AgentMemory"("userId", "memoryType");
CREATE INDEX "AgentMemory_userId_expiresAt_idx" ON "AgentMemory"("userId", "expiresAt");
CREATE INDEX "AgentMemory_memoryType_idx" ON "AgentMemory"("memoryType");
CREATE INDEX "AgentMemory_importance_idx" ON "AgentMemory"("importance");
CREATE INDEX "AgentMemory_createdAt_idx" ON "AgentMemory"("createdAt");

-- AddForeignKey
ALTER TABLE "AgentMemory" ADD CONSTRAINT "AgentMemory_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

### 🔄 Required: Enable pgvector Extension

Ensure pgvector is enabled in your PostgreSQL database:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

For Vercel Postgres, this is already enabled. For local development:

```bash
# Install pgvector (macOS)
brew install pgvector

# Or via Docker
docker run -d \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  ankane/pgvector
```

---

## Backend Updates

### 1. ✅ Completed: Agent Memory Store (`packages/ai/lib/agent-memory.ts`)

**Status**: Implementation complete, needs Prisma client dependency fix

**Features Implemented**:
- `saveConversation()` - Stores conversations using existing Conversation/Message models
- `saveFact()` - Stores long-term facts with vector embeddings
- `getRelevantMemories()` - Vector similarity search using pgvector
- `summarizeConversation()` - LLM-based conversation summarization
- `extractAndSaveFacts()` - Automatic fact extraction from conversations
- `cleanupExpiredMemories()` - Automatic memory cleanup
- `getMemoryStats()` - Memory usage analytics

**Required Fix**: Add `@prisma/client` to dependencies

```bash
cd packages/ai
pnpm add @prisma/client
```

### 2. 🔄 Required: Update Agent Types (`packages/ai/types/agent.types.ts`)

**Status**: Types already defined correctly

The following types are already present:
- `MemoryType = 'short_term' | 'long_term' | 'working'`
- `AgentMemory` interface
- `ConversationMemory` interface

**No changes needed** ✅

### 3. 🔄 Required: Integrate Memory with Base Agent (`packages/ai/lib/base-agent.ts`)

Add memory retrieval to agent execution:

```typescript
// In base-agent.ts prepareMessages()
protected async prepareMessages(
  request: AgentRequest,
  state: AgentState
): Promise<CoreMessage[]> {
  const messages: CoreMessage[] = []
  
  // Add system prompt
  messages.push({ role: 'system', content: this.getSystemPrompt() })
  
  // Retrieve relevant memories if memory is enabled
  if (this.config.memoryEnabled) {
    const { getRelevantMemories } = await import('./agent-memory')
    const memories = await getRelevantMemories(
      request.userId,
      request.message,
      {
        memoryType: ['long_term', 'working'],
        limit: 5,
        minImportance: 0.5
      }
    )
    
    if (memories.length > 0) {
      const memoryContext = memories
        .map(m => `- ${m.content} (relevance: ${(m.relevanceScore! * 100).toFixed(0)}%)`)
        .join('\n')
      
      messages.push({
        role: 'system',
        content: `<relevant_memories>\n${memoryContext}\n</relevant_memories>`
      })
    }
  }
  
  // Add conversation history
  messages.push(...state.messages)
  
  // Add current message
  messages.push({ role: 'user', content: request.message })
  
  return messages
}

// After successful execution, save facts
protected async onExecutionComplete(
  request: AgentRequest,
  response: AgentResponse
): Promise<void> {
  if (this.config.memoryEnabled && request.conversationId) {
    const { extractAndSaveFacts } = await import('./agent-memory')
    
    try {
      await extractAndSaveFacts(
        request.userId,
        request.conversationId,
        this.config.type
      )
    } catch (error) {
      console.warn('Failed to extract facts:', error)
    }
  }
}
```

### 4. 🔄 Required: Update Agent Orchestrator (`packages/ai/lib/agent-orchestrator.ts`)

Add memory management to workflow execution:

```typescript
// In executeWorkflow()
async executeWorkflow(request: AgentRequest): Promise<WorkflowResult> {
  // ... existing code ...
  
  // Save conversation after workflow completes
  if (request.conversationId) {
    const { saveConversation } = await import('./agent-memory')
    await saveConversation(
      request.userId,
      request.conversationId,
      state.messages
    )
  }
  
  return result
}
```

### 5. 🔄 Required: Add Memory Management API Routes

Create new routes in `services/ai/src/routes/memory.ts`:

```typescript
import { Hono } from 'hono'
import { 
  getRelevantMemories, 
  saveFact, 
  globalMemoryStore 
} from '@aah/ai'

const memory = new Hono()

// Get relevant memories for user
memory.get('/:userId/memories', async (c) => {
  const userId = c.req.param('userId')
  const query = c.req.query('query') || ''
  const memoryType = c.req.query('type')
  const limit = parseInt(c.req.query('limit') || '10')
  
  const memories = await getRelevantMemories(userId, query, {
    memoryType: memoryType as any,
    limit,
    minImportance: 0.3
  })
  
  return c.json({ memories })
})

// Save a fact to long-term memory
memory.post('/:userId/facts', async (c) => {
  const userId = c.req.param('userId')
  const { content, metadata, importance } = await c.req.json()
  
  const memory = await saveFact({
    userId,
    memoryType: 'long_term',
    content,
    metadata,
    importance
  })
  
  return c.json({ memory })
})

// Get memory statistics
memory.get('/:userId/stats', async (c) => {
  const userId = c.req.param('userId')
  const stats = await globalMemoryStore.getMemoryStats(userId)
  
  return c.json({ stats })
})

// Cleanup expired memories (admin only)
memory.post('/cleanup', async (c) => {
  const count = await globalMemoryStore.cleanupExpiredMemories()
  return c.json({ deletedCount: count })
})

export default memory
```

Register in `services/ai/src/index.ts`:

```typescript
import memory from './routes/memory'

app.route('/memory', memory)
```

### 6. 🔄 Required: Add Memory Cleanup Cron Job

Create `services/ai/src/jobs/memory-cleanup.ts`:

```typescript
import { globalMemoryStore } from '@aah/ai'

export async function cleanupMemories() {
  console.log('Starting memory cleanup...')
  
  // Clean expired memories
  const expiredCount = await globalMemoryStore.cleanupExpiredMemories()
  console.log(`Deleted ${expiredCount} expired memories`)
  
  // Clean low-importance old memories
  const lowImportanceCount = await globalMemoryStore.cleanupLowImportanceMemories(
    0.2, // threshold
    30 * 24 * 60 * 60 * 1000 // 30 days
  )
  console.log(`Deleted ${lowImportanceCount} low-importance memories`)
  
  return {
    expiredCount,
    lowImportanceCount,
    totalDeleted: expiredCount + lowImportanceCount
  }
}

// Run daily at 2 AM
if (process.env.NODE_ENV === 'production') {
  setInterval(cleanupMemories, 24 * 60 * 60 * 1000)
}
```

---

## Frontend Updates

### 1. 🔄 Required: Memory Viewer Component

Create `apps/web/components/agent/MemoryViewer.tsx`:

```typescript
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@aah/ui'

interface Memory {
  id: string
  content: string
  memoryType: string
  importance: number
  createdAt: string
  relevanceScore?: number
}

export function MemoryViewer({ userId }: { userId: string }) {
  const [memories, setMemories] = useState<Memory[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  
  const searchMemories = async () => {
    setLoading(true)
    try {
      const response = await fetch(
        `/api/ai/memory/${userId}/memories?query=${encodeURIComponent(query)}&limit=10`
      )
      const data = await response.json()
      setMemories(data.memories)
    } catch (error) {
      console.error('Failed to search memories:', error)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Agent Memory</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search memories..."
              className="flex-1 px-3 py-2 border rounded"
            />
            <button
              onClick={searchMemories}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
          
          <div className="space-y-2">
            {memories.map((memory) => (
              <div
                key={memory.id}
                className="p-3 border rounded hover:bg-gray-50"
              >
                <div className="flex justify-between items-start">
                  <p className="text-sm">{memory.content}</p>
                  <span className="text-xs text-gray-500 ml-2">
                    {memory.relevanceScore && 
                      `${(memory.relevanceScore * 100).toFixed(0)}% relevant`
                    }
                  </span>
                </div>
                <div className="flex gap-2 mt-2 text-xs text-gray-500">
                  <span className="px-2 py-1 bg-gray-100 rounded">
                    {memory.memoryType}
                  </span>
                  <span>
                    Importance: {(memory.importance * 100).toFixed(0)}%
                  </span>
                  <span>
                    {new Date(memory.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
```

### 2. 🔄 Required: Memory Stats Dashboard

Create `apps/web/app/admin/memory/page.tsx`:

```typescript
import { MemoryViewer } from '@/components/agent/MemoryViewer'
import { Card, CardContent, CardHeader, CardTitle } from '@aah/ui'

async function getMemoryStats() {
  // This would be called server-side
  const response = await fetch(`${process.env.AI_SERVICE_URL}/memory/stats`)
  return response.json()
}

export default async function MemoryDashboardPage() {
  const stats = await getMemoryStats()
  
  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Agent Memory System</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Memories</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.totalMemories}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Average Importance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {(stats.averageImportance * 100).toFixed(0)}%
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>By Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 text-sm">
              <div>Short-term: {stats.byType.short_term}</div>
              <div>Long-term: {stats.byType.long_term}</div>
              <div>Working: {stats.byType.working}</div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <MemoryViewer userId="current-user-id" />
    </div>
  )
}
```

### 3. 🔄 Required: Integrate Memory into Chat Interface

Update `apps/web/components/agent/AgentChat.tsx`:

```typescript
// Add memory context indicator
{memoryEnabled && (
  <div className="text-xs text-gray-500 mb-2">
    💭 Agent has access to your conversation history and learned facts
  </div>
)}
```

---

## Shared Packages Updates

### 1. 🔄 Required: Export Memory Functions (`packages/ai/index.ts`)

```typescript
// Memory System
export {
  AgentMemoryStore,
  globalMemoryStore,
  saveConversation,
  saveFact,
  getRelevantMemories,
  summarizeConversation,
  extractAndSaveFacts,
  type MemoryEntry,
  type MemorySearchOptions,
  type MemorySearchResult,
  type ConversationSummary,
} from './lib/agent-memory'
```

### 2. ✅ Completed: Type Definitions

All necessary types are already defined in `packages/ai/types/agent.types.ts`:
- `MemoryType`
- `AgentMemory`
- `ConversationMemory`

---

## Testing Requirements

### 1. 🔄 Required: Unit Tests

Create `packages/ai/lib/__tests__/agent-memory.test.ts`:

```typescript
import { AgentMemoryStore } from '../agent-memory'
import { PrismaClient } from '@prisma/client'

describe('AgentMemoryStore', () => {
  let store: AgentMemoryStore
  let prisma: PrismaClient
  
  beforeAll(() => {
    store = new AgentMemoryStore()
    prisma = new PrismaClient()
  })
  
  afterAll(async () => {
    await prisma.$disconnect()
  })
  
  describe('saveFact', () => {
    it('should save fact with embedding', async () => {
      const memory = await store.saveFact({
        userId: 'test-user',
        memoryType: 'long_term',
        content: 'Student is majoring in Computer Science',
        metadata: { source: 'conversation' }
      })
      
      expect(memory.id).toBeDefined()
      expect(memory.content).toBe('Student is majoring in Computer Science')
      expect(memory.importance).toBeGreaterThan(0)
    })
  })
  
  describe('getRelevantMemories', () => {
    it('should retrieve semantically similar memories', async () => {
      // Save test memories
      await store.saveFact({
        userId: 'test-user',
        memoryType: 'long_term',
        content: 'Student plays basketball',
        metadata: {}
      })
      
      // Search
      const results = await store.getRelevantMemories(
        'test-user',
        'What sport does the student play?',
        { limit: 5 }
      )
      
      expect(results.length).toBeGreaterThan(0)
      expect(results[0].similarity).toBeGreaterThan(0.5)
    })
  })
  
  describe('summarizeConversation', () => {
    it('should generate conversation summary', async () => {
      const conversationId = 'test-conv'
      
      // Save test conversation
      await store.saveConversation('test-user', conversationId, [
        { role: 'user', content: 'What courses should I take?' },
        { role: 'assistant', content: 'I recommend MATH 201 and CS 101' }
      ])
      
      const summary = await store.summarizeConversation(conversationId)
      
      expect(summary.summary).toBeDefined()
      expect(summary.keyPoints.length).toBeGreaterThan(0)
    })
  })
})
```

### 2. 🔄 Required: Integration Tests

Create `services/ai/src/__tests__/memory-routes.test.ts`:

```typescript
import { describe, it, expect } from '@jest/globals'
import app from '../index'

describe('Memory API Routes', () => {
  it('GET /memory/:userId/memories should return memories', async () => {
    const response = await app.request(
      '/memory/test-user/memories?query=courses'
    )
    
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.memories).toBeDefined()
  })
  
  it('POST /memory/:userId/facts should save fact', async () => {
    const response = await app.request('/memory/test-user/facts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: 'Student prefers morning classes',
        metadata: { preference: true },
        importance: 0.8
      })
    })
    
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.memory.id).toBeDefined()
  })
})
```

---

## Documentation Updates

### 1. 🔄 Required: Update README

Add to `packages/ai/README.md`:

```markdown
## Agent Memory System

The AI package includes a sophisticated memory system that enables agents to:
- Remember facts across conversations (long-term memory)
- Maintain conversation context (short-term memory)
- Use working memory for multi-step reasoning

### Usage

```typescript
import { saveFact, getRelevantMemories } from '@aah/ai'

// Save a fact
await saveFact({
  userId: 'user123',
  memoryType: 'long_term',
  content: 'Student is majoring in Computer Science',
  metadata: { source: 'profile' },
  importance: 0.9
})

// Retrieve relevant memories
const memories = await getRelevantMemories(
  'user123',
  'What is the student studying?',
  { limit: 5, minImportance: 0.5 }
)
```

### Memory Types

- **short_term**: Conversation history (auto-expires)
- **long_term**: Important facts (persists indefinitely)
- **working**: Temporary reasoning context (expires after task)

### Vector Search

Memories are stored with 1536-dimensional embeddings using OpenAI's `text-embedding-3-large` model. Semantic search uses pgvector's cosine similarity operator for fast retrieval.
```

### 2. 🔄 Required: API Documentation

Create `services/ai/docs/MEMORY_API.md`:

```markdown
# Memory API Documentation

## Endpoints

### GET /memory/:userId/memories

Retrieve relevant memories for a user.

**Query Parameters**:
- `query` (string): Search query
- `type` (string): Memory type filter (short_term, long_term, working)
- `limit` (number): Maximum results (default: 10)

**Response**:
```json
{
  "memories": [
    {
      "id": "mem_123",
      "content": "Student is majoring in CS",
      "memoryType": "long_term",
      "importance": 0.9,
      "relevanceScore": 0.85,
      "createdAt": "2025-11-08T10:00:00Z"
    }
  ]
}
```

### POST /memory/:userId/facts

Save a new fact to long-term memory.

**Request Body**:
```json
{
  "content": "Student prefers morning classes",
  "metadata": { "preference": true },
  "importance": 0.8
}
```

**Response**:
```json
{
  "memory": {
    "id": "mem_124",
    "userId": "user123",
    "content": "Student prefers morning classes",
    "importance": 0.8,
    "createdAt": "2025-11-08T10:05:00Z"
  }
}
```

### GET /memory/:userId/stats

Get memory statistics for a user.

**Response**:
```json
{
  "stats": {
    "totalMemories": 42,
    "byType": {
      "short_term": 10,
      "long_term": 30,
      "working": 2
    },
    "averageImportance": 0.65,
    "oldestMemory": "2025-10-01T00:00:00Z",
    "newestMemory": "2025-11-08T10:00:00Z"
  }
}
```
```

---

## Environment Variables

Add to `.env.example`:

```bash
# Agent Memory Configuration
MEMORY_CLEANUP_ENABLED=true
MEMORY_CLEANUP_INTERVAL=86400000  # 24 hours in ms
MEMORY_EXPIRATION_DAYS=90
MEMORY_LOW_IMPORTANCE_THRESHOLD=0.2
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] Run Prisma migration: `npx prisma migrate deploy`
- [ ] Verify pgvector extension is enabled
- [ ] Generate Prisma client: `npx prisma generate`
- [ ] Add `@prisma/client` to `packages/ai/package.json`
- [ ] Run tests: `npm test packages/ai`
- [ ] Update environment variables

### Post-Deployment

- [ ] Verify memory API endpoints are accessible
- [ ] Test vector search performance
- [ ] Monitor memory storage growth
- [ ] Set up memory cleanup cron job
- [ ] Add monitoring alerts for memory usage

---

## Performance Considerations

### Vector Search Optimization

1. **Index Strategy**: The schema includes indexes on:
   - `(userId, memoryType)` - Fast filtering by user and type
   - `(userId, expiresAt)` - Efficient expiration queries
   - `importance` - Quick importance-based filtering

2. **Embedding Generation**: 
   - Uses `text-embedding-3-large` (1536 dimensions)
   - Cost: $0.00013 per 1K tokens
   - Latency: ~100ms per embedding

3. **Query Performance**:
   - Vector similarity search: O(n) with HNSW index
   - Expected latency: <50ms for 10K memories
   - Scales to millions of memories with proper indexing

### Memory Cleanup Strategy

- **Expired memories**: Deleted daily
- **Low-importance memories**: Deleted after 30 days if importance < 0.2
- **Access-based**: Rarely accessed memories can be archived

### Cost Estimation

- **Storage**: ~2KB per memory (including embedding)
- **Embeddings**: $0.13 per 1M tokens
- **Vector search**: Negligible compute cost with pgvector

---

## Security & Compliance

### FERPA Compliance

- All memories are user-scoped with cascading delete
- No PII in embeddings (content is filtered before embedding)
- Audit logging for memory access (via AIAuditLog)

### Data Retention

- Configurable expiration per memory type
- Automatic cleanup of expired memories
- User can request full memory deletion (GDPR right to be forgotten)

### Access Control

- Memories are private to each user
- Admin access requires explicit permission
- API routes protected by authentication middleware

---

## Monitoring & Observability

### Metrics to Track

1. **Memory Growth**:
   - Total memories per user
   - Storage size
   - Growth rate

2. **Search Performance**:
   - Query latency (p50, p95, p99)
   - Result relevance scores
   - Cache hit rate

3. **Cleanup Efficiency**:
   - Memories deleted per cleanup run
   - Storage reclaimed
   - Cleanup duration

### Alerts

- Memory storage exceeds 80% of quota
- Search latency > 200ms
- Cleanup failures
- Embedding generation failures

---

## Future Enhancements

### Phase 2 (Q1 2026)

- [ ] Memory consolidation (merge similar memories)
- [ ] Importance decay over time
- [ ] Memory clustering by topic
- [ ] Cross-user memory sharing (with permissions)

### Phase 3 (Q2 2026)

- [ ] Multi-modal memories (images, documents)
- [ ] Memory reasoning (infer new facts from existing memories)
- [ ] Federated memory search across users
- [ ] Memory visualization dashboard

---

## References

- [Prisma Schema](../../packages/database/prisma/schema.prisma)
- [Agent Memory Implementation](../../packages/ai/lib/agent-memory.ts)
- [Agent Types](../../packages/ai/types/agent.types.ts)
- [pgvector Documentation](https://github.com/pgvector/pgvector)
- [OpenAI Embeddings](https://platform.openai.com/docs/guides/embeddings)

---

**Implementation Status**: 🟡 In Progress  
**Next Steps**: 
1. Add `@prisma/client` dependency to `packages/ai`
2. Run database migration
3. Integrate memory retrieval into base agent
4. Create memory API routes
5. Build frontend memory viewer
6. Write tests
7. Deploy and monitor
