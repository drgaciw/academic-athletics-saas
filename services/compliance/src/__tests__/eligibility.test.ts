/**
 * Compliance Service Tests
 * Example test cases demonstrating NCAA rule validation
 */

import {
  validate16CoreCourses,
  validate10of7Rule,
  validateCoreGPA,
  validateTestScores,
  calculateCoreGPA,
  getMinimumTestScores,
} from '../services/initialEligibility'
import {
  validate24_18Rule,
  validate40_60_80Rule,
  validateGPAThresholds,
  validateFullTimeEnrollment,
} from '../services/continuingEligibility'
import { StudentData, CoreCourse, CoreCourseCategory } from '../types'

describe('Initial Eligibility - 16 Core Courses', () => {
  it('should pass with 16 core courses', async () => {
    const coreCourses: CoreCourse[] = Array.from({ length: 16 }, (_, i) => ({
      id: `course-${i}`,
      subject: 'Test',
      courseNumber: `${i}`,
      name: `Course ${i}`,
      grade: 'A',
      gradePoints: 4.0,
      creditHours: 1.0,
      category: CoreCourseCategory.ENGLISH,
      completedBeforeSeniorYear: i < 10,
    }))

    const student: StudentData = {
      id: 'student-1',
      academicYear: 1,
      cumulativeGpa: 3.5,
      totalCreditHours: 16,
      degreeRequirementHours: 120,
      progressTowardDegree: 0,
      coreCourses,
    }

    const result = validate16CoreCourses(student)
    expect(result.isEligible).toBe(true)
    expect(result.violations).toHaveLength(0)
  })

  it('should fail with 14 core courses', async () => {
    const coreCourses: CoreCourse[] = Array.from({ length: 14 }, (_, i) => ({
      id: `course-${i}`,
      subject: 'Test',
      courseNumber: `${i}`,
      name: `Course ${i}`,
      grade: 'A',
      gradePoints: 4.0,
      creditHours: 1.0,
      category: CoreCourseCategory.ENGLISH,
      completedBeforeSeniorYear: true,
    }))

    const student: StudentData = {
      id: 'student-1',
      academicYear: 1,
      cumulativeGpa: 3.5,
      totalCreditHours: 14,
      degreeRequirementHours: 120,
      progressTowardDegree: 0,
      coreCourses,
    }

    const result = validate16CoreCourses(student)
    expect(result.isEligible).toBe(false)
    expect(result.violations).toHaveLength(1)
    expect(result.violations[0].ruleName).toContain('16 Core Courses')
  })
})

describe('Initial Eligibility - 10/7 Rule', () => {
  it('should pass with 10 courses before senior year (7 in EMS)', async () => {
    const coreCourses: CoreCourse[] = [
      ...Array.from({ length: 7 }, (_, i) => ({
        id: `course-${i}`,
        subject: 'English',
        courseNumber: `${i}`,
        name: `Course ${i}`,
        grade: 'A',
        gradePoints: 4.0,
        creditHours: 1.0,
        category: CoreCourseCategory.ENGLISH,
        completedBeforeSeniorYear: true,
      })),
      ...Array.from({ length: 3 }, (_, i) => ({
        id: `course-${i + 7}`,
        subject: 'History',
        courseNumber: `${i}`,
        name: `Course ${i}`,
        grade: 'A',
        gradePoints: 4.0,
        creditHours: 1.0,
        category: CoreCourseCategory.SOCIAL_SCIENCE,
        completedBeforeSeniorYear: true,
      })),
      ...Array.from({ length: 6 }, (_, i) => ({
        id: `course-${i + 10}`,
        subject: 'Art',
        courseNumber: `${i}`,
        name: `Course ${i}`,
        grade: 'A',
        gradePoints: 4.0,
        creditHours: 1.0,
        category: CoreCourseCategory.ADDITIONAL_ACADEMIC,
        completedBeforeSeniorYear: false,
      })),
    ]

    const student: StudentData = {
      id: 'student-1',
      academicYear: 1,
      cumulativeGpa: 3.5,
      totalCreditHours: 16,
      degreeRequirementHours: 120,
      progressTowardDegree: 0,
      coreCourses,
    }

    const result = validate10of7Rule(student)
    expect(result.isEligible).toBe(true)
    expect(result.violations).toHaveLength(0)
  })

  it('should fail with only 5 EMS courses before senior year', async () => {
    const coreCourses: CoreCourse[] = [
      ...Array.from({ length: 5 }, (_, i) => ({
        id: `course-${i}`,
        subject: 'English',
        courseNumber: `${i}`,
        name: `Course ${i}`,
        grade: 'A',
        gradePoints: 4.0,
        creditHours: 1.0,
        category: CoreCourseCategory.ENGLISH,
        completedBeforeSeniorYear: true,
      })),
      ...Array.from({ length: 5 }, (_, i) => ({
        id: `course-${i + 5}`,
        subject: 'History',
        courseNumber: `${i}`,
        name: `Course ${i}`,
        grade: 'A',
        gradePoints: 4.0,
        creditHours: 1.0,
        category: CoreCourseCategory.SOCIAL_SCIENCE,
        completedBeforeSeniorYear: true,
      })),
    ]

    const student: StudentData = {
      id: 'student-1',
      academicYear: 1,
      cumulativeGpa: 3.5,
      totalCreditHours: 10,
      degreeRequirementHours: 120,
      progressTowardDegree: 0,
      coreCourses,
    }

    const result = validate10of7Rule(student)
    expect(result.isEligible).toBe(false)
    expect(result.violations.length).toBeGreaterThan(0)
  })
})

describe('Initial Eligibility - Core GPA', () => {
  it('should calculate core GPA correctly', () => {
    const coreCourses: CoreCourse[] = [
      {
        id: 'course-1',
        subject: 'English',
        courseNumber: '101',
        name: 'English',
        grade: 'A',
        gradePoints: 4.0,
        creditHours: 1.0,
        category: CoreCourseCategory.ENGLISH,
        completedBeforeSeniorYear: true,
      },
      {
        id: 'course-2',
        subject: 'Math',
        courseNumber: '101',
        name: 'Math',
        grade: 'B',
        gradePoints: 3.0,
        creditHours: 1.0,
        category: CoreCourseCategory.MATH,
        completedBeforeSeniorYear: true,
      },
    ]

    const gpa = calculateCoreGPA(coreCourses)
    expect(gpa).toBe(3.5)
  })

  it('should pass with 2.3 core GPA', () => {
    const student: StudentData = {
      id: 'student-1',
      academicYear: 1,
      cumulativeGpa: 2.3,
      totalCreditHours: 16,
      degreeRequirementHours: 120,
      progressTowardDegree: 0,
      coreCourses: Array.from({ length: 16 }, (_, i) => ({
        id: `course-${i}`,
        subject: 'Test',
        courseNumber: `${i}`,
        name: `Course ${i}`,
        grade: 'C+',
        gradePoints: 2.3,
        creditHours: 1.0,
        category: CoreCourseCategory.ENGLISH,
        completedBeforeSeniorYear: true,
      })),
    }

    const result = validateCoreGPA(student)
    expect(result.isEligible).toBe(true)
  })

  it('should fail with 2.1 core GPA', () => {
    const student: StudentData = {
      id: 'student-1',
      academicYear: 1,
      cumulativeGpa: 2.1,
      totalCreditHours: 16,
      degreeRequirementHours: 120,
      progressTowardDegree: 0,
      coreCourses: Array.from({ length: 16 }, (_, i) => ({
        id: `course-${i}`,
        subject: 'Test',
        courseNumber: `${i}`,
        name: `Course ${i}`,
        grade: 'C',
        gradePoints: 2.1,
        creditHours: 1.0,
        category: CoreCourseCategory.ENGLISH,
        completedBeforeSeniorYear: true,
      })),
    }

    const result = validateCoreGPA(student)
    expect(result.isEligible).toBe(false)
    expect(result.violations[0].message).toContain('2.3')
  })
})

describe('Initial Eligibility - Sliding Scale', () => {
  it('should return correct minimum test scores for 3.0 GPA', () => {
    const { minSat, minAct } = getMinimumTestScores(3.0)
    expect(minSat).toBe(620)
    expect(minAct).toBe(59)
  })

  it('should return lowest score for 3.55+ GPA', () => {
    const { minSat, minAct } = getMinimumTestScores(3.6)
    expect(minSat).toBe(400)
    expect(minAct).toBe(37)
  })

  it('should pass with SAT 1200 and 3.0 GPA', () => {
    const student: StudentData = {
      id: 'student-1',
      academicYear: 1,
      cumulativeGpa: 3.0,
      totalCreditHours: 16,
      degreeRequirementHours: 120,
      progressTowardDegree: 0,
      coreCourses: [],
      testScores: {
        satTotal: 1200,
      },
    }

    // Mock core courses with 3.0 GPA
    student.coreCourses = Array.from({ length: 16 }, (_, i) => ({
      id: `course-${i}`,
      subject: 'Test',
      courseNumber: `${i}`,
      name: `Course ${i}`,
      grade: 'B',
      gradePoints: 3.0,
      creditHours: 1.0,
      category: CoreCourseCategory.ENGLISH,
      completedBeforeSeniorYear: true,
    }))

    const result = validateTestScores(student)
    expect(result.isEligible).toBe(true)
  })
})

describe('Continuing Eligibility - 24/18 Rule', () => {
  it('should pass with 18+ hours in previous year', () => {
    const student: StudentData = {
      id: 'student-1',
      academicYear: 2,
      cumulativeGpa: 2.5,
      totalCreditHours: 48,
      creditHoursPreviousTerm: 20,
      degreeRequirementHours: 120,
      progressTowardDegree: 40,
    }

    const result = validate24_18Rule(student)
    expect(result.isEligible).toBe(true)
  })

  it('should fail with 15 hours in previous year', () => {
    const student: StudentData = {
      id: 'student-1',
      academicYear: 2,
      cumulativeGpa: 2.5,
      totalCreditHours: 45,
      creditHoursPreviousTerm: 15,
      degreeRequirementHours: 120,
      progressTowardDegree: 40,
    }

    const result = validate24_18Rule(student)
    expect(result.isEligible).toBe(false)
    expect(result.violations[0].message).toContain('18')
  })
})

describe('Continuing Eligibility - 40/60/80 Rule', () => {
  it('should pass year 2 with 40% progress', () => {
    const student: StudentData = {
      id: 'student-1',
      academicYear: 2,
      cumulativeGpa: 2.5,
      totalCreditHours: 48,
      degreeRequirementHours: 120,
      progressTowardDegree: 40,
    }

    const result = validate40_60_80Rule(student)
    expect(result.isEligible).toBe(true)
  })

  it('should fail year 3 with 50% progress (needs 60%)', () => {
    const student: StudentData = {
      id: 'student-1',
      academicYear: 3,
      cumulativeGpa: 2.5,
      totalCreditHours: 60,
      degreeRequirementHours: 120,
      progressTowardDegree: 50,
    }

    const result = validate40_60_80Rule(student)
    expect(result.isEligible).toBe(false)
    expect(result.violations[0].message).toContain('60%')
  })
})

describe('Continuing Eligibility - GPA Thresholds', () => {
  it('should pass year 1 with 1.8 GPA', () => {
    const student: StudentData = {
      id: 'student-1',
      academicYear: 1,
      cumulativeGpa: 1.8,
      totalCreditHours: 24,
      degreeRequirementHours: 120,
      progressTowardDegree: 20,
    }

    const result = validateGPAThresholds(student)
    expect(result.isEligible).toBe(true)
  })

  it('should fail year 4 with 1.9 GPA (needs 2.0)', () => {
    const student: StudentData = {
      id: 'student-1',
      academicYear: 4,
      cumulativeGpa: 1.9,
      totalCreditHours: 96,
      degreeRequirementHours: 120,
      progressTowardDegree: 80,
    }

    const result = validateGPAThresholds(student)
    expect(result.isEligible).toBe(false)
    expect(result.violations[0].message).toContain('2.0')
  })
})

describe('Continuing Eligibility - Full-Time Enrollment', () => {
  it('should pass with 12 credit hours', () => {
    const student: StudentData = {
      id: 'student-1',
      academicYear: 2,
      cumulativeGpa: 2.5,
      totalCreditHours: 36,
      creditHoursThisTerm: 12,
      degreeRequirementHours: 120,
      progressTowardDegree: 30,
    }

    const result = validateFullTimeEnrollment(student)
    expect(result.isEligible).toBe(true)
  })

  it('should fail with 9 credit hours', () => {
    const student: StudentData = {
      id: 'student-1',
      academicYear: 2,
      cumulativeGpa: 2.5,
      totalCreditHours: 33,
      creditHoursThisTerm: 9,
      degreeRequirementHours: 120,
      progressTowardDegree: 28,
    }

    const result = validateFullTimeEnrollment(student)
    expect(result.isEligible).toBe(false)
    expect(result.violations[0].message).toContain('12')
  })
})
