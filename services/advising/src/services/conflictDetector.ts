// ============================================================================
// CONFLICT DETECTOR SERVICE
// ============================================================================

import type {
  Conflict,
  ConflictDetectionResult,
  CourseSectionInfo,
  AthleticSchedule,
  TimeSlot,
  ConflictGraph,
  GraphNode,
  GraphEdge
} from '../types'
import {
  sectionToTimeSlots,
  hasTimeSlotOverlap,
  findOverlappingTimeSlots,
  formatTimeSlot
} from '../utils/timeUtils'

/**
 * Conflict Detector Service
 * Uses graph-based algorithms to detect scheduling conflicts
 */
export class ConflictDetectorService {
  /**
   * Detect all conflicts in a proposed schedule
   */
  async detectConflicts(
    sections: CourseSectionInfo[],
    studentId: string,
    athleticSchedule?: AthleticSchedule,
    prerequisiteData?: Map<string, string[]>
  ): Promise<ConflictDetectionResult> {
    const conflicts: Conflict[] = []
    const warnings: string[] = []

    // Build conflict graph
    const graph = this.buildConflictGraph(sections)

    // Detect time conflicts between courses
    const timeConflicts = this.detectTimeConflicts(sections, graph)
    conflicts.push(...timeConflicts)

    // Detect athletic schedule conflicts
    if (athleticSchedule) {
      const athleticConflicts = this.detectAthleticConflicts(sections, athleticSchedule)
      conflicts.push(...athleticConflicts)
    }

    // Detect prerequisite violations
    if (prerequisiteData) {
      const prereqConflicts = this.detectPrerequisiteViolations(sections, prerequisiteData)
      conflicts.push(...prereqConflicts)
    }

    // Detect capacity issues
    const capacityConflicts = this.detectCapacityConflicts(sections)
    conflicts.push(...capacityConflicts)

    // Detect corequisite violations
    const coreqConflicts = this.detectCorequisiteViolations(sections)
    conflicts.push(...coreqConflicts)

    // Generate warnings for non-critical issues
    warnings.push(...this.generateWarnings(sections))

    return {
      hasConflicts: conflicts.length > 0,
      conflicts,
      warnings
    }
  }

  /**
   * Build a conflict graph for efficient conflict detection
   */
  private buildConflictGraph(sections: CourseSectionInfo[]): ConflictGraph {
    const nodes = new Map<string, GraphNode>()
    const edges = new Map<string, GraphEdge[]>()

    // Create nodes
    for (const section of sections) {
      const timeSlots = sectionToTimeSlots(section.days, section.startTime, section.endTime)
      nodes.set(section.id, {
        id: section.id,
        sectionId: section.id,
        section,
        timeSlots
      })
      edges.set(section.id, [])
    }

    // Create edges for conflicts
    const sectionIds = Array.from(nodes.keys())
    for (let i = 0; i < sectionIds.length; i++) {
      for (let j = i + 1; j < sectionIds.length; j++) {
        const node1 = nodes.get(sectionIds[i])!
        const node2 = nodes.get(sectionIds[j])!

        if (hasTimeSlotOverlap(node1.timeSlots, node2.timeSlots)) {
          const edge: GraphEdge = {
            fromNodeId: node1.id,
            toNodeId: node2.id,
            conflictType: 'TIME_CONFLICT',
            severity: 'CRITICAL',
            description: `Time conflict between ${node1.section.course?.courseCode} and ${node2.section.course?.courseCode}`
          }

          edges.get(node1.id)!.push(edge)
          edges.get(node2.id)!.push({ ...edge, fromNodeId: node2.id, toNodeId: node1.id })
        }
      }
    }

    return { nodes, edges }
  }

  /**
   * Detect time conflicts between course sections
   */
  private detectTimeConflicts(
    sections: CourseSectionInfo[],
    graph: ConflictGraph
  ): Conflict[] {
    const conflicts: Conflict[] = []
    const processed = new Set<string>()

    for (let i = 0; i < sections.length; i++) {
      for (let j = i + 1; j < sections.length; j++) {
        const section1 = sections[i]
        const section2 = sections[j]
        const conflictKey = [section1.id, section2.id].sort().join('-')

        if (processed.has(conflictKey)) continue

        const slots1 = sectionToTimeSlots(section1.days, section1.startTime, section1.endTime)
        const slots2 = sectionToTimeSlots(section2.days, section2.startTime, section2.endTime)

        const overlaps = findOverlappingTimeSlots(slots1, slots2)

        if (overlaps.length > 0) {
          const overlapDetails = overlaps
            .map(o => `${formatTimeSlot(o.slot1)} overlaps with ${formatTimeSlot(o.slot2)}`)
            .join('; ')

          conflicts.push({
            conflictType: 'TIME_CONFLICT',
            severity: 'CRITICAL',
            description: `Time conflict between ${section1.course?.courseCode} (${section1.sectionNumber}) and ${section2.course?.courseCode} (${section2.sectionNumber}): ${overlapDetails}`,
            affectedCourses: [
              section1.course?.courseCode || section1.id,
              section2.course?.courseCode || section2.id
            ],
            suggestions: [
              `Consider switching to a different section of ${section1.course?.courseCode}`,
              `Consider switching to a different section of ${section2.course?.courseCode}`
            ],
            metadata: {
              section1Id: section1.id,
              section2Id: section2.id,
              overlaps
            }
          })

          processed.add(conflictKey)
        }
      }
    }

    return conflicts
  }

  /**
   * Detect conflicts with athletic schedule
   */
  private detectAthleticConflicts(
    sections: CourseSectionInfo[],
    athleticSchedule: AthleticSchedule
  ): Conflict[] {
    const conflicts: Conflict[] = []

    for (const section of sections) {
      const courseSlots = sectionToTimeSlots(section.days, section.startTime, section.endTime)

      for (const event of athleticSchedule.events) {
        const eventSlots = sectionToTimeSlots(event.days, event.startTime, event.endTime)
        const overlaps = findOverlappingTimeSlots(courseSlots, eventSlots)

        if (overlaps.length > 0) {
          const severity = event.isMandatory ? 'CRITICAL' : 'HIGH'
          const overlapDetails = overlaps
            .map(o => formatTimeSlot(o.slot1))
            .join(', ')

          conflicts.push({
            conflictType: 'ATHLETIC_CONFLICT',
            severity,
            description: `${section.course?.courseCode} (${section.sectionNumber}) conflicts with ${event.type.toLowerCase()}: ${event.title} at ${overlapDetails}`,
            affectedCourses: [section.course?.courseCode || section.id],
            suggestions: [
              `Find a different section of ${section.course?.courseCode} that doesn't conflict with ${event.title}`,
              event.isMandatory
                ? 'This is a mandatory athletic event and cannot be missed'
                : 'Discuss with your coach about potential scheduling flexibility'
            ],
            metadata: {
              sectionId: section.id,
              athleticEvent: event,
              overlaps
            }
          })
        }
      }
    }

    return conflicts
  }

  /**
   * Detect prerequisite violations
   */
  private detectPrerequisiteViolations(
    sections: CourseSectionInfo[],
    prerequisiteData: Map<string, string[]>
  ): Conflict[] {
    const conflicts: Conflict[] = []

    for (const section of sections) {
      if (!section.course) continue

      const prerequisites = section.course.prerequisites || []
      if (prerequisites.length === 0) continue

      const completedCourses = prerequisiteData.get(section.course.id) || []
      const missingPrereqs = prerequisites.filter(prereq => !completedCourses.includes(prereq))

      if (missingPrereqs.length > 0) {
        conflicts.push({
          conflictType: 'PREREQUISITE_MISSING',
          severity: 'CRITICAL',
          description: `${section.course.courseCode} requires prerequisites that have not been completed: ${missingPrereqs.join(', ')}`,
          affectedCourses: [section.course.courseCode],
          suggestions: [
            `Complete the required prerequisite courses: ${missingPrereqs.join(', ')}`,
            'Contact your advisor to discuss prerequisite waivers if applicable'
          ],
          metadata: {
            courseId: section.course.id,
            missingPrerequisites: missingPrereqs
          }
        })
      }
    }

    return conflicts
  }

  /**
   * Detect capacity/enrollment conflicts
   */
  private detectCapacityConflicts(sections: CourseSectionInfo[]): Conflict[] {
    const conflicts: Conflict[] = []

    for (const section of sections) {
      if (!section.isOpen || section.enrolled >= section.capacity) {
        conflicts.push({
          conflictType: 'CAPACITY_FULL',
          severity: 'HIGH',
          description: `${section.course?.courseCode} (${section.sectionNumber}) is full (${section.enrolled}/${section.capacity})`,
          affectedCourses: [section.course?.courseCode || section.id],
          suggestions: [
            'Join the waitlist for this section',
            'Look for other open sections of this course',
            'Consider taking this course in a future term'
          ],
          metadata: {
            sectionId: section.id,
            capacity: section.capacity,
            enrolled: section.enrolled
          }
        })
      }
    }

    return conflicts
  }

  /**
   * Detect corequisite violations
   */
  private detectCorequisiteViolations(sections: CourseSectionInfo[]): Conflict[] {
    const conflicts: Conflict[] = []
    const courseIds = new Set(sections.map(s => s.course?.id).filter(Boolean))

    for (const section of sections) {
      if (!section.course) continue

      const corequisites = section.course.corequisites || []
      if (corequisites.length === 0) continue

      const missingCoreqs = corequisites.filter(coreq => !courseIds.has(coreq))

      if (missingCoreqs.length > 0) {
        conflicts.push({
          conflictType: 'COREQUISITE_MISSING',
          severity: 'HIGH',
          description: `${section.course.courseCode} requires corequisites that are not in this schedule: ${missingCoreqs.join(', ')}`,
          affectedCourses: [section.course.courseCode],
          suggestions: [
            `Add the required corequisite courses: ${missingCoreqs.join(', ')}`,
            'Contact your advisor about corequisite requirements'
          ],
          metadata: {
            courseId: section.course.id,
            missingCorequisites: missingCoreqs
          }
        })
      }
    }

    return conflicts
  }

  /**
   * Generate warnings for potential issues
   */
  private generateWarnings(sections: CourseSectionInfo[]): string[] {
    const warnings: string[] = []

    // Check for heavy credit load
    const totalCredits = sections.reduce((sum, s) => sum + (s.course?.credits || 0), 0)
    if (totalCredits > 18) {
      warnings.push(`Heavy course load: ${totalCredits} credit hours (standard maximum is 18)`)
    }

    // Check for same-day back-to-back classes
    const dayGroups = new Map<string, CourseSectionInfo[]>()
    for (const section of sections) {
      for (const day of section.days) {
        const daySections = dayGroups.get(day) || []
        daySections.push(section)
        dayGroups.set(day, daySections)
      }
    }

    for (const [day, daySections] of dayGroups) {
      if (daySections.length >= 3) {
        warnings.push(`You have ${daySections.length} classes on ${day}`)
      }
    }

    return warnings
  }

  /**
   * Get conflict by student and schedule
   */
  async getConflictsByStudent(
    studentId: string,
    scheduleId?: string
  ): Promise<Conflict[]> {
    // This would query the database for existing conflicts
    // For now, return empty array as placeholder
    return []
  }
}
