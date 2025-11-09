/**
 * Example usage of @aah/auth package
 * These examples demonstrate common authentication and authorization patterns
 */

import { Hono } from 'hono'
import {
  // Middleware
  authMiddleware,
  requireAuth,
  optionalAuth,
  rbacMiddleware,
  requireRole,
  requirePermission,
  requireAdmin,
  requireStudent,
  requireCoach,

  // User access
  getUser,
  getOptionalUser,

  // In-route checks
  checkPermission,
  checkRole,
  checkAllPermissions,
  checkAnyPermission,

  // Types
  UserRole,
  type UserContext,
  type Permission,
  type AuthenticatedContext,

  // Utilities
  isAdmin,
  isStudentAthlete,
  canAccessStudentData,
  userHasPermission,
} from '@aah/auth'

// ============================================================================
// Example 1: Basic Authentication
// ============================================================================

const basicApp = new Hono()

// Apply authentication to all routes
basicApp.use('*', requireAuth())

basicApp.get('/profile', async (c) => {
  const user = getUser(c)
  return c.json({
    userId: user.userId,
    email: user.email,
    role: user.role,
  })
})

// ============================================================================
// Example 2: Optional Authentication
// ============================================================================

const publicApp = new Hono()

// Public routes with optional authentication
publicApp.use('/api/*', optionalAuth())

publicApp.get('/api/products', async (c) => {
  const user = getOptionalUser(c)

  if (user) {
    // Authenticated user - show personalized products
    return c.json({
      message: `Welcome back, ${user.firstName}!`,
      products: ['personalized list'],
    })
  }

  // Guest user - show default products
  return c.json({
    message: 'Welcome, guest!',
    products: ['default list'],
  })
})

// ============================================================================
// Example 3: Role-Based Routes
// ============================================================================

const rbacApp = new Hono()

rbacApp.use('*', requireAuth())

// Admin-only routes
rbacApp.use('/admin/*', requireAdmin())

rbacApp.get('/admin/dashboard', async (c) => {
  const user = getUser(c)
  return c.json({
    message: 'Admin dashboard',
    user: user.email,
  })
})

// Student-only routes
rbacApp.use('/student/*', requireStudent())

rbacApp.get('/student/schedule', async (c) => {
  const user = getUser(c)
  return c.json({
    studentId: user.studentId,
    sport: user.sport,
  })
})

// Multiple roles allowed
rbacApp.use('/staff/*', requireRole([UserRole.ADMIN, UserRole.COACH, UserRole.FACULTY]))

rbacApp.get('/staff/reports', async (c) => {
  const user = getUser(c)
  return c.json({
    message: 'Staff reports',
    role: user.role,
  })
})

// ============================================================================
// Example 4: Permission-Based Routes
// ============================================================================

const permissionApp = new Hono()

permissionApp.use('*', requireAuth())

// Require specific permission
permissionApp.use('/compliance/*', requirePermission('compliance:write'))

permissionApp.post('/compliance/validate', async (c) => {
  const body = await c.req.json()
  // Only users with compliance:write permission can access
  return c.json({ validated: true })
})

// Require all permissions
permissionApp.use('/admin/users/*', requirePermission(
  ['user:write', 'user:delete'],
  true // requireAll
))

permissionApp.delete('/admin/users/:id', async (c) => {
  const id = c.req.param('id')
  // User must have both user:write AND user:delete permissions
  return c.json({ deleted: id })
})

// Require any permission
permissionApp.use('/data/*', requirePermission([
  'monitoring:read',
  'admin:all',
]))

permissionApp.get('/data/reports', async (c) => {
  // User needs monitoring:read OR admin:all permission
  return c.json({ reports: [] })
})

// ============================================================================
// Example 5: Advanced RBAC Configuration
// ============================================================================

const advancedApp = new Hono()

advancedApp.use('*', requireAuth())

// Complex authorization rules
advancedApp.use('/api/analytics/*', rbacMiddleware({
  roles: [UserRole.ADMIN, UserRole.COACH],
  permissions: ['monitoring:read', 'ai:analyze'],
  requireAll: true, // Must have role AND all permissions
}))

advancedApp.get('/api/analytics/performance', async (c) => {
  const user = getUser(c)
  return c.json({
    message: 'Performance analytics',
    accessLevel: user.role,
  })
})

// ============================================================================
// Example 6: In-Route Authorization Checks
// ============================================================================

const dynamicApp = new Hono()

dynamicApp.use('*', requireAuth())

// Dynamic student data access
dynamicApp.get('/students/:id', async (c) => {
  const user = getUser(c)
  const studentId = c.req.param('id')

  // Check if user can access this specific student's data
  if (!canAccessStudentData(user, studentId)) {
    return c.json({ error: 'Access denied to this student record' }, 403)
  }

  // Fetch and return student data
  return c.json({
    studentId,
    // ... student data
  })
})

// Check permission in handler
dynamicApp.post('/compliance/check', async (c) => {
  const user = getUser(c)

  // Verify permission before processing
  checkPermission(c, 'compliance:validate')

  const body = await c.req.json()
  // ... perform compliance check
  return c.json({ status: 'eligible' })
})

// Multiple permission checks
dynamicApp.post('/admin/bulk-action', async (c) => {
  // Check multiple permissions
  checkAllPermissions(c, ['user:write', 'user:delete', 'admin:all'])

  const body = await c.req.json()
  // ... perform bulk action
  return c.json({ success: true })
})

// Conditional authorization
dynamicApp.put('/users/:id', async (c) => {
  const user = getUser(c)
  const targetUserId = c.req.param('id')

  // Users can update their own profile, admins can update anyone
  if (user.userId !== targetUserId && !isAdmin(user)) {
    return c.json({ error: 'Can only update your own profile' }, 403)
  }

  const body = await c.req.json()
  // ... update user
  return c.json({ updated: true })
})

// ============================================================================
// Example 7: Custom Error Handling
// ============================================================================

const errorHandlingApp = new Hono()

errorHandlingApp.use('*', authMiddleware({
  onError: (error, c) => {
    // Custom logging
    console.error(`[AUTH ERROR] ${error.code}: ${error.message}`)

    // Custom error response
    return c.json({
      error: {
        type: 'authentication_error',
        code: error.code,
        message: error.message,
        timestamp: new Date().toISOString(),
        requestId: c.get('requestId'),
      },
    }, error.statusCode)
  },
}))

errorHandlingApp.use('/admin/*', rbacMiddleware({
  roles: UserRole.ADMIN,
  onError: (error, c) => {
    // Custom RBAC error handling
    return c.json({
      error: {
        type: 'authorization_error',
        message: 'Administrator access required',
        supportEmail: 'support@aah.edu',
      },
    }, 403)
  },
}))

// ============================================================================
// Example 8: Service Integration
// ============================================================================

const serviceApp = new Hono()

serviceApp.use('*', requireAuth())

// User Service - Profile Management
serviceApp.get('/api/user/profile/:id', async (c) => {
  const user = getUser(c)
  const targetUserId = c.req.param('id')

  // Users can view their own profile, admins can view anyone's
  if (user.userId !== targetUserId) {
    checkPermission(c, 'user:read')
  }

  return c.json({
    userId: targetUserId,
    // ... profile data
  })
})

// Advising Service - Course Scheduling
serviceApp.post('/api/advising/schedule', async (c) => {
  checkPermission(c, 'advising:schedule')

  const user = getUser(c)
  const body = await c.req.json()

  return c.json({
    studentId: user.studentId,
    schedule: body,
  })
})

// Compliance Service - Eligibility Check
serviceApp.post('/api/compliance/check-eligibility', async (c) => {
  checkPermission(c, 'compliance:validate')

  const body = await c.req.json()

  return c.json({
    isEligible: true,
    checkedBy: getUser(c).userId,
  })
})

// Monitoring Service - Performance Tracking
serviceApp.get('/api/monitoring/performance/:studentId', async (c) => {
  const user = getUser(c)
  const studentId = c.req.param('studentId')

  // Check access to student data
  if (!canAccessStudentData(user, studentId)) {
    return c.json({ error: 'Access denied' }, 403)
  }

  checkAnyPermission(c, ['monitoring:read', 'admin:all'])

  return c.json({
    studentId,
    // ... performance data
  })
})

// AI Service - Chat
serviceApp.post('/api/ai/chat', async (c) => {
  checkPermission(c, 'ai:chat')

  const user = getUser(c)
  const body = await c.req.json()

  return c.json({
    userId: user.userId,
    response: 'AI response',
  })
})

// ============================================================================
// Example 9: Utility Function Usage
// ============================================================================

const utilityApp = new Hono()

utilityApp.use('*', requireAuth())

utilityApp.get('/api/dashboard', async (c) => {
  const user = getUser(c)

  // Different dashboard based on role
  if (isAdmin(user)) {
    return c.json({
      type: 'admin',
      widgets: ['users', 'analytics', 'system'],
    })
  }

  if (isStudentAthlete(user)) {
    return c.json({
      type: 'student',
      widgets: ['schedule', 'grades', 'compliance'],
      sport: user.sport,
    })
  }

  if (user.role === UserRole.COACH) {
    return c.json({
      type: 'coach',
      widgets: ['team', 'performance', 'alerts'],
    })
  }

  return c.json({
    type: 'default',
    widgets: ['overview'],
  })
})

// Check permissions dynamically
utilityApp.get('/api/features', async (c) => {
  const user = getUser(c)

  const features = {
    canManageUsers: userHasPermission(user, 'user:write'),
    canValidateCompliance: userHasPermission(user, 'compliance:validate'),
    canViewMonitoring: userHasPermission(user, 'monitoring:read'),
    canUseAI: userHasPermission(user, 'ai:chat'),
    isAdmin: isAdmin(user),
  }

  return c.json({ features })
})

// ============================================================================
// Example 10: Complete Microservice
// ============================================================================

const completeService = new Hono()

// Health check (no auth)
completeService.get('/health', (c) => c.json({ status: 'healthy' }))

// Apply authentication to all /api routes
completeService.use('/api/*', requireAuth())

// Public API routes
completeService.get('/api/version', (c) => {
  return c.json({ version: '1.0.0' })
})

// Student routes
const studentRoutes = new Hono()
studentRoutes.use('*', requireStudent())

studentRoutes.get('/profile', async (c) => {
  const user = getUser(c)
  return c.json({
    studentId: user.studentId,
    sport: user.sport,
    profile: 'student profile data',
  })
})

studentRoutes.post('/schedule', async (c) => {
  checkPermission(c, 'advising:schedule')
  const body = await c.req.json()
  return c.json({ scheduled: true })
})

completeService.route('/api/student', studentRoutes)

// Admin routes
const adminRoutes = new Hono()
adminRoutes.use('*', requireAdmin())

adminRoutes.get('/users', async (c) => {
  return c.json({ users: [] })
})

adminRoutes.post('/users', async (c) => {
  checkAllPermissions(c, ['user:write', 'admin:all'])
  const body = await c.req.json()
  return c.json({ created: true })
})

completeService.route('/api/admin', adminRoutes)

// Staff routes (multiple roles)
const staffRoutes = new Hono()
staffRoutes.use('*', requireRole([UserRole.ADMIN, UserRole.COACH, UserRole.FACULTY]))

staffRoutes.get('/reports', async (c) => {
  const user = getUser(c)
  return c.json({
    reports: [],
    generatedBy: user.role,
  })
})

completeService.route('/api/staff', staffRoutes)

// Export examples
export {
  basicApp,
  publicApp,
  rbacApp,
  permissionApp,
  advancedApp,
  dynamicApp,
  errorHandlingApp,
  serviceApp,
  utilityApp,
  completeService,
}
