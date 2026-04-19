import { authMiddleware, redirectToSignIn, requireRole } from '@aah/auth/middleware/nextjs';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const middleware = authMiddleware({
  publicRoutes: [],
  afterAuth(auth, req) {
    // Ensure user is authenticated
    if (!auth.userId) {
      return redirectToSignIn({ returnBackUrl: req.url });
    }
    
    // Ensure user has staff or admin role
    if (!requireRole(['admin', 'staff'])(auth)) {
      return new Response('Forbidden - Admin or staff access only', { status: 403 });
    }
  },
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default middleware as any;

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};
