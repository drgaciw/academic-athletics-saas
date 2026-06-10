let lastAuthMiddlewareConfig: unknown

const mockAuthMiddleware = jest.fn((config: unknown) => {
  lastAuthMiddlewareConfig = config
  return jest.fn()
})
const mockRedirectToSignIn = jest.fn()
const mockRequireRole = jest.fn((_roles: string[]) => () => true)

jest.mock('@aah/auth/middleware/nextjs', () => ({
  authMiddleware: (config: unknown) => mockAuthMiddleware(config),
  redirectToSignIn: (...args: unknown[]) => mockRedirectToSignIn(...args),
  requireRole: (roles: string[]) => {
    mockRequireRole(roles)
    return () => true
  },
}))

import middleware, { config } from '../middleware'

describe('Admin middleware', () => {
  it('configures auth with admin base path and public routes', () => {
    expect(mockAuthMiddleware).toHaveBeenCalled()
    const passed = lastAuthMiddlewareConfig as {
      basePath: string
      publicRoutes: string[]
      afterAuth: (auth: unknown, req: unknown) => unknown
    }
    expect(passed.basePath).toBe('/admin')
    expect(passed.publicRoutes).toEqual(
      expect.arrayContaining(['/sign-in(.*)', '/sign-up(.*)', '/api/health'])
    )
    expect(typeof middleware).toBe('function')
    expect(passed.afterAuth).toEqual(expect.any(Function))
  })

  it('defines matcher config', () => {
    expect(config.matcher).toBeInstanceOf(Array)
    expect(config.matcher.length).toBeGreaterThan(0)
  })
})
