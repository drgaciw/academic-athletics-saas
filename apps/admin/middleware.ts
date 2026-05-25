import { authMiddleware, redirectToSignIn, requireRole } from '@aah/auth/middleware/nextjs';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const middleware = authMiddleware({
  basePath: '/admin',
  publicRoutes: ['/sign-in(.*)', '/sign-up(.*)', '/api/health'],
  afterAuth(auth, req) {
    if (!auth.userId) {
      return redirectToSignIn({ returnBackUrl: req.url, basePath: '/admin' });
    }

    if (!requireRole(['ADMIN', 'STAFF'])(auth)) {
      return new Response('Forbidden - Admin or staff access only', { status: 403 });
    }
  },
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default middleware as any;

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};
