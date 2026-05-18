import { streamText, generateText, type CoreMessage } from 'ai'
import { openai } from '@ai-sdk/openai'
import { anthropic } from '@ai-sdk/anthropic'
import { prisma } from '@aah/database'
import { AIMessage, AIModel } from '../types'
import { AI_CONFIG, calculateCost } from '../config'
import { countMessageTokens, optimizeMessages } from '../utils/tokens'
import { sanitizeInput, sanitizeOutput, encryptConversation } from '../utils/security'
import { ragPipeline } from './ragPipeline'
import { isEligibilityIntent } from './eligibilityIntent'
import { eligibilityResponseGuard } from './eligibilityResponseGuard'
import { loadStudentEligibilityGate, resolveDbUserId } from './studentEligibilityContext'

export class ChatService {
  /**
   * Get or create conversation
   */
  async getOrCreateConversation(userId: string, conversationId?: string): Promise<string> {
    if (conversationId) {
      const existing = await prisma.conversation.findUnique({
        where: { id: conversationId },
      })

      if (existing && existing.userId === userId) {
        return conversationId
      }
    }

    // Create new conversation
    const conversation = await prisma.conversation.create({
      data: {
        userId,
        status: 'active',
      },
    })

    return conversation.id
  }

  /**
   * Get conversation history
   */
  async getConversationHistory(
    conversationId: string,
    limit: number = 50
  ): Promise<AIMessage[]> {
    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { timestamp: 'desc' },
      take: limit,
    })

    return messages.reverse().map((msg) => ({
      role: msg.role as AIMessage['role'],
      content: AI_CONFIG.security.encryptConversations
        ? sanitizeOutput(msg.content)
        : msg.content,
    }))
  }

  /**
   * Save message to database
   */
  private async saveMessage(
    conversationId: string,
    role: AIMessage['role'],
    content: string,
    metadata?: {
      model?: string
      tokenCount?: number
      cost?: number
    }
  ): Promise<string> {
    const encryptedContent = AI_CONFIG.security.encryptConversations
      ? encryptConversation(content)
      : content

    const message = await prisma.message.create({
      data: {
        conversationId,
        role,
        content: encryptedContent,
        tokenCount: metadata?.tokenCount,
        modelUsed: metadata?.model,
      },
    })

    return message.id
  }

  /**
   * Update conversation title based on first message
   */
  private async updateConversationTitle(
    conversationId: string,
    firstMessage: string
  ): Promise<void> {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    })

    if (conversation && !conversation.title) {
      // Generate a title from the first message
      const title = firstMessage.substring(0, 60).trim()
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { title },
      })
    }
  }

  /**
   * Select model provider and instance
   */
  private getModelProvider(model: AIModel) {
    if (model.startsWith('claude')) {
      return anthropic(model)
    }
    return openai(model)
  }

  /** Maps optimized chat messages to CoreMessage for the Vercel AI SDK. */
  private toCoreMessages(optimized: AIMessage[]): CoreMessage[] {
    return optimized.map((m) => ({
      role: m.role as 'system' | 'user' | 'assistant',
      content: m.content,
    })) as CoreMessage[]
  }

  private async attachRagContext(
    optimizedMessages: AIMessage[],
    sanitizedMessage: string,
    model: AIModel,
    useRag: boolean
  ): Promise<void> {
    if (useRag === false) return
    try {
      const ragResult = await ragPipeline.query(sanitizedMessage, {
        model,
        validate: true,
      })

      if (ragResult.sources.length > 0) {
        const ragContext = `\n\nRelevant Information:\n${ragResult.sources
          .map((s, i) => `[${i + 1}] ${s.title}: ${s.excerpt}`)
          .join('\n')}\n`
        optimizedMessages[0].content += ragContext
      }
    } catch (error) {
      console.warn('RAG retrieval failed, continuing without context:', error)
    }
  }

  /**
   * UTF-8 stream of plain text for the BFF route (decodes per chunk).
   */
  private static textToUtf8Stream(text: string): ReadableStream<Uint8Array> {
    const encoder = new TextEncoder()
    const chunkSize = 64
    return new ReadableStream({
      start(controller) {
        for (let i = 0; i < text.length; i += chunkSize) {
          controller.enqueue(encoder.encode(text.slice(i, i + chunkSize)))
        }
        controller.close()
      },
    })
  }

  /**
   * Chat with streaming response
   */
  async chat(
    userId: string,
    message: string,
    options: {
      conversationId?: string
      model?: AIModel
      useRAG?: boolean
      systemPrompt?: string
      temperature?: number
      /** From BFF `X-User-Role` — drives PRD v2.2 student eligibility policy. */
      userRole?: string
      correlationId?: string
    } = {}
  ) {
    // Sanitize input
    const sanitizedMessage = sanitizeInput(message)

    // Validate message length
    if (sanitizedMessage.length > AI_CONFIG.security.maxMessageLength) {
      throw new Error(
        `Message too long. Maximum ${AI_CONFIG.security.maxMessageLength} characters.`
      )
    }

    const dbUserId = await resolveDbUserId(userId)
    const effectiveUserId = dbUserId ?? userId

    const gate =
      dbUserId && options.userRole === 'STUDENT'
        ? await loadStudentEligibilityGate(dbUserId)
        : { hasRecordedComplianceReview: false, snapshotLines: [] as string[] }

    // Get or create conversation
    const conversationId = await this.getOrCreateConversation(effectiveUserId, options.conversationId)

    // Get conversation history
    const history = await this.getConversationHistory(conversationId, 20)

    let systemContent = options.systemPrompt || AI_CONFIG.systemPrompts.default
    if (options.userRole === 'STUDENT' && isEligibilityIntent(sanitizedMessage)) {
      systemContent = `${systemContent}\n\n${AI_CONFIG.systemPrompts.studentEligibilityPreliminary}\n\nStudent snapshot (non-authoritative):\n${gate.snapshotLines.join('\n')}`
    }

    // Build messages array
    const messages: AIMessage[] = [
      {
        role: 'system',
        content: systemContent,
      },
      ...history,
      { role: 'user', content: sanitizedMessage },
    ]

    // Optimize messages to fit context window
    const model = options.model || AI_CONFIG.models.default
    const maxTokens = AI_CONFIG.tokenLimits[model] || 8192
    const optimizedMessages = optimizeMessages(messages, maxTokens * 0.8, model) as AIMessage[]

    // Save user message
    await this.saveMessage(conversationId, 'user', sanitizedMessage, {
      tokenCount: countMessageTokens([{ role: 'user', content: sanitizedMessage }], model),
    })

    // Update conversation title if this is the first message
    if (history.length === 0) {
      await this.updateConversationTitle(conversationId, sanitizedMessage)
    }

    await this.attachRagContext(optimizedMessages, sanitizedMessage, model, options.useRAG !== false)

    // Get model provider
    const modelProvider = this.getModelProvider(model)

    // All STUDENT traffic: full response + guard before any bytes hit the client (PRD v2.2 / no live token leak).
    const bufferStudentResponse = options.userRole === 'STUDENT'

    if (bufferStudentResponse) {
      const temperature =
        isEligibilityIntent(sanitizedMessage) ? options.temperature ?? 0.45 : options.temperature || 0.7
      const gen = await generateText({
        model: modelProvider,
        messages: this.toCoreMessages(optimizedMessages),
        temperature,
        maxTokens: 2000,
      })

      const guarded = eligibilityResponseGuard(gen.text, {
        userRole: 'STUDENT',
        hasRecordedComplianceReview: gate.hasRecordedComplianceReview,
      })
      const assistantMessage = sanitizeOutput(guarded.text)

      const tokenUsage = {
        prompt: gen.usage.promptTokens,
        completion: gen.usage.completionTokens,
        total: gen.usage.totalTokens,
      }
      const cost = calculateCost(model, tokenUsage.prompt, tokenUsage.completion)

      await this.saveMessage(conversationId, 'assistant', assistantMessage, {
        model,
        tokenCount: tokenUsage.total,
        cost,
      })

      const corr = options.correlationId ? ` | corr=${options.correlationId}` : ''
      console.log(
        `Chat completed (student buffered + guard) | Model: ${model} | Tokens: ${tokenUsage.total} | Cost: $${cost.toFixed(6)}${corr}`
      )

      return {
        conversationId,
        stream: ChatService.textToUtf8Stream(assistantMessage),
        model,
      }
    }

    // Non-student: token streaming
    const result = await streamText({
      model: modelProvider,
      messages: this.toCoreMessages(optimizedMessages),
      temperature: options.temperature || 0.7,
      maxTokens: 2000,
      onFinish: async (event) => {
        const assistantMessage = event.text

        const tokenUsage = {
          prompt: event.usage.promptTokens,
          completion: event.usage.completionTokens,
          total: event.usage.totalTokens,
        }

        const cost = calculateCost(model, tokenUsage.prompt, tokenUsage.completion)

        await this.saveMessage(conversationId, 'assistant', assistantMessage, {
          model,
          tokenCount: tokenUsage.total,
          cost,
        })

        const corr = options.correlationId ? ` | corr=${options.correlationId}` : ''
        console.log(`Chat completed | Model: ${model} | Tokens: ${tokenUsage.total} | Cost: $${cost.toFixed(6)}${corr}`)
      },
    })

    return {
      conversationId,
      stream: result.toAIStream(),
      model,
    }
  }

  /**
   * Chat without streaming (for API calls)
   */
  async chatSync(
    userId: string,
    message: string,
    options: {
      conversationId?: string
      model?: AIModel
      useRAG?: boolean
      systemPrompt?: string
      temperature?: number
      userRole?: string
      correlationId?: string
    } = {}
  ): Promise<{
    conversationId: string
    response: string
    model: string
    tokenUsage: {
      prompt: number
      completion: number
      total: number
    }
    cost: number
  }> {
    // Sanitize input
    const sanitizedMessage = sanitizeInput(message)

    const dbUserId = await resolveDbUserId(userId)
    const effectiveUserId = dbUserId ?? userId

    const gate =
      dbUserId && options.userRole === 'STUDENT'
        ? await loadStudentEligibilityGate(dbUserId)
        : { hasRecordedComplianceReview: false, snapshotLines: [] as string[] }

    // Get or create conversation
    const conversationId = await this.getOrCreateConversation(effectiveUserId, options.conversationId)

    // Get conversation history
    const history = await this.getConversationHistory(conversationId, 20)

    let systemContent = options.systemPrompt || AI_CONFIG.systemPrompts.default
    if (options.userRole === 'STUDENT' && isEligibilityIntent(sanitizedMessage)) {
      systemContent = `${systemContent}\n\n${AI_CONFIG.systemPrompts.studentEligibilityPreliminary}\n\nStudent snapshot (non-authoritative):\n${gate.snapshotLines.join('\n')}`
    }

    // Build messages array
    const messages: AIMessage[] = [
      {
        role: 'system',
        content: systemContent,
      },
      ...history,
      { role: 'user', content: sanitizedMessage },
    ]

    // Optimize messages
    const model = options.model || AI_CONFIG.models.default
    const maxTokens = AI_CONFIG.tokenLimits[model] || 8192
    const optimizedMessages = optimizeMessages(messages, maxTokens * 0.8, model) as AIMessage[]

    // Save user message
    await this.saveMessage(conversationId, 'user', sanitizedMessage)

    await this.attachRagContext(optimizedMessages, sanitizedMessage, model, options.useRAG !== false)

    // Get model provider
    const modelProvider = this.getModelProvider(model)

    const temperature =
      options.userRole === 'STUDENT' && isEligibilityIntent(sanitizedMessage)
        ? options.temperature ?? 0.45
        : options.temperature || 0.7

    // Generate response
    const result = await generateText({
      model: modelProvider,
      messages: this.toCoreMessages(optimizedMessages),
      temperature,
      maxTokens: 2000,
    })

    let response = result.text
    if (options.userRole === 'STUDENT') {
      const guarded = eligibilityResponseGuard(response, {
        userRole: 'STUDENT',
        hasRecordedComplianceReview: gate.hasRecordedComplianceReview,
      })
      response = guarded.text
    }

    // Calculate usage and cost
    const tokenUsage = {
      prompt: result.usage.promptTokens,
      completion: result.usage.completionTokens,
      total: result.usage.totalTokens,
    }

    const cost = calculateCost(model, tokenUsage.prompt, tokenUsage.completion)

    // Save assistant message
    await this.saveMessage(conversationId, 'assistant', response, {
      model,
      tokenCount: tokenUsage.total,
      cost,
    })

    return {
      conversationId,
      response: sanitizeOutput(response),
      model,
      tokenUsage,
      cost,
    }
  }

  /**
   * Delete conversation
   */
  async deleteConversation(conversationId: string, userId: string): Promise<void> {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    })

    if (!conversation || conversation.userId !== userId) {
      throw new Error('Conversation not found or access denied')
    }

    await prisma.conversation.update({
      where: { id: conversationId },
      data: { status: 'deleted' },
    })
  }

  /**
   * Get user's conversations
   */
  async getUserConversations(
    userId: string,
    limit: number = 20
  ): Promise<
    Array<{
      id: string
      title: string | null
      createdAt: Date
      messageCount: number
    }>
  > {
    const conversations = await prisma.conversation.findMany({
      where: {
        userId,
        status: 'active',
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        _count: {
          select: { messages: true },
        },
      },
    })

    return conversations.map((conv) => ({
      id: conv.id,
      title: conv.title,
      createdAt: conv.createdAt,
      messageCount: conv._count.messages,
    }))
  }
}

export const chatService = new ChatService()
