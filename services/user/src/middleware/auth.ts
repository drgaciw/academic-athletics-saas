import { Context, MiddlewareHandler } from 'hono'
import { verifyToken } from '@clerk/backend'

export interface AuthContext {
  userId: string
  clerkId: string
  role?: string
}

// Extend Hono's Context to include our auth variables
declare module 'hono' {
  interface ContextVariableMap {
    auth: AuthContext
  }
}

export const authMiddleware: MiddlewareHandler = async (c, next) => {
  const authHeader = c.req.header('Authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Missing or invalid authorization header',
        timestamp: new Date().toISOString(),
        requestId: c.req.header('x-request-id') || crypto.randomUUID(),
      },
    }, 401)
  }

  const token = authHeader.substring(7)

  try {
    // Verify the JWT token with Clerk
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
    })

    if (!payload || !payload.sub) {
      return c.json({
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid authentication token',
          timestamp: new Date().toISOString(),
          requestId: c.req.header('x-request-id') || crypto.randomUUID(),
        },
      }, 401)
    }

    // Set auth context
    c.set('auth', {
      userId: payload.sub,
      clerkId: payload.sub,
      role: payload.metadata?.role as string,
    })

    await next()
  } catch (error) {
    console.error('Auth middleware error:', error)
    return c.json({
      error: {
        code: 'AUTH_ERROR',
        message: 'Authentication failed',
        timestamp: new Date().toISOString(),
        requestId: c.req.header('x-request-id') || crypto.randomUUID(),
      },
    }, 401)
  }
}
