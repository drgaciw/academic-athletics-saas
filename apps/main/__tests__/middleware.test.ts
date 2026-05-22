import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { config } from '../middleware';

let mockMiddlewareHandler: any;

// Mock @clerk/nextjs/server
jest.mock('@clerk/nextjs/server', () => ({
  clerkMiddleware: jest.fn().mockImplementation((handler) => {
    mockMiddlewareHandler = handler;
    return handler;
  }),
  createRouteMatcher: jest.fn().mockImplementation((routes) => {
    return (request: { nextUrl?: { pathname?: string }; url?: string }) => {
      const pathname = request.nextUrl?.pathname || request.url || '';
      return routes.some((route: string) => {
        const pattern = new RegExp(`^${route.replace('(.*)', '.*')}$`);
        return pattern.test(pathname);
      });
    };
  }),
}));

describe('Middleware', () => {
  it('should configure clerkMiddleware with public routes', () => {
    expect(createRouteMatcher).toHaveBeenCalledWith([
      '/',
      '/sign-in(.*)',
      '/sign-up(.*)',
      '/sso-callback',
      '/api/health',
      '/api/evals/(.*)',
      '/api/webhooks/(.*)',
      '/api/cron/regulation-check',
    ]);

    expect(clerkMiddleware).toHaveBeenCalled();
  });

  it('should protect non-public routes', async () => {
    const protect = jest.fn();

    await mockMiddlewareHandler(
      () => ({ protect }),
      { nextUrl: { pathname: '/coach/dashboard' } } as any,
      {} as any
    );

    expect(protect).toHaveBeenCalled();
  });

  it('should skip protection for public routes', async () => {
    const protect = jest.fn();

    await mockMiddlewareHandler(
      () => ({ protect }),
      { nextUrl: { pathname: '/api/health' } } as any,
      {} as any
    );

    expect(protect).not.toHaveBeenCalled();
  });

  it('should define matcher config', () => {
    expect(config).toBeDefined();
    expect(config.matcher).toBeInstanceOf(Array);
    expect(config.matcher).toContain('/(api|trpc)(.*)');
  });
});
