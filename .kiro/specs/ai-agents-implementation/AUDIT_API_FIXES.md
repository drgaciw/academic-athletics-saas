# Audit API - Critical Fixes Implementation Guide

**Priority**: 🔴 CRITICAL - Must fix before deployment  
**Estimated Time**: 3-4 hours  
**Date**: November 8, 2025

## Quick Fix Checklist

- [ ] 1. Regenerate Prisma Client (5 min)
- [ ] 2. Implement RBAC (2 hours)
- [ ] 3. Add Rate Limiting (1 hour)
- [ ] 4. Test All Routes (30 min)

---

## Fix 1: Regenerate Prisma Client (5 min)

### Problem
TypeScript errors in `audit-logger.ts` because Prisma client is out of sync with schema.

### Solution
```bash
# Step 1: Regenerate Prisma client
cd packages/database
npx prisma generate

# Step 2: Reinstall dependencies in AI package
cd ../ai
pnpm install

# Step 3: Verify no TypeScript errors
npx tsc --noEmit
```

### Verification
```bash
# Should show no errors
npx tsc --noEmit packages/ai/lib/audit-logger.ts
```

---

## Fix 2: Implement RBAC (2 hours)

### Problem
All routes have TODO comments but no actual role checking.

### Solution

**File**: `services/ai/src/routes/audit.ts`

```typescript
import { checkPermission } from '@aah/auth'

// Add helper function at top of file
function requirePermission(c: any, permission: string) {
  try {
    checkPermission(c, permission)
  } catch (error) {
    throw new Error(`Insufficient permissions: ${permission}`)
  }
}

// Update /logs route
app.get('/logs', zValidator('query', queryLogsSchema), async (c) => {
  try {
    const query = c.req.valid('query')
    const authUserId = c.req.header('X-User-Id')
    const userRole = c.req.header('X-User-Role')

    if (!authUserId) {
      return c.json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      }, 401)
    }

    // Check if querying other users' logs
    if (query.userId && query.userId !== authUserId) {
      // Only admins and staff can query all logs
      if (userRole !== 'ADMIN' && userRole !== 'STAFF') {
        return c.json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You can only query your own audit logs',
          },
        }, 403)
      }
    }

    const filters: AuditQueryFilters = {
      userId: query.userId || authUserId,
      // ... rest of filters
    }

    const logs = await queryAuditLogs(filters)

    return c.json({
      success: true,
      data: {
        logs,
        count: logs.length,
        filters,
      },
    })
  } catch (error) {
    console.error('Error querying audit logs:', error)
    return c.json({
      success: false,
      error: {
        code: 'QUERY_FAILED',
        message: 'Failed to query audit logs',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    }, 500)
  }
})

// Update /statistics route
app.get('/statistics', zValidator('query', statisticsSchema), async (c) => {
  try {
    const query = c.req.valid('query')
    const authUserId = c.req.header('X-User-Id')
    const userRole = c.req.header('X-User-Role')

    if (!authUserId) {
      return c.json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      }, 401)
    }

    // Only admins and staff can query statistics for all users
    if (query.userId && query.userId !== authUserId) {
      if (userRole !== 'ADMIN' && userRole !== 'STAFF') {
        return c.json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You can only query your own statistics',
          },
        }, 403)
      }
    }

    const filters: AuditQueryFilters = {
      userId: query.userId || authUserId,
      // ... rest of filters
    }

    const statistics = await getAuditStatistics(filters)

    return c.json({
      success: true,
      data: statistics,
    })
  } catch (error) {
    console.error('Error getting audit statistics:', error)
    return c.json({
      success: false,
      error: {
        code: 'STATISTICS_FAILED',
        message: 'Failed to get audit statistics',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    }, 500)
  }
})

// Update /activity/:userId route
app.get('/activity/:userId', zValidator('query', userActivitySchema), async (c) => {
  try {
    const userId = c.req.param('userId')
    const query = c.req.valid('query')
    const authUserId = c.req.header('X-User-Id')
    const userRole = c.req.header('X-User-Role')

    if (!authUserId) {
      return c.json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      }, 401)
    }

    // Users can only query their own activity (unless admin/staff)
    if (userId !== authUserId) {
      if (userRole !== 'ADMIN' && userRole !== 'STAFF') {
        return c.json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You can only query your own activity',
          },
        }, 403)
      }
    }

    const activity = await getUserActivity(userId, query.days || 30)

    return c.json({
      success: true,
      data: activity,
    })
  } catch (error) {
    console.error('Error getting user activity:', error)
    return c.json({
      success: false,
      error: {
        code: 'ACTIVITY_FAILED',
        message: 'Failed to get user activity',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    }, 500)
  }
})

// Update /compliance-report route
app.post('/compliance-report', zValidator('json', complianceReportSchema), async (c) => {
  try {
    const body = c.req.valid('json')
    const authUserId = c.req.header('X-User-Id')
    const userRole = c.req.header('X-User-Role')

    if (!authUserId) {
      return c.json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      }, 401)
    }

    // Only admins can generate compliance reports
    if (userRole !== 'ADMIN') {
      return c.json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Admin access required to generate compliance reports',
        },
      }, 403)
    }

    const startDate = new Date(body.startDate)
    const endDate = new Date(body.endDate)

    const report = await getComplianceReport(startDate, endDate)

    return c.json({
      success: true,
      data: {
        ...report,
        period: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          days: Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)),
        },
      },
    })
  } catch (error) {
    console.error('Error generating compliance report:', error)
    return c.json({
      success: false,
      error: {
        code: 'REPORT_FAILED',
        message: 'Failed to generate compliance report',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    }, 500)
  }
})

// Update /logs/:logId route
app.get('/logs/:logId', async (c) => {
  try {
    const logId = c.req.param('logId')
    const authUserId = c.req.header('X-User-Id')
    const userRole = c.req.header('X-User-Role')

    if (!authUserId) {
      return c.json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      }, 401)
    }

    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()

    try {
      const log = await prisma.aIAuditLog.findUnique({
        where: { id: logId },
      })

      if (!log) {
        return c.json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Audit log not found',
          },
        }, 404)
      }

      // Users can only view their own logs (unless admin/staff)
      if (log.userId !== authUserId) {
        if (userRole !== 'ADMIN' && userRole !== 'STAFF') {
          return c.json({
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'You can only view your own audit logs',
            },
          }, 403)
        }
      }

      return c.json({
        success: true,
        data: log,
      })
    } finally {
      await prisma.$disconnect()
    }
  } catch (error) {
    console.error('Error getting audit log:', error)
    return c.json({
      success: false,
      error: {
        code: 'FETCH_FAILED',
        message: 'Failed to fetch audit log',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    }, 500)
  }
})
```

### Verification
```bash
# Test with different roles
curl -X GET http://localhost:3007/api/ai/audit/logs \
  -H "X-User-Id: user123" \
  -H "X-User-Role: STUDENT"

# Should return only user's own logs

curl -X GET http://localhost:3007/api/ai/audit/logs?userId=other-user \
  -H "X-User-Id: user123" \
  -H "X-User-Role: STUDENT"

# Should return 403 Forbidden

curl -X GET http://localhost:3007/api/ai/audit/logs?userId=other-user \
  -H "X-User-Id: admin123" \
  -H "X-User-Role: ADMIN"

# Should return other user's logs
```

---

## Fix 3: Add Rate Limiting (1 hour)

### Problem
No rate limiting on expensive audit queries.

### Solution

**File**: `services/ai/src/routes/audit.ts`

```typescript
import { rateLimitMiddleware } from '@aah/auth'

// Add at top of file, before route definitions
const app = new Hono()

// Apply rate limiting to all audit routes
app.use('*', rateLimitMiddleware({
  windowMs: 60000, // 1 minute
  max: 20, // 20 requests per minute for authenticated users
  maxAuthenticated: 20,
  maxAdmin: 100, // Admins get higher limits
  message: 'Too many audit log requests. Please try again later.',
}))

// Stricter limits for expensive queries
app.use('/logs', rateLimitMiddleware({
  windowMs: 60000,
  max: 10, // 10 requests per minute
  maxAuthenticated: 10,
  maxAdmin: 50,
}))

app.use('/compliance-report', rateLimitMiddleware({
  windowMs: 300000, // 5 minutes
  max: 5, // 5 reports per 5 minutes
  maxAdmin: 20,
}))

// Then define routes...
```

### Verification
```bash
# Test rate limiting
for i in {1..15}; do
  curl -X GET http://localhost:3007/api/ai/audit/logs \
    -H "X-User-Id: user123" \
    -H "X-User-Role: STUDENT"
  echo "Request $i"
done

# Should see 429 Too Many Requests after 10 requests
```

---

## Fix 4: Test All Routes (30 min)

### Test Script

**File**: `services/ai/src/__tests__/audit-routes.test.ts`

```typescript
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import app from '../index'

describe('Audit API Routes', () => {
  describe('GET /api/ai/audit/logs', () => {
    it('should require authentication', async () => {
      const response = await app.request('/api/ai/audit/logs')
      expect(response.status).toBe(401)
    })

    it('should return user logs', async () => {
      const response = await app.request('/api/ai/audit/logs', {
        headers: {
          'X-User-Id': 'user123',
          'X-User-Role': 'STUDENT',
        },
      })
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.logs).toBeDefined()
    })

    it('should forbid querying other users logs for students', async () => {
      const response = await app.request('/api/ai/audit/logs?userId=other-user', {
        headers: {
          'X-User-Id': 'user123',
          'X-User-Role': 'STUDENT',
        },
      })
      expect(response.status).toBe(403)
    })

    it('should allow admins to query all logs', async () => {
      const response = await app.request('/api/ai/audit/logs?userId=other-user', {
        headers: {
          'X-User-Id': 'admin123',
          'X-User-Role': 'ADMIN',
        },
      })
      expect(response.status).toBe(200)
    })
  })

  describe('GET /api/ai/audit/statistics', () => {
    it('should return statistics', async () => {
      const response = await app.request('/api/ai/audit/statistics', {
        headers: {
          'X-User-Id': 'user123',
          'X-User-Role': 'STUDENT',
        },
      })
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.totalActions).toBeDefined()
    })
  })

  describe('POST /api/ai/audit/compliance-report', () => {
    it('should require admin role', async () => {
      const response = await app.request('/api/ai/audit/compliance-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': 'user123',
          'X-User-Role': 'STUDENT',
        },
        body: JSON.stringify({
          startDate: '2025-01-01T00:00:00Z',
          endDate: '2025-11-08T00:00:00Z',
        }),
      })
      expect(response.status).toBe(403)
    })

    it('should generate report for admins', async () => {
      const response = await app.request('/api/ai/audit/compliance-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': 'admin123',
          'X-User-Role': 'ADMIN',
        },
        body: JSON.stringify({
          startDate: '2025-01-01T00:00:00Z',
          endDate: '2025-11-08T00:00:00Z',
        }),
      })
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.totalActions).toBeDefined()
    })
  })
})
```

### Run Tests
```bash
cd services/ai
pnpm test src/__tests__/audit-routes.test.ts
```

---

## Summary

### Before Deployment Checklist

- [ ] Prisma client regenerated
- [ ] RBAC implemented for all routes
- [ ] Rate limiting applied
- [ ] All tests passing
- [ ] Manual testing completed
- [ ] Documentation updated

### Expected Results

✅ **Security**: Only authorized users can access audit logs  
✅ **Performance**: Rate limiting prevents database overload  
✅ **Reliability**: All routes tested and working  
✅ **Compliance**: FERPA-compliant access controls

### Time Estimate

- Fix 1: 5 minutes
- Fix 2: 2 hours
- Fix 3: 1 hour
- Fix 4: 30 minutes
- **Total**: ~3.5 hours

---

**Status**: Ready for Implementation  
**Priority**: 🔴 CRITICAL  
**Owner**: AI Team  
**Deadline**: Before production deployment

