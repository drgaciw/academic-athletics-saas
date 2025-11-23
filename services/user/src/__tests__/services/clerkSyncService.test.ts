import { ClerkSyncService } from '../../services/clerkSyncService'
import { prisma, UserRole } from '@aah/database'
import { AppError } from '../../middleware/errorHandler'

// Mock prisma
jest.mock('@aah/database', () => ({
  prisma: {
    user: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    studentProfile: {
      delete: jest.fn(),
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

describe('ClerkSyncService', () => {
  let service: ClerkSyncService

  beforeEach(() => {
    service = new ClerkSyncService()
    jest.clearAllMocks()
  })

  describe('syncUser', () => {
    const mockClerkData = {
      data: {
        id: 'clerk_123',
        email_addresses: [{ email_address: 'test@example.com' }],
        first_name: 'Test',
        last_name: 'User',
        public_metadata: { role: 'STUDENT_ATHLETE' },
      },
      type: 'user.created',
    }

    it('should sync user successfully', async () => {
      const mockUser = {
        id: 'user_123',
        clerkId: 'clerk_123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.STUDENT_ATHLETE,
        createdAt: new Date(),
        updatedAt: new Date(),
        studentProfile: {
          id: 'profile_123',
          userId: 'user_123',
          studentId: 'S12345',
          sport: 'Basketball',
          gpa: 3.5,
          creditHours: 60,
          eligibilityStatus: 'ELIGIBLE',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      }

      ;(prisma.user.upsert as jest.Mock).mockResolvedValue(mockUser)

      const result = await service.syncUser(mockClerkData as any)

      expect(prisma.user.upsert).toHaveBeenCalledWith({
        where: { clerkId: 'clerk_123' },
        create: expect.objectContaining({
          clerkId: 'clerk_123',
          email: 'test@example.com',
        }),
        update: expect.objectContaining({
          email: 'test@example.com',
        }),
        include: { studentProfile: true },
      })

      expect(result).toEqual({
        id: mockUser.id,
        clerkId: mockUser.clerkId,
        email: mockUser.email,
        role: mockUser.role,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
        studentProfile: expect.objectContaining({
          id: mockUser.studentProfile.id,
        }),
      })
    })

    it('should throw error if no email address found', async () => {
      const invalidData = {
        data: {
          ...mockClerkData.data,
          email_addresses: [],
        },
      }

      await expect(service.syncUser(invalidData as any)).rejects.toThrow(
        new AppError(400, 'INVALID_CLERK_DATA', 'No email address found')
      )
    })

    it('should default to STUDENT_ATHLETE role if not provided', async () => {
      const dataWithoutRole = {
        data: {
          ...mockClerkData.data,
          public_metadata: {},
        },
      }

      const mockUser = {
        id: 'user_123',
        role: UserRole.STUDENT_ATHLETE,
        email: 'test@example.com',
      }
      ;(prisma.user.upsert as jest.Mock).mockResolvedValue(mockUser)

      await service.syncUser(dataWithoutRole as any)

      expect(prisma.user.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            role: UserRole.STUDENT_ATHLETE,
          }),
        })
      )
    })

    it('should handle database errors', async () => {
      ;(prisma.user.upsert as jest.Mock).mockRejectedValue(new Error('DB Error'))

      await expect(service.syncUser(mockClerkData as any)).rejects.toThrow(
        new AppError(500, 'SYNC_ERROR', 'Failed to sync user from Clerk')
      )
    })
  })

  describe('handleWebhook', () => {
    it('should handle user.created event', async () => {
      const spy = jest.spyOn(service, 'syncUser').mockResolvedValue({} as any)
      const webhookData = { type: 'user.created', data: {} }

      await service.handleWebhook(webhookData)

      expect(spy).toHaveBeenCalledWith(webhookData)
    })

    it('should handle user.updated event', async () => {
      const spy = jest.spyOn(service, 'syncUser').mockResolvedValue({} as any)
      const webhookData = { type: 'user.updated', data: {} }

      await service.handleWebhook(webhookData)

      expect(spy).toHaveBeenCalledWith(webhookData)
    })

    it('should handle user.deleted event', async () => {
      const mockUser = { id: 'user_123', studentProfile: { id: 'profile_123' } }
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
      ;(prisma.studentProfile.delete as jest.Mock).mockResolvedValue({})
      ;(prisma.user.delete as jest.Mock).mockResolvedValue({})

      const webhookData = { type: 'user.deleted', data: { id: 'clerk_123' } }

      await service.handleWebhook(webhookData)

      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { clerkId: 'clerk_123' }, include: { studentProfile: true } })
      expect(prisma.studentProfile.delete).toHaveBeenCalledWith({ where: { id: 'profile_123' } })
      expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 'user_123' } })
    })

    it('should ignore unknown events', async () => {
      const spySync = jest.spyOn(service, 'syncUser')
      const webhookData = { type: 'unknown.event', data: {} }

      await service.handleWebhook(webhookData)

      expect(spySync).not.toHaveBeenCalled()
    })

    it('should handle errors in webhook processing', async () => {
      jest.spyOn(service, 'syncUser').mockRejectedValue(new Error('Sync failed'))
      const webhookData = { type: 'user.created', data: {} }

      await expect(service.handleWebhook(webhookData)).rejects.toThrow(
        new AppError(500, 'WEBHOOK_ERROR', 'Failed to process webhook')
      )
    })
  })

  describe('deleteUser (private)', () => {
    it('should handle user not found during deletion', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)
      
      const webhookData = { type: 'user.deleted', data: { id: 'clerk_123' } }
      await service.handleWebhook(webhookData)
      
      expect(prisma.user.findUnique).toHaveBeenCalled()
      expect(prisma.user.delete).not.toHaveBeenCalled()
    })

    it('should handle deletion errors', async () => {
       ;(prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('DB Error'))
       
       const webhookData = { type: 'user.deleted', data: { id: 'clerk_123' } }
       
       await expect(service.handleWebhook(webhookData)).rejects.toThrow(
         new AppError(500, 'WEBHOOK_ERROR', 'Failed to process webhook')
       )
    })
  })
})