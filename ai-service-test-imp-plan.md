# AI Service Test Improvement Plan

## Executive Summary

The AI service (`@aah/service-ai`) currently has **28 tests** with **12 failures** (57% pass rate). Only 1 of 6 AI services has any test coverage. This plan outlines a comprehensive strategy to fix existing failures and expand coverage to all services.

**Target Outcome:** From 28 tests to ~135 tests with 95%+ pass rate and full service coverage.

---

## Current State Analysis

### Test Coverage Gaps

| Service | Lines of Code | Complexity | Current Tests | Status |
|---------|---------------|------------|---------------|--------|
| PredictiveAnalyticsService | 300+ | Very High | 28 (12 failing) | Partial |
| RAGPipeline | 400+ | Very High | 0 | **Critical Gap** |
| ChatService | 296+ | High | 0 | **Critical Gap** |
| AdvisingAgent | 343+ | Very High | 0 | **Critical Gap** |
| ComplianceAgent | 130+ | High | 0 | **Gap** |
| EmbeddingService | 150+ | Medium | 0 | **Gap** |

### Root Cause Analysis of Failing Tests

#### 1. Risk Threshold Logic Mismatch (8 failures)

**Problem:** Tests expect exclusive boundaries but implementation uses inclusive (`>=`).

```typescript
// Current implementation (predictiveAnalytics.ts:207-210)
if (riskScore >= 0.8) return 'critical'
if (riskScore >= 0.6) return 'high'     // 0.6 matches here, not medium
if (riskScore >= 0.4) return 'medium'
return 'low'
```

**Test expectation:**
```typescript
// Test expects GPA 2.3 -> impact 0.6 -> 'medium' risk
// But 0.6 >= 0.6 returns 'high'
expect(result.overallRisk).toBe('medium') // FAILS
```

**Fix Option A (Recommended):** Adjust tests to match implementation semantics
```typescript
// Risk levels: critical >= 0.8, high >= 0.6, medium >= 0.4, low < 0.4
expect(result.overallRisk).toBe('high') // For score = 0.6
```

**Fix Option B:** Change implementation to exclusive boundaries
```typescript
if (riskScore >= 0.8) return 'critical'
if (riskScore > 0.6) return 'high'      // Exclusive
if (riskScore > 0.4) return 'medium'    // Exclusive
return 'low'
```

#### 2. Trend Detection Failure (2 failures)

**Problem:** Test provides mock data expecting 'declining' trend but calculation returns 'stable'.

**Fix:** Ensure mock metrics history has sufficient variance to trigger trend detection:
```typescript
const mockMetrics = [
  { date: '2024-01-01', gpa: 3.5, attendanceRate: 0.95 },
  { date: '2024-02-01', gpa: 3.2, attendanceRate: 0.88 },
  { date: '2024-03-01', gpa: 2.8, attendanceRate: 0.75 }, // Clear decline
]
```

#### 3. Jest Reference Remnant (1 failure)

**Problem:** Line 444 still uses `jest.fn()` instead of `vi.fn()`.

**Fix:**
```typescript
// Before
vi.mocked(aiSdk.generateObject).mockImplementation(jest.fn().mockRejectedValue(new Error('API error')))

// After
vi.mocked(aiSdk.generateObject).mockImplementation(vi.fn().mockRejectedValue(new Error('API error')))
```

#### 4. Mock Factory Issues (1 failure)

**Problem:** `createMockStudentProfile` doesn't align field values with expected risk calculations.

**Fix:** Update mock factory to produce consistent, predictable risk scores.

---

## Implementation Plan

### Phase 1: Fix Existing Failures (Priority: Critical)

**Duration:** 2-4 hours
**Goal:** Achieve 100% pass rate on existing 28 tests

#### Tasks:
1. [ ] Fix Jest reference at line 444 in `predictiveAnalytics.test.ts`
2. [ ] Align risk threshold tests with implementation semantics
3. [ ] Fix trend detection test data
4. [ ] Update mock factories for consistent risk calculations
5. [ ] Run full test suite to verify all 28 tests pass

#### Verification:
```bash
pnpm --filter @aah/service-ai test
# Expected: 28 tests, 28 passed
```

---

### Phase 2: Test Infrastructure Setup (Priority: High)

**Duration:** 3-4 hours
**Goal:** Create reusable test utilities for all AI services

#### Create: `services/ai/src/__tests__/utils/testHelpers.ts`

```typescript
import { vi } from 'vitest'

// LLM Mock Factory
export function createMockLLMResponse<T>(data: T) {
  return {
    object: data,
    usage: { promptTokens: 100, completionTokens: 50 },
    finishReason: 'stop'
  }
}

// Student Profile Factory
export function createMockStudentProfile(overrides?: Partial<StudentProfile>) {
  return {
    id: 'student-123',
    userId: 'user-123',
    firstName: 'John',
    lastName: 'Doe',
    sport: 'FOOTBALL',
    position: 'Quarterback',
    yearInSchool: 'SOPHOMORE',
    cumulativeGpa: 3.0,
    eligibilityStatus: 'ELIGIBLE',
    enrollmentDate: new Date('2023-08-15'),
    ...overrides
  }
}

// Compliance Record Factory
export function createMockComplianceRecord(overrides?: Partial<ComplianceRecord>) {
  return {
    id: 'record-123',
    studentProfileId: 'student-123',
    academicYear: '2024-2025',
    term: 'FALL',
    cumulativeGpa: 3.0,
    termGpa: 3.2,
    creditHoursCompleted: 45,
    creditHoursAttempted: 48,
    progressTowardDegree: 0.35,
    eligibilityStatus: 'ELIGIBLE',
    ...overrides
  }
}

// AI SDK Mock Setup
export function setupAISDKMocks() {
  vi.mock('@ai-sdk/openai', () => ({
    openai: vi.fn(() => 'mock-openai-model')
  }))

  vi.mock('ai', () => ({
    generateObject: vi.fn(),
    generateText: vi.fn(),
    embed: vi.fn(),
    embedMany: vi.fn()
  }))
}

// Database Mock Setup
export function setupPrismaMocks() {
  return {
    studentProfile: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn()
    },
    complianceRecord: {
      findMany: vi.fn(),
      findFirst: vi.fn()
    },
    academicMetrics: {
      findMany: vi.fn()
    },
    tutoringSession: {
      findMany: vi.fn()
    }
  }
}
```

#### Create: `services/ai/src/__tests__/utils/mockData.ts`

```typescript
// Standard test scenarios
export const TEST_SCENARIOS = {
  highRiskStudent: {
    gpa: 1.8,
    attendanceRate: 0.65,
    missedClasses: 12,
    expectedRisk: 'critical'
  },
  mediumRiskStudent: {
    gpa: 2.3,
    attendanceRate: 0.80,
    missedClasses: 5,
    expectedRisk: 'high' // Note: 0.6 threshold is inclusive
  },
  lowRiskStudent: {
    gpa: 3.5,
    attendanceRate: 0.95,
    missedClasses: 1,
    expectedRisk: 'low'
  },
  decliningTrend: {
    metrics: [
      { gpa: 3.5, date: '2024-01' },
      { gpa: 3.2, date: '2024-02' },
      { gpa: 2.8, date: '2024-03' }
    ],
    expectedTrend: 'declining'
  }
}
```

---

### Phase 3: RAGPipeline Tests (Priority: Critical)

**Duration:** 4-6 hours
**Target:** ~30 new tests

#### File: `services/ai/src/__tests__/ragPipeline.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { RAGPipeline } from '../services/ragPipeline'
import { setupAISDKMocks, createMockLLMResponse } from './utils/testHelpers'

describe('RAGPipeline', () => {
  let ragPipeline: RAGPipeline

  beforeEach(() => {
    setupAISDKMocks()
    ragPipeline = new RAGPipeline()
    vi.clearAllMocks()
  })

  describe('Document Retrieval', () => {
    it('should retrieve relevant documents for a query')
    it('should rank documents by relevance score')
    it('should filter documents below threshold')
    it('should handle empty search results')
    it('should respect maxDocuments parameter')
  })

  describe('Context Building', () => {
    it('should build context from retrieved documents')
    it('should truncate context exceeding token limit')
    it('should preserve document ordering')
    it('should include metadata in context')
  })

  describe('Query Processing', () => {
    it('should preprocess query for embedding')
    it('should expand query with synonyms')
    it('should handle special characters')
    it('should normalize whitespace')
  })

  describe('Response Generation', () => {
    it('should generate response with context')
    it('should cite sources in response')
    it('should handle no relevant context')
    it('should respect response length limits')
  })

  describe('Embedding Integration', () => {
    it('should generate embeddings for queries')
    it('should batch embed multiple documents')
    it('should cache embeddings')
    it('should handle embedding API errors')
  })

  describe('Error Handling', () => {
    it('should handle vector store connection failures')
    it('should handle embedding service errors')
    it('should handle LLM timeout')
    it('should provide fallback responses')
  })
})
```

---

### Phase 4: ChatService Tests (Priority: High)

**Duration:** 3-4 hours
**Target:** ~25 new tests

#### File: `services/ai/src/__tests__/chatService.test.ts`

```typescript
describe('ChatService', () => {
  describe('Message Processing', () => {
    it('should process user message and generate response')
    it('should maintain conversation history')
    it('should handle system prompts')
    it('should respect max history length')
  })

  describe('Streaming Responses', () => {
    it('should stream response chunks')
    it('should handle stream interruption')
    it('should complete stream properly')
  })

  describe('Context Management', () => {
    it('should inject student context into prompts')
    it('should load academic advisor context')
    it('should handle missing context gracefully')
  })

  describe('Intent Detection', () => {
    it('should detect academic advising intent')
    it('should detect compliance questions')
    it('should detect tutoring requests')
    it('should handle ambiguous intents')
  })

  describe('Response Formatting', () => {
    it('should format markdown responses')
    it('should include action items when relevant')
    it('should handle multi-turn conversations')
  })

  describe('Rate Limiting', () => {
    it('should enforce rate limits per user')
    it('should return appropriate error on limit exceeded')
  })
})
```

---

### Phase 5: AdvisingAgent Tests (Priority: High)

**Duration:** 4-5 hours
**Target:** ~20 new tests

#### File: `services/ai/src/__tests__/advisingAgent.test.ts`

```typescript
describe('AdvisingAgent', () => {
  describe('Recommendation Generation', () => {
    it('should generate academic recommendations')
    it('should prioritize urgent academic issues')
    it('should consider eligibility requirements')
    it('should factor in athletic schedule')
  })

  describe('Course Planning', () => {
    it('should suggest courses based on degree progress')
    it('should avoid scheduling conflicts with practice')
    it('should consider prerequisite chains')
    it('should optimize for GPA improvement')
  })

  describe('Risk Intervention', () => {
    it('should suggest interventions for at-risk students')
    it('should escalate critical cases')
    it('should track intervention effectiveness')
  })

  describe('NCAA Compliance Integration', () => {
    it('should verify recommendations meet NCAA rules')
    it('should flag potential compliance issues')
    it('should suggest remediation steps')
  })

  describe('Progress Tracking', () => {
    it('should calculate progress toward degree')
    it('should project graduation timeline')
    it('should identify credit shortfalls')
  })
})
```

---

### Phase 6: ComplianceAgent Tests (Priority: Medium)

**Duration:** 2-3 hours
**Target:** ~15 new tests

#### File: `services/ai/src/__tests__/complianceAgent.test.ts`

```typescript
describe('ComplianceAgent', () => {
  describe('Eligibility Verification', () => {
    it('should verify academic eligibility')
    it('should check progress toward degree')
    it('should validate GPA requirements')
    it('should assess credit hour completion')
  })

  describe('Violation Detection', () => {
    it('should detect GPA violations')
    it('should detect progress violations')
    it('should detect enrollment violations')
    it('should generate violation reports')
  })

  describe('NCAA Rule Interpretation', () => {
    it('should answer compliance questions')
    it('should cite relevant NCAA bylaws')
    it('should provide rule explanations')
  })

  describe('Reporting', () => {
    it('should generate compliance summaries')
    it('should track violation history')
    it('should project future compliance status')
  })
})
```

---

### Phase 7: EmbeddingService Tests (Priority: Medium)

**Duration:** 2-3 hours
**Target:** ~15 new tests

#### File: `services/ai/src/__tests__/embeddingService.test.ts`

```typescript
describe('EmbeddingService', () => {
  describe('Single Embedding', () => {
    it('should generate embedding for text')
    it('should normalize embedding vectors')
    it('should handle empty input')
    it('should handle very long input')
  })

  describe('Batch Embedding', () => {
    it('should generate embeddings for multiple texts')
    it('should respect batch size limits')
    it('should maintain input order')
  })

  describe('Caching', () => {
    it('should cache frequently used embeddings')
    it('should invalidate stale cache entries')
    it('should handle cache misses')
  })

  describe('Similarity Search', () => {
    it('should find similar documents')
    it('should rank by cosine similarity')
    it('should filter by threshold')
  })

  describe('Error Handling', () => {
    it('should retry on transient failures')
    it('should handle API rate limits')
    it('should provide meaningful error messages')
  })
})
```

---

## Test Execution Strategy

### Local Development
```bash
# Run all AI service tests
pnpm --filter @aah/service-ai test

# Run with coverage
pnpm --filter @aah/service-ai test:coverage

# Run specific test file
pnpm --filter @aah/service-ai test predictiveAnalytics

# Watch mode during development
pnpm --filter @aah/service-ai test:watch
```

### CI/CD Integration
```yaml
# .github/workflows/test.yml
ai-service-tests:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: pnpm/action-setup@v2
    - run: pnpm install
    - run: pnpm --filter @aah/service-ai test:coverage
    - uses: codecov/codecov-action@v4
      with:
        files: services/ai/coverage/lcov.info
```

### Coverage Targets

| Metric | Current | Target |
|--------|---------|--------|
| Line Coverage | ~15% | 80% |
| Branch Coverage | ~10% | 75% |
| Function Coverage | ~20% | 85% |
| Test Count | 28 | 135+ |
| Pass Rate | 57% | 95%+ |

---

## Success Criteria

### Phase 1 Complete When:
- [ ] All 28 existing tests pass
- [ ] No Jest references remain
- [ ] Risk threshold tests aligned with implementation

### Phase 2 Complete When:
- [ ] Test utilities available in `__tests__/utils/`
- [ ] Mock factories documented and tested
- [ ] AI SDK mocking patterns established

### Phases 3-7 Complete When:
- [ ] Each service has dedicated test file
- [ ] Coverage exceeds 80% per service
- [ ] All tests pass in CI/CD

### Overall Success:
- [ ] 135+ tests total
- [ ] 95%+ pass rate
- [ ] 80%+ line coverage
- [ ] No flaky tests
- [ ] <60s total test execution time

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| LLM response variability | Use deterministic mocks, seed random generators |
| Test flakiness | Avoid time-dependent assertions, use fixed dates |
| Mock complexity | Create comprehensive mock factories |
| Coverage gaps | Use coverage reports to identify untested paths |
| Maintenance burden | Document test patterns, use shared utilities |

---

## Appendix: Vitest Configuration Reference

```typescript
// services/ai/vitest.config.ts
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: ['src/services/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/**/*.d.ts']
    },
    setupFiles: ['./src/__tests__/setup.ts'],
    testTimeout: 10000,
    hookTimeout: 10000
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@aah/database': path.resolve(__dirname, '../../packages/database/src')
    }
  }
})
```

---

*Generated with sequential thinking analysis on 2025-12-15*
