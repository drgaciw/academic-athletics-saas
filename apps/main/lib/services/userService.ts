/**
 * User Service Client
 * Type-safe client for User Service endpoints
 */

import { ServiceClient, getServiceUrl } from './serviceClient';
import {
  UserProfile,
  CreateUserRequest,
  UpdateUserRequest,
  UserRolesResponse,
  RequestContext,
} from '../types/services';

class UserServiceClient {
  private client: ServiceClient;

  constructor() {
    this.client = new ServiceClient('user', {
      baseUrl: getServiceUrl('user'),
      timeout: 10000,
    });
  }

  /**
   * Create new user account
   */
  async createUser(
    data: CreateUserRequest,
    context: RequestContext
  ): Promise<UserProfile> {
    return this.client.post<UserProfile>('/register', data, context);
  }

  /**
   * Get user profile
   */
  async getProfile(userId: string, context: RequestContext): Promise<UserProfile> {
    return this.client.get<UserProfile>(`/profile/${userId}`, context);
  }

  /**
   * Update user profile
   */
  async updateProfile(
    userId: string,
    data: UpdateUserRequest,
    context: RequestContext
  ): Promise<UserProfile> {
    return this.client.put<UserProfile>(`/profile/${userId}`, data, context);
  }

  /**
   * Get user roles and permissions
   */
  async getRoles(
    userId: string,
    context: RequestContext
  ): Promise<UserRolesResponse> {
    return this.client.get<UserRolesResponse>(`/roles/${userId}`, context);
  }

  /**
   * Sync Clerk user webhook
   */
  async syncClerkUser(data: any): Promise<{ success: boolean }> {
    return this.client.post<{ success: boolean }>('/sync-clerk', data);
  }

  /**
   * Health check
   */
  async health() {
    return this.client.healthCheck();
  }
}

export const userService = new UserServiceClient();
