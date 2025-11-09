/**
 * AIService Unit Tests
 * Tests for the AI Service client with streaming support
 */

import { aiService } from '../aiService';
import { ServiceClient } from '../serviceClient';
import { RequestContext, UserRole } from '../../types/services/common';

// Mock ServiceClient
jest.mock('../serviceClient');

describe('AIService', () => {
  const mockContext: RequestContext = {
    userId: 'user-123',
    clerkId: 'clerk-123',
    role: UserRole.STUDENT,
    correlationId: 'corr-123',
    timestamp: new Date(),
  };

  let mockPost: jest.Mock;
  let mockGet: jest.Mock;
  let mockStream: jest.Mock;
  let mockHealthCheck: jest.Mock;

  beforeEach(() => {
    mockPost = jest.fn();
    mockGet = jest.fn();
    mockStream = jest.fn();
    mockHealthCheck = jest.fn();

    (ServiceClient as jest.Mock).mockImplementation(() => ({
      post: mockPost,
      get: mockGet,
      stream: mockStream,
      healthCheck: mockHealthCheck,
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('chat', () => {
    it('should send chat message without streaming', async () => {
      const chatRequest = {
        message: 'What are my eligibility requirements?',
        conversationId: 'conv-123',
        stream: false,
      };

      const mockResponse = {
        message: 'You need to maintain a 2.3 GPA...',
        conversationId: 'conv-123',
        messageId: 'msg-456',
      };

      mockPost.mockResolvedValueOnce(mockResponse);

      const result = await aiService.chat(chatRequest, mockContext);

      expect(result).toEqual(mockResponse);
      expect(mockPost).toHaveBeenCalledWith('/chat', chatRequest, mockContext);
    });

    it('should send chat message with streaming', async () => {
      const chatRequest = {
        message: 'Tell me about NCAA rules',
        conversationId: 'conv-123',
        stream: true,
      };

      const mockStream = new ReadableStream();
      mockStream.mockResolvedValueOnce(mockStream);

      const result = await aiService.chat(chatRequest, mockContext);

      expect(result).toBe(mockStream);
      expect(mockStream).toHaveBeenCalledWith('/chat', chatRequest, mockContext);
    });

    it('should handle chat errors', async () => {
      const chatRequest = {
        message: '',
        conversationId: 'conv-123',
        stream: false,
      };

      mockPost.mockRejectedValueOnce(new Error('Empty message'));

      await expect(
        aiService.chat(chatRequest, mockContext)
      ).rejects.toThrow('Empty message');
    });
  });

  describe('getConversationHistory', () => {
    it('should retrieve conversation history', async () => {
      const conversationId = 'conv-123';
      const mockHistory = {
        conversationId,
        messages: [
          {
            id: 'msg-1',
            role: 'user',
            content: 'Hello',
            timestamp: new Date().toISOString(),
          },
          {
            id: 'msg-2',
            role: 'assistant',
            content: 'Hi! How can I help?',
            timestamp: new Date().toISOString(),
          },
        ],
      };

      mockGet.mockResolvedValueOnce(mockHistory);

      const result = await aiService.getConversationHistory(conversationId, mockContext);

      expect(result).toEqual(mockHistory);
      expect(result.messages).toHaveLength(2);
      expect(mockGet).toHaveBeenCalledWith(`/chat/history/${conversationId}`, mockContext);
    });
  });

  describe('getAdvisingRecommendations', () => {
    it('should get AI course recommendations', async () => {
      const recommendationRequest = {
        studentId: 'student-123',
        context: 'Need courses for next semester',
        preferences: ['morning classes', 'avoid Fridays'],
      };

      const mockRecommendations = {
        recommendations: [
          {
            courseId: 'CS301',
            reason: 'Required for major progression',
            confidence: 0.95,
          },
          {
            courseId: 'MATH301',
            reason: 'Prerequisite for advanced courses',
            confidence: 0.88,
          },
        ],
        explanation: 'Based on your major requirements and preferences...',
      };

      mockPost.mockResolvedValueOnce(mockRecommendations);

      const result = await aiService.getAdvisingRecommendations(
        recommendationRequest,
        mockContext
      );

      expect(result).toEqual(mockRecommendations);
      expect(result.recommendations).toHaveLength(2);
      expect(mockPost).toHaveBeenCalledWith('/advising/recommend', recommendationRequest, mockContext);
    });
  });

  describe('analyzeCompliance', () => {
    it('should analyze compliance with natural language', async () => {
      const analysisRequest = {
        query: 'Am I eligible to compete this semester?',
        studentId: 'student-123',
      };

      const mockAnalysis = {
        eligible: true,
        explanation: 'You meet all NCAA Division I requirements...',
        requirements: {
          gpa: { met: true, value: 3.2, threshold: 2.3 },
          credits: { met: true, value: 30, threshold: 24 },
        },
      };

      mockPost.mockResolvedValueOnce(mockAnalysis);

      const result = await aiService.analyzeCompliance(analysisRequest, mockContext);

      expect(result).toEqual(mockAnalysis);
      expect(result.eligible).toBe(true);
      expect(mockPost).toHaveBeenCalledWith('/compliance/analyze', analysisRequest, mockContext);
    });
  });

  describe('generateReport', () => {
    it('should generate AI-powered report', async () => {
      const reportRequest = {
        type: 'progress',
        studentId: 'student-123',
        semester: 'Fall 2024',
      };

      const mockReport = {
        reportId: 'report-123',
        content: 'Student has shown excellent progress...',
        sections: [
          { title: 'Academic Performance', content: '...' },
          { title: 'Attendance', content: '...' },
        ],
        generatedAt: new Date().toISOString(),
      };

      mockPost.mockResolvedValueOnce(mockReport);

      const result = await aiService.generateReport(reportRequest, mockContext);

      expect(result).toEqual(mockReport);
      expect(result.sections).toHaveLength(2);
      expect(mockPost).toHaveBeenCalledWith('/report/generate', reportRequest, mockContext);
    });
  });

  describe('predictRisk', () => {
    it('should predict student risk', async () => {
      const riskRequest = {
        studentId: 'student-123',
        timeframe: 'semester',
      };

      const mockPrediction = {
        studentId: 'student-123',
        riskLevel: 'low',
        riskScore: 0.25,
        factors: [
          { name: 'gpa_trend', impact: 0.1, direction: 'positive' },
          { name: 'attendance', impact: 0.15, direction: 'neutral' },
        ],
        recommendations: ['Continue current trajectory'],
      };

      mockPost.mockResolvedValueOnce(mockPrediction);

      const result = await aiService.predictRisk(riskRequest, mockContext);

      expect(result).toEqual(mockPrediction);
      expect(result.riskLevel).toBe('low');
      expect(mockPost).toHaveBeenCalledWith('/predict/risk', riskRequest, mockContext);
    });

    it('should identify high-risk students', async () => {
      const riskRequest = {
        studentId: 'student-456',
        timeframe: 'semester',
      };

      const mockPrediction = {
        studentId: 'student-456',
        riskLevel: 'high',
        riskScore: 0.85,
        factors: [
          { name: 'gpa_trend', impact: 0.4, direction: 'negative' },
          { name: 'attendance', impact: 0.45, direction: 'negative' },
        ],
        recommendations: ['Immediate intervention required', 'Schedule advisor meeting'],
      };

      mockPost.mockResolvedValueOnce(mockPrediction);

      const result = await aiService.predictRisk(riskRequest, mockContext);

      expect(result.riskLevel).toBe('high');
      expect(result.riskScore).toBeGreaterThan(0.8);
    });
  });

  describe('submitAgentTask', () => {
    it('should submit agentic workflow', async () => {
      const taskRequest = {
        type: 'schedule_optimization',
        parameters: {
          studentId: 'student-123',
          constraints: ['no_early_morning', 'athletic_schedule'],
        },
      };

      const mockTaskResponse = {
        taskId: 'task-123',
        status: 'queued',
        estimatedCompletion: new Date().toISOString(),
      };

      mockPost.mockResolvedValueOnce(mockTaskResponse);

      const result = await aiService.submitAgentTask(taskRequest, mockContext);

      expect(result).toEqual(mockTaskResponse);
      expect(result.status).toBe('queued');
      expect(mockPost).toHaveBeenCalledWith('/agent/task', taskRequest, mockContext);
    });
  });

  describe('getAgentTaskStatus', () => {
    it('should check agent task status', async () => {
      const taskId = 'task-123';
      const mockStatus = {
        taskId,
        status: 'completed',
        progress: 100,
        result: {
          optimizedSchedule: ['CS301', 'MATH301', 'ENG201'],
        },
      };

      mockGet.mockResolvedValueOnce(mockStatus);

      const result = await aiService.getAgentTaskStatus(taskId, mockContext);

      expect(result).toEqual(mockStatus);
      expect(result.status).toBe('completed');
      expect(mockGet).toHaveBeenCalledWith(`/agent/status/${taskId}`, mockContext);
    });

    it('should handle in-progress tasks', async () => {
      const taskId = 'task-456';
      const mockStatus = {
        taskId,
        status: 'processing',
        progress: 45,
      };

      mockGet.mockResolvedValueOnce(mockStatus);

      const result = await aiService.getAgentTaskStatus(taskId, mockContext);

      expect(result.status).toBe('processing');
      expect(result.progress).toBeLessThan(100);
    });
  });

  describe('searchKnowledge', () => {
    it('should search knowledge base semantically', async () => {
      const searchRequest = {
        query: 'NCAA eligibility requirements',
        limit: 5,
      };

      const mockResults = {
        results: [
          {
            id: 'doc-1',
            title: 'NCAA Division I Eligibility',
            content: 'Student-athletes must maintain...',
            relevance: 0.95,
          },
          {
            id: 'doc-2',
            title: 'GPA Requirements',
            content: 'Minimum 2.3 GPA required...',
            relevance: 0.88,
          },
        ],
      };

      mockPost.mockResolvedValueOnce(mockResults);

      const result = await aiService.searchKnowledge(searchRequest, mockContext);

      expect(result).toEqual(mockResults);
      expect(result.results).toHaveLength(2);
      expect(mockPost).toHaveBeenCalledWith('/knowledge/search', searchRequest, mockContext);
    });
  });

  describe('submitFeedback', () => {
    it('should submit AI response feedback', async () => {
      const feedbackRequest = {
        messageId: 'msg-123',
        rating: 5,
        comment: 'Very helpful response',
      };

      mockPost.mockResolvedValueOnce({ success: true });

      const result = await aiService.submitFeedback(feedbackRequest, mockContext);

      expect(result.success).toBe(true);
      expect(mockPost).toHaveBeenCalledWith('/feedback', feedbackRequest, mockContext);
    });

    it('should handle negative feedback', async () => {
      const feedbackRequest = {
        messageId: 'msg-456',
        rating: 1,
        comment: 'Incorrect information',
      };

      mockPost.mockResolvedValueOnce({ success: true });

      const result = await aiService.submitFeedback(feedbackRequest, mockContext);

      expect(result.success).toBe(true);
    });
  });

  describe('generateEmbeddings', () => {
    it('should generate embeddings (admin)', async () => {
      const embeddingRequest = {
        texts: ['NCAA rules document', 'Eligibility guidelines'],
        model: 'text-embedding-3-large',
      };

      const mockEmbeddings = {
        embeddings: [
          { text: 'NCAA rules document', vector: [0.1, 0.2, 0.3] },
          { text: 'Eligibility guidelines', vector: [0.4, 0.5, 0.6] },
        ],
      };

      mockPost.mockResolvedValueOnce(mockEmbeddings);

      const result = await aiService.generateEmbeddings(embeddingRequest, mockContext);

      expect(result).toEqual(mockEmbeddings);
      expect(result.embeddings).toHaveLength(2);
      expect(mockPost).toHaveBeenCalledWith('/embeddings/generate', embeddingRequest, mockContext);
    });
  });

  describe('health', () => {
    it('should check service health', async () => {
      mockHealthCheck.mockResolvedValueOnce({ status: 'healthy' });

      const result = await aiService.health();

      expect(result).toEqual({ status: 'healthy' });
      expect(mockHealthCheck).toHaveBeenCalled();
    });
  });
});
