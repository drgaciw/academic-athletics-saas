/**
 * Common types shared across all services
 */

export interface ApiResponse<T = any> {
  data?: T;
  error?: ApiError;
  meta?: ResponseMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
  requestId: string;
}

export interface ResponseMeta {
  requestId: string;
  timestamp: string;
  duration?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface StreamingResponse {
  stream: ReadableStream<Uint8Array>;
  requestId: string;
}

// HTTP Methods
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

// User Roles
export enum UserRole {
  STUDENT = 'STUDENT',
  ADVISOR = 'ADVISOR',
  COMPLIANCE = 'COMPLIANCE',
  ADMIN = 'ADMIN',
  FACULTY = 'FACULTY',
}

// Request context passed to services
export interface RequestContext {
  userId: string;
  clerkId: string;
  role: UserRole;
  correlationId: string;
  timestamp: Date;
}
