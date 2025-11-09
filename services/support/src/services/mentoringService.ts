import { prisma } from '@aah/database'
import {
  IMentoringService,
  MentorMatch,
  MentoringSession,
  ScheduleMentoringSessionInput,
} from '../types'
import { AppError } from '../middleware/errorHandler'
import { availabilityEngine } from './availabilityEngine'

export class MentoringService implements IMentoringService {
  async getMentorMatches(studentId: string): Promise<MentorMatch[]> {
    try {
      // Check if student exists
      const student = await prisma.studentProfile.findUnique({
        where: { id: studentId },
        include: {
          user: true,
        },
      })

      if (!student) {
        throw new AppError(404, 'STUDENT_NOT_FOUND', 'Student not found')
      }

      // Mock implementation - in production, this would use a matching algorithm
      // based on sport, major, year, interests, etc.
      const matches: MentorMatch[] = [
        {
          id: crypto.randomUUID(),
          mentorId: 'mentor-001',
          menteeId: studentId,
          matchedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
          status: 'ACTIVE',
          compatibilityScore: 0.85,
          commonInterests: ['Basketball', 'Business Administration', 'Leadership'],
          mentorInfo: {
            id: 'mentor-001',
            name: 'Marcus Johnson',
            sport: 'Basketball',
            year: 'Senior',
            major: 'Business Administration',
          },
          menteeInfo: {
            id: studentId,
            name: 'Student Name',
            sport: student.sport,
            year: 'Sophomore',
            major: 'Business',
          },
        },
        {
          id: crypto.randomUUID(),
          mentorId: 'mentor-002',
          menteeId: studentId,
          matchedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
          status: 'ACTIVE',
          compatibilityScore: 0.78,
          commonInterests: ['Athletics', 'Time Management', 'Academic Success'],
          mentorInfo: {
            id: 'mentor-002',
            name: 'Emily Carter',
            sport: 'Track & Field',
            year: 'Junior',
            major: 'Psychology',
          },
          menteeInfo: {
            id: studentId,
            name: 'Student Name',
            sport: student.sport,
            year: 'Sophomore',
            major: 'Business',
          },
        },
      ]

      return matches.filter((m) => m.status === 'ACTIVE')
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }
      console.error('Error getting mentor matches:', error)
      throw new AppError(500, 'DATABASE_ERROR', 'Failed to retrieve mentor matches')
    }
  }

  async scheduleSession(data: ScheduleMentoringSessionInput): Promise<MentoringSession> {
    try {
      const scheduledAt = new Date(data.scheduledAt)
      const endTime = new Date(scheduledAt.getTime() + data.duration * 60000)

      // Validate time is in the future
      if (scheduledAt <= new Date()) {
        throw new AppError(
          400,
          'INVALID_TIME',
          'Session must be scheduled in the future'
        )
      }

      // Check for conflicts for both mentor and mentee
      const mentorConflict = await availabilityEngine.checkConflicts(
        data.mentorId,
        scheduledAt,
        endTime
      )

      if (mentorConflict) {
        throw new AppError(
          409,
          'MENTOR_UNAVAILABLE',
          'Mentor has a scheduling conflict at this time'
        )
      }

      const menteeConflict = await availabilityEngine.checkConflicts(
        data.menteeId,
        scheduledAt,
        endTime
      )

      if (menteeConflict) {
        throw new AppError(
          409,
          'MENTEE_UNAVAILABLE',
          'Mentee has a scheduling conflict at this time'
        )
      }

      // Create mentoring session
      const session: MentoringSession = {
        id: crypto.randomUUID(),
        mentorId: data.mentorId,
        menteeId: data.menteeId,
        scheduledAt: scheduledAt,
        duration: data.duration,
        status: 'SCHEDULED',
        topic: data.topic,
        notes: data.notes,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      return session
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }
      console.error('Error scheduling mentoring session:', error)
      throw new AppError(500, 'DATABASE_ERROR', 'Failed to schedule mentoring session')
    }
  }

  async cancelSession(sessionId: string, userId: string): Promise<MentoringSession> {
    try {
      // Mock implementation - verify user is mentor or mentee and cancel
      const session: MentoringSession = {
        id: sessionId,
        mentorId: 'mentor-001',
        menteeId: userId,
        scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // tomorrow
        duration: 60,
        status: 'CANCELLED',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      return session
    } catch (error) {
      console.error('Error cancelling mentoring session:', error)
      throw new AppError(500, 'DATABASE_ERROR', 'Failed to cancel mentoring session')
    }
  }

  async getSessions(userId: string): Promise<MentoringSession[]> {
    try {
      // Mock implementation - get sessions where user is mentor or mentee
      const sessions: MentoringSession[] = [
        {
          id: crypto.randomUUID(),
          mentorId: 'mentor-001',
          menteeId: userId,
          scheduledAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
          duration: 60,
          status: 'SCHEDULED',
          topic: 'Balancing academics and athletics',
          notes: 'First mentoring session',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: crypto.randomUUID(),
          mentorId: 'mentor-002',
          menteeId: userId,
          scheduledAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
          duration: 45,
          status: 'COMPLETED',
          topic: 'Study strategies',
          notes: 'Great discussion on time management',
          feedback: 'Very helpful session, learned a lot about prioritization',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      return sessions
    } catch (error) {
      console.error('Error getting mentoring sessions:', error)
      throw new AppError(500, 'DATABASE_ERROR', 'Failed to retrieve mentoring sessions')
    }
  }

  /**
   * Calculate compatibility score between mentor and mentee
   * Based on common interests, sport, major, etc.
   */
  private calculateCompatibilityScore(
    mentor: any,
    mentee: any
  ): { score: number; commonInterests: string[] } {
    let score = 0
    const commonInterests: string[] = []

    // Same sport increases compatibility
    if (mentor.sport === mentee.sport) {
      score += 0.3
      commonInterests.push(mentor.sport)
    }

    // Similar major
    if (mentor.major === mentee.major) {
      score += 0.2
      commonInterests.push(mentor.major)
    }

    // Add other factors (interests, goals, etc.)
    score += Math.random() * 0.5 // Placeholder for additional factors

    return {
      score: Math.min(score, 1.0),
      commonInterests,
    }
  }
}

export const mentoringService = new MentoringService()
