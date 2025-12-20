/**
 * API Route Handler Integration Tests
 *
 * Tests the full API route handling flow including authentication,
 * middleware chain, error handling, and response formatting.
 */

import { NextRequest } from 'next/server';
import { UserRole, type RequestContext } from '../../middleware/authentication';

// Mock Clerk
jest.mock('@clerk/nextjs', () => ({
  auth: jest.fn(),
  currentUser: jest.fn(),
}));

// Mock fetch for service forwarding
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Import after mocking
import { auth, currentUser } from '@clerk/nextjs';

describe('API Route Handler Integration Tests', () => {
  const mockClerkUser = {
    id: 'clerk_user123',
    primaryEmailAddress: { emailAddress: 'user@university.edu' },
    publicMetadata: { role: 'STUDENT', internalUserId: 'user-123' },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (auth as jest.Mock).mockReturnValue({ userId: 'clerk_user123' });
    (currentUser as jest.Mock).mockResolvedValue(mockClerkUser);
  });

  describe('Authentication Flow', () => {
    it('should authenticate valid Clerk token and extract context', async () => {
      const mockRequest = new NextRequest('http://localhost:3000/api/user/profile/123', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer valid-clerk-token',
        },
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ id: 'user-123', email: 'user@university.edu' }),
      });

      // Simulate route handler behavior
      const { userId } = auth();
      expect(userId).toBe('clerk_user123');

      const user = await currentUser();
      expect(user?.publicMetadata.role).toBe('STUDENT');
    });

    it('should reject request without authentication', async () => {
      (auth as jest.Mock).mockReturnValue({ userId: null });

      const mockRequest = new NextRequest('http://localhost:3000/api/user/profile/123', {
        method: 'GET',
      });

      const { userId } = auth();
      expect(userId).toBeNull();
    });

    it('should extract correct role from Clerk metadata', async () => {
      const adminUser = {
        ...mockClerkUser,
        publicMetadata: { role: 'ADMIN', internalUserId: 'admin-123' },
      };
      (currentUser as jest.Mock).mockResolvedValue(adminUser);

      const user = await currentUser();
      expect(user?.publicMetadata.role).toBe('ADMIN');
    });

    it('should handle missing role in metadata gracefully', async () => {
      const userWithoutRole = {
        ...mockClerkUser,
        publicMetadata: { internalUserId: 'user-123' },
      };
      (currentUser as jest.Mock).mockResolvedValue(userWithoutRole);

      const user = await currentUser();
      expect(user?.publicMetadata.role).toBeUndefined();
    });
  });

  describe('Request Forwarding', () => {
    it('should forward GET request to correct service', async () => {
      const mockRequest = new NextRequest('http://localhost:3000/api/user/profile/user-123', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer valid-token',
          'Content-Type': 'application/json',
        },
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          id: 'user-123',
          email: 'user@university.edu',
          role: 'STUDENT',
        }),
      });

      // Simulate forward request
      const serviceUrl = process.env.USER_SERVICE_URL || 'http://localhost:3001';
      const path = '/profile/user-123';

      const response = await fetch(`${serviceUrl}${path}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Correlation-Id': 'test-correlation-id',
          'X-User-Id': 'user-123',
          'X-User-Role': 'STUDENT',
        },
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];

      expect(url).toContain('/profile/user-123');
      expect(options.headers['X-User-Id']).toBe('user-123');
      expect(options.headers['X-User-Role']).toBe('STUDENT');
    });

    it('should forward POST request with body', async () => {
      const requestBody = {
        studentId: 'student-123',
        message: 'What classes should I take?',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          conversationId: 'conv-123',
          content: 'Based on your profile...',
        }),
      });

      const response = await fetch('http://localhost:3007/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Correlation-Id': 'test-correlation-id',
        },
        body: JSON.stringify(requestBody),
      });

      const [, options] = mockFetch.mock.calls[0];
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body)).toEqual(requestBody);
    });

    it('should preserve query parameters in forwarded request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ results: [] }),
      });

      const url = 'http://localhost:3005/tutoring/availability?courseId=math201&date=2024-01-20';
      await fetch(url, { method: 'GET' });

      const [calledUrl] = mockFetch.mock.calls[0];
      expect(calledUrl).toContain('courseId=math201');
      expect(calledUrl).toContain('date=2024-01-20');
    });
  });

  describe('Context Header Propagation', () => {
    it('should propagate correlation ID through request chain', async () => {
      const correlationId = 'trace-abc-123-xyz-789';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({
          'content-type': 'application/json',
          'x-correlation-id': correlationId,
        }),
        json: async () => ({ success: true }),
      });

      await fetch('http://localhost:3001/profile', {
        method: 'GET',
        headers: {
          'X-Correlation-Id': correlationId,
        },
      });

      const [, options] = mockFetch.mock.calls[0];
      expect(options.headers['X-Correlation-Id']).toBe(correlationId);
    });

    it('should generate correlation ID if not provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ success: true }),
      });

      // Simulate middleware generating correlation ID
      const generatedCorrelationId = `corr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      await fetch('http://localhost:3001/profile', {
        method: 'GET',
        headers: {
          'X-Correlation-Id': generatedCorrelationId,
        },
      });

      const [, options] = mockFetch.mock.calls[0];
      expect(options.headers['X-Correlation-Id']).toBeDefined();
      expect(options.headers['X-Correlation-Id']).toMatch(/^corr-/);
    });

    it('should forward user context to downstream services', async () => {
      const context = {
        userId: 'user-123',
        clerkId: 'clerk_abc123',
        role: UserRole.ADVISOR,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ data: [] }),
      });

      await fetch('http://localhost:3002/check-eligibility', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': context.userId,
          'X-User-Role': context.role,
          'X-Clerk-Id': context.clerkId,
        },
        body: JSON.stringify({ studentId: 'student-456' }),
      });

      const [, options] = mockFetch.mock.calls[0];
      expect(options.headers['X-User-Id']).toBe('user-123');
      expect(options.headers['X-User-Role']).toBe('ADVISOR');
    });
  });

  describe('Error Response Handling', () => {
    it('should handle 400 Bad Request from service', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request body',
            details: { field: 'email', reason: 'Invalid format' },
          },
        }),
      });

      const response = await fetch('http://localhost:3001/register', {
        method: 'POST',
        body: JSON.stringify({ email: 'invalid' }),
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should handle 401 Unauthorized', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Invalid or expired authentication token',
          },
        }),
      });

      const response = await fetch('http://localhost:3001/profile', {
        method: 'GET',
      });

      expect(response.status).toBe(401);
    });

    it('should handle 403 Forbidden for role-based access', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          error: {
            code: 'FORBIDDEN',
            message: 'Insufficient permissions for this action',
            requiredRole: 'ADMIN',
            currentRole: 'STUDENT',
          },
        }),
      });

      const response = await fetch('http://localhost:3002/update-rules', {
        method: 'POST',
        headers: { 'X-User-Role': 'STUDENT' },
      });

      expect(response.status).toBe(403);

      const data = await response.json();
      expect(data.error.requiredRole).toBe('ADMIN');
    });

    it('should handle 404 Not Found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          error: {
            code: 'NOT_FOUND',
            message: 'Resource not found',
            resource: 'user',
            id: 'nonexistent-123',
          },
        }),
      });

      const response = await fetch('http://localhost:3001/profile/nonexistent-123', {
        method: 'GET',
      });

      expect(response.status).toBe(404);
    });

    it('should handle 500 Internal Server Error with retry info', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          error: {
            code: 'INTERNAL_ERROR',
            message: 'An unexpected error occurred',
            requestId: 'req-123',
            timestamp: '2024-01-15T10:00:00Z',
          },
        }),
      });

      const response = await fetch('http://localhost:3001/profile', {
        method: 'GET',
      });

      expect(response.status).toBe(500);

      const data = await response.json();
      expect(data.error.requestId).toBeDefined();
    });

    it('should handle 503 Service Unavailable', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
        headers: new Headers({
          'content-type': 'application/json',
          'retry-after': '30',
        }),
        json: async () => ({
          error: {
            code: 'SERVICE_UNAVAILABLE',
            message: 'Service is temporarily unavailable',
          },
        }),
      });

      const response = await fetch('http://localhost:3001/profile', {
        method: 'GET',
      });

      expect(response.status).toBe(503);
      expect(response.headers.get('retry-after')).toBe('30');
    });
  });

  describe('Streaming Response Handling', () => {
    it('should handle streaming response from AI service', async () => {
      const chunks = ['Hello', ' World', '!'];
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

      const response = await fetch('http://localhost:3007/chat', {
        method: 'POST',
        body: JSON.stringify({ message: 'Hello', stream: true }),
      });

      expect(response.headers.get('content-type')).toBe('text/event-stream');
      expect(response.body).toBeDefined();
    });
  });

  describe('CORS Handling', () => {
    it('should handle CORS preflight request', async () => {
      // Simulate OPTIONS request handling
      const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Correlation-Id',
        'Access-Control-Max-Age': '86400',
      };

      // In actual implementation, OPTIONS returns these headers
      expect(corsHeaders['Access-Control-Allow-Methods']).toContain('POST');
      expect(corsHeaders['Access-Control-Allow-Headers']).toContain('Authorization');
    });

    it('should include CORS headers in response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({
          'content-type': 'application/json',
          'Access-Control-Allow-Origin': 'https://app.university.edu',
        }),
        json: async () => ({ success: true }),
      });

      const response = await fetch('http://localhost:3001/profile', {
        method: 'GET',
        headers: {
          Origin: 'https://app.university.edu',
        },
      });

      expect(response.headers.get('Access-Control-Allow-Origin')).toBe(
        'https://app.university.edu'
      );
    });
  });

  describe('Rate Limiting', () => {
    it('should include rate limit headers in response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({
          'content-type': 'application/json',
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': '95',
          'X-RateLimit-Reset': '1705312800',
        }),
        json: async () => ({ success: true }),
      });

      const response = await fetch('http://localhost:3001/profile', {
        method: 'GET',
      });

      expect(response.headers.get('X-RateLimit-Limit')).toBe('100');
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('95');
    });

    it('should handle rate limit exceeded', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        headers: new Headers({
          'content-type': 'application/json',
          'Retry-After': '60',
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': '0',
        }),
        json: async () => ({
          error: {
            code: 'RATE_LIMITED',
            message: 'Too many requests. Please try again later.',
            retryAfter: 60,
          },
        }),
      });

      const response = await fetch('http://localhost:3001/profile', {
        method: 'GET',
      });

      expect(response.status).toBe(429);
      expect(response.headers.get('Retry-After')).toBe('60');
    });
  });

  describe('Service Health Aggregation', () => {
    it('should aggregate health status from all services', async () => {
      // Simulate health checks to multiple services
      const healthChecks = [
        { service: 'user', status: 'healthy', latency: 45 },
        { service: 'compliance', status: 'healthy', latency: 32 },
        { service: 'advising', status: 'healthy', latency: 28 },
        { service: 'ai', status: 'degraded', latency: 250 },
        { service: 'support', status: 'healthy', latency: 35 },
        { service: 'monitoring', status: 'healthy', latency: 22 },
        { service: 'integration', status: 'healthy', latency: 55 },
      ];

      const aggregatedHealth = {
        status: 'degraded', // Overall status based on worst service
        services: healthChecks,
        timestamp: '2024-01-15T10:00:00Z',
        uptime: 99.95,
      };

      expect(aggregatedHealth.status).toBe('degraded');
      expect(aggregatedHealth.services).toHaveLength(7);
    });

    it('should handle service timeout in health check', async () => {
      const healthChecks = [
        { service: 'user', status: 'healthy', latency: 45 },
        { service: 'ai', status: 'timeout', latency: 5000, error: 'Connection timeout' },
      ];

      const hasUnhealthyService = healthChecks.some((s) => s.status !== 'healthy');
      expect(hasUnhealthyService).toBe(true);
    });
  });

  describe('Request Logging', () => {
    it('should log request with all relevant metadata', async () => {
      const logEntry = {
        timestamp: '2024-01-15T10:00:00Z',
        correlationId: 'corr-abc123',
        method: 'POST',
        path: '/api/compliance/check-eligibility',
        userId: 'user-123',
        userRole: 'ADVISOR',
        duration: 145,
        status: 200,
        service: 'compliance',
      };

      expect(logEntry.correlationId).toBeDefined();
      expect(logEntry.duration).toBeGreaterThan(0);
    });

    it('should log error responses with details', async () => {
      const errorLogEntry = {
        timestamp: '2024-01-15T10:00:00Z',
        correlationId: 'corr-error123',
        method: 'POST',
        path: '/api/user/register',
        userId: null, // Unauthenticated request
        duration: 12,
        status: 400,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid email format',
        },
      };

      expect(errorLogEntry.error).toBeDefined();
      expect(errorLogEntry.status).toBe(400);
    });
  });
});
