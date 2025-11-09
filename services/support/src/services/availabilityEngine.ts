import { prisma } from '@aah/database'
import { IAvailabilityEngine, TimeSlot } from '../types'
import { AppError } from '../middleware/errorHandler'

export class AvailabilityEngine implements IAvailabilityEngine {
  /**
   * Find optimal meeting times between two users
   * Considers both users' schedules and finds common availability
   */
  async findOptimalTimes(
    tutorId: string,
    studentId: string,
    duration: number,
    preferredDays?: string[]
  ): Promise<TimeSlot[]> {
    try {
      const startDate = new Date()
      const endDate = new Date(startDate.getTime() + 14 * 24 * 60 * 60 * 1000) // 14 days ahead

      const optimalSlots: TimeSlot[] = []

      // Get student's athletic schedule
      const studentProfile = await prisma.studentProfile.findUnique({
        where: { id: studentId },
      })

      if (!studentProfile) {
        throw new AppError(404, 'STUDENT_NOT_FOUND', 'Student not found')
      }

      // Mock implementation - in production, this would:
      // 1. Fetch both users' existing commitments
      // 2. Fetch athletic schedules
      // 3. Find intersecting free time slots
      // 4. Rank by optimal time (e.g., not too early, not too late)

      const currentDate = new Date(startDate)

      while (currentDate <= endDate) {
        const dayOfWeek = currentDate.toLocaleDateString('en-US', { weekday: 'long' })

        // Skip if not a preferred day
        if (preferredDays && preferredDays.length > 0 && !preferredDays.includes(dayOfWeek)) {
          currentDate.setDate(currentDate.getDate() + 1)
          continue
        }

        // Skip weekends for academic support
        if (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
          currentDate.setDate(currentDate.getDate() + 1)
          continue
        }

        // Generate slots between 9 AM and 8 PM
        for (let hour = 9; hour < 20; hour++) {
          const slotStart = new Date(currentDate)
          slotStart.setHours(hour, 0, 0, 0)

          const slotEnd = new Date(slotStart)
          slotEnd.setMinutes(duration)

          // Check if this slot has conflicts
          const hasConflict = await this.checkConflicts(studentId, slotStart, slotEnd) ||
            await this.checkConflicts(tutorId, slotStart, slotEnd)

          if (!hasConflict) {
            optimalSlots.push({
              startTime: slotStart,
              endTime: slotEnd,
              isAvailable: true,
            })
          }
        }

        currentDate.setDate(currentDate.getDate() + 1)
      }

      // Return top 20 optimal slots
      return optimalSlots.slice(0, 20)
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }
      console.error('Error finding optimal times:', error)
      throw new AppError(500, 'SCHEDULING_ERROR', 'Failed to find optimal times')
    }
  }

  /**
   * Check if a user has any scheduling conflicts for a given time range
   */
  async checkConflicts(
    userId: string,
    startTime: Date,
    endTime: Date
  ): Promise<boolean> {
    try {
      // In production, this would check:
      // 1. Existing tutoring sessions
      // 2. Mentoring sessions
      // 3. Athletic schedule (practices, games, travel)
      // 4. Class schedule
      // 5. Study hall commitments

      // Get student profile to check athletic schedule
      const studentProfile = await prisma.studentProfile.findUnique({
        where: { id: userId },
      })

      if (studentProfile && studentProfile.athleticSchedule) {
        // Check athletic schedule for conflicts
        // athleticSchedule would be a JSON structure with scheduled events
        const schedule = studentProfile.athleticSchedule as any

        if (schedule && Array.isArray(schedule.events)) {
          for (const event of schedule.events) {
            const eventStart = new Date(event.startTime)
            const eventEnd = new Date(event.endTime)

            // Check for overlap
            if (this.timesOverlap(startTime, endTime, eventStart, eventEnd)) {
              return true // Conflict found
            }
          }
        }
      }

      // Mock additional conflict checks
      // In production, query database for existing sessions, classes, etc.
      const hasRandomConflict = Math.random() < 0.2 // 20% chance of conflict

      return hasRandomConflict
    } catch (error) {
      console.error('Error checking conflicts:', error)
      // Return true to be safe - don't schedule if we can't verify availability
      return true
    }
  }

  /**
   * Helper function to check if two time ranges overlap
   */
  private timesOverlap(
    start1: Date,
    end1: Date,
    start2: Date,
    end2: Date
  ): boolean {
    return start1 < end2 && start2 < end1
  }

  /**
   * Get a user's free time blocks for a given date range
   */
  async getFreeTimeBlocks(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<TimeSlot[]> {
    try {
      const freeBlocks: TimeSlot[] = []
      const currentDate = new Date(startDate)

      while (currentDate <= endDate) {
        // Assume 8 AM to 10 PM are potential working hours
        for (let hour = 8; hour < 22; hour++) {
          const blockStart = new Date(currentDate)
          blockStart.setHours(hour, 0, 0, 0)

          const blockEnd = new Date(blockStart)
          blockEnd.setHours(hour + 1, 0, 0, 0)

          const hasConflict = await this.checkConflicts(userId, blockStart, blockEnd)

          if (!hasConflict) {
            freeBlocks.push({
              startTime: blockStart,
              endTime: blockEnd,
              isAvailable: true,
            })
          }
        }

        currentDate.setDate(currentDate.getDate() + 1)
      }

      return freeBlocks
    } catch (error) {
      console.error('Error getting free time blocks:', error)
      throw new AppError(500, 'SCHEDULING_ERROR', 'Failed to get free time blocks')
    }
  }

  /**
   * Calculate optimal meeting duration based on session type
   */
  getOptimalDuration(sessionType: 'tutoring' | 'mentoring' | 'study-group'): number {
    switch (sessionType) {
      case 'tutoring':
        return 60 // 1 hour
      case 'mentoring':
        return 45 // 45 minutes
      case 'study-group':
        return 120 // 2 hours
      default:
        return 60
    }
  }

  /**
   * Suggest alternative times if preferred time is not available
   */
  async suggestAlternatives(
    userId: string,
    preferredTime: Date,
    duration: number,
    count: number = 5
  ): Promise<TimeSlot[]> {
    try {
      const alternatives: TimeSlot[] = []
      const searchStart = new Date(preferredTime)
      searchStart.setHours(searchStart.getHours() - 2) // Start searching 2 hours before

      const searchEnd = new Date(preferredTime)
      searchEnd.setDate(searchEnd.getDate() + 7) // Search up to 7 days ahead

      const freeBlocks = await this.getFreeTimeBlocks(userId, searchStart, searchEnd)

      // Filter blocks that match the duration
      for (const block of freeBlocks) {
        const blockDuration = (block.endTime.getTime() - block.startTime.getTime()) / 60000

        if (blockDuration >= duration) {
          alternatives.push(block)

          if (alternatives.length >= count) {
            break
          }
        }
      }

      return alternatives
    } catch (error) {
      console.error('Error suggesting alternatives:', error)
      throw new AppError(500, 'SCHEDULING_ERROR', 'Failed to suggest alternative times')
    }
  }
}

export const availabilityEngine = new AvailabilityEngine()
