import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
      '/',
      '/sign-in(.*)',
      '/sign-up(.*)',
      '/sso-callback',
      '/api/health',
      '/api/evals/(.*)',
      '/api/webhooks(.*)',
    ]);

// Clerk middleware with public routes configuration
// This allows unauthenticated access to public pages while protecting others
export default clerkMiddleware((auth, req) => {
      if (!isPublicRoute(req)) {
              auth().protect();
      }
});

export const config = {
      matcher: [
              // Skip Next.js internals and all static files, unless found in search params
              '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
              // Always run for API routes
              '/(api|trpc)(.*)',
            ],
};
