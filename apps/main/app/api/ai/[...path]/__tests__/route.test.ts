const mockValidateAuth = jest.fn();

jest.mock('@/lib/services', () => ({
  getServiceUrl: () => 'http://ai.test',
}));

jest.mock('@/lib/middleware/authentication', () => ({
  validateAuth: () => mockValidateAuth(),
}));

jest.mock('@/lib/middleware/logging', () => ({
  createTimer: () => () => 0,
  logRequest: jest.fn(),
  logResponse: jest.fn(),
  logServiceCall: jest.fn(),
}));

jest.mock('@/lib/middleware/rateLimit', () => ({
  checkRateLimit: jest.fn(),
  addRateLimitHeaders: jest.fn(),
}));

jest.mock('@/lib/middleware/errorHandler', () => ({
  handleError: (error: Error) => new Response(error.message, { status: 500 }),
}));

jest.mock('@/lib/middleware/cors', () => ({
  addCorsHeaders: jest.fn(),
  handleCorsPreFlight: () => new Response(null, { status: 204 }),
}));

import { NextRequest } from 'next/server';
import { POST } from '../route';

describe('AI BFF route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockValidateAuth.mockResolvedValue({
      userId: 'student-1',
      clerkId: 'clerk-student-1',
      role: 'STUDENT',
      correlationId: 'corr-1',
      timestamp: new Date('2026-01-01T00:00:00.000Z'),
    });
    global.fetch = jest.fn().mockResolvedValue(
      new Response('data: {"type":"done"}\n\n', {
        status: 200,
        headers: { 'Content-Type': 'text/event-stream' },
      })
    );
  });

  it('forwards to the AI service mount path and preserves query params', async () => {
    const request = new NextRequest('http://localhost/api/ai/chat?source=student', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Can I play?', stream: true }),
    });

    await POST(request, {
      params: Promise.resolve({ path: ['chat'] }),
    });

    expect(global.fetch).toHaveBeenCalledWith(
      'http://ai.test/api/ai/chat?source=student',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'X-User-Id': 'student-1',
          'X-User-Role': 'STUDENT',
        }),
      })
    );
  });
});
