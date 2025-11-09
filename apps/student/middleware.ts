import { authMiddleware, redirectToSignIn, requireRole } from '@aah/auth/middleware/nextjs';

export default authMiddleware({
  publicRoutes: [],
  afterAuth(auth, req) {
    // Ensure user is authenticated
    if (!auth.userId) {
      return redirectToSignIn({ returnBackUrl: req.url });
    }
    
    // Ensure user has student-athlete role
    if (!requireRole(['student'])(auth)) {
      return new Response('Unauthorized - Student access only', { status: 403 });
    }
  },
});

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};
