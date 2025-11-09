# @aah/auth - Quick Reference

## Installation

```typescript
import { requireAuth, getUser, requireRole, UserRole } from '@aah/auth'
```

## Common Patterns

### 1. Basic Authentication

```typescript
import { Hono } from 'hono'
import { requireAuth, getUser } from '@aah/auth'

const app = new Hono()
app.use('*', requireAuth())

app.get('/profile', async (c) => {
  const user = getUser(c)
  return c.json({ user })
})
```

### 2. Role-Based Routes

```typescript
import { requireAdmin, requireRole, UserRole } from '@aah/auth'

// Admin only
app.use('/admin/*', requireAdmin())

// Multiple roles
app.use('/staff/*', requireRole([UserRole.ADMIN, UserRole.COACH]))
```

### 3. Permission Checks

```typescript
import { requirePermission, checkPermission } from '@aah/auth'

// As middleware
app.use('/compliance/*', requirePermission('compliance:write'))

// In route handler
app.delete('/users/:id', async (c) => {
  checkPermission(c, 'user:delete')
  // ... delete logic
})
```

### 4. Resource Access Control

```typescript
import { getUser, canAccessStudentData } from '@aah/auth'

app.get('/students/:id', async (c) => {
  const user = getUser(c)
  const studentId = c.req.param('id')

  if (!canAccessStudentData(user, studentId)) {
    return c.json({ error: 'Access denied' }, 403)
  }
  // ... fetch student data
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

## Common Permissions

```typescript
// User
'user:read' | 'user:write' | 'user:delete'

// Student
'student:read' | 'student:write' | 'student:delete'

// Advising
'advising:read' | 'advising:write' | 'advising:schedule'

// Compliance
'compliance:read' | 'compliance:write' | 'compliance:validate' | 'compliance:admin'

// Monitoring
'monitoring:read' | 'monitoring:write' | 'monitoring:alerts'

// Support
'support:read' | 'support:write' | 'support:book'

// AI
'ai:chat' | 'ai:analyze' | 'ai:admin'

// Admin
'admin:all'
```

## Middleware Functions

### Authentication
- `authMiddleware(options?)` - Main auth middleware
- `requireAuth()` - Require authentication
- `optionalAuth()` - Optional authentication
- `getUser(c)` - Get user (throws if not authenticated)
- `getOptionalUser(c)` - Get user or null

### Authorization
- `rbacMiddleware(options)` - Flexible RBAC
- `requireRole(role)` - Require specific role(s)
- `requirePermission(permission, requireAll?)` - Require permission(s)
- `requireAdmin()` - Require admin role
- `requireStudent()` - Require student role
- `requireCoach()` - Require coach role

### In-Route Checks
- `checkPermission(c, permission)` - Check single permission
- `checkAllPermissions(c, permissions)` - Check all permissions
- `checkAnyPermission(c, permissions)` - Check any permission
- `checkRole(c, role)` - Check specific role
- `checkAnyRole(c, roles)` - Check any role

## Utility Functions

### Permission Checks
```typescript
import {
  hasPermission,
  userHasPermission,
  getPermissionsForRole,
} from '@aah/auth'

hasPermission(UserRole.COACH, 'monitoring:read') // true/false
userHasPermission(user, 'compliance:write') // true/false
getPermissionsForRole(UserRole.ADMIN) // Permission[]
```

### User Helpers
```typescript
import {
  isAdmin,
  isStudentAthlete,
  canAccessStudentData,
} from '@aah/auth'

isAdmin(user) // true/false
isStudentAthlete(user) // true/false
canAccessStudentData(user, studentId) // true/false
```

## User Context

```typescript
interface UserContext {
  userId: string
  clerkId: string
  email: string
  role: UserRole
  firstName?: string | null
  lastName?: string | null
  studentProfileId?: string | null
  studentId?: string | null
  sport?: string | null
  permissions: Permission[]
}
```

## Error Handling

```typescript
import { authMiddleware, AuthError, AuthErrorCode } from '@aah/auth'

app.use('*', authMiddleware({
  onError: (error: AuthError, c) => {
    console.error(`[${error.code}] ${error.message}`)
    return c.json({ error: error.message }, error.statusCode)
  }
}))
```

## Complete Example

```typescript
import { Hono } from 'hono'
import {
  requireAuth,
  requireAdmin,
  requirePermission,
  getUser,
  checkPermission,
  UserRole,
} from '@aah/auth'

const app = new Hono()

// Public routes (no auth)
app.get('/health', (c) => c.json({ status: 'ok' }))

// Authenticated routes
app.use('/api/*', requireAuth())

app.get('/api/me', async (c) => {
  const user = getUser(c)
  return c.json({ user })
})

// Admin routes
app.use('/api/admin/*', requireAdmin())

app.get('/api/admin/users', async (c) => {
  return c.json({ users: [] })
})

// Permission-based routes
app.use('/api/compliance/*', requirePermission('compliance:write'))

app.post('/api/compliance/check', async (c) => {
  const body = await c.req.json()
  return c.json({ eligible: true })
})

// Dynamic authorization
app.get('/api/students/:id', async (c) => {
  const user = getUser(c)
  const studentId = c.req.param('id')

  // Check access
  if (user.studentId !== studentId && !isAdmin(user)) {
    return c.json({ error: 'Access denied' }, 403)
  }

  return c.json({ student: {} })
})

export default app
```

## Environment Setup

```env
CLERK_SECRET_KEY=sk_test_your_clerk_secret_key
```

## TypeScript Integration

```typescript
import type {
  UserContext,
  AuthenticatedContext,
  Permission,
} from '@aah/auth'

app.get('/profile', async (c: AuthenticatedContext) => {
  const user: UserContext = getUser(c)
  return c.json({ user })
})
```

## Testing

```typescript
import { describe, it, expect } from 'vitest'
import { hasPermission, UserRole } from '@aah/auth'

describe('Auth', () => {
  it('should validate admin permissions', () => {
    expect(hasPermission(UserRole.ADMIN, 'user:write')).toBe(true)
  })
})
```

## Common Issues

### "CLERK_SECRET_KEY is not configured"
**Fix:** Add `CLERK_SECRET_KEY` to `.env`

### "User not authenticated"
**Fix:** Include `Authorization: Bearer <token>` header

### "Access denied"
**Fix:** Verify user has required role/permission

## Links

- [Full Documentation](./README.md)
- [Implementation Guide](./IMPLEMENTATION_GUIDE.md)
- [Code Examples](./examples.ts)
- [Changelog](./CHANGELOG.md)

## Support

For issues or questions:
1. Check the [Implementation Guide](./IMPLEMENTATION_GUIDE.md)
2. Review [examples.ts](./examples.ts)
3. Consult the [README](./README.md)
