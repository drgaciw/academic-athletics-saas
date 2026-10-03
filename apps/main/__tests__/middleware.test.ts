
const mockClerkMiddleware = jest.fn((handler) => handler)
const mockRedirectToSignIn = jest.fn(() => new Response(null, { status: 302 }))
const mockCreateRouteMatcher = jest.fn((routes: string[]) => {
  return (request: { nextUrl?: { pathname?: string } }) => {
    const pathname = request.nextUrl?.pathname ?? '/'
    return routes.some((route) => {
      const pattern = route.replace(/\(\.\*\)/g, '.*').replace(/\//g, '\\/')
      return new RegExp(`^${pattern}$`).test(pathname)
    })
  }
})

jest.mock('@clerk/nextjs/server', () => ({
  clerkMiddleware: (handler: unknown) => mockClerkMiddleware(handler),
  createRouteMatcher: (routes: string[]) => mockCreateRouteMatcher(routes),
  redirectToSignIn: (options: unknown) => mockRedirectToSignIn(options),
}))

import middleware, { config } from '../middleware'
import { authMiddleware, redirectToSignIn } from '@aah/auth/middleware/nextjs'

describe('Middleware', () => {
  it('should configure clerkMiddleware with public routes', () => {
    expect(mockClerkMiddleware).toHaveBeenCalled()
    expect(mockCreateRouteMatcher).toHaveBeenCalledWith([
      '/',
      '/sign-in(.*)',
      '/sign-up(.*)',
      '/sso-callback',
      '/api/health',
      '/api/webhooks/(.*)',
      '/api/cron/regulation-check',
    ])
    expect(typeof middleware).toBe('function')
  })

  it('should define matcher config', () => {
    expect(config).toBeDefined()
    expect(config.matcher).toBeInstanceOf(Array)
    expect(config.matcher).toContain('/(api|trpc)(.*)')
  })

  it('does not run afterAuth redirects on public sign-in routes', async () => {
    mockRedirectToSignIn.mockClear()

    const handler = authMiddleware({
      basePath: '/student',
      publicRoutes: ['/sign-in(.*)'],
      afterAuth(auth, req) {
        if (!auth.userId) {
          return redirectToSignIn({ returnBackUrl: req.url, basePath: '/student' })
        }
      },
    })

    const auth = jest.fn().mockResolvedValue({ userId: null, sessionClaims: null })
    auth.protect = jest.fn()
    const request = {
      url: 'http://localhost/student/sign-in',
      nextUrl: { pathname: '/sign-in' },
    }

    await handler(auth, request)

    expect(auth.protect).not.toHaveBeenCalled()
    expect(auth).not.toHaveBeenCalled()
    expect(mockRedirectToSignIn).not.toHaveBeenCalled()
  })
})
