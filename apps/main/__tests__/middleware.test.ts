
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
      '/api/user/sync-clerk',
      '/api/cron/regulation-check',
    ])
    expect(typeof middleware).toBe('function')
  })

  it('treats the Clerk webhook relay as public (no auth.protect)', async () => {
    const auth = jest.fn()
    auth.protect = jest.fn()
    const request = {
      url: 'http://localhost/api/user/sync-clerk',
      nextUrl: { pathname: '/api/user/sync-clerk' },
    }

    await middleware(auth, request)

    expect(auth.protect).not.toHaveBeenCalled()
  })

  it('still protects other user-service API routes', async () => {
    const auth = jest.fn()
    auth.protect = jest.fn()
    const request = {
      url: 'http://localhost/api/user/profile',
      nextUrl: { pathname: '/api/user/profile' },
    }

    await middleware(auth, request)

    expect(auth.protect).toHaveBeenCalledTimes(1)
  })

  it('lets /api/user/sync-clerk reach the middleware via config.matcher', () => {
    const apiMatcher = config.matcher.find((m) => m.startsWith('/(api|trpc)'))
    expect(apiMatcher).toBeDefined()
    const pattern = new RegExp(`^${apiMatcher!.replace(/\(\.\*\)/g, '.*')}$`)
    expect(pattern.test('/api/user/sync-clerk')).toBe(true)
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
