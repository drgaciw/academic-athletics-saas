/**
 * Base Runner
 * 
 * Core execution engine for running test cases against AI models
 * Handles timeouts, retries, token tracking, and cost calculation
 */

import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { anthropic } from '@ai-sdk/anthropic'
import type {
  TestCase,
  ModelConfig,
  Score,
  RunResult,
  ScorerConfig,
} from './types'

/**
 * Runner configuration
 */
export interface RunnerConfig {
  /** Timeout per test case in milliseconds */
  timeout?: number
  
  /** Maximum retry attempts on failure */
  maxRetries?: number
  
  /** Delay between retries in milliseconds */
  retryDelay?: number
  
  /** Enable verbose logging */
  verbose?: boolean
}

/**
 * Execution context for a test case
 */
export interface ExecutionContext {
  /** Test case being executed */
  testCase: TestCase
  
  /** Model configuration */
  modelConfig: ModelConfig
  
  /** Start time */
  startTime: number
  
  /** Attempt number (for retries) */
  attempt: number
}

/**
 * Execution result
 */
export interface ExecutionResult {
  /** Actual output from model */
  output: any
  
  /** Latency in milliseconds */
  latencyMs: number
  
  /** Token usage */
  tokens: {
    input: number
    output: number
    total: number
  }
  
  /** Cost in USD */
  cost: number
  
  /** Model used */
  model: string
  
  /** Success status */
  success: boolean
  
  /** Error if failed */
  error?: {
    code: string
    message: string
  }
}

/**
 * Base Runner Class
 * 
 * Abstract base class for all runners
 */
export abstract class BaseRunner {
  protected config: Required<RunnerConfig>

  constructor(config: RunnerConfig = {}) {
    this.config = {
      timeout: config.timeout ?? 30000, // 30 seconds default
      maxRetries: config.maxRetries ?? 2,
      retryDelay: config.retryDelay ?? 1000,
      verbose: config.verbose ?? false,
    }
  }

  /**
   * Run a single test case
   */
  async runTestCase(
    testCase: TestCase,
    modelConfig: ModelConfig,
    scorerConfig: ScorerConfig
  ): Promise<RunResult> {
    const startTime = Date.now()

    try {
      // Execute with retries
      const executionResult = await this.executeWithRetry(testCase, modelConfig)

      // Score the result
      const score = await this.scoreResult(
        testCase,
        executionResult,
        scorerConfig
      )

      return {
        testCase,
        score,
        modelConfig,
        scorerConfig,
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      // Create failed result
      const latencyMs = Date.now() - startTime
      
      return {
        testCase,
        score: {
          testCaseId: testCase.id,
          value: 0,
          passed: false,
          actual: null,
          expected: testCase.expected,
          latencyMs,
          error: {
            code: 'EXECUTION_FAILED',
            message: error instanceof Error ? error.message : 'Unknown error',
          },
        },
        modelConfig,
        scorerConfig,
        timestamp: new Date().toISOString(),
      }
    }
  }

  /**
   * Execute test case with retry logic
   */
  protected async executeWithRetry(
    testCase: TestCase,
    modelConfig: ModelConfig
  ): Promise<ExecutionResult> {
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        const context: ExecutionContext = {
          testCase,
          modelConfig,
          startTime: Date.now(),
          attempt,
        }

        // Execute with timeout
        const result = await this.executeWithTimeout(context)
        
        if (this.config.verbose) {
          console.log(`✓ Test case ${testCase.id} passed on attempt ${attempt}`)
        }
        
        return result
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error')
        
        if (this.config.verbose) {
          console.log(`✗ Test case ${testCase.id} failed on attempt ${attempt}: ${lastError.message}`)
        }

        // Don't retry on timeout errors
        if (lastError.message.includes('timeout')) {
          break
        }

        // Wait before retry (except on last attempt)
        if (attempt < this.config.maxRetries) {
          await this.sleep(this.config.retryDelay)
        }
      }
    }

    throw lastError || new Error('Execution failed')
  }

  /**
   * Execute test case with timeout
   */
  protected async executeWithTimeout(
    context: ExecutionContext
  ): Promise<ExecutionResult> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Execution timeout after ${this.config.timeout}ms`))
      }, this.config.timeout)
    })

    const executionPromise = this.execute(context)

    return Promise.race([executionPromise, timeoutPromise])
  }

  /**
   * Execute test case (to be implemented by subclasses)
   */
  protected abstract execute(context: ExecutionContext): Promise<ExecutionResult>

  /**
   * Score the execution result (to be implemented by subclasses)
   */
  protected abstract scoreResult(
    testCase: TestCase,
    executionResult: ExecutionResult,
    scorerConfig: ScorerConfig
  ): Promise<Score>

  /**
   * Generate text using AI SDK
   */
  protected async generateText(
    prompt: string,
    modelConfig: ModelConfig
  ): Promise<{
    text: string
    tokens: { input: number; output: number; total: number }
    cost: number
  }> {
    const startTime = Date.now()

    // Get model provider
    const model = this.getModel(modelConfig)

    // Generate text
    const result = await generateText({
      model,
      prompt,
      temperature: modelConfig.temperature ?? 0,
      maxTokens: modelConfig.maxTokens ?? 1000,
      topP: modelConfig.topP,
      ...modelConfig.params,
    })

    // Calculate cost
    const cost = this.calculateCost(
      modelConfig,
      result.usage.promptTokens,
      result.usage.completionTokens
    )

    return {
      text: result.text,
      tokens: {
        input: result.usage.promptTokens,
        output: result.usage.completionTokens,
        total: result.usage.totalTokens,
      },
      cost,
    }
  }

  /**
   * Get model instance from config
   */
  protected getModel(modelConfig: ModelConfig): any {
    if (modelConfig.provider === 'openai') {
      return openai(modelConfig.model)
    } else if (modelConfig.provider === 'anthropic') {
      return anthropic(modelConfig.model)
    } else {
      throw new Error(`Unsupported provider: ${modelConfig.provider}`)
    }
  }

  /**
   * Calculate cost based on token usage
   */
  protected calculateCost(
    modelConfig: ModelConfig,
    inputTokens: number,
    outputTokens: number
  ): number {
    // Pricing per 1M tokens (as of Nov 2024)
    const pricing: Record<string, { input: number; output: number }> = {
      // OpenAI
      'gpt-4': { input: 30, output: 60 },
      'gpt-4-turbo': { input: 10, output: 30 },
      'gpt-4o': { input: 5, output: 15 },
      'gpt-4o-mini': { input: 0.15, output: 0.6 },
      'gpt-3.5-turbo': { input: 0.5, output: 1.5 },
      
      // Anthropic
      'claude-3-5-sonnet-20241022': { input: 3, output: 15 },
      'claude-3-5-haiku-20241022': { input: 1, output: 5 },
      'claude-3-opus-20240229': { input: 15, output: 75 },
      'claude-3-sonnet-20240229': { input: 3, output: 15 },
      'claude-3-haiku-20240307': { input: 0.25, output: 1.25 },
    }

    const modelPricing = pricing[modelConfig.model]
    if (!modelPricing) {
      // Default pricing if model not found
      return (inputTokens * 1 + outputTokens * 3) / 1_000_000
    }

    const inputCost = (inputTokens * modelPricing.input) / 1_000_000
    const outputCost = (outputTokens * modelPricing.output) / 1_000_000

    return inputCost + outputCost
  }

  /**
   * Sleep for specified milliseconds
   */
  protected sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Parse JSON output safely
   */
  protected parseJSON(text: string): any {
    try {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1])
      }

      // Try to extract JSON from text
      const jsonStart = text.indexOf('{')
      const jsonEnd = text.lastIndexOf('}')
      if (jsonStart !== -1 && jsonEnd !== -1) {
        return JSON.parse(text.substring(jsonStart, jsonEnd + 1))
      }

      // Try parsing the whole text
      return JSON.parse(text)
    } catch (error) {
      throw new Error(`Failed to parse JSON: ${error}`)
    }
  }

  /**
   * Format prompt with test case context
   */
  protected formatPrompt(testCase: TestCase, systemPrompt?: string): string {
    let prompt = ''

    if (systemPrompt) {
      prompt += `${systemPrompt}\n\n`
    }

    if (testCase.context) {
      prompt += `Context:\n${JSON.stringify(testCase.context, null, 2)}\n\n`
    }

    prompt += `Input: ${testCase.input}`

    return prompt
  }

  /**
   * Get runner statistics
   */
  getConfig(): Required<RunnerConfig> {
    return { ...this.config }
  }
}

/**
 * Simple runner for basic text generation
 */
export class SimpleRunner extends BaseRunner {
  protected async execute(context: ExecutionContext): Promise<ExecutionResult> {
    const { testCase, modelConfig, startTime } = context

    try {
      // Generate text
      const result = await this.generateText(testCase.input, modelConfig)

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
          code: 'GENERATION_FAILED',
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
    // Simple exact match scoring
    const passed = executionResult.output === testCase.expected

    return {
      testCaseId: testCase.id,
      value: passed ? 1 : 0,
      passed,
      actual: executionResult.output,
      expected: testCase.expected,
      latencyMs: executionResult.latencyMs,
      tokens: executionResult.tokens,
      cost: executionResult.cost,
      error: executionResult.error,
    }
  }
}

/**
 * JSON runner for structured output
 */
export class JSONRunner extends BaseRunner {
  protected async execute(context: ExecutionContext): Promise<ExecutionResult> {
    const { testCase, modelConfig, startTime } = context

    try {
      // Create prompt that requests JSON output
      const prompt = `${testCase.input}\n\nRespond with valid JSON only.`

      // Generate text
      const result = await this.generateText(prompt, modelConfig)

      // Parse JSON
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
          code: 'JSON_PARSE_FAILED',
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
    // Deep equality check for JSON
    const passed = JSON.stringify(executionResult.output) === JSON.stringify(testCase.expected)

    return {
      testCaseId: testCase.id,
      value: passed ? 1 : 0,
      passed,
      actual: executionResult.output,
      expected: testCase.expected,
      latencyMs: executionResult.latencyMs,
      tokens: executionResult.tokens,
      cost: executionResult.cost,
      error: executionResult.error,
    }
  }
}

/**
 * Create runner instance based on type
 */
export function createRunner(
  type: 'simple' | 'json' = 'simple',
  config?: RunnerConfig
): BaseRunner {
  switch (type) {
    case 'simple':
      return new SimpleRunner(config)
    case 'json':
      return new JSONRunner(config)
    default:
      throw new Error(`Unknown runner type: ${type}`)
  }
}
