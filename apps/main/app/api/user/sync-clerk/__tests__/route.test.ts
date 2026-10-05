import { POST } from '../route';

jest.mock('@/lib/services', () => ({
  getServiceUrl: jest.fn(() => 'https://user-service.example.com/'),
}));

describe('POST /api/user/sync-clerk', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    ) as jest.Mock;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  it('forwards the raw Clerk webhook body and Svix signature headers', async () => {
    const body = '{"type":"user.created","data":{"id":"user_123"}}';
    const request = new Request('https://app.example.com/api/user/sync-clerk', {
      method: 'POST',
      body,
      headers: {
        'Content-Type': 'application/json',
        'svix-id': 'msg_123',
        'svix-timestamp': '1710000000',
        'svix-signature': 'v1,signature',
      },
    });

    const response = await POST(request as any);

    expect(response.status).toBe(200);
    expect(global.fetch).toHaveBeenCalledWith(
      'https://user-service.example.com/api/user/sync-clerk',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'svix-id': 'msg_123',
          'svix-timestamp': '1710000000',
          'svix-signature': 'v1,signature',
        },
        body,
        cache: 'no-store',
      }
    );
  });
});
