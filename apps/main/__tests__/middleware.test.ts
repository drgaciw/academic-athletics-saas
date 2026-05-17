import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import middleware, { config } from '../middleware';

jest.mock('@clerk/nextjs/server', () => ({
  clerkMiddleware: jest.fn((handler) => handler),
  createRouteMatcher: jest.fn(() => (request: { isPublicRoute?: boolean }) =>
    Boolean(request.isPublicRoute)
  ),
}));

describe('Middleware', () => {
  it('should configure public routes for clerkMiddleware', () => {
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
    const auth = jest.fn(() => ({ protect }));

    await (middleware as any)(auth, { isPublicRoute: false });

    expect(auth).toHaveBeenCalled();
    expect(protect).toHaveBeenCalled();
  });

  it('should leave public routes unprotected', async () => {
    const protect = jest.fn();
    const auth = jest.fn(() => ({ protect }));

    await (middleware as any)(auth, { isPublicRoute: true });

    expect(auth).not.toHaveBeenCalled();
    expect(protect).not.toHaveBeenCalled();
  });

  it('should define matcher config', () => {
    expect(config).toBeDefined();
    expect(config.matcher).toBeInstanceOf(Array);
    expect(config.matcher).toContain('/(api|trpc)(.*)');
  });
});
