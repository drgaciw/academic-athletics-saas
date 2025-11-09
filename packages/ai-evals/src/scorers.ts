/**
 * Scorers
 * 
 * Scoring algorithms for evaluating AI model outputs
 * Includes exact match, semantic similarity, LLM-as-judge, and custom scorers
 */

import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'
import type { Score, ScorerConfig } from './types'

/**
 * Base Scorer Interface
 */
export interface Scorer {
  /**
   * Score the actual output against expected output
   */
  score(
    testCaseId: string,
    expected: any,
    actual: any,
    metadata?: {
      latencyMs: number
      tokens?: { input: number; output: number; total: number }
      cost?: number
    }
  ): Promise<Score>
}

/**
 * Exact Match Scorer
 * 
 * Performs deep equality checking for structured outputs (JSON, enums, classifications)
 * Perfect for compliance checks, structured data validation, and deterministic outputs
 */
export class ExactMatchScorer implements Scorer {
  private threshold: number

  constructor(config: ScorerConfig = { type: 'exact-match' }) {
    this.threshold = config.threshold ?? 1.0
  }

  async score(
    testCaseId: string,
    expected: any,
    actual: any,
    metadata?: {
      latencyMs: number
      tokens?: { input: number; output: number; total: number }
      cost?: number
    }
  ): Promise<Score> {
    // Handle null/undefined cases
    if (actual === null || actual === undefined) {
      return {
        testCaseId,
        value: 0,
        passed: false,
        actual,
        expected,
        explanation: 'Actual output is null or undefined',
        latencyMs: metadata?.latencyMs ?? 0,
        tokens: metadata?.tokens,
        cost: metadata?.cost,
      }
    }

    // Perform deep equality check
    const { isEqual, diff } = this.deepEqual(expected, actual)
    const score = isEqual ? 1.0 : 0.0
    const passed = score >= this.threshold

    return {
      testCaseId,
      value: score,
      passed,
      actual,
      expected,
      explanation: isEqual
        ? 'Exact match'
        : `Mismatch: ${this.formatDiff(diff)}`,
      latencyMs: metadata?.latencyMs ?? 0,
      tokens: metadata?.tokens,
      cost: metadata?.cost,
    }
  }

  /**
   * Deep equality check with diff tracking
   */
  private deepEqual(
    expected: any,
    actual: any,
    path: string = 'root'
  ): { isEqual: boolean; diff: string[] } {
    const diff: string[] = []

    // Type check
    if (typeof expected !== typeof actual) {
      diff.push(`${path}: type mismatch (expected ${typeof expected}, got ${typeof actual})`)
      return { isEqual: false, diff }
    }

    // Null check
    if (expected === null || actual === null) {
      if (expected !== actual) {
        diff.push(`${path}: ${expected} !== ${actual}`)
        return { isEqual: false, diff }
      }
      return { isEqual: true, diff }
    }

    // Primitive types
    if (typeof expected !== 'object') {
      if (expected !== actual) {
        diff.push(`${path}: ${JSON.stringify(expected)} !== ${JSON.stringify(actual)}`)
        return { isEqual: false, diff }
      }
      return { isEqual: true, diff }
    }

    // Arrays
    if (Array.isArray(expected)) {
      if (!Array.isArray(actual)) {
        diff.push(`${path}: expected array, got ${typeof actual}`)
        return { isEqual: false, diff }
      }

      if (expected.length !== actual.length) {
        diff.push(`${path}: array length mismatch (expected ${expected.length}, got ${actual.length})`)
        return { isEqual: false, diff }
      }

      for (let i = 0; i < expected.length; i++) {
        const result = this.deepEqual(expected[i], actual[i], `${path}[${i}]`)
        if (!result.isEqual) {
          diff.push(...result.diff)
        }
      }

      return { isEqual: diff.length === 0, diff }
    }

    // Objects
    const expectedKeys = Object.keys(expected).sort()
    const actualKeys = Object.keys(actual).sort()

    // Check for missing/extra keys
    const missingKeys = expectedKeys.filter(k => !actualKeys.includes(k))
    const extraKeys = actualKeys.filter(k => !expectedKeys.includes(k))

    if (missingKeys.length > 0) {
      diff.push(`${path}: missing keys: ${missingKeys.join(', ')}`)
    }
    if (extraKeys.length > 0) {
      diff.push(`${path}: extra keys: ${extraKeys.join(', ')}`)
    }

    // Check common keys
    for (const key of expectedKeys) {
      if (actualKeys.includes(key)) {
        const result = this.deepEqual(expected[key], actual[key], `${path}.${key}`)
        if (!result.isEqual) {
          diff.push(...result.diff)
        }
      }
    }

    return { isEqual: diff.length === 0, diff }
  }

  /**
   * Format diff for display
   */
  private formatDiff(diff: string[]): string {
    if (diff.length === 0) return 'No differences'
    if (diff.length === 1) return diff[0]
    return `${diff.length} differences: ${diff.slice(0, 3).join('; ')}${diff.length > 3 ? '...' : ''}`
  }
}

/**
 * Partial Match Scorer
 * 
 * Allows partial matching of structured outputs
 * Useful when only certain fields need to match exactly
 */
export class PartialMatchScorer implements Scorer {
  private threshold: number
  private requiredFields?: string[]

  constructor(config: ScorerConfig = { type: 'exact-match' }) {
    this.threshold = config.threshold ?? 0.8
    this.requiredFields = config.params?.requiredFields
  }

  async score(
    testCaseId: string,
    expected: any,
    actual: any,
    metadata?: {
      latencyMs: number
      tokens?: { input: number; output: number; total: number }
      cost?: number
    }
  ): Promise<Score> {
    if (actual === null || actual === undefined) {
      return {
        testCaseId,
        value: 0,
        passed: false,
        actual,
        expected,
        explanation: 'Actual output is null or undefined',
        latencyMs: metadata?.latencyMs ?? 0,
        tokens: metadata?.tokens,
        cost: metadata?.cost,
      }
    }

    // If required fields specified, only check those
    if (this.requiredFields && typeof expected === 'object' && typeof actual === 'object') {
      let matches = 0
      const checks: string[] = []

      for (const field of this.requiredFields) {
        const expectedValue = this.getNestedValue(expected, field)
        const actualValue = this.getNestedValue(actual, field)
        const match = JSON.stringify(expectedValue) === JSON.stringify(actualValue)
        
        if (match) matches++
        checks.push(`${field}: ${match ? '✓' : '✗'}`)
      }

      const score = matches / this.requiredFields.length
      const passed = score >= this.threshold

      return {
        testCaseId,
        value: score,
        passed,
        actual,
        expected,
        explanation: `Matched ${matches}/${this.requiredFields.length} required fields: ${checks.join(', ')}`,
        latencyMs: metadata?.latencyMs ?? 0,
        tokens: metadata?.tokens,
        cost: metadata?.cost,
      }
    }

    // Otherwise, count matching fields
    if (typeof expected === 'object' && typeof actual === 'object' && !Array.isArray(expected)) {
      const expectedKeys = Object.keys(expected)
      let matches = 0

      for (const key of expectedKeys) {
        if (JSON.stringify(expected[key]) === JSON.stringify(actual[key])) {
          matches++
        }
      }

      const score = expectedKeys.length > 0 ? matches / expectedKeys.length : 0
      const passed = score >= this.threshold

      return {
        testCaseId,
        value: score,
        passed,
        actual,
        expected,
        explanation: `Matched ${matches}/${expectedKeys.length} fields`,
        latencyMs: metadata?.latencyMs ?? 0,
        tokens: metadata?.tokens,
        cost: metadata?.cost,
      }
    }

    // Fall back to exact match for non-objects
    const exactMatch = JSON.stringify(expected) === JSON.stringify(actual)
    return {
      testCaseId,
      value: exactMatch ? 1.0 : 0.0,
      passed: exactMatch,
      actual,
      expected,
      explanation: exactMatch ? 'Exact match' : 'No match',
      latencyMs: metadata?.latencyMs ?? 0,
      tokens: metadata?.tokens,
      cost: metadata?.cost,
    }
  }

  /**
   * Get nested value from object using dot notation
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }
}

/**
 * Contains Scorer
 * 
 * Checks if actual output contains expected keywords/phrases
 * Useful for natural language responses where exact match is too strict
 */
export class ContainsScorer implements Scorer {
  private threshold: number
  private caseSensitive: boolean

  constructor(config: ScorerConfig = { type: 'exact-match' }) {
    this.threshold = config.threshold ?? 0.7
    this.caseSensitive = config.params?.caseSensitive ?? false
  }

  async score(
    testCaseId: string,
    expected: any,
    actual: any,
    metadata?: {
      latencyMs: number
      tokens?: { input: number; output: number; total: number }
      cost?: number
    }
  ): Promise<Score> {
    if (typeof actual !== 'string') {
      return {
        testCaseId,
        value: 0,
        passed: false,
        actual,
        expected,
        explanation: 'Actual output is not a string',
        latencyMs: metadata?.latencyMs ?? 0,
        tokens: metadata?.tokens,
        cost: metadata?.cost,
      }
    }

    // Expected can be a string or array of strings
    const keywords = Array.isArray(expected) ? expected : [expected]
    
    const actualText = this.caseSensitive ? actual : actual.toLowerCase()
    let matches = 0

    for (const keyword of keywords) {
      const keywordText = this.caseSensitive ? keyword : keyword.toLowerCase()
      if (actualText.includes(keywordText)) {
        matches++
      }
    }

    const score = keywords.length > 0 ? matches / keywords.length : 0
    const passed = score >= this.threshold

    return {
      testCaseId,
      value: score,
      passed,
      actual,
      expected,
      explanation: `Contains ${matches}/${keywords.length} keywords`,
      latencyMs: metadata?.latencyMs ?? 0,
      tokens: metadata?.tokens,
      cost: metadata?.cost,
    }
  }
}

/**
 * Regex Scorer
 * 
 * Checks if actual output matches expected regex pattern
 * Useful for format validation (emails, phone numbers, structured text)
 */
export class RegexScorer implements Scorer {
  private threshold: number

  constructor(config: ScorerConfig = { type: 'exact-match' }) {
    this.threshold = config.threshold ?? 1.0
  }

  async score(
    testCaseId: string,
    expected: any,
    actual: any,
    metadata?: {
      latencyMs: number
      tokens?: { input: number; output: number; total: number }
      cost?: number
    }
  ): Promise<Score> {
    if (typeof actual !== 'string') {
      return {
        testCaseId,
        value: 0,
        passed: false,
        actual,
        expected,
        explanation: 'Actual output is not a string',
        latencyMs: metadata?.latencyMs ?? 0,
        tokens: metadata?.tokens,
        cost: metadata?.cost,
      }
    }

    try {
      const pattern = typeof expected === 'string' ? expected : expected.pattern
      const flags = typeof expected === 'object' ? expected.flags : undefined
      const regex = new RegExp(pattern, flags)
      
      const matches = regex.test(actual)
      const score = matches ? 1.0 : 0.0
      const passed = score >= this.threshold

      return {
        testCaseId,
        value: score,
        passed,
        actual,
        expected,
        explanation: matches ? `Matches pattern: ${pattern}` : `Does not match pattern: ${pattern}`,
        latencyMs: metadata?.latencyMs ?? 0,
        tokens: metadata?.tokens,
        cost: metadata?.cost,
      }
    } catch (error) {
      return {
        testCaseId,
        value: 0,
        passed: false,
        actual,
        expected,
        explanation: `Invalid regex pattern: ${error}`,
        latencyMs: metadata?.latencyMs ?? 0,
        tokens: metadata?.tokens,
        cost: metadata?.cost,
      }
    }
  }
}

/**
 * Numeric Range Scorer
 * 
 * Checks if numeric actual value is within expected range
 * Useful for risk scores, percentages, and other numeric outputs
 */
export class NumericRangeScorer implements Scorer {
  private threshold: number

  constructor(config: ScorerConfig = { type: 'exact-match' }) {
    this.threshold = config.threshold ?? 1.0
  }

  async score(
    testCaseId: string,
    expected: any,
    actual: any,
    metadata?: {
      latencyMs: number
      tokens?: { input: number; output: number; total: number }
      cost?: number
    }
  ): Promise<Score> {
    const actualNum = typeof actual === 'number' ? actual : parseFloat(actual)
    
    if (isNaN(actualNum)) {
      return {
        testCaseId,
        value: 0,
        passed: false,
        actual,
        expected,
        explanation: 'Actual output is not a valid number',
        latencyMs: metadata?.latencyMs ?? 0,
        tokens: metadata?.tokens,
        cost: metadata?.cost,
      }
    }

    // Expected can be a number (exact), object with min/max, or object with value and tolerance
    let min: number, max: number, target: number | undefined

    if (typeof expected === 'number') {
      // Exact match
      target = expected
      min = expected
      max = expected
    } else if (typeof expected === 'object') {
      if ('min' in expected && 'max' in expected) {
        min = expected.min
        max = expected.max
      } else if ('value' in expected && 'tolerance' in expected) {
        target = expected.value
        min = expected.value - expected.tolerance
        max = expected.value + expected.tolerance
      } else {
        return {
          testCaseId,
          value: 0,
          passed: false,
          actual,
          expected,
          explanation: 'Invalid expected format for numeric range',
          latencyMs: metadata?.latencyMs ?? 0,
          tokens: metadata?.tokens,
          cost: metadata?.cost,
        }
      }
    } else {
      return {
        testCaseId,
        value: 0,
        passed: false,
        actual,
        expected,
        explanation: 'Expected value must be a number or range object',
        latencyMs: metadata?.latencyMs ?? 0,
        tokens: metadata?.tokens,
        cost: metadata?.cost,
      }
    }

    const inRange = actualNum >= min && actualNum <= max
    
    // Calculate score based on distance from target or range
    let score: number
    if (inRange) {
      if (target !== undefined) {
        // Score based on distance from target
        const distance = Math.abs(actualNum - target)
        const range = max - min
        score = range > 0 ? 1 - (distance / range) : 1
      } else {
        score = 1.0
      }
    } else {
      // Out of range
      score = 0.0
    }

    const passed = score >= this.threshold

    return {
      testCaseId,
      value: score,
      passed,
      actual,
      expected,
      explanation: inRange
        ? `In range [${min}, ${max}]${target !== undefined ? `, target: ${target}` : ''}`
        : `Out of range [${min}, ${max}], got ${actualNum}`,
      latencyMs: metadata?.latencyMs ?? 0,
      tokens: metadata?.tokens,
      cost: metadata?.cost,
    }
  }
}

/**
 * Semantic Similarity Scorer
 * 
 * Uses embedding-based comparison to measure semantic similarity
 * Perfect for natural language responses where exact match is too strict
 */
export class SemanticSimilarityScorer implements Scorer {
  private threshold: number
  private model: string

  constructor(config: ScorerConfig = { type: 'semantic-similarity' }) {
    this.threshold = config.threshold ?? 0.85
    this.model = config.params?.model ?? 'text-embedding-3-large'
  }

  async score(
    testCaseId: string,
    expected: any,
    actual: any,
    metadata?: {
      latencyMs: number
      tokens?: { input: number; output: number; total: number }
      cost?: number
    }
  ): Promise<Score> {
    // Convert to strings if needed
    const expectedText = typeof expected === 'string' ? expected : JSON.stringify(expected)
    const actualText = typeof actual === 'string' ? actual : JSON.stringify(actual)

    if (!actualText || actualText.trim().length === 0) {
      return {
        testCaseId,
        value: 0,
        passed: false,
        actual,
        expected,
        explanation: 'Actual output is empty',
        latencyMs: metadata?.latencyMs ?? 0,
        tokens: metadata?.tokens,
        cost: metadata?.cost,
      }
    }

    try {
      // Generate embeddings for both texts
      const [expectedEmbedding, actualEmbedding] = await Promise.all([
        this.generateEmbedding(expectedText),
        this.generateEmbedding(actualText),
      ])

      // Calculate cosine similarity
      const similarity = this.cosineSimilarity(expectedEmbedding, actualEmbedding)
      const passed = similarity >= this.threshold

      return {
        testCaseId,
        value: similarity,
        passed,
        actual,
        expected,
        explanation: `Semantic similarity: ${(similarity * 100).toFixed(1)}% (threshold: ${(this.threshold * 100).toFixed(0)}%)`,
        latencyMs: metadata?.latencyMs ?? 0,
        tokens: metadata?.tokens,
        cost: metadata?.cost,
      }
    } catch (error) {
      return {
        testCaseId,
        value: 0,
        passed: false,
        actual,
        expected,
        explanation: `Embedding generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        latencyMs: metadata?.latencyMs ?? 0,
        tokens: metadata?.tokens,
        cost: metadata?.cost,
        error: {
          code: 'EMBEDDING_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      }
    }
  }

  /**
   * Generate embedding for text using OpenAI
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    const { embed } = await import('ai')
    const { openai } = await import('@ai-sdk/openai')

    const { embedding } = await embed({
      model: openai.embedding(this.model),
      value: text,
    })

    return embedding
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same length')
    }

    let dotProduct = 0
    let normA = 0
    let normB = 0

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i]
      normA += a[i] * a[i]
      normB += b[i] * b[i]
    }

    normA = Math.sqrt(normA)
    normB = Math.sqrt(normB)

    if (normA === 0 || normB === 0) {
      return 0
    }

    return dotProduct / (normA * normB)
  }
}

/**
 * Convenience function to score a result
 */
export async function scoreResult(
  testCaseId: string,
  expected: any,
  actual: any,
  config: ScorerConfig,
  metadata?: {
    latencyMs: number
    tokens?: { input: number; output: number; total: number }
    cost?: number
  }
): Promise<Score> {
  const scorer = createScorer(config)
  return scorer.score(testCaseId, expected, actual, metadata)
}

/**
 * LLM-as-Judge Scorer
 * 
 * Uses an LLM to evaluate response quality based on customizable rubrics
 * Perfect for subjective quality assessment (accuracy, helpfulness, tone)
 */
export class LLMJudgeScorer implements Scorer {
  private threshold: number
  private rubric: string
  private model: string
  private dimensions: string[]

  constructor(config: ScorerConfig = { type: 'llm-judge' }) {
    this.threshold = config.threshold ?? 0.8
    this.rubric = config.params?.rubric ?? 'accuracy, helpfulness, tone'
    this.model = config.params?.model ?? 'gpt-4o'
    this.dimensions = this.rubric.split(',').map(d => d.trim())
  }

  async score(
    testCaseId: string,
    expected: any,
    actual: any,
    metadata?: {
      latencyMs: number
      tokens?: { input: number; output: number; total: number }
      cost?: number
    }
  ): Promise<Score> {
    const expectedText = typeof expected === 'string' ? expected : JSON.stringify(expected)
    const actualText = typeof actual === 'string' ? actual : JSON.stringify(actual)

    if (!actualText || actualText.trim().length === 0) {
      return {
        testCaseId,
        value: 0,
        passed: false,
        actual,
        expected,
        explanation: 'Actual output is empty',
        latencyMs: metadata?.latencyMs ?? 0,
        tokens: metadata?.tokens,
        cost: metadata?.cost,
      }
    }

    try {
      // Create evaluation prompt
      const prompt = this.createEvaluationPrompt(expectedText, actualText)

      // Get LLM judgment
      const result = await generateText({
        model: openai(this.model),
        prompt,
        temperature: 0,
        maxTokens: 500,
      })

      // Parse judgment
      const judgment = this.parseJudgment(result.text)

      // Calculate overall score
      const overallScore = judgment.scores.reduce((sum, s) => sum + s.score, 0) / judgment.scores.length
      const passed = overallScore >= this.threshold

      return {
        testCaseId,
        value: overallScore,
        passed,
        actual,
        expected,
        explanation: this.formatExplanation(judgment),
        latencyMs: metadata?.latencyMs ?? 0,
        tokens: metadata?.tokens,
        cost: metadata?.cost,
      }
    } catch (error) {
      return {
        testCaseId,
        value: 0,
        passed: false,
        actual,
        expected,
        explanation: `LLM judgment failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        latencyMs: metadata?.latencyMs ?? 0,
        tokens: metadata?.tokens,
        cost: metadata?.cost,
        error: {
          code: 'LLM_JUDGE_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      }
    }
  }

  /**
   * Create evaluation prompt for LLM judge
   */
  private createEvaluationPrompt(expected: string, actual: string): string {
    return `You are an expert evaluator assessing AI-generated responses. Evaluate the actual response against the expected response based on the following criteria: ${this.rubric}.

Expected Response:
${expected}

Actual Response:
${actual}

For each criterion (${this.dimensions.join(', ')}), provide:
1. A score from 0.0 to 1.0
2. A brief explanation

Respond with valid JSON only in this format:
{
  "scores": [
    {"dimension": "accuracy", "score": 0.9, "explanation": "Response is factually correct"},
    {"dimension": "helpfulness", "score": 0.85, "explanation": "Provides useful information"},
    {"dimension": "tone", "score": 0.95, "explanation": "Professional and empathetic"}
  ],
  "overallAssessment": "Brief overall assessment"
}`
  }

  /**
   * Parse LLM judgment response
   */
  private parseJudgment(text: string): {
    scores: Array<{ dimension: string; score: number; explanation: string }>
    overallAssessment: string
  } {
    try {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1])
      }

      // Try to find JSON in text
      const jsonStart = text.indexOf('{')
      const jsonEnd = text.lastIndexOf('}')
      if (jsonStart !== -1 && jsonEnd !== -1) {
        return JSON.parse(text.substring(jsonStart, jsonEnd + 1))
      }

      // Try parsing the whole text
      return JSON.parse(text)
    } catch (error) {
      // Fallback: create default judgment
      return {
        scores: this.dimensions.map(dim => ({
          dimension: dim,
          score: 0.5,
          explanation: 'Failed to parse judgment',
        })),
        overallAssessment: 'Judgment parsing failed',
      }
    }
  }

  /**
   * Format explanation from judgment
   */
  private formatExplanation(judgment: {
    scores: Array<{ dimension: string; score: number; explanation: string }>
    overallAssessment: string
  }): string {
    const scoreBreakdown = judgment.scores
      .map(s => `${s.dimension}: ${(s.score * 100).toFixed(0)}%`)
      .join(', ')
    
    return `${scoreBreakdown} | ${judgment.overallAssessment}`
  }
}

/**
 * Precision/Recall/F1 Scorer
 * 
 * Calculates precision, recall, and F1 score for classification and prediction tasks
 * Perfect for risk prediction, multi-label classification, and binary classification
 */
export class PrecisionRecallF1Scorer implements Scorer {
  private threshold: number
  private metric: 'precision' | 'recall' | 'f1'
  private positiveLabel: any

  constructor(config: ScorerConfig = { type: 'precision-recall-f1' }) {
    this.threshold = config.threshold ?? 0.7
    this.metric = config.params?.metric ?? 'f1'
    this.positiveLabel = config.params?.positiveLabel ?? true
  }

  async score(
    testCaseId: string,
    expected: any,
    actual: any,
    metadata?: {
      latencyMs: number
      tokens?: { input: number; output: number; total: number }
      cost?: number
    }
  ): Promise<Score> {
    try {
      // Handle different input formats
      const { truePositives, falsePositives, falseNegatives, trueNegatives } = 
        this.calculateConfusionMatrix(expected, actual)

      // Calculate metrics
      const precision = truePositives + falsePositives > 0
        ? truePositives / (truePositives + falsePositives)
        : 0

      const recall = truePositives + falseNegatives > 0
        ? truePositives / (truePositives + falseNegatives)
        : 0

      const f1 = precision + recall > 0
        ? (2 * precision * recall) / (precision + recall)
        : 0

      // Select the metric to use for scoring
      let value: number
      let metricName: string
      switch (this.metric) {
        case 'precision':
          value = precision
          metricName = 'Precision'
          break
        case 'recall':
          value = recall
          metricName = 'Recall'
          break
        case 'f1':
        default:
          value = f1
          metricName = 'F1'
          break
      }

      const passed = value >= this.threshold

      return {
        testCaseId,
        value,
        passed,
        actual,
        expected,
        explanation: `${metricName}: ${(value * 100).toFixed(1)}% (Precision: ${(precision * 100).toFixed(1)}%, Recall: ${(recall * 100).toFixed(1)}%, F1: ${(f1 * 100).toFixed(1)}%) | TP: ${truePositives}, FP: ${falsePositives}, FN: ${falseNegatives}, TN: ${trueNegatives}`,
        latencyMs: metadata?.latencyMs ?? 0,
        tokens: metadata?.tokens,
        cost: metadata?.cost,
      }
    } catch (error) {
      return {
        testCaseId,
        value: 0,
        passed: false,
        actual,
        expected,
        explanation: `Precision/Recall/F1 calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        latencyMs: metadata?.latencyMs ?? 0,
        tokens: metadata?.tokens,
        cost: metadata?.cost,
        error: {
          code: 'PRECISION_RECALL_F1_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      }
    }
  }

  /**
   * Calculate confusion matrix from expected and actual values
   */
  private calculateConfusionMatrix(expected: any, actual: any): {
    truePositives: number
    falsePositives: number
    falseNegatives: number
    trueNegatives: number
  } {
    // Handle single prediction (binary classification)
    if (!Array.isArray(expected) && !Array.isArray(actual)) {
      const expectedPositive = this.isPositive(expected)
      const actualPositive = this.isPositive(actual)

      return {
        truePositives: expectedPositive && actualPositive ? 1 : 0,
        falsePositives: !expectedPositive && actualPositive ? 1 : 0,
        falseNegatives: expectedPositive && !actualPositive ? 1 : 0,
        trueNegatives: !expectedPositive && !actualPositive ? 1 : 0,
      }
    }

    // Handle arrays (multi-label or multiple predictions)
    const expectedArray = Array.isArray(expected) ? expected : [expected]
    const actualArray = Array.isArray(actual) ? actual : [actual]

    // Create sets for efficient lookup
    const expectedSet = new Set(expectedArray.map(v => JSON.stringify(v)))
    const actualSet = new Set(actualArray.map(v => JSON.stringify(v)))

    // Calculate metrics
    let truePositives = 0
    let falsePositives = 0
    let falseNegatives = 0

    // Count true positives and false positives
    for (const item of actualArray) {
      const itemStr = JSON.stringify(item)
      if (expectedSet.has(itemStr)) {
        truePositives++
      } else {
        falsePositives++
      }
    }

    // Count false negatives
    for (const item of expectedArray) {
      const itemStr = JSON.stringify(item)
      if (!actualSet.has(itemStr)) {
        falseNegatives++
      }
    }

    // True negatives are harder to calculate for multi-label
    // For simplicity, we'll set it to 0 for multi-label cases
    const trueNegatives = 0

    return { truePositives, falsePositives, falseNegatives, trueNegatives }
  }

  /**
   * Check if a value is considered positive
   */
  private isPositive(value: any): boolean {
    if (typeof this.positiveLabel === 'boolean') {
      return value === this.positiveLabel
    }
    return value === this.positiveLabel
  }
}

/**
 * Recall@K Scorer
 * 
 * Calculates recall at K for retrieval and ranking tasks
 * Perfect for RAG retrieval quality, search relevance, and recommendation systems
 */
export class RecallAtKScorer implements Scorer {
  private k: number
  private threshold: number

  constructor(config: ScorerConfig = { type: 'recall-at-k' }) {
    this.k = config.params?.k ?? 5
    this.threshold = config.threshold ?? 0.8
  }

  async score(
    testCaseId: string,
    expected: any,
    actual: any,
    metadata?: {
      latencyMs: number
      tokens?: { input: number; output: number; total: number }
      cost?: number
    }
  ): Promise<Score> {
    try {
      // Expected should be an array of relevant items
      const expectedArray = Array.isArray(expected) ? expected : [expected]
      
      // Actual should be an array of retrieved items (ranked by relevance)
      const actualArray = Array.isArray(actual) ? actual : [actual]

      if (expectedArray.length === 0) {
        return {
          testCaseId,
          value: 0,
          passed: false,
          actual,
          expected,
          explanation: 'No expected relevant items provided',
          latencyMs: metadata?.latencyMs ?? 0,
          tokens: metadata?.tokens,
          cost: metadata?.cost,
        }
      }

      // Take top K items from actual results
      const topK = actualArray.slice(0, this.k)

      // Create set of expected items for efficient lookup
      const expectedSet = new Set(expectedArray.map(v => this.normalizeItem(v)))

      // Count how many relevant items are in top K
      let relevantInTopK = 0
      for (const item of topK) {
        const normalized = this.normalizeItem(item)
        if (expectedSet.has(normalized)) {
          relevantInTopK++
        }
      }

      // Calculate recall@K
      const recallAtK = relevantInTopK / expectedArray.length
      const passed = recallAtK >= this.threshold

      return {
        testCaseId,
        value: recallAtK,
        passed,
        actual,
        expected,
        explanation: `Recall@${this.k}: ${(recallAtK * 100).toFixed(1)}% (${relevantInTopK}/${expectedArray.length} relevant items found in top ${this.k})`,
        latencyMs: metadata?.latencyMs ?? 0,
        tokens: metadata?.tokens,
        cost: metadata?.cost,
      }
    } catch (error) {
      return {
        testCaseId,
        value: 0,
        passed: false,
        actual,
        expected,
        explanation: `Recall@K calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        latencyMs: metadata?.latencyMs ?? 0,
        tokens: metadata?.tokens,
        cost: metadata?.cost,
        error: {
          code: 'RECALL_AT_K_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      }
    }
  }

  /**
   * Normalize item for comparison
   * Handles objects, strings, and numbers
   */
  private normalizeItem(item: any): string {
    if (typeof item === 'object' && item !== null) {
      // For objects, use ID if available, otherwise stringify
      if ('id' in item) {
        return String(item.id)
      }
      if ('documentId' in item) {
        return String(item.documentId)
      }
      return JSON.stringify(item)
    }
    return String(item)
  }
}

/**
 * Mean Reciprocal Rank (MRR) Scorer
 * 
 * Calculates MRR for ranking and retrieval tasks
 * Perfect for RAG retrieval, search quality, and question answering
 */
export class MRRScorer implements Scorer {
  private threshold: number

  constructor(config: ScorerConfig = { type: 'mrr' }) {
    this.threshold = config.threshold ?? 0.5
  }

  async score(
    testCaseId: string,
    expected: any,
    actual: any,
    metadata?: {
      latencyMs: number
      tokens?: { input: number; output: number; total: number }
      cost?: number
    }
  ): Promise<Score> {
    try {
      // Expected should be an array of relevant items (or single item)
      const expectedArray = Array.isArray(expected) ? expected : [expected]
      
      // Actual should be an array of retrieved items (ranked by relevance)
      const actualArray = Array.isArray(actual) ? actual : [actual]

      if (expectedArray.length === 0) {
        return {
          testCaseId,
          value: 0,
          passed: false,
          actual,
          expected,
          explanation: 'No expected relevant items provided',
          latencyMs: metadata?.latencyMs ?? 0,
          tokens: metadata?.tokens,
          cost: metadata?.cost,
        }
      }

      // Create set of expected items for efficient lookup
      const expectedSet = new Set(expectedArray.map(v => this.normalizeItem(v)))

      // Find the rank of the first relevant item
      let firstRelevantRank = -1
      for (let i = 0; i < actualArray.length; i++) {
        const normalized = this.normalizeItem(actualArray[i])
        if (expectedSet.has(normalized)) {
          firstRelevantRank = i + 1 // Ranks are 1-indexed
          break
        }
      }

      // Calculate MRR
      const mrr = firstRelevantRank > 0 ? 1 / firstRelevantRank : 0
      const passed = mrr >= this.threshold

      const explanation = firstRelevantRank > 0
        ? `MRR: ${mrr.toFixed(3)} (first relevant item at rank ${firstRelevantRank})`
        : `MRR: 0.000 (no relevant items found in results)`

      return {
        testCaseId,
        value: mrr,
        passed,
        actual,
        expected,
        explanation,
        latencyMs: metadata?.latencyMs ?? 0,
        tokens: metadata?.tokens,
        cost: metadata?.cost,
      }
    } catch (error) {
      return {
        testCaseId,
        value: 0,
        passed: false,
        actual,
        expected,
        explanation: `MRR calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        latencyMs: metadata?.latencyMs ?? 0,
        tokens: metadata?.tokens,
        cost: metadata?.cost,
        error: {
          code: 'MRR_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      }
    }
  }

  /**
   * Normalize item for comparison
   */
  private normalizeItem(item: any): string {
    if (typeof item === 'object' && item !== null) {
      if ('id' in item) {
        return String(item.id)
      }
      if ('documentId' in item) {
        return String(item.documentId)
      }
      return JSON.stringify(item)
    }
    return String(item)
  }
}

/**
 * NDCG (Normalized Discounted Cumulative Gain) Scorer
 * 
 * Calculates NDCG@K for ranking quality evaluation
 * Perfect for RAG retrieval, search ranking, and recommendation systems
 */
export class NDCGScorer implements Scorer {
  private k: number
  private threshold: number

  constructor(config: ScorerConfig = { type: 'ndcg' }) {
    this.k = config.params?.k ?? 10
    this.threshold = config.threshold ?? 0.7
  }

  async score(
    testCaseId: string,
    expected: any,
    actual: any,
    metadata?: {
      latencyMs: number
      tokens?: { input: number; output: number; total: number }
      cost?: number
    }
  ): Promise<Score> {
    try {
      // Expected should be an array of {item, relevance} or just items (relevance=1)
      const expectedArray = Array.isArray(expected) ? expected : [expected]
      
      // Actual should be an array of retrieved items (ranked by relevance)
      const actualArray = Array.isArray(actual) ? actual : [actual]

      if (expectedArray.length === 0) {
        return {
          testCaseId,
          value: 0,
          passed: false,
          actual,
          expected,
          explanation: 'No expected relevant items provided',
          latencyMs: metadata?.latencyMs ?? 0,
          tokens: metadata?.tokens,
          cost: metadata?.cost,
        }
      }

      // Build relevance map
      const relevanceMap = new Map<string, number>()
      for (const item of expectedArray) {
        if (typeof item === 'object' && 'relevance' in item) {
          const key = this.normalizeItem(item.item ?? item)
          relevanceMap.set(key, item.relevance)
        } else {
          const key = this.normalizeItem(item)
          relevanceMap.set(key, 1) // Default relevance
        }
      }

      // Calculate DCG@K
      const topK = actualArray.slice(0, this.k)
      let dcg = 0
      for (let i = 0; i < topK.length; i++) {
        const key = this.normalizeItem(topK[i])
        const relevance = relevanceMap.get(key) ?? 0
        const rank = i + 1
        dcg += relevance / Math.log2(rank + 1)
      }

      // Calculate IDCG@K (ideal DCG)
      const sortedRelevances = Array.from(relevanceMap.values())
        .sort((a, b) => b - a)
        .slice(0, this.k)
      
      let idcg = 0
      for (let i = 0; i < sortedRelevances.length; i++) {
        const rank = i + 1
        idcg += sortedRelevances[i] / Math.log2(rank + 1)
      }

      // Calculate NDCG@K
      const ndcg = idcg > 0 ? dcg / idcg : 0
      const passed = ndcg >= this.threshold

      return {
        testCaseId,
        value: ndcg,
        passed,
        actual,
        expected,
        explanation: `NDCG@${this.k}: ${(ndcg * 100).toFixed(1)}% (DCG: ${dcg.toFixed(3)}, IDCG: ${idcg.toFixed(3)})`,
        latencyMs: metadata?.latencyMs ?? 0,
        tokens: metadata?.tokens,
        cost: metadata?.cost,
      }
    } catch (error) {
      return {
        testCaseId,
        value: 0,
        passed: false,
        actual,
        expected,
        explanation: `NDCG calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        latencyMs: metadata?.latencyMs ?? 0,
        tokens: metadata?.tokens,
        cost: metadata?.cost,
        error: {
          code: 'NDCG_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      }
    }
  }

  /**
   * Normalize item for comparison
   */
  private normalizeItem(item: any): string {
    if (typeof item === 'object' && item !== null) {
      if ('id' in item) {
        return String(item.id)
      }
      if ('documentId' in item) {
        return String(item.documentId)
      }
      // Exclude relevance field from comparison
      const { relevance, ...rest } = item
      return JSON.stringify(rest)
    }
    return String(item)
  }
}

/**
 * Create scorer instance based on type
 */
export function createScorer(config: ScorerConfig): Scorer {
  switch (config.type) {
    case 'exact-match':
      return new ExactMatchScorer(config)
    case 'partial-match':
      return new PartialMatchScorer(config)
    case 'contains':
      return new ContainsScorer(config)
    case 'regex':
      return new RegexScorer(config)
    case 'numeric-range':
      return new NumericRangeScorer(config)
    case 'semantic-similarity':
      return new SemanticSimilarityScorer(config)
    case 'llm-judge':
      return new LLMJudgeScorer(config)
    case 'precision-recall-f1':
      return new PrecisionRecallF1Scorer(config)
    case 'recall-at-k':
      return new RecallAtKScorer(config)
    case 'mrr':
      return new MRRScorer(config)
    case 'ndcg':
      return new NDCGScorer(config)
    default:
      throw new Error(`Unknown scorer type: ${config.type}`)
  }
}
