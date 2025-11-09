/**
 * Common API Types
 * Shared type definitions used across all microservices
 */

/**
 * Error categories for consistent error handling
 */
export enum ErrorCategory {
  AUTH = 'AUTH',
  VALIDATION = 'VALIDATION',
  NOT_FOUND = 'NOT_FOUND',
  SERVER = 'SERVER',
  EXTERNAL = 'EXTERNAL',
  RATE_LIMIT = 'RATE_LIMIT',
  CONFLICT = 'CONFLICT',
  FORBIDDEN = 'FORBIDDEN'
}

/**
 * Error code mapping for standardized error responses
 */
export type ErrorCode =
  // Auth errors (1000-1999)
  | 'AUTH_UNAUTHORIZED'
  | 'AUTH_FORBIDDEN'
  | 'AUTH_TOKEN_EXPIRED'
  | 'AUTH_TOKEN_INVALID'
  | 'AUTH_MISSING_CREDENTIALS'

  // Validation errors (2000-2999)
  | 'VALIDATION_FAILED'
  | 'VALIDATION_INVALID_INPUT'
  | 'VALIDATION_MISSING_FIELD'
  | 'VALIDATION_INVALID_FORMAT'

  // Not found errors (3000-3999)
  | 'NOT_FOUND_RESOURCE'
  | 'NOT_FOUND_ENDPOINT'
  | 'NOT_FOUND_USER'

  // Server errors (4000-4999)
  | 'SERVER_ERROR'
  | 'SERVER_DATABASE_ERROR'
  | 'SERVER_UNAVAILABLE'
  | 'SERVER_TIMEOUT'

  // External service errors (5000-5999)
  | 'EXTERNAL_SERVICE_ERROR'
  | 'EXTERNAL_API_ERROR'
  | 'EXTERNAL_TIMEOUT'

  // Rate limit errors (6000-6999)
  | 'RATE_LIMIT_EXCEEDED'
  | 'RATE_LIMIT_QUOTA_EXCEEDED'

  // Conflict errors (7000-7999)
  | 'CONFLICT_DUPLICATE'
  | 'CONFLICT_RESOURCE_EXISTS'
  | 'CONFLICT_STATE';

/**
 * Standard error response structure
 */
export interface ErrorResponse {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    category: ErrorCategory;
    details?: unknown;
    timestamp: string;
    requestId?: string;
    path?: string;
  };
}

/**
 * Standard success response structure
 */
export interface SuccessResponse<T = unknown> {
  success: true;
  data: T;
  meta?: {
    timestamp: string;
    requestId?: string;
  };
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Paginated response structure
 */
export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: PaginationMeta;
  meta?: {
    timestamp: string;
    requestId?: string;
  };
}

/**
 * API response type (union of all possible responses)
 */
export type ApiResponse<T = unknown> =
  | SuccessResponse<T>
  | PaginatedResponse<T>
  | ErrorResponse;

/**
 * Request context information
 */
export interface RequestContext {
  requestId: string;
  userId?: string;
  userRole?: string;
  tenantId?: string;
  ip?: string;
  userAgent?: string;
  timestamp: Date;
}

/**
 * Pagination parameters for requests
 */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * HTTP method types
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD';

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  keyPrefix?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

/**
 * Rate limit info returned in headers
 */
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Log level types
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

/**
 * Structured log entry
 */
export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  requestId?: string;
  userId?: string;
  service?: string;
  metadata?: Record<string, unknown>;
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
}

/**
 * HTTP client configuration
 */
export interface HttpClientConfig {
  baseURL?: string;
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
  headers?: Record<string, string>;
}

/**
 * HTTP client request options
 */
export interface HttpRequestOptions extends Omit<RequestInit, 'body'> {
  params?: Record<string, string | number | boolean>;
  timeout?: number;
  retries?: number;
  body?: unknown;
}

/**
 * HTTP client response
 */
export interface HttpResponse<T = unknown> {
  data: T;
  status: number;
  statusText: string;
  headers: Headers;
}
