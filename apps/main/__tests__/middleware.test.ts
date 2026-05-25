
const mockClerkMiddleware = jest.fn((handler) => handler)
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
}))

import middleware, { config } from '../middleware'

describe('Middleware', () => {
  it('should configure clerkMiddleware with public routes', () => {
    expect(mockClerkMiddleware).toHaveBeenCalled()
    expect(mockCreateRouteMatcher).toHaveBeenCalledWith([
      '/',
      '/sign-in(.*)',
      '/sign-up(.*)',
      '/sso-callback',
      '/api/health',
      '/api/evals/(.*)',
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
})
