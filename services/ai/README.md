# AI Service

Production-ready AI microservice for the Athletic Academics Hub, featuring comprehensive RAG pipeline, intelligent agents, and LLM integrations.

## Features

### Core Capabilities

- **Conversational AI**: Streaming chat with GPT-4 and Claude models
- **RAG Pipeline**: Retrieval Augmented Generation with pgvector
- **Intelligent Agents**:
  - Academic Advising Agent (course recommendations)
  - Compliance Agent (NCAA rule interpretation)
  - Predictive Analytics (risk assessment)
- **Vector Embeddings**: OpenAI text-embedding-3-large (1536 dimensions)
- **Knowledge Base**: Semantic search with pgvector
- **Security**: PII detection, prompt injection prevention, content filtering

### LLM Providers

- **OpenAI**: GPT-4, GPT-4-turbo, GPT-4o, GPT-4o-mini
- **Anthropic**: Claude 3.5 Sonnet, Claude 3.5 Haiku, Claude 3 Opus
- **Vercel AI SDK**: Unified streaming interface

## Architecture

```
services/ai/
├── src/
│   ├── config/           # Configuration and environment
│   ├── types/            # TypeScript types and schemas
│   ├── utils/            # Security, tokens, helpers
│   ├── services/         # Core AI services
│   │   ├── chatService.ts
│   │   ├── ragPipeline.ts
│   │   ├── embeddingService.ts
│   │   ├── advisingAgent.ts
│   │   ├── complianceAgent.ts
│   │   └── predictiveAnalytics.ts
│   ├── routes/           # API route handlers
│   │   ├── chat.ts
│   │   ├── advising.ts
│   │   ├── compliance.ts
│   │   ├── predict.ts
│   │   ├── knowledge.ts
│   │   ├── feedback.ts
│   │   └── embeddings.ts
│   └── index.ts          # Main application
├── package.json
├── tsconfig.json
└── README.md
```

## API Endpoints

### Chat

```typescript
POST /api/ai/chat
Body: {
  message: string
  conversationId?: string
  userId: string
  model?: 'gpt-4' | 'gpt-4o-mini' | 'claude-3-5-sonnet-20241022'
  stream?: boolean
}
Response: Server-Sent Events stream or JSON
```

```typescript
GET /api/ai/chat/history/:conversationId
Response: { messages: Message[], count: number }
```

### Academic Advising

```typescript
POST /api/ai/advising/recommend
Body: {
  studentId: string
  term: string
  preferredCourses?: string[]
  constraints?: {
    maxCredits?: number
    preferredDays?: string[]
    avoidMornings?: boolean
  }
}
Response: AdvisingRecommendation
```

### Compliance

```typescript
POST /api/ai/compliance/analyze
Body: {
  question: string
  studentId?: string
  scenario?: string
  ruleSection?: string
}
Response: ComplianceAnalysis
```

### Predictive Analytics

```typescript
POST /api/ai/predict/risk
Body: {
  studentId: string
  includeRecommendations?: boolean
  timeframe?: 'current' | 'semester' | 'year'
}
Response: RiskPrediction
```

### Knowledge Base

```typescript
POST /api/ai/knowledge/search
Body: {
  query: string
  filters?: {
    contentType?: string[]
    source?: string[]
  }
  limit?: number
  minScore?: number
}
Response: { results: Document[], count: number }
```

### Feedback

```typescript
POST /api/ai/feedback
Body: {
  messageId: string
  conversationId: string
  rating: 1 | 2 | 3 | 4 | 5
  feedbackType: 'helpful' | 'unhelpful' | 'incorrect' | 'inappropriate' | 'other'
  comment?: string
}
```

### Embeddings (Admin Only)

```typescript
POST /api/ai/embeddings/generate
Body: {
  texts: string[]
  model?: 'text-embedding-3-small' | 'text-embedding-3-large'
  dimensions?: number
}
Response: EmbeddingResponse
```

## RAG Pipeline

### 5-Step Process

1. **Query Understanding**
   - Intent classification
   - Entity extraction
   - Query rewriting

2. **Retrieval**
   - Semantic search with pgvector
   - Content type filtering
   - Similarity scoring

3. **Reranking**
   - Keyword matching boost
   - Title relevance scoring
   - Top-K selection

4. **Response Generation**
   - Context-aware prompting
   - Source citation
   - Streaming support

5. **Validation**
   - Hallucination detection
   - PII filtering
   - Fact-checking

### Example Usage

```typescript
import { ragPipeline } from './services/ragPipeline'

const result = await ragPipeline.query(
  'What are the NCAA eligibility requirements for freshmen?',
  {
    model: 'claude-3-5-sonnet-20241022',
    validate: true,
  }
)

console.log(result.answer)
console.log(result.sources)
console.log(result.confidence)
```

## Security Features

### PII Detection

```typescript
import { detectPII, redactPII } from './utils/security'

const { hasPII, findings } = detectPII(userInput)
if (hasPII) {
  const redacted = redactPII(userInput)
}
```

### Prompt Injection Prevention

```typescript
import { detectPromptInjection } from './utils/security'

const { hasInjection, severity } = detectPromptInjection(userInput)
if (hasInjection && severity === 'high') {
  // Block request
}
```

### Response Validation

```typescript
import { validateResponse } from './utils/security'

const validation = validateResponse(aiResponse, sources)
if (!validation.isValid) {
  // Handle validation issues
}
```

## Token Management

### Counting Tokens

```typescript
import { countTokens, countMessageTokens } from './utils/tokens'

const tokens = countTokens('Your text here', 'gpt-4')
const messageTokens = countMessageTokens(messages, 'gpt-4')
```

### Cost Calculation

```typescript
import { calculateCost } from './config'

const cost = calculateCost('gpt-4', promptTokens, completionTokens)
console.log(`Estimated cost: $${cost.toFixed(6)}`)
```

### Token Optimization

```typescript
import { optimizeMessages, truncateToTokenLimit } from './utils/tokens'

const optimized = optimizeMessages(messages, 8000, 'gpt-4')
const truncated = truncateToTokenLimit(text, 1000, 'gpt-4')
```

## Development

### Setup

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your API keys
nano .env

# Run in development mode
npm run dev
```

### Testing

```bash
# Type check
npm run type-check

# Build
npm run build

# Test endpoints
curl http://localhost:3007/health
```

### Environment Variables

Required:
- `OPENAI_API_KEY` - OpenAI API key
- `DATABASE_URL` - PostgreSQL connection string with pgvector

Recommended:
- `ANTHROPIC_API_KEY` - Anthropic Claude API key
- `AI_ENCRYPTION_KEY` - Encryption key for conversations

## Configuration

### Model Selection

```typescript
import { selectOptimalModel } from './config'

const model = selectOptimalModel({
  complexity: 'high',
  speed: 'balanced',
  budget: 'premium',
})
// Returns: 'gpt-4' or 'claude-3-5-sonnet-20241022'
```

### System Prompts

Customize in `/home/username01/IdeaProjects01/academic-athletics-saas/services/ai/src/config/index.ts`:

```typescript
AI_CONFIG.systemPrompts.default
AI_CONFIG.systemPrompts.advising
AI_CONFIG.systemPrompts.compliance
AI_CONFIG.systemPrompts.support
```

### RAG Configuration

```typescript
AI_CONFIG.rag = {
  embeddingDimensions: 1536,
  retrievalLimit: 10,
  rerankTopK: 5,
  minSimilarityScore: 0.7,
  chunkSize: 1000,
  chunkOverlap: 200,
  maxContextTokens: 8000,
}
```

## Monitoring

### Metrics Tracked

- Token usage per request
- Cost per request
- Latency (TTFT, total)
- Cache hit rates
- Error rates
- Model usage distribution

### Logging

```typescript
// Automatic logging of:
- Request/response
- Token counts
- Costs
- Errors
- Validation issues
```

## Production Deployment

### Vercel Deployment

```bash
# Deploy to Vercel
vercel --prod

# Environment variables set in Vercel dashboard
```

### Performance Optimization

1. **Caching**: Enable response caching for common queries
2. **Batching**: Use batch embedding generation
3. **Model Selection**: Use GPT-4o-mini for simple queries
4. **Streaming**: Always enable streaming for better UX

### Cost Optimization

```typescript
// Use cheaper models for simple tasks
model: 'gpt-4o-mini' // $0.15 per 1M tokens vs $30 for GPT-4

// Enable caching
AI_CONFIG.cache.enabled = true

// Optimize context window usage
const optimized = optimizeMessages(messages, maxTokens)
```

## Best Practices

1. **Always validate input**: Use Zod schemas
2. **Enable streaming**: Better UX for long responses
3. **Use RAG**: Ground responses in factual data
4. **Monitor costs**: Track token usage and costs
5. **Handle errors**: Graceful degradation
6. **Sanitize output**: Remove PII and inappropriate content
7. **Cache responses**: Reduce API calls and costs
8. **Log everything**: Comprehensive observability

## Troubleshooting

### Common Issues

**"Model not found" error**
- Check API keys in .env
- Verify model name spelling

**"Context too long" error**
- Use `optimizeMessages()` to truncate history
- Reduce RAG context with lower `retrievalLimit`

**Slow response times**
- Enable streaming for better perceived performance
- Use faster models (GPT-4o-mini, Claude Haiku)
- Reduce retrieval limit in RAG

**High costs**
- Monitor token usage with `/api/ai/metrics`
- Use caching for repeated queries
- Select cheaper models for simple tasks

## Support

For issues or questions:
- Review logs in console
- Check Vercel function logs
- Verify environment variables
- Test with simple queries first

## License

Private - Athletic Academics Hub
