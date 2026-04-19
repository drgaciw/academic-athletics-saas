/**
 * Intent Classifier
 * 
 * Classifies user intent and routes to appropriate specialized agent
 * Uses embeddings similarity and keyword matching for accurate routing
 */

import { embed, cosineSimilarity } from 'ai'
import { openai } from '@ai-sdk/openai'
import type { AgentType } from '../types/agent.types'

/**
 * Intent classification result
 */
export interface IntentClassification {
  /** Detected intent */
  intent: string
  
  /** Recommended agent type */
  agentType: AgentType
  
  /** Confidence score (0-1) */
  confidence: number
  
  /** Reasoning for classification */
  reasoning: string
  
  /** Alternative agents if confidence is low */
  alternatives?: Array<{
    agentType: AgentType
    confidence: number
  }>
}

/**
 * Intent patterns for each agent type
 */
const INTENT_PATTERNS: Record<AgentType, {
  keywords: string[]
  phrases: string[]
  description: string
}> = {
  advising: {
    keywords: [
      'course', 'class', 'schedule', 'degree', 'major', 'minor',
      'prerequisite', 'credit', 'semester', 'registration', 'enroll',
      'graduation', 'requirement', 'curriculum', 'academic plan'
    ],
    phrases: [
      'what courses should i take',
      'help me plan my schedule',
      'degree requirements',
      'course recommendations',
      'scheduling conflicts',
      'prerequisite for',
      'how many credits',
      'when should i graduate'
    ],
    description: 'Academic advising, course selection, degree planning, and scheduling'
  },
  
  compliance: {
    keywords: [
      'eligibility', 'eligible', 'ncaa', 'rule', 'bylaw', 'violation',
      'compliance', 'regulation', 'gpa requirement', 'progress toward degree',
      'academic standing', 'ineligible', 'waiver', 'appeal'
    ],
    phrases: [
      'am i eligible',
      'ncaa rules',
      'eligibility status',
      'compliance check',
      'what are the requirements',
      'can i play',
      'progress toward degree',
      'gpa requirements'
    ],
    description: 'NCAA compliance, eligibility verification, and rule interpretation'
  },
  
  intervention: {
    keywords: [
      'struggling', 'failing', 'help', 'support', 'tutor', 'study',
      'at-risk', 'performance', 'grade', 'improve', 'worried',
      'behind', 'difficult', 'challenge', 'intervention'
    ],
    phrases: [
      'i need help',
      'struggling with',
      'failing my class',
      'need a tutor',
      'how can i improve',
      'worried about my grades',
      'falling behind',
      'need academic support'
    ],
    description: 'Academic intervention, support services, and at-risk student assistance'
  },
  
  administrative: {
    keywords: [
      'travel', 'letter', 'absence', 'notify', 'email', 'faculty',
      'professor', 'instructor', 'report', 'document', 'generate',
      'schedule event', 'calendar', 'meeting', 'appointment'
    ],
    phrases: [
      'send travel letter',
      'notify my professors',
      'generate report',
      'schedule a meeting',
      'create document',
      'send email to',
      'absence notification',
      'travel notification'
    ],
    description: 'Administrative tasks, document generation, and notifications'
  },
  
  general: {
    keywords: [
      'hello', 'hi', 'help', 'what', 'how', 'when', 'where', 'who',
      'info', 'information', 'question', 'explain', 'tell me'
    ],
    phrases: [
      'what can you do',
      'how does this work',
      'tell me about',
      'i have a question',
      'can you help',
      'what is',
      'explain'
    ],
    description: 'General questions, platform information, and routing assistance'
  },

  'data-aggregation': {
    keywords: ['transcript', 'ocr', 'pdf', 'normalize', 'course code', 'extract', 'aggregation'],
    phrases: ['parse transcript', 'normalize data', 'extract grades'],
    description: 'Data aggregation and transcript normalization'
  },

  equivalency: {
    keywords: ['equivalency', 'transfer', 'articulation', 'match', 'credit', 'mapping'],
    phrases: ['transfer credit', 'course equivalency', 'map courses'],
    description: 'Course equivalency and transfer credit mapping'
  },

  'transfer-compliance': {
    keywords: ['transfer eligibility', 'ncaa transfer', 'transfer rules', 'residence'],
    phrases: ['check transfer eligibility', 'transfer compliance', 'ncaa transfer rules'],
    description: 'NCAA transfer compliance and eligibility'
  },

  revision: {
    keywords: ['audit', 'review', 'quality control', 'verify', 'revision'],
    phrases: ['audit report', 'verify transfer', 'quality check'],
    description: 'Audit and revision of transfer evaluations'
  },

  orchestrator: {
    keywords: ['workflow', 'process', 'coordinate', 'transfer pipeline'],
    phrases: ['start transfer workflow', 'manage process'],
    description: 'Workflow orchestration for transfer credits'
  }
}

/**
 * Intent Classifier Class
 */
export class IntentClassifier {
  private embeddingCache: Map<string, number[]> = new Map()
  
  /**
   * Classify user intent and recommend agent
   */
  async classify(
    message: string,
    context?: Record<string, any>
  ): Promise<IntentClassification> {
    const messageLower = message.toLowerCase()
    
    // Calculate scores for each agent type
    const scores = await Promise.all(
      Object.entries(INTENT_PATTERNS).map(async ([agentType, pattern]) => {
        const keywordScore = this.calculateKeywordScore(messageLower, pattern.keywords)
        const phraseScore = this.calculatePhraseScore(messageLower, pattern.phrases)
        const semanticScore = await this.calculateSemanticScore(message, pattern.description)
        
        // Weighted combination
        const totalScore = (
          keywordScore * 0.3 +
          phraseScore * 0.3 +
          semanticScore * 0.4
        )
        
        return {
          agentType: agentType as AgentType,
          score: totalScore,
          breakdown: { keywordScore, phraseScore, semanticScore }
        }
      })
    )
    
    // Sort by score
    scores.sort((a, b) => b.score - a.score)
    
    const topAgent = scores[0]
    const confidence = topAgent.score
    
    // Get alternatives if confidence is not very high
    const alternatives = confidence < 0.7
      ? scores.slice(1, 3).map(s => ({
          agentType: s.agentType,
          confidence: s.score
        }))
      : undefined
    
    // Generate reasoning
    const reasoning = this.generateReasoning(
      message,
      topAgent.agentType,
      topAgent.breakdown
    )
    
    return {
      intent: this.getIntentLabel(topAgent.agentType, message),
      agentType: topAgent.agentType,
      confidence,
      reasoning,
      alternatives
    }
  }
  
  /**
   * Calculate keyword matching score
   */
  private calculateKeywordScore(message: string, keywords: string[]): number {
    const words = message.split(/\s+/)
    let matches = 0
    
    for (const keyword of keywords) {
      if (message.includes(keyword)) {
        matches++
      }
    }
    
    // Normalize by number of keywords
    return Math.min(matches / 3, 1.0)
  }
  
  /**
   * Calculate phrase matching score
   */
  private calculatePhraseScore(message: string, phrases: string[]): number {
    let bestScore = 0
    
    for (const phrase of phrases) {
      if (message.includes(phrase)) {
        // Exact phrase match gets high score
        bestScore = Math.max(bestScore, 1.0)
      } else {
        // Partial phrase match
        const phraseWords = phrase.split(/\s+/)
        const matchedWords = phraseWords.filter(word => message.includes(word))
        const partialScore = matchedWords.length / phraseWords.length
        bestScore = Math.max(bestScore, partialScore)
      }
    }
    
    return bestScore
  }
  
  /**
   * Calculate semantic similarity score using embeddings
   */
  private async calculateSemanticScore(
    message: string,
    description: string
  ): Promise<number> {
    try {
      // Get or generate embeddings
      const messageEmbedding = await this.getEmbedding(message)
      const descriptionEmbedding = await this.getEmbedding(description)
      
      // Calculate cosine similarity
      const similarity = cosineSimilarity(messageEmbedding, descriptionEmbedding)
      
      // Normalize to 0-1 range (cosine similarity is -1 to 1)
      return (similarity + 1) / 2
    } catch (error) {
      console.warn('Semantic scoring failed, using fallback:', error)
      return 0.5 // Neutral score on error
    }
  }
  
  /**
   * Get embedding with caching
   */
  private async getEmbedding(text: string): Promise<number[]> {
    // Check cache
    if (this.embeddingCache.has(text)) {
      return this.embeddingCache.get(text)!
    }
    
    // Generate embedding
    const { embedding } = await embed({
      model: openai.embedding('text-embedding-3-small'),
      value: text
    })
    
    // Cache result
    this.embeddingCache.set(text, embedding)
    
    // Limit cache size
    if (this.embeddingCache.size > 100) {
      const firstKey = this.embeddingCache.keys().next().value
      if (firstKey) {
        this.embeddingCache.delete(firstKey)
      }
    }
    
    return embedding
  }
  
  /**
   * Generate human-readable reasoning
   */
  private generateReasoning(
    message: string,
    agentType: AgentType,
    breakdown: { keywordScore: number; phraseScore: number; semanticScore: number }
  ): string {
    const pattern = INTENT_PATTERNS[agentType]
    const reasons: string[] = []
    
    if (breakdown.keywordScore > 0.5) {
      reasons.push(`contains relevant keywords for ${agentType}`)
    }
    
    if (breakdown.phraseScore > 0.7) {
      reasons.push(`matches common ${agentType} phrases`)
    }
    
    if (breakdown.semanticScore > 0.6) {
      reasons.push(`semantically similar to ${pattern.description}`)
    }
    
    if (reasons.length === 0) {
      return `Best match for general ${agentType} queries`
    }
    
    return `Classified as ${agentType} because message ${reasons.join(' and ')}`
  }
  
  /**
   * Get intent label from agent type and message
   */
  private getIntentLabel(agentType: AgentType, message: string): string {
    const messageLower = message.toLowerCase()
    
    // Specific intent labels based on keywords
    const intentMap: Record<AgentType, Record<string, string>> = {
      advising: {
        'course': 'course_selection',
        'schedule': 'schedule_planning',
        'degree': 'degree_planning',
        'prerequisite': 'prerequisite_check',
        'graduation': 'graduation_planning'
      },
      compliance: {
        'eligible': 'eligibility_check',
        'ncaa': 'ncaa_rules',
        'violation': 'violation_review',
        'gpa': 'gpa_requirements'
      },
      intervention: {
        'struggling': 'academic_support',
        'tutor': 'tutoring_request',
        'failing': 'intervention_needed',
        'help': 'support_request'
      },
      administrative: {
        'travel': 'travel_notification',
        'letter': 'document_generation',
        'email': 'email_notification',
        'report': 'report_generation'
      },
      general: {
        'hello': 'greeting',
        'help': 'help_request',
        'what': 'information_request',
        'how': 'how_to_question'
      },
      'data-aggregation': {
        'transcript': 'parse_transcript',
        'extract': 'extract_data'
      },
      equivalency: {
        'map': 'map_courses',
        'match': 'find_matches'
      },
      'transfer-compliance': {
        'eligible': 'check_eligibility',
        'rules': 'check_rules'
      },
      revision: {
        'audit': 'audit_report',
        'verify': 'verify_results'
      },
      orchestrator: {
        'workflow': 'manage_workflow',
        'process': 'start_process'
      }
    }
    
    // Find matching intent
    for (const [keyword, intent] of Object.entries(intentMap[agentType])) {
      if (messageLower.includes(keyword)) {
        return intent
      }
    }
    
    // Default intent
    return `${agentType}_general`
  }
  
  /**
   * Classify with explicit agent type (for validation)
   */
  async validateAgentSelection(
    message: string,
    selectedAgent: AgentType
  ): Promise<{ valid: boolean; confidence: number; suggestion?: AgentType }> {
    const classification = await this.classify(message)
    
    if (classification.agentType === selectedAgent) {
      return {
        valid: true,
        confidence: classification.confidence
      }
    }
    
    // Check if selected agent is in alternatives
    const alternative = classification.alternatives?.find(
      a => a.agentType === selectedAgent
    )
    
    if (alternative && alternative.confidence > 0.5) {
      return {
        valid: true,
        confidence: alternative.confidence
      }
    }
    
    return {
      valid: false,
      confidence: classification.confidence,
      suggestion: classification.agentType
    }
  }
}

/**
 * Global intent classifier instance
 */
export const globalIntentClassifier = new IntentClassifier()

/**
 * Convenience function for intent classification
 */
export async function classifyIntent(
  message: string,
  context?: Record<string, any>
): Promise<IntentClassification> {
  return globalIntentClassifier.classify(message, context)
}

/**
 * Convenience function for agent validation
 */
export async function validateAgentSelection(
  message: string,
  selectedAgent: AgentType
): Promise<{ valid: boolean; confidence: number; suggestion?: AgentType }> {
  return globalIntentClassifier.validateAgentSelection(message, selectedAgent)
}
