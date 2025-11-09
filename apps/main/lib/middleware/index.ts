/**
 * Middleware Index
 * Exports all middleware utilities
 */

export {
  validateAuth,
  validateOptionalAuth,
  requireRole,
  extractBearerToken,
  AuthenticationError,
} from './authentication';

export {
  log,
  logRequest,
  logResponse,
  logError,
  logServiceCall,
  logServiceResponse,
  createTimer,
  LogLevel,
} from './logging';

export {
  checkRateLimit,
  getRateLimitInfo,
  addRateLimitHeaders,
  cleanupRateLimitStore,
  RateLimitError,
} from './rateLimit';

export {
  createErrorResponse,
  handleError,
  withErrorHandler,
  ValidationError,
  NotFoundError,
  ServiceError,
} from './errorHandler';

export {
  addCorsHeaders,
  handleCorsPreFlight,
  isOriginAllowed,
} from './cors';
