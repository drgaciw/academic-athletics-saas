const mockValidateAuth = jest.fn();
const mockValidateOptionalAuth = jest.fn();
const mockAuth = jest.fn();
const mockCurrentUser = jest.fn();

jest.mock('../../middleware/authentication', () => ({
  validateAuth: (...args: unknown[]) => mockValidateAuth(...args),
  validateOptionalAuth: () => mockValidateOptionalAuth(),
}));

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
  currentUser: () => mockCurrentUser(),
}));

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandler, extractPath, forwardRequest } from '../routeHandler';

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

  it('awaits Next async params and forwards context.authToken to services', async () => {
    mockValidateAuth.mockResolvedValue({
      userId: 'app-user-1',
      clerkId: 'clerk-user-1',
      role: 'COMPLIANCE',
      authToken: 'session-token-1',
      correlationId: 'corr-1',
      timestamp: new Date('2026-01-01T00:00:00.000Z'),
    });

    global.fetch = jest.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    );

    const handler = createRouteHandler(
      async (request, context, params) => {
        return forwardRequest(
          'https://compliance.example.test',
          extractPath(params),
          request,
          context
        );
      },
      { serviceName: 'compliance', skipRateLimit: true }
    );

    const request = new NextRequest('https://app.example.test/api/compliance/status/student-1', {
      method: 'POST',
      body: JSON.stringify({ includeHistory: true }),
      headers: { 'content-type': 'application/json' },
    });

    const response = await handler(request, {
      params: Promise.resolve({ path: ['status', 'student-1'] }),
    });

    expect(response.status).toBe(200);
    expect(global.fetch).toHaveBeenCalledWith(
      'https://compliance.example.test/status/student-1',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer session-token-1',
          'X-User-Id': 'app-user-1',
          'X-User-Role': 'COMPLIANCE',
        }),
        body: JSON.stringify({ includeHistory: true }),
      })
    );
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
    const request = new NextRequest('http://localhost/api/compliance/status/student-1');

    await forwardRequest('http://compliance.test', '/status/student-1', request, {
      userId: 'db-user-1',
      clerkId: 'clerk-user-1',
      role: 'COMPLIANCE',
      correlationId: 'corr-1',
      timestamp: new Date('2026-01-01T00:00:00.000Z'),
    });

    expect(global.fetch).toHaveBeenCalledWith(
      'http://compliance.test/status/student-1',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer clerk-token',
          'X-User-Id': 'db-user-1',
          'X-User-Role': 'COMPLIANCE',
        }),
      })
    );
  });

  it('prefers context.authToken over minting a new Clerk token', async () => {
    const request = new NextRequest('http://localhost/api/compliance/status/student-1');

    await forwardRequest('http://compliance.test', '/status/student-1', request, {
      userId: 'db-user-1',
      clerkId: 'clerk-user-1',
      role: 'COMPLIANCE',
      authToken: 'context-token',
      correlationId: 'corr-1',
      timestamp: new Date('2026-01-01T00:00:00.000Z'),
    });

    expect(global.fetch).toHaveBeenCalledWith(
      'http://compliance.test/status/student-1',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer context-token',
        }),
      })
    );
    expect(mockAuth).not.toHaveBeenCalled();
  });
});
