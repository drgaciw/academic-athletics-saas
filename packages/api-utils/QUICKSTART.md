# Quick Start Guide - @aah/api-utils

Get up and running with the API utilities package in 5 minutes.

## Installation

```bash
# Navigate to your service
cd services/your-service

# Add dependency to package.json
npm install

# The package is already available via workspace protocol
```

## Minimal Setup

Create a new service with all essential utilities:

```typescript
import { Hono } from 'hono';
import {
  createLogger,
  createErrorHandler,
  requestIdMiddleware,
  requestLogger,
  cors,
  successResponse,
} from '@aah/api-utils';

// 1. Create logger
const logger = createLogger('my-service');

// 2. Create app
const app = new Hono();

// 3. Add middleware
app.use('*', cors());
app.use('*', requestIdMiddleware());
app.use('*', requestLogger(logger));

// 4. Add routes
app.get('/health', (c) => {
  return c.json(successResponse({ status: 'healthy' }, c.get('requestId')));
});

// 5. Add error handler
app.onError(createErrorHandler(logger));

// 6. Start server
export default app;
```

## Add Request Validation

```typescript
import { validateRequest, getValidated, CommonSchemas } from '@aah/api-utils';
import { z } from 'zod';

// Define schema
const userSchema = z.object({
  email: CommonSchemas.email,
  name: CommonSchemas.nonEmptyString,
});

// Use in route
app.post('/users',
  validateRequest(userSchema),
  async (c) => {
    const data = getValidated<z.infer<typeof userSchema>>(c);
    // data is validated and typed!
    return c.json(successResponse({ message: 'User created' }), 201);
  }
);
```

## Add Pagination

```typescript
import {
  parsePaginationParams,
  paginatedResponse,
} from '@aah/api-utils';

app.get('/users', async (c) => {
  // Parse ?page=1&pageSize=20
  const { page, pageSize } = parsePaginationParams(c.req.query());

  // Fetch data
  const users = await db.user.findMany({
    skip: (page - 1) * pageSize,
    take: pageSize,
  });
  const total = await db.user.count();

  // Return paginated response
  return c.json(
    paginatedResponse(users, total, { page, pageSize }, c.get('requestId'))
  );
});
```

## Add Rate Limiting

```typescript
import { perIpRateLimit } from '@aah/api-utils';

// 100 requests per minute per IP
app.use('/api/*', perIpRateLimit({
  maxRequests: 100,
  windowMs: 60000,
}));
```

## Throw Errors

```typescript
import { NotFoundError, ValidationError } from '@aah/api-utils';

app.get('/users/:id', async (c) => {
  const user = await db.user.findUnique({
    where: { id: c.req.param('id') }
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  return c.json(successResponse(user, c.get('requestId')));
});
```

## Call External APIs

```typescript
import { createHttpClient } from '@aah/api-utils';

const externalClient = createHttpClient({
  baseURL: 'https://api.external.com',
  timeout: 5000,
  maxRetries: 3,
});

app.get('/external-data', async (c) => {
  const response = await externalClient.get('/data');
  return c.json(successResponse(response.data, c.get('requestId')));
});
```

## Complete Example

```typescript
import { Hono } from 'hono';
import {
  // Setup
  createLogger,
  createErrorHandler,
  notFoundHandler,

  // Middleware
  requestIdMiddleware,
  requestLogger,
  errorLogger,
  cors,
  perIpRateLimit,

  // Validation
  validateRequest,
  getValidated,
  CommonSchemas,

  // Responses
  successResponse,
  paginatedResponse,
  parsePaginationParams,

  // Errors
  NotFoundError,
} from '@aah/api-utils';
import { z } from 'zod';

const logger = createLogger('user-service');
const app = new Hono();

// Middleware
app.use('*', cors());
app.use('*', requestIdMiddleware());
app.use('*', requestLogger(logger));
app.use('*', errorLogger(logger));
app.use('/api/*', perIpRateLimit({ maxRequests: 100, windowMs: 60000 }));

// Schemas
const createUserSchema = z.object({
  email: CommonSchemas.email,
  name: CommonSchemas.nonEmptyString,
});

// Routes
app.get('/health', (c) => {
  return c.json(successResponse({ status: 'healthy' }, c.get('requestId')));
});

app.post('/users',
  validateRequest(createUserSchema),
  async (c) => {
    const data = getValidated<z.infer<typeof createUserSchema>>(c);
    const user = await createUser(data);
    return c.json(successResponse(user, c.get('requestId')), 201);
  }
);

app.get('/users', async (c) => {
  const { page, pageSize } = parsePaginationParams(c.req.query());
  const { users, total } = await getUsers(page, pageSize);
  return c.json(
    paginatedResponse(users, total, { page, pageSize }, c.get('requestId'))
  );
});

app.get('/users/:id', async (c) => {
  const user = await getUserById(c.req.param('id'));
  if (!user) {
    throw new NotFoundError('User not found');
  }
  return c.json(successResponse(user, c.get('requestId')));
});

// Error handlers
app.onError(createErrorHandler(logger));
app.notFound(notFoundHandler());

export default app;
```

## Next Steps

1. Read the [README.md](./README.md) for comprehensive documentation
2. Check [EXAMPLES.md](./EXAMPLES.md) for more usage patterns
3. Review [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) for migrating existing services
4. See [PACKAGE_SUMMARY.md](./PACKAGE_SUMMARY.md) for complete feature list

## Common Patterns

### Environment-based Configuration

```typescript
const isDev = process.env.NODE_ENV === 'development';

const logger = createLogger('my-service', {
  minLevel: isDev ? 'debug' : 'info',
  prettyPrint: isDev,
});

app.use('*', isDev ? devCors() : prodCors(['https://app.example.com']));
```

### Service-to-Service Communication

```typescript
const authClient = createHttpClient({
  baseURL: process.env.AUTH_SERVICE_URL,
  timeout: 5000,
  headers: { 'X-Service-Name': 'my-service' },
});

async function verifyToken(token: string) {
  const response = await authClient.post('/verify', { token });
  return response.data;
}
```

### Performance Logging

```typescript
import { PerformanceLogger } from '@aah/api-utils';

async function expensiveOperation() {
  const perf = new PerformanceLogger(logger, 'expensive-operation');

  await step1();
  perf.checkpoint('step1-complete');

  await step2();
  perf.checkpoint('step2-complete');

  perf.end({ recordsProcessed: 100 });
}
```

### Custom Validation

```typescript
const customSchema = z.object({
  email: CommonSchemas.email.refine(
    (email) => email.endsWith('@company.com'),
    { message: 'Must be a company email' }
  ),
  age: CommonSchemas.positiveInt.refine(
    (age) => age >= 18,
    { message: 'Must be at least 18' }
  ),
});
```

## Tips

1. Always use `requestIdMiddleware()` first for request tracking
2. Use specific error classes for better error handling
3. Validate all inputs with Zod schemas
4. Use structured logging instead of console.log
5. Add rate limiting to prevent abuse
6. Return consistent response formats
7. Use the HTTP client for external calls
8. Leverage TypeScript types for safety

## Support

- Documentation: See README.md
- Examples: See EXAMPLES.md
- Migration: See MIGRATION_GUIDE.md
- Questions: Ask in team chat

Happy coding!
