# Audit API Routes - Claude Cookbook Review

**Date**: November 8, 2025  
**File**: `services/ai/src/routes/audit.ts`  
**Status**: ⚠️ Needs Improvements

## Executive Summary

The newly created audit API routes provide comprehensive access to AI agent audit logs with FERPA-compliant access controls. However, there are several critical issues and opportunities for improvement based on [Claude Cookbooks best practices](https://github.com/anthropics/claude-cookbooks).

---

## 🔴 Critical Issues

### 1. **Prisma Client Out of Sync**

**Issue**: TypeScript errors in `packages/ai/lib/audit-logger.ts` indicate the Prisma client hasn't been regenerated after schema updates.

**Evidence**:
- Lines 82, 155: `agentType` field errors
- Lines 234-253: Multiple field access errors (`success`, `toolName`, `errorCode`)

**Root Cause**: The `AIAuditLog` schema was updated with new fields, but `npx prisma generate` wasn't run.

**Fix**:
```bash
cd packages/database
npx prisma generate
```

**Impact**: HIGH - API will fail at runtime when accessing these fields.

---

### 2. **Missing Role-Based Access Control**

**Issue**: All routes have TODO comments for role checking but no implementation.

**Current Code**:
```typescript
// TODO: Check if user has admin/staff role
// For now, users can only query their own logs
const filters: AuditQueryFilters = {
  userId: query.userId || authUserId,
  // ...
}
```

**Cookbook Reference**: [Tool Use & Function Calling - Permission Validation](https://github.com/anthropics/anthropic-cookbook/blob/main/tool_use/customer_service_agent.ipynb)

**Recommendation**:
```typescript
// Add role checking middleware
import { checkPermission } from '@aah/auth'

app.get('/logs', async (c) => {
  const authUserId = c.req.header('X-User-Id')
  const userRole = c.req.header('X-User-Role')
  
  // Only admins and staff can query all logs
  if (query.userId && query.userId !== authUserId) {
    try {
      checkPermission(c, 'audit:read:all')
    } catch (error) {
      return c.json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions to query other users\' logs',
        },
      }, 403)
    }
  }
  
  // Users can always query their own logs
  const filters: AuditQueryFilters = {
    userId: query.userId || authUserId,
    // ...
  }
})
```

**Impact**: HIGH - Security vulnerability allowing unauthorized access.

---

### 3. **No Rate Limiting**

**Issue**: Audit log queries can be expensive (large result sets, complex filters). No rate limiting is implemented.

**Cookbook Reference**: [Performance Optimization - Rate Limiting](https://github.com/anthropics/anthropic-cookbook/blob/main/misc/how_to_enable_json_mode.ipynb)

**Recommendation**:
```typescript
import { rateLimitMiddleware } from '@aah/auth'

// Apply stricter rate limits for audit queries
app.use('/logs', rateLimitMiddleware({
  windowMs: 60000, // 1 minute
  max: 10, // 10 requests per minute
  message: 'Too many audit log queries. Please try again later.',
}))

app.use('/statistics', rateLimitMiddleware({
  windowMs: 60000,
  max: 20, // Statistics are less expensive
}))
```

**Impact**: MEDIUM - Could lead to database overload.

---

## ⚠️ Important Improvements

### 4. **Pagination Missing**

**Issue**: The `/logs` endpoint has a `limit` parameter but no pagination support (offset, cursor).

**Current Code**:
```typescript
limit: query.limit || 100,
```

**Cookbook Reference**: [Context Management - Efficient Data Retrieval](https://github.com/anthropics/anthropic-cookbook/blob/main/multimodal/best_practices_for_vision.ipynb)

**Recommendation**:
```typescript
const paginationSchema = z.object({
  // ... existing fields
  limit: z.number().int().min(1).max(1000).optional(),
  offset: z.number().int().min(0).optional(),
  cursor: z.string().optional(), // For cursor-based pagination
})

// In route handler
const filters: AuditQueryFilters = {
  // ... existing filters
  limit: query.limit || 100,
  offset: query.offset || 0,
}

const logs = await queryAuditLogs(filters)
const hasMore = logs.length === filters.limit

return c.json({
  success: true,
  data: {
    logs,
    count: logs.length,
    pagination: {
      limit: filters.limit,
      offset: filters.offset,
      hasMore,
      nextOffset: hasMore ? (filters.offset || 0) + filters.limit : null,
    },
    filters,
  },
})
```

**Impact**: MEDIUM - Poor UX for large result sets.

---

### 5. **No Response Caching**

**Issue**: Audit statistics and compliance reports are expensive to compute but rarely change.

**Cookbook Reference**: [Performance - Caching Strategies](https://github.com/anthropics/anthropic-cookbook/blob/main/misc/how_to_enable_json_mode.ipynb)

**Recommendation**:
```typescript
import { globalResponseCache } from '@aah/ai'

app.get('/statistics', async (c) => {
  const query = c.req.valid('query')
  
  // Generate cache key
  const cacheKey = `audit-stats:${query.userId || 'all'}:${query.agentType || 'all'}:${query.startDate || 'all'}:${query.endDate || 'all'}`
  
  // Try cache first
  const cached = await globalResponseCache.get(cacheKey)
  if (cached) {
    return c.json({
      success: true,
      data: cached,
      cached: true,
    })
  }
  
  // Compute statistics
  const statistics = await getAuditStatistics(filters)
  
  // Cache for 5 minutes
  await globalResponseCache.set(cacheKey, statistics, 300000)
  
  return c.json({
    success: true,
    data: statistics,
    cached: false,
  })
})
```

**Impact**: MEDIUM - Unnecessary database load.

---

### 6. **Inconsistent Error Handling**

**Issue**: Error responses are inconsistent. Some include `details`, others don't.

**Current Code**:
```typescript
// Some routes
return c.json({
  success: false,
  error: {
    code: 'QUERY_FAILED',
    message: 'Failed to query audit logs',
    details: error instanceof Error ? error.message : 'Unknown error',
  },
}, 500)

// Other routes
return c.json({
  success: false,
  error: {
    code: 'UNAUTHORIZED',
    message: 'Authentication required',
  },
}, 401)
```

**Cookbook Reference**: [Error Handling - Consistent Error Format](https://github.com/anthropics/anthropic-cookbook/blob/main/tool_use/customer_service_agent.ipynb)

**Recommendation**:
```typescript
// Create error response helper
function errorResponse(
  code: string,
  message: string,
  statusCode: number,
  details?: string
) {
  return {
    success: false,
    error: {
      code,
      message,
      ...(details && process.env.NODE_ENV !== 'production' && { details }),
      timestamp: new Date().toISOString(),
    },
  }
}

// Use consistently
return c.json(
  errorResponse('QUERY_FAILED', 'Failed to query audit logs', 500, error.message),
  500
)
```

**Impact**: LOW - Developer experience issue.

---

### 7. **No Input Sanitization**

**Issue**: User inputs (especially date strings) are not sanitized before use.

**Cookbook Reference**: [Safety - Input Validation](https://github.com/anthropics/anthropic-cookbook/blob/main/misc/how_to_enable_json_mode.ipynb)

**Recommendation**:
```typescript
import { sanitizeUserInput } from '@aah/ai'

app.get('/logs', async (c) => {
  const query = c.req.valid('query')
  
  // Sanitize string inputs
  const sanitizedFilters = {
    userId: query.userId ? sanitizeUserInput(query.userId) : undefined,
    toolName: query.toolName ? sanitizeUserInput(query.toolName) : undefined,
    // ... other fields
  }
  
  // Validate date ranges
  if (query.startDate && query.endDate) {
    const start = new Date(query.startDate)
    const end = new Date(query.endDate)
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return c.json(
        errorResponse('INVALID_DATE', 'Invalid date format', 400),
        400
      )
    }
    
    if (start > end) {
      return c.json(
        errorResponse('INVALID_RANGE', 'Start date must be before end date', 400),
        400
      )
    }
    
    // Limit date range to prevent expensive queries
    const maxRangeDays = 365
    const rangeDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    if (rangeDays > maxRangeDays) {
      return c.json(
        errorResponse('RANGE_TOO_LARGE', `Date range cannot exceed ${maxRangeDays} days`, 400),
        400
      )
    }
  }
})
```

**Impact**: MEDIUM - Security and data integrity risk.

---

## ✅ Good Practices Already Implemented

### 1. **Zod Schema Validation**
- All inputs validated with Zod schemas
- Type-safe request handling

### 2. **Consistent Response Format**
- All responses follow `{ success, data/error }` pattern
- HTTP status codes used correctly

### 3. **Authentication Checks**
- All routes check for `X-User-Id` header
- Proper 401 responses for unauthenticated requests

### 4. **Comprehensive Documentation**
- JSDoc comments for all routes
- Query parameters documented
- Response formats described

### 5. **Proper Indexing**
- Database indexes on frequently queried fields
- Efficient query performance

---

## 📋 Action Items

### Immediate (Before Deployment)

1. **Regenerate Prisma Client**
   ```bash
   cd packages/database
   npx prisma generate
   cd ../ai
   pnpm install
   ```

2. **Implement RBAC**
   - Add role checking for admin/staff routes
   - Use `checkPermission` from `@aah/auth`

3. **Add Rate Limiting**
   - Apply `rateLimitMiddleware` to all routes
   - Use stricter limits for expensive queries

### Short-Term (This Week)

4. **Add Pagination**
   - Implement offset-based pagination
   - Add `hasMore` and `nextOffset` to responses

5. **Implement Caching**
   - Cache statistics for 5 minutes
   - Cache compliance reports for 1 hour
   - Use `globalResponseCache` from `@aah/ai`

6. **Improve Error Handling**
   - Create `errorResponse` helper
   - Consistent error format across all routes
   - Hide error details in production

### Medium-Term (Next Sprint)

7. **Add Input Sanitization**
   - Sanitize all string inputs
   - Validate date ranges
   - Limit query complexity

8. **Add Monitoring**
   - Log slow queries (>1s)
   - Track cache hit rates
   - Monitor error rates

9. **Write Tests**
   - Unit tests for each route
   - Integration tests with database
   - Security tests for RBAC

---

## 🎯 Cookbook Patterns to Apply

### 1. **Tool Use Pattern** (for RBAC)
Reference: [Customer Service Agent](https://github.com/anthropics/anthropic-cookbook/blob/main/tool_use/customer_service_agent.ipynb)

```typescript
// Define permission tools
const permissions = {
  'audit:read:own': ['STUDENT', 'COACH', 'FACULTY', 'STAFF', 'ADMIN'],
  'audit:read:all': ['STAFF', 'ADMIN'],
  'audit:write': ['ADMIN'],
}

function hasPermission(userRole: string, permission: string): boolean {
  return permissions[permission]?.includes(userRole) || false
}
```

### 2. **Caching Pattern** (for performance)
Reference: [Prompt Caching](https://github.com/anthropics/anthropic-cookbook/blob/main/misc/prompt_caching.ipynb)

```typescript
// Cache expensive computations
const CACHE_TTL = {
  statistics: 5 * 60 * 1000, // 5 minutes
  complianceReport: 60 * 60 * 1000, // 1 hour
  userActivity: 10 * 60 * 1000, // 10 minutes
}
```

### 3. **Error Handling Pattern** (for consistency)
Reference: [Error Handling Best Practices](https://github.com/anthropics/anthropic-cookbook/blob/main/tool_use/customer_service_agent.ipynb)

```typescript
// Centralized error handling
class AuditAPIError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number,
    public details?: string
  ) {
    super(message)
  }
}

// Error middleware
app.onError((err, c) => {
  if (err instanceof AuditAPIError) {
    return c.json(errorResponse(err.code, err.message, err.statusCode, err.details), err.statusCode)
  }
  
  // Unexpected errors
  console.error('Unexpected error:', err)
  return c.json(errorResponse('INTERNAL_ERROR', 'An unexpected error occurred', 500), 500)
})
```

---

## 📊 Estimated Impact

| Issue | Priority | Effort | Impact | Risk if Not Fixed |
|-------|----------|--------|--------|-------------------|
| Prisma Client Sync | 🔴 Critical | 5 min | HIGH | Runtime failures |
| RBAC Implementation | 🔴 Critical | 2 hours | HIGH | Security breach |
| Rate Limiting | ⚠️ High | 1 hour | MEDIUM | Database overload |
| Pagination | ⚠️ High | 2 hours | MEDIUM | Poor UX |
| Caching | ⚠️ Medium | 3 hours | MEDIUM | High costs |
| Error Handling | ⚠️ Low | 1 hour | LOW | Confusion |
| Input Sanitization | ⚠️ Medium | 2 hours | MEDIUM | Security risk |

**Total Effort**: ~11 hours  
**Total Impact**: Prevents security vulnerabilities, improves performance, enhances UX

---

## 🔗 References

1. [Claude Cookbooks - Tool Use](https://github.com/anthropics/anthropic-cookbook/tree/main/tool_use)
2. [Claude Cookbooks - Prompt Caching](https://github.com/anthropics/anthropic-cookbook/blob/main/misc/prompt_caching.ipynb)
3. [Claude Cookbooks - Best Practices](https://github.com/anthropics/anthropic-cookbook/blob/main/multimodal/best_practices_for_vision.ipynb)
4. [Vercel AI SDK - Error Handling](https://sdk.vercel.ai/docs/ai-sdk-core/error-handling)
5. [Hono - Middleware](https://hono.dev/docs/guides/middleware)

---

**Status**: ⚠️ Needs Improvements Before Production  
**Next Review**: After implementing critical fixes  
**Owner**: AI Team

