import { prisma } from '@aah/database'
import {
  IStudyHallService,
  StudyHallAttendance,
  StudyHallStats,
  StudyHallCheckInInput,
} from '../types'
import { AppError } from '../middleware/errorHandler'

export class StudyHallService implements IStudyHallService {
  async checkIn(data: StudyHallCheckInInput): Promise<StudyHallAttendance> {
    try {
      // Check if student exists
      const student = await prisma.studentProfile.findUnique({
        where: { id: data.studentId },
      })

      if (!student) {
        throw new AppError(404, 'STUDENT_NOT_FOUND', 'Student not found')
      }

      // Check if student has an active check-in
      // In production, query database for active sessions
      const hasActiveSession = false // Mock check

      if (hasActiveSession) {
        throw new AppError(
          409,
          'ALREADY_CHECKED_IN',
          'Student is already checked in to a study hall'
        )
      }

      // Create attendance record
      const attendance: StudyHallAttendance = {
        id: crypto.randomUUID(),
        studentId: data.studentId,
        location: data.location,
        checkInTime: new Date(),
        checkOutTime: undefined,
        duration: undefined,
        wasCompleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      return attendance
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }
      console.error('Error checking in to study hall:', error)
      throw new AppError(500, 'DATABASE_ERROR', 'Failed to check in to study hall')
    }
  }

  async checkOut(attendanceId: string, studentId: string): Promise<StudyHallAttendance> {
    try {
      // Mock implementation - in production, fetch and update the attendance record
      const checkInTime = new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
      const checkOutTime = new Date()
      const duration = Math.floor((checkOutTime.getTime() - checkInTime.getTime()) / 60000) // minutes

      const attendance: StudyHallAttendance = {
        id: attendanceId,
        studentId: studentId,
        location: 'Main Study Hall',
        checkInTime: checkInTime,
        checkOutTime: checkOutTime,
        duration: duration,
        wasCompleted: true,
        createdAt: checkInTime,
        updatedAt: checkOutTime,
      }

      return attendance
    } catch (error) {
      console.error('Error checking out from study hall:', error)
      throw new AppError(500, 'DATABASE_ERROR', 'Failed to check out from study hall')
    }
  }

  async getAttendanceRecords(
    studentId: string,
    limit: number = 10
  ): Promise<StudyHallAttendance[]> {
    try {
      // Check if student exists
      const student = await prisma.studentProfile.findUnique({
        where: { id: studentId },
      })

      if (!student) {
        throw new AppError(404, 'STUDENT_NOT_FOUND', 'Student not found')
      }

      // Mock implementation - return recent attendance records
      const records: StudyHallAttendance[] = [
        {
          id: crypto.randomUUID(),
          studentId: studentId,
          location: 'Main Study Hall',
          checkInTime: new Date('2025-11-07T14:00:00'),
          checkOutTime: new Date('2025-11-07T16:30:00'),
          duration: 150,
          wasCompleted: true,
          createdAt: new Date('2025-11-07T14:00:00'),
          updatedAt: new Date('2025-11-07T16:30:00'),
        },
        {
          id: crypto.randomUUID(),
          studentId: studentId,
          location: 'Library Study Room',
          checkInTime: new Date('2025-11-05T10:00:00'),
          checkOutTime: new Date('2025-11-05T12:00:00'),
          duration: 120,
          wasCompleted: true,
          createdAt: new Date('2025-11-05T10:00:00'),
          updatedAt: new Date('2025-11-05T12:00:00'),
        },
      ]

      return records.slice(0, limit)
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }
      console.error('Error getting attendance records:', error)
      throw new AppError(500, 'DATABASE_ERROR', 'Failed to retrieve attendance records')
    }
  }

  async getStudentStats(studentId: string): Promise<StudyHallStats> {
    try {
      // Check if student exists
      const student = await prisma.studentProfile.findUnique({
        where: { id: studentId },
      })

      if (!student) {
        throw new AppError(404, 'STUDENT_NOT_FOUND', 'Student not found')
      }

      // Mock implementation - calculate stats from attendance records
      const recentSessions = await this.getAttendanceRecords(studentId, 5)

      const totalMinutes = recentSessions.reduce((sum, session) => {
        return sum + (session.duration || 0)
      }, 0)

      const totalHours = totalMinutes / 60
      const requiredHours = 10 // Mock required hours per week
      const completionPercentage = Math.min((totalHours / requiredHours) * 100, 100)
      const averageSessionDuration = recentSessions.length > 0
        ? totalMinutes / recentSessions.length
        : 0

      const stats: StudyHallStats = {
        studentId: studentId,
        totalHours: totalHours,
        requiredHours: requiredHours,
        completionPercentage: completionPercentage,
        sessionsCount: recentSessions.length,
        averageSessionDuration: averageSessionDuration,
        recentSessions: recentSessions,
      }

      return stats
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }
      console.error('Error getting student stats:', error)
      throw new AppError(500, 'DATABASE_ERROR', 'Failed to retrieve student statistics')
    }
  }
}

export const studyHallService = new StudyHallService()
