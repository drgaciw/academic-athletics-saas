import { prisma } from '@aah/database'
import {
  ITutoringService,
  TutoringSession,
  TutorAvailability,
  BookTutoringInput,
  TutoringAvailabilityInput,
} from '../types'
import { AppError } from '../middleware/errorHandler'
import { availabilityEngine } from './availabilityEngine'

export class TutoringService implements ITutoringService {
  async bookSession(data: BookTutoringInput): Promise<TutoringSession> {
    try {
      const startTime = new Date(data.startTime)
      const endTime = new Date(data.endTime)

      // Validate times
      if (startTime >= endTime) {
        throw new AppError(
          400,
          'INVALID_TIME_RANGE',
          'End time must be after start time'
        )
      }

      // Check if student exists
      const student = await prisma.studentProfile.findUnique({
        where: { id: data.studentId },
      })

      if (!student) {
        throw new AppError(404, 'STUDENT_NOT_FOUND', 'Student not found')
      }

      // Check for conflicts
      const hasConflict = await availabilityEngine.checkConflicts(
        data.studentId,
        startTime,
        endTime
      )

      if (hasConflict) {
        throw new AppError(
          409,
          'SCHEDULING_CONFLICT',
          'Student has a scheduling conflict at this time'
        )
      }

      // Check tutor conflicts
      const tutorConflict = await availabilityEngine.checkConflicts(
        data.tutorId,
        startTime,
        endTime
      )

      if (tutorConflict) {
        throw new AppError(
          409,
          'TUTOR_UNAVAILABLE',
          'Tutor is not available at this time'
        )
      }

      // Create tutoring session (mock implementation - adjust based on your schema)
      // For now, we'll simulate the session creation
      const session: TutoringSession = {
        id: crypto.randomUUID(),
        studentId: data.studentId,
        tutorId: data.tutorId,
        subject: data.subject,
        startTime: startTime,
        endTime: endTime,
        status: 'SCHEDULED',
        notes: data.notes,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      return session
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }
      console.error('Error booking tutoring session:', error)
      throw new AppError(500, 'DATABASE_ERROR', 'Failed to book tutoring session')
    }
  }

  async getTutorAvailability(
    params: TutoringAvailabilityInput
  ): Promise<TutorAvailability[]> {
    try {
      const startDate = new Date(params.startDate)
      const endDate = new Date(params.endDate)

      // Mock implementation - in production, this would query actual tutor availability
      const mockTutors: TutorAvailability[] = [
        {
          tutorId: 'tutor-001',
          tutorName: 'Dr. Smith',
          subject: params.subject || 'Mathematics',
          availableSlots: await this.generateAvailableSlots(startDate, endDate),
          totalSessions: 45,
          averageRating: 4.8,
        },
        {
          tutorId: 'tutor-002',
          tutorName: 'Prof. Johnson',
          subject: params.subject || 'Physics',
          availableSlots: await this.generateAvailableSlots(startDate, endDate),
          totalSessions: 38,
          averageRating: 4.6,
        },
      ]

      return params.tutorId
        ? mockTutors.filter((t) => t.tutorId === params.tutorId)
        : mockTutors
    } catch (error) {
      console.error('Error getting tutor availability:', error)
      throw new AppError(
        500,
        'DATABASE_ERROR',
        'Failed to retrieve tutor availability'
      )
    }
  }

  async cancelSession(sessionId: string, studentId: string): Promise<TutoringSession> {
    try {
      // Mock implementation - verify student owns the session and cancel
      const session: TutoringSession = {
        id: sessionId,
        studentId: studentId,
        tutorId: 'tutor-001',
        subject: 'Mathematics',
        startTime: new Date(),
        endTime: new Date(),
        status: 'CANCELLED',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      return session
    } catch (error) {
      console.error('Error cancelling tutoring session:', error)
      throw new AppError(500, 'DATABASE_ERROR', 'Failed to cancel tutoring session')
    }
  }

  async getStudentSessions(studentId: string): Promise<TutoringSession[]> {
    try {
      // Mock implementation
      const sessions: TutoringSession[] = [
        {
          id: crypto.randomUUID(),
          studentId: studentId,
          tutorId: 'tutor-001',
          subject: 'Mathematics',
          startTime: new Date('2025-11-10T14:00:00'),
          endTime: new Date('2025-11-10T15:00:00'),
          status: 'SCHEDULED',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      return sessions
    } catch (error) {
      console.error('Error getting student sessions:', error)
      throw new AppError(500, 'DATABASE_ERROR', 'Failed to retrieve student sessions')
    }
  }

  private async generateAvailableSlots(startDate: Date, endDate: Date) {
    const slots = []
    const currentDate = new Date(startDate)

    while (currentDate <= endDate) {
      // Generate slots for business hours (9 AM - 5 PM)
      for (let hour = 9; hour < 17; hour++) {
        const slotStart = new Date(currentDate)
        slotStart.setHours(hour, 0, 0, 0)

        const slotEnd = new Date(slotStart)
        slotEnd.setHours(hour + 1, 0, 0, 0)

        slots.push({
          startTime: slotStart,
          endTime: slotEnd,
          isAvailable: Math.random() > 0.3, // 70% availability
        })
      }

      currentDate.setDate(currentDate.getDate() + 1)
    }

    return slots
  }
}

export const tutoringService = new TutoringService()
