# Changelog

All notable changes to the @aah/api-utils package will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-11-08

### Added

#### Error Handling
- `AppError` base class with error codes and categories
- Specialized error classes: `AuthError`, `ForbiddenError`, `ValidationError`, `NotFoundError`, `ConflictError`, `RateLimitError`, `ServerError`, `ExternalServiceError`, `TimeoutError`
- `HttpStatus` constants for all HTTP status codes
- `formatErrorResponse()` function for standardized error formatting
- `isOperationalError()` helper to distinguish expected from unexpected errors
- `getStatusCode()` helper to extract HTTP status codes
- `ErrorCategories` helpers for error type checking

#### Response Formatting
- `successResponse()` for standard success responses
- `errorResponse()` for standard error responses
- `paginatedResponse()` for paginated list responses
- `createdResponse()` for 201 Created responses
- `acceptedResponse()` for 202 Accepted responses
- `noContentResponse()` for 204 No Content responses
- `responseWithMeta()` for custom metadata responses
- `parsePaginationParams()` for parsing query parameters
- `parseSortParams()` for parsing sort parameters
- `calculatePagination()` for pagination metadata
- `PaginationHelpers` utility functions
- `ResponseGuards` type guards for response validation

#### Validation
- 25+ common Zod schemas (email, phone, url, uuid, password, etc.)
- `validateRequest()` middleware for Hono
- `getValidated()` helper to retrieve validated data
- `createPaginationSchema()` for pagination query validation
- `Sanitizers` collection (stripHtml, escapeHtml, toSlug, etc.)
- `Validators` collection (isEmail, isUUID, isURL, etc.)
- `SchemaHelpers` for schema composition

#### Logging
- `Logger` class with structured JSON logging
- Log levels: debug, info, warn, error, fatal
- `PerformanceLogger` for operation timing
- `createLogger()` factory function
- `generateRequestId()` for unique request IDs
- `extractRequestContext()` for request metadata
- `requestLogger()` middleware for request logging
- `errorLogger()` middleware for error logging
- `redactSensitiveData()` for security

#### HTTP Client
- `HttpClient` class with retry logic
- Exponential backoff for retries
- Configurable timeouts
- Request/response interceptors
- HTTP methods: get, post, put, patch, delete
- `URLHelpers` for URL manipulation
- `RequestInterceptors` for common use cases
- `InterceptableHttpClient` for advanced scenarios

#### Rate Limiting
- `RateLimiter` class with token bucket algorithm
- `SlidingWindowRateLimiter` for precise rate limiting
- `rateLimitMiddleware()` for generic rate limiting
- `perUserRateLimit()` for per-user limits
- `perIpRateLimit()` for per-IP limits
- `perServiceRateLimit()` for service-level limits
- `customRateLimit()` with custom key generation
- `slidingWindowRateLimit()` for sliding window algorithm
- `getRateLimitInfo()` to extract rate limit headers
- Automatic cleanup of old rate limit buckets

#### Middleware
- `createErrorHandler()` for global error handling
- `notFoundHandler()` for 404 responses
- `cors()` for CORS configuration
- `devCors()` for development CORS
- `prodCors()` for production CORS
- `customOriginCors()` for custom origin validation
- `requestIdMiddleware()` for request tracking

#### Types
- Comprehensive TypeScript type definitions
- `ErrorCategory` enum
- `ErrorCode` type union
- `ErrorResponse` interface
- `SuccessResponse<T>` interface
- `PaginatedResponse<T>` interface
- `ApiResponse<T>` union type
- `RequestContext` interface
- `PaginationParams` interface
- `RateLimitConfig` interface
- `HttpClientConfig` interface
- `LogLevel` type
- `LogEntry` interface
- And 15+ more type definitions

#### Documentation
- Comprehensive README.md
- EXAMPLES.md with real-world usage examples
- MIGRATION_GUIDE.md for service migration
- PACKAGE_SUMMARY.md with complete feature overview
- Inline JSDoc comments throughout

### Dependencies
- hono ^3.11.0
- zod ^3.22.4
- typescript ^5.3.0
- @types/node ^20.10.0

### Configuration
- TypeScript configuration for compilation
- Package exports for subpath imports
- .gitignore for build artifacts

### Package Statistics
- Total lines of code: ~2,700
- Number of utilities: 100+
- Number of type definitions: 30+
- Number of middleware: 10+
- Number of files: 18

### Design Principles
- Framework-agnostic core utilities
- Hono framework integration
- Full TypeScript type safety
- Zero runtime dependencies (except hono and zod)
- Consistent API across all utilities
- Production-ready error handling
- Performance-optimized implementations
- Extensive inline documentation
- Composable and modular design

### Future Considerations
- Redis-based rate limiting
- Distributed tracing support
- Metrics collection
- Circuit breaker pattern
- WebSocket utilities
- GraphQL utilities
- File upload utilities
- Caching utilities
- Queue/job utilities

---

## Version History

### [1.0.0] - 2024-11-08
Initial release of @aah/api-utils package with complete feature set.

---

## Upgrade Guide

### From 0.x to 1.0.0
This is the initial release. See MIGRATION_GUIDE.md for migrating existing services.

---

## Breaking Changes

None - initial release.

---

## Contributors

- Platform Team

---

## License

MIT
