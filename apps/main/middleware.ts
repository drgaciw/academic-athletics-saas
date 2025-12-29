import { authMiddleware } from '@clerk/nextjs';

// Clerk middleware with public routes configuration
// This allows unauthenticated access to public pages while protecting others
export default authMiddleware({
  publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  secretKey: process.env.CLERK_SECRET_KEY,
  // Routes that can be accessed without authentication
  publicRoutes: [
    '/',
    '/sign-in(.*)',
    '/sign-up(.*)',
    '/sso-callback',
    '/api/health',
    '/api/evals/(.*)',
    '/api/webhooks(.*)',
  ],
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
