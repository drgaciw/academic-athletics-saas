import { MiddlewareHandler } from 'hono'
import {
  AuthError,
  AuthErrorCode,
  RBACMiddlewareOptions,
  UserRole,
  Permission,
} from '../types'
import {
  userHasPermission,
  userHasAllPermissions,
  userHasAnyPermission,
  userHasRole,
  userHasAnyRole,
  formatAuthError,
} from '../utils'
import { getUser } from './auth'

/**
 * Default error handler for RBAC errors
 */
function defaultErrorHandler(error: AuthError, c: any) {
  return c.json(formatAuthError(error), error.statusCode)
}

/**
 * Role-Based Access Control (RBAC) middleware for Hono
 * Checks if authenticated user has required roles or permissions
 *
 * @param options - RBAC configuration
 * @returns Hono middleware handler
 *
 * @example
 * ```typescript
 * // Require admin role
 * app.use('/admin/*', rbacMiddleware({ roles: UserRole.ADMIN }))
 *
 * // Require specific permission
 * app.use('/compliance/*', rbacMiddleware({
 *   permissions: 'compliance:write'
 * }))
 *
 * // Require multiple roles (any of them)
 * app.use('/reports/*', rbacMiddleware({
 *   roles: [UserRole.ADMIN, UserRole.COACH]
 * }))
 *
 * // Require all permissions
 * app.use('/admin/users/*', rbacMiddleware({
 *   permissions: ['user:write', 'user:delete'],
 *   requireAll: true
 * }))
 * ```
 */
export function rbacMiddleware(
  options: RBACMiddlewareOptions = {}
): MiddlewareHandler {
  const {
    roles,
    permissions,
    requireAll = false,
    onError = defaultErrorHandler,
  } = options

  return async (c, next) => {
    try {
      // Get authenticated user from context
      const user = getUser(c)

      // Check role requirements
      if (roles) {
        const requiredRoles = Array.isArray(roles) ? roles : [roles]
        const hasRequiredRole = userHasAnyRole(user, requiredRoles)

        if (!hasRequiredRole) {
          throw new AuthError(
            AuthErrorCode.INSUFFICIENT_PERMISSIONS,
            `Access denied. Required role(s): ${requiredRoles.join(', ')}. User role: ${user.role}`,
            403
          )
        }
      }

      // Check permission requirements
      if (permissions) {
        const requiredPermissions = Array.isArray(permissions)
          ? permissions
          : [permissions]

        let hasRequiredPermissions: boolean

        if (requireAll) {
          // User must have ALL specified permissions
          hasRequiredPermissions = userHasAllPermissions(
            user,
            requiredPermissions
          )
        } else {
          // User must have ANY of the specified permissions
          hasRequiredPermissions = userHasAnyPermission(
            user,
            requiredPermissions
          )
        }

        if (!hasRequiredPermissions) {
          const permissionCheck = requireAll ? 'all' : 'any'
          throw new AuthError(
            AuthErrorCode.INSUFFICIENT_PERMISSIONS,
            `Access denied. Required ${permissionCheck} of: ${requiredPermissions.join(', ')}`,
            403
          )
        }
      }

      await next()
    } catch (error) {
      if (error instanceof AuthError) {
        return onError(error, c)
      }

      // Handle unexpected errors
      const authError = new AuthError(
        AuthErrorCode.INSUFFICIENT_PERMISSIONS,
        'Access control check failed',
        403
      )
      return onError(authError, c)
    }
  }
}

/**
 * Require specific role(s)
 * Shorthand for rbacMiddleware with roles only
 *
 * @param roles - Single role or array of roles
 * @returns Hono middleware handler
 *
 * @example
 * ```typescript
 * app.use('/admin/*', requireRole(UserRole.ADMIN))
 * app.use('/staff/*', requireRole([UserRole.ADMIN, UserRole.COACH]))
 * ```
 */
export function requireRole(roles: UserRole | UserRole[]): MiddlewareHandler {
  return rbacMiddleware({ roles })
}

/**
 * Require specific permission(s)
 * Shorthand for rbacMiddleware with permissions only
 *
 * @param permissions - Single permission or array of permissions
 * @param requireAll - Whether all permissions are required (default: false)
 * @returns Hono middleware handler
 *
 * @example
 * ```typescript
 * app.use('/compliance/*', requirePermission('compliance:write'))
 * app.use('/admin/*', requirePermission(['user:write', 'user:delete'], true))
 * ```
 */
export function requirePermission(
  permissions: Permission | Permission[],
  requireAll: boolean = false
): MiddlewareHandler {
  return rbacMiddleware({ permissions, requireAll })
}

/**
 * Require admin role
 * Shorthand for common admin-only routes
 *
 * @example
 * ```typescript
 * app.use('/admin/*', requireAdmin())
 * ```
 */
export function requireAdmin(): MiddlewareHandler {
  return requireRole(UserRole.ADMIN)
}

/**
 * Require student athlete role
 * Shorthand for student-specific routes
 *
 * @example
 * ```typescript
 * app.use('/student/*', requireStudent())
 * ```
 */
export function requireStudent(): MiddlewareHandler {
  return requireRole(UserRole.STUDENT_ATHLETE)
}

/**
 * Require coach role
 * Shorthand for coach-specific routes
 *
 * @example
 * ```typescript
 * app.use('/coach/*', requireCoach())
 * ```
 */
export function requireCoach(): MiddlewareHandler {
  return requireRole(UserRole.COACH)
}

/**
 * Check if user has permission (in route handler)
 * Throws AuthError if user doesn't have permission
 *
 * @param c - Hono context
 * @param permission - Required permission
 * @throws AuthError if user doesn't have permission
 *
 * @example
 * ```typescript
 * app.delete('/users/:id', async (c) => {
 *   checkPermission(c, 'user:delete')
 *   // ... delete user logic
 * })
 * ```
 */
export function checkPermission(c: any, permission: Permission): void {
  const user = getUser(c)
  if (!userHasPermission(user, permission)) {
    throw new AuthError(
      AuthErrorCode.INSUFFICIENT_PERMISSIONS,
      `Access denied. Required permission: ${permission}`,
      403
    )
  }
}

/**
 * Check if user has all permissions (in route handler)
 * Throws AuthError if user doesn't have all permissions
 *
 * @param c - Hono context
 * @param permissions - Required permissions
 * @throws AuthError if user doesn't have all permissions
 *
 * @example
 * ```typescript
 * app.post('/admin/users', async (c) => {
 *   checkAllPermissions(c, ['user:write', 'admin:all'])
 *   // ... create user logic
 * })
 * ```
 */
export function checkAllPermissions(c: any, permissions: Permission[]): void {
  const user = getUser(c)
  if (!userHasAllPermissions(user, permissions)) {
    throw new AuthError(
      AuthErrorCode.INSUFFICIENT_PERMISSIONS,
      `Access denied. Required all of: ${permissions.join(', ')}`,
      403
    )
  }
}

/**
 * Check if user has any permission (in route handler)
 * Throws AuthError if user doesn't have any of the permissions
 *
 * @param c - Hono context
 * @param permissions - Required permissions (any)
 * @throws AuthError if user doesn't have any permission
 *
 * @example
 * ```typescript
 * app.get('/reports', async (c) => {
 *   checkAnyPermission(c, ['monitoring:read', 'admin:all'])
 *   // ... fetch reports logic
 * })
 * ```
 */
export function checkAnyPermission(c: any, permissions: Permission[]): void {
  const user = getUser(c)
  if (!userHasAnyPermission(user, permissions)) {
    throw new AuthError(
      AuthErrorCode.INSUFFICIENT_PERMISSIONS,
      `Access denied. Required any of: ${permissions.join(', ')}`,
      403
    )
  }
}

/**
 * Check if user has role (in route handler)
 * Throws AuthError if user doesn't have the role
 *
 * @param c - Hono context
 * @param role - Required role
 * @throws AuthError if user doesn't have role
 *
 * @example
 * ```typescript
 * app.get('/admin/dashboard', async (c) => {
 *   checkRole(c, UserRole.ADMIN)
 *   // ... dashboard logic
 * })
 * ```
 */
export function checkRole(c: any, role: UserRole): void {
  const user = getUser(c)
  if (!userHasRole(user, role)) {
    throw new AuthError(
      AuthErrorCode.INSUFFICIENT_PERMISSIONS,
      `Access denied. Required role: ${role}. User role: ${user.role}`,
      403
    )
  }
}

/**
 * Check if user has any role (in route handler)
 * Throws AuthError if user doesn't have any of the roles
 *
 * @param c - Hono context
 * @param roles - Required roles (any)
 * @throws AuthError if user doesn't have any role
 *
 * @example
 * ```typescript
 * app.get('/reports', async (c) => {
 *   checkAnyRole(c, [UserRole.ADMIN, UserRole.COACH])
 *   // ... reports logic
 * })
 * ```
 */
export function checkAnyRole(c: any, roles: UserRole[]): void {
  const user = getUser(c)
  if (!userHasAnyRole(user, roles)) {
    throw new AuthError(
      AuthErrorCode.INSUFFICIENT_PERMISSIONS,
      `Access denied. Required any of: ${roles.join(', ')}. User role: ${user.role}`,
      403
    )
  }
}
