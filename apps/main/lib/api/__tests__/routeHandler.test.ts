import { NextRequest } from 'next/server';
import { createRouteHandler, extractPath, forwardRequest } from '../routeHandler';

const mockAuth = jest.fn();
const mockCurrentUser = jest.fn();

jest.mock('@clerk/nextjs/server', () => ({
  auth: () => mockAuth(),
  currentUser: () => mockCurrentUser(),
}));

describe('routeHandler BFF forwarding', () => {
  beforeEach(() => {
    mockAuth.mockResolvedValue({
      userId: 'clerk-user-1',
      getToken: jest.fn().mockResolvedValue('session-token-1'),
    });
    mockCurrentUser.mockResolvedValue({
      id: 'app-user-1',
      publicMetadata: { role: 'COMPLIANCE' },
    });
    global.fetch = jest.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    );
  });

  it('awaits Next async params and forwards the Clerk bearer token to services', async () => {
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
