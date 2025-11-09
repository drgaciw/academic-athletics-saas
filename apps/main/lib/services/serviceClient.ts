/**
 * Base Service Client
 * Provides HTTP client with retry logic, timeout, and error handling
 */

import { RequestContext } from '../types/services';
import { logServiceCall, logServiceResponse } from '../middleware/logging';
import { ServiceError } from '../middleware/errorHandler';

export interface ServiceConfig {
  baseUrl: string;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retries?: number;
  stream?: boolean;
}

/**
 * Base HTTP client for microservices
 */
export class ServiceClient {
  private config: Required<ServiceConfig>;
  private serviceName: string;

  constructor(serviceName: string, config: ServiceConfig) {
    this.serviceName = serviceName;
    this.config = {
      baseUrl: config.baseUrl,
      timeout: config.timeout || 30000, // 30 seconds default
      retries: config.retries || 3,
      retryDelay: config.retryDelay || 1000, // 1 second default
    };
  }

  /**
   * Makes HTTP request with retry logic
   */
  async request<T = any>(
    endpoint: string,
    options: RequestOptions = {},
    context?: RequestContext
  ): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`;
    const method = options.method || 'GET';
    const timeout = options.timeout || this.config.timeout;
    const maxRetries = options.retries ?? this.config.retries;

    logServiceCall(this.serviceName, endpoint, method, context);

    let lastError: Error | null = null;
    const startTime = Date.now();

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'X-Service-Name': this.serviceName,
          ...options.headers,
        };

        // Add correlation ID if context provided
        if (context) {
          headers['X-Correlation-Id'] = context.correlationId;
          headers['X-User-Id'] = context.userId;
        }

        const response = await fetch(url, {
          method,
          headers,
          body: options.body ? JSON.stringify(options.body) : undefined,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const duration = Date.now() - startTime;
        logServiceResponse(this.serviceName, response.status, duration, context);

        if (!response.ok) {
          throw new ServiceError(
            `${this.serviceName} request failed: ${response.statusText}`,
            response.status,
            this.serviceName
          );
        }

        // Handle streaming responses
        if (options.stream) {
          return response.body as any;
        }

        // Handle empty responses
        const contentType = response.headers.get('content-type');
        if (!contentType?.includes('application/json')) {
          return null as any;
        }

        return await response.json();
      } catch (error) {
        lastError = error as Error;

        // Don't retry on 4xx errors (client errors)
        if (error instanceof ServiceError && error.statusCode < 500) {
          throw error;
        }

        // Don't retry on abort errors (timeout)
        if (error instanceof Error && error.name === 'AbortError') {
          throw new ServiceError(
            `${this.serviceName} request timeout after ${timeout}ms`,
            408,
            this.serviceName
          );
        }

        // Wait before retry
        if (attempt < maxRetries) {
          await this.delay(this.config.retryDelay * Math.pow(2, attempt));
        }
      }
    }

    // All retries exhausted
    throw new ServiceError(
      `${this.serviceName} request failed after ${maxRetries} retries: ${lastError?.message}`,
      503,
      this.serviceName
    );
  }

  /**
   * GET request
   */
  async get<T = any>(
    endpoint: string,
    context?: RequestContext
  ): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' }, context);
  }

  /**
   * POST request
   */
  async post<T = any>(
    endpoint: string,
    body: any,
    context?: RequestContext
  ): Promise<T> {
    return this.request<T>(endpoint, { method: 'POST', body }, context);
  }

  /**
   * PUT request
   */
  async put<T = any>(
    endpoint: string,
    body: any,
    context?: RequestContext
  ): Promise<T> {
    return this.request<T>(endpoint, { method: 'PUT', body }, context);
  }

  /**
   * PATCH request
   */
  async patch<T = any>(
    endpoint: string,
    body: any,
    context?: RequestContext
  ): Promise<T> {
    return this.request<T>(endpoint, { method: 'PATCH', body }, context);
  }

  /**
   * DELETE request
   */
  async delete<T = any>(
    endpoint: string,
    context?: RequestContext
  ): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' }, context);
  }

  /**
   * Streaming request (for AI service)
   */
  async stream(
    endpoint: string,
    body: any,
    context?: RequestContext
  ): Promise<ReadableStream<Uint8Array>> {
    return this.request<ReadableStream<Uint8Array>>(
      endpoint,
      { method: 'POST', body, stream: true },
      context
    );
  }

  /**
   * Delay helper for retries
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy' }> {
    try {
      const response = await fetch(`${this.config.baseUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });

      return {
        status: response.ok ? 'healthy' : 'unhealthy',
      };
    } catch {
      return { status: 'unhealthy' };
    }
  }
}

/**
 * Get service base URL from environment
 */
export function getServiceUrl(serviceName: string): string {
  const envKey = `${serviceName.toUpperCase()}_SERVICE_URL`;
  const url = process.env[envKey];

  if (!url) {
    // Fallback to Vercel deployment URL pattern
    const vercelUrl = process.env.VERCEL_URL;
    if (vercelUrl) {
      return `https://${serviceName}-service.${vercelUrl}`;
    }

    // Development fallback
    return `http://localhost:${getDefaultPort(serviceName)}`;
  }

  return url;
}

/**
 * Default ports for development
 */
function getDefaultPort(serviceName: string): number {
  const ports: Record<string, number> = {
    user: 3001,
    compliance: 3002,
    advising: 3003,
    monitoring: 3004,
    support: 3005,
    integration: 3006,
    ai: 3007,
  };

  return ports[serviceName] || 3000;
}
