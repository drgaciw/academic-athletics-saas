
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import middleware, { config } from '../middleware';

// Mock @clerk/nextjs/server
jest.mock('@clerk/nextjs/server', () => ({
  clerkMiddleware: jest.fn().mockImplementation((handler) => {
    return (req: any, evt: any) => {
      // Mock middleware execution
      return 'middleware executed';
    };
  }),
  createRouteMatcher: jest.fn().mockReturnValue(() => false),
}));

describe('Middleware', () => {
  it('should configure clerkMiddleware correctly', () => {
    // Check if clerkMiddleware was called
    expect(clerkMiddleware).toHaveBeenCalled();

    // Assert that public routes are defined correctly
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

    const handler = (clerkMiddleware as jest.Mock).mock.calls[0][0];
    const protect = jest.fn();
    handler(() => ({ protect }), { nextUrl: new URL('https://example.com/private') });
    expect(protect).toHaveBeenCalled();
  });

  it('should define matcher config', () => {
    expect(config).toBeDefined();
    expect(config.matcher).toBeInstanceOf(Array);
    expect(config.matcher).toContain('/(api|trpc)(.*)');
  });
});
