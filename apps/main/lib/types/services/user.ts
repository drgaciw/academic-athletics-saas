/**
 * User Service Types
 */

import { UserRole } from './common';

export interface UserProfile {
  id: string;
  clerkId: string;
  email: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
  aiOptIn: boolean;
  createdAt: string;
  updatedAt: string;
  studentProfile?: StudentProfile;
}

export interface StudentProfile {
  id: string;
  userId: string;
  studentId: string;
  sport: string;
  gpa?: number;
  creditHours: number;
  eligibilityStatus: string;
  athleticSchedule?: Record<string, any>;
}

export interface CreateUserRequest {
  clerkId: string;
  email: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  aiOptIn?: boolean;
}

export interface UserRolesResponse {
  roles: UserRole[];
  permissions: string[];
}

export interface ClerkSyncRequest {
  data: {
    id: string;
    email_addresses: Array<{ email_address: string }>;
    first_name?: string;
    last_name?: string;
  };
  type: 'user.created' | 'user.updated' | 'user.deleted';
}
