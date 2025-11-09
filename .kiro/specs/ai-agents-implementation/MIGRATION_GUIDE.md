# AI Package Migration Guide

## For Developers

### Quick Start

```bash
# 1. Pull latest changes
git pull origin main

# 2. Install updated dependencies
pnpm install

# 3. Rebuild packages
turbo run build

# 4. Update your .env file (if needed)
cp .env.example .env
# Add your API keys
```

### What Changed?

The `@aah/ai` package now includes all AI SDK dependencies:
- Vercel AI SDK (ai, @ai-sdk/openai, @ai-sdk/anthropic)
- Direct SDK clients (openai, @anthropic-ai/sdk)
- LangChain framework (langchain, @langchain/*)
- Observability (langfuse, langfuse-vercel)
- Utilities (zod, tiktoken, zod-to-json-schema)

### Breaking Changes

**None!** This is an additive update. All existing code continues to work.

### New Capabilities

You can now import from `@aah/ai`:

```typescript
// AI SDK Providers
import { openai, anthropic, selectModel } from '@aah/ai'
import { streamText } from 'ai'

// Langfuse Tracing
import { createAgentTrace, calculateCost } from '@aah/ai'

// Embeddings
import { generateEmbedding, generateEmbeddings } from '@aah/ai'

// Configuration
import { aiConfig } from '@aah/ai'
```

### For AI Service Developers

The AI service now uses the shared `@aah/ai` package instead of declaring AI dependencies directly:

**Before:**
```json
{
  "dependencies": {
    "ai": "^3.4.0",
    "openai": "^4.67.0",
    "@anthropic-ai/sdk": "^0.30.0",
    "langchain": "^0.3.0",
    // ... many more
  }
}
```

**After:**
```json
{
  "dependencies": {
    "@aah/ai": "*",
    // Only service-specific deps
  }
}
```

### Environment Variables

Add to your `.env` file:

```bash
# Required for AI features
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Optional: AI Observability
LANGFUSE_PUBLIC_KEY=pk-lf-...
LANGFUSE_SECRET_KEY=sk-lf-...
LANGFUSE_HOST=https://cloud.langfuse.com
```

### Troubleshooting

**Issue**: `Cannot find module '@aah/ai'`
```bash
# Solution: Rebuild packages
turbo run build --filter=@aah/ai
```

**Issue**: Type errors after update
```bash
# Solution: Regenerate types
turbo run type-check
```

**Issue**: Dependency conflicts
```bash
# Solution: Clean install
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Testing Your Changes

```bash
# Test AI package builds
pnpm --filter @aah/ai build

# Test AI service starts
pnpm --filter @aah/service-ai dev

# Run type checks
turbo run type-check

# Run tests
turbo run test
```

### Next Steps

This update enables:
1. **Agent Framework** (Task 1.2) - Base agent types and interfaces
2. **Tool Registry** (Task 2.x) - Tool definitions with Zod schemas
3. **Langfuse Integration** (Task 1.3) - AI observability and tracing
4. **Agentic Workflows** (Task 3.x+) - Multi-step AI agent orchestration

See `tasks.md` for the full implementation roadmap.

## For DevOps/Infrastructure

### Vercel Configuration

No changes required. The monorepo structure remains the same.

### Environment Variables

Add to Vercel project settings:
- `LANGFUSE_PUBLIC_KEY` (optional)
- `LANGFUSE_SECRET_KEY` (optional)
- `LANGFUSE_HOST` (optional, defaults to cloud.langfuse.com)

### Build Configuration

No changes to `turbo.json` or `vercel.json` required.

### Monitoring

Once Langfuse is configured, you'll have:
- Real-time AI request tracing
- Token usage and cost tracking
- Performance metrics
- Error tracking

Access at: https://cloud.langfuse.com (or your self-hosted instance)

## Support

Questions? Check:
1. `packages/ai/README.md` - Package documentation
2. `DEPENDENCY_UPDATE_SUMMARY.md` - Detailed change log
3. `tasks.md` - Implementation roadmap
4. Team Slack #ai-development channel
