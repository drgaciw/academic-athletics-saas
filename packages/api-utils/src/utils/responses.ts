/**
 * Response Formatting Utilities
 * Provides standardized response wrappers for consistent API responses
 */

import type {
  SuccessResponse,
  ErrorResponse,
  PaginatedResponse,
  PaginationMeta,
  PaginationParams,
} from '../types';
import { formatErrorResponse } from './errors';

/**
 * Create a success response
 */
export function successResponse<T>(
  data: T,
  requestId?: string
): SuccessResponse<T> {
  return {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      requestId,
    },
  };
}

/**
 * Create an error response
 */
export function errorResponse(
  error: unknown,
  requestId?: string,
  path?: string
): ErrorResponse {
  return formatErrorResponse(error, requestId, path);
}

/**
 * Calculate pagination metadata
 */
export function calculatePagination(
  totalItems: number,
  page: number,
  pageSize: number
): PaginationMeta {
  const totalPages = Math.ceil(totalItems / pageSize);

  return {
    page,
    pageSize,
    totalItems,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}

/**
 * Create a paginated response
 */
export function paginatedResponse<T>(
  data: T[],
  totalItems: number,
  params: Required<Pick<PaginationParams, 'page' | 'pageSize'>>,
  requestId?: string
): PaginatedResponse<T> {
  const pagination = calculatePagination(totalItems, params.page, params.pageSize);

  return {
    success: true,
    data,
    pagination,
    meta: {
      timestamp: new Date().toISOString(),
      requestId,
    },
  };
}

/**
 * Parse and validate pagination parameters from query
 */
export function parsePaginationParams(
  query: Record<string, unknown>,
  defaults: { page?: number; pageSize?: number; maxPageSize?: number } = {}
): Required<Pick<PaginationParams, 'page' | 'pageSize'>> {
  const {
    page: defaultPage = 1,
    pageSize: defaultPageSize = 20,
    maxPageSize = 100,
  } = defaults;

  let page = Number(query.page) || defaultPage;
  let pageSize = Number(query.pageSize) || defaultPageSize;

  // Ensure positive values
  page = Math.max(1, page);
  pageSize = Math.max(1, Math.min(pageSize, maxPageSize));

  return { page, pageSize };
}

/**
 * Parse sorting parameters from query
 */
export function parseSortParams(
  query: Record<string, unknown>,
  allowedFields: string[] = [],
  defaultSort?: { sortBy: string; sortOrder: 'asc' | 'desc' }
): Pick<PaginationParams, 'sortBy' | 'sortOrder'> {
  const sortBy = typeof query.sortBy === 'string' ? query.sortBy : defaultSort?.sortBy;
  const sortOrder =
    query.sortOrder === 'asc' || query.sortOrder === 'desc'
      ? query.sortOrder
      : defaultSort?.sortOrder || 'desc';

  // Validate sortBy is in allowed fields
  if (sortBy && allowedFields.length > 0 && !allowedFields.includes(sortBy)) {
    return {
      sortBy: defaultSort?.sortBy,
      sortOrder,
    };
  }

  return { sortBy, sortOrder };
}

/**
 * Create a response with custom metadata
 */
export function responseWithMeta<T>(
  data: T,
  meta: Record<string, unknown>,
  requestId?: string
): SuccessResponse<T> & { meta: Record<string, unknown> } {
  return {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      requestId,
      ...meta,
    },
  };
}

/**
 * Create a no-content response (204)
 */
export function noContentResponse(): { success: true } {
  return { success: true };
}

/**
 * Create a created response (201)
 */
export function createdResponse<T>(
  data: T,
  location?: string,
  requestId?: string
): SuccessResponse<T> & { location?: string } {
  const response = successResponse(data, requestId);

  if (location) {
    return { ...response, location };
  }

  return response;
}

/**
 * Create an accepted response (202)
 */
export function acceptedResponse<T = { message: string }>(
  data?: T,
  requestId?: string
): SuccessResponse<T> {
  return successResponse(
    data ?? ({ message: 'Request accepted for processing' } as T),
    requestId
  );
}

/**
 * Pagination helpers
 */
export const PaginationHelpers = {
  /**
   * Get offset for database queries
   */
  getOffset(page: number, pageSize: number): number {
    return (page - 1) * pageSize;
  },

  /**
   * Get limit for database queries
   */
  getLimit(pageSize: number): number {
    return pageSize;
  },

  /**
   * Check if page is valid
   */
  isValidPage(page: number, totalPages: number): boolean {
    return page >= 1 && page <= totalPages;
  },

  /**
   * Get page from offset
   */
  getPageFromOffset(offset: number, pageSize: number): number {
    return Math.floor(offset / pageSize) + 1;
  },
} as const;

/**
 * Response type guards
 */
export const ResponseGuards = {
  isSuccessResponse<T>(response: unknown): response is SuccessResponse<T> {
    return (
      typeof response === 'object' &&
      response !== null &&
      'success' in response &&
      response.success === true &&
      'data' in response
    );
  },

  isErrorResponse(response: unknown): response is ErrorResponse {
    return (
      typeof response === 'object' &&
      response !== null &&
      'success' in response &&
      response.success === false &&
      'error' in response
    );
  },

  isPaginatedResponse<T>(response: unknown): response is PaginatedResponse<T> {
    return (
      typeof response === 'object' &&
      response !== null &&
      'success' in response &&
      response.success === true &&
      'data' in response &&
      'pagination' in response &&
      Array.isArray((response as PaginatedResponse<T>).data)
    );
  },
} as const;
