/**
 * ServiceClient Unit Tests
 * Tests for the base HTTP client with retry logic, timeout, and error handling
 */

import { ServiceClient, getServiceUrl } from '../serviceClient';
import { ServiceError } from '../../middleware/errorHandler';
import { RequestContext, UserRole } from '../../types/services/common';

// Mock fetch globally
global.fetch = jest.fn();

// Mock setTimeout for retry delays
jest.useFakeTimers();

describe('ServiceClient', () => {
  let client: ServiceClient;
  const mockContext: RequestContext = {
    userId: 'user-123',
    clerkId: 'clerk-123',
    role: UserRole.STUDENT,
    correlationId: 'corr-123',
    timestamp: new Date(),
  };

  beforeEach(() => {
    client = new ServiceClient('test-service', {
      baseUrl: 'http://localhost:3000',
      timeout: 5000,
      retries: 2,
      retryDelay: 100,
    });
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
  });

  describe('request', () => {
    it('should make successful GET request', async () => {
      const mockResponse = { data: 'test' };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockResponse,
      });

      const result = await client.get('/test', mockContext);

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/test',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-Service-Name': 'test-service',
            'X-Correlation-Id': 'corr-123',
            'X-User-Id': 'user-123',
          }),
        })
      );
    });

    it('should make successful POST request with body', async () => {
      const requestBody = { name: 'test' };
      const mockResponse = { id: '123', ...requestBody };
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 201,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockResponse,
      });

      const result = await client.post('/test', requestBody, mockContext);

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/test',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(requestBody),
        })
      );
    });

    it('should retry on 5xx errors', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: 503,
          statusText: 'Service Unavailable',
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 503,
          statusText: 'Service Unavailable',
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({ success: true }),
        });

      const promise = client.get('/test', mockContext);
      
      // Fast-forward through retry delays
      await jest.runAllTimersAsync();
      
      const result = await promise;

      expect(result).toEqual({ success: true });
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    it('should not retry on 4xx errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await expect(client.get('/test', mockContext)).rejects.toThrow(ServiceError);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should throw ServiceError after max retries', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
      });

      const promise = client.get('/test', mockContext);
      await jest.runAllTimersAsync();

      await expect(promise).rejects.toThrow(ServiceError);
      expect(global.fetch).toHaveBeenCalledTimes(3); // initial + 2 retries
    });

    it('should handle timeout', async () => {
      (global.fetch as jest.Mock).mockImplementation(() => 
        new Promise((resolve) => {
          setTimeout(() => resolve({
            ok: true,
            status: 200,
            headers: new Headers({ 'content-type': 'application/json' }),
            json: async () => ({ data: 'test' }),
          }), 10000);
        })
      );

      const promise = client.request('/test', { timeout: 1000 }, mockContext);
      
      await jest.advanceTimersByTimeAsync(1000);

      await expect(promise).rejects.toThrow('timeout');
    });

    it('should handle empty responses', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 204,
        headers: new Headers({ 'content-type': 'text/plain' }),
      });

      const result = await client.get('/test', mockContext);

      expect(result).toBeNull();
    });

    it('should use exponential backoff for retries', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
      });

      const promise = client.get('/test', mockContext);
      
      // First retry: 100ms * 2^0 = 100ms
      await jest.advanceTimersByTimeAsync(100);
      
      // Second retry: 100ms * 2^1 = 200ms
      await jest.advanceTimersByTimeAsync(200);

      await expect(promise).rejects.toThrow(ServiceError);
    });
  });

  describe('HTTP method helpers', () => {
    it('should support PUT requests', async () => {
      const mockResponse = { updated: true };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockResponse,
      });

      const result = await client.put('/test', { data: 'update' }, mockContext);

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: 'PUT' })
      );
    });

    it('should support PATCH requests', async () => {
      const mockResponse = { patched: true };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockResponse,
      });

      const result = await client.patch('/test', { field: 'value' }, mockContext);

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: 'PATCH' })
      );
    });

    it('should support DELETE requests', async () => {
      const mockResponse = { deleted: true };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockResponse,
      });

      const result = await client.delete('/test', mockContext);

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  describe('stream', () => {
    it('should handle streaming responses', async () => {
      const mockStream = new ReadableStream();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        body: mockStream,
      });

      const result = await client.stream('/test', { data: 'test' }, mockContext);

      expect(result).toBe(mockStream);
    });
  });

  describe('healthCheck', () => {
    it('should return healthy status on success', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
      });

      const result = await client.healthCheck();

      expect(result).toEqual({ status: 'healthy' });
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/health',
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('should return unhealthy status on failure', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Connection failed'));

      const result = await client.healthCheck();

      expect(result).toEqual({ status: 'unhealthy' });
    });
  });
});

describe('getServiceUrl', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should return URL from environment variable', () => {
    process.env.USER_SERVICE_URL = 'https://user-service.example.com';
    
    const url = getServiceUrl('user');
    
    expect(url).toBe('https://user-service.example.com');
  });

  it('should return Vercel URL pattern when VERCEL_URL is set', () => {
    delete process.env.USER_SERVICE_URL;
    process.env.VERCEL_URL = 'example.vercel.app';
    
    const url = getServiceUrl('user');
    
    expect(url).toBe('https://user-service.example.vercel.app');
  });

  it('should return localhost URL for development', () => {
    delete process.env.USER_SERVICE_URL;
    delete process.env.VERCEL_URL;
    
    const url = getServiceUrl('user');
    
    expect(url).toBe('http://localhost:3001');
  });

  it('should use correct default ports', () => {
    delete process.env.VERCEL_URL;
    
    expect(getServiceUrl('user')).toContain(':3001');
    expect(getServiceUrl('compliance')).toContain(':3002');
    expect(getServiceUrl('advising')).toContain(':3003');
    expect(getServiceUrl('monitoring')).toContain(':3004');
    expect(getServiceUrl('support')).toContain(':3005');
    expect(getServiceUrl('integration')).toContain(':3006');
    expect(getServiceUrl('ai')).toContain(':3007');
  });
});
