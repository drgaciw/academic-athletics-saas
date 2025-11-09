import { z } from 'zod'
import { UserRole } from '@aah/database'

// Validation Schemas
export const updateProfileSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  email: z.string().email().optional(),
  role: z.nativeEnum(UserRole).optional(),
})

export const syncClerkUserSchema = z.object({
  type: z.string(),
  data: z.object({
    id: z.string(),
    email_addresses: z.array(z.object({
      email_address: z.string(),
      id: z.string(),
    })),
    first_name: z.string().nullable(),
    last_name: z.string().nullable(),
    public_metadata: z.record(z.any()).optional(),
  }),
})

export const createStudentProfileSchema = z.object({
  userId: z.string(),
  studentId: z.string(),
  sport: z.string().min(1),
})

// Response Types
export interface UserProfileResponse {
  id: string
  clerkId: string
  email: string
  role: UserRole
  firstName: string | null
  lastName: string | null
  createdAt: Date
  updatedAt: Date
  studentProfile?: StudentProfileResponse
}

export interface StudentProfileResponse {
  id: string
  userId: string
  studentId: string
  sport: string
  gpa: number | null
  creditHours: number
  eligibilityStatus: string
  createdAt: Date
  updatedAt: Date
}

export interface UserRolesResponse {
  userId: string
  role: UserRole
  permissions: string[]
  studentProfile?: {
    id: string
    studentId: string
    sport: string
  }
}

export interface ErrorResponse {
  error: {
    code: string
    message: string
    details?: any
    timestamp: string
    requestId: string
  }
}

// Type inference from schemas
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
export type SyncClerkUserInput = z.infer<typeof syncClerkUserSchema>
export type CreateStudentProfileInput = z.infer<typeof createStudentProfileSchema>

// Service interfaces
export interface IProfileService {
  getUserProfile(userId: string): Promise<UserProfileResponse | null>
  updateUserProfile(userId: string, data: UpdateProfileInput): Promise<UserProfileResponse>
  createStudentProfile(data: CreateStudentProfileInput): Promise<StudentProfileResponse>
}

export interface IRBACService {
  getUserRoles(userId: string): Promise<UserRolesResponse | null>
  checkPermission(userId: string, permission: string): Promise<boolean>
  getPermissionsForRole(role: UserRole): string[]
}

export interface IClerkSyncService {
  syncUser(clerkData: SyncClerkUserInput): Promise<UserProfileResponse>
  handleWebhook(webhookData: any): Promise<void>
}
