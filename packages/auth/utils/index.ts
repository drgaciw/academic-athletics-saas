import {
  UserRole,
  Permission,
  UserContext,
  ClerkTokenPayload,
  AuthError,
  AuthErrorCode,
} from '../types'

/**
 * Role-permission mapping
 * Defines which permissions are granted to each role
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.STUDENT_ATHLETE]: [
    'user:read',
    'user:write',
    'student:read',
    'student:write',
    'advising:read',
    'advising:schedule',
    'compliance:read',
    'monitoring:read',
    'support:read',
    'support:book',
    'ai:chat',
  ],
  [UserRole.ADMIN]: [
    'user:read',
    'user:write',
    'user:delete',
    'student:read',
    'student:write',
    'student:delete',
    'advising:read',
    'advising:write',
    'advising:schedule',
    'compliance:read',
    'compliance:write',
    'compliance:validate',
    'compliance:admin',
    'monitoring:read',
    'monitoring:write',
    'monitoring:alerts',
    'support:read',
    'support:write',
    'support:book',
    'ai:chat',
    'ai:analyze',
    'ai:admin',
    'admin:all',
  ],
  [UserRole.COACH]: [
    'user:read',
    'student:read',
    'advising:read',
    'compliance:read',
    'monitoring:read',
    'monitoring:write',
    'monitoring:alerts',
    'support:read',
    'support:write',
    'ai:chat',
    'ai:analyze',
  ],
  [UserRole.FACULTY]: [
    'user:read',
    'student:read',
    'monitoring:read',
    'monitoring:write',
    'ai:chat',
  ],
  [UserRole.MENTOR]: [
    'user:read',
    'student:read',
    'support:read',
    'support:write',
    'ai:chat',
  ],
}

/**
 * Get permissions for a specific role
 */
export function getPermissionsForRole(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] || []
}

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  const permissions = getPermissionsForRole(role)
  return permissions.includes(permission) || permissions.includes('admin:all')
}

/**
 * Check if a role has all of the specified permissions
 */
export function hasAllPermissions(
  role: UserRole,
  permissions: Permission[]
): boolean {
  return permissions.every((permission) => hasPermission(role, permission))
}

/**
 * Check if a role has any of the specified permissions
 */
export function hasAnyPermission(
  role: UserRole,
  permissions: Permission[]
): boolean {
  return permissions.some((permission) => hasPermission(role, permission))
}

/**
 * Check if a user context has a specific permission
 */
export function userHasPermission(
  user: UserContext,
  permission: Permission
): boolean {
  return (
    user.permissions.includes(permission) ||
    user.permissions.includes('admin:all')
  )
}

/**
 * Check if a user context has all specified permissions
 */
export function userHasAllPermissions(
  user: UserContext,
  permissions: Permission[]
): boolean {
  return permissions.every((permission) => userHasPermission(user, permission))
}

/**
 * Check if a user context has any of the specified permissions
 */
export function userHasAnyPermission(
  user: UserContext,
  permissions: Permission[]
): boolean {
  return permissions.some((permission) => userHasPermission(user, permission))
}

/**
 * Check if a user has a specific role
 */
export function userHasRole(user: UserContext, role: UserRole): boolean {
  return user.role === role
}

/**
 * Check if a user has any of the specified roles
 */
export function userHasAnyRole(
  user: UserContext,
  roles: UserRole[]
): boolean {
  return roles.includes(user.role)
}

/**
 * Validate user role
 */
export function isValidRole(role: string): role is UserRole {
  return Object.values(UserRole).includes(role as UserRole)
}

/**
 * Create user context from Clerk token payload and database user data
 */
export function createUserContext(
  clerkPayload: ClerkTokenPayload,
  dbUserData?: {
    id: string
    role: UserRole
    email: string
    firstName?: string | null
    lastName?: string | null
    studentProfile?: {
      id: string
      studentId: string
      sport: string
    } | null
  }
): UserContext {
  const role = dbUserData?.role || UserRole.STUDENT_ATHLETE
  const permissions = getPermissionsForRole(role)

  return {
    userId: dbUserData?.id || clerkPayload.metadata?.userId || '',
    clerkId: clerkPayload.sub,
    email: dbUserData?.email || clerkPayload.email || '',
    role,
    firstName: dbUserData?.firstName || clerkPayload.firstName || null,
    lastName: dbUserData?.lastName || clerkPayload.lastName || null,
    studentProfileId: dbUserData?.studentProfile?.id || null,
    studentId: dbUserData?.studentProfile?.studentId || null,
    sport: dbUserData?.studentProfile?.sport || null,
    permissions,
  }
}

/**
 * Verify token signature and expiration
 * @throws AuthError if token is invalid or expired
 */
export function verifyTokenClaims(payload: any): ClerkTokenPayload {
  if (!payload || typeof payload !== 'object') {
    throw new AuthError(
      AuthErrorCode.INVALID_TOKEN,
      'Invalid token payload',
      401
    )
  }

  if (!payload.sub) {
    throw new AuthError(
      AuthErrorCode.INVALID_TOKEN,
      'Missing subject claim in token',
      401
    )
  }

  // Check token expiration
  if (payload.exp && Date.now() >= payload.exp * 1000) {
    throw new AuthError(
      AuthErrorCode.EXPIRED_TOKEN,
      'Token has expired',
      401
    )
  }

  return payload as ClerkTokenPayload
}

/**
 * Extract bearer token from Authorization header
 */
export function extractBearerToken(authHeader?: string): string | null {
  if (!authHeader) {
    return null
  }

  const parts = authHeader.split(' ')
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null
  }

  return parts[1]
}

/**
 * Format error response for authentication errors
 */
export function formatAuthError(error: AuthError, requestId?: string) {
  return {
    error: {
      code: error.code,
      message: error.message,
      timestamp: new Date().toISOString(),
      requestId: requestId || generateRequestId(),
    },
  }
}

/**
 * Generate unique request ID for tracing
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Check if user is student athlete
 */
export function isStudentAthlete(user: UserContext): boolean {
  return user.role === UserRole.STUDENT_ATHLETE && !!user.studentProfileId
}

/**
 * Check if user is admin
 */
export function isAdmin(user: UserContext): boolean {
  return user.role === UserRole.ADMIN
}

/**
 * Check if user can access student data
 * Admins, coaches, and the student themselves can access
 */
export function canAccessStudentData(
  user: UserContext,
  targetStudentId: string
): boolean {
  // Admin can access all student data
  if (isAdmin(user)) {
    return true
  }

  // Coaches can access all student data
  if (user.role === UserRole.COACH) {
    return true
  }

  // Students can access their own data
  if (isStudentAthlete(user) && user.studentId === targetStudentId) {
    return true
  }

  // Faculty with monitoring permissions can access assigned students
  if (user.role === UserRole.FACULTY && userHasPermission(user, 'monitoring:read')) {
    return true
  }

  return false
}

/**
 * Validate and sanitize role input
 */
export function sanitizeRole(role: unknown): UserRole {
  if (typeof role !== 'string') {
    throw new AuthError(
      AuthErrorCode.INVALID_ROLE,
      'Role must be a string',
      400
    )
  }

  if (!isValidRole(role)) {
    throw new AuthError(
      AuthErrorCode.INVALID_ROLE,
      `Invalid role: ${role}. Must be one of: ${Object.values(UserRole).join(', ')}`,
      400
    )
  }

  return role
}
