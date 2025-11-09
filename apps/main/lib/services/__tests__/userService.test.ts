/**
 * UserService Unit Tests
 * Tests for the User Service client
 */

import { userService } from '../userService';
import { ServiceClient } from '../serviceClient';
import { RequestContext, UserRole } from '../../types/services/common';

// Mock ServiceClient
jest.mock('../serviceClient');

describe('UserService', () => {
  const mockContext: RequestContext = {
    userId: 'user-123',
    clerkId: 'clerk-123',
    role: UserRole.ADMIN,
    correlationId: 'corr-123',
    timestamp: new Date(),
  };

  let mockPost: jest.Mock;
  let mockGet: jest.Mock;
  let mockPut: jest.Mock;
  let mockHealthCheck: jest.Mock;

  beforeEach(() => {
    mockPost = jest.fn();
    mockGet = jest.fn();
    mockPut = jest.fn();
    mockHealthCheck = jest.fn();

    (ServiceClient as jest.Mock).mockImplementation(() => ({
      post: mockPost,
      get: mockGet,
      put: mockPut,
      healthCheck: mockHealthCheck,
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    it('should create new user account', async () => {
      const createRequest = {
        clerkId: 'clerk-456',
        email: 'student@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.STUDENT,
      };

      const mockProfile = {
        id: 'user-456',
        ...createRequest,
        createdAt: new Date().toISOString(),
      };

      mockPost.mockResolvedValueOnce(mockProfile);

      const result = await userService.createUser(createRequest, mockContext);

      expect(result).toEqual(mockProfile);
      expect(mockPost).toHaveBeenCalledWith('/register', createRequest, mockContext);
    });

    it('should handle duplicate user creation', async () => {
      const createRequest = {
        clerkId: 'clerk-456',
        email: 'existing@example.com',
        firstName: 'Jane',
        lastName: 'Doe',
        role: UserRole.STUDENT,
      };

      mockPost.mockRejectedValueOnce(new Error('User already exists'));

      await expect(
        userService.createUser(createRequest, mockContext)
      ).rejects.toThrow('User already exists');
    });
  });

  describe('getProfile', () => {
    it('should retrieve user profile', async () => {
      const userId = 'user-123';
      const mockProfile = {
        id: userId,
        clerkId: 'clerk-123',
        email: 'student@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.STUDENT,
        major: 'Computer Science',
        year: 'Junior',
      };

      mockGet.mockResolvedValueOnce(mockProfile);

      const result = await userService.getProfile(userId, mockContext);

      expect(result).toEqual(mockProfile);
      expect(mockGet).toHaveBeenCalledWith(`/profile/${userId}`, mockContext);
    });

    it('should handle missing user', async () => {
      const userId = 'nonexistent-123';
      mockGet.mockRejectedValueOnce(new Error('User not found'));

      await expect(
        userService.getProfile(userId, mockContext)
      ).rejects.toThrow('User not found');
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      const userId = 'user-123';
      const updateRequest = {
        major: 'Computer Engineering',
        year: 'Senior',
        phone: '555-1234',
      };

      const mockUpdatedProfile = {
        id: userId,
        clerkId: 'clerk-123',
        email: 'student@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.STUDENT,
        ...updateRequest,
        updatedAt: new Date().toISOString(),
      };

      mockPut.mockResolvedValueOnce(mockUpdatedProfile);

      const result = await userService.updateProfile(userId, updateRequest, mockContext);

      expect(result).toEqual(mockUpdatedProfile);
      expect(mockPut).toHaveBeenCalledWith(`/profile/${userId}`, updateRequest, mockContext);
    });

    it('should handle invalid update data', async () => {
      const userId = 'user-123';
      const updateRequest = {
        invalidField: 'value',
      };

      mockPut.mockRejectedValueOnce(new Error('Invalid field'));

      await expect(
        userService.updateProfile(userId, updateRequest, mockContext)
      ).rejects.toThrow('Invalid field');
    });
  });

  describe('getRoles', () => {
    it('should retrieve user roles and permissions', async () => {
      const userId = 'user-123';
      const mockRoles = {
        userId,
        roles: [UserRole.STUDENT],
        permissions: [
          'view_schedule',
          'book_tutoring',
          'view_grades',
        ],
      };

      mockGet.mockResolvedValueOnce(mockRoles);

      const result = await userService.getRoles(userId, mockContext);

      expect(result).toEqual(mockRoles);
      expect(result.roles).toContain(UserRole.STUDENT);
      expect(mockGet).toHaveBeenCalledWith(`/roles/${userId}`, mockContext);
    });

    it('should handle multiple roles', async () => {
      const userId = 'user-456';
      const mockRoles = {
        userId,
        roles: [UserRole.STUDENT, UserRole.ADVISOR],
        permissions: [
          'view_schedule',
          'book_tutoring',
          'view_all_students',
          'create_reports',
        ],
      };

      mockGet.mockResolvedValueOnce(mockRoles);

      const result = await userService.getRoles(userId, mockContext);

      expect(result.roles).toHaveLength(2);
      expect(result.roles).toContain(UserRole.STUDENT);
      expect(result.roles).toContain(UserRole.ADVISOR);
    });
  });

  describe('syncClerkUser', () => {
    it('should sync Clerk user webhook', async () => {
      const webhookData = {
        id: 'clerk-789',
        email_addresses: [{ email_address: 'newuser@example.com' }],
        first_name: 'Alice',
        last_name: 'Johnson',
      };

      mockPost.mockResolvedValueOnce({ success: true });

      const result = await userService.syncClerkUser(webhookData);

      expect(result.success).toBe(true);
      expect(mockPost).toHaveBeenCalledWith('/sync-clerk', webhookData);
    });

    it('should handle sync failures', async () => {
      const webhookData = {
        id: 'clerk-789',
        invalid: 'data',
      };

      mockPost.mockRejectedValueOnce(new Error('Sync failed'));

      await expect(
        userService.syncClerkUser(webhookData)
      ).rejects.toThrow('Sync failed');
    });
  });

  describe('health', () => {
    it('should check service health', async () => {
      mockHealthCheck.mockResolvedValueOnce({ status: 'healthy' });

      const result = await userService.health();

      expect(result).toEqual({ status: 'healthy' });
      expect(mockHealthCheck).toHaveBeenCalled();
    });

    it('should detect unhealthy service', async () => {
      mockHealthCheck.mockResolvedValueOnce({ status: 'unhealthy' });

      const result = await userService.health();

      expect(result.status).toBe('unhealthy');
    });
  });
});
