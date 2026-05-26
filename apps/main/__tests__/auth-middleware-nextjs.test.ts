const mockClerkMiddleware = jest.fn((handler) => handler);
const mockCreateRouteMatcher = jest.fn((routes: string[]) => {
  return (request: { nextUrl?: { pathname?: string } }) => {
    const pathname = request.nextUrl?.pathname ?? '/';
    return routes.some((route) => {
      const pattern = route.replace(/\(\.\*\)/g, '.*').replace(/\//g, '\\/');
      return new RegExp(`^${pattern}$`).test(pathname);
    });
  };
});

jest.mock('@clerk/nextjs/server', () => ({
  clerkMiddleware: (handler: unknown) => mockClerkMiddleware(handler),
  createRouteMatcher: (routes: string[]) => mockCreateRouteMatcher(routes),
}));

import { authMiddleware } from '@aah/auth/middleware/nextjs';

describe('shared Next.js auth middleware', () => {
  beforeEach(() => {
    mockClerkMiddleware.mockClear();
    mockCreateRouteMatcher.mockClear();
  });

  it('does not run afterAuth redirects on public routes', async () => {
    const afterAuth = jest.fn();
    const middleware = authMiddleware({
      publicRoutes: ['/sign-in(.*)'],
      afterAuth,
    });
    const auth = Object.assign(
      jest.fn(async () => ({ userId: null, sessionClaims: null })),
      { protect: jest.fn() }
    );

    await middleware(auth, { nextUrl: { pathname: '/sign-in' } } as any);

    expect(auth.protect).not.toHaveBeenCalled();
    expect(afterAuth).not.toHaveBeenCalled();
  });

  it('still protects and runs afterAuth on private routes', async () => {
    const afterAuth = jest.fn();
    const middleware = authMiddleware({
      publicRoutes: ['/sign-in(.*)'],
      afterAuth,
    });
    const auth = Object.assign(
      jest.fn(async () => ({ userId: 'user_1', sessionClaims: { role: 'STUDENT' } })),
      { protect: jest.fn() }
    );

    await middleware(auth, { nextUrl: { pathname: '/dashboard' } } as any);

    expect(auth.protect).toHaveBeenCalledTimes(1);
    expect(afterAuth).toHaveBeenCalledTimes(1);
  });
});
