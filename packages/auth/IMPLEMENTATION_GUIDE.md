# Implementation Guide: @aah/auth Package

This guide provides step-by-step instructions for implementing the @aah/auth package across AAH microservices.

## Table of Contents

1. [Setup and Configuration](#setup-and-configuration)
2. [Basic Integration](#basic-integration)
3. [Advanced Patterns](#advanced-patterns)
4. [Service-Specific Examples](#service-specific-examples)
5. [Testing](#testing)
6. [Troubleshooting](#troubleshooting)

---

## Setup and Configuration

### 1. Install Dependencies

The package is already installed as part of the monorepo workspace. If you need to update:

```bash
cd packages/auth
npm install
```

### 2. Environment Variables

Add to your `.env` file:

```env
CLERK_SECRET_KEY=sk_test_your_clerk_secret_key
```

### 3. TypeScript Configuration

Ensure your service's `tsconfig.json` includes the auth package:

```json
{
  "extends": "../../packages/config/tsconfig.json",
  "compilerOptions": {
    "paths": {
      "@aah/auth": ["../../packages/auth"],
      "@aah/database": ["../../packages/database"]
    }
  }
}
```

---

## Basic Integration

### Step 1: Import Required Components

```typescript
import { Hono } from 'hono'
import {
  requireAuth,
  getUser,
  requireRole,
  UserRole,
} from '@aah/auth'
```

### Step 2: Apply Authentication Middleware

```typescript
const app = new Hono()

// Apply to all routes
app.use('*', requireAuth())

// Or apply to specific routes
app.use('/api/*', requireAuth())
```

### Step 3: Access User Context in Handlers

```typescript
app.get('/api/profile', async (c) => {
  const user = getUser(c)

  return c.json({
    userId: user.userId,
    email: user.email,
    role: user.role,
  })
})
```

---

## Advanced Patterns

### Pattern 1: Layered Authorization

```typescript
import { Hono } from 'hono'
import {
  requireAuth,
  requireRole,
  requirePermission,
  UserRole,
} from '@aah/auth'

const app = new Hono()

// Layer 1: Authentication
app.use('*', requireAuth())

// Layer 2: Role-based routing
const adminRoutes = new Hono()
adminRoutes.use('*', requireRole(UserRole.ADMIN))
app.route('/admin', adminRoutes)

// Layer 3: Permission-based actions
adminRoutes.delete('/users/:id', async (c) => {
  // Additional permission check
  checkPermission(c, 'user:delete')

  const id = c.req.param('id')
  // ... delete logic
})
```

### Pattern 2: Conditional Authorization

```typescript
import { getUser, isAdmin, canAccessStudentData } from '@aah/auth'

app.get('/students/:id', async (c) => {
  const user = getUser(c)
  const studentId = c.req.param('id')

  // Admin can access all, students can access own data
  const canAccess = isAdmin(user) ||
    canAccessStudentData(user, studentId)

  if (!canAccess) {
    return c.json({ error: 'Access denied' }, 403)
  }

  // ... fetch student data
})
```

### Pattern 3: Resource-Based Authorization

```typescript
import { getUser, userHasPermission } from '@aah/auth'
import { prisma } from '@aah/database'

app.put('/courses/:id', async (c) => {
  const user = getUser(c)
  const courseId = c.req.param('id')

  // Fetch the resource
  const course = await prisma.course.findUnique({
    where: { id: courseId },
  })

  if (!course) {
    return c.json({ error: 'Course not found' }, 404)
  }

  // Check ownership or admin permission
  const canEdit = course.instructorId === user.userId ||
    userHasPermission(user, 'admin:all')

  if (!canEdit) {
    return c.json({ error: 'Cannot edit this course' }, 403)
  }

  // ... update course
})
```

### Pattern 4: Custom Error Responses

```typescript
import { authMiddleware, rbacMiddleware, AuthError } from '@aah/auth'

const customErrorHandler = (error: AuthError, c: any) => {
  // Log to monitoring service
  console.error(`[${error.code}] ${error.message}`, {
    path: c.req.path,
    method: c.req.method,
    timestamp: new Date().toISOString(),
  })

  // Return custom error format
  return c.json({
    success: false,
    error: {
      type: error.code,
      message: error.message,
      statusCode: error.statusCode,
    },
  }, error.statusCode)
}

app.use('*', authMiddleware({ onError: customErrorHandler }))
app.use('/admin/*', rbacMiddleware({
  roles: UserRole.ADMIN,
  onError: customErrorHandler,
}))
```

---

## Service-Specific Examples

### User Service

```typescript
import { Hono } from 'hono'
import {
  requireAuth,
  requireAdmin,
  getUser,
  checkPermission,
  isAdmin,
} from '@aah/auth'
import { prisma } from '@aah/database'

const app = new Hono()

app.use('*', requireAuth())

// Get user profile (own or admin)
app.get('/users/:id', async (c) => {
  const user = getUser(c)
  const targetId = c.req.param('id')

  // Users can view own profile, admins can view anyone
  if (user.userId !== targetId && !isAdmin(user)) {
    return c.json({ error: 'Access denied' }, 403)
  }

  const profile = await prisma.user.findUnique({
    where: { id: targetId },
    include: { studentProfile: true },
  })

  return c.json({ profile })
})

// Update user profile (own or admin)
app.put('/users/:id', async (c) => {
  const user = getUser(c)
  const targetId = c.req.param('id')

  // Users can update own profile, admins can update anyone
  if (user.userId !== targetId) {
    checkPermission(c, 'user:write')
  }

  const body = await c.req.json()
  const updated = await prisma.user.update({
    where: { id: targetId },
    data: body,
  })

  return c.json({ user: updated })
})

// Create user (admin only)
app.post('/users', async (c) => {
  checkPermission(c, 'user:write')

  const body = await c.req.json()
  const newUser = await prisma.user.create({ data: body })

  return c.json({ user: newUser }, 201)
})

// Delete user (admin only)
app.delete('/users/:id', async (c) => {
  checkPermission(c, 'user:delete')

  const id = c.req.param('id')
  await prisma.user.delete({ where: { id } })

  return c.json({ deleted: true })
})

export default app
```

### Compliance Service

```typescript
import { Hono } from 'hono'
import {
  requireAuth,
  requirePermission,
  getUser,
  checkPermission,
  canAccessStudentData,
} from '@aah/auth'

const app = new Hono()

app.use('*', requireAuth())

// Check eligibility (requires validation permission)
app.post('/compliance/check-eligibility', async (c) => {
  checkPermission(c, 'compliance:validate')

  const user = getUser(c)
  const body = await c.req.json()

  // Perform eligibility check
  const result = {
    isEligible: true,
    checkedBy: user.userId,
    timestamp: new Date().toISOString(),
  }

  return c.json({ result })
})

// Get compliance status (restricted access)
app.get('/compliance/status/:studentId', async (c) => {
  const user = getUser(c)
  const studentId = c.req.param('studentId')

  // Check access to student data
  if (!canAccessStudentData(user, studentId)) {
    return c.json({ error: 'Access denied' }, 403)
  }

  checkPermission(c, 'compliance:read')

  // Fetch compliance records
  const status = {
    studentId,
    isEligible: true,
    lastChecked: new Date().toISOString(),
  }

  return c.json({ status })
})

// Update compliance rules (admin only)
app.post('/compliance/update-rules', async (c) => {
  checkPermission(c, 'compliance:admin')

  const body = await c.req.json()

  // Update rules logic
  return c.json({ updated: true })
})

export default app
```

### AI Service

```typescript
import { Hono } from 'hono'
import {
  requireAuth,
  requirePermission,
  getUser,
  checkPermission,
} from '@aah/auth'

const app = new Hono()

app.use('*', requireAuth())

// Chat endpoint (basic permission)
app.post('/ai/chat', async (c) => {
  checkPermission(c, 'ai:chat')

  const user = getUser(c)
  const body = await c.req.json()

  // Process chat message
  const response = {
    message: 'AI response',
    userId: user.userId,
  }

  return c.json({ response })
})

// Analytics endpoint (elevated permission)
app.post('/ai/analyze', async (c) => {
  checkPermission(c, 'ai:analyze')

  const body = await c.req.json()

  // Perform analysis
  return c.json({ analysis: {} })
})

// Admin endpoints (admin permission)
app.post('/ai/embeddings/generate', async (c) => {
  checkPermission(c, 'ai:admin')

  const body = await c.req.json()

  // Generate embeddings
  return c.json({ generated: true })
})

export default app
```

### Monitoring Service

```typescript
import { Hono } from 'hono'
import {
  requireAuth,
  getUser,
  checkAnyPermission,
  canAccessStudentData,
  UserRole,
} from '@aah/auth'

const app = new Hono()

app.use('*', requireAuth())

// Get performance metrics
app.get('/monitoring/performance/:studentId', async (c) => {
  const user = getUser(c)
  const studentId = c.req.param('studentId')

  // Check access
  if (!canAccessStudentData(user, studentId)) {
    return c.json({ error: 'Access denied' }, 403)
  }

  checkAnyPermission(c, ['monitoring:read', 'admin:all'])

  // Fetch performance data
  return c.json({ performance: {} })
})

// Submit progress report (faculty/coach)
app.post('/monitoring/progress-report', async (c) => {
  const user = getUser(c)

  // Only faculty and coaches can submit reports
  if (![UserRole.FACULTY, UserRole.COACH, UserRole.ADMIN].includes(user.role)) {
    return c.json({ error: 'Not authorized to submit reports' }, 403)
  }

  checkPermission(c, 'monitoring:write')

  const body = await c.req.json()

  // Save progress report
  return c.json({ submitted: true })
})

// Generate alerts (elevated permission)
app.post('/monitoring/alerts', async (c) => {
  checkPermission(c, 'monitoring:alerts')

  const body = await c.req.json()

  // Generate alert
  return c.json({ alert: {} })
})

export default app
```

---

## Testing

### Unit Testing Authentication Logic

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import {
  hasPermission,
  userHasPermission,
  isAdmin,
  canAccessStudentData,
  UserRole,
  type UserContext,
} from '@aah/auth'

describe('Auth Utilities', () => {
  it('should check role permissions correctly', () => {
    expect(hasPermission(UserRole.ADMIN, 'user:write')).toBe(true)
    expect(hasPermission(UserRole.STUDENT_ATHLETE, 'user:delete')).toBe(false)
  })

  it('should identify admin users', () => {
    const adminUser: UserContext = {
      userId: '1',
      clerkId: 'clerk_1',
      email: 'admin@test.com',
      role: UserRole.ADMIN,
      permissions: [],
    }

    expect(isAdmin(adminUser)).toBe(true)
  })

  it('should validate student data access', () => {
    const studentUser: UserContext = {
      userId: '1',
      clerkId: 'clerk_1',
      email: 'student@test.com',
      role: UserRole.STUDENT_ATHLETE,
      studentId: 'S123',
      permissions: [],
    }

    expect(canAccessStudentData(studentUser, 'S123')).toBe(true)
    expect(canAccessStudentData(studentUser, 'S456')).toBe(false)
  })
})
```

### Integration Testing with Hono

```typescript
import { describe, it, expect } from 'vitest'
import { Hono } from 'hono'
import { requireAuth, requireRole, UserRole } from '@aah/auth'

describe('Auth Middleware Integration', () => {
  const app = new Hono()

  app.use('*', requireAuth())
  app.get('/profile', async (c) => {
    const user = c.get('user')
    return c.json({ user })
  })

  it('should reject requests without token', async () => {
    const res = await app.request('/profile')
    expect(res.status).toBe(401)
  })

  it('should accept requests with valid token', async () => {
    const res = await app.request('/profile', {
      headers: {
        Authorization: 'Bearer valid_token_here',
      },
    })
    expect(res.status).toBe(200)
  })
})
```

---

## Troubleshooting

### Common Issues

#### 1. "CLERK_SECRET_KEY is not configured"

**Solution:** Add the Clerk secret key to your `.env` file:

```env
CLERK_SECRET_KEY=sk_test_your_key_here
```

#### 2. "User not authenticated" when user should be authenticated

**Causes:**
- Token not included in Authorization header
- Token format incorrect (should be `Bearer <token>`)
- Token expired
- Clerk secret key mismatch

**Debug:**
```typescript
app.use('*', authMiddleware({
  onError: (error, c) => {
    console.error('Auth Error:', {
      code: error.code,
      message: error.message,
      headers: c.req.header(),
    })
    return c.json({ error: error.message }, error.statusCode)
  }
}))
```

#### 3. "Access denied" for valid user

**Causes:**
- User role doesn't match required role
- User missing required permission
- User metadata not synced from Clerk

**Debug:**
```typescript
app.get('/debug/user', async (c) => {
  const user = getUser(c)
  return c.json({
    userId: user.userId,
    role: user.role,
    permissions: user.permissions,
  })
})
```

#### 4. TypeScript errors importing package

**Solution:** Check your `tsconfig.json` paths:

```json
{
  "compilerOptions": {
    "paths": {
      "@aah/auth": ["../../packages/auth"]
    }
  }
}
```

### Performance Optimization

#### 1. Cache User Context

Instead of fetching user data on every request, cache it:

```typescript
import { LRUCache } from 'lru-cache'

const userCache = new LRUCache<string, UserContext>({
  max: 500,
  ttl: 1000 * 60 * 5, // 5 minutes
})

// In auth middleware
const cachedUser = userCache.get(clerkPayload.sub)
if (cachedUser) {
  c.set('user', cachedUser)
  return next()
}

// Fetch and cache
const user = await fetchUserFromDatabase(clerkPayload.sub)
userCache.set(clerkPayload.sub, user)
```

#### 2. Optimize Permission Checks

Use permission sets for faster lookups:

```typescript
const permissionSet = new Set(user.permissions)

function fastHasPermission(permission: Permission): boolean {
  return permissionSet.has(permission) || permissionSet.has('admin:all')
}
```

---

## Best Practices

1. **Apply authentication early** in your middleware chain
2. **Use role-specific middleware** for common patterns
3. **Implement custom error handlers** for better UX
4. **Cache user context** to reduce database queries
5. **Log authorization failures** for security monitoring
6. **Test permission logic** thoroughly
7. **Keep Clerk metadata in sync** with your database
8. **Use resource-based authorization** for fine-grained control
9. **Document required roles/permissions** for each endpoint
10. **Monitor authentication errors** in production

---

## Next Steps

1. Implement authentication in your microservice
2. Add role-based routing
3. Implement permission checks
4. Add custom error handling
5. Write tests for authorization logic
6. Deploy and monitor

For more examples, see [examples.ts](./examples.ts) and [README.md](./README.md).
