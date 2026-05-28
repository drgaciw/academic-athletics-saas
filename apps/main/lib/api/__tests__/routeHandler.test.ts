const mockValidateOptionalAuth = jest.fn();

jest.mock('../../middleware/authentication', () => ({
  validateAuth: jest.fn(),
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

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandler, extractPath } from '../routeHandler';

describe('createRouteHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockValidateOptionalAuth.mockResolvedValue(null);
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
