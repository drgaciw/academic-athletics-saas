import { MiddlewareHandler } from 'hono'
import { verifyToken } from '@clerk/backend'
import {
  AuthError,
  AuthErrorCode,
  AuthMiddlewareOptions,
  UserContext,
  ClerkTokenPayload,
} from '../types'
import {
  extractBearerToken,
  verifyTokenClaims,
  createUserContext,
  formatAuthError,
  generateRequestId,
} from '../utils'

/**
 * Default error handler for authentication errors
 */
function defaultErrorHandler(error: AuthError, c: any) {
  return c.json(formatAuthError(error), error.statusCode)
}

/**
 * Authentication middleware for Hono
 * Validates JWT tokens from Clerk and attaches user context to request
 *
 * @param options - Middleware configuration options
 * @returns Hono middleware handler
 *
 * @example
 * ```typescript
 * import { Hono } from 'hono'
 * import { authMiddleware } from '@aah/auth'
 *
 * const app = new Hono()
 * app.use('*', authMiddleware())
 * ```
 */
export function authMiddleware(
  options: AuthMiddlewareOptions = {}
): MiddlewareHandler {
  const { optional = false, onError = defaultErrorHandler } = options

  return async (c, next) => {
    const requestId = generateRequestId()

    try {
      // Extract token from Authorization header
      const authHeader = c.req.header('Authorization')
      const token = extractBearerToken(authHeader)

      // If no token and optional auth, continue without user context
      if (!token) {
        if (optional) {
          return next()
        }
        throw new AuthError(
          AuthErrorCode.MISSING_TOKEN,
          'Authorization header with Bearer token is required',
          401
        )
      }

      // Verify token with Clerk
      let clerkPayload: ClerkTokenPayload
      try {
        // Get Clerk secret key from environment
        const clerkSecretKey = process.env.CLERK_SECRET_KEY
        if (!clerkSecretKey) {
          throw new Error('CLERK_SECRET_KEY is not configured')
        }

        // Verify the token
        const verifiedToken = await verifyToken(token, {
          secretKey: clerkSecretKey,
        })

        // Extract claims and verify
        clerkPayload = verifyTokenClaims(verifiedToken)
      } catch (error) {
        if (error instanceof AuthError) {
          throw error
        }
        throw new AuthError(
          AuthErrorCode.INVALID_TOKEN,
          'Failed to verify authentication token',
          401
        )
      }

      // Fetch user data from database to get complete profile
      // This is optional - if your token already contains all needed data,
      // you can skip the database lookup
      let dbUserData: any = null
      try {
        // You can import prisma here if needed
        // const { prisma } = await import('@aah/database')
        // dbUserData = await prisma.user.findUnique({
        //   where: { clerkId: clerkPayload.sub },
        //   include: { studentProfile: true }
        // })

        // For now, we'll use metadata from the token if available
        if (clerkPayload.metadata) {
          dbUserData = {
            id: clerkPayload.metadata.userId || clerkPayload.sub,
            role: clerkPayload.metadata.role,
            email: clerkPayload.email || '',
            firstName: clerkPayload.firstName,
            lastName: clerkPayload.lastName,
            studentProfile: clerkPayload.metadata.studentProfileId
              ? {
                  id: clerkPayload.metadata.studentProfileId,
                  studentId: clerkPayload.metadata.studentId || '',
                  sport: clerkPayload.metadata.sport || '',
                }
              : null,
          }
        }
      } catch (error) {
        // Log database error but don't fail authentication
        console.error('Failed to fetch user from database:', error)
      }

      // Create user context
      const userContext: UserContext = createUserContext(
        clerkPayload,
        dbUserData
      )

      // Attach user context to request
      c.set('user', userContext)

      // Add request ID for tracing
      c.set('requestId', requestId)

      await next()
    } catch (error) {
      if (error instanceof AuthError) {
        return onError(error, c)
      }

      // Handle unexpected errors
      const authError = new AuthError(
        AuthErrorCode.INVALID_TOKEN,
        'Authentication failed',
        401
      )
      return onError(authError, c)
    }
  }
}

/**
 * Get authenticated user from context
 * Throws error if user is not authenticated
 *
 * @param c - Hono context
 * @returns UserContext
 * @throws AuthError if user is not authenticated
 *
 * @example
 * ```typescript
 * app.get('/profile', async (c) => {
 *   const user = getUser(c)
 *   return c.json({ user })
 * })
 * ```
 */
export function getUser(c: any): UserContext {
  const user = c.get('user')
  if (!user) {
    throw new AuthError(
      AuthErrorCode.MISSING_TOKEN,
      'User not authenticated',
      401
    )
  }
  return user
}

/**
 * Get authenticated user from context (optional)
 * Returns null if user is not authenticated
 *
 * @param c - Hono context
 * @returns UserContext | null
 *
 * @example
 * ```typescript
 * app.get('/public', async (c) => {
 *   const user = getOptionalUser(c)
 *   if (user) {
 *     return c.json({ message: `Hello, ${user.firstName}` })
 *   }
 *   return c.json({ message: 'Hello, guest' })
 * })
 * ```
 */
export function getOptionalUser(c: any): UserContext | null {
  return c.get('user') || null
}

/**
 * Require authentication middleware
 * Simpler version of authMiddleware with required auth
 *
 * @example
 * ```typescript
 * app.use('/api/*', requireAuth())
 * ```
 */
export function requireAuth(): MiddlewareHandler {
  return authMiddleware({ optional: false })
}

/**
 * Optional authentication middleware
 * Allows requests without authentication
 *
 * @example
 * ```typescript
 * app.use('/public/*', optionalAuth())
 * ```
 */
export function optionalAuth(): MiddlewareHandler {
  return authMiddleware({ optional: true })
}
