/**
 * Feedback Manager
 * 
 * Collects, analyzes, and processes user feedback on agent responses
 * Enables continuous improvement through feedback loops
 */

import type { AgentFeedback } from '../types/agent.types'

/**
 * Feedback category
 */
export type FeedbackCategory =
  | 'accuracy'
  | 'relevance'
  | 'tone'
  | 'completeness'
  | 'helpfulness'
  | 'speed'

/**
 * Feedback sentiment
 */
export type FeedbackSentiment = 'positive' | 'neutral' | 'negative'

/**
 * Feedback analysis result
 */
export interface FeedbackAnalysis {
  taskId: string
  agentType: string
  averageRating: number
  totalFeedback: number
  sentiment: FeedbackSentiment
  categories: Record<FeedbackCategory, number>
  commonIssues: string[]
  recommendations: string[]
}

/**
 * Feedback pattern
 */
export interface FeedbackPattern {
  pattern: string
  frequency: number
  severity: 'low' | 'medium' | 'high'
  affectedAgents: string[]
  suggestedFix: string
}

/**
 * Feedback Manager Class
 */
export class FeedbackManager {
  /**
   * Submit feedback
   */
  async submitFeedback(feedback: Omit<AgentFeedback, 'id' | 'createdAt'>): Promise<AgentFeedback> {
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()

    try {
      const created = await prisma.aIFeedback.create({
        data: {
          userId: feedback.userId,
          conversationId: feedback.taskId, // Using conversationId field
          messageId: feedback.taskId,
          feedbackType: this.mapFeedbackType(feedback.rating, feedback.wasHelpful),
          rating: feedback.rating,
          comment: feedback.feedbackText,
        },
      })

      return {
        id: created.id,
        taskId: feedback.taskId,
        userId: feedback.userId,
        rating: feedback.rating,
        feedbackText: feedback.feedbackText,
        wasHelpful: feedback.wasHelpful,
        flaggedIssue: feedback.flaggedIssue,
        createdAt: created.createdAt,
      }
    } finally {
      await prisma.$disconnect()
    }
  }

  /**
   * Get feedback for task
   */
  async getFeedbackForTask(taskId: string): Promise<AgentFeedback[]> {
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()

    try {
      const feedback = await prisma.aIFeedback.findMany({
        where: {
          OR: [
            { conversationId: taskId },
            { messageId: taskId },
          ],
        },
        orderBy: { createdAt: 'desc' },
      })

      return feedback.map((f) => ({
        id: f.id,
        taskId,
        userId: f.userId,
        rating: f.rating || 3,
        feedbackText: f.comment || undefined,
        wasHelpful: f.feedbackType === 'HELPFUL',
        flaggedIssue: ['INACCURATE', 'INAPPROPRIATE'].includes(f.feedbackType),
        createdAt: f.createdAt,
      }))
    } finally {
      await prisma.$disconnect()
    }
  }

  /**
   * Get feedback for agent type
   */
  async getFeedbackForAgent(
    agentType: string,
    limit: number = 100
  ): Promise<AgentFeedback[]> {
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()

    try {
      // Get agent tasks
      const tasks = await prisma.agentTask.findMany({
        where: { agentType },
        select: { id: true, inputParams: true, outputResult: true },
        take: limit,
        orderBy: { createdAt: 'desc' },
      })

      const taskIds = tasks.map((t) => t.id)

      // Get feedback for these tasks
      const feedback = await prisma.aIFeedback.findMany({
        where: {
          OR: [
            { conversationId: { in: taskIds } },
            { messageId: { in: taskIds } },
          ],
        },
        orderBy: { createdAt: 'desc' },
      })

      return feedback.map((f) => ({
        id: f.id,
        taskId: f.conversationId || f.messageId || '',
        userId: f.userId,
        rating: f.rating || 3,
        feedbackText: f.comment || undefined,
        wasHelpful: f.feedbackType === 'HELPFUL',
        flaggedIssue: ['INACCURATE', 'INAPPROPRIATE'].includes(f.feedbackType),
        createdAt: f.createdAt,
      }))
    } finally {
      await prisma.$disconnect()
    }
  }

  /**
   * Analyze feedback for task
   */
  async analyzeTaskFeedback(taskId: string): Promise<FeedbackAnalysis | null> {
    const feedback = await this.getFeedbackForTask(taskId)

    if (feedback.length === 0) return null

    const averageRating =
      feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length

    const sentiment = this.determineSentiment(averageRating)

    const categories = this.categorizeFeedback(feedback)

    const commonIssues = this.extractCommonIssues(feedback)

    const recommendations = this.generateRecommendations(
      averageRating,
      categories,
      commonIssues
    )

    return {
      taskId,
      agentType: 'unknown', // Would need to fetch from task
      averageRating,
      totalFeedback: feedback.length,
      sentiment,
      categories,
      commonIssues,
      recommendations,
    }
  }

  /**
   * Analyze feedback for agent type
   */
  async analyzeAgentFeedback(agentType: string): Promise<FeedbackAnalysis> {
    const feedback = await this.getFeedbackForAgent(agentType)

    const averageRating =
      feedback.length > 0
        ? feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length
        : 0

    const sentiment = this.determineSentiment(averageRating)

    const categories = this.categorizeFeedback(feedback)

    const commonIssues = this.extractCommonIssues(feedback)

    const recommendations = this.generateRecommendations(
      averageRating,
      categories,
      commonIssues
    )

    return {
      taskId: 'aggregate',
      agentType,
      averageRating,
      totalFeedback: feedback.length,
      sentiment,
      categories,
      commonIssues,
      recommendations,
    }
  }

  /**
   * Identify feedback patterns
   */
  async identifyPatterns(
    agentType?: string,
    timeframe: number = 7 * 24 * 60 * 60 * 1000 // 7 days
  ): Promise<FeedbackPattern[]> {
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()

    try {
      const cutoffDate = new Date(Date.now() - timeframe)

      // Get recent feedback
      const feedback = await prisma.aIFeedback.findMany({
        where: {
          createdAt: { gte: cutoffDate },
          feedbackType: { in: ['NOT_HELPFUL', 'INACCURATE', 'INAPPROPRIATE'] },
        },
        include: {
          user: true,
        },
      })

      // Analyze patterns
      const patterns: Map<string, FeedbackPattern> = new Map()

      for (const f of feedback) {
        if (!f.comment) continue

        // Extract keywords/phrases
        const keywords = this.extractKeywords(f.comment)

        for (const keyword of keywords) {
          const existing = patterns.get(keyword)

          if (existing) {
            existing.frequency++
          } else {
            patterns.set(keyword, {
              pattern: keyword,
              frequency: 1,
              severity: this.assessSeverity(f.feedbackType),
              affectedAgents: agentType ? [agentType] : [],
              suggestedFix: this.suggestFix(keyword),
            })
          }
        }
      }

      // Sort by frequency
      return Array.from(patterns.values())
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 10)
    } finally {
      await prisma.$disconnect()
    }
  }

  /**
   * Generate training dataset from positive feedback
   */
  async generateTrainingDataset(
    agentType: string,
    minRating: number = 4
  ): Promise<Array<{ input: string; output: string; metadata: any }>> {
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()

    try {
      // Get high-rated tasks
      const tasks = await prisma.agentTask.findMany({
        where: { agentType },
        include: {
          inputParams: true,
          outputResult: true,
        },
      })

      const dataset: Array<{ input: string; output: string; metadata: any }> = []

      for (const task of tasks) {
        // Get feedback for this task
        const feedback = await prisma.aIFeedback.findMany({
          where: {
            OR: [
              { conversationId: task.id },
              { messageId: task.id },
            ],
          },
        })

        const avgRating =
          feedback.length > 0
            ? feedback.reduce((sum, f) => sum + (f.rating || 0), 0) / feedback.length
            : 0

        if (avgRating >= minRating) {
          const inputParams = task.inputParams as any
          const outputResult = task.outputResult as any

          dataset.push({
            input: inputParams?.message || '',
            output: outputResult?.response || '',
            metadata: {
              agentType,
              rating: avgRating,
              feedbackCount: feedback.length,
              timestamp: task.createdAt,
            },
          })
        }
      }

      return dataset
    } finally {
      await prisma.$disconnect()
    }
  }

  /**
   * Flag problematic responses for review
   */
  async flagForReview(taskId: string, reason: string): Promise<void> {
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()

    try {
      await prisma.agentTask.update({
        where: { id: taskId },
        data: {
          error: `Flagged for review: ${reason}`,
        },
      })
    } finally {
      await prisma.$disconnect()
    }
  }

  // Helper methods

  private mapFeedbackType(rating: number, wasHelpful: boolean): string {
    if (rating >= 4 && wasHelpful) return 'HELPFUL'
    if (rating <= 2) return 'NOT_HELPFUL'
    if (!wasHelpful) return 'INACCURATE'
    return 'OTHER'
  }

  private determineSentiment(averageRating: number): FeedbackSentiment {
    if (averageRating >= 4) return 'positive'
    if (averageRating >= 3) return 'neutral'
    return 'negative'
  }

  private categorizeFeedback(
    feedback: AgentFeedback[]
  ): Record<FeedbackCategory, number> {
    const categories: Record<FeedbackCategory, number> = {
      accuracy: 0,
      relevance: 0,
      tone: 0,
      completeness: 0,
      helpfulness: 0,
      speed: 0,
    }

    for (const f of feedback) {
      if (!f.feedbackText) continue

      const text = f.feedbackText.toLowerCase()

      if (text.includes('wrong') || text.includes('incorrect') || text.includes('inaccurate')) {
        categories.accuracy++
      }
      if (text.includes('relevant') || text.includes('topic')) {
        categories.relevance++
      }
      if (text.includes('tone') || text.includes('rude') || text.includes('polite')) {
        categories.tone++
      }
      if (text.includes('incomplete') || text.includes('missing') || text.includes('more detail')) {
        categories.completeness++
      }
      if (text.includes('helpful') || text.includes('useful')) {
        categories.helpfulness++
      }
      if (text.includes('slow') || text.includes('fast') || text.includes('quick')) {
        categories.speed++
      }
    }

    return categories
  }

  private extractCommonIssues(feedback: AgentFeedback[]): string[] {
    const issues: Map<string, number> = new Map()

    for (const f of feedback) {
      if (!f.feedbackText || f.rating >= 4) continue

      const keywords = this.extractKeywords(f.feedbackText)
      for (const keyword of keywords) {
        issues.set(keyword, (issues.get(keyword) || 0) + 1)
      }
    }

    return Array.from(issues.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([issue]) => issue)
  }

  private extractKeywords(text: string): string[] {
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'is', 'was', 'are', 'were'])
    const words = text.toLowerCase().match(/\b\w+\b/g) || []
    return words.filter((w) => w.length > 3 && !stopWords.has(w))
  }

  private generateRecommendations(
    averageRating: number,
    categories: Record<FeedbackCategory, number>,
    commonIssues: string[]
  ): string[] {
    const recommendations: string[] = []

    if (averageRating < 3) {
      recommendations.push('Overall satisfaction is low - review agent prompts and tool selection')
    }

    if (categories.accuracy > 5) {
      recommendations.push('Accuracy issues detected - verify tool implementations and data sources')
    }

    if (categories.completeness > 5) {
      recommendations.push('Responses may be incomplete - increase maxSteps or improve prompts')
    }

    if (categories.tone > 3) {
      recommendations.push('Tone issues detected - review system prompts for appropriate language')
    }

    if (commonIssues.length > 0) {
      recommendations.push(`Common issues: ${commonIssues.join(', ')} - investigate these patterns`)
    }

    return recommendations
  }

  private assessSeverity(feedbackType: string): 'low' | 'medium' | 'high' {
    if (feedbackType === 'INAPPROPRIATE') return 'high'
    if (feedbackType === 'INACCURATE') return 'medium'
    return 'low'
  }

  private suggestFix(pattern: string): string {
    const fixes: Record<string, string> = {
      wrong: 'Verify data sources and tool implementations',
      slow: 'Optimize tool execution and caching',
      incomplete: 'Increase maxSteps or improve prompts',
      confusing: 'Simplify response structure and language',
      irrelevant: 'Improve intent classification and tool selection',
    }

    for (const [keyword, fix] of Object.entries(fixes)) {
      if (pattern.includes(keyword)) return fix
    }

    return 'Review and improve agent configuration'
  }
}

/**
 * Global feedback manager instance
 */
export const globalFeedbackManager = new FeedbackManager()

/**
 * Convenience functions
 */
export async function submitFeedback(
  feedback: Omit<AgentFeedback, 'id' | 'createdAt'>
): Promise<AgentFeedback> {
  return globalFeedbackManager.submitFeedback(feedback)
}

export async function analyzeAgentFeedback(agentType: string): Promise<FeedbackAnalysis> {
  return globalFeedbackManager.analyzeAgentFeedback(agentType)
}

export async function identifyFeedbackPatterns(
  agentType?: string
): Promise<FeedbackPattern[]> {
  return globalFeedbackManager.identifyPatterns(agentType)
}
