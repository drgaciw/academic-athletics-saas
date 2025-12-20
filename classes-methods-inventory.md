# TypeScript/JavaScript Class Definitions - Comprehensive Inventory

This document provides a complete inventory of all classes and their associated methods in the Academic Athletics SaaS codebase.

**Generated**: 2025-11-25

---

## Table of Contents

1. [packages/ai/](#packagesai)
2. [packages/ai-evals/](#packagesai-evals)
3. [services/](#services)
4. [packages/database/](#packagesdatabase)
5. [packages/ui/](#packagesui)
6. [Summary Statistics](#summary-statistics)

---

## packages/ai/

### Agents (packages/ai/agents/)

#### 1. BaseAgent
**File**: `packages/ai/lib/base-agent.ts`
**Purpose**: Abstract base class for all AI agents with common functionality

| Method | Visibility | Description |
|--------|------------|-------------|
| `get type()` | public | Get agent type |
| `get name()` | public | Get agent name |
| `getSystemPrompt()` | protected | Get system prompt |
| `getTools()` | protected (abstract) | Get available tools |
| `executeStreaming(request)` | public | Execute agent with streaming |
| `wrapStreamWithTracking()` | private | Wrap stream with tracking |
| `execute(request)` | public | Execute agent without streaming |
| `initializeState(request)` | protected | Initialize agent state |
| `selectModel(request)` | protected | Select model based on request |
| `prepareMessages()` | protected | Prepare messages with caching and compression |
| `validateRequest(request)` | protected | Validate request |
| `extractToolInvocations(result)` | protected | Extract tool invocations from result |
| `onStepFinish()` | protected | Handle step finish |
| `onStepComplete()` | protected | Hook for subclasses |
| `determineStepType()` | protected | Determine step type |
| `getStepDescription()` | protected | Get step description |

---

#### 2. ComplianceAgent
**File**: `packages/ai/agents/compliance-agent.ts`
**Purpose**: Agent specialized in compliance and NCAA regulation checking
**Extends**: BaseAgent

| Method | Visibility | Description |
|--------|------------|-------------|
| `getSystemPrompt()` | protected | Compliance-specific system prompt |
| `getTools()` | protected | Compliance-related tools |

---

#### 3. AdministrativeAgent
**File**: `packages/ai/agents/administrative-agent.ts`
**Purpose**: Agent for administrative tasks and operations
**Extends**: BaseAgent

| Method | Visibility | Description |
|--------|------------|-------------|
| `getSystemPrompt()` | protected | Administrative system prompt |
| `getTools()` | protected | Administrative tools |

---

#### 4. AdvisingAgent
**File**: `packages/ai/agents/advising-agent.ts`
**Purpose**: Agent specialized in academic advising
**Extends**: BaseAgent

| Method | Visibility | Description |
|--------|------------|-------------|
| `getSystemPrompt()` | protected | Advising-specific system prompt |
| `getTools()` | protected | Advising-related tools |

---

#### 5. GeneralAssistant
**File**: `packages/ai/agents/general-assistant.ts`
**Purpose**: General purpose AI assistant
**Extends**: BaseAgent

| Method | Visibility | Description |
|--------|------------|-------------|
| `getSystemPrompt()` | protected | General assistant system prompt |
| `getTools()` | protected | General tools |

---

#### 6. InterventionAgent
**File**: `packages/ai/agents/intervention-agent.ts`
**Purpose**: Agent for student intervention and support
**Extends**: BaseAgent

| Method | Visibility | Description |
|--------|------------|-------------|
| `getSystemPrompt()` | protected | Intervention-specific system prompt |
| `getTools()` | protected | Intervention tools |

---

#### 7. ErrorDiagnosticsAgent
**File**: `packages/ai/agents/error-diagnostics-agent.ts`
**Purpose**: Agent specialized in error diagnosis and troubleshooting
**Extends**: BaseAgent

| Method | Visibility | Description |
|--------|------------|-------------|
| `getSystemPrompt()` | protected | Error diagnostics system prompt |
| `getTools()` | protected | Error diagnostics tools |
| `analyzeError(params)` | public | Analyze an error deeply |
| `correlateErrors(params)` | public | Find patterns across multiple errors |
| `suggestFixes(params)` | public | Suggest fixes for errors |
| `assessComplianceImpact(params)` | public | Assess error impact on NCAA compliance |
| `generateErrorReport(params)` | public | Generate error report for stakeholders |

---

### Library Classes (packages/ai/lib/)

#### 8. AgentOrchestrator
**File**: `packages/ai/lib/agent-orchestrator.ts`
**Purpose**: Coordinates agent selection, execution, and multi-agent workflows

| Method | Visibility | Description |
|--------|------------|-------------|
| `executeWorkflow(request)` | public | Execute workflow with automatic agent selection |
| `executeSingleAgent(agentType, request)` | public | Execute single agent |
| `executeMultiAgent(request, agentSequence)` | public | Execute multi-agent workflow |
| `classifyIntent(message, context)` | public | Classify intent and determine appropriate agent |
| `executeWithRetry(request, maxRetries)` | public | Execute with automatic retry on failure |
| `getWorkflow(workflowId)` | public | Get active workflow by ID |
| `cancelWorkflow(workflowId)` | public | Cancel active workflow |
| `getActiveWorkflows()` | public | Get all active workflows |
| `suggestWorkflow(message)` | public | Suggest multi-agent workflow for complex queries |
| `executeSmartWorkflow(request)` | public | Execute smart workflow (auto-detects if multi-agent is needed) |

---

#### 9. AgenticWorkflow
**File**: `packages/ai/lib/agentic-workflow.ts`
**Purpose**: Manages agentic workflows and execution

| Method | Visibility | Description |
|--------|------------|-------------|
| `execute(input)` | public | Execute the workflow |
| `addStep(step)` | public | Add a step to the workflow |
| `getState()` | public | Get current workflow state |

---

#### 10. InMemoryCacheStorage
**File**: `packages/ai/lib/cache-manager.ts`
**Purpose**: In-memory cache storage with LRU eviction
**Implements**: CacheStorage

| Method | Visibility | Description |
|--------|------------|-------------|
| `get(key)` | public | Get cached value |
| `set(key, value, ttl)` | public | Set cached value |
| `delete(key)` | public | Delete cached value |
| `clear()` | public | Clear all cache |
| `keys()` | public | Get all cache keys |
| `estimateSize(value)` | private | Estimate size of value |
| `evictIfNeeded()` | private | Evict if necessary |
| `getTotalSize()` | public | Get total cache size |

---

#### 11. RedisCacheStorage
**File**: `packages/ai/lib/cache-manager.ts`
**Purpose**: Redis cache storage for production
**Implements**: CacheStorage

| Method | Visibility | Description |
|--------|------------|-------------|
| `get(key)` | public | Get cached value |
| `set(key, value, ttl)` | public | Set cached value |
| `delete(key)` | public | Delete cached value |
| `clear()` | public | Clear all cache |
| `keys()` | public | Get all cache keys |

---

#### 12. CacheManager
**File**: `packages/ai/lib/cache-manager.ts`
**Purpose**: Main cache management class

| Method | Visibility | Description |
|--------|------------|-------------|
| `generateKey(prefix, params)` | public | Generate cache key from parameters |
| `get(key)` | public | Get cached value |
| `set(key, value, ttl)` | public | Set cached value |
| `getOrCompute(key, compute, ttl)` | public | Get or compute value |
| `delete(key)` | public | Delete cached value |
| `clear()` | public | Clear all cache |
| `getStats()` | public | Get cache statistics |
| `resetStats()` | public | Reset statistics |
| `updateHitRate()` | private | Update hit rate |

---

#### 13. ToolResultCache
**File**: `packages/ai/lib/cache-manager.ts`
**Purpose**: Specialized cache for tool execution results
**Extends**: CacheManager

| Method | Visibility | Description |
|--------|------------|-------------|
| `cacheToolResult(toolName, params, result, ttl)` | public | Cache tool result |
| `getCachedToolResult(toolName, params)` | public | Get cached tool result |
| `executeWithCache(toolName, params, execute, ttl)` | public | Execute tool with caching |

---

#### 14. ResponseCache
**File**: `packages/ai/lib/cache-manager.ts`
**Purpose**: Specialized cache for agent responses
**Extends**: CacheManager

| Method | Visibility | Description |
|--------|------------|-------------|
| `cacheResponse(agentType, query, context, response, ttl)` | public | Cache agent response |
| `getCachedResponse(agentType, query, context)` | public | Get cached response |
| `findSimilarResponse(agentType, query, similarityThreshold)` | public | Check if query is similar to cached queries |

---

#### 15. AuditLogger
**File**: `packages/ai/lib/audit-logger.ts`
**Purpose**: Comprehensive audit logging for agent actions and tool invocations

| Method | Visibility | Description |
|--------|------------|-------------|
| `logAgentExecution(entry)` | public | Log agent execution |
| `logToolInvocation(entry)` | public | Log tool invocation |
| `logAgentResponse(userId, agentType, request, response)` | public | Log agent response with tool invocations |
| `queryLogs(filters)` | public | Query audit logs |
| `getStatistics(filters)` | public | Get audit statistics |
| `getUserActivity(userId, days)` | public | Get user activity summary |
| `getComplianceReport(startDate, endDate)` | public | Get compliance report |
| `deleteOldLogs(olderThanDays)` | public | Delete old audit logs (GDPR compliance) |
| `truncate(text)` | private | Truncate text |
| `sanitizeToolResult(result)` | private | Sanitize tool result |
| `extractModelFromMetadata(metadata)` | private | Extract model from metadata |

---

#### 16. ConfigManager
**File**: `packages/ai/lib/config-manager.ts`
**Purpose**: Manage agent configuration

| Method | Visibility | Description |
|--------|------------|-------------|
| `getConfig(key)` | public | Get configuration value |
| `setConfig(key, value)` | public | Set configuration value |
| `loadFromEnv()` | public | Load configuration from environment |

---

### Error Classes (packages/ai/lib/errors.ts)

#### 17. AgentError
**Purpose**: Base agent error class
**Extends**: Error

| Property | Type | Description |
|----------|------|-------------|
| `code` | string | Error code |
| `retryable` | boolean | Whether error is retryable |
| `context` | object | Additional context |

---

#### 18. ToolExecutionError
**Purpose**: Error for tool execution failures
**Extends**: AgentError

---

#### 19. AgentPlanningError
**Purpose**: Error for agent planning failures
**Extends**: AgentError

---

#### 20. ContextWindowError
**Purpose**: Error for context window overflow
**Extends**: AgentError

---

#### 21. RateLimitError
**Purpose**: Error for rate limiting
**Extends**: AgentError

---

#### 22. PermissionDeniedError
**Purpose**: Error for permission denial
**Extends**: AgentError

---

#### 23. InvalidInputError
**Purpose**: Error for invalid input
**Extends**: AgentError

---

#### 24. TimeoutError
**Purpose**: Error for timeout
**Extends**: AgentError

---

#### 25. AgentTracer
**File**: `packages/ai/lib/langfuse-client.ts`
**Purpose**: Trace agent execution for observability and debugging

| Method | Visibility | Description |
|--------|------------|-------------|
| `startTrace(name, metadata)` | public | Start a new trace |
| `endTrace(traceId, output)` | public | End a trace |
| `addSpan(traceId, spanData)` | public | Add span to trace |
| `addGeneration(traceId, generationData)` | public | Add generation to trace |
| `flush()` | public | Flush pending traces |

---

#### 26. BatchTracker
**File**: `packages/ai/lib/langfuse-client.ts`
**Purpose**: Track batches of operations

| Method | Visibility | Description |
|--------|------------|-------------|
| `startBatch(batchId)` | public | Start tracking a batch |
| `endBatch(batchId)` | public | End batch tracking |
| `addToBatch(batchId, item)` | public | Add item to batch |

---

#### 27. FeedbackManager
**File**: `packages/ai/lib/feedback-manager.ts`
**Purpose**: Manage feedback on agent responses

| Method | Visibility | Description |
|--------|------------|-------------|
| `submitFeedback(feedback)` | public | Submit feedback |
| `getFeedback(filters)` | public | Get feedback by filters |
| `generateTrainingDataset(agentType)` | public | Generate training dataset from feedback |
| `analyzeFeedbackTrends(agentType, days)` | public | Analyze feedback trends |

---

#### 28. IntentClassifier
**File**: `packages/ai/lib/intent-classifier.ts`
**Purpose**: Classify user intent to route to appropriate agent

| Method | Visibility | Description |
|--------|------------|-------------|
| `classify(message, context)` | public | Classify user intent |
| `getConfidenceThreshold()` | public | Get confidence threshold |
| `setConfidenceThreshold(threshold)` | public | Set confidence threshold |

---

#### 29. MemoryCache
**File**: `packages/ai/lib/performance.ts`
**Purpose**: Memory cache implementation
**Implements**: Cache

| Method | Visibility | Description |
|--------|------------|-------------|
| `get(key)` | public | Get value from cache |
| `set(key, value, ttl)` | public | Set value in cache |
| `delete(key)` | public | Delete from cache |
| `clear()` | public | Clear cache |

---

#### 30. RequestBatcher<T, R>
**File**: `packages/ai/lib/performance.ts`
**Purpose**: Batch requests for efficiency

| Method | Visibility | Description |
|--------|------------|-------------|
| `add(request)` | public | Add request to batch |
| `flush()` | public | Flush batch |
| `setMaxBatchSize(size)` | public | Set max batch size |
| `setMaxWaitTime(ms)` | public | Set max wait time |

---

#### 31. StreamBuffer
**File**: `packages/ai/lib/performance.ts`
**Purpose**: Buffer streaming data

| Method | Visibility | Description |
|--------|------------|-------------|
| `write(chunk)` | public | Write chunk to buffer |
| `read()` | public | Read from buffer |
| `flush()` | public | Flush buffer |

---

#### 32. PromptCompressor
**File**: `packages/ai/lib/prompt-compression.ts`
**Purpose**: Compress prompts for efficiency

| Method | Visibility | Description |
|--------|------------|-------------|
| `compress(messages, options)` | public | Compress messages |
| `compressContent(content, maxTokens)` | public | Compress content string |
| `estimateTokens(text)` | public | Estimate token count |

---

#### 33. ServiceClientError
**File**: `packages/ai/lib/service-client.ts`
**Purpose**: Error for service client failures
**Extends**: Error

| Property | Type | Description |
|----------|------|-------------|
| `statusCode` | number | HTTP status code |
| `serviceName` | string | Service name |

---

#### 34. InMemoryStateStorage
**File**: `packages/ai/lib/state-manager.ts`
**Purpose**: In-memory storage for agent state
**Implements**: StateStorage

| Method | Visibility | Description |
|--------|------------|-------------|
| `get(key)` | public | Get state |
| `set(key, value)` | public | Set state |
| `delete(key)` | public | Delete state |
| `clear()` | public | Clear all state |

---

#### 35. DatabaseStateStorage
**File**: `packages/ai/lib/state-manager.ts`
**Purpose**: Database storage for agent state
**Implements**: StateStorage

| Method | Visibility | Description |
|--------|------------|-------------|
| `get(key)` | public | Get state from database |
| `set(key, value)` | public | Set state in database |
| `delete(key)` | public | Delete state from database |
| `clear()` | public | Clear all state |

---

#### 36. StateManager
**File**: `packages/ai/lib/state-manager.ts`
**Purpose**: Manage agent state

| Method | Visibility | Description |
|--------|------------|-------------|
| `getState(userId)` | public | Get user state |
| `setState(userId, state)` | public | Set user state |
| `updateState(userId, updates)` | public | Update user state |
| `clearState(userId)` | public | Clear user state |

---

#### 37. RateLimiter
**File**: `packages/ai/lib/safety.ts`
**Purpose**: Rate limiting for safety

| Method | Visibility | Description |
|--------|------------|-------------|
| `checkLimit(userId)` | public | Check if user is rate limited |
| `recordRequest(userId)` | public | Record a request |
| `resetLimit(userId)` | public | Reset limit for user |

---

#### 38. ToolRegistry
**File**: `packages/ai/lib/tool-registry.ts`
**Purpose**: Register and manage available tools

| Method | Visibility | Description |
|--------|------------|-------------|
| `register(tool)` | public | Register a tool |
| `get(name)` | public | Get tool by name |
| `getAll()` | public | Get all registered tools |
| `getByCategory(category)` | public | Get tools by category |
| `unregister(name)` | public | Unregister a tool |

---

## packages/ai-evals/

### Core Classes (packages/ai-evals/src/)

#### 39. BaseRunner
**File**: `packages/ai-evals/src/base-runner.ts`
**Purpose**: Core execution engine for running test cases against AI models

| Method | Visibility | Description |
|--------|------------|-------------|
| `runTestCase(testCase, modelConfig, scorerConfig)` | public | Run a single test case |
| `run(config)` | public | Run evaluation with configuration |
| `prepareInput(testCase)` | protected | Prepare input for model |
| `executeModel(input, modelConfig)` | protected | Execute model |
| `scoreResult(actual, expected, scorerConfig)` | protected | Score result |

---

#### 40. SimpleRunner
**File**: `packages/ai-evals/src/base-runner.ts`
**Purpose**: Simple test runner
**Extends**: BaseRunner

---

#### 41. JSONRunner
**File**: `packages/ai-evals/src/base-runner.ts`
**Purpose**: JSON format test runner
**Extends**: BaseRunner

---

#### 42. DatasetManager
**File**: `packages/ai-evals/src/dataset-manager.ts`
**Purpose**: Manage datasets for evaluations

| Method | Visibility | Description |
|--------|------------|-------------|
| `loadDataset(id)` | public | Load dataset by ID |
| `saveDataset(dataset)` | public | Save dataset |
| `listDatasets()` | public | List all datasets |
| `deleteDataset(id)` | public | Delete dataset |
| `validateDataset(dataset)` | public | Validate dataset schema |

---

#### 43. EvalOrchestrator
**File**: `packages/ai-evals/src/orchestrator.ts`
**Purpose**: Orchestrate evaluation runs

| Method | Visibility | Description |
|--------|------------|-------------|
| `createJob(config)` | public | Create evaluation job |
| `startJob(jobId)` | public | Start evaluation job |
| `cancelJob(jobId)` | public | Cancel evaluation job |
| `getJob(jobId)` | public | Get job status |
| `waitForJob(jobId, pollInterval)` | public | Wait for job to complete |

---

### Monitoring Classes (packages/ai-evals/src/monitoring/)

#### 44. AnalyticsTracker
**File**: `packages/ai-evals/src/monitoring/analytics.ts`
**Purpose**: Track and send eval metrics to Vercel Analytics

| Method | Visibility | Description |
|--------|------------|-------------|
| `trackEvalRun(report)` | public | Track evaluation run |
| `trackRegression(regression)` | public | Track regression |
| `flush()` | public | Flush pending events |
| `destroy()` | public | Clean up resources |

---

#### 45. MetricsAggregator
**File**: `packages/ai-evals/src/monitoring/analytics.ts`
**Purpose**: Aggregate metrics from multiple runs

| Method | Visibility | Description |
|--------|------------|-------------|
| `addRun(report)` | public | Add run to aggregation |
| `getAggregatedMetrics()` | public | Get aggregated metrics |
| `reset()` | public | Reset aggregation |

---

#### 46. AlertManager
**File**: `packages/ai-evals/src/monitoring/alerts.ts`
**Purpose**: Manage alerts for evaluation issues

| Method | Visibility | Description |
|--------|------------|-------------|
| `sendRegressionAlert(regression, report)` | public | Send regression alert |
| `sendFailureAlert(error, report)` | public | Send failure alert |
| `checkAndAlert(report)` | public | Check thresholds and send alerts |
| `getAlertHistory(limit)` | public | Get alert history |

---

#### 47. CostTracker
**File**: `packages/ai-evals/src/monitoring/cost-tracker.ts`
**Purpose**: Track costs of evaluations

| Method | Visibility | Description |
|--------|------------|-------------|
| `trackRun(report)` | public | Track run cost |
| `trackRunResult(jobId, result, config)` | public | Track individual result cost |
| `getTotalCost()` | public | Get total cost |
| `getTotalTokens()` | public | Get total tokens |
| `getCostBreakdown(dimension)` | public | Get cost breakdown |
| `getCostTrend(period)` | public | Get cost trend |
| `getAllBudgetStatuses()` | public | Get all budget statuses |

---

#### 48. MonitoringSystem
**File**: `packages/ai-evals/src/monitoring/index.ts`
**Purpose**: Overall monitoring system

| Method | Visibility | Description |
|--------|------------|-------------|
| `processReport(report)` | public | Process report through all systems |
| `getAnalytics()` | public | Get analytics tracker |
| `getAlerts()` | public | Get alert manager |
| `getCostTracker()` | public | Get cost tracker |
| `getSummary()` | public | Get comprehensive summary |
| `destroy()` | public | Clean up resources |

---

### Scorer Classes (packages/ai-evals/src/scorers/)

#### 49. ExactMatchScorer
**File**: `packages/ai-evals/src/scorers.ts`
**Purpose**: Scorer using exact match
**Implements**: Scorer

| Method | Visibility | Description |
|--------|------------|-------------|
| `score(actual, expected, config)` | public | Score using exact match |

---

#### 50. PartialMatchScorer
**File**: `packages/ai-evals/src/scorers.ts`
**Purpose**: Scorer using partial match
**Implements**: Scorer

| Method | Visibility | Description |
|--------|------------|-------------|
| `score(actual, expected, config)` | public | Score using partial match |

---

#### 51. ContainsScorer
**File**: `packages/ai-evals/src/scorers.ts`
**Purpose**: Scorer checking if output contains expected text
**Implements**: Scorer

| Method | Visibility | Description |
|--------|------------|-------------|
| `score(actual, expected, config)` | public | Score using contains check |

---

#### 52. RegexScorer
**File**: `packages/ai-evals/src/scorers.ts`
**Purpose**: Scorer using regex matching
**Implements**: Scorer

| Method | Visibility | Description |
|--------|------------|-------------|
| `score(actual, expected, config)` | public | Score using regex |

---

#### 53. NumericRangeScorer
**File**: `packages/ai-evals/src/scorers.ts`
**Purpose**: Scorer for numeric ranges
**Implements**: Scorer

| Method | Visibility | Description |
|--------|------------|-------------|
| `score(actual, expected, config)` | public | Score numeric in range |

---

#### 54. SemanticSimilarityScorer
**File**: `packages/ai-evals/src/scorers/semantic-similarity.ts`
**Purpose**: Scorer using semantic similarity
**Implements**: Scorer

| Method | Visibility | Description |
|--------|------------|-------------|
| `score(actual, expected, config)` | public | Score semantic similarity |
| `getEmbedding(text)` | private | Get text embedding |
| `cosineSimilarity(a, b)` | private | Calculate cosine similarity |

---

#### 55. LLMJudgeScorer
**File**: `packages/ai-evals/src/scorers/llm-judge.ts`
**Purpose**: Scorer using LLM as judge
**Implements**: Scorer

| Method | Visibility | Description |
|--------|------------|-------------|
| `score(actual, expected, config)` | public | Score using LLM judge |
| `buildPrompt(actual, expected, criteria)` | private | Build judge prompt |

---

#### 56. PrecisionRecallF1Scorer
**File**: `packages/ai-evals/src/scorers.ts`
**Purpose**: Scorer calculating precision, recall, and F1
**Implements**: Scorer

| Method | Visibility | Description |
|--------|------------|-------------|
| `score(actual, expected, config)` | public | Calculate precision/recall/F1 |

---

#### 57. RecallAtKScorer
**File**: `packages/ai-evals/src/scorers/recall-at-k.ts`
**Purpose**: Scorer calculating recall@k
**Implements**: Scorer

| Method | Visibility | Description |
|--------|------------|-------------|
| `score(actual, expected, config)` | public | Calculate recall@k |

---

#### 58. MRRScorer
**File**: `packages/ai-evals/src/scorers.ts`
**Purpose**: Scorer for Mean Reciprocal Rank
**Implements**: Scorer

| Method | Visibility | Description |
|--------|------------|-------------|
| `score(actual, expected, config)` | public | Calculate MRR |

---

#### 59. NDCGScorer
**File**: `packages/ai-evals/src/scorers.ts`
**Purpose**: Scorer for Normalized Discounted Cumulative Gain
**Implements**: Scorer

| Method | Visibility | Description |
|--------|------------|-------------|
| `score(actual, expected, config)` | public | Calculate NDCG |

---

### Specialized Runners (packages/ai-evals/src/runners/)

#### 60. ComplianceRunner
**File**: `packages/ai-evals/src/runners/compliance-runner.ts`
**Purpose**: Runner for compliance evaluations
**Extends**: BaseRunner

| Method | Visibility | Description |
|--------|------------|-------------|
| `prepareInput(testCase)` | protected | Prepare compliance input |
| `executeModel(input, modelConfig)` | protected | Execute compliance check |

---

#### 61. ConversationalRunner
**File**: `packages/ai-evals/src/runners/conversational-runner.ts`
**Purpose**: Runner for conversational evaluations
**Extends**: BaseRunner

| Method | Visibility | Description |
|--------|------------|-------------|
| `prepareInput(testCase)` | protected | Prepare conversation input |
| `executeModel(input, modelConfig)` | protected | Execute conversation |

---

#### 62. AdvisingRunner
**File**: `packages/ai-evals/src/runners/advising-runner.ts`
**Purpose**: Runner for advising evaluations
**Extends**: BaseRunner

| Method | Visibility | Description |
|--------|------------|-------------|
| `prepareInput(testCase)` | protected | Prepare advising input |
| `executeModel(input, modelConfig)` | protected | Execute advising query |

---

#### 63. RiskPredictionRunner
**File**: `packages/ai-evals/src/runners/risk-prediction-runner.ts`
**Purpose**: Runner for risk prediction evaluations
**Extends**: BaseRunner

| Method | Visibility | Description |
|--------|------------|-------------|
| `prepareInput(testCase)` | protected | Prepare risk prediction input |
| `executeModel(input, modelConfig)` | protected | Execute risk prediction |

---

#### 64. RAGRunner
**File**: `packages/ai-evals/src/runners/rag-runner.ts`
**Purpose**: Runner for RAG evaluations
**Extends**: BaseRunner

| Method | Visibility | Description |
|--------|------------|-------------|
| `prepareInput(testCase)` | protected | Prepare RAG input |
| `executeModel(input, modelConfig)` | protected | Execute RAG query |
| `retrieveContext(query)` | private | Retrieve context documents |

---

### Performance Classes (packages/ai-evals/src/performance/)

#### 65. LRUCache<T>
**File**: `packages/ai-evals/src/performance/cache.ts`
**Purpose**: LRU cache implementation

| Method | Visibility | Description |
|--------|------------|-------------|
| `get(key)` | public | Get value |
| `set(key, value)` | public | Set value |
| `delete(key)` | public | Delete value |
| `clear()` | public | Clear cache |
| `size()` | public | Get cache size |

---

#### 66. ResponseCache
**File**: `packages/ai-evals/src/performance/cache.ts`
**Purpose**: Cache for responses

| Method | Visibility | Description |
|--------|------------|-------------|
| `get(key)` | public | Get cached response |
| `set(key, response, ttl)` | public | Cache response |
| `invalidate(pattern)` | public | Invalidate by pattern |

---

#### 67. EmbeddingCache
**File**: `packages/ai-evals/src/performance/cache.ts`
**Purpose**: Cache for embeddings

| Method | Visibility | Description |
|--------|------------|-------------|
| `get(text)` | public | Get cached embedding |
| `set(text, embedding)` | public | Cache embedding |

---

#### 68. CacheManager
**File**: `packages/ai-evals/src/performance/cache.ts`
**Purpose**: Manage all caches

| Method | Visibility | Description |
|--------|------------|-------------|
| `getResponseCache()` | public | Get response cache |
| `getEmbeddingCache()` | public | Get embedding cache |
| `clearAll()` | public | Clear all caches |

---

#### 69. ParallelExecutor
**File**: `packages/ai-evals/src/parallel-executor.ts`
**Purpose**: Execute tasks in parallel
**Extends**: EventEmitter

| Method | Visibility | Description |
|--------|------------|-------------|
| `execute(tasks, concurrency)` | public | Execute tasks in parallel |
| `cancel()` | public | Cancel execution |
| `getProgress()` | public | Get execution progress |

---

#### 70. RateLimiter
**File**: `packages/ai-evals/src/parallel-executor.ts`
**Purpose**: Rate limiter for parallel execution

| Method | Visibility | Description |
|--------|------------|-------------|
| `acquire()` | public | Acquire rate limit token |
| `release()` | public | Release rate limit token |

---

#### 71. PerformanceMonitor
**File**: `packages/ai-evals/src/performance/monitor.ts`
**Purpose**: Monitor performance metrics
**Extends**: EventEmitter

| Method | Visibility | Description |
|--------|------------|-------------|
| `startTimer(name)` | public | Start timing |
| `endTimer(name)` | public | End timing |
| `recordMetric(name, value)` | public | Record metric |
| `getMetrics()` | public | Get all metrics |
| `reset()` | public | Reset metrics |

---

### Safety Classes (packages/ai-evals/src/safety/)

#### 72. PIIDetector
**File**: `packages/ai-evals/src/safety/pii-detector.ts`
**Purpose**: Detect personally identifiable information

| Method | Visibility | Description |
|--------|------------|-------------|
| `detect(text)` | public | Detect PII in text |
| `redact(text)` | public | Redact PII from text |
| `getDetectedTypes()` | public | Get detected PII types |

---

#### 73. FERPAComplianceChecker
**File**: `packages/ai-evals/src/safety/ferpa-compliance.ts`
**Purpose**: Check FERPA compliance

| Method | Visibility | Description |
|--------|------------|-------------|
| `check(data)` | public | Check FERPA compliance |
| `getViolations()` | public | Get compliance violations |

---

#### 74. DataAnonymizer
**File**: `packages/ai-evals/src/safety/ferpa-compliance.ts`
**Purpose**: Anonymize sensitive data

| Method | Visibility | Description |
|--------|------------|-------------|
| `anonymize(data)` | public | Anonymize data |
| `deanonymize(data, key)` | public | Deanonymize data |

---

### Error Classes (packages/ai-evals/src/errors/)

#### 75. EvalError
**File**: `packages/ai-evals/src/errors/index.ts`
**Purpose**: Base evaluation error
**Extends**: Error

---

#### 76. DatasetError
**File**: `packages/ai-evals/src/errors/index.ts`
**Purpose**: Error for dataset issues
**Extends**: EvalError

---

#### 77. DatasetValidationError
**File**: `packages/ai-evals/src/errors/index.ts`
**Purpose**: Error for dataset validation
**Extends**: DatasetError

---

#### 78. ModelExecutionError
**File**: `packages/ai-evals/src/errors/index.ts`
**Purpose**: Error for model execution
**Extends**: EvalError

---

#### 79. ModelTimeoutError
**File**: `packages/ai-evals/src/errors/index.ts`
**Purpose**: Error for model timeout
**Extends**: ModelExecutionError

---

#### 80. ModelRateLimitError
**File**: `packages/ai-evals/src/errors/index.ts`
**Purpose**: Error for model rate limiting
**Extends**: ModelExecutionError

---

#### 81. ScoringError
**File**: `packages/ai-evals/src/errors/index.ts`
**Purpose**: Error for scoring issues
**Extends**: EvalError

---

#### 82. ConfigurationError
**File**: `packages/ai-evals/src/errors/index.ts`
**Purpose**: Error for configuration issues
**Extends**: EvalError

---

### Orchestrator Classes (packages/ai-evals/src/orchestrator/)

#### 83. ReportGenerator
**File**: `packages/ai-evals/src/orchestrator/report-generator.ts`
**Purpose**: Generate evaluation reports

| Method | Visibility | Description |
|--------|------------|-------------|
| `generate(results, config)` | public | Generate report |
| `formatMarkdown(report)` | public | Format as markdown |
| `formatHTML(report)` | public | Format as HTML |

---

#### 84. JobManager
**File**: `packages/ai-evals/src/orchestrator/job-manager.ts`
**Purpose**: Manage evaluation jobs

| Method | Visibility | Description |
|--------|------------|-------------|
| `createJob(config)` | public | Create job |
| `updateJob(jobId, status)` | public | Update job status |
| `getJob(jobId)` | public | Get job |
| `listJobs()` | public | List all jobs |

---

#### 85. BaselineComparator
**File**: `packages/ai-evals/src/orchestrator/baseline-comparator.ts`
**Purpose**: Compare results against baselines

| Method | Visibility | Description |
|--------|------------|-------------|
| `compare(current, baseline)` | public | Compare results |
| `detectRegressions(comparison)` | public | Detect regressions |

---

---

## services/

### User Service (services/user/src/)

#### 86. RBACService
**File**: `services/user/src/services/rbacService.ts`
**Purpose**: Role-based access control service
**Implements**: IRBACService

| Method | Visibility | Description |
|--------|------------|-------------|
| `getUserRoles(userId)` | public | Get user roles and permissions |
| `checkPermission(userId, permission)` | public | Check if user has permission |
| `getPermissionsForRole(role)` | public | Get permissions for a role |
| `requirePermission(userId, permission)` | public | Require permission (throws if not) |
| `requireRole(userId, allowedRoles)` | public | Require specific roles |

---

#### 87. ProfileService
**File**: `services/user/src/services/profileService.ts`
**Purpose**: Manage user profiles
**Implements**: IProfileService

| Method | Visibility | Description |
|--------|------------|-------------|
| `getProfile(userId)` | public | Get user profile |
| `updateProfile(userId, data)` | public | Update user profile |
| `createProfile(userId, data)` | public | Create user profile |

---

#### 88. ClerkSyncService
**File**: `services/user/src/services/clerkSyncService.ts`
**Purpose**: Sync user data with Clerk authentication
**Implements**: IClerkSyncService

| Method | Visibility | Description |
|--------|------------|-------------|
| `syncUser(clerkUser)` | public | Sync user from Clerk |
| `handleWebhook(event)` | public | Handle Clerk webhook |

---

#### 89. AppError
**File**: `services/user/src/middleware/errorHandler.ts`
**Purpose**: Custom application error
**Extends**: Error

| Property | Type | Description |
|----------|------|-------------|
| `statusCode` | number | HTTP status code |
| `isOperational` | boolean | Is operational error |

---

### Advising Service (services/advising/src/)

#### 90. CSPSolver
**File**: `services/advising/src/algorithms/cspSolver.ts`
**Purpose**: Constraint Satisfaction Problem solver using backtracking with forward checking

| Method | Visibility | Description |
|--------|------------|-------------|
| `solve()` | public | Solve the CSP and return the best solution |
| `backtrackingSearch(assignment)` | private | Backtracking search with forward checking |
| `isComplete(assignment)` | private | Check if assignment is complete |
| `selectUnassignedVariable(assignment)` | private | Select unassigned variable using MRV heuristic |
| `orderDomainValues(variable, assignment)` | private | Order domain values using LCV heuristic |

---

#### 91. SchedulingEngineService
**File**: `services/advising/src/services/schedulingEngine.ts`
**Purpose**: Schedule courses for students

| Method | Visibility | Description |
|--------|------------|-------------|
| `generateSchedule(studentId, requirements)` | public | Generate schedule for student |
| `optimizeSchedule(schedule, preferences)` | public | Optimize existing schedule |
| `validateSchedule(schedule)` | public | Validate schedule constraints |

---

#### 92. DegreeAuditService
**File**: `services/advising/src/services/degreeAudit.ts`
**Purpose**: Audit degree progress

| Method | Visibility | Description |
|--------|------------|-------------|
| `audit(studentId)` | public | Perform degree audit |
| `getProgress(studentId)` | public | Get progress towards degree |
| `getRemainingRequirements(studentId)` | public | Get remaining requirements |

---

#### 93. ConflictDetectorService
**File**: `services/advising/src/services/conflictDetector.ts`
**Purpose**: Detect scheduling conflicts

| Method | Visibility | Description |
|--------|------------|-------------|
| `detectConflicts(schedule)` | public | Detect all conflicts |
| `checkTimeConflict(a, b)` | public | Check time conflict between two items |
| `suggestResolutions(conflicts)` | public | Suggest conflict resolutions |

---

#### 94. RecommendationService
**File**: `services/advising/src/services/recommendationService.ts`
**Purpose**: Provide course recommendations

| Method | Visibility | Description |
|--------|------------|-------------|
| `recommend(studentId)` | public | Get course recommendations |
| `getElectives(studentId, count)` | public | Get elective recommendations |

---

### Support Service (services/support/src/)

#### 95. WorkshopService
**File**: `services/support/src/services/workshopService.ts`
**Purpose**: Manage workshops
**Implements**: IWorkshopService

| Method | Visibility | Description |
|--------|------------|-------------|
| `createWorkshop(data)` | public | Create workshop |
| `getWorkshop(id)` | public | Get workshop by ID |
| `listWorkshops(filters)` | public | List workshops |
| `registerStudent(workshopId, studentId)` | public | Register student for workshop |

---

#### 96. TutoringService
**File**: `services/support/src/services/tutoringService.ts`
**Purpose**: Manage tutoring sessions
**Implements**: ITutoringService

| Method | Visibility | Description |
|--------|------------|-------------|
| `createSession(data)` | public | Create tutoring session |
| `getSession(id)` | public | Get session by ID |
| `listSessions(filters)` | public | List sessions |
| `matchTutor(studentId, subject)` | public | Match student with tutor |

---

#### 97. StudyHallService
**File**: `services/support/src/services/studyHallService.ts`
**Purpose**: Manage study hall sessions
**Implements**: IStudyHallService

| Method | Visibility | Description |
|--------|------------|-------------|
| `checkIn(studentId, hallId)` | public | Check in student |
| `checkOut(studentId, hallId)` | public | Check out student |
| `getAttendance(hallId, date)` | public | Get attendance for hall |

---

#### 98. MentoringService
**File**: `services/support/src/services/mentoringService.ts`
**Purpose**: Manage mentoring relationships
**Implements**: IMentoringService

| Method | Visibility | Description |
|--------|------------|-------------|
| `createRelationship(mentorId, menteeId)` | public | Create mentoring relationship |
| `getMentor(studentId)` | public | Get student's mentor |
| `getMentees(mentorId)` | public | Get mentor's mentees |

---

#### 99. AvailabilityEngine
**File**: `services/support/src/services/availabilityEngine.ts`
**Purpose**: Manage availability for support services
**Implements**: IAvailabilityEngine

| Method | Visibility | Description |
|--------|------------|-------------|
| `getAvailability(resourceId, dateRange)` | public | Get resource availability |
| `setAvailability(resourceId, slots)` | public | Set resource availability |
| `findAvailableSlot(resourceType, duration)` | public | Find available slot |

---

### Integration Service (services/integration/src/)

#### 100. TravelLetterGenerator
**File**: `services/integration/src/services/travelLetterGenerator.ts`
**Purpose**: Generate travel letters for students

| Method | Visibility | Description |
|--------|------------|-------------|
| `generate(studentId, tripDetails)` | public | Generate travel letter |
| `getTemplate(type)` | private | Get letter template |

---

#### 101. EmailService
**File**: `services/integration/src/services/emailService.ts`
**Purpose**: Send emails

| Method | Visibility | Description |
|--------|------------|-------------|
| `send(options)` | public | Send email |
| `sendBulk(recipients, template, data)` | public | Send bulk emails |
| `queueEmail(email)` | public | Queue email for sending |

---

#### 102. CalendarService
**File**: `services/integration/src/services/calendarService.ts`
**Purpose**: Manage calendar integrations

| Method | Visibility | Description |
|--------|------------|-------------|
| `createEvent(event)` | public | Create calendar event |
| `updateEvent(eventId, updates)` | public | Update calendar event |
| `deleteEvent(eventId)` | public | Delete calendar event |
| `sync(userId, provider)` | public | Sync with external calendar |

---

#### 103. TranscriptService
**File**: `services/integration/src/services/transcriptService.ts`
**Purpose**: Manage academic transcripts

| Method | Visibility | Description |
|--------|------------|-------------|
| `getTranscript(studentId)` | public | Get student transcript |
| `requestOfficial(studentId, destination)` | public | Request official transcript |

---

#### 104. LMSConnector
**File**: `services/integration/src/services/lmsConnector.ts`
**Purpose**: Connect to Learning Management Systems

| Method | Visibility | Description |
|--------|------------|-------------|
| `connect(config)` | public | Connect to LMS |
| `getGrades(studentId)` | public | Get student grades from LMS |
| `getAssignments(courseId)` | public | Get course assignments |
| `syncGrades(courseId)` | public | Sync grades from LMS |

---

#### 105. SISConnector
**File**: `services/integration/src/services/sisConnector.ts`
**Purpose**: Connect to Student Information Systems

| Method | Visibility | Description |
|--------|------------|-------------|
| `connect(config)` | public | Connect to SIS |
| `getStudentData(studentId)` | public | Get student data from SIS |
| `syncEnrollment(term)` | public | Sync enrollment data |

---

### Compliance Service (services/compliance/src/)

#### 106. RuleEngine
**File**: `services/compliance/src/services/ruleEngine.ts`
**Purpose**: Execute compliance rules and regulations

| Method | Visibility | Description |
|--------|------------|-------------|
| `evaluate(studentId, ruleSet)` | public | Evaluate rules for student |
| `addRule(rule)` | public | Add new rule |
| `removeRule(ruleId)` | public | Remove rule |
| `getRuleViolations(studentId)` | public | Get rule violations |

---

### AI Service (services/ai/src/)

#### 107. RAGPipeline
**File**: `services/ai/src/services/ragPipeline.ts`
**Purpose**: Retrieval-Augmented Generation pipeline

| Method | Visibility | Description |
|--------|------------|-------------|
| `query(question, context)` | public | Query with RAG |
| `indexDocuments(documents)` | public | Index documents |
| `search(query, topK)` | public | Search for relevant documents |

---

#### 108. PredictiveAnalyticsService
**File**: `services/ai/src/services/predictiveAnalytics.ts`
**Purpose**: Provide predictive analytics

| Method | Visibility | Description |
|--------|------------|-------------|
| `predictRisk(studentId)` | public | Predict student risk |
| `predictSuccess(studentId, courseId)` | public | Predict course success |
| `getFeatures(studentId)` | private | Get features for prediction |

---

#### 109. ChatService
**File**: `services/ai/src/services/chatService.ts`
**Purpose**: Manage chat conversations

| Method | Visibility | Description |
|--------|------------|-------------|
| `startConversation(userId)` | public | Start new conversation |
| `sendMessage(conversationId, message)` | public | Send message |
| `getHistory(conversationId)` | public | Get conversation history |

---

#### 110. EmbeddingService
**File**: `services/ai/src/services/embeddingService.ts`
**Purpose**: Generate and manage embeddings

| Method | Visibility | Description |
|--------|------------|-------------|
| `embed(text)` | public | Generate embedding for text |
| `embedBatch(texts)` | public | Generate embeddings for batch |
| `similarity(a, b)` | public | Calculate similarity |

---

---

## packages/database/

The database package primarily contains Prisma schema definitions and client exports rather than traditional TypeScript classes.

**File**: `packages/database/index.ts`
**Purpose**: Prisma database client and models wrapper

| Export | Type | Description |
|--------|------|-------------|
| `prisma` | PrismaClient | Database client instance |
| `Prisma` | namespace | Prisma types and utilities |
| Model types | types | Generated model types |

---

## packages/ui/

The UI package primarily contains React functional components and hooks rather than traditional classes. Notable exports include:

### Stores

#### 111. UIStore
**File**: `packages/ui/stores/ui-store.ts`
**Purpose**: UI state management (Zustand store)

| Action | Description |
|--------|-------------|
| `setTheme(theme)` | Set UI theme |
| `toggleSidebar()` | Toggle sidebar |
| `setLoading(loading)` | Set loading state |

---

## Summary Statistics

| Category | Count |
|----------|-------|
| **packages/ai** | 38 classes |
| **packages/ai-evals** | 47 classes |
| **services** | 25 classes |
| **packages/database** | 1 wrapper |
| **packages/ui** | 1 store |
| **Total** | **112 classes** |

### By Type

| Type | Count |
|------|-------|
| Agents | 7 |
| Error Classes | 16 |
| Runners | 8 |
| Scorers | 11 |
| Services | 20 |
| Caches/Managers | 15 |
| Utilities | 35 |

---

*This inventory was automatically generated and may not include all internal or private classes. Please review source files for complete implementation details.*
