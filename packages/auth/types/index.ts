import type { Context } from 'hono'

/**
 * User role enumeration matching the database schema
 */
export enum UserRole {
  STUDENT_ATHLETE = 'STUDENT_ATHLETE',
  ADMIN = 'ADMIN',
  COACH = 'COACH',
  FACULTY = 'FACULTY',
  MENTOR = 'MENTOR',
}

/**
 * Permission types for fine-grained access control
 */
export type Permission =
  // User permissions
  | 'user:read'
  | 'user:write'
  | 'user:delete'

  // Student profile permissions
  | 'student:read'
  | 'student:write'
  | 'student:delete'

  // Advising permissions
  | 'advising:read'
  | 'advising:write'
  | 'advising:schedule'

  // Compliance permissions
  | 'compliance:read'
  | 'compliance:write'
  | 'compliance:validate'
  | 'compliance:admin'

  // Monitoring permissions
  | 'monitoring:read'
  | 'monitoring:write'
  | 'monitoring:alerts'

  // Support permissions
  | 'support:read'
  | 'support:write'
  | 'support:book'

  // AI permissions
  | 'ai:chat'
  | 'ai:analyze'
  | 'ai:admin'

  // Admin permissions
  | 'admin:all'

/**
 * User context extracted from JWT token
 */
export interface UserContext {
  /**
   * Unique user identifier from database
   */
  userId: string

  /**
   * Clerk user ID for external auth system
   */
  clerkId: string

  /**
   * User's email address
   */
  email: string

  /**
   * User's assigned role
   */
  role: UserRole

  /**
   * User's first name (optional)
   */
  firstName?: string | null

  /**
   * User's last name (optional)
   */
  lastName?: string | null

  /**
   * Student profile ID if user is a student athlete
   */
  studentProfileId?: string | null

  /**
   * Student ID if user is a student athlete
   */
  studentId?: string | null

  /**
   * Sport if user is a student athlete
   */
  sport?: string | null

  /**
   * Permissions granted to the user based on role
   */
  permissions: Permission[]
}

/**
 * Extended Hono context with authenticated user
 */
export interface AuthenticatedContext extends Context {
  get user(): UserContext
  set user(value: UserContext)
}

/**
 * Type alias for authenticated request
 */
export type AuthenticatedRequest = AuthenticatedContext

/**
 * Authentication error types
 */
export enum AuthErrorCode {
  MISSING_TOKEN = 'MISSING_TOKEN',
  INVALID_TOKEN = 'INVALID_TOKEN',
  EXPIRED_TOKEN = 'EXPIRED_TOKEN',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  INVALID_ROLE = 'INVALID_ROLE',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
}

/**
 * Authentication error class
 */
export class AuthError extends Error {
  constructor(
    public code: AuthErrorCode,
    message: string,
    public statusCode: number = 401
  ) {
    super(message)
    this.name = 'AuthError'
  }
}

/**
 * Role-based access control configuration
 */
export interface RBACConfig {
  /**
   * Required role(s) for access
   */
  roles?: UserRole | UserRole[]

  /**
   * Required permission(s) for access
   */
  permissions?: Permission | Permission[]

  /**
   * Whether to require ALL permissions or just ANY
   */
  requireAll?: boolean
}

/**
 * Middleware options for authentication
 */
export interface AuthMiddlewareOptions {
  /**
   * Whether authentication is optional
   */
  optional?: boolean

  /**
   * Custom error handler
   */
  onError?: (error: AuthError, c: Context) => Response | Promise<Response>
}

/**
 * RBAC middleware options
 */
export interface RBACMiddlewareOptions extends RBACConfig {
  /**
   * Custom error handler
   */
  onError?: (error: AuthError, c: Context) => Response | Promise<Response>
}

/**
 * Token payload structure from Clerk
 */
export interface ClerkTokenPayload {
  sub: string // Clerk user ID
  email?: string
  firstName?: string
  lastName?: string
  metadata?: {
    userId?: string
    role?: UserRole
    studentProfileId?: string
    studentId?: string
    sport?: string
  }
}
