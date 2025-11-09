# API Utils - Usage Examples

Complete examples of how to use the API utilities package in your microservices.

## Complete Service Setup

Here's a complete example of setting up a microservice with all utilities:

```typescript
import { Hono } from 'hono';
import {
  // Middleware
  createErrorHandler,
  notFoundHandler,
  requestIdMiddleware,
  cors,
  requestLogger,
  errorLogger,
  rateLimitMiddleware,

  // Utilities
  createLogger,
  validateRequest,
  successResponse,
  paginatedResponse,
  parsePaginationParams,
  CommonSchemas,
  getValidated,

  // Errors
  NotFoundError,
  ValidationError,
} from '@aah/api-utils';
import { z } from 'zod';

// Create logger
const logger = createLogger('user-service', {
  minLevel: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
});

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

// Rate limiting
app.use('/api/*', rateLimitMiddleware({
  maxRequests: 100,
  windowMs: 60000, // 1 minute
}));

// Routes
const userCreateSchema = z.object({
  email: CommonSchemas.email,
  name: CommonSchemas.nonEmptyString,
  password: CommonSchemas.password,
});

app.post('/api/users',
  validateRequest(userCreateSchema),
  async (c) => {
    const data = getValidated<z.infer<typeof userCreateSchema>>(c);
    const requestId = c.get('requestId');

    // Create user
    const user = await createUser(data);

    logger.info('User created', { userId: user.id, requestId });

    return c.json(
      successResponse(user, requestId),
      201
    );
  }
);

app.get('/api/users', async (c) => {
  const requestId = c.get('requestId');
  const { page, pageSize } = parsePaginationParams(c.req.query());

  const { users, total } = await getUsers(page, pageSize);

  return c.json(
    paginatedResponse(users, total, { page, pageSize }, requestId)
  );
});

app.get('/api/users/:id', async (c) => {
  const requestId = c.get('requestId');
  const userId = c.req.param('id');

  const user = await getUserById(userId);

  if (!user) {
    throw new NotFoundError(`User ${userId} not found`);
  }

  return c.json(successResponse(user, requestId));
});

// Error handlers
app.onError(createErrorHandler(logger));
app.notFound(notFoundHandler());

export default app;
```

## Advanced Validation

### Nested Schema Validation

```typescript
import { CommonSchemas, validateRequest, getValidated } from '@aah/api-utils';
import { z } from 'zod';

// Define reusable schemas
const addressSchema = z.object({
  street: CommonSchemas.nonEmptyString,
  city: CommonSchemas.nonEmptyString,
  state: z.string().length(2),
  zipCode: z.string().regex(/^\d{5}(-\d{4})?$/),
  country: z.string().default('US'),
});

const contactSchema = z.object({
  email: CommonSchemas.email,
  phone: CommonSchemas.phone,
  preferredMethod: z.enum(['email', 'phone', 'sms']).default('email'),
});

// Compose complex schema
const organizationSchema = z.object({
  name: CommonSchemas.nonEmptyString,
  slug: CommonSchemas.slug,
  website: CommonSchemas.url.optional(),
  address: addressSchema,
  contact: contactSchema,
  settings: z.object({
    notifications: z.boolean().default(true),
    timezone: CommonSchemas.timezone,
  }),
});

app.post('/organizations',
  validateRequest(organizationSchema),
  async (c) => {
    const data = getValidated<z.infer<typeof organizationSchema>>(c);
    // All nested data is validated
    console.log(data.address.city); // Type-safe access
  }
);
```

### Custom Validators

```typescript
import { CommonSchemas, Validators } from '@aah/api-utils';
import { z } from 'zod';

// Custom email domain validator
const workEmailSchema = CommonSchemas.email.refine(
  (email) => email.endsWith('@company.com'),
  { message: 'Must be a company email address' }
);

// Custom date range validator
const dateRangeSchema = z.object({
  startDate: CommonSchemas.dateString,
  endDate: CommonSchemas.dateString,
}).refine(
  (data) => new Date(data.endDate) > new Date(data.startDate),
  { message: 'End date must be after start date' }
);

// Custom unique array validator
const uniqueTagsSchema = z.array(CommonSchemas.nonEmptyString).refine(
  (tags) => Validators.hasUniqueValues(tags),
  { message: 'Tags must be unique' }
);
```

## Error Handling Patterns

### Service Layer Errors

```typescript
import {
  NotFoundError,
  ValidationError,
  ConflictError,
  ExternalServiceError,
} from '@aah/api-utils';

class UserService {
  async createUser(data: CreateUserData) {
    // Check for existing user
    const existing = await this.findByEmail(data.email);
    if (existing) {
      throw new ConflictError('User already exists', 'CONFLICT_RESOURCE_EXISTS', {
        email: data.email,
      });
    }

    // Validate business rules
    if (data.age < 18) {
      throw new ValidationError('User must be at least 18 years old', {
        field: 'age',
        value: data.age,
        min: 18,
      });
    }

    try {
      // Call external service
      const verified = await emailVerificationService.verify(data.email);
      if (!verified) {
        throw new ValidationError('Email verification failed');
      }
    } catch (error) {
      throw new ExternalServiceError(
        'Email verification service unavailable',
        'email-verification',
        { originalError: error }
      );
    }

    // Create user
    return await this.db.user.create({ data });
  }

  async getUserById(id: string) {
    const user = await this.db.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundError(`User ${id} not found`, 'user');
    }

    return user;
  }
}
```

### Error Recovery

```typescript
import { isOperationalError, ServerError, Logger } from '@aah/api-utils';

const logger = createLogger('app');

async function handleCriticalOperation() {
  try {
    await criticalOperation();
  } catch (error) {
    if (isOperationalError(error)) {
      // Expected error - log and handle gracefully
      logger.warn('Operational error occurred', { error });
      // Continue operation or return error to client
    } else {
      // Unexpected error - log and possibly restart
      logger.fatal('Critical error occurred', error);
      // Alert ops team, restart service, etc.
      process.exit(1);
    }
  }
}
```

## HTTP Client Usage

### Microservice Communication

```typescript
import { createHttpClient, ExternalServiceError } from '@aah/api-utils';

// Create client for another service
const authServiceClient = createHttpClient({
  baseURL: process.env.AUTH_SERVICE_URL,
  timeout: 5000,
  maxRetries: 3,
  headers: {
    'X-Service-Name': 'user-service',
  },
});

async function verifyToken(token: string) {
  try {
    const response = await authServiceClient.post('/verify', {
      token,
    });

    return response.data;
  } catch (error) {
    throw new ExternalServiceError(
      'Token verification failed',
      'auth-service',
      { error }
    );
  }
}

// With retry logic for specific endpoints
async function fetchUserPermissions(userId: string) {
  return authServiceClient.get(`/users/${userId}/permissions`, {
    retries: 5, // Override default retries
    timeout: 10000, // Override default timeout
  });
}
```

### Request Interceptors

```typescript
import {
  InterceptableHttpClient,
  RequestInterceptors,
} from '@aah/api-utils';

const client = new InterceptableHttpClient({
  baseURL: 'https://api.external.com',
});

// Add auth token to all requests
const token = await getAuthToken();
client.addRequestInterceptor(RequestInterceptors.withAuth(token));

// Add custom headers
client.addRequestInterceptor(RequestInterceptors.withHeaders({
  'X-Client-Version': '1.0.0',
  'X-Tenant-ID': tenantId,
}));

// Add request logging
client.addRequestInterceptor(async ({ url, options }) => {
  logger.debug('Outgoing request', { url, method: options.method });
  return { url, options };
});

// Add response logging
client.addResponseInterceptor(async (response) => {
  logger.debug('Response received', {
    status: response.status,
    url: response.url,
  });
  return response;
});
```

## Advanced Logging

### Performance Tracking

```typescript
import { PerformanceLogger, createLogger } from '@aah/api-utils';

const logger = createLogger('user-service');

async function complexOperation() {
  const perf = new PerformanceLogger(logger, 'complex-operation');

  // Step 1
  await fetchData();
  perf.checkpoint('data-fetched');

  // Step 2
  await processData();
  perf.checkpoint('data-processed');

  // Step 3
  await saveData();
  perf.checkpoint('data-saved');

  // Log final performance metrics
  perf.end({ recordCount: 100 });
}
```

### Contextual Logging

```typescript
import { createLogger, extractRequestContext } from '@aah/api-utils';

const logger = createLogger('user-service');

app.use('*', async (c, next) => {
  const context = extractRequestContext(c);
  const requestLogger = logger.child({
    requestId: context.requestId,
    userId: context.userId,
    path: c.req.path,
  });

  // Store in context for use in handlers
  c.set('logger', requestLogger);

  await next();
});

app.get('/users', async (c) => {
  const log = c.get('logger');

  log.info('Fetching users');
  // All logs will include requestId, userId, path

  const users = await getUsers();
  log.info('Users fetched', { count: users.length });

  return c.json(users);
});
```

## Rate Limiting Strategies

### Tiered Rate Limits

```typescript
import { customRateLimit } from '@aah/api-utils';

// Different limits based on user tier
app.use('/api/*', customRateLimit(
  {
    maxRequests: 1000,
    windowMs: 3600000, // 1 hour
  },
  (c) => {
    const userId = c.get('userId');
    const userTier = c.get('userTier'); // 'free', 'pro', 'enterprise'

    // Different rate limit buckets by tier
    return `ratelimit:${userTier}:${userId}`;
  }
));

// Implement tier-specific limits
const tierLimits = {
  free: { maxRequests: 100, windowMs: 3600000 },
  pro: { maxRequests: 1000, windowMs: 3600000 },
  enterprise: { maxRequests: 10000, windowMs: 3600000 },
};

app.use('/api/*', async (c, next) => {
  const userTier = c.get('userTier') || 'free';
  const limits = tierLimits[userTier];

  const rateLimiter = rateLimitMiddleware(limits);
  await rateLimiter(c, next);
});
```

### Endpoint-Specific Limits

```typescript
import { perUserRateLimit } from '@aah/api-utils';

// Expensive operation - strict limit
app.post('/api/reports/generate',
  perUserRateLimit({
    maxRequests: 5,
    windowMs: 3600000, // 5 per hour
  }),
  generateReportHandler
);

// Read operation - generous limit
app.get('/api/users',
  perUserRateLimit({
    maxRequests: 1000,
    windowMs: 60000, // 1000 per minute
  }),
  getUsersHandler
);

// Search - moderate limit
app.get('/api/search',
  perUserRateLimit({
    maxRequests: 100,
    windowMs: 60000, // 100 per minute
  }),
  searchHandler
);
```

## Response Formatting Patterns

### Consistent API Responses

```typescript
import {
  successResponse,
  createdResponse,
  acceptedResponse,
  paginatedResponse,
} from '@aah/api-utils';

// GET - Success response
app.get('/users/:id', async (c) => {
  const user = await getUser(c.req.param('id'));
  return c.json(successResponse(user, c.get('requestId')));
});

// POST - Created response with location
app.post('/users', async (c) => {
  const user = await createUser(data);
  return c.json(
    createdResponse(user, `/users/${user.id}`, c.get('requestId')),
    201
  );
});

// POST - Async operation
app.post('/reports', async (c) => {
  const jobId = await queueReportGeneration(data);
  return c.json(
    acceptedResponse({ jobId, status: 'queued' }, c.get('requestId')),
    202
  );
});

// GET - Paginated list
app.get('/users', async (c) => {
  const { page, pageSize } = parsePaginationParams(c.req.query());
  const { users, total } = await getUsers(page, pageSize);

  return c.json(
    paginatedResponse(users, total, { page, pageSize }, c.get('requestId'))
  );
});
```

### Custom Metadata

```typescript
import { responseWithMeta } from '@aah/api-utils';

app.get('/stats', async (c) => {
  const stats = await getStats();

  return c.json(
    responseWithMeta(
      stats,
      {
        cached: true,
        cacheExpiry: new Date(Date.now() + 3600000).toISOString(),
        version: '2.0',
      },
      c.get('requestId')
    )
  );
});
```

## Testing Utilities

```typescript
import {
  ValidationError,
  NotFoundError,
  formatErrorResponse,
  isOperationalError,
} from '@aah/api-utils';

describe('UserService', () => {
  it('should throw ValidationError for invalid email', async () => {
    await expect(
      userService.createUser({ email: 'invalid' })
    ).rejects.toThrow(ValidationError);
  });

  it('should throw NotFoundError for missing user', async () => {
    const error = await userService.getUserById('nonexistent')
      .catch(e => e);

    expect(error).toBeInstanceOf(NotFoundError);
    expect(error.statusCode).toBe(404);
    expect(isOperationalError(error)).toBe(true);
  });

  it('should format error response correctly', () => {
    const error = new ValidationError('Test error', { field: 'email' });
    const response = formatErrorResponse(error, 'req-123', '/test');

    expect(response).toMatchObject({
      success: false,
      error: {
        code: 'VALIDATION_FAILED',
        message: 'Test error',
        category: 'VALIDATION',
        requestId: 'req-123',
        path: '/test',
      },
    });
  });
});
```

## Environment-Specific Configuration

```typescript
import { createLogger, cors, rateLimitMiddleware } from '@aah/api-utils';

const isDev = process.env.NODE_ENV === 'development';
const isProd = process.env.NODE_ENV === 'production';

// Development setup
if (isDev) {
  app.use('*', cors({ origin: '*' }));

  const logger = createLogger('user-service', {
    minLevel: 'debug',
    prettyPrint: true,
  });

  // No rate limiting in dev
}

// Production setup
if (isProd) {
  app.use('*', cors({
    origin: process.env.ALLOWED_ORIGINS.split(','),
    credentials: true,
  }));

  const logger = createLogger('user-service', {
    minLevel: 'info',
    prettyPrint: false,
  });

  // Strict rate limiting in prod
  app.use('*', rateLimitMiddleware({
    maxRequests: 100,
    windowMs: 60000,
  }));
}
```
