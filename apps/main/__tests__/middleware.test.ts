jest.mock('@clerk/nextjs/server', () => ({
  createRouteMatcher: jest.fn((patterns: string[]) => {
    const publicRoutePatterns = [
      { pattern: '/', test: (pathname: string) => pathname === '/' },
      { pattern: '/sign-in(.*)', test: (pathname: string) => pathname.startsWith('/sign-in') },
      { pattern: '/sign-up(.*)', test: (pathname: string) => pathname.startsWith('/sign-up') },
      { pattern: '/sso-callback', test: (pathname: string) => pathname === '/sso-callback' },
      { pattern: '/api/health', test: (pathname: string) => pathname === '/api/health' },
      { pattern: '/api/webhooks/(.*)', test: (pathname: string) => pathname.startsWith('/api/webhooks/') },
      { pattern: '/api/cron/regulation-check', test: (pathname: string) => pathname === '/api/cron/regulation-check' },
    ];

    expect(patterns).toEqual(publicRoutePatterns.map(({ pattern }) => pattern));

    return (request: Request) => {
      const pathname = new URL(request.url).pathname;
      return publicRoutePatterns.some(({ test }) => test(pathname));
    };
  }),
  clerkMiddleware: jest.fn((handler) => {
    const auth = jest.fn(() => ({ protect: clerkMocks.protect }));
    clerkMocks.auth = auth;

    return (request: Request) => handler(auth, request);
  }),
}));

const clerkMocks = {
  auth: jest.fn(),
  protect: jest.fn(),
};

const { default: middleware, config } = require('../middleware');

describe('Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clerkMocks.auth.mockClear();
    clerkMocks.protect.mockClear();
  });

  it('protects non-public routes with the Clerk v5 auth function API', async () => {
    await middleware(new Request('https://aah.test/coach/dashboard'));

    expect(clerkMocks.auth).toHaveBeenCalledTimes(1);
    expect(clerkMocks.protect).toHaveBeenCalledTimes(1);
  });

  it('requires authentication for eval API routes', async () => {
    await middleware(new Request('https://aah.test/api/evals/runs'));

    expect(clerkMocks.auth).toHaveBeenCalledTimes(1);
    expect(clerkMocks.protect).toHaveBeenCalledTimes(1);
  });

  it('does not protect explicitly public health checks', async () => {
    await middleware(new Request('https://aah.test/api/health'));

    expect(clerkMocks.auth).not.toHaveBeenCalled();
    expect(clerkMocks.protect).not.toHaveBeenCalled();
  });

  it('should define matcher config', () => {
    expect(config).toBeDefined();
    expect(config.matcher).toBeInstanceOf(Array);
    expect(config.matcher).toContain('/(api|trpc)(.*)');
  });
});
