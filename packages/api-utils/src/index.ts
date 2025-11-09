/**
 * API Utilities Package
 * Shared utilities for all microservices
 */

// Export all types
export * from './types/index';

// Export error utilities
export {
  // Classes
  AppError,
  AuthError,
  ForbiddenError,
  ValidationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  ServerError,
  ExternalServiceError,
  TimeoutError,

  // Constants
  HttpStatus,
  ErrorCategories,

  // Functions
  formatErrorResponse,
  isOperationalError,
  getStatusCode,
} from './utils/errors';

// Export response utilities
export {
  // Functions
  successResponse,
  errorResponse,
  paginatedResponse,
  calculatePagination,
  parsePaginationParams,
  parseSortParams,
  responseWithMeta,
  noContentResponse,
  createdResponse,
  acceptedResponse,

  // Helpers
  PaginationHelpers,
  ResponseGuards,
} from './utils/responses';

// Export validation utilities
export {
  // Schemas
  CommonSchemas,

  // Functions
  createPaginationSchema,
  validateRequest,
  getValidated,

  // Helpers
  Sanitizers,
  Validators,
  SchemaHelpers,
} from './utils/validation';

// Export logging utilities
export {
  // Classes
  Logger,
  PerformanceLogger,

  // Functions
  createLogger,
  generateRequestId,
  extractRequestContext,
  requestLogger,
  errorLogger,
  redactSensitiveData,
} from './utils/logging';

// Export HTTP utilities
export {
  // Classes
  HttpClient,
  InterceptableHttpClient,

  // Functions
  createHttpClient,

  // Helpers
  URLHelpers,
  RequestInterceptors,

  // Types
  type RequestInterceptor,
  type ResponseInterceptor,
} from './utils/http';

// Export rate limiting utilities
export {
  // Classes
  RateLimiter,

  // Functions
  createRateLimiter,
  rateLimitMiddleware,
  perUserRateLimit,
  perIpRateLimit,
  perServiceRateLimit,
  customRateLimit,
  slidingWindowRateLimit,
  getRateLimitInfo,
} from './utils/rateLimit';

// Export middleware
export {
  // Error handling
  createErrorHandler,
  notFoundHandler,

  // CORS
  cors,
  devCors,
  prodCors,
  customOriginCors,

  // Request ID
  requestIdMiddleware,

  // Types
  type CorsOptions,
  type RequestIdOptions,
} from './middleware/index';
