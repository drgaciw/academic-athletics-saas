# API Utils Package - Complete Summary

## Overview

The `@aah/api-utils` package provides a comprehensive set of utilities for building consistent, production-ready microservices in the Academic Athletics Hub platform. All utilities are designed to work seamlessly with the Hono framework.

## Package Structure

```
packages/api-utils/
├── src/
│   ├── index.ts                    # Main export file
│   ├── types/
│   │   └── index.ts               # Common type definitions
│   ├── utils/
│   │   ├── errors.ts              # Error handling utilities
│   │   ├── responses.ts           # Response formatting utilities
│   │   ├── validation.ts          # Validation helpers and schemas
│   │   ├── logging.ts             # Structured logging utilities
│   │   ├── http.ts                # HTTP client with retry logic
│   │   └── rateLimit.ts           # Rate limiting utilities
│   └── middleware/
│       ├── index.ts               # Middleware exports
│       ├── errorHandler.ts        # Global error handling
│       ├── cors.ts                # CORS configuration
│       └── requestId.ts           # Request ID tracking
├── package.json
├── tsconfig.json
├── README.md                       # Package documentation
├── EXAMPLES.md                     # Usage examples
└── PACKAGE_SUMMARY.md             # This file

```

## Core Features

### 1. Error Handling (`utils/errors.ts`)

**Classes:**
- `AppError` - Base application error with error codes and categories
- `AuthError` - Authentication errors (401)
- `ForbiddenError` - Authorization errors (403)
- `ValidationError` - Validation errors (400)
- `NotFoundError` - Resource not found (404)
- `ConflictError` - Resource conflicts (409)
- `RateLimitError` - Rate limit exceeded (429)
- `ServerError` - Internal server errors (500)
- `ExternalServiceError` - External service errors (502)
- `TimeoutError` - Request timeouts (504)

**Error Categories:**
- `AUTH` - Authentication/authorization errors
- `VALIDATION` - Input validation errors
- `NOT_FOUND` - Resource not found errors
- `SERVER` - Internal server errors
- `EXTERNAL` - External service errors
- `RATE_LIMIT` - Rate limiting errors
- `CONFLICT` - Resource conflict errors

**Helpers:**
- `formatErrorResponse()` - Convert errors to standard format
- `isOperationalError()` - Check if error is expected
- `getStatusCode()` - Extract HTTP status code
- `HttpStatus` - HTTP status code constants

### 2. Response Formatting (`utils/responses.ts`)

**Response Functions:**
- `successResponse()` - Standard success response
- `errorResponse()` - Standard error response
- `paginatedResponse()` - Paginated list response
- `createdResponse()` - 201 Created response
- `acceptedResponse()` - 202 Accepted response
- `noContentResponse()` - 204 No Content response
- `responseWithMeta()` - Response with custom metadata

**Pagination Helpers:**
- `parsePaginationParams()` - Parse query parameters
- `parseSortParams()` - Parse sorting parameters
- `calculatePagination()` - Calculate pagination metadata
- `PaginationHelpers` - Utility functions for pagination

**Type Guards:**
- `ResponseGuards.isSuccessResponse()` - Check success response
- `ResponseGuards.isErrorResponse()` - Check error response
- `ResponseGuards.isPaginatedResponse()` - Check paginated response

### 3. Validation (`utils/validation.ts`)

**Common Schemas:**
- `email` - Email validation
- `phone` - Phone number validation
- `url` - URL validation
- `uuid` - UUID validation
- `dateString` - ISO 8601 date string
- `date` - Date object
- `password` - Strong password (min 8 chars, mixed case, numbers)
- `positiveInt` - Positive integer
- `nonNegativeInt` - Non-negative integer
- `page` - Pagination page number
- `pageSize` - Pagination page size (max 100)
- `sortOrder` - Sort order (asc/desc)
- `nonEmptyString` - Non-empty trimmed string
- `slug` - URL-friendly slug
- `hexColor` - Hex color code
- `timezone` - Timezone identifier
- `jsonString` - Parseable JSON string
- `ipAddress` - IP address (v4/v6)
- `latitude` - Latitude coordinate
- `longitude` - Longitude coordinate
- `coordinates` - Lat/lng object

**Functions:**
- `validateRequest()` - Hono middleware for validation
- `getValidated()` - Get validated data from context
- `createPaginationSchema()` - Create pagination query schema

**Sanitizers:**
- `stripHtml()` - Remove HTML tags
- `escapeHtml()` - Escape HTML special characters
- `normalizeWhitespace()` - Normalize whitespace
- `alphanumeric()` - Remove non-alphanumeric
- `toSlug()` - Convert to URL slug
- `sanitizeLike()` - Sanitize SQL LIKE query
- `removeNullBytes()` - Remove null bytes
- `sanitizeFilename()` - Sanitize file names

**Validators:**
- `isEmail()` - Check valid email
- `isUUID()` - Check valid UUID
- `isURL()` - Check valid URL
- `isDate()` - Check valid date
- `isAlphanumeric()` - Check alphanumeric
- `isHexColor()` - Check hex color
- `isInRange()` - Check number in range
- `hasUniqueValues()` - Check array uniqueness
- `hasRequiredKeys()` - Check object keys

### 4. Logging (`utils/logging.ts`)

**Logger Class:**
- `debug()` - Debug level logs
- `info()` - Info level logs
- `warn()` - Warning level logs
- `error()` - Error level logs
- `fatal()` - Fatal error logs
- `child()` - Create child logger with context

**Functions:**
- `createLogger()` - Create logger instance
- `generateRequestId()` - Generate unique request ID
- `extractRequestContext()` - Extract request context
- `requestLogger()` - Request logging middleware
- `errorLogger()` - Error logging middleware
- `redactSensitiveData()` - Redact sensitive fields

**PerformanceLogger:**
- Track operation performance
- Mark checkpoints
- Generate timing reports

### 5. HTTP Client (`utils/http.ts`)

**HttpClient Class:**
- Automatic retry logic with exponential backoff
- Configurable timeouts
- Request/response interceptors
- Built-in error handling

**Methods:**
- `get()` - GET request
- `post()` - POST request
- `put()` - PUT request
- `patch()` - PATCH request
- `delete()` - DELETE request
- `request()` - Generic request

**URL Helpers:**
- `buildQueryString()` - Build query string
- `parseQueryString()` - Parse query string
- `joinURL()` - Join URL parts
- `addQueryParams()` - Add query parameters
- `extractDomain()` - Extract domain from URL
- `isAbsoluteURL()` - Check if URL is absolute
- `normalizeURL()` - Normalize URL format

**Interceptors:**
- `RequestInterceptors.withAuth()` - Add auth token
- `RequestInterceptors.withApiKey()` - Add API key
- `RequestInterceptors.withHeaders()` - Add custom headers

### 6. Rate Limiting (`utils/rateLimit.ts`)

**RateLimiter Class:**
- Token bucket algorithm
- Sliding window algorithm
- Per-user and per-IP limiting
- Automatic cleanup

**Middleware:**
- `rateLimitMiddleware()` - Generic rate limiter
- `perUserRateLimit()` - Per-user limits
- `perIpRateLimit()` - Per-IP limits
- `perServiceRateLimit()` - Per-service limits
- `customRateLimit()` - Custom key generator
- `slidingWindowRateLimit()` - Sliding window algorithm

**Functions:**
- `createRateLimiter()` - Create rate limiter instance
- `getRateLimitInfo()` - Get rate limit headers

### 7. Middleware

**Error Handling:**
- `createErrorHandler()` - Global error handler
- `notFoundHandler()` - 404 handler

**CORS:**
- `cors()` - Configurable CORS middleware
- `devCors()` - Development CORS (allow all)
- `prodCors()` - Production CORS (specific origins)
- `customOriginCors()` - Custom origin validator

**Request Tracking:**
- `requestIdMiddleware()` - Request ID tracking

## Type Definitions (`types/index.ts`)

**Response Types:**
- `SuccessResponse<T>` - Success response structure
- `ErrorResponse` - Error response structure
- `PaginatedResponse<T>` - Paginated response structure
- `ApiResponse<T>` - Union of all response types

**Request Types:**
- `RequestContext` - Request context information
- `PaginationParams` - Pagination parameters
- `HttpRequestOptions` - HTTP request options
- `HttpResponse<T>` - HTTP response structure

**Configuration Types:**
- `RateLimitConfig` - Rate limit configuration
- `RateLimitInfo` - Rate limit headers
- `HttpClientConfig` - HTTP client configuration
- `LoggerConfig` - Logger configuration

**Enums:**
- `ErrorCategory` - Error categories
- `ErrorCode` - Standardized error codes
- `LogLevel` - Log levels (debug, info, warn, error, fatal)
- `HttpMethod` - HTTP methods

## Dependencies

```json
{
  "dependencies": {
    "hono": "^3.11.0",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "@types/node": "^20.10.0"
  }
}
```

## Usage in Services

### 1. Add to Service Package

```json
{
  "dependencies": {
    "@aah/api-utils": "*"
  }
}
```

### 2. Basic Service Setup

```typescript
import { Hono } from 'hono';
import {
  createLogger,
  createErrorHandler,
  requestIdMiddleware,
  requestLogger,
  cors,
} from '@aah/api-utils';

const logger = createLogger('my-service');
const app = new Hono();

app.use('*', cors());
app.use('*', requestIdMiddleware());
app.use('*', requestLogger(logger));

// ... routes ...

app.onError(createErrorHandler(logger));

export default app;
```

### 3. Route with Validation

```typescript
import { validateRequest, successResponse, CommonSchemas } from '@aah/api-utils';
import { z } from 'zod';

const schema = z.object({
  email: CommonSchemas.email,
  name: CommonSchemas.nonEmptyString,
});

app.post('/users',
  validateRequest(schema),
  async (c) => {
    const data = getValidated<z.infer<typeof schema>>(c);
    const user = await createUser(data);
    return c.json(successResponse(user, c.get('requestId')), 201);
  }
);
```

## Best Practices

1. **Error Handling**: Always use specific error classes for different scenarios
2. **Validation**: Validate at API boundaries using middleware
3. **Logging**: Use structured logging with request context
4. **Responses**: Use standard response formatters for consistency
5. **Rate Limiting**: Apply appropriate limits based on endpoint cost
6. **HTTP Client**: Use retry logic for external service calls
7. **Type Safety**: Leverage TypeScript for full type safety

## Integration with Existing Services

To integrate with existing services:

1. Add `@aah/api-utils` to service dependencies
2. Replace custom error handling with standard error classes
3. Migrate to standard response formatters
4. Add validation middleware to routes
5. Replace console.log with structured logger
6. Add rate limiting to public endpoints
7. Use HTTP client for service-to-service communication

## Performance Considerations

- **Rate Limiting**: Token buckets are stored in-memory with automatic cleanup
- **Logging**: Structured JSON logging is efficient and indexable
- **HTTP Client**: Retry logic uses exponential backoff to prevent thundering herd
- **Validation**: Zod schemas are compiled once and reused
- **Response Formatting**: Minimal overhead, simple object construction

## Testing

All utilities can be tested independently:

```typescript
import { ValidationError, formatErrorResponse } from '@aah/api-utils';

test('formats validation errors correctly', () => {
  const error = new ValidationError('Test error', { field: 'email' });
  const response = formatErrorResponse(error);

  expect(response.success).toBe(false);
  expect(response.error.code).toBe('VALIDATION_FAILED');
});
```

## Future Enhancements

Potential additions:
- Redis-based rate limiting for distributed systems
- Metrics collection utilities
- Circuit breaker implementation
- Request tracing/distributed tracing
- API versioning helpers
- WebSocket utilities
- GraphQL utilities
- File upload/download helpers
- Caching utilities
- Queue/job utilities

## Support

For questions or issues:
1. Check README.md for detailed documentation
2. Check EXAMPLES.md for usage patterns
3. Review type definitions in src/types/index.ts
4. Contact platform team for assistance

## Version

Current version: 1.0.0

## License

MIT
