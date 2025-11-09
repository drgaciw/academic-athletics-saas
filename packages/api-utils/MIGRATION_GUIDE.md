# Migration Guide: Adopting @aah/api-utils

This guide helps you migrate existing microservices to use the shared API utilities package.

## Installation

### Step 1: Add Dependency

Update your service's `package.json`:

```json
{
  "dependencies": {
    "@aah/api-utils": "*",
    "hono": "^3.11.0",
    "zod": "^3.22.4"
  }
}
```

Run installation:
```bash
npm install
```

### Step 2: Update TypeScript Config

Ensure your `tsconfig.json` includes the package:

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "paths": {
      "@aah/api-utils": ["../../packages/api-utils/src"]
    }
  }
}
```

## Migration Steps

### 1. Replace Error Handling

#### Before:
```typescript
// Custom error class
class ApiError extends Error {
  constructor(public message: string, public statusCode: number) {
    super(message);
  }
}

// Usage
throw new ApiError('User not found', 404);

// Error handler
app.onError((err, c) => {
  const status = err.statusCode || 500;
  return c.json({ error: err.message }, status);
});
```

#### After:
```typescript
import {
  NotFoundError,
  createErrorHandler,
  createLogger,
} from '@aah/api-utils';

// Usage
throw new NotFoundError('User not found');

// Error handler
const logger = createLogger('user-service');
app.onError(createErrorHandler(logger));
```

### 2. Standardize Response Formatting

#### Before:
```typescript
// Inconsistent response formats
return c.json({ data: users });
return c.json({ users });
return c.json({ success: true, data: users });
```

#### After:
```typescript
import { successResponse, paginatedResponse } from '@aah/api-utils';

// Single item
return c.json(successResponse(user, c.get('requestId')));

// Paginated list
const { page, pageSize } = parsePaginationParams(c.req.query());
return c.json(paginatedResponse(users, total, { page, pageSize }, c.get('requestId')));
```

### 3. Add Request Validation

#### Before:
```typescript
app.post('/users', async (c) => {
  const body = await c.req.json();

  // Manual validation
  if (!body.email || !body.email.includes('@')) {
    return c.json({ error: 'Invalid email' }, 400);
  }

  if (!body.password || body.password.length < 8) {
    return c.json({ error: 'Password too short' }, 400);
  }

  // Process validated data
  const user = await createUser(body);
  return c.json({ data: user });
});
```

#### After:
```typescript
import { validateRequest, getValidated, CommonSchemas } from '@aah/api-utils';
import { z } from 'zod';

const createUserSchema = z.object({
  email: CommonSchemas.email,
  password: CommonSchemas.password,
  name: CommonSchemas.nonEmptyString,
});

app.post('/users',
  validateRequest(createUserSchema),
  async (c) => {
    const data = getValidated<z.infer<typeof createUserSchema>>(c);
    const user = await createUser(data);
    return c.json(successResponse(user, c.get('requestId')), 201);
  }
);
```

### 4. Replace Console Logging

#### Before:
```typescript
console.log('User created:', userId);
console.error('Database error:', error);
```

#### After:
```typescript
import { createLogger } from '@aah/api-utils';

const logger = createLogger('user-service', {
  minLevel: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
});

logger.info('User created', { userId });
logger.error('Database error', error, { operation: 'createUser' });
```

### 5. Add Request Logging Middleware

#### Before:
```typescript
app.use('*', async (c, next) => {
  console.log(`${c.req.method} ${c.req.path}`);
  await next();
});
```

#### After:
```typescript
import {
  createLogger,
  requestLogger,
  errorLogger,
  requestIdMiddleware,
} from '@aah/api-utils';

const logger = createLogger('user-service');

app.use('*', requestIdMiddleware());
app.use('*', requestLogger(logger));
app.use('*', errorLogger(logger));
```

### 6. Add Rate Limiting

#### Before:
```typescript
// No rate limiting or custom implementation
```

#### After:
```typescript
import { perUserRateLimit, perIpRateLimit } from '@aah/api-utils';

// Global rate limit
app.use('/api/*', perIpRateLimit({
  maxRequests: 100,
  windowMs: 60000, // 1 minute
}));

// Per-user rate limit for authenticated endpoints
app.use('/api/users/*', perUserRateLimit({
  maxRequests: 1000,
  windowMs: 3600000, // 1 hour
}));
```

### 7. Replace Custom HTTP Clients

#### Before:
```typescript
async function callExternalApi() {
  const response = await fetch('https://api.example.com/data');
  if (!response.ok) {
    throw new Error('API call failed');
  }
  return response.json();
}
```

#### After:
```typescript
import { createHttpClient } from '@aah/api-utils';

const externalClient = createHttpClient({
  baseURL: 'https://api.example.com',
  timeout: 5000,
  maxRetries: 3,
  headers: {
    'Authorization': `Bearer ${process.env.API_KEY}`,
  },
});

async function callExternalApi() {
  const response = await externalClient.get('/data');
  return response.data;
}
```

### 8. Add CORS Configuration

#### Before:
```typescript
// No CORS or using cors package
import { cors } from 'hono/cors';

app.use('*', cors());
```

#### After:
```typescript
import { cors } from '@aah/api-utils';

app.use('*', cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
}));
```

## Complete Example: Before and After

### Before (Old Service Structure)

```typescript
import { Hono } from 'hono';

const app = new Hono();

// Manual error handling
class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

// Routes
app.post('/users', async (c) => {
  const body = await c.req.json();

  if (!body.email?.includes('@')) {
    return c.json({ error: 'Invalid email' }, 400);
  }

  try {
    const user = await createUser(body);
    return c.json({ user });
  } catch (error) {
    console.error('Error:', error);
    return c.json({ error: 'Failed to create user' }, 500);
  }
});

app.get('/users', async (c) => {
  const page = parseInt(c.req.query('page') || '1');
  const users = await getUsers(page);
  return c.json({ users });
});

app.onError((err, c) => {
  console.error('Error:', err);
  return c.json({ error: err.message }, 500);
});

export default app;
```

### After (Using API Utils)

```typescript
import { Hono } from 'hono';
import {
  // Middleware
  createErrorHandler,
  notFoundHandler,
  requestIdMiddleware,
  requestLogger,
  errorLogger,
  cors,
  perIpRateLimit,

  // Utilities
  createLogger,
  validateRequest,
  getValidated,
  successResponse,
  paginatedResponse,
  parsePaginationParams,
  CommonSchemas,
} from '@aah/api-utils';
import { z } from 'zod';

// Create logger
const logger = createLogger('user-service');

// Create app
const app = new Hono();

// Global middleware
app.use('*', cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true,
}));
app.use('*', requestIdMiddleware());
app.use('*', requestLogger(logger));
app.use('*', errorLogger(logger));
app.use('/api/*', perIpRateLimit({
  maxRequests: 100,
  windowMs: 60000,
}));

// Validation schemas
const createUserSchema = z.object({
  email: CommonSchemas.email,
  name: CommonSchemas.nonEmptyString,
  password: CommonSchemas.password,
});

// Routes
app.post('/users',
  validateRequest(createUserSchema),
  async (c) => {
    const data = getValidated<z.infer<typeof createUserSchema>>(c);
    const requestId = c.get('requestId');

    const user = await createUser(data);

    logger.info('User created', { userId: user.id, requestId });

    return c.json(
      successResponse(user, requestId),
      201
    );
  }
);

app.get('/users', async (c) => {
  const requestId = c.get('requestId');
  const { page, pageSize } = parsePaginationParams(c.req.query());

  const { users, total } = await getUsers(page, pageSize);

  return c.json(
    paginatedResponse(users, total, { page, pageSize }, requestId)
  );
});

// Error handlers
app.onError(createErrorHandler(logger));
app.notFound(notFoundHandler());

export default app;
```

## Checklist

Use this checklist to track your migration:

- [ ] Added `@aah/api-utils` dependency
- [ ] Updated TypeScript configuration
- [ ] Replaced custom error classes with standard errors
- [ ] Updated error handling middleware
- [ ] Standardized response formats
- [ ] Added request validation with Zod
- [ ] Replaced console.log with structured logger
- [ ] Added request logging middleware
- [ ] Added request ID tracking
- [ ] Configured CORS properly
- [ ] Added rate limiting to endpoints
- [ ] Replaced custom HTTP clients
- [ ] Updated tests to use new utilities
- [ ] Updated documentation
- [ ] Tested all endpoints
- [ ] Verified error responses
- [ ] Verified logging output
- [ ] Verified rate limiting works

## Testing Migration

### 1. Test Error Responses

```bash
# Should return standardized error format
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"email": "invalid"}'

# Expected response:
{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Validation failed",
    "category": "VALIDATION",
    "details": [...],
    "timestamp": "2024-01-01T00:00:00.000Z",
    "requestId": "req_..."
  }
}
```

### 2. Test Success Responses

```bash
# Should return standardized success format
curl http://localhost:3000/users

# Expected response:
{
  "success": true,
  "data": [...],
  "meta": {
    "timestamp": "2024-01-01T00:00:00.000Z",
    "requestId": "req_..."
  }
}
```

### 3. Test Rate Limiting

```bash
# Make 101 requests quickly
for i in {1..101}; do
  curl http://localhost:3000/users
done

# 101st request should return:
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests, please try again later",
    "category": "RATE_LIMIT",
    ...
  }
}
```

### 4. Test Logging

Check logs for structured output:

```json
{
  "level": "info",
  "message": "Incoming request: GET /users",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "service": "user-service",
  "requestId": "req_...",
  "metadata": {
    "method": "GET",
    "path": "/users",
    "type": "request"
  }
}
```

## Common Issues

### Issue 1: Import Errors

**Problem**: Cannot find module '@aah/api-utils'

**Solution**:
1. Ensure package is installed: `npm install`
2. Check TypeScript paths configuration
3. Restart TypeScript server

### Issue 2: Type Errors

**Problem**: Type errors with Hono context

**Solution**: Ensure you're using the same version of Hono across all packages:
```json
{
  "dependencies": {
    "hono": "^3.11.0"
  }
}
```

### Issue 3: Validation Not Working

**Problem**: Validation middleware not catching errors

**Solution**: Ensure middleware is applied before route handler:
```typescript
app.post('/users',
  validateRequest(schema), // Must come before handler
  async (c) => { ... }
);
```

### Issue 4: Request ID Missing

**Problem**: Request ID not appearing in responses

**Solution**: Ensure `requestIdMiddleware()` is applied:
```typescript
app.use('*', requestIdMiddleware());
```

## Gradual Migration Strategy

If you can't migrate everything at once:

1. **Week 1**: Add dependencies and error handling
2. **Week 2**: Add request validation to new endpoints
3. **Week 3**: Add structured logging
4. **Week 4**: Migrate existing endpoints to use validation
5. **Week 5**: Add rate limiting
6. **Week 6**: Standardize all response formats

## Getting Help

- Check README.md for detailed documentation
- Review EXAMPLES.md for usage patterns
- Look at other migrated services for reference
- Ask in the team chat for assistance

## Benefits After Migration

- ✅ Consistent error handling across all services
- ✅ Standardized API responses
- ✅ Type-safe validation with Zod
- ✅ Structured, searchable logs
- ✅ Built-in rate limiting
- ✅ Better developer experience
- ✅ Easier to onboard new developers
- ✅ Reduced code duplication
- ✅ Production-ready utilities
- ✅ Automatic request tracking
