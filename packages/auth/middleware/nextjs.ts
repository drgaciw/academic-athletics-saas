import { NextRequest, NextResponse } from 'next/server';

export interface AuthMiddlewareOptions {
  publicRoutes?: string[];
  requiredRoles?: string[];
  afterAuth?: (auth: any, req: NextRequest) => Response | void | Promise<Response | void>;
}

/**
 * Authentication middleware factory for Next.js middleware
 * Wraps Clerk's authMiddleware with additional configuration
 *
 * @param options - Middleware configuration options
 * @returns Next.js middleware function
 *
 * @example
 * ```typescript
 * // apps/student/middleware.ts
 * import { authMiddleware } from '@aah/auth/middleware/nextjs';
 *
 * export default authMiddleware({
 *   publicRoutes: [],
 *   afterAuth(auth, req) {
 *     if (!auth.userId) {
 *       return NextResponse.redirect(new URL('/sign-in', req.url));
 *     }
 *     if (!auth.sessionClaims?.role?.includes('student')) {
 *       return new Response('Unauthorized', { status: 403 });
 *     }
 *   },
 * });
 * ```
 */
export function authMiddleware(options: AuthMiddlewareOptions = {}): (req: NextRequest) => Promise<NextResponse | Response> {
  return async function middleware(req: NextRequest): Promise<NextResponse | Response> {
    // This is a placeholder that will be replaced with actual Clerk integration
    // For now, we'll return a basic implementation
    const { publicRoutes = [], afterAuth } = options;
    
    // Check if route is public
    const isPublicRoute = publicRoutes.some(route => 
      req.nextUrl.pathname.startsWith(route)
    );
    
    if (isPublicRoute) {
      return NextResponse.next();
    }
    
    // Get auth from request (this would come from Clerk in production)
    const auth = {
      userId: req.headers.get('x-user-id'),
      sessionClaims: {
        role: req.headers.get('x-user-role')?.split(',') || [],
      },
    };
    
    // Call afterAuth if provided
    if (afterAuth) {
      const result = await afterAuth(auth, req);
      if (result) {
        return result;
      }
    }
    
    return NextResponse.next();
  };
}

/**
 * Utility function to check if user has required role
 *
 * @param roles - Array of allowed roles
 * @returns Function that checks if auth has any of the roles
 *
 * @example
 * ```typescript
 * export default authMiddleware({
 *   afterAuth(auth, req) {
 *     if (!requireRole(['admin', 'staff'])(auth)) {
 *       return new Response('Forbidden', { status: 403 });
 *     }
 *   },
 * });
 * ```
 */
export function requireRole(roles: string[]) {
  return (auth: any) => {
    const userRoles = auth.sessionClaims?.role || [];
    return roles.some(role => userRoles.includes(role));
  };
}

/**
 * Redirect to sign-in page
 *
 * @param options - Redirect options
 * @returns NextResponse redirect
 */
export function redirectToSignIn(options: { returnBackUrl?: string } = {}) {
  const url = new URL('/sign-in', options.returnBackUrl || 'http://localhost:3000');
  if (options.returnBackUrl) {
    url.searchParams.set('redirect_url', options.returnBackUrl);
  }
  return NextResponse.redirect(url);
}
