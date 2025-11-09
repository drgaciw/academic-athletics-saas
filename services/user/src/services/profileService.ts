import { prisma } from '@aah/database'
import {
  IProfileService,
  UserProfileResponse,
  StudentProfileResponse,
  UpdateProfileInput,
  CreateStudentProfileInput,
} from '../types'
import { AppError } from '../middleware/errorHandler'

export class ProfileService implements IProfileService {
  async getUserProfile(userId: string): Promise<UserProfileResponse | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          studentProfile: true,
        },
      })

      if (!user) {
        return null
      }

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
      console.error('Error fetching user profile:', error)
      throw new AppError(500, 'DATABASE_ERROR', 'Failed to fetch user profile')
    }
  }

  async updateUserProfile(
    userId: string,
    data: UpdateProfileInput
  ): Promise<UserProfileResponse> {
    try {
      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { id: userId },
      })

      if (!existingUser) {
        throw new AppError(404, 'USER_NOT_FOUND', 'User not found')
      }

      // Check if email is being changed and is already taken
      if (data.email && data.email !== existingUser.email) {
        const emailExists = await prisma.user.findUnique({
          where: { email: data.email },
        })

        if (emailExists) {
          throw new AppError(409, 'EMAIL_CONFLICT', 'Email already in use')
        }
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          role: data.role,
        },
        include: {
          studentProfile: true,
        },
      })

      return {
        id: updatedUser.id,
        clerkId: updatedUser.clerkId,
        email: updatedUser.email,
        role: updatedUser.role,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
        studentProfile: updatedUser.studentProfile ? {
          id: updatedUser.studentProfile.id,
          userId: updatedUser.studentProfile.userId,
          studentId: updatedUser.studentProfile.studentId,
          sport: updatedUser.studentProfile.sport,
          gpa: updatedUser.studentProfile.gpa,
          creditHours: updatedUser.studentProfile.creditHours,
          eligibilityStatus: updatedUser.studentProfile.eligibilityStatus,
          createdAt: updatedUser.studentProfile.createdAt,
          updatedAt: updatedUser.studentProfile.updatedAt,
        } : undefined,
      }
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }
      console.error('Error updating user profile:', error)
      throw new AppError(500, 'DATABASE_ERROR', 'Failed to update user profile')
    }
  }

  async createStudentProfile(
    data: CreateStudentProfileInput
  ): Promise<StudentProfileResponse> {
    try {
      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: data.userId },
      })

      if (!user) {
        throw new AppError(404, 'USER_NOT_FOUND', 'User not found')
      }

      // Check if student profile already exists
      const existingProfile = await prisma.studentProfile.findUnique({
        where: { userId: data.userId },
      })

      if (existingProfile) {
        throw new AppError(409, 'PROFILE_EXISTS', 'Student profile already exists')
      }

      // Check if student ID is already taken
      const studentIdExists = await prisma.studentProfile.findUnique({
        where: { studentId: data.studentId },
      })

      if (studentIdExists) {
        throw new AppError(409, 'STUDENT_ID_CONFLICT', 'Student ID already in use')
      }

      const studentProfile = await prisma.studentProfile.create({
        data: {
          userId: data.userId,
          studentId: data.studentId,
          sport: data.sport,
        },
      })

      return {
        id: studentProfile.id,
        userId: studentProfile.userId,
        studentId: studentProfile.studentId,
        sport: studentProfile.sport,
        gpa: studentProfile.gpa,
        creditHours: studentProfile.creditHours,
        eligibilityStatus: studentProfile.eligibilityStatus,
        createdAt: studentProfile.createdAt,
        updatedAt: studentProfile.updatedAt,
      }
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }
      console.error('Error creating student profile:', error)
      throw new AppError(500, 'DATABASE_ERROR', 'Failed to create student profile')
    }
  }
}

export const profileService = new ProfileService()
