/**
 * Logging Utilities
 * Provides structured JSON logging with context and correlation
 */

import type { Context } from 'hono';
import type { LogLevel, LogEntry, RequestContext } from '../types';

/**
 * Logger configuration
 */
interface LoggerConfig {
  serviceName: string;
  minLevel?: LogLevel;
  includeTimestamp?: boolean;
  prettyPrint?: boolean;
}

/**
 * Log level priorities (lower number = higher priority)
 */
const LOG_LEVELS: Record<LogLevel, number> = {
  fatal: 0,
  error: 1,
  warn: 2,
  info: 3,
  debug: 4,
} as const;

/**
 * Structured logger class
 */
export class Logger {
  private config: Required<LoggerConfig>;

  constructor(config: LoggerConfig) {
    this.config = {
      minLevel: 'info',
      includeTimestamp: true,
      prettyPrint: process.env.NODE_ENV !== 'production',
      ...config,
    };
  }

  /**
   * Check if a log level should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] <= LOG_LEVELS[this.config.minLevel];
  }

  /**
   * Format and output log entry
   */
  private log(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) {
      return;
    }

    const logData = {
      ...entry,
      service: this.config.serviceName,
      timestamp: this.config.includeTimestamp ? entry.timestamp : undefined,
    };

    if (this.config.prettyPrint) {
      console.log(JSON.stringify(logData, null, 2));
    } else {
      console.log(JSON.stringify(logData));
    }
  }

  /**
   * Create log entry
   */
  private createEntry(
    level: LogLevel,
    message: string,
    metadata?: Record<string, unknown>
  ): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      metadata,
    };
  }

  /**
   * Debug log
   */
  debug(message: string, metadata?: Record<string, unknown>): void {
    this.log(this.createEntry('debug', message, metadata));
  }

  /**
   * Info log
   */
  info(message: string, metadata?: Record<string, unknown>): void {
    this.log(this.createEntry('info', message, metadata));
  }

  /**
   * Warning log
   */
  warn(message: string, metadata?: Record<string, unknown>): void {
    this.log(this.createEntry('warn', message, metadata));
  }

  /**
   * Error log
   */
  error(message: string, error?: Error | unknown, metadata?: Record<string, unknown>): void {
    const entry = this.createEntry('error', message, metadata);

    if (error instanceof Error) {
      entry.error = {
        message: error.message,
        stack: error.stack,
        code: 'code' in error ? String(error.code) : undefined,
      };
    } else if (error) {
      entry.metadata = { ...metadata, error };
    }

    this.log(entry);
  }

  /**
   * Fatal error log
   */
  fatal(message: string, error?: Error | unknown, metadata?: Record<string, unknown>): void {
    const entry = this.createEntry('fatal', message, metadata);

    if (error instanceof Error) {
      entry.error = {
        message: error.message,
        stack: error.stack,
        code: 'code' in error ? String(error.code) : undefined,
      };
    }

    this.log(entry);
  }

  /**
   * Create child logger with additional context
   */
  child(metadata: Record<string, unknown>): ContextLogger {
    return new ContextLogger(this, metadata);
  }

  /**
   * Log HTTP request
   */
  logRequest(
    method: string,
    path: string,
    metadata?: Record<string, unknown>
  ): void {
    this.info(`${method} ${path}`, {
      type: 'request',
      method,
      path,
      ...metadata,
    });
  }

  /**
   * Log HTTP response
   */
  logResponse(
    method: string,
    path: string,
    statusCode: number,
    duration: number,
    metadata?: Record<string, unknown>
  ): void {
    const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';

    this.log(
      this.createEntry(`${method} ${path}`, {
        type: 'response',
        method,
        path,
        statusCode,
        duration,
        ...metadata,
      })
    );
  }
}

/**
 * Context logger with additional metadata
 */
class ContextLogger {
  constructor(
    private logger: Logger,
    private contextMetadata: Record<string, unknown>
  ) {}

  private mergeMetadata(metadata?: Record<string, unknown>): Record<string, unknown> {
    return { ...this.contextMetadata, ...metadata };
  }

  debug(message: string, metadata?: Record<string, unknown>): void {
    this.logger.debug(message, this.mergeMetadata(metadata));
  }

  info(message: string, metadata?: Record<string, unknown>): void {
    this.logger.info(message, this.mergeMetadata(metadata));
  }

  warn(message: string, metadata?: Record<string, unknown>): void {
    this.logger.warn(message, this.mergeMetadata(metadata));
  }

  error(message: string, error?: Error | unknown, metadata?: Record<string, unknown>): void {
    this.logger.error(message, error, this.mergeMetadata(metadata));
  }

  fatal(message: string, error?: Error | unknown, metadata?: Record<string, unknown>): void {
    this.logger.fatal(message, error, this.mergeMetadata(metadata));
  }
}

/**
 * Generate correlation ID (request ID)
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Extract request context from Hono context
 */
export function extractRequestContext(c: Context): RequestContext {
  return {
    requestId: c.get('requestId') || generateRequestId(),
    userId: c.get('userId'),
    userRole: c.get('userRole'),
    tenantId: c.get('tenantId'),
    ip: c.req.header('x-forwarded-for') || c.req.header('x-real-ip'),
    userAgent: c.req.header('user-agent'),
    timestamp: new Date(),
  };
}

/**
 * Request logging middleware for Hono
 */
export function requestLogger(logger: Logger) {
  return async (c: Context, next: () => Promise<void>) => {
    const start = Date.now();
    const requestId = c.get('requestId') || generateRequestId();

    // Store request ID in context
    c.set('requestId', requestId);

    // Log incoming request
    logger.info(`Incoming request: ${c.req.method} ${c.req.path}`, {
      type: 'request',
      requestId,
      method: c.req.method,
      path: c.req.path,
      query: c.req.query(),
      ip: c.req.header('x-forwarded-for') || c.req.header('x-real-ip'),
      userAgent: c.req.header('user-agent'),
    });

    // Process request
    await next();

    // Calculate duration
    const duration = Date.now() - start;

    // Log response
    const statusCode = c.res.status;
    const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';

    logger[level](`Request completed: ${c.req.method} ${c.req.path}`, {
      type: 'response',
      requestId,
      method: c.req.method,
      path: c.req.path,
      statusCode,
      duration,
    });
  };
}

/**
 * Error logging middleware for Hono
 */
export function errorLogger(logger: Logger) {
  return async (c: Context, next: () => Promise<void>) => {
    try {
      await next();
    } catch (error) {
      const requestId = c.get('requestId');

      logger.error(
        `Request failed: ${c.req.method} ${c.req.path}`,
        error instanceof Error ? error : new Error(String(error)),
        {
          requestId,
          method: c.req.method,
          path: c.req.path,
        }
      );

      throw error;
    }
  };
}

/**
 * Create logger instance with service name
 */
export function createLogger(serviceName: string, config?: Partial<LoggerConfig>): Logger {
  return new Logger({
    serviceName,
    ...config,
  });
}

/**
 * Performance logging helper
 */
export class PerformanceLogger {
  private startTime: number;
  private checkpoints: Map<string, number>;

  constructor(
    private logger: Logger,
    private operation: string
  ) {
    this.startTime = Date.now();
    this.checkpoints = new Map();
  }

  /**
   * Mark a checkpoint
   */
  checkpoint(name: string): void {
    this.checkpoints.set(name, Date.now());
  }

  /**
   * End and log performance
   */
  end(metadata?: Record<string, unknown>): void {
    const duration = Date.now() - this.startTime;

    const checkpointData: Record<string, number> = {};
    this.checkpoints.forEach((time, name) => {
      checkpointData[name] = time - this.startTime;
    });

    this.logger.info(`Performance: ${this.operation}`, {
      type: 'performance',
      operation: this.operation,
      duration,
      checkpoints: checkpointData,
      ...metadata,
    });
  }
}

/**
 * Redact sensitive data from logs
 */
export function redactSensitiveData(
  data: Record<string, unknown>,
  sensitiveKeys: string[] = ['password', 'token', 'secret', 'apiKey', 'authorization']
): Record<string, unknown> {
  const redacted = { ...data };

  for (const key of Object.keys(redacted)) {
    if (sensitiveKeys.some((sensitive) => key.toLowerCase().includes(sensitive.toLowerCase()))) {
      redacted[key] = '***REDACTED***';
    } else if (typeof redacted[key] === 'object' && redacted[key] !== null) {
      redacted[key] = redactSensitiveData(
        redacted[key] as Record<string, unknown>,
        sensitiveKeys
      );
    }
  }

  return redacted;
}
