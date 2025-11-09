/**
 * AI Evaluation Framework - LLM Judge Scorer
 *
 * Task 4.3: Implements LLM-as-judge evaluation with customizable rubrics
 * - Prompt templates for quality assessment (accuracy, helpfulness, tone)
 * - Multi-dimensional scoring with breakdown
 * - Support for OpenAI and Anthropic models
 * - Structured output for consistent scoring
 */

import type {
  Scorer,
  ScorerResult,
  ScoringContext,
  LLMJudgeScorerConfig,
  EvaluationRubric,
  RubricCriterion,
} from './types';

/**
 * LLM evaluation response structure
 */
interface LLMEvaluationResponse {
  overall_score: number;
  passed: boolean;
  criteria_scores: Record<string, number>;
  reasoning: string;
  suggestions?: string[];
}

/**
 * LLMJudgeScorer - Uses LLM to evaluate output quality
 *
 * Use cases:
 * - Evaluating subjective qualities (helpfulness, tone, clarity)
 * - Assessing nuanced correctness beyond exact match
 * - Multi-dimensional quality assessment
 * - Complex reasoning evaluation
 */
export class LLMJudgeScorer implements Scorer {
  public readonly name = 'LLMJudge';
  private config: Required<LLMJudgeScorerConfig>;
  private defaultRubric: EvaluationRubric;

  constructor(config: LLMJudgeScorerConfig) {
    if (!config.apiKey) {
      throw new Error('API key is required for LLMJudgeScorer');
    }

    this.config = {
      apiKey: config.apiKey,
      provider: config.provider ?? 'openai',
      model: config.model ?? this.getDefaultModel(config.provider ?? 'openai'),
      rubric: config.rubric ?? this.createDefaultRubric(),
      temperature: config.temperature ?? 0.0,
      useStructuredOutput: config.useStructuredOutput ?? true,
    };

    this.defaultRubric = this.config.rubric;
  }

  /**
   * Score output using LLM evaluation
   */
  async score(
    output: unknown,
    expected: unknown,
    context?: ScoringContext
  ): Promise<ScorerResult> {
    try {
      const evaluation = await this.evaluateWithLLM(output, expected, context);

      return {
        score: evaluation.overall_score,
        passed: evaluation.passed,
        reason: evaluation.reasoning,
        breakdown: evaluation.criteria_scores,
        metadata: {
          provider: this.config.provider,
          model: this.config.model,
          suggestions: evaluation.suggestions,
        },
      };
    } catch (error) {
      return {
        score: 0.0,
        passed: false,
        reason: `Error during LLM evaluation: ${error instanceof Error ? error.message : 'Unknown error'}`,
        breakdown: {},
        metadata: {
          error: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }

  /**
   * Evaluate output using LLM
   */
  private async evaluateWithLLM(
    output: unknown,
    expected: unknown,
    context?: ScoringContext
  ): Promise<LLMEvaluationResponse> {
    const prompt = this.buildEvaluationPrompt(output, expected, context);

    if (this.config.provider === 'openai') {
      return await this.evaluateWithOpenAI(prompt);
    } else {
      return await this.evaluateWithAnthropic(prompt);
    }
  }

  /**
   * Evaluate using OpenAI API
   */
  private async evaluateWithOpenAI(
    prompt: string
  ): Promise<LLMEvaluationResponse> {
    const requestBody: any = {
      model: this.config.model,
      temperature: this.config.temperature,
      messages: [
        {
          role: 'system',
          content: this.getSystemPrompt(),
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
    };

    // Use structured output if enabled
    if (this.config.useStructuredOutput) {
      requestBody.response_format = {
        type: 'json_schema',
        json_schema: {
          name: 'evaluation_response',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              overall_score: {
                type: 'number',
                description: 'Overall score from 0 to 1',
              },
              passed: {
                type: 'boolean',
                description: 'Whether the output passes evaluation',
              },
              criteria_scores: {
                type: 'object',
                description: 'Scores for each criterion',
                additionalProperties: {
                  type: 'number',
                },
              },
              reasoning: {
                type: 'string',
                description: 'Detailed reasoning for the scores',
              },
              suggestions: {
                type: 'array',
                description: 'Suggestions for improvement',
                items: {
                  type: 'string',
                },
              },
            },
            required: [
              'overall_score',
              'passed',
              'criteria_scores',
              'reasoning',
            ],
            additionalProperties: false,
          },
        },
      };
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} ${error}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    return this.parseEvaluationResponse(content);
  }

  /**
   * Evaluate using Anthropic API
   */
  private async evaluateWithAnthropic(
    prompt: string
  ): Promise<LLMEvaluationResponse> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.config.model,
        max_tokens: 2000,
        temperature: this.config.temperature,
        system: this.getSystemPrompt(),
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error: ${response.status} ${error}`);
    }

    const data = await response.json();
    const content = data.content[0].text;

    return this.parseEvaluationResponse(content);
  }

  /**
   * Build evaluation prompt
   */
  private buildEvaluationPrompt(
    output: unknown,
    expected: unknown,
    context?: ScoringContext
  ): string {
    const rubric = this.config.rubric;

    let prompt = `You are evaluating an AI system's output against an expected output.\n\n`;

    if (context?.input) {
      prompt += `**Input:**\n${this.formatValue(context.input)}\n\n`;
    }

    prompt += `**Expected Output:**\n${this.formatValue(expected)}\n\n`;
    prompt += `**Actual Output:**\n${this.formatValue(output)}\n\n`;

    prompt += `**Evaluation Criteria:**\n\n`;

    for (const criterion of rubric.criteria) {
      const scale = criterion.scale ?? { min: 1, max: 5 };
      prompt += `- **${criterion.name}** (weight: ${criterion.weight ?? 1.0}, scale: ${scale.min}-${scale.max})\n`;
      prompt += `  ${criterion.description}\n\n`;
    }

    if (rubric.instructions) {
      prompt += `**Additional Instructions:**\n${rubric.instructions}\n\n`;
    }

    prompt += `Please evaluate the actual output and provide:\n`;
    prompt += `1. A score for each criterion (normalized to 0-1)\n`;
    prompt += `2. An overall score (weighted average, 0-1)\n`;
    prompt += `3. Whether the output passes (true/false)\n`;
    prompt += `4. Detailed reasoning for your evaluation\n`;
    prompt += `5. Suggestions for improvement (if applicable)\n\n`;

    if (this.config.useStructuredOutput) {
      prompt += `Respond in JSON format matching the schema provided.`;
    } else {
      prompt += `Respond in the following JSON format:\n`;
      prompt += `{\n`;
      prompt += `  "overall_score": <number 0-1>,\n`;
      prompt += `  "passed": <boolean>,\n`;
      prompt += `  "criteria_scores": { <criterion_name>: <score 0-1>, ... },\n`;
      prompt += `  "reasoning": "<detailed explanation>",\n`;
      prompt += `  "suggestions": ["<suggestion 1>", "<suggestion 2>", ...]\n`;
      prompt += `}`;
    }

    return prompt;
  }

  /**
   * Get system prompt for LLM judge
   */
  private getSystemPrompt(): string {
    return `You are an expert evaluator assessing AI system outputs. Your role is to:
1. Carefully compare actual outputs against expected outputs
2. Apply evaluation criteria objectively and consistently
3. Provide detailed, actionable feedback
4. Be strict but fair in your assessments
5. Consider context and nuance in your evaluations

${this.config.rubric.includeReasoning !== false ? 'Always provide clear reasoning for your scores.' : ''}`;
  }

  /**
   * Parse LLM evaluation response
   */
  private parseEvaluationResponse(content: string): LLMEvaluationResponse {
    try {
      // Extract JSON from markdown code blocks if present
      let jsonStr = content.trim();
      const jsonMatch = content.match(/```(?:json)?\s*\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      }

      const parsed = JSON.parse(jsonStr);

      // Validate required fields
      if (
        typeof parsed.overall_score !== 'number' ||
        typeof parsed.passed !== 'boolean' ||
        typeof parsed.criteria_scores !== 'object' ||
        typeof parsed.reasoning !== 'string'
      ) {
        throw new Error('Invalid evaluation response structure');
      }

      return parsed;
    } catch (error) {
      throw new Error(
        `Failed to parse LLM evaluation response: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Format value for display in prompt
   */
  private formatValue(value: unknown): string {
    if (typeof value === 'string') {
      return value;
    }
    return JSON.stringify(value, null, 2);
  }

  /**
   * Get default model for provider
   */
  private getDefaultModel(provider: 'openai' | 'anthropic'): string {
    return provider === 'openai' ? 'gpt-4o' : 'claude-3-5-sonnet-20241022';
  }

  /**
   * Create default evaluation rubric
   */
  private createDefaultRubric(): EvaluationRubric {
    return {
      criteria: [
        {
          name: 'Accuracy',
          description:
            'How accurately does the output match the expected output? Consider factual correctness and completeness.',
          weight: 2.0,
          scale: { min: 1, max: 5 },
        },
        {
          name: 'Helpfulness',
          description:
            'How helpful is the output for the intended purpose? Does it address the core need?',
          weight: 1.5,
          scale: { min: 1, max: 5 },
        },
        {
          name: 'Clarity',
          description:
            'How clear and well-structured is the output? Is it easy to understand?',
          weight: 1.0,
          scale: { min: 1, max: 5 },
        },
        {
          name: 'Tone',
          description:
            'Is the tone appropriate for the context? Professional, friendly, and respectful?',
          weight: 0.5,
          scale: { min: 1, max: 5 },
        },
      ],
      instructions:
        'Evaluate objectively and consider both the content and presentation.',
      includeReasoning: true,
    };
  }
}

/**
 * Convenience function to create and use LLMJudgeScorer
 */
export async function llmJudge(
  output: unknown,
  expected: unknown,
  config: LLMJudgeScorerConfig
): Promise<ScorerResult> {
  const scorer = new LLMJudgeScorer(config);
  return await scorer.score(output, expected);
}

/**
 * Create common evaluation rubrics
 */
export const CommonRubrics = {
  /**
   * Rubric for factual accuracy
   */
  factualAccuracy: (): EvaluationRubric => ({
    criteria: [
      {
        name: 'Correctness',
        description: 'Are all facts and information correct?',
        weight: 3.0,
      },
      {
        name: 'Completeness',
        description: 'Does the output cover all necessary information?',
        weight: 2.0,
      },
      {
        name: 'Precision',
        description: 'Are statements precise and unambiguous?',
        weight: 1.0,
      },
    ],
    includeReasoning: true,
  }),

  /**
   * Rubric for conversation quality
   */
  conversationQuality: (): EvaluationRubric => ({
    criteria: [
      {
        name: 'Relevance',
        description: 'How relevant is the response to the user query?',
        weight: 2.0,
      },
      {
        name: 'Helpfulness',
        description: 'How helpful is the response for the user?',
        weight: 2.0,
      },
      {
        name: 'Engagement',
        description: 'Is the tone engaging and appropriate?',
        weight: 1.0,
      },
      {
        name: 'Safety',
        description: 'Is the response safe and appropriate?',
        weight: 3.0,
      },
    ],
    includeReasoning: true,
  }),

  /**
   * Rubric for technical accuracy
   */
  technicalAccuracy: (): EvaluationRubric => ({
    criteria: [
      {
        name: 'Technical Correctness',
        description: 'Is the technical information accurate?',
        weight: 3.0,
      },
      {
        name: 'Clarity',
        description: 'Is the explanation clear and understandable?',
        weight: 1.5,
      },
      {
        name: 'Practicality',
        description: 'Is the solution practical and implementable?',
        weight: 1.5,
      },
    ],
    includeReasoning: true,
  }),
};
