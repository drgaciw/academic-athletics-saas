/**
 * Profile Service Tests
 */

import { describe, it, expect, beforeEach, vi, Mock } from 'vitest'
import { ProfileService } from '../../services/profileService'
import { prisma } from '@aah/database'

// Mock Prisma client
vi.mock('@aah/database', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    studentProfile: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}))

describe('ProfileService', () => {
  let profileService: ProfileService

  beforeEach(() => {
    profileService = new ProfileService()
    vi.clearAllMocks()
  })

  describe('getUserProfile', () => {
    it('should return user profile when user exists', async () => {
      const mockUser = {
        id: 'user-123',
        clerkId: 'clerk-123',
        email: 'test@example.com',
        role: 'STUDENT_ATHLETE',
        firstName: 'John',
        lastName: 'Doe',
        createdAt: new Date(),
        updatedAt: new Date(),
        studentProfile: null,
      }

      ;(prisma.user.findUnique as Mock).mockResolvedValue(mockUser)

      const result = await profileService.getUserProfile('user-123')

      expect(result).toBeDefined()
      expect(result?.id).toBe('user-123')
      expect(result?.email).toBe('test@example.com')
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        include: { studentProfile: true },
      })
    })

    it('should return null when user does not exist', async () => {
      ;(prisma.user.findUnique as Mock).mockResolvedValue(null)

      const result = await profileService.getUserProfile('nonexistent')

      expect(result).toBeNull()
    })
  })

  describe('updateUserProfile', () => {
    it('should update user profile successfully', async () => {
      const mockUser = {
        id: 'user-123',
        clerkId: 'clerk-123',
        email: 'test@example.com',
        role: 'STUDENT_ATHLETE',
        firstName: 'John',
        lastName: 'Doe',
        createdAt: new Date(),
        updatedAt: new Date(),
        studentProfile: null,
      }

      ;(prisma.user.findUnique as Mock).mockResolvedValue(mockUser)
      ;(prisma.user.update as Mock).mockResolvedValue({
        ...mockUser,
        firstName: 'Jane',
      })

      const result = await profileService.updateUserProfile('user-123', {
        firstName: 'Jane',
      })

      expect(result.firstName).toBe('Jane')
      expect(prisma.user.update).toHaveBeenCalled()
    })

    it('should throw error when user not found', async () => {
      ;(prisma.user.findUnique as Mock).mockResolvedValue(null)

      await expect(
        profileService.updateUserProfile('nonexistent', { firstName: 'Test' })
      ).rejects.toThrow('User not found')
    })
  })
})
