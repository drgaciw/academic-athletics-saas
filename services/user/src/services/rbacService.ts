import { prisma, UserRole } from '@aah/database'
import { IRBACService, UserRolesResponse } from '../types'
import { AppError } from '../middleware/errorHandler'

// Define permissions for each role
const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  [UserRole.STUDENT_ATHLETE]: [
    'read:own_profile',
    'update:own_profile',
    'read:own_schedule',
    'read:own_compliance',
    'create:support_request',
    'read:own_conversations',
  ],
  [UserRole.ADMIN]: [
    'read:all_profiles',
    'update:all_profiles',
    'delete:profiles',
    'read:all_schedules',
    'update:all_schedules',
    'read:all_compliance',
    'update:compliance_rules',
    'read:all_support',
    'update:all_support',
    'read:all_conversations',
    'manage:users',
    'manage:roles',
  ],
  [UserRole.COACH]: [
    'read:team_profiles',
    'read:team_schedules',
    'read:team_compliance',
    'create:intervention',
    'read:team_analytics',
    'update:team_profiles',
  ],
  [UserRole.FACULTY]: [
    'read:student_profiles',
    'submit:progress_report',
    'read:assigned_students',
    'create:absence_notification',
  ],
  [UserRole.MENTOR]: [
    'read:mentee_profiles',
    'read:mentee_schedules',
    'create:mentoring_session',
    'read:mentee_compliance',
  ],
}

export class RBACService implements IRBACService {
  async getUserRoles(userId: string): Promise<UserRolesResponse | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          studentProfile: {
            select: {
              id: true,
              studentId: true,
              sport: true,
            },
          },
        },
      })

      if (!user) {
        return null
      }

      return {
        userId: user.id,
        role: user.role,
        permissions: this.getPermissionsForRole(user.role),
        studentProfile: user.studentProfile || undefined,
      }
    } catch (error) {
      console.error('Error fetching user roles:', error)
      throw new AppError(500, 'DATABASE_ERROR', 'Failed to fetch user roles')
    }
  }

  async checkPermission(userId: string, permission: string): Promise<boolean> {
    try {
      const userRoles = await this.getUserRoles(userId)

      if (!userRoles) {
        return false
      }

      return userRoles.permissions.includes(permission)
    } catch (error) {
      console.error('Error checking permission:', error)
      return false
    }
  }

  getPermissionsForRole(role: UserRole): string[] {
    return ROLE_PERMISSIONS[role] || []
  }

  async requirePermission(userId: string, permission: string): Promise<void> {
    const hasPermission = await this.checkPermission(userId, permission)

    if (!hasPermission) {
      throw new AppError(
        403,
        'INSUFFICIENT_PERMISSIONS',
        `Required permission: ${permission}`
      )
    }
  }

  async requireRole(userId: string, allowedRoles: UserRole[]): Promise<void> {
    const userRoles = await this.getUserRoles(userId)

    if (!userRoles || !allowedRoles.includes(userRoles.role)) {
      throw new AppError(
        403,
        'INSUFFICIENT_ROLE',
        'User does not have the required role for this operation'
      )
    }
  }
}

export const rbacService = new RBACService()
