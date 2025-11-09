/**
 * Specialized Runners
 * 
 * Domain-specific runners for compliance, conversation, advising, risk prediction, and RAG
 */

import { BaseRunner, type ExecutionContext, type ExecutionResult } from './base-runner'
import type { TestCase, Score, ScorerConfig } from './types'

/**
 * Compliance Runner
 * 
 * Specialized runner for NCAA compliance eligibility checks
 * Expects structured JSON output with eligibility status and requirements
 */
export class ComplianceRunner extends BaseRunner {
  protected async execute(context: ExecutionContext): Promise<ExecutionResult> {
    const { testCase, modelConfig, startTime } = context

    try {
      // Create compliance-specific prompt
      const systemPrompt = `You are an NCAA Division I compliance expert. Analyze the student's information and determine their eligibility status.

Respond with valid JSON only in this exact format:
{
  "eligible": boolean,
  "status": "ELIGIBLE" | "INELIGIBLE",
  "type": "INITIAL" | "CONTINUING" | "TRANSFER" | "REDSHIRT" | "MEDICAL_HARDSHIP" | "SUMMER",
  "requirements": {
    // Include relevant requirement checks with "met", "value", and "required" fields
  },
  "violations": ["list of violations if any"],
  "warnings": ["list of warnings if any"]
}`

      const prompt = this.formatPrompt(testCase, systemPrompt)

      // Generate response
      const result = await this.generateText(prompt, modelConfig)

      // Parse JSON output
      const output = this.parseJSON(result.text)

      return {
        output,
        latencyMs: Date.now() - startTime,
        tokens: result.tokens,
        cost: result.cost,
        model: modelConfig.model,
        success: true,
      }
    } catch (error) {
      return {
        output: null,
        latencyMs: Date.now() - startTime,
        tokens: { input: 0, output: 0, total: 0 },
        cost: 0,
        model: modelConfig.model,
        success: false,
        error: {
          code: 'COMPLIANCE_CHECK_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      }
    }
  }

  protected async scoreResult(
    testCase: TestCase,
    executionResult: ExecutionResult,
    scorerConfig: ScorerConfig
  ): Promise<Score> {
    if (!executionResult.success || !executionResult.output) {
      return {
        testCaseId: testCase.id,
        value: 0,
        passed: false,
        actual: executionResult.output,
        expected: testCase.expected,
        latencyMs: executionResult.latencyMs,
        tokens: executionResult.tokens,
        cost: executionResult.cost,
        error: executionResult.error,
      }
    }

    const expected = testCase.expected as any
    const actual = executionResult.output

    // Check key fields
    const eligibleMatch = actual.eligible === expected.eligible
    const statusMatch = actual.status === expected.status
    const typeMatch = !expected.type || actual.type === expected.type

    // Calculate score based on matches
    let score = 0
    if (eligibleMatch) score += 0.5
    if (statusMatch) score += 0.3
    if (typeMatch) score += 0.2

    const passed = score >= 0.8 // 80% threshold

    return {
      testCaseId: testCase.id,
      value: score,
      passed,
      actual,
      expected,
      explanation: `Eligible: ${eligibleMatch ? '✓' : '✗'}, Status: ${statusMatch ? '✓' : '✗'}, Type: ${typeMatch ? '✓' : '✗'}`,
      latencyMs: executionResult.latencyMs,
      tokens: executionResult.tokens,
      cost: executionResult.cost,
    }
  }
}

/**
 * Conversational Runner
 * 
 * Specialized runner for conversational AI interactions
 * Evaluates intent classification, tone, and content quality
 */
export class ConversationalRunner extends BaseRunner {
  protected async execute(context: ExecutionContext): Promise<ExecutionResult> {
    const { testCase, modelConfig, startTime } = context

    try {
      // Create conversation-specific prompt
      const systemPrompt = `You are a helpful AI assistant for student-athletes at an NCAA Division I institution. 
Provide accurate, empathetic, and professional responses to student questions about academics, athletics, and NCAA compliance.

Guidelines:
- Be friendly and supportive
- Cite NCAA rules when relevant
- Stay within scope (academic and athletic support)
- Redirect out-of-scope questions politely
- Respect FERPA privacy boundaries`

      const prompt = this.formatPrompt(testCase, systemPrompt)

      // Generate response
      const result = await this.generateText(prompt, modelConfig)

      return {
        output: result.text,
        latencyMs: Date.now() - startTime,
        tokens: result.tokens,
        cost: result.cost,
        model: modelConfig.model,
        success: true,
      }
    } catch (error) {
      return {
        output: null,
        latencyMs: Date.now() - startTime,
        tokens: { input: 0, output: 0, total: 0 },
        cost: 0,
        model: modelConfig.model,
        success: false,
        error: {
          code: 'CONVERSATION_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      }
    }
  }

  protected async scoreResult(
    testCase: TestCase,
    executionResult: ExecutionResult,
    scorerConfig: ScorerConfig
  ): Promise<Score> {
    if (!executionResult.success || !executionResult.output) {
      return {
        testCaseId: testCase.id,
        value: 0,
        passed: false,
        actual: executionResult.output,
        expected: testCase.expected,
        latencyMs: executionResult.latencyMs,
        tokens: executionResult.tokens,
        cost: executionResult.cost,
        error: executionResult.error,
      }
    }

    const expected = testCase.expected as any
    const actual = executionResult.output.toLowerCase()

    let score = 0
    let checks = 0

    // Check for expected keywords
    if (expected.containsKeywords) {
      checks++
      const keywordsFound = expected.containsKeywords.filter((kw: string) =>
        actual.includes(kw.toLowerCase())
      )
      score += keywordsFound.length / expected.containsKeywords.length
    }

    // Check tone (basic sentiment analysis)
    if (expected.tone) {
      checks++
      const toneKeywords: Record<string, string[]> = {
        friendly: ['happy', 'glad', 'help', 'welcome'],
        professional: ['please', 'would', 'recommend', 'suggest'],
        empathetic: ['understand', 'sorry', 'support', 'here for you'],
        informative: ['according', 'requires', 'must', 'need'],
      }
      const keywords = toneKeywords[expected.tone] || []
      const found = keywords.some(kw => actual.includes(kw))
      if (found) score += 1
    }

    // Check if it cites sources
    if (expected.citesSource) {
      checks++
      const citesSource = actual.includes('bylaw') || actual.includes('ncaa') || actual.includes('manual')
      if (citesSource) score += 1
    }

    // Check if it provides options
    if (expected.providesOptions) {
      checks++
      const hasOptions = actual.includes('?') || actual.includes('or') || actual.includes('either')
      if (hasOptions) score += 1
    }

    // Check if it asks for clarification
    if (expected.asksForClarification) {
      checks++
      const asksClarification = actual.includes('?') && (actual.includes('what') || actual.includes('which') || actual.includes('could you'))
      if (asksClarification) score += 1
    }

    // Normalize score
    const normalizedScore = checks > 0 ? score / checks : 0
    const passed = normalizedScore >= 0.7 // 70% threshold

    return {
      testCaseId: testCase.id,
      value: normalizedScore,
      passed,
      actual: executionResult.output,
      expected,
      explanation: `Score: ${(normalizedScore * 100).toFixed(0)}% (${checks} checks)`,
      latencyMs: executionResult.latencyMs,
      tokens: executionResult.tokens,
      cost: executionResult.cost,
    }
  }
}

/**
 * Advising Runner
 * 
 * Specialized runner for academic advising tasks
 * Handles course scheduling, prerequisites, and degree progress
 */
export class AdvisingRunner extends BaseRunner {
  protected async execute(context: ExecutionContext): Promise<ExecutionResult> {
    const { testCase, modelConfig, startTime } = context

    try {
      // Create advising-specific prompt
      const systemPrompt = `You are an academic advisor for student-athletes. Help with course scheduling, prerequisite checking, and degree planning.

Respond with valid JSON only in this format:
{
  "success": boolean,
  "coursesScheduled": number,
  "conflicts": [{"type": string, "courses": string[], "reason": string}],
  "suggestions": string[],
  "canEnroll": boolean,
  "prerequisitesMet": boolean,
  "requirements": [{"course": string, "grade": string, "met": boolean}],
  "message": string
}`

      const prompt = this.formatPrompt(testCase, systemPrompt)

      // Generate response
      const result = await this.generateText(prompt, modelConfig)

      // Parse JSON output
      const output = this.parseJSON(result.text)

      return {
        output,
        latencyMs: Date.now() - startTime,
        tokens: result.tokens,
        cost: result.cost,
        model: modelConfig.model,
        success: true,
      }
    } catch (error) {
      return {
        output: null,
        latencyMs: Date.now() - startTime,
        tokens: { input: 0, output: 0, total: 0 },
        cost: 0,
        model: modelConfig.model,
        success: false,
        error: {
          code: 'ADVISING_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      }
    }
  }

  protected async scoreResult(
    testCase: TestCase,
    executionResult: ExecutionResult,
    scorerConfig: ScorerConfig
  ): Promise<Score> {
    if (!executionResult.success || !executionResult.output) {
      return {
        testCaseId: testCase.id,
        value: 0,
        passed: false,
        actual: executionResult.output,
        expected: testCase.expected,
        latencyMs: executionResult.latencyMs,
        tokens: executionResult.tokens,
        cost: executionResult.cost,
        error: executionResult.error,
      }
    }

    const expected = testCase.expected as any
    const actual = executionResult.output

    let score = 0
    let checks = 0

    // Check success/canEnroll field
    if ('success' in expected) {
      checks++
      if (actual.success === expected.success) score += 1
    }
    if ('canEnroll' in expected) {
      checks++
      if (actual.canEnroll === expected.canEnroll) score += 1
    }

    // Check prerequisitesMet
    if ('prerequisitesMet' in expected) {
      checks++
      if (actual.prerequisitesMet === expected.prerequisitesMet) score += 1
    }

    // Check conflicts array
    if (expected.conflicts) {
      checks++
      const expectedConflicts = expected.conflicts.length
      const actualConflicts = actual.conflicts?.length || 0
      if (expectedConflicts === actualConflicts) score += 1
    }

    // Normalize score
    const normalizedScore = checks > 0 ? score / checks : 0
    const passed = normalizedScore >= 0.8 // 80% threshold

    return {
      testCaseId: testCase.id,
      value: normalizedScore,
      passed,
      actual,
      expected,
      explanation: `Matched ${score}/${checks} key fields`,
      latencyMs: executionResult.latencyMs,
      tokens: executionResult.tokens,
      cost: executionResult.cost,
    }
  }
}

/**
 * Risk Prediction Runner
 * 
 * Specialized runner for student risk assessment
 * Predicts risk levels and provides intervention recommendations
 */
export class RiskPredictionRunner extends BaseRunner {
  protected async execute(context: ExecutionContext): Promise<ExecutionResult> {
    const { testCase, modelConfig, startTime } = context

    try {
      // Create risk prediction prompt
      const systemPrompt = `You are a student success analyst. Assess the student's risk level based on their academic and athletic performance.

Respond with valid JSON only in this format:
{
  "riskLevel": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "riskScore": number (0-1),
  "factors": [
    {"factor": string, "value": any, "impact": "positive" | "neutral" | "negative" | "critical", "trend": "improving" | "stable" | "declining"}
  ],
  "recommendations": string[],
  "urgency": "routine" | "soon" | "immediate" | "critical",
  "eligibilityThreat": boolean
}`

      const prompt = this.formatPrompt(testCase, systemPrompt)

      // Generate response
      const result = await this.generateText(prompt, modelConfig)

      // Parse JSON output
      const output = this.parseJSON(result.text)

      return {
        output,
        latencyMs: Date.now() - startTime,
        tokens: result.tokens,
        cost: result.cost,
        model: modelConfig.model,
        success: true,
      }
    } catch (error) {
      return {
        output: null,
        latencyMs: Date.now() - startTime,
        tokens: { input: 0, output: 0, total: 0 },
        cost: 0,
        model: modelConfig.model,
        success: false,
        error: {
          code: 'RISK_PREDICTION_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      }
    }
  }

  protected async scoreResult(
    testCase: TestCase,
    executionResult: ExecutionResult,
    scorerConfig: ScorerConfig
  ): Promise<Score> {
    if (!executionResult.success || !executionResult.output) {
      return {
        testCaseId: testCase.id,
        value: 0,
        passed: false,
        actual: executionResult.output,
        expected: testCase.expected,
        latencyMs: executionResult.latencyMs,
        tokens: executionResult.tokens,
        cost: executionResult.cost,
        error: executionResult.error,
      }
    }

    const expected = testCase.expected as any
    const actual = executionResult.output

    let score = 0

    // Check risk level (most important)
    const riskLevelMatch = actual.riskLevel === expected.riskLevel
    if (riskLevelMatch) score += 0.5

    // Check risk score is in reasonable range
    const expectedScore = expected.riskScore
    const actualScore = actual.riskScore
    if (actualScore !== undefined && expectedScore !== undefined) {
      const scoreDiff = Math.abs(actualScore - expectedScore)
      if (scoreDiff <= 0.2) score += 0.3 // Within 20% is good
      else if (scoreDiff <= 0.3) score += 0.15 // Within 30% is okay
    }

    // Check recommendations are provided
    if (actual.recommendations && actual.recommendations.length > 0) {
      score += 0.2
    }

    const passed = score >= 0.7 // 70% threshold

    return {
      testCaseId: testCase.id,
      value: score,
      passed,
      actual,
      expected,
      explanation: `Risk Level: ${riskLevelMatch ? '✓' : '✗'}, Score: ${actualScore?.toFixed(2)} (expected: ${expectedScore?.toFixed(2)})`,
      latencyMs: executionResult.latencyMs,
      tokens: executionResult.tokens,
      cost: executionResult.cost,
    }
  }
}

/**
 * RAG Runner
 * 
 * Specialized runner for Retrieval Augmented Generation
 * Tests document retrieval and answer generation quality
 */
export class RAGRunner extends BaseRunner {
  protected async execute(context: ExecutionContext): Promise<ExecutionResult> {
    const { testCase, modelConfig, startTime } = context

    try {
      // Create RAG-specific prompt
      const systemPrompt = `You are a knowledge base assistant. Answer questions using the provided context and cite your sources.

Respond with valid JSON only in this format:
{
  "retrieved": boolean,
  "relevantDocs": [
    {"docId": string, "title": string, "relevanceScore": number}
  ],
  "answer": string,
  "containsKeywords": string[],
  "citesSource": boolean,
  "synthesizesMultipleDocs": boolean,
  "acknowledgesLimitation": boolean,
  "asksForClarification": boolean
}`

      const prompt = this.formatPrompt(testCase, systemPrompt)

      // Generate response
      const result = await this.generateText(prompt, modelConfig)

      // Parse JSON output
      const output = this.parseJSON(result.text)

      return {
        output,
        latencyMs: Date.now() - startTime,
        tokens: result.tokens,
        cost: result.cost,
        model: modelConfig.model,
        success: true,
      }
    } catch (error) {
      return {
        output: null,
        latencyMs: Date.now() - startTime,
        tokens: { input: 0, output: 0, total: 0 },
        cost: 0,
        model: modelConfig.model,
        success: false,
        error: {
          code: 'RAG_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      }
    }
  }

  protected async scoreResult(
    testCase: TestCase,
    executionResult: ExecutionResult,
    scorerConfig: ScorerConfig
  ): Promise<Score> {
    if (!executionResult.success || !executionResult.output) {
      return {
        testCaseId: testCase.id,
        value: 0,
        passed: false,
        actual: executionResult.output,
        expected: testCase.expected,
        latencyMs: executionResult.latencyMs,
        tokens: executionResult.tokens,
        cost: executionResult.cost,
        error: executionResult.error,
      }
    }

    const expected = testCase.expected as any
    const actual = executionResult.output

    let score = 0
    let checks = 0

    // Check if documents were retrieved
    if ('retrieved' in expected) {
      checks++
      if (actual.retrieved === expected.retrieved) score += 1
    }

    // Check if answer contains expected keywords
    if (expected.containsKeywords && actual.answer) {
      checks++
      const answerLower = actual.answer.toLowerCase()
      const keywordsFound = expected.containsKeywords.filter((kw: string) =>
        answerLower.includes(kw.toLowerCase())
      )
      score += keywordsFound.length / expected.containsKeywords.length
    }

    // Check if sources are cited
    if (expected.citesSource) {
      checks++
      if (actual.citesSource === true) score += 1
    }

    // Check document relevance scores
    if (expected.relevantDocs && actual.relevantDocs) {
      checks++
      const avgRelevance = actual.relevantDocs.reduce((sum: number, doc: any) => 
        sum + (doc.relevanceScore || 0), 0) / actual.relevantDocs.length
      if (avgRelevance >= 0.8) score += 1
      else if (avgRelevance >= 0.6) score += 0.5
    }

    // Normalize score
    const normalizedScore = checks > 0 ? score / checks : 0
    const passed = normalizedScore >= 0.7 // 70% threshold

    return {
      testCaseId: testCase.id,
      value: normalizedScore,
      passed,
      actual,
      expected,
      explanation: `Score: ${(normalizedScore * 100).toFixed(0)}% (${checks} checks)`,
      latencyMs: executionResult.latencyMs,
      tokens: executionResult.tokens,
      cost: executionResult.cost,
    }
  }
}

/**
 * Create specialized runner instance
 */
export function createSpecializedRunner(
  type: 'compliance' | 'conversation' | 'advising' | 'risk' | 'rag',
  config?: any
): BaseRunner {
  switch (type) {
    case 'compliance':
      return new ComplianceRunner(config)
    case 'conversation':
      return new ConversationalRunner(config)
    case 'advising':
      return new AdvisingRunner(config)
    case 'risk':
      return new RiskPredictionRunner(config)
    case 'rag':
      return new RAGRunner(config)
    default:
      throw new Error(`Unknown specialized runner type: ${type}`)
  }
}
