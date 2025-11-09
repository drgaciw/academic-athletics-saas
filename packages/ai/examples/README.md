# AI Agent Examples

This directory contains examples and tests for the AI agent system.

## Files

### `basic-usage.ts`
Comprehensive examples demonstrating all agent capabilities:
- Single agent execution
- Helper methods
- Orchestrator usage
- Multi-agent workflows
- Intent classification
- Error handling

### `test-system.ts`
System validation tests:
- Tool registry validation
- Agent creation
- Permission system
- Orchestrator functionality
- Tool execution

## Running Examples

### Run All Examples

```bash
# Using ts-node
npx ts-node packages/ai/examples/basic-usage.ts

# Or with tsx
npx tsx packages/ai/examples/basic-usage.ts
```

### Run Specific Example

```bash
# Run example 1 (Single Agent)
npx ts-node packages/ai/examples/basic-usage.ts 1

# Run example 5 (Multi-Agent Workflow)
npx ts-node packages/ai/examples/basic-usage.ts 5
```

### Run System Tests

```bash
npx ts-node packages/ai/examples/test-system.ts
```

## Example List

1. **Single Agent Execution** - Basic agent usage
2. **Helper Methods** - Using convenience methods
3. **Compliance Agent** - Eligibility checking
4. **Orchestrator with Auto-Routing** - Automatic agent selection
5. **Multi-Agent Workflow** - Sequential agent execution
6. **Smart Workflow** - Auto-detection of multi-agent needs
7. **Intent Classification** - Routing logic demonstration
8. **Intervention Agent** - Risk assessment
9. **Administrative Agent** - Document generation
10. **Error Handling** - Retry logic

## Expected Output

### Successful Execution

```
╔════════════════════════════════════════════════════════════╗
║        AI Agent System - Usage Examples                   ║
╚════════════════════════════════════════════════════════════╝

=== Example 1: Single Agent Execution ===

Agent Type: advising
Status: completed
Response: [Agent response content]
Steps: 3
Tools Used: ['getStudentProfile', 'searchCourses', 'checkConflicts']
Cost: $0.0234
Duration: 2341ms

...

✅ All examples completed successfully!
```

### System Tests

```
╔════════════════════════════════════════════════════════════╗
║           AI Agent System - System Tests                  ║
╚════════════════════════════════════════════════════════════╝

✅ Tool Registry - All tools registered
✅ Tool Registry - Tools by category
✅ Agents - Create all agent types
✅ Agents - Tool mappings
✅ Security - Permission system
✅ Security - Tool permission filtering
✅ Orchestrator - Create instance
✅ Orchestrator - Custom configuration
✅ Orchestrator - Workflow suggestion
✅ Tools - Execute tool with mock data

════════════════════════════════════════════════════════════
Test Results
════════════════════════════════════════════════════════════

Total Tests: 10
✅ Passed: 10
❌ Failed: 0
⏱️  Total Duration: 234ms

════════════════════════════════════════════════════════════

🎉 All tests passed! System is working correctly.
```

## Environment Setup

Before running examples, ensure you have:

```bash
# .env file with API keys
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...

# Optional: Langfuse for observability
LANGFUSE_PUBLIC_KEY=pk-...
LANGFUSE_SECRET_KEY=sk-...
```

## Notes

- Examples use mock data from tools (no real backend integration yet)
- All examples demonstrate the agent infrastructure and capabilities
- Costs shown are estimates based on token usage
- Langfuse tracing is automatic if configured

## Troubleshooting

### "Module not found" errors

```bash
# Make sure you're in the project root
cd /path/to/project

# Install dependencies
npm install
```

### API key errors

```bash
# Check your .env file
cat .env | grep API_KEY

# Make sure keys are set
export ANTHROPIC_API_KEY=sk-ant-...
```

### TypeScript errors

```bash
# Build the package first
npm run build

# Or use ts-node with tsconfig
npx ts-node --project tsconfig.json packages/ai/examples/basic-usage.ts
```

## Next Steps

After running examples:

1. Review the output and verify agent responses
2. Check Langfuse dashboard for traces (if configured)
3. Modify examples to test specific scenarios
4. Integrate with real backend services (Task 2.2-2.5)
5. Build API Gateway (Task 6.1-6.4)
6. Create frontend components (Task 12.1-12.4)

## Additional Resources

- [Quick Start Guide](../QUICKSTART.md)
- [Best Practices](../BEST_PRACTICES.md)
- [Implementation Summary](../../../.kiro/specs/ai-agents-implementation/IMPLEMENTATION_SUMMARY.md)
- [Task Documentation](../../../.kiro/specs/ai-agents-implementation/)
