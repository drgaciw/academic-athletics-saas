/**
 * HTTP Utilities
 * Provides HTTP client with retry logic, timeouts, and interceptors
 */

import type {
  HttpClientConfig,
  HttpRequestOptions,
  HttpResponse,
} from '../types';
import { ExternalServiceError, TimeoutError } from './errors';

/**
 * HTTP Client with retry logic and timeout handling
 */
export class HttpClient {
  private config: Required<HttpClientConfig>;

  constructor(config: HttpClientConfig = {}) {
    this.config = {
      baseURL: config.baseURL || '',
      timeout: config.timeout || 30000,
      maxRetries: config.maxRetries || 3,
      retryDelay: config.retryDelay || 1000,
      headers: config.headers || {},
    };
  }

  /**
   * Build full URL with query parameters
   */
  private buildURL(path: string, params?: Record<string, string | number | boolean>): string {
    const url = new URL(path, this.config.baseURL || undefined);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, String(value));
      });
    }

    return url.toString();
  }

  /**
   * Create abort controller with timeout
   */
  private createAbortSignal(timeout: number): AbortSignal {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), timeout);
    return controller.signal;
  }

  /**
   * Delay execution for retry
   */
  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: unknown): boolean {
    if (error instanceof TypeError) {
      // Network errors
      return true;
    }

    if (error instanceof Error && error.name === 'AbortError') {
      // Timeout errors
      return true;
    }

    // Add more retryable conditions as needed
    return false;
  }

  /**
   * Execute request with retry logic
   */
  private async executeWithRetry<T>(
    requestFn: () => Promise<HttpResponse<T>>,
    retries: number
  ): Promise<HttpResponse<T>> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error;

        // Don't retry if not retryable or if this was the last attempt
        if (!this.isRetryableError(error) || attempt === retries) {
          throw error;
        }

        // Exponential backoff
        const delay = this.config.retryDelay * Math.pow(2, attempt);
        await this.delay(delay);
      }
    }

    throw lastError;
  }

  /**
   * Make HTTP request
   */
  async request<T = unknown>(
    method: string,
    path: string,
    options: HttpRequestOptions = {}
  ): Promise<HttpResponse<T>> {
    const {
      params,
      timeout = this.config.timeout,
      retries = this.config.maxRetries,
      body,
      headers = {},
      ...fetchOptions
    } = options;

    const url = this.buildURL(path, params);

    const requestFn = async (): Promise<HttpResponse<T>> => {
      const signal = this.createAbortSignal(timeout);

      try {
        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            ...this.config.headers,
            ...headers,
          },
          body: body ? JSON.stringify(body) : undefined,
          signal,
          ...fetchOptions,
        });

        // Parse response
        let data: T;
        const contentType = response.headers.get('content-type');

        if (contentType?.includes('application/json')) {
          data = await response.json();
        } else {
          data = (await response.text()) as unknown as T;
        }

        // Check for HTTP errors
        if (!response.ok) {
          throw new ExternalServiceError(
            `HTTP ${response.status}: ${response.statusText}`,
            url,
            {
              status: response.status,
              statusText: response.statusText,
              data,
            }
          );
        }

        return {
          data,
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
        };
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          throw new TimeoutError(`Request timeout after ${timeout}ms`, timeout);
        }
        throw error;
      }
    };

    return this.executeWithRetry(requestFn, retries);
  }

  /**
   * GET request
   */
  async get<T = unknown>(
    path: string,
    options?: Omit<HttpRequestOptions, 'body'>
  ): Promise<HttpResponse<T>> {
    return this.request<T>('GET', path, options);
  }

  /**
   * POST request
   */
  async post<T = unknown>(
    path: string,
    body?: unknown,
    options?: Omit<HttpRequestOptions, 'body'>
  ): Promise<HttpResponse<T>> {
    return this.request<T>('POST', path, { ...options, body });
  }

  /**
   * PUT request
   */
  async put<T = unknown>(
    path: string,
    body?: unknown,
    options?: Omit<HttpRequestOptions, 'body'>
  ): Promise<HttpResponse<T>> {
    return this.request<T>('PUT', path, { ...options, body });
  }

  /**
   * PATCH request
   */
  async patch<T = unknown>(
    path: string,
    body?: unknown,
    options?: Omit<HttpRequestOptions, 'body'>
  ): Promise<HttpResponse<T>> {
    return this.request<T>('PATCH', path, { ...options, body });
  }

  /**
   * DELETE request
   */
  async delete<T = unknown>(
    path: string,
    options?: Omit<HttpRequestOptions, 'body'>
  ): Promise<HttpResponse<T>> {
    return this.request<T>('DELETE', path, options);
  }
}

/**
 * Create HTTP client instance
 */
export function createHttpClient(config?: HttpClientConfig): HttpClient {
  return new HttpClient(config);
}

/**
 * URL building helpers
 */
export const URLHelpers = {
  /**
   * Build query string from object
   */
  buildQueryString(params: Record<string, string | number | boolean | undefined>): string {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    });

    const queryString = searchParams.toString();
    return queryString ? `?${queryString}` : '';
  },

  /**
   * Parse query string to object
   */
  parseQueryString(queryString: string): Record<string, string> {
    const params = new URLSearchParams(queryString);
    const result: Record<string, string> = {};

    params.forEach((value, key) => {
      result[key] = value;
    });

    return result;
  },

  /**
   * Join URL parts
   */
  joinURL(...parts: string[]): string {
    return parts
      .map((part, index) => {
        // Remove leading slash except for first part
        if (index > 0) {
          part = part.replace(/^\/+/, '');
        }
        // Remove trailing slash except for last part
        if (index < parts.length - 1) {
          part = part.replace(/\/+$/, '');
        }
        return part;
      })
      .join('/');
  },

  /**
   * Add query params to URL
   */
  addQueryParams(
    url: string,
    params: Record<string, string | number | boolean>
  ): string {
    const urlObj = new URL(url, 'http://dummy.com');

    Object.entries(params).forEach(([key, value]) => {
      urlObj.searchParams.append(key, String(value));
    });

    return url.includes('://') ? urlObj.toString() : urlObj.pathname + urlObj.search;
  },

  /**
   * Extract domain from URL
   */
  extractDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      return '';
    }
  },

  /**
   * Check if URL is absolute
   */
  isAbsoluteURL(url: string): boolean {
    return /^https?:\/\//i.test(url);
  },

  /**
   * Normalize URL (remove trailing slashes, etc.)
   */
  normalizeURL(url: string): string {
    try {
      const urlObj = new URL(url);
      // Remove trailing slash from pathname
      urlObj.pathname = urlObj.pathname.replace(/\/$/, '') || '/';
      return urlObj.toString();
    } catch {
      // If not a valid URL, just remove trailing slash
      return url.replace(/\/$/, '');
    }
  },
} as const;

/**
 * Request interceptor type
 */
export type RequestInterceptor = (
  url: string,
  options: RequestInit
) => Promise<{ url: string; options: RequestInit }> | { url: string; options: RequestInit };

/**
 * Response interceptor type
 */
export type ResponseInterceptor = <T>(
  response: HttpResponse<T>
) => Promise<HttpResponse<T>> | HttpResponse<T>;

/**
 * HTTP Client with interceptors
 */
export class InterceptableHttpClient extends HttpClient {
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];

  /**
   * Add request interceptor
   */
  addRequestInterceptor(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor);
  }

  /**
   * Add response interceptor
   */
  addResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.responseInterceptors.push(interceptor);
  }

  /**
   * Apply request interceptors
   */
  private async applyRequestInterceptors(
    url: string,
    options: RequestInit
  ): Promise<{ url: string; options: RequestInit }> {
    let result = { url, options };

    for (const interceptor of this.requestInterceptors) {
      result = await interceptor(result.url, result.options);
    }

    return result;
  }

  /**
   * Apply response interceptors
   */
  private async applyResponseInterceptors<T>(
    response: HttpResponse<T>
  ): Promise<HttpResponse<T>> {
    let result = response;

    for (const interceptor of this.responseInterceptors) {
      result = await interceptor(result);
    }

    return result;
  }

  /**
   * Override request method to apply interceptors
   */
  override async request<T = unknown>(
    method: string,
    path: string,
    options: HttpRequestOptions = {}
  ): Promise<HttpResponse<T>> {
    const response = await super.request<T>(method, path, options);
    return this.applyResponseInterceptors(response);
  }
}

/**
 * Common request interceptors
 */
export const RequestInterceptors = {
  /**
   * Add authorization header
   */
  withAuth(token: string): RequestInterceptor {
    return ({ url, options }) => ({
      url,
      options: {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${token}`,
        },
      },
    });
  },

  /**
   * Add API key header
   */
  withApiKey(apiKey: string, headerName = 'X-API-Key'): RequestInterceptor {
    return ({ url, options }) => ({
      url,
      options: {
        ...options,
        headers: {
          ...options.headers,
          [headerName]: apiKey,
        },
      },
    });
  },

  /**
   * Add custom headers
   */
  withHeaders(headers: Record<string, string>): RequestInterceptor {
    return ({ url, options }) => ({
      url,
      options: {
        ...options,
        headers: {
          ...options.headers,
          ...headers,
        },
      },
    });
  },
} as const;
