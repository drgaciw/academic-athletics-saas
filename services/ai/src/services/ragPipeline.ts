import { ChatOpenAI } from '@langchain/openai'
import { ChatAnthropic } from '@langchain/anthropic'
import { PromptTemplate } from '@langchain/core/prompts'
import { RunnableSequence } from '@langchain/core/runnables'
import nlp from 'compromise'
import { QueryIntent, RetrievedDocument, RAGContext, RAGResponse } from '../types'
import { AI_CONFIG } from '../config'
import { embeddingService } from './embeddingService'
import { countTokens, truncateToTokenLimit } from '../utils/tokens'
import { validateResponse } from '../utils/security'

export class RAGPipeline {
  private openai: ChatOpenAI
  private anthropic: ChatAnthropic

  constructor() {
    this.openai = new ChatOpenAI({
      modelName: AI_CONFIG.models.default,
      openAIApiKey: AI_CONFIG.openai.apiKey,
      temperature: 0.3,
    })

    this.anthropic = new ChatAnthropic({
      modelName: AI_CONFIG.models.reasoning,
      anthropicApiKey: AI_CONFIG.anthropic.apiKey,
      temperature: 0.3,
    })
  }

  // ============================================================================
  // STEP 1: QUERY UNDERSTANDING
  // ============================================================================

  /**
   * Analyze and understand the user's query
   */
  async analyzeQuery(query: string): Promise<QueryIntent> {
    const doc = nlp(query)

    // Extract entities
    const entities: QueryIntent['entities'] = []

    // Extract people names
    const people = doc.people().out('array')
    people.forEach((person) => {
      entities.push({ type: 'person', value: person, confidence: 0.9 })
    })

    // Extract numbers (could be GPAs, credit hours, etc.)
    const numbers = doc.numbers().out('array')
    numbers.forEach((num) => {
      entities.push({ type: 'number', value: num, confidence: 0.8 })
    })

    // Extract dates
    const dates = doc.dates().out('array')
    dates.forEach((date) => {
      entities.push({ type: 'date', value: date, confidence: 0.85 })
    })

    // Determine intent based on keywords
    const intent = this.classifyIntent(query)

    // Check if query is conversational (has pronouns, questions)
    const isConversational =
      doc.has('#Pronoun') || doc.has('#Question') || query.includes('?') || query.includes('I ')

    // Check if context is needed
    const requiresContext =
      query.length > 50 ||
      intent !== 'general' ||
      entities.length > 0 ||
      this.hasComplexTopics(query)

    // Rewrite query for better retrieval
    const rewrittenQuery = await this.rewriteQuery(query, intent)

    return {
      originalQuery: query,
      rewrittenQuery,
      intent,
      entities,
      isConversational,
      requiresContext,
    }
  }

  /**
   * Classify query intent
   */
  private classifyIntent(
    query: string
  ): 'academic_advising' | 'compliance' | 'support' | 'general' | 'administrative' {
    const lowerQuery = query.toLowerCase()

    // Academic advising keywords
    if (
      lowerQuery.match(
        /\b(course|class|schedule|credit|degree|major|advising|register|enroll|prerequisite)\b/
      )
    ) {
      return 'academic_advising'
    }

    // Compliance keywords
    if (
      lowerQuery.match(
        /\b(ncaa|eligibility|compliance|rule|bylaw|violation|initial|continuing|gpa requirement)\b/
      )
    ) {
      return 'compliance'
    }

    // Support keywords
    if (
      lowerQuery.match(/\b(tutor|study hall|workshop|mentor|help|support|struggling)\b/)
    ) {
      return 'support'
    }

    // Administrative keywords
    if (
      lowerQuery.match(
        /\b(travel letter|absence|notification|report|transcript|document)\b/
      )
    ) {
      return 'administrative'
    }

    return 'general'
  }

  /**
   * Check if query has complex topics requiring retrieval
   */
  private hasComplexTopics(query: string): boolean {
    const complexKeywords = [
      'ncaa',
      'rule',
      'bylaw',
      'policy',
      'requirement',
      'eligibility',
      'compliance',
      'regulation',
      'guideline',
      'procedure',
    ]

    return complexKeywords.some((keyword) => query.toLowerCase().includes(keyword))
  }

  /**
   * Rewrite query for better retrieval
   */
  private async rewriteQuery(
    query: string,
    intent: QueryIntent['intent']
  ): Promise<string> {
    // For short, clear queries, no rewriting needed
    if (query.length < 30 && !query.includes('?')) {
      return query
    }

    const prompt = PromptTemplate.fromTemplate(
      `Rewrite the following query to be more precise for semantic search.
Remove conversational elements, expand abbreviations, and make it more keyword-focused.
Query type: {intent}

Original query: {query}

Rewritten query:`
    )

    try {
      const chain = RunnableSequence.from([prompt, this.openai])
      const result = await chain.invoke({
        query,
        intent,
      })

      return result.content.toString().trim()
    } catch (error) {
      console.warn('Query rewriting failed, using original:', error)
      return query
    }
  }

  // ============================================================================
  // STEP 2: RETRIEVAL
  // ============================================================================

  /**
   * Retrieve relevant documents
   */
  async retrieveContext(intent: QueryIntent): Promise<RAGContext> {
    const { rewrittenQuery, intent: intentType } = intent

    // Determine content types to search based on intent
    const contentTypes = this.getContentTypesForIntent(intentType)

    // Perform semantic search
    const startTime = Date.now()
    const documents = await embeddingService.semanticSearch(rewrittenQuery, {
      limit: AI_CONFIG.rag.retrievalLimit,
      minScore: AI_CONFIG.rag.minSimilarityScore,
      contentType: contentTypes,
    })

    const retrievalTime = Date.now() - startTime

    console.log(
      `Retrieved ${documents.length} documents in ${retrievalTime}ms for query: "${rewrittenQuery}"`
    )

    // Convert to RetrievedDocument format
    const retrievedDocs: RetrievedDocument[] = documents.map((doc) => ({
      id: doc.id,
      content: doc.content,
      metadata: {
        source: doc.metadata.source,
        title: doc.metadata.title,
        type: doc.metadata.contentType || 'document',
        section: doc.metadata.section,
      },
      score: doc.score,
    }))

    const avgScore = retrievedDocs.length > 0
      ? retrievedDocs.reduce((sum, doc) => sum + doc.score, 0) / retrievedDocs.length
      : 0

    const totalTokens = retrievedDocs.reduce(
      (sum, doc) => sum + countTokens(doc.content),
      0
    )

    return {
      documents: retrievedDocs,
      totalRetrieved: retrievedDocs.length,
      reranked: false,
      avgScore,
      tokens: totalTokens,
    }
  }

  /**
   * Get relevant content types for intent
   */
  private getContentTypesForIntent(intent: QueryIntent['intent']): string[] {
    const typeMap: Record<QueryIntent['intent'], string[]> = {
      academic_advising: ['course_catalog', 'policy', 'faq'],
      compliance: ['ncaa_rule', 'policy', 'document'],
      support: ['faq', 'policy', 'document'],
      administrative: ['policy', 'document', 'faq'],
      general: ['faq', 'policy', 'course_catalog', 'ncaa_rule', 'document'],
    }

    return typeMap[intent] || []
  }

  // ============================================================================
  // STEP 3: RERANKING
  // ============================================================================

  /**
   * Rerank documents for relevance
   */
  async rerankDocuments(
    context: RAGContext,
    query: string
  ): Promise<RAGContext> {
    if (context.documents.length <= AI_CONFIG.rag.rerankTopK) {
      return context // No need to rerank if we have few documents
    }

    // Simple reranking based on keyword matching and position
    const scoredDocs = context.documents.map((doc) => {
      let rerankScore = doc.score

      // Boost score for keyword matches
      const queryKeywords = query.toLowerCase().split(/\s+/)
      const matchingKeywords = queryKeywords.filter((keyword) =>
        doc.content.toLowerCase().includes(keyword)
      )
      rerankScore += matchingKeywords.length * 0.1

      // Boost score for title matches
      if (doc.metadata.title) {
        const titleMatches = queryKeywords.filter((keyword) =>
          doc.metadata.title!.toLowerCase().includes(keyword)
        )
        rerankScore += titleMatches.length * 0.15
      }

      return { ...doc, score: rerankScore }
    })

    // Sort by reranked score and take top K
    const reranked = scoredDocs
      .sort((a, b) => b.score - a.score)
      .slice(0, AI_CONFIG.rag.rerankTopK)

    return {
      ...context,
      documents: reranked,
      reranked: true,
      avgScore: reranked.reduce((sum, doc) => sum + doc.score, 0) / reranked.length,
    }
  }

  // ============================================================================
  // STEP 4: RESPONSE GENERATION
  // ============================================================================

  /**
   * Generate response with retrieved context
   */
  async generateResponse(
    context: RAGContext,
    query: string,
    options: {
      model?: string
      systemPrompt?: string
      streaming?: boolean
    } = {}
  ): Promise<RAGResponse> {
    const startTime = Date.now()

    // Prepare context text
    const contextText = this.formatContext(context.documents)

    // Build prompt
    const prompt = this.buildPrompt(query, contextText, options.systemPrompt)

    // Select model
    const model = options.model || AI_CONFIG.models.default
    const llm = model.startsWith('claude') ? this.anthropic : this.openai

    try {
      // Generate response
      const response = await llm.invoke(prompt)
      const answer = response.content.toString()

      // Extract sources
      const sources = this.extractSources(answer, context.documents)

      // Calculate tokens
      const promptTokens = countTokens(prompt, model)
      const completionTokens = countTokens(answer, model)

      const latency = Date.now() - startTime

      return {
        answer,
        sources,
        confidence: context.avgScore,
        factChecked: false,
        tokens: {
          prompt: promptTokens,
          completion: completionTokens,
          total: promptTokens + completionTokens,
        },
        latency,
      }
    } catch (error) {
      console.error('Error generating RAG response:', error)
      throw new Error(
        `Failed to generate response: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Format context documents for prompt
   */
  private formatContext(documents: RetrievedDocument[]): string {
    return documents
      .map((doc, idx) => {
        const title = doc.metadata.title || `Document ${idx + 1}`
        const source = doc.metadata.source
        const section = doc.metadata.section ? ` - ${doc.metadata.section}` : ''

        return `[${idx + 1}] ${title}${section} (Source: ${source})\n${doc.content}\n`
      })
      .join('\n---\n\n')
  }

  /**
   * Build complete prompt with context
   */
  private buildPrompt(
    query: string,
    context: string,
    systemPrompt?: string
  ): string {
    const system = systemPrompt || AI_CONFIG.systemPrompts.default

    // Truncate context if needed
    const maxContextTokens = AI_CONFIG.rag.maxContextTokens
    const truncatedContext = truncateToTokenLimit(context, maxContextTokens)

    return `${system}

${AI_CONFIG.promptTemplates.rag
  .replace('{context}', truncatedContext)
  .replace('{question}', query)}

Remember to:
- Base your answer on the provided context
- Cite sources using [1], [2], etc.
- Be clear if information is incomplete
- Maintain a helpful, professional tone`
  }

  /**
   * Extract source citations from answer
   */
  private extractSources(
    answer: string,
    documents: RetrievedDocument[]
  ): RAGResponse['sources'] {
    const sources: RAGResponse['sources'] = []

    // Find citation numbers in answer [1], [2], etc.
    const citations = answer.match(/\[(\d+)\]/g) || []
    const citedIndices = new Set(citations.map((c) => parseInt(c.replace(/\D/g, '')) - 1))

    citedIndices.forEach((idx) => {
      if (idx < documents.length) {
        const doc = documents[idx]
        sources.push({
          id: doc.id,
          title: doc.metadata.title || `Document ${idx + 1}`,
          excerpt: doc.content.substring(0, 200) + '...',
          url: doc.metadata.source,
          confidence: doc.score,
        })
      }
    })

    return sources
  }

  // ============================================================================
  // STEP 5: VALIDATION
  // ============================================================================

  /**
   * Validate response for hallucinations and quality
   */
  async validateRAGResponse(response: RAGResponse): Promise<RAGResponse> {
    const validation = validateResponse(
      response.answer,
      response.sources.map((s) => ({ content: s.excerpt }))
    )

    const warnings: string[] = []

    if (validation.hasHallucination) {
      warnings.push(
        'Some claims in the response may not be fully supported by the provided sources.'
      )
    }

    if (validation.hasPII) {
      warnings.push('Response may contain personally identifiable information.')
    }

    if (validation.issues.some((i) => i.severity === 'high' || i.severity === 'critical')) {
      warnings.push('Response contains issues that require review.')
    }

    return {
      ...response,
      factChecked: true,
      warnings: warnings.length > 0 ? warnings : undefined,
    }
  }

  // ============================================================================
  // FULL PIPELINE
  // ============================================================================

  /**
   * Execute complete RAG pipeline
   */
  async query(
    query: string,
    options: {
      model?: string
      systemPrompt?: string
      validate?: boolean
    } = {}
  ): Promise<RAGResponse> {
    console.log('Starting RAG pipeline for query:', query)

    // Step 1: Analyze query
    const intent = await this.analyzeQuery(query)
    console.log('Query intent:', intent.intent, '| Requires context:', intent.requiresContext)

    // Step 2: Retrieve context
    let context = await this.retrieveContext(intent)
    console.log(`Retrieved ${context.documents.length} documents`)

    // Step 3: Rerank documents
    context = await this.rerankDocuments(context, intent.rewrittenQuery)
    console.log(`Reranked to ${context.documents.length} top documents`)

    // Step 4: Generate response
    let response = await this.generateResponse(context, query, options)
    console.log(
      `Generated response in ${response.latency}ms | Tokens: ${response.tokens.total}`
    )

    // Step 5: Validate (optional)
    if (options.validate !== false) {
      response = await this.validateRAGResponse(response)
    }

    return response
  }
}

export const ragPipeline = new RAGPipeline()
