import { authMiddleware, redirectToSignIn, requireRole } from '@aah/auth/middleware/nextjs';

export default authMiddleware({
  basePath: '/student',
  publicRoutes: ['/sign-in(.*)', '/sign-up(.*)', '/api/health'],
  afterAuth(auth, req) {
    if (!auth.userId) {
      return redirectToSignIn({ returnBackUrl: req.url, basePath: '/student' });
    }

    if (!requireRole(['STUDENT'])(auth)) {
      return new Response('Unauthorized - Student access only', { status: 403 });
    }
  },
});

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};
