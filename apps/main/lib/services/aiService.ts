/**
 * AI Service Client
 * Type-safe client for AI Service endpoints with streaming support
 */

import { ServiceClient, getServiceUrl } from './serviceClient';
import {
  ChatRequest,
  ChatResponse,
  ConversationHistory,
  AdvisingRecommendationRequest,
  AIAdvisingResponse,
  ComplianceAnalysisRequest,
  ComplianceAnalysisResponse,
  ReportGenerationRequest,
  GeneratedReport,
  RiskPredictionRequest,
  RiskPredictionResponse,
  AgenticTaskRequest,
  AgenticTaskResponse,
  AgenticTaskStatus,
  KnowledgeSearchRequest,
  KnowledgeSearchResponse,
  FeedbackRequest,
  EmbeddingRequest,
  EmbeddingResponse,
  RequestContext,
} from '../types/services';

class AIServiceClient {
  private client: ServiceClient;

  constructor() {
    this.client = new ServiceClient('ai', {
      baseUrl: getServiceUrl('ai'),
      timeout: 60000, // AI requests can be slow
      retries: 1, // Less retries for AI (expensive)
    });
  }

  /**
   * Send chat message (streaming)
   */
  async chat(
    data: ChatRequest,
    context: RequestContext
  ): Promise<ReadableStream<Uint8Array> | ChatResponse> {
    if (data.stream) {
      return this.client.stream('/chat', data, context);
    }
    return this.client.post<ChatResponse>('/chat', data, context);
  }

  /**
   * Get conversation history
   */
  async getConversationHistory(
    conversationId: string,
    context: RequestContext
  ): Promise<ConversationHistory> {
    return this.client.get<ConversationHistory>(
      `/chat/history/${conversationId}`,
      context
    );
  }

  /**
   * AI course recommendations
   */
  async getAdvisingRecommendations(
    data: AdvisingRecommendationRequest,
    context: RequestContext
  ): Promise<AIAdvisingResponse> {
    return this.client.post<AIAdvisingResponse>(
      '/advising/recommend',
      data,
      context
    );
  }

  /**
   * Natural language compliance query
   */
  async analyzeCompliance(
    data: ComplianceAnalysisRequest,
    context: RequestContext
  ): Promise<ComplianceAnalysisResponse> {
    return this.client.post<ComplianceAnalysisResponse>(
      '/compliance/analyze',
      data,
      context
    );
  }

  /**
   * Generate AI-powered report
   */
  async generateReport(
    data: ReportGenerationRequest,
    context: RequestContext
  ): Promise<GeneratedReport> {
    return this.client.post<GeneratedReport>(
      '/report/generate',
      data,
      context
    );
  }

  /**
   * Predict student risk
   */
  async predictRisk(
    data: RiskPredictionRequest,
    context: RequestContext
  ): Promise<RiskPredictionResponse> {
    return this.client.post<RiskPredictionResponse>(
      '/predict/risk',
      data,
      context
    );
  }

  /**
   * Submit agentic workflow
   */
  async submitAgentTask(
    data: AgenticTaskRequest,
    context: RequestContext
  ): Promise<AgenticTaskResponse> {
    return this.client.post<AgenticTaskResponse>('/agent/task', data, context);
  }

  /**
   * Check agent task status
   */
  async getAgentTaskStatus(
    taskId: string,
    context: RequestContext
  ): Promise<AgenticTaskStatus> {
    return this.client.get<AgenticTaskStatus>(
      `/agent/status/${taskId}`,
      context
    );
  }

  /**
   * Semantic search knowledge base
   */
  async searchKnowledge(
    data: KnowledgeSearchRequest,
    context: RequestContext
  ): Promise<KnowledgeSearchResponse> {
    return this.client.post<KnowledgeSearchResponse>(
      '/knowledge/search',
      data,
      context
    );
  }

  /**
   * Submit AI response feedback
   */
  async submitFeedback(
    data: FeedbackRequest,
    context: RequestContext
  ): Promise<{ success: boolean }> {
    return this.client.post<{ success: boolean }>('/feedback', data, context);
  }

  /**
   * Generate embeddings (admin)
   */
  async generateEmbeddings(
    data: EmbeddingRequest,
    context: RequestContext
  ): Promise<EmbeddingResponse> {
    return this.client.post<EmbeddingResponse>(
      '/embeddings/generate',
      data,
      context
    );
  }

  /**
   * Health check
   */
  async health() {
    return this.client.healthCheck();
  }
}

export const aiService = new AIServiceClient();
