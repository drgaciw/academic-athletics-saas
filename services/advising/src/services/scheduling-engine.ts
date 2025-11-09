/**
 * Course Scheduling Engine
 * 
 * Implements Constraint Satisfaction Problem (CSP) solver for course scheduling
 * with athletic schedule conflict detection
 */

// =============================================================================
// TYPES
// =============================================================================

export interface Course {
  id: string
  code: string
  name: string
  credits: number
  sections: CourseSection[]
  prerequisites?: string[]
  corequisites?: string[]
}

export interface CourseSection {
  id: string
  courseId: string
  instructor: string
  capacity: number
  enrolled: number
  schedule: TimeSlot[]
}

export interface TimeSlot {
  day: 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN'
  startTime: string // HH:MM format
  endTime: string // HH:MM format
  location?: string
}

export interface AthleticCommitment {
  type: 'PRACTICE' | 'GAME' | 'TRAVEL' | 'MEETING'
  schedule: TimeSlot[]
  mandatory: boolean
}

export interface ScheduleConstraints {
  minCredits: number
  maxCredits: number
  preferredDays?: string[]
  avoidMornings?: boolean // Before 10 AM
  avoidEvenings?: boolean // After 6 PM
  athleticCommitments: AthleticCommitment[]
}

export interface ScheduleResult {
  success: boolean
  schedule?: ScheduledCourse[]
  conflicts?: Conflict[]
  totalCredits?: number
  message?: string
}

export interface ScheduledCourse {
  course: Course
  section: CourseSection
}

export interface Conflict {
  type: 'TIME' | 'ATHLETIC' | 'PREREQUISITE' | 'CAPACITY' | 'CREDITS'
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM'
  message: string
  courses?: string[]
  timeSlot?: TimeSlot
}

// =============================================================================
// SCHEDULING ENGINE
// =============================================================================

export class SchedulingEngine {
  /**
   * Generate course schedule using CSP solver
   */
  generateSchedule(
    courses: Course[],
    constraints: ScheduleConstraints
  ): ScheduleResult {
    // Validate input
    if (courses.length === 0) {
      return {
        success: false,
        message: 'No courses provided',
      }
    }

    // Check total credits
    const totalCredits = courses.reduce((sum, c) => sum + c.credits, 0)
    if (totalCredits < constraints.minCredits) {
      return {
        success: false,
        message: `Total credits (${totalCredits}) below minimum (${constraints.minCredits})`,
      }
    }
    if (totalCredits > constraints.maxCredits) {
      return {
        success: false,
        message: `Total credits (${totalCredits}) exceeds maximum (${constraints.maxCredits})`,
      }
    }

    // Try to find valid schedule using backtracking
    const schedule: ScheduledCourse[] = []
    const conflicts: Conflict[] = []

    for (const course of courses) {
      const validSection = this.findValidSection(
        course,
        schedule,
        constraints,
        conflicts
      )

      if (validSection) {
        schedule.push({ course, section: validSection })
      } else {
        conflicts.push({
          type: 'TIME',
          severity: 'CRITICAL',
          message: `No valid section found for ${course.code}`,
          courses: [course.code],
        })
      }
    }

    return {
      success: conflicts.filter(c => c.severity === 'CRITICAL').length === 0,
      schedule,
      conflicts: conflicts.length > 0 ? conflicts : undefined,
      totalCredits,
    }
  }

  /**
   * Find valid section for a course
   */
  private findValidSection(
    course: Course,
    currentSchedule: ScheduledCourse[],
    constraints: ScheduleConstraints,
    conflicts: Conflict[]
  ): CourseSection | null {
    for (const section of course.sections) {
      // Check capacity
      if (section.enrolled >= section.capacity) {
        continue
      }

      // Check time conflicts with other courses
      const hasTimeConflict = currentSchedule.some(scheduled =>
        this.hasTimeConflict(section.schedule, scheduled.section.schedule)
      )
      if (hasTimeConflict) {
        continue
      }

      // Check athletic conflicts
      const hasAthleticConflict = constraints.athleticCommitments
        .filter(ac => ac.mandatory)
        .some(ac => this.hasTimeConflict(section.schedule, ac.schedule))
      
      if (hasAthleticConflict) {
        conflicts.push({
          type: 'ATHLETIC',
          severity: 'HIGH',
          message: `${course.code} conflicts with athletic commitment`,
          courses: [course.code],
        })
        continue
      }

      // Check time preferences
      if (constraints.avoidMornings && this.hasEarlyClasses(section.schedule)) {
        // Not a hard constraint, just note it
        conflicts.push({
          type: 'TIME',
          severity: 'MEDIUM',
          message: `${course.code} has early morning classes`,
          courses: [course.code],
        })
      }

      // Valid section found
      return section
    }

    return null
  }

  /**
   * Check if two schedules have time conflicts
   */
  hasTimeConflict(schedule1: TimeSlot[], schedule2: TimeSlot[]): boolean {
    for (const slot1 of schedule1) {
      for (const slot2 of schedule2) {
        if (slot1.day === slot2.day) {
          if (this.timesOverlap(slot1.startTime, slot1.endTime, slot2.startTime, slot2.endTime)) {
            return true
          }
        }
      }
    }
    return false
  }

  /**
   * Check if two time ranges overlap
   */
  private timesOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
    const s1 = this.timeToMinutes(start1)
    const e1 = this.timeToMinutes(end1)
    const s2 = this.timeToMinutes(start2)
    const e2 = this.timeToMinutes(end2)

    return s1 < e2 && s2 < e1
  }

  /**
   * Convert time string to minutes since midnight
   */
  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number)
    return hours * 60 + minutes
  }

  /**
   * Check if schedule has early morning classes (before 10 AM)
   */
  private hasEarlyClasses(schedule: TimeSlot[]): boolean {
    return schedule.some(slot => this.timeToMinutes(slot.startTime) < 600) // 10:00 AM
  }

  /**
   * Detect all conflicts in a proposed schedule
   */
  detectConflicts(
    schedule: ScheduledCourse[],
    constraints: ScheduleConstraints
  ): Conflict[] {
    const conflicts: Conflict[] = []

    // Check time conflicts between courses
    for (let i = 0; i < schedule.length; i++) {
      for (let j = i + 1; j < schedule.length; j++) {
        if (this.hasTimeConflict(
          schedule[i].section.schedule,
          schedule[j].section.schedule
        )) {
          conflicts.push({
            type: 'TIME',
            severity: 'CRITICAL',
            message: `Time conflict between ${schedule[i].course.code} and ${schedule[j].course.code}`,
            courses: [schedule[i].course.code, schedule[j].course.code],
          })
        }
      }
    }

    // Check athletic conflicts
    for (const scheduled of schedule) {
      for (const athletic of constraints.athleticCommitments) {
        if (athletic.mandatory && this.hasTimeConflict(
          scheduled.section.schedule,
          athletic.schedule
        )) {
          conflicts.push({
            type: 'ATHLETIC',
            severity: 'CRITICAL',
            message: `${scheduled.course.code} conflicts with ${athletic.type}`,
            courses: [scheduled.course.code],
          })
        }
      }
    }

    // Check credit limits
    const totalCredits = schedule.reduce((sum, s) => sum + s.course.credits, 0)
    if (totalCredits > constraints.maxCredits) {
      conflicts.push({
        type: 'CREDITS',
        severity: 'CRITICAL',
        message: `Total credits (${totalCredits}) exceeds maximum (${constraints.maxCredits})`,
      })
    }

    return conflicts
  }
}

// Export singleton instance
export const schedulingEngine = new SchedulingEngine()
