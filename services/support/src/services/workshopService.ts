import { prisma } from '@aah/database'
import {
  IWorkshopService,
  Workshop,
  WorkshopRegistration,
  WorkshopRegistrationInput,
} from '../types'
import { AppError } from '../middleware/errorHandler'

export class WorkshopService implements IWorkshopService {
  async registerForWorkshop(data: WorkshopRegistrationInput): Promise<WorkshopRegistration> {
    try {
      // Check if student exists
      const student = await prisma.studentProfile.findUnique({
        where: { id: data.studentId },
      })

      if (!student) {
        throw new AppError(404, 'STUDENT_NOT_FOUND', 'Student not found')
      }

      // Mock workshop data - in production, fetch from database
      const workshop = await this.getWorkshopById(data.workshopId)

      if (!workshop) {
        throw new AppError(404, 'WORKSHOP_NOT_FOUND', 'Workshop not found')
      }

      // Check if workshop is full
      if (workshop.available <= 0) {
        throw new AppError(
          409,
          'WORKSHOP_FULL',
          'Workshop has reached maximum capacity'
        )
      }

      // Check if student is already registered
      const existingRegistrations = await this.getStudentRegistrations(data.studentId)
      const alreadyRegistered = existingRegistrations.some(
        (reg) => reg.workshopId === data.workshopId && reg.status === 'REGISTERED'
      )

      if (alreadyRegistered) {
        throw new AppError(
          409,
          'ALREADY_REGISTERED',
          'Student is already registered for this workshop'
        )
      }

      // Create registration
      const registration: WorkshopRegistration = {
        id: crypto.randomUUID(),
        studentId: data.studentId,
        workshopId: data.workshopId,
        status: 'REGISTERED',
        registeredAt: new Date(),
        updatedAt: new Date(),
        workshop: workshop,
      }

      return registration
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }
      console.error('Error registering for workshop:', error)
      throw new AppError(500, 'DATABASE_ERROR', 'Failed to register for workshop')
    }
  }

  async cancelRegistration(
    registrationId: string,
    studentId: string
  ): Promise<WorkshopRegistration> {
    try {
      // Mock implementation - verify ownership and cancel
      const registration: WorkshopRegistration = {
        id: registrationId,
        studentId: studentId,
        workshopId: 'workshop-001',
        status: 'CANCELLED',
        registeredAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        updatedAt: new Date(),
      }

      return registration
    } catch (error) {
      console.error('Error cancelling workshop registration:', error)
      throw new AppError(500, 'DATABASE_ERROR', 'Failed to cancel workshop registration')
    }
  }

  async getAvailableWorkshops(): Promise<Workshop[]> {
    try {
      // Mock implementation - return upcoming workshops
      const now = new Date()
      const workshops: Workshop[] = [
        {
          id: 'workshop-001',
          title: 'Time Management for Student Athletes',
          description: 'Learn effective strategies to balance academics and athletics',
          category: 'Academic Success',
          scheduledAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          duration: 90,
          location: 'Athletic Center - Room 202',
          capacity: 30,
          registered: 18,
          available: 12,
          instructor: 'Dr. Sarah Martinez',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'workshop-002',
          title: 'Financial Literacy for Athletes',
          description: 'Understanding budgeting, credit, and financial planning',
          category: 'Life Skills',
          scheduledAt: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
          duration: 120,
          location: 'Student Union - Conference Room A',
          capacity: 25,
          registered: 15,
          available: 10,
          instructor: 'John Davis, CPA',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'workshop-003',
          title: 'Resume Building and Interview Skills',
          description: 'Prepare for your career beyond athletics',
          category: 'Career Development',
          scheduledAt: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
          duration: 120,
          location: 'Career Services Center',
          capacity: 20,
          registered: 8,
          available: 12,
          instructor: 'Lisa Chen, Career Counselor',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'workshop-004',
          title: 'Stress Management and Mental Wellness',
          description: 'Techniques for managing stress and maintaining mental health',
          category: 'Wellness',
          scheduledAt: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
          duration: 60,
          location: 'Wellness Center',
          capacity: 15,
          registered: 12,
          available: 3,
          instructor: 'Dr. Michael Thompson',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      return workshops.filter((w) => w.available > 0)
    } catch (error) {
      console.error('Error getting available workshops:', error)
      throw new AppError(500, 'DATABASE_ERROR', 'Failed to retrieve available workshops')
    }
  }

  async getStudentRegistrations(studentId: string): Promise<WorkshopRegistration[]> {
    try {
      // Check if student exists
      const student = await prisma.studentProfile.findUnique({
        where: { id: studentId },
      })

      if (!student) {
        throw new AppError(404, 'STUDENT_NOT_FOUND', 'Student not found')
      }

      // Mock implementation
      const registrations: WorkshopRegistration[] = [
        {
          id: crypto.randomUUID(),
          studentId: studentId,
          workshopId: 'workshop-001',
          status: 'REGISTERED',
          registeredAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      return registrations
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }
      console.error('Error getting student registrations:', error)
      throw new AppError(500, 'DATABASE_ERROR', 'Failed to retrieve student registrations')
    }
  }

  private async getWorkshopById(workshopId: string): Promise<Workshop | null> {
    const workshops = await this.getAvailableWorkshops()
    return workshops.find((w) => w.id === workshopId) || null
  }
}

export const workshopService = new WorkshopService()
