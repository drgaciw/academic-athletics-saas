import { ChatAnthropic } from '@langchain/anthropic'
import { PromptTemplate } from '@langchain/core/prompts'
import { ComplianceQuery, ComplianceAnalysis } from '../types'
import { AI_CONFIG } from '../config'
import { ragPipeline } from './ragPipeline'

export class ComplianceAgent {
  private llm: ChatAnthropic

  constructor() {
    this.llm = new ChatAnthropic({
      modelName: AI_CONFIG.models.reasoning,
      temperature: 0.1, // Low temperature for accurate rule interpretation
      anthropicApiKey: AI_CONFIG.anthropic.apiKey,
    })
  }

  /**
   * Analyze compliance query with NCAA rules
   */
  async analyzeCompliance(query: ComplianceQuery): Promise<ComplianceAnalysis> {
    const { question, context } = query

    // Use RAG to retrieve relevant NCAA rules
    const ragResult = await ragPipeline.query(question, {
      model: AI_CONFIG.models.reasoning,
      systemPrompt: AI_CONFIG.systemPrompts.compliance,
    })

    // Build comprehensive prompt
    const prompt = this.buildCompliancePrompt(
      question,
      context,
      ragResult.sources
    )

    try {
      const result = await this.llm.invoke(prompt)
      const response = result.content.toString()

      // Parse response into structured format
      const analysis = this.parseComplianceResponse(response, ragResult.sources)

      return {
        ...analysis,
        confidence: ragResult.confidence,
      }
    } catch (error) {
      console.error('Error analyzing compliance:', error)
      throw new Error(
        `Failed to analyze compliance: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Build compliance analysis prompt
   */
  private buildCompliancePrompt(
    question: string,
    context: ComplianceQuery['context'],
    sources: any[]
  ): string {
    const ncaaRules = sources
      .map((s, i) => `[${i + 1}] ${s.title}:\n${s.excerpt}`)
      .join('\n\n')

    const scenario = context?.scenario
      ? `\nScenario: ${context.scenario}`
      : ''

    return AI_CONFIG.promptTemplates.complianceAnalysis
      .replace('{ncaaRules}', ncaaRules)
      .replace('{scenario}', question + scenario)
  }

  /**
   * Parse compliance response
   */
  private parseComplianceResponse(
    response: string,
    sources: any[]
  ): Omit<ComplianceAnalysis, 'confidence'> {
    // Extract sections from response
    const lines = response.split('\n').filter((l) => l.trim())

    const interpretation =
      lines.find((l) => l.includes('Interpretation:'))?.split(':')[1]?.trim() ||
      response

    const recommendations: string[] = []
    const warnings: string[] = []
    const applicableRules: ComplianceAnalysis['applicableRules'] = []
    const references: ComplianceAnalysis['references'] = []

    // Parse recommendations
    const recSection = response.match(
      /Recommendations?:([\s\S]*?)(?=\n\n|Warnings?:|$)/i
    )
    if (recSection) {
      recommendations.push(
        ...recSection[1]
          .split('\n')
          .filter((l) => l.trim().startsWith('-'))
          .map((l) => l.trim().substring(1).trim())
      )
    }

    // Parse warnings
    const warnSection = response.match(/Warnings?:([\s\S]*?)(?=\n\n|$)/i)
    if (warnSection) {
      warnings.push(
        ...warnSection[1]
          .split('\n')
          .filter((l) => l.trim().startsWith('-'))
          .map((l) => l.trim().substring(1).trim())
      )
    }

    // Map sources to applicable rules
    sources.forEach((source, idx) => {
      if (response.includes(`[${idx + 1}]`)) {
        applicableRules.push({
          ruleId: source.id,
          section: source.title,
          text: source.excerpt,
          relevance: source.confidence,
        })

        references.push({
          source: 'NCAA Division I Manual',
          section: source.title,
          url: source.url,
        })
      }
    })

    return {
      query: response,
      interpretation,
      applicableRules,
      recommendations,
      warnings,
      references,
    }
  }

  /**
   * Check eligibility based on NCAA rules
   */
  async checkEligibility(studentId: string): Promise<{
    eligible: boolean
    issues: string[]
    recommendations: string[]
  }> {
    // Simplified eligibility check
    // In production, this would integrate with full compliance service
    const query: ComplianceQuery = {
      question: `Check eligibility requirements for student ${studentId}`,
      context: { studentId },
    }

    const analysis = await this.analyzeCompliance(query)

    return {
      eligible: analysis.warnings.length === 0,
      issues: analysis.warnings,
      recommendations: analysis.recommendations,
    }
  }
}

export const complianceAgent = new ComplianceAgent()
