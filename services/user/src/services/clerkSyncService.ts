import { prisma, UserRole } from '@aah/database'
import { IClerkSyncService, UserProfileResponse, SyncClerkUserInput } from '../types'
import { AppError } from '../middleware/errorHandler'

export class ClerkSyncService implements IClerkSyncService {
  async syncUser(clerkData: SyncClerkUserInput): Promise<UserProfileResponse> {
    try {
      const { data } = clerkData
      const primaryEmail = data.email_addresses[0]?.email_address

      if (!primaryEmail) {
        throw new AppError(400, 'INVALID_CLERK_DATA', 'No email address found')
      }

      // Determine role from public metadata or default to STUDENT_ATHLETE
      const role = (data.public_metadata?.role as UserRole) || UserRole.STUDENT_ATHLETE

      // Upsert user
      const user = await prisma.user.upsert({
        where: { clerkId: data.id },
        create: {
          clerkId: data.id,
          email: primaryEmail,
          firstName: data.first_name,
          lastName: data.last_name,
          role,
        },
        update: {
          email: primaryEmail,
          firstName: data.first_name,
          lastName: data.last_name,
          role,
        },
        include: {
          studentProfile: true,
        },
      })

      return {
        id: user.id,
        clerkId: user.clerkId,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        studentProfile: user.studentProfile ? {
          id: user.studentProfile.id,
          userId: user.studentProfile.userId,
          studentId: user.studentProfile.studentId,
          sport: user.studentProfile.sport,
          gpa: user.studentProfile.gpa,
          creditHours: user.studentProfile.creditHours,
          eligibilityStatus: user.studentProfile.eligibilityStatus,
          createdAt: user.studentProfile.createdAt,
          updatedAt: user.studentProfile.updatedAt,
        } : undefined,
      }
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }
      console.error('Error syncing Clerk user:', error)
      throw new AppError(500, 'SYNC_ERROR', 'Failed to sync user from Clerk')
    }
  }

  async handleWebhook(webhookData: any): Promise<void> {
    try {
      const { type, data } = webhookData

      switch (type) {
        case 'user.created':
        case 'user.updated':
          await this.syncUser({ type, data })
          break

        case 'user.deleted':
          await this.deleteUser(data.id)
          break

        default:
          console.log(`Unhandled webhook type: ${type}`)
      }
    } catch (error) {
      console.error('Error handling Clerk webhook:', error)
      throw new AppError(500, 'WEBHOOK_ERROR', 'Failed to process webhook')
    }
  }

  private async deleteUser(clerkId: string): Promise<void> {
    try {
      // Find user by clerk ID
      const user = await prisma.user.findUnique({
        where: { clerkId },
        include: {
          studentProfile: true,
        },
      })

      if (!user) {
        console.log(`User not found for Clerk ID: ${clerkId}`)
        return
      }

      // Delete student profile if exists
      if (user.studentProfile) {
        await prisma.studentProfile.delete({
          where: { id: user.studentProfile.id },
        })
      }

      // Delete user
      await prisma.user.delete({
        where: { id: user.id },
      })

      console.log(`User deleted: ${user.id}`)
    } catch (error) {
      console.error('Error deleting user:', error)
      throw new AppError(500, 'DELETE_ERROR', 'Failed to delete user')
    }
  }
}

export const clerkSyncService = new ClerkSyncService()
