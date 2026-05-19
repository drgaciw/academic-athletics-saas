import middleware, { config } from '../middleware';

const mockProtect = jest.fn();
const mockAuth = jest.fn(() => ({ protect: mockProtect }));

const mockPublicRoutePatterns = [
  { pattern: '/', test: (pathname: string) => pathname === '/' },
  { pattern: '/sign-in(.*)', test: (pathname: string) => pathname.startsWith('/sign-in') },
  { pattern: '/sign-up(.*)', test: (pathname: string) => pathname.startsWith('/sign-up') },
  { pattern: '/sso-callback', test: (pathname: string) => pathname === '/sso-callback' },
  { pattern: '/api/health', test: (pathname: string) => pathname === '/api/health' },
  { pattern: '/api/webhooks/(.*)', test: (pathname: string) => pathname.startsWith('/api/webhooks/') },
  { pattern: '/api/cron/regulation-check', test: (pathname: string) => pathname === '/api/cron/regulation-check' },
];

jest.mock('@clerk/nextjs/server', () => ({
  createRouteMatcher: jest.fn((patterns: string[]) => {
    expect(patterns).toEqual(mockPublicRoutePatterns.map(({ pattern }) => pattern));

    return (request: Request) => {
      const pathname = new URL(request.url).pathname;
      return mockPublicRoutePatterns.some(({ test }) => test(pathname));
    };
  }),
  clerkMiddleware: jest.fn((handler) => {
    return (request: Request) => handler(mockAuth, request);
  }),
}));

describe('Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('protects non-public routes with the Clerk v5 auth function API', async () => {
    await middleware(new Request('https://aah.test/coach/dashboard'));

    expect(mockAuth).toHaveBeenCalledTimes(1);
    expect(mockProtect).toHaveBeenCalledTimes(1);
  });

  it('requires authentication for eval API routes', async () => {
    await middleware(new Request('https://aah.test/api/evals/runs'));

    expect(mockAuth).toHaveBeenCalledTimes(1);
    expect(mockProtect).toHaveBeenCalledTimes(1);
  });

  it('does not protect explicitly public health checks', async () => {
    await middleware(new Request('https://aah.test/api/health'));

    expect(mockAuth).not.toHaveBeenCalled();
    expect(mockProtect).not.toHaveBeenCalled();
  });

  it('should define matcher config', () => {
    expect(config).toBeDefined();
    expect(config.matcher).toBeInstanceOf(Array);
    expect(config.matcher).toContain('/(api|trpc)(.*)');
  });
});
