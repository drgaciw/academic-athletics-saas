import { RBACService } from '../../services/rbacService'
import { prisma, UserRole } from '@aah/database'
import { AppError } from '../../middleware/errorHandler'

// Mock prisma
jest.mock('@aah/database', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
  UserRole: {
    STUDENT_ATHLETE: 'STUDENT_ATHLETE',
    ADMIN: 'ADMIN',
    COACH: 'COACH',
    FACULTY: 'FACULTY',
    MENTOR: 'MENTOR',
  },
}))

describe('RBACService', () => {
  let service: RBACService

  beforeEach(() => {
    service = new RBACService()
    jest.clearAllMocks()
  })

  describe('getUserRoles', () => {
    it('should return user roles and permissions', async () => {
      const mockUser = {
        id: 'user_123',
        role: UserRole.STUDENT_ATHLETE,
        studentProfile: {
          id: 'profile_123',
          studentId: 'S12345',
          sport: 'Basketball',
        },
      }

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)

      const result = await service.getUserRoles('user_123')

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user_123' },
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

      expect(result).toEqual({
        userId: 'user_123',
        role: UserRole.STUDENT_ATHLETE,
        permissions: expect.arrayContaining(['read:own_profile']),
        studentProfile: mockUser.studentProfile,
      })
    })

    it('should return null if user not found', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

      const result = await service.getUserRoles('non_existent')

      expect(result).toBeNull()
    })

    it('should handle database errors', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('DB Error'))

      await expect(service.getUserRoles('user_123')).rejects.toThrow(
        new AppError(500, 'DATABASE_ERROR', 'Failed to fetch user roles')
      )
    })
  })

  describe('checkPermission', () => {
    it('should return true if user has permission', async () => {
      const mockUser = {
        id: 'user_123',
        role: UserRole.STUDENT_ATHLETE,
      }
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)

      const result = await service.checkPermission('user_123', 'read:own_profile')

      expect(result).toBe(true)
    })

    it('should return false if user does not have permission', async () => {
      const mockUser = {
        id: 'user_123',
        role: UserRole.STUDENT_ATHLETE,
      }
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)

      const result = await service.checkPermission('user_123', 'delete:profiles')

      expect(result).toBe(false)
    })

    it('should return false if user not found', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

      const result = await service.checkPermission('non_existent', 'read:own_profile')

      expect(result).toBe(false)
    })

    it('should return false on error', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('DB Error'))

      const result = await service.checkPermission('user_123', 'read:own_profile')

      expect(result).toBe(false)
    })
  })

  describe('requirePermission', () => {
    it('should resolve if user has permission', async () => {
      jest.spyOn(service, 'checkPermission').mockResolvedValue(true)

      await expect(service.requirePermission('user_123', 'read:own_profile')).resolves.not.toThrow()
    })

    it('should throw AppError if user does not have permission', async () => {
      jest.spyOn(service, 'checkPermission').mockResolvedValue(false)

      await expect(service.requirePermission('user_123', 'delete:profiles')).rejects.toThrow(
        new AppError(403, 'INSUFFICIENT_PERMISSIONS', 'Required permission: delete:profiles')
      )
    })
  })

  describe('requireRole', () => {
    it('should resolve if user has allowed role', async () => {
      const mockUserRoles = {
        userId: 'user_123',
        role: UserRole.ADMIN,
        permissions: [],
      }
      jest.spyOn(service, 'getUserRoles').mockResolvedValue(mockUserRoles as any)

      await expect(service.requireRole('user_123', [UserRole.ADMIN])).resolves.not.toThrow()
    })

    it('should throw AppError if user does not have allowed role', async () => {
      const mockUserRoles = {
        userId: 'user_123',
        role: UserRole.STUDENT_ATHLETE,
        permissions: [],
      }
      jest.spyOn(service, 'getUserRoles').mockResolvedValue(mockUserRoles as any)

      await expect(service.requireRole('user_123', [UserRole.ADMIN])).rejects.toThrow(
        new AppError(403, 'INSUFFICIENT_ROLE', 'User does not have the required role for this operation')
      )
    })

    it('should throw AppError if user roles not found', async () => {
      jest.spyOn(service, 'getUserRoles').mockResolvedValue(null)

      await expect(service.requireRole('user_123', [UserRole.ADMIN])).rejects.toThrow(
        new AppError(403, 'INSUFFICIENT_ROLE', 'User does not have the required role for this operation')
      )
    })
  })

  describe('getPermissionsForRole', () => {
    it('should return permissions for role', () => {
      const permissions = service.getPermissionsForRole(UserRole.STUDENT_ATHLETE)
      expect(permissions).toContain('read:own_profile')
    })

    it('should return empty array for unknown role', () => {
      const permissions = service.getPermissionsForRole('UNKNOWN_ROLE' as any)
      expect(permissions).toEqual([])
    })
  })
})