const mockValidateAuth = jest.fn();

jest.mock('@/lib/services', () => ({
  getServiceUrl: () => 'http://monitoring.test',
}));

jest.mock('@/lib/middleware/authentication', () => {
  class AuthenticationError extends Error {
    constructor(message: string, public statusCode: number = 401) {
      super(message);
      this.name = 'AuthenticationError';
    }
  }

  return {
    AuthenticationError,
    validateAuth: () => mockValidateAuth(),
  };
});

jest.mock('@/lib/middleware/logging', () => ({
  createTimer: () => () => 0,
  logRequest: jest.fn(),
  logResponse: jest.fn(),
}));

jest.mock('@/lib/middleware/rateLimit', () => ({
  checkRateLimit: jest.fn(),
  addRateLimitHeaders: jest.fn(),
}));

jest.mock('@/lib/middleware/errorHandler', () => ({
  handleError: (error: Error & { statusCode?: number }) =>
    new Response(error.message, { status: error.statusCode ?? 500 }),
}));

jest.mock('@/lib/middleware/cors', () => ({
  addCorsHeaders: jest.fn(),
  handleCorsPreFlight: () => new Response(null, { status: 204 }),
}));

import { NextRequest } from 'next/server';
import { GET } from '../route';

describe('Monitoring BFF route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  it('rejects student requests before forwarding to monitoring service', async () => {
    mockValidateAuth.mockResolvedValue({
      userId: 'student-1',
      clerkId: 'clerk-student-1',
      role: 'STUDENT',
      correlationId: 'corr-1',
      timestamp: new Date('2026-01-01T00:00:00.000Z'),
    });

    const request = new NextRequest(
      'http://localhost/api/monitoring/progress-report/student/student-2'
    );
    const response = await GET(request, {
      params: Promise.resolve({ path: ['progress-report', 'student', 'student-2'] }),
    });

    expect(response.status).toBe(403);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
