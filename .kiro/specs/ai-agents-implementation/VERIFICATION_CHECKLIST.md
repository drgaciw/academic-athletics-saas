# Verification Checklist - Task 1.1 Complete

Use this checklist to verify the AI package dependency update was successful.

## Pre-Verification

- [ ] Latest code pulled from main branch
- [ ] Working in clean git state (no uncommitted changes)
- [ ] Node.js version >= 18.x
- [ ] PNPM version >= 8.x

## Installation Verification

```bash
# Run from project root
pnpm install
```

- [ ] Installation completes without errors
- [ ] No peer dependency warnings for AI packages
- [ ] `pnpm-lock.yaml` updated successfully
- [ ] `node_modules/@aah/ai` directory exists

## Build Verification

```bash
# Build AI package
turbo run build --filter=@aah/ai
```

- [ ] Build completes without errors
- [ ] No TypeScript compilation errors
- [ ] Output files generated in expected locations

```bash
# Build AI service
turbo run build --filter=@aah/service-ai
```

- [ ] Build completes without errors
- [ ] Service imports `@aah/ai` successfully
- [ ] No missing dependency errors

```bash
# Build all packages
turbo run build
```

- [ ] All packages build successfully
- [ ] No cross-package dependency issues
- [ ] Build cache working correctly

## Type Checking

```bash
turbo run type-check
```

- [ ] No type errors in `packages/ai`
- [ ] No type errors in `services/ai`
- [ ] No type errors in dependent packages
- [ ] All imports resolve correctly

## Runtime Verification

### AI Package Exports

Create a test file: `test-ai-package.ts`

```typescript
import {
  openai,
  anthropic,
  selectModel,
  aiConfig,
  generateEmbedding,
  createAgentTrace,
} from '@aah/ai'

console.log('✓ All imports successful')
console.log('✓ OpenAI provider:', typeof openai)
console.log('✓ Anthropic provider:', typeof anthropic)
console.log('✓ Config loaded:', aiConfig.models.openai.gpt4)
```

```bash
npx tsx test-ai-package.ts
```

- [ ] All imports resolve
- [ ] No runtime errors
- [ ] Providers initialized correctly

### AI Service Startup

```bash
cd services/ai
pnpm dev
```

- [ ] Service starts without errors
- [ ] Health check responds: `curl http://localhost:3007/health`
- [ ] No dependency resolution errors in logs
- [ ] CORS middleware loads correctly

### Environment Variables

```bash
# Check required variables are set
echo $OPENAI_API_KEY
echo $ANTHROPIC_API_KEY
```

- [ ] `OPENAI_API_KEY` is set (or in .env)
- [ ] `ANTHROPIC_API_KEY` is set (or in .env)
- [ ] `LANGFUSE_PUBLIC_KEY` is set (optional)
- [ ] `LANGFUSE_SECRET_KEY` is set (optional)

## Integration Tests

### Test OpenAI Provider

```typescript
// test-openai.ts
import { openai } from '@aah/ai'
import { generateText } from 'ai'

async function testOpenAI() {
  const result = await generateText({
    model: openai('gpt-4o-mini'),
    prompt: 'Say hello in one word',
  })
  console.log('OpenAI response:', result.text)
}

testOpenAI()
```

```bash
npx tsx test-openai.ts
```

- [ ] OpenAI API call succeeds
- [ ] Response received
- [ ] No authentication errors

### Test Anthropic Provider

```typescript
// test-anthropic.ts
import { anthropic } from '@aah/ai'
import { generateText } from 'ai'

async function testAnthropic() {
  const result = await generateText({
    model: anthropic('claude-3-5-haiku-20241022'),
    prompt: 'Say hello in one word',
  })
  console.log('Anthropic response:', result.text)
}

testAnthropic()
```

```bash
npx tsx test-anthropic.ts
```

- [ ] Anthropic API call succeeds
- [ ] Response received
- [ ] No authentication errors

### Test Langfuse (Optional)

```typescript
// test-langfuse.ts
import { createAgentTrace } from '@aah/ai'

async function testLangfuse() {
  const trace = createAgentTrace({
    name: 'test-trace',
    userId: 'test-user',
    metadata: { test: true },
  })
  console.log('Langfuse trace created:', trace.id)
}

testLangfuse()
```

```bash
npx tsx test-langfuse.ts
```

- [ ] Langfuse client initializes (if keys provided)
- [ ] Trace created successfully
- [ ] No connection errors

## Dependency Verification

```bash
# Check for duplicate dependencies
pnpm list ai
pnpm list openai
pnpm list langchain
```

- [ ] No duplicate versions of `ai` package
- [ ] No duplicate versions of `openai` package
- [ ] No duplicate versions of `langchain` package
- [ ] All versions match `packages/ai/package.json`

## Documentation Verification

- [ ] `DEPENDENCY_UPDATE_SUMMARY.md` created
- [ ] `MIGRATION_GUIDE.md` created
- [ ] `COMMANDS.md` created
- [ ] `tasks.md` updated (Task 1.1 marked complete)
- [ ] All documentation is accurate and up-to-date

## Git Verification

```bash
git status
git diff packages/ai/package.json
git diff services/ai/package.json
```

- [ ] Only expected files modified
- [ ] No unintended changes
- [ ] Commit message follows convention
- [ ] Ready to push to remote

## Cleanup

```bash
# Remove test files
rm -f test-*.ts
```

- [ ] Test files removed
- [ ] No temporary files left
- [ ] Working directory clean

## Final Checks

- [ ] All checkboxes above are checked ✓
- [ ] No errors in any verification step
- [ ] Team notified of changes
- [ ] Documentation shared with team
- [ ] Ready to proceed to Task 1.2

## Sign-Off

**Verified by**: _________________  
**Date**: _________________  
**Notes**: _________________

---

## Troubleshooting Common Issues

### Issue: "Cannot find module '@aah/ai'"

**Solution:**
```bash
turbo run build --filter=@aah/ai --force
pnpm install
```

### Issue: Type errors after update

**Solution:**
```bash
# Regenerate types
turbo run type-check --force
# Or rebuild from scratch
rm -rf node_modules .turbo
pnpm install
turbo run build
```

### Issue: Langfuse connection errors

**Solution:**
- Verify API keys are correct
- Check `LANGFUSE_HOST` is set correctly
- Ensure network access to Langfuse cloud/server
- Set `ENABLE_TRACING=false` to disable temporarily

### Issue: OpenAI/Anthropic API errors

**Solution:**
- Verify API keys are valid and active
- Check API key has sufficient credits
- Ensure no rate limiting issues
- Test with curl to isolate issue

### Issue: Build cache issues

**Solution:**
```bash
turbo run build --force
# Or clear cache completely
rm -rf .turbo
turbo run build
```

## Next Steps After Verification

Once all checks pass, proceed to:

1. **Task 1.2**: Create base agent types and interfaces
2. **Task 1.3**: Set up Langfuse integration
3. **Task 2.1**: Create ToolRegistry class

See `tasks.md` for detailed requirements.
