# @aah/auth

Shared authentication and authorization package for the Athletic Academics Hub (AAH) microservices platform.

## Features

- **JWT Authentication**: Seamless integration with Clerk for token validation
- **Role-Based Access Control (RBAC)**: Comprehensive role and permission management
- **Hono Middleware**: Native support for Hono framework
- **Type-Safe**: Full TypeScript support with strict typing
- **Flexible**: Support for both required and optional authentication
- **Extensible**: Easy to customize error handling and user context

## Installation

This package is part of the AAH monorepo and is installed automatically with workspace dependencies.

```bash
npm install
```

## Quick Start

### Basic Authentication

```typescript
import { Hono } from 'hono'
import { authMiddleware, getUser } from '@aah/auth'

const app = new Hono()

// Apply authentication to all routes
app.use('*', authMiddleware())

// Access authenticated user in routes
app.get('/profile', async (c) => {
  const user = getUser(c)
  return c.json({
    userId: user.userId,
    email: user.email,
    role: user.role,
  })
})
```

### Role-Based Access Control

```typescript
import { requireRole, requirePermission, UserRole } from '@aah/auth'

// Require admin role
app.use('/admin/*', requireRole(UserRole.ADMIN))

// Require specific permission
app.use('/compliance/*', requirePermission('compliance:write'))

// Require multiple roles (any of them)
app.use('/staff/*', requireRole([UserRole.ADMIN, UserRole.COACH]))
```

## Authentication Middleware

### `authMiddleware(options?)`

Main authentication middleware that validates JWT tokens and attaches user context.

**Options:**
- `optional` (boolean): Allow requests without authentication (default: false)
- `onError` (function): Custom error handler

**Example:**
```typescript
// Required authentication (default)
app.use('*', authMiddleware())

// Optional authentication
app.use('/public/*', authMiddleware({ optional: true }))

// Custom error handler
app.use('*', authMiddleware({
  onError: (error, c) => {
    console.error('Auth error:', error)
    return c.json({ error: error.message }, error.statusCode)
  }
}))
```

### `requireAuth()`

Shorthand for required authentication.

```typescript
app.use('/api/*', requireAuth())
```

### `optionalAuth()`

Shorthand for optional authentication.

```typescript
app.use('/public/*', optionalAuth())
```

### `getUser(c)`

Get authenticated user from context. Throws error if not authenticated.

```typescript
app.get('/me', async (c) => {
  const user = getUser(c)
  return c.json({ user })
})
```

### `getOptionalUser(c)`

Get authenticated user from context. Returns null if not authenticated.

```typescript
app.get('/welcome', async (c) => {
  const user = getOptionalUser(c)
  if (user) {
    return c.json({ message: `Welcome back, ${user.firstName}!` })
  }
  return c.json({ message: 'Welcome, guest!' })
})
```

## RBAC Middleware

### `rbacMiddleware(options)`

Flexible RBAC middleware for role and permission checking.

**Options:**
- `roles` (UserRole | UserRole[]): Required role(s)
- `permissions` (Permission | Permission[]): Required permission(s)
- `requireAll` (boolean): Require all permissions vs any (default: false)
- `onError` (function): Custom error handler

**Examples:**
```typescript
// Require admin role
app.use('/admin/*', rbacMiddleware({ roles: UserRole.ADMIN }))

// Require specific permission
app.use('/compliance/*', rbacMiddleware({
  permissions: 'compliance:write'
}))

// Require all permissions
app.use('/admin/users/*', rbacMiddleware({
  permissions: ['user:write', 'user:delete'],
  requireAll: true
}))

// Require any of multiple roles
app.use('/reports/*', rbacMiddleware({
  roles: [UserRole.ADMIN, UserRole.COACH]
}))
```

### Role-Specific Middleware

```typescript
// Require admin role
app.use('/admin/*', requireAdmin())

// Require student athlete role
app.use('/student/*', requireStudent())

// Require coach role
app.use('/coach/*', requireCoach())

// Require specific role
app.use('/faculty/*', requireRole(UserRole.FACULTY))

// Require any of multiple roles
app.use('/staff/*', requireRole([UserRole.ADMIN, UserRole.COACH, UserRole.FACULTY]))
```

### Permission-Specific Middleware

```typescript
// Require single permission
app.use('/compliance/*', requirePermission('compliance:write'))

// Require all permissions
app.use('/admin/*', requirePermission(
  ['user:write', 'user:delete'],
  true // requireAll
))

// Require any permission
app.use('/data/*', requirePermission(
  ['monitoring:read', 'admin:all']
))
```

## In-Route Authorization Checks

For more granular control, use authorization checks within route handlers:

```typescript
import {
  checkPermission,
  checkRole,
  checkAllPermissions,
  checkAnyPermission
} from '@aah/auth'

app.delete('/users/:id', async (c) => {
  // Check single permission
  checkPermission(c, 'user:delete')

  const id = c.req.param('id')
  // ... delete user logic
})

app.post('/admin/users', async (c) => {
  // Check all permissions
  checkAllPermissions(c, ['user:write', 'admin:all'])

  const body = await c.req.json()
  // ... create user logic
})

app.get('/reports', async (c) => {
  // Check any permission
  checkAnyPermission(c, ['monitoring:read', 'admin:all'])

  // ... fetch reports logic
})

app.get('/admin/dashboard', async (c) => {
  // Check role
  checkRole(c, UserRole.ADMIN)

  // ... dashboard logic
})
```

## User Roles

```typescript
enum UserRole {
  STUDENT_ATHLETE = 'STUDENT_ATHLETE',
  ADMIN = 'ADMIN',
  COACH = 'COACH',
  FACULTY = 'FACULTY',
  MENTOR = 'MENTOR',
}
```

## Permissions

Each role has specific permissions:

### Student Athlete
- `user:read`, `user:write`
- `student:read`, `student:write`
- `advising:read`, `advising:schedule`
- `compliance:read`
- `monitoring:read`
- `support:read`, `support:book`
- `ai:chat`

### Admin
- All permissions including `admin:all`

### Coach
- `user:read`, `student:read`
- `advising:read`
- `compliance:read`
- `monitoring:read`, `monitoring:write`, `monitoring:alerts`
- `support:read`, `support:write`
- `ai:chat`, `ai:analyze`

### Faculty
- `user:read`, `student:read`
- `monitoring:read`, `monitoring:write`
- `ai:chat`

### Mentor
- `user:read`, `student:read`
- `support:read`, `support:write`
- `ai:chat`

## User Context

The authenticated user context contains:

```typescript
interface UserContext {
  userId: string              // Database user ID
  clerkId: string             // Clerk authentication ID
  email: string               // User email
  role: UserRole              // User role
  firstName?: string | null   // First name
  lastName?: string | null    // Last name
  studentProfileId?: string | null  // Student profile ID (if student)
  studentId?: string | null   // Student ID (if student)
  sport?: string | null       // Sport (if student athlete)
  permissions: Permission[]   // Granted permissions
}
```

## Utility Functions

### Role and Permission Checking

```typescript
import {
  hasPermission,
  userHasPermission,
  isStudentAthlete,
  isAdmin,
  canAccessStudentData
} from '@aah/auth'

// Check if role has permission
if (hasPermission(UserRole.COACH, 'monitoring:read')) {
  // ...
}

// Check if user has permission
if (userHasPermission(user, 'compliance:write')) {
  // ...
}

// Check if user is student athlete
if (isStudentAthlete(user)) {
  // ...
}

// Check if user is admin
if (isAdmin(user)) {
  // ...
}

// Check if user can access student data
if (canAccessStudentData(user, targetStudentId)) {
  // ...
}
```

### Permission Utilities

```typescript
import {
  getPermissionsForRole,
  hasAllPermissions,
  hasAnyPermission
} from '@aah/auth'

// Get all permissions for a role
const permissions = getPermissionsForRole(UserRole.COACH)

// Check if role has all permissions
if (hasAllPermissions(UserRole.ADMIN, ['user:write', 'user:delete'])) {
  // ...
}

// Check if role has any permission
if (hasAnyPermission(UserRole.FACULTY, ['monitoring:read', 'student:read'])) {
  // ...
}
```

## Error Handling

### AuthError

All authentication and authorization errors throw `AuthError`:

```typescript
class AuthError extends Error {
  code: AuthErrorCode
  statusCode: number
}

enum AuthErrorCode {
  MISSING_TOKEN = 'MISSING_TOKEN',
  INVALID_TOKEN = 'INVALID_TOKEN',
  EXPIRED_TOKEN = 'EXPIRED_TOKEN',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  INVALID_ROLE = 'INVALID_ROLE',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
}
```

### Custom Error Handling

```typescript
import { authMiddleware, AuthError } from '@aah/auth'

app.use('*', authMiddleware({
  onError: (error: AuthError, c) => {
    // Log error
    console.error(`Auth error [${error.code}]:`, error.message)

    // Custom response
    return c.json({
      error: {
        code: error.code,
        message: error.message,
        timestamp: new Date().toISOString(),
      }
    }, error.statusCode)
  }
}))
```

## Environment Variables

Required environment variables:

```env
CLERK_SECRET_KEY=your_clerk_secret_key
```

## Complete Example

```typescript
import { Hono } from 'hono'
import {
  authMiddleware,
  requireAuth,
  requireAdmin,
  requirePermission,
  getUser,
  UserRole,
  checkPermission,
  canAccessStudentData,
} from '@aah/auth'

const app = new Hono()

// Public routes (no auth required)
app.get('/health', (c) => c.json({ status: 'ok' }))

// Apply authentication to all /api routes
app.use('/api/*', requireAuth())

// Public API routes (authenticated but no role check)
app.get('/api/me', async (c) => {
  const user = getUser(c)
  return c.json({ user })
})

// Admin-only routes
app.use('/api/admin/*', requireAdmin())

app.get('/api/admin/users', async (c) => {
  // Only admins can access
  return c.json({ users: [] })
})

// Permission-based routes
app.use('/api/compliance/*', requirePermission('compliance:write'))

app.post('/api/compliance/check', async (c) => {
  const user = getUser(c)
  const body = await c.req.json()

  // ... compliance check logic
  return c.json({ result: 'eligible' })
})

// Dynamic authorization in handler
app.get('/api/students/:id', async (c) => {
  const user = getUser(c)
  const studentId = c.req.param('id')

  // Check if user can access this student's data
  if (!canAccessStudentData(user, studentId)) {
    return c.json({ error: 'Access denied' }, 403)
  }

  // ... fetch student data
  return c.json({ student: {} })
})

// Multiple roles allowed
app.use('/api/reports/*', requireRole([UserRole.ADMIN, UserRole.COACH]))

app.get('/api/reports/performance', async (c) => {
  const user = getUser(c)
  // ... generate performance report
  return c.json({ report: {} })
})

export default app
```

## TypeScript Support

Full TypeScript support with strict typing:

```typescript
import type {
  UserContext,
  Permission,
  AuthenticatedContext
} from '@aah/auth'

// Use typed context
app.get('/profile', async (c: AuthenticatedContext) => {
  const user: UserContext = getUser(c)
  return c.json({ user })
})

// Type-safe permissions
const permission: Permission = 'compliance:write'
checkPermission(c, permission)
```

## Best Practices

1. **Apply authentication early**: Use `requireAuth()` at the app or router level
2. **Use role-specific middleware**: Prefer `requireAdmin()` over manual role checks
3. **Granular permissions**: Use permissions for fine-grained access control
4. **Error handling**: Implement custom error handlers for better user experience
5. **Database sync**: Keep user metadata in Clerk in sync with your database
6. **Token validation**: Trust the middleware to validate tokens, don't re-validate
7. **Resource-based access**: Use `canAccessStudentData()` for resource-specific checks

## License

MIT
