import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

export interface AuthMiddlewareOptions {
  publicRoutes?: string[];
  requiredRoles?: string[];
  /** App base path when deployed under a prefix (e.g. `/student`, `/admin`). */
  basePath?: string;
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

const ROLE_ALIASES: Record<string, readonly string[]> = {
  STUDENT: ['STUDENT', 'STUDENT_ATHLETE'],
  ADMIN: ['ADMIN'],
  STAFF: ['STAFF'],
  COACH: ['COACH'],
  FACULTY: ['FACULTY'],
  COMPLIANCE: ['COMPLIANCE'],
};

function canonicalRole(role: string): string {
  const upper = role.toUpperCase();
  for (const [canonical, aliases] of Object.entries(ROLE_ALIASES)) {
    if (aliases.some((alias) => alias.toUpperCase() === upper)) {
      return canonical;
    }
  }
  return upper;
}

function extractUserRoles(sessionClaims: Record<string, unknown> | null): string[] {
  if (!sessionClaims) {
    return [];
  }

  const raw =
    sessionClaims.role ??
    (sessionClaims.publicMetadata as Record<string, unknown> | undefined)?.role ??
    (sessionClaims.metadata as Record<string, unknown> | undefined)?.role;

  if (!raw) {
    return [];
  }

  const list = Array.isArray(raw) ? raw : [raw];
  return list.map((role) => canonicalRole(String(role)));
}

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
  const { publicRoutes = [], afterAuth, basePath = '' } = options;
  const isPublicRoute = createRouteMatcher(publicRoutes);

  return clerkMiddleware(async (auth, req) => {
    if (isPublicRoute(req)) {
      return;
    }

    await auth.protect();

    if (afterAuth) {
      const authContext = await authState(() => auth());
      const result = await afterAuth(
        {
          ...authContext,
          redirectToSignIn: (signInOptions: { returnBackUrl?: string } = {}) =>
            redirectToSignIn({ ...signInOptions, basePath }),
        },
        req
      );
      if (result) {
        return result;
      }
    }
  });
}

/**
 * Utility function to check if user has required role.
 * Accepts canonical Prisma roles (STUDENT, ADMIN, STAFF, …) and legacy aliases.
 */
export function requireRole(roles: string[]) {
  const required = roles.map((role) => canonicalRole(role));

  return (auth: AuthState) => {
    const userRoles = extractUserRoles(auth.sessionClaims);
    return required.some((role) => userRoles.includes(role));
  };
}

/**
 * Redirect to sign-in page, preserving the caller origin and optional app base path.
 */
export function redirectToSignIn(
  options: { returnBackUrl?: string; basePath?: string } = {}
) {
  const fallback = 'http://localhost:3000';
  const returnBack = new URL(options.returnBackUrl ?? fallback);
  const basePath = options.basePath ?? '';
  const signInPath = `${basePath}/sign-in`.replace(/\/{2,}/g, '/');
  const url = new URL(signInPath, returnBack.origin);
  url.searchParams.set('redirect_url', returnBack.toString());
  return NextResponse.redirect(url);
}
