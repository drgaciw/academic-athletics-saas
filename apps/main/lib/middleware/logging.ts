/**
 * Logging Middleware
 * Provides structured logging for requests and responses
 */

import { NextRequest } from 'next/server';
import { RequestContext } from '../types/services';

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  correlationId?: string;
  userId?: string;
  metadata?: Record<string, any>;
}

/**
 * Logs a structured log entry
 */
export function log(
  level: LogLevel,
  message: string,
  metadata?: Record<string, any>,
  context?: RequestContext
): void {
  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    correlationId: context?.correlationId,
    userId: context?.userId,
    metadata,
  };

  // In production, this would send to a logging service like Sentry or Datadog
  if (process.env.NODE_ENV === 'production') {
    // Send to logging service
    console.log(JSON.stringify(entry));
  } else {
    // Pretty print for development
    console.log(
      `[${entry.level}] ${entry.timestamp} - ${message}`,
      entry.metadata || ''
    );
  }
}

/**
 * Logs incoming API request
 */
export function logRequest(
  request: NextRequest,
  context?: RequestContext
): void {
  log(
    LogLevel.INFO,
    'Incoming request',
    {
      method: request.method,
      url: request.url,
      headers: Object.fromEntries(request.headers.entries()),
    },
    context
  );
}

/**
 * Logs API response
 */
export function logResponse(
  statusCode: number,
  duration: number,
  context?: RequestContext
): void {
  const level = statusCode >= 500 ? LogLevel.ERROR :
                statusCode >= 400 ? LogLevel.WARN :
                LogLevel.INFO;

  log(
    level,
    'Request completed',
    {
      statusCode,
      duration: `${duration}ms`,
    },
    context
  );
}

/**
 * Logs an error
 */
export function logError(
  error: Error,
  context?: RequestContext,
  additionalMetadata?: Record<string, any>
): void {
  log(
    LogLevel.ERROR,
    error.message,
    {
      errorName: error.name,
      stack: error.stack,
      ...additionalMetadata,
    },
    context
  );
}

/**
 * Creates a performance timer
 */
export function createTimer(): () => number {
  const start = Date.now();
  return () => Date.now() - start;
}

/**
 * Logs service call
 */
export function logServiceCall(
  serviceName: string,
  endpoint: string,
  method: string,
  context?: RequestContext
): void {
  log(
    LogLevel.DEBUG,
    `Calling ${serviceName}`,
    {
      service: serviceName,
      endpoint,
      method,
    },
    context
  );
}

/**
 * Logs service response
 */
export function logServiceResponse(
  serviceName: string,
  statusCode: number,
  duration: number,
  context?: RequestContext
): void {
  const level = statusCode >= 500 ? LogLevel.ERROR : LogLevel.DEBUG;

  log(
    level,
    `${serviceName} response`,
    {
      service: serviceName,
      statusCode,
      duration: `${duration}ms`,
    },
    context
  );
}
