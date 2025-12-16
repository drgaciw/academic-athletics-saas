/**
 * Conflict Detector Service Tests
 * Tests for graph-based scheduling conflict detection
 */

import { ConflictDetectorService } from '../services/conflictDetector'
import type {
  CourseSectionInfo,
  AthleticSchedule,
  AthleticEvent,
  CourseInfo,
} from '../types'

describe('ConflictDetectorService', () => {
  let conflictDetector: ConflictDetectorService

  beforeEach(() => {
    conflictDetector = new ConflictDetectorService()
  })

  // Helper function to create mock course sections
  const createSection = (
    id: string,
    courseCode: string,
    days: string[],
    startTime: string,
    endTime: string,
    options: Partial<CourseSectionInfo> = {}
  ): CourseSectionInfo => ({
    id,
    courseId: `course-${id}`,
    course: {
      id: `course-${id}`,
      courseCode,
      courseName: `${courseCode} Course`,
      department: 'TEST',
      credits: 3,
      ...options.course,
    } as CourseInfo,
    sectionNumber: '001',
    term: 'Fall',
    academicYear: '2024-2025',
    days,
    startTime,
    endTime,
    capacity: 30,
    enrolled: 15,
    isOpen: true,
    ...options,
  })

  // Helper function to create athletic schedule
  const createAthleticSchedule = (
    studentId: string,
    events: Partial<AthleticEvent>[]
  ): AthleticSchedule => ({
    studentId,
    sport: 'Basketball',
    events: events.map((e, i) => ({
      id: `event-${i}`,
      type: 'PRACTICE',
      title: 'Practice',
      days: ['MONDAY', 'WEDNESDAY', 'FRIDAY'],
      startTime: '15:00',
      endTime: '17:00',
      isMandatory: true,
      conflictPriority: 5,
      ...e,
    })),
  })

  describe('detectConflicts - Time Conflicts', () => {
    it('should detect no conflicts when sections have no time overlap', async () => {
      const sections: CourseSectionInfo[] = [
        createSection('1', 'MATH101', ['MONDAY', 'WEDNESDAY'], '09:00', '10:00'),
        createSection('2', 'ENGL101', ['MONDAY', 'WEDNESDAY'], '11:00', '12:00'),
        createSection('3', 'PHYS101', ['TUESDAY', 'THURSDAY'], '09:00', '10:00'),
      ]

      const result = await conflictDetector.detectConflicts(sections, 'student-1')

      expect(result.hasConflicts).toBe(false)
      expect(result.conflicts).toHaveLength(0)
    })

    it('should detect time conflict when two sections overlap', async () => {
      const sections: CourseSectionInfo[] = [
        createSection('1', 'MATH101', ['MONDAY', 'WEDNESDAY'], '09:00', '10:30'),
        createSection('2', 'ENGL101', ['MONDAY', 'WEDNESDAY'], '10:00', '11:00'),
      ]

      const result = await conflictDetector.detectConflicts(sections, 'student-1')

      expect(result.hasConflicts).toBe(true)
      expect(result.conflicts).toHaveLength(1)
      expect(result.conflicts[0].conflictType).toBe('TIME_CONFLICT')
      expect(result.conflicts[0].severity).toBe('CRITICAL')
      expect(result.conflicts[0].affectedCourses).toContain('MATH101')
      expect(result.conflicts[0].affectedCourses).toContain('ENGL101')
    })

    it('should detect multiple time conflicts', async () => {
      const sections: CourseSectionInfo[] = [
        createSection('1', 'MATH101', ['MONDAY'], '09:00', '10:00'),
        createSection('2', 'ENGL101', ['MONDAY'], '09:30', '10:30'),
        createSection('3', 'PHYS101', ['MONDAY'], '09:45', '11:00'),
      ]

      const result = await conflictDetector.detectConflicts(sections, 'student-1')

      expect(result.hasConflicts).toBe(true)
      // Should have 3 conflicts: 1-2, 1-3, 2-3
      expect(result.conflicts.length).toBeGreaterThanOrEqual(2)
    })

    it('should not detect conflict for back-to-back classes', async () => {
      const sections: CourseSectionInfo[] = [
        createSection('1', 'MATH101', ['MONDAY'], '09:00', '10:00'),
        createSection('2', 'ENGL101', ['MONDAY'], '10:00', '11:00'),
      ]

      const result = await conflictDetector.detectConflicts(sections, 'student-1')

      expect(result.hasConflicts).toBe(false)
    })

    it('should detect conflict on overlapping days only', async () => {
      const sections: CourseSectionInfo[] = [
        createSection('1', 'MATH101', ['MONDAY', 'WEDNESDAY', 'FRIDAY'], '09:00', '10:00'),
        createSection('2', 'ENGL101', ['TUESDAY', 'THURSDAY'], '09:00', '10:00'),
      ]

      const result = await conflictDetector.detectConflicts(sections, 'student-1')

      expect(result.hasConflicts).toBe(false)
    })
  })

  describe('detectConflicts - Athletic Schedule Conflicts', () => {
    it('should detect conflict with mandatory athletic event', async () => {
      const sections: CourseSectionInfo[] = [
        createSection('1', 'MATH101', ['MONDAY', 'WEDNESDAY'], '15:30', '16:30'),
      ]

      const athleticSchedule = createAthleticSchedule('student-1', [
        {
          type: 'PRACTICE',
          title: 'Team Practice',
          days: ['MONDAY', 'WEDNESDAY', 'FRIDAY'],
          startTime: '15:00',
          endTime: '17:00',
          isMandatory: true,
        },
      ])

      const result = await conflictDetector.detectConflicts(
        sections,
        'student-1',
        athleticSchedule
      )

      expect(result.hasConflicts).toBe(true)
      const athleticConflict = result.conflicts.find(
        (c) => c.conflictType === 'ATHLETIC_CONFLICT'
      )
      expect(athleticConflict).toBeDefined()
      expect(athleticConflict?.severity).toBe('CRITICAL')
    })

    it('should detect non-mandatory athletic conflict as HIGH severity', async () => {
      const sections: CourseSectionInfo[] = [
        createSection('1', 'MATH101', ['TUESDAY'], '14:00', '15:00'),
      ]

      const athleticSchedule = createAthleticSchedule('student-1', [
        {
          type: 'CONDITIONING',
          title: 'Optional Conditioning',
          days: ['TUESDAY', 'THURSDAY'],
          startTime: '14:00',
          endTime: '15:30',
          isMandatory: false,
        },
      ])

      const result = await conflictDetector.detectConflicts(
        sections,
        'student-1',
        athleticSchedule
      )

      expect(result.hasConflicts).toBe(true)
      const athleticConflict = result.conflicts.find(
        (c) => c.conflictType === 'ATHLETIC_CONFLICT'
      )
      expect(athleticConflict?.severity).toBe('HIGH')
    })

    it('should detect game day conflicts', async () => {
      const sections: CourseSectionInfo[] = [
        createSection('1', 'MATH101', ['SATURDAY'], '13:00', '14:00'),
      ]

      const athleticSchedule = createAthleticSchedule('student-1', [
        {
          type: 'GAME',
          title: 'Home Game vs Rivals',
          days: ['SATURDAY'],
          startTime: '12:00',
          endTime: '16:00',
          isMandatory: true,
        },
      ])

      const result = await conflictDetector.detectConflicts(
        sections,
        'student-1',
        athleticSchedule
      )

      expect(result.hasConflicts).toBe(true)
      expect(result.conflicts[0].conflictType).toBe('ATHLETIC_CONFLICT')
    })
  })

  describe('detectConflicts - Prerequisite Violations', () => {
    it('should detect missing prerequisites', async () => {
      const sections: CourseSectionInfo[] = [
        createSection('1', 'MATH201', ['MONDAY', 'WEDNESDAY'], '09:00', '10:00', {
          course: {
            id: 'course-1',
            courseCode: 'MATH201',
            courseName: 'Calculus II',
            department: 'MATH',
            credits: 4,
            prerequisites: ['MATH101', 'MATH102'],
          },
        }),
      ]

      // Student has only completed MATH101
      const prerequisiteData = new Map<string, string[]>()
      prerequisiteData.set('course-1', ['MATH101'])

      const result = await conflictDetector.detectConflicts(
        sections,
        'student-1',
        undefined,
        prerequisiteData
      )

      expect(result.hasConflicts).toBe(true)
      const prereqConflict = result.conflicts.find(
        (c) => c.conflictType === 'PREREQUISITE_MISSING'
      )
      expect(prereqConflict).toBeDefined()
      expect(prereqConflict?.description).toContain('MATH102')
    })

    it('should pass when all prerequisites are met', async () => {
      const sections: CourseSectionInfo[] = [
        createSection('1', 'MATH201', ['MONDAY', 'WEDNESDAY'], '09:00', '10:00', {
          course: {
            id: 'course-1',
            courseCode: 'MATH201',
            courseName: 'Calculus II',
            department: 'MATH',
            credits: 4,
            prerequisites: ['MATH101'],
          },
        }),
      ]

      const prerequisiteData = new Map<string, string[]>()
      prerequisiteData.set('course-1', ['MATH101'])

      const result = await conflictDetector.detectConflicts(
        sections,
        'student-1',
        undefined,
        prerequisiteData
      )

      const prereqConflict = result.conflicts.find(
        (c) => c.conflictType === 'PREREQUISITE_MISSING'
      )
      expect(prereqConflict).toBeUndefined()
    })
  })

  describe('detectConflicts - Capacity Conflicts', () => {
    it('should detect full section', async () => {
      const sections: CourseSectionInfo[] = [
        createSection('1', 'MATH101', ['MONDAY'], '09:00', '10:00', {
          capacity: 30,
          enrolled: 30,
          isOpen: false,
        }),
      ]

      const result = await conflictDetector.detectConflicts(sections, 'student-1')

      expect(result.hasConflicts).toBe(true)
      const capacityConflict = result.conflicts.find(
        (c) => c.conflictType === 'CAPACITY_FULL'
      )
      expect(capacityConflict).toBeDefined()
      expect(capacityConflict?.severity).toBe('HIGH')
    })

    it('should not detect conflict for open sections', async () => {
      const sections: CourseSectionInfo[] = [
        createSection('1', 'MATH101', ['MONDAY'], '09:00', '10:00', {
          capacity: 30,
          enrolled: 25,
          isOpen: true,
        }),
      ]

      const result = await conflictDetector.detectConflicts(sections, 'student-1')

      const capacityConflict = result.conflicts.find(
        (c) => c.conflictType === 'CAPACITY_FULL'
      )
      expect(capacityConflict).toBeUndefined()
    })
  })

  describe('detectConflicts - Corequisite Violations', () => {
    it('should detect missing corequisites', async () => {
      const sections: CourseSectionInfo[] = [
        createSection('1', 'CHEM101', ['MONDAY', 'WEDNESDAY'], '09:00', '10:00', {
          course: {
            id: 'chem-101',
            courseCode: 'CHEM101',
            courseName: 'General Chemistry',
            department: 'CHEM',
            credits: 3,
            corequisites: ['chem-101-lab'],
          },
        }),
      ]

      const result = await conflictDetector.detectConflicts(sections, 'student-1')

      expect(result.hasConflicts).toBe(true)
      const coreqConflict = result.conflicts.find(
        (c) => c.conflictType === 'COREQUISITE_MISSING'
      )
      expect(coreqConflict).toBeDefined()
    })

    it('should pass when corequisite is in schedule', async () => {
      const sections: CourseSectionInfo[] = [
        createSection('1', 'CHEM101', ['MONDAY', 'WEDNESDAY'], '09:00', '10:00', {
          course: {
            id: 'chem-101',
            courseCode: 'CHEM101',
            courseName: 'General Chemistry',
            department: 'CHEM',
            credits: 3,
            corequisites: ['chem-101-lab'],
          },
        }),
        createSection('2', 'CHEM101L', ['THURSDAY'], '14:00', '17:00', {
          course: {
            id: 'chem-101-lab',
            courseCode: 'CHEM101L',
            courseName: 'General Chemistry Lab',
            department: 'CHEM',
            credits: 1,
          },
        }),
      ]

      const result = await conflictDetector.detectConflicts(sections, 'student-1')

      const coreqConflict = result.conflicts.find(
        (c) => c.conflictType === 'COREQUISITE_MISSING'
      )
      expect(coreqConflict).toBeUndefined()
    })
  })

  describe('detectConflicts - Warnings', () => {
    it('should warn about heavy credit load', async () => {
      const sections: CourseSectionInfo[] = [
        createSection('1', 'MATH101', ['MONDAY'], '09:00', '10:00', {
          course: { id: '1', courseCode: 'MATH101', courseName: 'Math', department: 'MATH', credits: 4 },
        }),
        createSection('2', 'ENGL101', ['MONDAY'], '11:00', '12:00', {
          course: { id: '2', courseCode: 'ENGL101', courseName: 'English', department: 'ENGL', credits: 4 },
        }),
        createSection('3', 'PHYS101', ['TUESDAY'], '09:00', '10:00', {
          course: { id: '3', courseCode: 'PHYS101', courseName: 'Physics', department: 'PHYS', credits: 4 },
        }),
        createSection('4', 'CHEM101', ['TUESDAY'], '11:00', '12:00', {
          course: { id: '4', courseCode: 'CHEM101', courseName: 'Chemistry', department: 'CHEM', credits: 4 },
        }),
        createSection('5', 'BIO101', ['WEDNESDAY'], '09:00', '10:00', {
          course: { id: '5', courseCode: 'BIO101', courseName: 'Biology', department: 'BIO', credits: 4 },
        }),
      ]

      const result = await conflictDetector.detectConflicts(sections, 'student-1')

      expect(result.warnings.some((w) => w.includes('credit hours'))).toBe(true)
    })

    it('should warn about many classes on same day', async () => {
      const sections: CourseSectionInfo[] = [
        createSection('1', 'MATH101', ['MONDAY'], '08:00', '09:00'),
        createSection('2', 'ENGL101', ['MONDAY'], '10:00', '11:00'),
        createSection('3', 'PHYS101', ['MONDAY'], '12:00', '13:00'),
        createSection('4', 'CHEM101', ['MONDAY'], '14:00', '15:00'),
      ]

      const result = await conflictDetector.detectConflicts(sections, 'student-1')

      expect(result.warnings.some((w) => w.includes('MONDAY'))).toBe(true)
    })
  })

  describe('Complex Scheduling Scenarios', () => {
    it('should handle comprehensive schedule with multiple conflict types', async () => {
      const sections: CourseSectionInfo[] = [
        // Time conflict pair
        createSection('1', 'MATH101', ['MONDAY', 'WEDNESDAY'], '09:00', '10:00'),
        createSection('2', 'ENGL101', ['MONDAY', 'WEDNESDAY'], '09:30', '10:30'),
        // Full section
        createSection('3', 'PHYS101', ['TUESDAY'], '14:00', '15:00', {
          capacity: 25,
          enrolled: 25,
          isOpen: false,
        }),
        // Missing corequisite
        createSection('4', 'CHEM101', ['THURSDAY'], '09:00', '10:00', {
          course: {
            id: 'chem-101',
            courseCode: 'CHEM101',
            courseName: 'Chemistry',
            department: 'CHEM',
            credits: 3,
            corequisites: ['chem-lab'],
          },
        }),
      ]

      const athleticSchedule = createAthleticSchedule('student-1', [
        {
          days: ['TUESDAY'],
          startTime: '14:00',
          endTime: '16:00',
          isMandatory: true,
        },
      ])

      const result = await conflictDetector.detectConflicts(
        sections,
        'student-1',
        athleticSchedule
      )

      expect(result.hasConflicts).toBe(true)

      // Check for different conflict types
      const conflictTypes = result.conflicts.map((c) => c.conflictType)
      expect(conflictTypes).toContain('TIME_CONFLICT')
      expect(conflictTypes).toContain('CAPACITY_FULL')
      expect(conflictTypes).toContain('ATHLETIC_CONFLICT')
      expect(conflictTypes).toContain('COREQUISITE_MISSING')
    })
  })
})
