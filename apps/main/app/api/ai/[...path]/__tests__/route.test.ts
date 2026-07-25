const mockValidateAuth = jest.fn();
const mockFetch = jest.fn();

jest.mock('@/lib/middleware/authentication', () => ({
  validateAuth: (...args: unknown[]) => mockValidateAuth(...args),
  validateOptionalAuth: jest.fn(),
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

jest.mock('@/lib/services', () => ({
  getServiceUrl: () => 'http://ai.test',
}));

jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn(),
}));

global.fetch = mockFetch as typeof fetch;

import { NextRequest } from 'next/server';
import { GET } from '../route';

describe('AI service gateway', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockValidateAuth.mockResolvedValue({
      userId: 'db-user-1',
      clerkId: 'clerk-user-1',
      role: 'STUDENT',
      correlationId: 'corr-1',
      timestamp: new Date('2026-01-01T00:00:00.000Z'),
    });
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify({ conversations: [], count: 0 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );
  });

  it('forwards GET chat requests with the AI mount prefix and query string as JSON', async () => {
    const req = new NextRequest('http://localhost/api/ai/chat/conversations?limit=5');

    const res = await GET(req, {
      params: Promise.resolve({ path: ['chat', 'conversations'] }),
    });
    const data = await res.json();

    expect(res.headers.get('content-type')).toContain('application/json');
    expect(data).toEqual({ conversations: [], count: 0 });
    expect(mockFetch).toHaveBeenCalledWith(
      'http://ai.test/api/ai/chat/conversations?limit=5',
      expect.objectContaining({
        method: 'GET',
        body: undefined,
        headers: expect.objectContaining({
          'X-User-Id': 'db-user-1',
          'X-User-Role': 'STUDENT',
        }),
      })
    );
  });
});
