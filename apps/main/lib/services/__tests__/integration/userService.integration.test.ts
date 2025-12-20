/**
 * User Service Integration Tests
 *
 * Tests the full flow from frontend service client through API route to mock backend.
 * These tests verify request/response formatting, error handling, and context propagation.
 */

import { UserService, userService } from '../../userService';
import { ServiceClient } from '../../serviceClient';
import { UserRole, type RequestContext } from '../../../middleware/authentication';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('UserService Integration Tests', () => {
  const baseContext: RequestContext = {
    userId: 'user-123',
    clerkId: 'clerk_abc123',
    role: UserRole.STUDENT,
    correlationId: 'corr-test-123',
    timestamp: new Date('2024-01-15T10:00:00Z'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('User Registration Flow', () => {
    it('should register a new student user with complete profile', async () => {
      const registrationRequest = {
        clerkId: 'clerk_new123',
        email: 'athlete@university.edu',
        role: UserRole.STUDENT,
        firstName: 'John',
        lastName: 'Doe',
      };

      const expectedResponse = {
        id: 'usr_new123',
        clerkId: 'clerk_new123',
        email: 'athlete@university.edu',
        role: 'STUDENT',
        firstName: 'John',
        lastName: 'Doe',
        aiOptIn: true,
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => expectedResponse,
      });

      const result = await userService.register(registrationRequest, baseContext);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];

      // Verify endpoint
      expect(url).toContain('/register');

      // Verify headers propagation
      expect(options.headers['X-Correlation-Id']).toBe('corr-test-123');
      expect(options.headers['X-User-Id']).toBe('user-123');
      expect(options.headers['X-User-Role']).toBe('STUDENT');
      expect(options.headers['Content-Type']).toBe('application/json');

      // Verify request body
      const body = JSON.parse(options.body);
      expect(body).toEqual(registrationRequest);

      // Verify response
      expect(result).toEqual(expectedResponse);
    });

    it('should handle duplicate email registration error', async () => {
      const registrationRequest = {
        clerkId: 'clerk_dup123',
        email: 'existing@university.edu',
        role: UserRole.STUDENT,
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 409,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          error: {
            code: 'USER_EXISTS',
            message: 'A user with this email already exists',
          },
        }),
      });

      await expect(
        userService.register(registrationRequest, baseContext)
      ).rejects.toMatchObject({
        statusCode: 409,
      });
    });

    it('should handle invalid role in registration', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          error: {
            code: 'INVALID_ROLE',
            message: 'Invalid role specified',
          },
        }),
      });

      await expect(
        userService.register(
          {
            clerkId: 'clerk_123',
            email: 'test@test.com',
            role: 'INVALID' as UserRole,
          },
          baseContext
        )
      ).rejects.toMatchObject({
        statusCode: 400,
      });
    });
  });

  describe('Profile Retrieval Flow', () => {
    it('should get user profile with student profile included', async () => {
      const expectedProfile = {
        id: 'usr_123',
        clerkId: 'clerk_abc123',
        email: 'athlete@university.edu',
        role: 'STUDENT',
        firstName: 'John',
        lastName: 'Doe',
        aiOptIn: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
        studentProfile: {
          id: 'sp_123',
          sport: 'BASKETBALL',
          position: 'Point Guard',
          classYear: 'JUNIOR',
          eligibilityStatus: 'ELIGIBLE',
          scholarshipStatus: 'FULL',
          gpa: 3.5,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => expectedProfile,
      });

      const result = await userService.getProfile('usr_123', baseContext);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain('/profile/usr_123');

      expect(result).toEqual(expectedProfile);
      expect(result.studentProfile?.sport).toBe('BASKETBALL');
    });

    it('should handle profile not found error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User profile not found',
          },
        }),
      });

      await expect(
        userService.getProfile('nonexistent_user', baseContext)
      ).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it('should handle unauthorized access to other user profile', async () => {
      const studentContext: RequestContext = {
        ...baseContext,
        userId: 'user-456',
        role: UserRole.STUDENT,
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          error: {
            code: 'FORBIDDEN',
            message: 'Cannot access other user profiles',
          },
        }),
      });

      await expect(
        userService.getProfile('usr_123', studentContext)
      ).rejects.toMatchObject({
        statusCode: 403,
      });
    });
  });

  describe('Profile Update Flow', () => {
    it('should update user profile successfully', async () => {
      const updateRequest = {
        firstName: 'Johnny',
        lastName: 'Updated',
        aiOptIn: false,
      };

      const expectedResponse = {
        id: 'usr_123',
        clerkId: 'clerk_abc123',
        email: 'athlete@university.edu',
        role: 'STUDENT',
        firstName: 'Johnny',
        lastName: 'Updated',
        aiOptIn: false,
        updatedAt: '2024-01-15T12:00:00Z',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => expectedResponse,
      });

      const result = await userService.updateProfile('usr_123', updateRequest, baseContext);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];

      expect(url).toContain('/profile/usr_123');
      expect(options.method).toBe('PUT');

      const body = JSON.parse(options.body);
      expect(body).toEqual(updateRequest);

      expect(result.firstName).toBe('Johnny');
      expect(result.aiOptIn).toBe(false);
    });

    it('should reject invalid email format in update', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid email format',
            details: { field: 'email' },
          },
        }),
      });

      await expect(
        userService.updateProfile('usr_123', { email: 'invalid-email' }, baseContext)
      ).rejects.toMatchObject({
        statusCode: 400,
      });
    });
  });

  describe('User Roles Flow', () => {
    it('should get user roles and permissions', async () => {
      const expectedRoles = {
        roles: [UserRole.STUDENT],
        permissions: [
          'view:own-profile',
          'edit:own-profile',
          'view:own-schedule',
          'view:own-compliance',
          'chat:ai-advisor',
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => expectedRoles,
      });

      const result = await userService.getRoles('usr_123', baseContext);

      expect(result.roles).toContain(UserRole.STUDENT);
      expect(result.permissions).toContain('view:own-profile');
    });

    it('should get admin roles with elevated permissions', async () => {
      const adminContext: RequestContext = {
        ...baseContext,
        userId: 'admin-123',
        role: UserRole.ADMIN,
      };

      const expectedRoles = {
        roles: [UserRole.ADMIN],
        permissions: [
          'view:all-profiles',
          'edit:all-profiles',
          'manage:users',
          'manage:compliance',
          'view:reports',
          'admin:system',
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => expectedRoles,
      });

      const result = await userService.getRoles('admin-123', adminContext);

      expect(result.roles).toContain(UserRole.ADMIN);
      expect(result.permissions).toContain('admin:system');
    });
  });

  describe('Clerk Sync Flow', () => {
    it('should sync user from Clerk webhook', async () => {
      const clerkSyncData = {
        clerkId: 'clerk_new123',
        email: 'newuser@university.edu',
        firstName: 'New',
        lastName: 'User',
        imageUrl: 'https://img.clerk.com/avatar123',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ success: true }),
      });

      // Clerk sync may not require context (webhook)
      const result = await userService.syncClerk(clerkSyncData);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];

      expect(url).toContain('/sync-clerk');
      expect(options.method).toBe('POST');
    });

    it('should handle Clerk sync for existing user (update)', async () => {
      const clerkSyncData = {
        clerkId: 'clerk_existing123',
        email: 'updated@university.edu',
        firstName: 'Updated',
        lastName: 'Name',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          success: true,
          action: 'updated',
          userId: 'usr_existing123',
        }),
      });

      const result = await userService.syncClerk(clerkSyncData);

      expect(result.success).toBe(true);
    });
  });

  describe('Retry and Resilience', () => {
    it('should retry on 500 error with exponential backoff', async () => {
      // First two calls fail with 500, third succeeds
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({ error: { message: 'Internal error' } }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({ error: { message: 'Internal error' } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({ id: 'usr_123', email: 'test@test.com' }),
        });

      const promise = userService.getProfile('usr_123', baseContext);

      // Fast-forward through retry delays
      await jest.advanceTimersByTimeAsync(1000); // First retry
      await jest.advanceTimersByTimeAsync(2000); // Second retry

      const result = await promise;

      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(result.id).toBe('usr_123');
    });

    it('should not retry on 4xx client errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          error: { message: 'Bad request' },
        }),
      });

      await expect(userService.getProfile('usr_123', baseContext)).rejects.toMatchObject({
        statusCode: 400,
      });

      // Should only call once, no retries
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should handle network timeout', async () => {
      mockFetch.mockImplementationOnce(() => new Promise(() => {})); // Never resolves

      const promise = userService.getProfile('usr_123', baseContext);

      // Fast-forward past timeout
      await jest.advanceTimersByTimeAsync(31000); // Default timeout is 30s

      await expect(promise).rejects.toThrow();
    });
  });

  describe('Context Header Propagation', () => {
    it('should propagate correlation ID through all requests', async () => {
      const customContext: RequestContext = {
        ...baseContext,
        correlationId: 'trace-abc-123-xyz',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ id: 'usr_123' }),
      });

      await userService.getProfile('usr_123', customContext);

      const [, options] = mockFetch.mock.calls[0];
      expect(options.headers['X-Correlation-Id']).toBe('trace-abc-123-xyz');
    });

    it('should include user role in request headers', async () => {
      const advisorContext: RequestContext = {
        ...baseContext,
        role: UserRole.ADVISOR,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ id: 'usr_123' }),
      });

      await userService.getProfile('usr_123', advisorContext);

      const [, options] = mockFetch.mock.calls[0];
      expect(options.headers['X-User-Role']).toBe('ADVISOR');
    });
  });
});
