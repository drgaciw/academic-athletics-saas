import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

export interface AuthMiddlewareOptions {
  publicRoutes?: string[];
  requiredRoles?: string[];
  afterAuth?: (
    auth: Awaited<ReturnType<typeof authState>>,
    req: NextRequest
  ) => Response | void | Promise<Response | void>;
}

type AuthState = {
  userId: string | null;
  sessionClaims: Record<string, unknown> | null;
  redirectToSignIn: (options?: { returnBackUrl?: string }) => Response;
};

async function authState(authFn: () => Promise<{ userId: string | null; sessionClaims: Record<string, unknown> | null }>) {
  const { userId, sessionClaims } = await authFn();
  return {
    userId,
    sessionClaims,
    redirectToSignIn: (options: { returnBackUrl?: string } = {}) =>
      redirectToSignIn(options),
  };
}

/**
 * Authentication middleware factory for Next.js middleware.
 * Wraps Clerk's clerkMiddleware with route protection and optional role checks.
 */
export function authMiddleware(options: AuthMiddlewareOptions = {}) {
  const { publicRoutes = [], afterAuth } = options;
  const isPublicRoute = createRouteMatcher(publicRoutes);

  return clerkMiddleware(async (auth, req) => {
    if (!isPublicRoute(req)) {
      await auth.protect();
    }

    if (afterAuth) {
      const authContext = await authState(() => auth());
      const result = await afterAuth(authContext, req);
      if (result) {
        return result;
      }
    }
  });
}

/**
 * Utility function to check if user has required role
 */
export function requireRole(roles: string[]) {
  return (auth: AuthState) => {
    const userRoles = (auth.sessionClaims?.role as string[] | undefined) ?? [];
    const roleList = Array.isArray(userRoles) ? userRoles : [String(userRoles)];
    return roles.some((role) => roleList.includes(role));
  };
}

/**
 * Redirect to sign-in page
 */
export function redirectToSignIn(options: { returnBackUrl?: string } = {}) {
  const baseUrl = options.returnBackUrl ?? 'http://localhost:3000';
  const url = new URL('/sign-in', baseUrl);
  if (options.returnBackUrl) {
    url.searchParams.set('redirect_url', options.returnBackUrl);
  }
  return NextResponse.redirect(url);
}
