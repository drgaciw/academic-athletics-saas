const mockValidateOptionalAuth = jest.fn();
const mockAuth = jest.fn();

jest.mock('../../middleware/authentication', () => {
  class AuthenticationError extends Error {
    constructor(message: string, public statusCode: number = 401) {
      super(message);
      this.name = 'AuthenticationError';
    }
  }

  return {
    AuthenticationError,
    validateAuth: jest.fn(),
    validateOptionalAuth: () => mockValidateOptionalAuth(),
  };
});

jest.mock('../../middleware/logging', () => ({
  createTimer: () => () => 0,
  logRequest: jest.fn(),
  logResponse: jest.fn(),
}));

jest.mock('../../middleware/rateLimit', () => ({
  checkRateLimit: jest.fn(),
  addRateLimitHeaders: jest.fn(),
}));

jest.mock('../../middleware/errorHandler', () => ({
  handleError: (error: Error) => new Response(error.message, { status: 500 }),
}));

jest.mock('../../middleware/cors', () => ({
  addCorsHeaders: jest.fn(),
  handleCorsPreFlight: () => new Response(null, { status: 204 }),
}));

jest.mock('@clerk/nextjs/server', () => ({
  auth: () => mockAuth(),
}));

import { NextRequest, NextResponse } from 'next/server';
import {
  buildServicePath,
  createRouteHandler,
  extractPath,
  forwardRequest,
  requireServiceRole,
} from '../routeHandler';
import { UserRole } from '../../types/services';
import { AuthenticationError } from '../../middleware/authentication';

describe('createRouteHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockValidateOptionalAuth.mockResolvedValue(null);
    mockAuth.mockResolvedValue({ getToken: jest.fn().mockResolvedValue('clerk-token') });
  });

  it('awaits async Next route params before passing them to handlers', async () => {
    const handler = createRouteHandler(
      async (_request, _context, params) => {
        return NextResponse.json({ path: extractPath(params) });
      },
      { serviceName: 'compliance', requireAuth: false }
    );

    const request = new NextRequest('http://localhost/api/compliance/status/student-1');
    const response = await handler(request, {
      params: Promise.resolve({ path: ['status', 'student-1'] }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ path: '/status/student-1' });
  });
});

describe('buildServicePath', () => {
  it('adds the service API mount prefix once', () => {
    expect(buildServicePath('compliance', '/status/student-1')).toBe(
      '/api/compliance/status/student-1'
    );
    expect(buildServicePath('compliance', '/api/compliance/status/student-1')).toBe(
      '/api/compliance/status/student-1'
    );
  });
});

describe('requireServiceRole', () => {
  it('rejects callers outside the allowed role set', () => {
    expect(() =>
      requireServiceRole(
        {
          userId: 'student-1',
          clerkId: 'clerk-student-1',
          role: UserRole.STUDENT,
          correlationId: 'corr-1',
          timestamp: new Date('2026-01-01T00:00:00.000Z'),
        },
        [UserRole.ADMIN, UserRole.COMPLIANCE, UserRole.STAFF],
        'integration'
      )
    ).toThrow(AuthenticationError);
  });
});

describe('forwardRequest', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ getToken: jest.fn().mockResolvedValue('clerk-token') });
    global.fetch = jest.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );
  });

  it('mints and forwards a Clerk bearer token for authenticated BFF calls', async () => {
    const request = new NextRequest('http://localhost/api/compliance/status/student-1?include=rules');

    await forwardRequest(
      'http://compliance.test',
      buildServicePath('compliance', '/status/student-1'),
      request,
      {
        userId: 'db-user-1',
        clerkId: 'clerk-user-1',
        role: 'COMPLIANCE',
        correlationId: 'corr-1',
        timestamp: new Date('2026-01-01T00:00:00.000Z'),
      }
    );

    expect(global.fetch).toHaveBeenCalledWith(
      'http://compliance.test/api/compliance/status/student-1?include=rules',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer clerk-token',
          'X-User-Id': 'db-user-1',
          'X-User-Role': 'COMPLIANCE',
        }),
      })
    );
  });
});
