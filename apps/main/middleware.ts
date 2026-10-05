import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/sso-callback',
  '/api/health',
  '/api/webhooks/(.*)',
  // Clerk -> user-service webhook relay. Clerk authenticates with Svix
  // signature headers (verified in the user service), not a Clerk session, so
  // auth.protect() would 401 every webhook delivery.
  '/api/user/sync-clerk',
  '/api/cron/regulation-check',
]);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
