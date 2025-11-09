# @aah/api-utils

Comprehensive shared API utilities package for all microservices in the Academic Athletics Hub platform.

## Features

- **Error Handling**: Standardized error classes and response formatting
- **Response Formatting**: Consistent API response structures
- **Validation**: Common Zod schemas and validation middleware
- **Logging**: Structured JSON logging with context
- **HTTP Client**: Retry logic, timeouts, and interceptors
- **Rate Limiting**: Token bucket and sliding window algorithms
- **Type Safety**: Full TypeScript support with shared types

## Installation

This package is part of the monorepo and can be referenced using workspace protocol:

```json
{
  "dependencies": {
    "@aah/api-utils": "*"
  }
}
```

## Usage

### Error Handling

```typescript
import { AppError, ValidationError, NotFoundError, HttpStatus } from '@aah/api-utils';

// Throw specific errors
throw new ValidationError('Invalid email format', { field: 'email' });
throw new NotFoundError('User not found', 'user');

// Use HTTP status codes
return c.json({ message: 'Created' }, HttpStatus.CREATED);

// Format error responses
const errorResponse = formatErrorResponse(error, requestId, path);
```

### Response Formatting

```typescript
import {
  successResponse,
  paginatedResponse,
  parsePaginationParams
} from '@aah/api-utils';

// Success response
return c.json(successResponse(data, requestId));

// Paginated response
const { page, pageSize } = parsePaginationParams(c.req.query());
const response = paginatedResponse(items, totalCount, { page, pageSize }, requestId);
return c.json(response);
```

### Validation

```typescript
import { validateRequest, CommonSchemas, getValidated } from '@aah/api-utils';
import { z } from 'zod';

// Define schema
const userSchema = z.object({
  email: CommonSchemas.email,
  password: CommonSchemas.password,
  age: CommonSchemas.positiveInt,
});

// Use validation middleware
app.post('/users', validateRequest(userSchema), async (c) => {
  const data = getValidated<z.infer<typeof userSchema>>(c);
  // data is validated and typed
});

// Use common schemas
const paginationSchema = createPaginationSchema(50); // max 50 items per page
```

### Logging

```typescript
import { createLogger, requestLogger, errorLogger } from '@aah/api-utils';

// Create logger
const logger = createLogger('user-service', {
  minLevel: 'info',
  prettyPrint: true,
});

// Log messages
logger.info('User created', { userId: user.id });
logger.error('Database error', error, { operation: 'createUser' });

// Add middleware
app.use('*', requestLogger(logger));
app.use('*', errorLogger(logger));

// Child logger with context
const requestLogger = logger.child({ requestId, userId });
requestLogger.info('Processing request');
```

### HTTP Client

```typescript
import { createHttpClient, HttpClient } from '@aah/api-utils';

// Create client
const client = createHttpClient({
  baseURL: 'https://api.example.com',
  timeout: 5000,
  maxRetries: 3,
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});

// Make requests
const response = await client.get('/users', { params: { page: 1 } });
const created = await client.post('/users', { email: 'test@example.com' });

// With interceptors
const interceptableClient = new InterceptableHttpClient({ baseURL: '...' });
interceptableClient.addRequestInterceptor(RequestInterceptors.withAuth(token));
```

### Rate Limiting

```typescript
import {
  rateLimitMiddleware,
  perUserRateLimit,
  perIpRateLimit,
} from '@aah/api-utils';

// Global rate limit (100 requests per minute)
app.use('*', rateLimitMiddleware({
  maxRequests: 100,
  windowMs: 60000,
}));

// Per-user rate limit
app.use('/api/*', perUserRateLimit({
  maxRequests: 1000,
  windowMs: 3600000, // 1 hour
}));

// Per-IP rate limit
app.use('/public/*', perIpRateLimit({
  maxRequests: 50,
  windowMs: 60000,
}));

// Custom rate limit
app.use('/expensive-operation', customRateLimit(
  { maxRequests: 10, windowMs: 60000 },
  (c) => `custom:${c.get('userId')}:${c.req.path}`
));
```

## API Reference

### Error Classes

- `AppError` - Base application error
- `AuthError` - Authentication errors (401)
- `ForbiddenError` - Authorization errors (403)
- `ValidationError` - Validation errors (400)
- `NotFoundError` - Resource not found (404)
- `ConflictError` - Resource conflicts (409)
- `RateLimitError` - Rate limit exceeded (429)
- `ServerError` - Internal server errors (500)
- `ExternalServiceError` - External service errors (502)
- `TimeoutError` - Request timeouts (504)

### Common Schemas

- `email` - Email validation
- `phone` - Phone number validation
- `url` - URL validation
- `uuid` - UUID validation
- `dateString` - ISO 8601 date string
- `password` - Strong password validation
- `positiveInt` - Positive integer
- `page` - Pagination page number
- `pageSize` - Pagination page size
- `slug` - URL-friendly slug
- `hexColor` - Hex color code
- And more...

### Utilities

#### Sanitizers
- `stripHtml()` - Remove HTML tags
- `escapeHtml()` - Escape HTML special characters
- `toSlug()` - Convert to URL slug
- `sanitizeFilename()` - Sanitize file names

#### Validators
- `isEmail()` - Check if valid email
- `isUUID()` - Check if valid UUID
- `isURL()` - Check if valid URL
- `isInRange()` - Check if number in range

#### URL Helpers
- `buildQueryString()` - Build query string from object
- `parseQueryString()` - Parse query string to object
- `joinURL()` - Join URL parts
- `addQueryParams()` - Add query params to URL

## Best Practices

### Error Handling

```typescript
// Always use specific error classes
throw new NotFoundError(`User ${userId} not found`);

// Include relevant details
throw new ValidationError('Invalid input', {
  field: 'email',
  value: email,
  reason: 'Must be a valid email address',
});

// Use operational flag for expected errors
const error = new AppError(
  'Configuration missing',
  'SERVER_ERROR',
  'SERVER',
  500,
  { key: 'DATABASE_URL' },
  false // not operational - programming error
);
```

### Validation

```typescript
// Compose schemas for reusability
const addressSchema = z.object({
  street: CommonSchemas.nonEmptyString,
  city: CommonSchemas.nonEmptyString,
  zipCode: z.string().regex(/^\d{5}$/),
});

const userSchema = z.object({
  email: CommonSchemas.email,
  address: addressSchema,
});

// Validate at boundaries
app.post('/users',
  validateRequest(userSchema),
  async (c) => {
    const user = getValidated<z.infer<typeof userSchema>>(c);
    // All subsequent code can trust the data is valid
  }
);
```

### Logging

```typescript
// Use structured logging
logger.info('User action', {
  action: 'login',
  userId: user.id,
  ip: req.ip,
  timestamp: new Date(),
});

// Use appropriate log levels
logger.debug('Cache hit', { key });  // Development info
logger.info('User logged in', { userId });  // Normal operations
logger.warn('Deprecated API used', { endpoint });  // Warnings
logger.error('Database connection failed', error);  // Errors
logger.fatal('Service crashed', error);  // Critical errors

// Redact sensitive data
const sanitized = redactSensitiveData(userData, ['password', 'ssn']);
logger.info('User data', sanitized);
```

### Rate Limiting

```typescript
// Use appropriate limits based on endpoint cost
app.get('/cheap-operation',
  perUserRateLimit({ maxRequests: 1000, windowMs: 60000 }),
  handler
);

app.post('/expensive-operation',
  perUserRateLimit({ maxRequests: 10, windowMs: 60000 }),
  handler
);

// Combine different rate limiters
app.use('/api',
  perIpRateLimit({ maxRequests: 100, windowMs: 60000 }), // Prevent IP abuse
  perUserRateLimit({ maxRequests: 1000, windowMs: 60000 }), // Per-user limits
);
```

## TypeScript Support

All utilities are fully typed. Import types as needed:

```typescript
import type {
  SuccessResponse,
  ErrorResponse,
  PaginatedResponse,
  RequestContext,
  LogLevel,
  HttpMethod,
} from '@aah/api-utils';
```

## Contributing

When adding new utilities:

1. Add implementation to appropriate file in `src/utils/`
2. Export from `src/index.ts`
3. Add types to `src/types/index.ts` if needed
4. Update this README with usage examples
5. Ensure full TypeScript type safety

## License

MIT
