/**
 * Tutoring Service Tests
 * Tests for tutoring session booking and management
 */

import { describe, it, expect, beforeEach, vi, Mock } from 'vitest'
import { TutoringService } from '../services/tutoringService'
import { prisma } from '@aah/database'
import { availabilityEngine } from '../services/availabilityEngine'
import { AppError } from '../middleware/errorHandler'

// Mock dependencies
vi.mock('@aah/database', () => ({
  prisma: {
    studentProfile: {
      findUnique: vi.fn(),
    },
    tutoringSession: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}))

vi.mock('../services/availabilityEngine', () => ({
  availabilityEngine: {
    checkConflicts: vi.fn(),
  },
}))

describe('TutoringService', () => {
  let tutoringService: TutoringService

  beforeEach(() => {
    tutoringService = new TutoringService()
    vi.clearAllMocks()
  })

  describe('bookSession', () => {
    const validBookingData = {
      studentId: 'student-123',
      tutorId: 'tutor-456',
      subject: 'Mathematics',
      startTime: '2025-01-15T10:00:00.000Z',
      endTime: '2025-01-15T11:00:00.000Z',
      notes: 'Help with calculus',
    }

    it('should book a tutoring session successfully', async () => {
      const mockStudent = { id: 'student-123', userId: 'user-123' }
      ;(prisma.studentProfile.findUnique as Mock).mockResolvedValue(mockStudent)
      ;(availabilityEngine.checkConflicts as Mock).mockResolvedValue(false)

      const result = await tutoringService.bookSession(validBookingData)

      expect(result).toBeDefined()
      expect(result.studentId).toBe('student-123')
      expect(result.tutorId).toBe('tutor-456')
      expect(result.subject).toBe('Mathematics')
      expect(result.status).toBe('SCHEDULED')
    })

    it('should throw error when end time is before start time', async () => {
      const invalidData = {
        ...validBookingData,
        startTime: '2025-01-15T11:00:00.000Z',
        endTime: '2025-01-15T10:00:00.000Z',
      }

      await expect(tutoringService.bookSession(invalidData)).rejects.toThrow(
        'End time must be after start time'
      )
    })

    it('should throw error when start and end time are equal', async () => {
      const invalidData = {
        ...validBookingData,
        startTime: '2025-01-15T10:00:00.000Z',
        endTime: '2025-01-15T10:00:00.000Z',
      }

      await expect(tutoringService.bookSession(invalidData)).rejects.toThrow(
        'End time must be after start time'
      )
    })

    it('should throw error when student not found', async () => {
      ;(prisma.studentProfile.findUnique as Mock).mockResolvedValue(null)

      await expect(tutoringService.bookSession(validBookingData)).rejects.toThrow(
        'Student not found'
      )
    })

    it('should throw error when student has scheduling conflict', async () => {
      const mockStudent = { id: 'student-123', userId: 'user-123' }
      ;(prisma.studentProfile.findUnique as Mock).mockResolvedValue(mockStudent)
      ;(availabilityEngine.checkConflicts as Mock).mockResolvedValueOnce(true)

      await expect(tutoringService.bookSession(validBookingData)).rejects.toThrow(
        'Student has a scheduling conflict at this time'
      )
    })

    it('should throw error when tutor is unavailable', async () => {
      const mockStudent = { id: 'student-123', userId: 'user-123' }
      ;(prisma.studentProfile.findUnique as Mock).mockResolvedValue(mockStudent)
      ;(availabilityEngine.checkConflicts as Mock)
        .mockResolvedValueOnce(false) // Student check
        .mockResolvedValueOnce(true) // Tutor check

      await expect(tutoringService.bookSession(validBookingData)).rejects.toThrow(
        'Tutor is not available at this time'
      )
    })

    it('should check both student and tutor conflicts', async () => {
      const mockStudent = { id: 'student-123', userId: 'user-123' }
      ;(prisma.studentProfile.findUnique as Mock).mockResolvedValue(mockStudent)
      ;(availabilityEngine.checkConflicts as Mock).mockResolvedValue(false)

      await tutoringService.bookSession(validBookingData)

      expect(availabilityEngine.checkConflicts).toHaveBeenCalledTimes(2)
      expect(availabilityEngine.checkConflicts).toHaveBeenCalledWith(
        'student-123',
        expect.any(Date),
        expect.any(Date)
      )
      expect(availabilityEngine.checkConflicts).toHaveBeenCalledWith(
        'tutor-456',
        expect.any(Date),
        expect.any(Date)
      )
    })

    it('should include notes in the session', async () => {
      const mockStudent = { id: 'student-123', userId: 'user-123' }
      ;(prisma.studentProfile.findUnique as Mock).mockResolvedValue(mockStudent)
      ;(availabilityEngine.checkConflicts as Mock).mockResolvedValue(false)

      const result = await tutoringService.bookSession(validBookingData)

      expect(result.notes).toBe('Help with calculus')
    })

    it('should handle booking without notes', async () => {
      const dataWithoutNotes = {
        ...validBookingData,
        notes: undefined,
      }
      const mockStudent = { id: 'student-123', userId: 'user-123' }
      ;(prisma.studentProfile.findUnique as Mock).mockResolvedValue(mockStudent)
      ;(availabilityEngine.checkConflicts as Mock).mockResolvedValue(false)

      const result = await tutoringService.bookSession(dataWithoutNotes)

      expect(result).toBeDefined()
      expect(result.notes).toBeUndefined()
    })
  })

  describe('getTutorAvailability', () => {
    it('should return tutor availability for date range', async () => {
      const params = {
        startDate: '2025-01-15',
        endDate: '2025-01-17',
        subject: 'Mathematics',
      }

      const result = await tutoringService.getTutorAvailability(params)

      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBeGreaterThan(0)
    })

    it('should filter by specific tutor when tutorId provided', async () => {
      const params = {
        startDate: '2025-01-15',
        endDate: '2025-01-17',
        tutorId: 'tutor-001',
      }

      const result = await tutoringService.getTutorAvailability(params)

      expect(result).toBeDefined()
      expect(result.every((t) => t.tutorId === 'tutor-001' || result.length === 0)).toBe(true)
    })

    it('should return tutor with rating and session count', async () => {
      const params = {
        startDate: '2025-01-15',
        endDate: '2025-01-16',
      }

      const result = await tutoringService.getTutorAvailability(params)

      if (result.length > 0) {
        expect(result[0]).toHaveProperty('averageRating')
        expect(result[0]).toHaveProperty('totalSessions')
        expect(result[0]).toHaveProperty('availableSlots')
      }
    })

    it('should return available slots within business hours', async () => {
      const params = {
        startDate: '2025-01-15',
        endDate: '2025-01-15',
      }

      const result = await tutoringService.getTutorAvailability(params)

      if (result.length > 0 && result[0].availableSlots.length > 0) {
        const slot = result[0].availableSlots[0]
        const startHour = new Date(slot.startTime).getHours()
        expect(startHour).toBeGreaterThanOrEqual(9)
        expect(startHour).toBeLessThan(17)
      }
    })
  })

  describe('cancelSession', () => {
    it('should cancel a session and return cancelled status', async () => {
      const result = await tutoringService.cancelSession('session-123', 'student-123')

      expect(result).toBeDefined()
      expect(result.status).toBe('CANCELLED')
      expect(result.id).toBe('session-123')
    })

    it('should preserve student ID in cancelled session', async () => {
      const result = await tutoringService.cancelSession('session-123', 'student-456')

      expect(result.studentId).toBe('student-456')
    })
  })

  describe('getStudentSessions', () => {
    it('should return sessions for a student', async () => {
      const result = await tutoringService.getStudentSessions('student-123')

      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
    })

    it('should return sessions with correct student ID', async () => {
      const result = await tutoringService.getStudentSessions('student-123')

      result.forEach((session) => {
        expect(session.studentId).toBe('student-123')
      })
    })

    it('should return sessions with required fields', async () => {
      const result = await tutoringService.getStudentSessions('student-123')

      result.forEach((session) => {
        expect(session).toHaveProperty('id')
        expect(session).toHaveProperty('subject')
        expect(session).toHaveProperty('startTime')
        expect(session).toHaveProperty('endTime')
        expect(session).toHaveProperty('status')
        expect(session).toHaveProperty('tutorId')
      })
    })
  })
})

describe('TutoringService - Error Handling', () => {
  let tutoringService: TutoringService

  beforeEach(() => {
    tutoringService = new TutoringService()
    vi.clearAllMocks()
  })

  describe('bookSession error codes', () => {
    it('should throw INVALID_TIME_RANGE for invalid times', async () => {
      const invalidData = {
        studentId: 'student-123',
        tutorId: 'tutor-456',
        subject: 'Math',
        startTime: '2025-01-15T11:00:00.000Z',
        endTime: '2025-01-15T10:00:00.000Z',
      }

    it('should throw INVALID_TIME_RANGE for invalid times', async () => {
      const invalidData = {
        studentId: 'student-123',
        tutorId: 'tutor-456',
        subject: 'Math',
        startTime: '2025-01-15T11:00:00.000Z',
        endTime: '2025-01-15T10:00:00.000Z',
      }

      await expect(tutoringService.bookSession(invalidData)).rejects.toThrow(
        new AppError(400, 'INVALID_TIME_RANGE', 'End time must be after start time')
      )
    })

    it('should throw STUDENT_NOT_FOUND when student does not exist', async () => {
      ;(prisma.studentProfile.findUnique as Mock).mockResolvedValue(null)

      const data = {
        studentId: 'nonexistent-student',
        tutorId: 'tutor-456',
        subject: 'Math',
        startTime: '2025-01-15T10:00:00.000Z',
        endTime: '2025-01-15T11:00:00.000Z',
      }

      try {
        await tutoringService.bookSession(data)
        fail('Should have thrown an error')
      } catch (error) {
        expect(error).toBeInstanceOf(AppError)
        expect((error as AppError).code).toBe('STUDENT_NOT_FOUND')
        expect((error as AppError).statusCode).toBe(404)
      }
    })

    it('should throw SCHEDULING_CONFLICT when student has conflict', async () => {
      ;(prisma.studentProfile.findUnique as Mock).mockResolvedValue({
        id: 'student-123',
      })
      ;(availabilityEngine.checkConflicts as Mock).mockResolvedValueOnce(true)

      const data = {
        studentId: 'student-123',
        tutorId: 'tutor-456',
        subject: 'Math',
        startTime: '2025-01-15T10:00:00.000Z',
        endTime: '2025-01-15T11:00:00.000Z',
      }

      try {
        await tutoringService.bookSession(data)
        fail('Should have thrown an error')
      } catch (error) {
        expect(error).toBeInstanceOf(AppError)
        expect((error as AppError).code).toBe('SCHEDULING_CONFLICT')
        expect((error as AppError).statusCode).toBe(409)
      }
    })

    it('should throw TUTOR_UNAVAILABLE when tutor has conflict', async () => {
      ;(prisma.studentProfile.findUnique as Mock).mockResolvedValue({
        id: 'student-123',
      })
      ;(availabilityEngine.checkConflicts as Mock)
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true)

      const data = {
        studentId: 'student-123',
        tutorId: 'tutor-456',
        subject: 'Math',
        startTime: '2025-01-15T10:00:00.000Z',
        endTime: '2025-01-15T11:00:00.000Z',
      }

      try {
        await tutoringService.bookSession(data)
        fail('Should have thrown an error')
      } catch (error) {
        expect(error).toBeInstanceOf(AppError)
        expect((error as AppError).code).toBe('TUTOR_UNAVAILABLE')
        expect((error as AppError).statusCode).toBe(409)
      }
    })
  })
})

describe('TutoringService - Integration Scenarios', () => {
  let tutoringService: TutoringService

  beforeEach(() => {
    tutoringService = new TutoringService()
    vi.clearAllMocks()
  })

  it('should handle booking multiple sessions for same student', async () => {
    const mockStudent = { id: 'student-123', userId: 'user-123' }
    ;(prisma.studentProfile.findUnique as Mock).mockResolvedValue(mockStudent)
    ;(availabilityEngine.checkConflicts as Mock).mockResolvedValue(false)

    const session1 = await tutoringService.bookSession({
      studentId: 'student-123',
      tutorId: 'tutor-456',
      subject: 'Mathematics',
      startTime: '2025-01-15T10:00:00.000Z',
      endTime: '2025-01-15T11:00:00.000Z',
    })

    const session2 = await tutoringService.bookSession({
      studentId: 'student-123',
      tutorId: 'tutor-789',
      subject: 'Physics',
      startTime: '2025-01-15T14:00:00.000Z',
      endTime: '2025-01-15T15:00:00.000Z',
    })

    expect(session1.id).not.toBe(session2.id)
    expect(session1.subject).toBe('Mathematics')
    expect(session2.subject).toBe('Physics')
  })

  it('should support different subjects', async () => {
    const subjects = ['Mathematics', 'Physics', 'Chemistry', 'English', 'History']
    const mockStudent = { id: 'student-123', userId: 'user-123' }
    ;(prisma.studentProfile.findUnique as Mock).mockResolvedValue(mockStudent)
    ;(availabilityEngine.checkConflicts as Mock).mockResolvedValue(false)

    for (const subject of subjects) {
      const result = await tutoringService.bookSession({
        studentId: 'student-123',
        tutorId: 'tutor-456',
        subject,
        startTime: '2025-01-15T10:00:00.000Z',
        endTime: '2025-01-15T11:00:00.000Z',
      })

      expect(result.subject).toBe(subject)
    }
  })
})
