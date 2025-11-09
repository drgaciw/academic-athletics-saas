import { streamText, generateText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { anthropic } from '@ai-sdk/anthropic'
import { prisma } from '@aah/database'
import { AIMessage, AIModel, StreamChunk } from '../types'
import { AI_CONFIG, calculateCost } from '../config'
import { countMessageTokens, optimizeMessages } from '../utils/tokens'
import { sanitizeInput, sanitizeOutput, encryptConversation } from '../utils/security'
import { ragPipeline } from './ragPipeline'

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

    // Get or create conversation
    const conversationId = await this.getOrCreateConversation(userId, options.conversationId)

    // Get conversation history
    const history = await this.getConversationHistory(conversationId, 20)

    // Build messages array
    const messages: AIMessage[] = [
      {
        role: 'system',
        content: options.systemPrompt || AI_CONFIG.systemPrompts.default,
      },
      ...history,
      { role: 'user', content: sanitizedMessage },
    ]

    // Optimize messages to fit context window
    const model = options.model || AI_CONFIG.models.default
    const maxTokens = AI_CONFIG.tokenLimits[model] || 8192
    const optimizedMessages = optimizeMessages(messages, maxTokens * 0.8, model)

    // Save user message
    await this.saveMessage(conversationId, 'user', sanitizedMessage, {
      tokenCount: countMessageTokens([{ role: 'user', content: sanitizedMessage }], model),
    })

    // Update conversation title if this is the first message
    if (history.length === 0) {
      await this.updateConversationTitle(conversationId, sanitizedMessage)
    }

    // Get RAG context if needed
    let ragContext = ''
    if (options.useRAG !== false) {
      try {
        const ragResult = await ragPipeline.query(sanitizedMessage, {
          model,
          validate: true,
        })

        if (ragResult.sources.length > 0) {
          ragContext = `\n\nRelevant Information:\n${ragResult.sources
            .map((s, i) => `[${i + 1}] ${s.title}: ${s.excerpt}`)
            .join('\n')}\n`

          // Prepend RAG context to system message
          optimizedMessages[0].content += ragContext
        }
      } catch (error) {
        console.warn('RAG retrieval failed, continuing without context:', error)
      }
    }

    // Get model provider
    const modelProvider = this.getModelProvider(model)

    // Stream response
    const result = await streamText({
      model: modelProvider,
      messages: optimizedMessages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      temperature: options.temperature || 0.7,
      maxTokens: 2000,
      onFinish: async (event) => {
        // Save assistant message
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

        // Log metrics
        console.log(`Chat completed | Model: ${model} | Tokens: ${tokenUsage.total} | Cost: $${cost.toFixed(6)}`)
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

    // Get or create conversation
    const conversationId = await this.getOrCreateConversation(userId, options.conversationId)

    // Get conversation history
    const history = await this.getConversationHistory(conversationId, 20)

    // Build messages array
    const messages: AIMessage[] = [
      {
        role: 'system',
        content: options.systemPrompt || AI_CONFIG.systemPrompts.default,
      },
      ...history,
      { role: 'user', content: sanitizedMessage },
    ]

    // Optimize messages
    const model = options.model || AI_CONFIG.models.default
    const maxTokens = AI_CONFIG.tokenLimits[model] || 8192
    const optimizedMessages = optimizeMessages(messages, maxTokens * 0.8, model)

    // Save user message
    await this.saveMessage(conversationId, 'user', sanitizedMessage)

    // Get RAG context if needed
    if (options.useRAG !== false) {
      try {
        const ragResult = await ragPipeline.query(sanitizedMessage, { model })
        if (ragResult.sources.length > 0) {
          const ragContext = `\n\nRelevant Information:\n${ragResult.sources
            .map((s, i) => `[${i + 1}] ${s.title}: ${s.excerpt}`)
            .join('\n')}\n`
          optimizedMessages[0].content += ragContext
        }
      } catch (error) {
        console.warn('RAG retrieval failed:', error)
      }
    }

    // Get model provider
    const modelProvider = this.getModelProvider(model)

    // Generate response
    const result = await generateText({
      model: modelProvider,
      messages: optimizedMessages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      temperature: options.temperature || 0.7,
      maxTokens: 2000,
    })

    const response = result.text

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
