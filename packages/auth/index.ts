/**
 * @aah/auth - Shared Authentication and Authorization Package
 *
 * This package provides comprehensive authentication and authorization
 * utilities for the Athletic Academics Hub (AAH) microservices platform.
 *
 * Features:
 * - JWT authentication with Clerk integration
 * - Role-based access control (RBAC)
 * - Permission-based authorization
 * - Hono middleware compatibility
 * - Type-safe user context
 *
 * @packageDocumentation
 */

// ============================================================================
// Middleware Exports
// ============================================================================

export {
  authMiddleware,
  requireAuth,
  optionalAuth,
  getUser,
  getOptionalUser,
} from './middleware/auth'

export {
  rbacMiddleware,
  requireRole,
  requirePermission,
  requireAdmin,
  requireStudent,
  requireCoach,
  checkPermission,
  checkAllPermissions,
  checkAnyPermission,
  checkRole,
  checkAnyRole,
} from './middleware/rbac'

export {
  correlationMiddleware,
  correlationLoggingMiddleware,
  getCorrelationId,
  createChildCorrelationId,
  extractServiceChain,
  type CorrelationMiddlewareOptions,
  type CorrelationLoggingOptions,
} from './middleware/correlation'

export {
  rateLimitMiddleware,
  createRateLimiter,
  strictRateLimiter,
  lenientRateLimiter,
  aiRateLimiter,
  getRateLimitStatus,
  MemoryRateLimitStore,
  type RateLimitOptions,
  type RateLimitStore,
} from './middleware/rateLimit'

// ============================================================================
// Type Exports
// ============================================================================

export {
  UserRole,
  AuthError,
  AuthErrorCode,
  type Permission,
  type UserContext,
  type AuthenticatedContext,
  type AuthenticatedRequest,
  type RBACConfig,
  type AuthMiddlewareOptions,
  type RBACMiddlewareOptions,
  type ClerkTokenPayload,
} from './types'

// ============================================================================
// Utility Exports
// ============================================================================

export {
  ROLE_PERMISSIONS,
  getPermissionsForRole,
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
  userHasPermission,
  userHasAllPermissions,
  userHasAnyPermission,
  userHasRole,
  userHasAnyRole,
  isValidRole,
  createUserContext,
  verifyTokenClaims,
  extractBearerToken,
  formatAuthError,
  generateRequestId,
  isStudentAthlete,
  isAdmin,
  canAccessStudentData,
  sanitizeRole,
} from './utils'

// ============================================================================
// Re-exports from Clerk (for convenience)
// ============================================================================

export { verifyToken } from '@clerk/backend'
