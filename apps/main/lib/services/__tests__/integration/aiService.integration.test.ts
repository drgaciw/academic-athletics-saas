/**
 * AI Service Integration Tests
 *
 * Tests the full AI service flow including chat, recommendations,
 * risk prediction, and streaming responses.
 */

import { AIService, aiService } from '../../aiService';
import { UserRole, type RequestContext } from '../../../middleware/authentication';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('AIService Integration Tests', () => {
  const baseContext: RequestContext = {
    userId: 'user-123',
    clerkId: 'clerk_abc123',
    role: UserRole.STUDENT,
    correlationId: 'corr-ai-test-123',
    timestamp: new Date('2024-01-15T10:00:00Z'),
  };

  const advisorContext: RequestContext = {
    ...baseContext,
    userId: 'advisor-123',
    role: UserRole.ADVISOR,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Chat Flow - Non-Streaming', () => {
    it('should send a chat message and receive a complete response', async () => {
      const chatRequest = {
        message: 'What classes should I take next semester to stay eligible?',
        context: {
          studentId: 'student-123',
          currentGpa: 3.2,
          sport: 'BASKETBALL',
          creditsCompleted: 60,
        },
        stream: false,
        model: 'gpt-4' as const,
      };

      const expectedResponse = {
        conversationId: 'conv-new-123',
        messageId: 'msg-456',
        content: 'Based on your current academic standing, I recommend...',
        sources: [
          { title: 'NCAA Eligibility Guide', url: 'https://ncaa.org/eligibility' },
        ],
        suggestedFollowUps: [
          'What GPA do I need to maintain?',
          'Can I take summer classes?',
        ],
        tokenCount: 250,
        model: 'gpt-4',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => expectedResponse,
      });

      const result = await aiService.chat(chatRequest, baseContext);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];

      expect(url).toContain('/chat');
      expect(options.method).toBe('POST');

      const body = JSON.parse(options.body);
      expect(body.message).toBe(chatRequest.message);
      expect(body.stream).toBe(false);
      expect(body.model).toBe('gpt-4');

      expect(result.content).toContain('Based on your current academic standing');
      expect(result.suggestedFollowUps).toHaveLength(2);
    });

    it('should continue an existing conversation', async () => {
      const chatRequest = {
        conversationId: 'conv-existing-123',
        message: 'What about summer school options?',
        stream: false,
      };

      const expectedResponse = {
        conversationId: 'conv-existing-123',
        messageId: 'msg-789',
        content: 'Summer school is a great option. Here are your choices...',
        tokenCount: 180,
        model: 'gpt-4',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => expectedResponse,
      });

      const result = await aiService.chat(chatRequest, baseContext);

      const [, options] = mockFetch.mock.calls[0];
      const body = JSON.parse(options.body);

      expect(body.conversationId).toBe('conv-existing-123');
      expect(result.conversationId).toBe('conv-existing-123');
    });

    it('should handle chat rate limiting', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        headers: new Headers({
          'content-type': 'application/json',
          'retry-after': '60',
        }),
        json: async () => ({
          error: {
            code: 'RATE_LIMITED',
            message: 'Too many requests. Please wait before trying again.',
          },
        }),
      });

      await expect(
        aiService.chat({ message: 'test', stream: false }, baseContext)
      ).rejects.toMatchObject({
        statusCode: 429,
      });
    });

    it('should handle AI service unavailable', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          error: {
            code: 'SERVICE_UNAVAILABLE',
            message: 'AI service is temporarily unavailable',
          },
        }),
      });

      await expect(
        aiService.chat({ message: 'test', stream: false }, baseContext)
      ).rejects.toMatchObject({
        statusCode: 503,
      });
    });
  });

  describe('Chat Flow - Streaming', () => {
    it('should stream chat response chunks', async () => {
      const chatRequest = {
        message: 'Explain NCAA eligibility requirements',
        stream: true,
      };

      // Create a mock ReadableStream
      const chunks = [
        'The NCAA ',
        'eligibility requirements ',
        'include maintaining ',
        'a minimum GPA...',
      ];

      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          for (const chunk of chunks) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: chunk })}\n\n`));
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        },
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'text/event-stream' }),
        body: stream,
      });

      const result = await aiService.streamChat(chatRequest, baseContext);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];

      expect(url).toContain('/chat');
      expect(options.method).toBe('POST');

      // Verify stream is returned
      expect(result).toBeDefined();
      expect(result.body).toBeDefined();
    });
  });

  describe('Conversation History', () => {
    it('should retrieve conversation history', async () => {
      const expectedHistory = {
        conversationId: 'conv-123',
        messages: [
          {
            id: 'msg-1',
            role: 'user',
            content: 'What classes should I take?',
            timestamp: '2024-01-15T09:00:00Z',
          },
          {
            id: 'msg-2',
            role: 'assistant',
            content: 'Based on your major, I recommend...',
            timestamp: '2024-01-15T09:01:00Z',
          },
        ],
        createdAt: '2024-01-15T09:00:00Z',
        updatedAt: '2024-01-15T09:01:00Z',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => expectedHistory,
      });

      const result = await aiService.getConversationHistory('conv-123', baseContext);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url] = mockFetch.mock.calls[0];

      expect(url).toContain('/chat/history/conv-123');
      expect(result.messages).toHaveLength(2);
    });

    it('should handle conversation not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          error: {
            code: 'CONVERSATION_NOT_FOUND',
            message: 'Conversation does not exist',
          },
        }),
      });

      await expect(
        aiService.getConversationHistory('nonexistent', baseContext)
      ).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });

  describe('Course Recommendations', () => {
    it('should get AI-powered course recommendations', async () => {
      const recommendRequest = {
        studentId: 'student-123',
        termId: 'fall-2024',
        constraints: {
          maxCredits: 18,
          excludeCourses: ['MATH101'],
          preferredTimes: ['morning'],
        },
      };

      const expectedResponse = {
        recommendations: [
          {
            courseId: 'course-1',
            courseCode: 'ECON201',
            courseName: 'Microeconomics',
            credits: 3,
            rationale: 'Fulfills social science requirement and fits your schedule',
            confidence: 0.92,
            eligibilityImpact: 'POSITIVE',
          },
          {
            courseId: 'course-2',
            courseCode: 'COMM150',
            courseName: 'Public Speaking',
            credits: 3,
            rationale: 'High success rate for student-athletes, flexible schedule',
            confidence: 0.88,
            eligibilityImpact: 'NEUTRAL',
          },
        ],
        totalRecommendedCredits: 15,
        gpaProjection: 3.3,
        eligibilityAssessment: 'On track to maintain eligibility',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => expectedResponse,
      });

      const result = await aiService.getAdvisingRecommendations(recommendRequest, advisorContext);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];

      expect(url).toContain('/advising/recommend');
      expect(options.method).toBe('POST');

      expect(result.recommendations).toHaveLength(2);
      expect(result.recommendations[0].confidence).toBeGreaterThan(0.8);
    });

    it('should handle no recommendations available', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          recommendations: [],
          message: 'No suitable courses found matching your criteria',
        }),
      });

      const result = await aiService.getAdvisingRecommendations(
        { studentId: 'student-123', termId: 'fall-2024' },
        advisorContext
      );

      expect(result.recommendations).toHaveLength(0);
    });
  });

  describe('Risk Prediction', () => {
    it('should predict student academic risk', async () => {
      const riskRequest = {
        studentId: 'student-123',
        timeframe: 'CURRENT_TERM' as const,
        includeFactors: true,
      };

      const expectedResponse = {
        studentId: 'student-123',
        riskLevel: 'MEDIUM' as const,
        riskScore: 0.45,
        predictions: [
          {
            category: 'GPA_DECLINE',
            probability: 0.35,
            impact: 'Could fall below 2.3 minimum',
          },
          {
            category: 'CREDIT_SHORTFALL',
            probability: 0.25,
            impact: 'May not meet 6 credit minimum',
          },
        ],
        riskFactors: [
          { factor: 'Missed 3 study hall sessions', weight: 0.3 },
          { factor: 'C- in required course', weight: 0.25 },
          { factor: 'Travel schedule conflict', weight: 0.15 },
        ],
        recommendations: [
          'Schedule tutoring for MATH201',
          'Meet with academic advisor this week',
          'Prioritize study hall attendance',
        ],
        confidence: 0.82,
        modelVersion: 'risk-v2.1.0',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => expectedResponse,
      });

      const result = await aiService.predictRisk(riskRequest, advisorContext);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];

      expect(url).toContain('/predict/risk');
      expect(options.method).toBe('POST');

      expect(result.riskLevel).toBe('MEDIUM');
      expect(result.riskScore).toBeCloseTo(0.45);
      expect(result.riskFactors).toBeDefined();
      expect(result.recommendations).toHaveLength(3);
    });

    it('should handle low-risk student', async () => {
      const expectedResponse = {
        studentId: 'student-456',
        riskLevel: 'LOW',
        riskScore: 0.12,
        predictions: [],
        recommendations: ['Continue current study habits'],
        confidence: 0.95,
        modelVersion: 'risk-v2.1.0',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => expectedResponse,
      });

      const result = await aiService.predictRisk(
        { studentId: 'student-456', timeframe: 'CURRENT_TERM' },
        advisorContext
      );

      expect(result.riskLevel).toBe('LOW');
      expect(result.riskScore).toBeLessThan(0.2);
    });

    it('should handle high-risk student with urgent recommendations', async () => {
      const expectedResponse = {
        studentId: 'student-789',
        riskLevel: 'HIGH',
        riskScore: 0.78,
        predictions: [
          { category: 'INELIGIBILITY', probability: 0.65, impact: 'May lose eligibility' },
        ],
        recommendations: [
          'URGENT: Schedule meeting with compliance officer',
          'Enroll in academic recovery program',
          'Consider course withdrawal deadline',
        ],
        confidence: 0.88,
        modelVersion: 'risk-v2.1.0',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => expectedResponse,
      });

      const result = await aiService.predictRisk(
        { studentId: 'student-789', timeframe: 'CURRENT_TERM' },
        advisorContext
      );

      expect(result.riskLevel).toBe('HIGH');
      expect(result.riskScore).toBeGreaterThan(0.7);
      expect(result.recommendations[0]).toContain('URGENT');
    });
  });

  describe('Compliance Analysis', () => {
    it('should analyze compliance question in natural language', async () => {
      const analysisRequest = {
        query: 'Can this student play in the tournament if they have a 2.2 GPA?',
        studentId: 'student-123',
        includeRuleReferences: true,
      };

      const expectedResponse = {
        answer:
          'Based on NCAA Division I rules, a 2.2 GPA meets the minimum 2.0 requirement...',
        ruleReferences: [
          { ruleId: 'NCAA-14.4.3.1', description: 'Minimum GPA requirements' },
        ],
        eligibilityStatus: 'CONDITIONALLY_ELIGIBLE',
        warnings: ['GPA is close to minimum threshold'],
        confidence: 0.91,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => expectedResponse,
      });

      const result = await aiService.analyzeCompliance(analysisRequest, advisorContext);

      expect(result.ruleReferences).toHaveLength(1);
      expect(result.eligibilityStatus).toBe('CONDITIONALLY_ELIGIBLE');
    });
  });

  describe('Agentic Workflows', () => {
    it('should submit a complex agentic task', async () => {
      const taskRequest = {
        taskType: 'COMPREHENSIVE_REVIEW',
        studentId: 'student-123',
        parameters: {
          includeAcademicAnalysis: true,
          includeComplianceCheck: true,
          includeScheduleOptimization: true,
        },
      };

      const expectedResponse = {
        taskId: 'task-abc123',
        status: 'PENDING',
        estimatedCompletion: '2024-01-15T10:05:00Z',
        message: 'Task submitted successfully. Check status for updates.',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 202,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => expectedResponse,
      });

      const result = await aiService.submitAgentTask(taskRequest, advisorContext);

      expect(result.taskId).toBe('task-abc123');
      expect(result.status).toBe('PENDING');
    });

    it('should check agent task status', async () => {
      const expectedStatus = {
        taskId: 'task-abc123',
        status: 'COMPLETED',
        progress: 100,
        result: {
          academicAnalysis: { gpa: 3.2, trend: 'IMPROVING' },
          complianceStatus: 'ELIGIBLE',
          recommendedSchedule: [],
        },
        completedAt: '2024-01-15T10:03:00Z',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => expectedStatus,
      });

      const result = await aiService.getAgentTaskStatus('task-abc123', advisorContext);

      expect(result.status).toBe('COMPLETED');
      expect(result.progress).toBe(100);
      expect(result.result).toBeDefined();
    });

    it('should handle task still in progress', async () => {
      const expectedStatus = {
        taskId: 'task-abc123',
        status: 'IN_PROGRESS',
        progress: 45,
        currentStep: 'Analyzing compliance records',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => expectedStatus,
      });

      const result = await aiService.getAgentTaskStatus('task-abc123', advisorContext);

      expect(result.status).toBe('IN_PROGRESS');
      expect(result.progress).toBe(45);
    });
  });

  describe('Knowledge Base Search', () => {
    it('should perform semantic search on knowledge base', async () => {
      const searchRequest = {
        query: 'transfer credit eligibility rules',
        limit: 5,
        filters: {
          category: 'NCAA_RULES',
          relevanceThreshold: 0.7,
        },
      };

      const expectedResponse = {
        results: [
          {
            id: 'doc-1',
            title: 'NCAA Transfer Eligibility',
            content: 'Transfer students must meet...',
            relevanceScore: 0.94,
            source: 'NCAA Manual 2024',
          },
          {
            id: 'doc-2',
            title: 'Credit Transfer Guidelines',
            content: 'Credits from accredited institutions...',
            relevanceScore: 0.87,
            source: 'Academic Policy',
          },
        ],
        totalResults: 2,
        searchTime: 0.23,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => expectedResponse,
      });

      const result = await aiService.searchKnowledgeBase(searchRequest, baseContext);

      expect(result.results).toHaveLength(2);
      expect(result.results[0].relevanceScore).toBeGreaterThan(0.9);
    });
  });

  describe('Feedback Submission', () => {
    it('should submit positive feedback for AI response', async () => {
      const feedbackRequest = {
        messageId: 'msg-123',
        conversationId: 'conv-123',
        rating: 5,
        feedback: 'HELPFUL',
        comment: 'Very accurate eligibility information',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ success: true }),
      });

      const result = await aiService.submitFeedback(feedbackRequest, baseContext);

      expect(result.success).toBe(true);
    });

    it('should submit negative feedback with details', async () => {
      const feedbackRequest = {
        messageId: 'msg-456',
        conversationId: 'conv-456',
        rating: 2,
        feedback: 'INACCURATE',
        comment: 'The GPA requirement stated was incorrect',
        correctedInfo: 'Minimum GPA should be 2.0, not 2.5',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ success: true, reviewQueued: true }),
      });

      const result = await aiService.submitFeedback(feedbackRequest, baseContext);

      expect(result.success).toBe(true);
    });
  });

  describe('Model Selection', () => {
    it('should use specified model for chat', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          conversationId: 'conv-123',
          messageId: 'msg-123',
          content: 'Response from Claude',
          model: 'claude-3-5-sonnet',
        }),
      });

      const result = await aiService.chat(
        {
          message: 'Test message',
          stream: false,
          model: 'claude-3-5-sonnet',
        },
        baseContext
      );

      const [, options] = mockFetch.mock.calls[0];
      const body = JSON.parse(options.body);

      expect(body.model).toBe('claude-3-5-sonnet');
      expect(result.model).toBe('claude-3-5-sonnet');
    });
  });

  describe('Error Handling', () => {
    it('should handle AI content policy violation', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          error: {
            code: 'CONTENT_POLICY_VIOLATION',
            message: 'Request violates content policy',
          },
        }),
      });

      await expect(
        aiService.chat({ message: 'inappropriate content', stream: false }, baseContext)
      ).rejects.toMatchObject({
        statusCode: 400,
      });
    });

    it('should handle context length exceeded', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          error: {
            code: 'CONTEXT_LENGTH_EXCEEDED',
            message: 'Conversation history exceeds maximum context length',
            details: { maxTokens: 128000, requestedTokens: 150000 },
          },
        }),
      });

      await expect(
        aiService.chat(
          { conversationId: 'long-conv', message: 'test', stream: false },
          baseContext
        )
      ).rejects.toMatchObject({
        statusCode: 400,
      });
    });
  });
});
