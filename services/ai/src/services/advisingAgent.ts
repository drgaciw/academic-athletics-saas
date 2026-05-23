import { generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'
import { prisma } from '@aah/database'
import {
  CourseRecommendation,
  AdvisingRecommendation,
  ScheduleConflict,
} from '../types'
import { AI_CONFIG } from '../config'

const CourseRecommendationSchema = z.object({
  courses: z.array(
    z.object({
      courseCode: z.string(),
      courseName: z.string(),
      credits: z.number(),
      reason: z.string(),
      priority: z.enum(['required', 'recommended', 'elective']),
      conflicts: z.array(
        z.object({
          type: z.enum(['athletic_event', 'travel', 'time_overlap', 'workload']),
          severity: z.enum(['blocking', 'warning', 'info']),
          description: z.string(),
        })
      ),
      confidence: z.number(),
    })
  ),
  totalCredits: z.number(),
  workloadAssessment: z.object({
    recommendation: z.enum(['light', 'moderate', 'heavy', 'overload']),
    reasoning: z.string(),
  }),
  reasoning: z.string(),
})

export class AdvisingAgent {
  /**
   * Recommend courses for a student
   */
  async recommendCourses(
    studentId: string,
    term: string,
    options: {
      preferredCourses?: string[]
      maxCredits?: number
      constraints?: {
        preferredDays?: string[]
        avoidMornings?: boolean
      }
    } = {}
  ): Promise<AdvisingRecommendation> {
    const student = await this.getStudentData(studentId)
    if (!student) {
      throw new Error('Student not found')
    }

    const availableCourses = await this.getAvailableCourses(term, student.major)
    const degreeRequirements = await this.getDegreeRequirements(
      studentId,
      student.major
    )
    const athleticSchedule = await this.getAthleticSchedule(studentId, term)
    const prompt = this.buildAdvisingPrompt(
      student,
      availableCourses,
      degreeRequirements,
      athleticSchedule,
      term,
      options
    )

    try {
      const { object: parsed } = await generateObject({
        model: openai(AI_CONFIG.models.advanced),
        schema: CourseRecommendationSchema,
        prompt,
        temperature: 0.2,
      })

      const recommendations: CourseRecommendation[] = parsed.courses.map((course) => ({
        courseId: course.courseCode,
        courseCode: course.courseCode,
        courseName: course.courseName,
        credits: course.credits,
        reason: course.reason,
        priority: course.priority,
        conflicts: course.conflicts as ScheduleConflict[],
        prerequisites: { met: true, missing: [] },
        confidence: course.confidence,
      }))

      return {
        studentId,
        term,
        recommendations,
        totalCredits: parsed.totalCredits,
        workloadAssessment: {
          athleticHours: athleticSchedule.totalHours,
          academicHours: parsed.totalCredits * 3,
          totalHours:
            athleticSchedule.totalHours + parsed.totalCredits * 3,
          recommendation: parsed.workloadAssessment.recommendation,
        },
        reasoning: parsed.reasoning,
        alternatives: [],
      }
    } catch (error) {
      console.error('Error generating course recommendations:', error)
      throw new Error(
        `Failed to generate recommendations: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Get student data from database
   */
  private async getStudentData(studentId: string) {
    const profile = await prisma.studentProfile.findUnique({
      where: { studentId },
      include: {
        user: true,
      },
    })

    if (!profile) return null

    return {
      studentId: profile.studentId,
      name: `${profile.user.firstName} ${profile.user.lastName}`,
      major: profile.major || 'Undeclared',
      gpa: profile.gpa || 0,
      creditHours: profile.creditHours,
      sport: profile.sport,
      academicStanding: profile.academicStanding || 'GOOD_STANDING',
    }
  }

  /**
   * Get available courses for term
   */
  private async getAvailableCourses(
    term: string,
    major: string
  ): Promise<
    Array<{
      code: string
      name: string
      credits: number
      days: string[]
      time: string
      prerequisites: string[]
    }>
  > {
    return [
      {
        code: 'MATH 301',
        name: 'Calculus III',
        credits: 4,
        days: ['Mon', 'Wed', 'Fri'],
        time: '9:00-10:00',
        prerequisites: ['MATH 201'],
      },
      {
        code: 'PHYS 201',
        name: 'Physics I',
        credits: 4,
        days: ['Tue', 'Thu'],
        time: '11:00-12:30',
        prerequisites: [],
      },
      {
        code: 'ENGL 202',
        name: 'American Literature',
        credits: 3,
        days: ['Mon', 'Wed'],
        time: '2:00-3:30',
        prerequisites: ['ENGL 101'],
      },
    ]
  }

  /**
   * Get degree requirements
   */
  private async getDegreeRequirements(studentId: string, major: string) {
    const profile = await prisma.studentProfile.findUnique({
      where: { studentId },
    })

    if (!profile) {
      return {
        totalRequired: 120,
        completed: 0,
        remaining: 120,
        requirementsMet: [] as string[],
        requirementsPending: [] as string[],
      }
    }

    const progressRecords = await prisma.degreeProgress.findMany({
      where: { studentId: profile.id },
      orderBy: { createdAt: 'desc' },
    })

    const completed = progressRecords
      .filter((record) => record.status === 'COMPLETED')
      .reduce((sum, record) => sum + record.credits, 0)

    const totalRequired = 120

    return {
      totalRequired,
      completed,
      remaining: Math.max(totalRequired - completed, 0),
      requirementsMet: progressRecords
        .filter((record) => record.status === 'COMPLETED' && record.satisfiesRequirement)
        .map((record) => record.satisfiesRequirement as string),
      requirementsPending: progressRecords
        .filter((record) => record.status !== 'COMPLETED' && record.satisfiesRequirement)
        .map((record) => record.satisfiesRequirement as string),
    }
  }

  /**
   * Get athletic schedule
   */
  private async getAthleticSchedule(
    studentId: string,
    term: string
  ): Promise<{
    events: Array<{ type: string; day: string; time: string; hours: number }>
    totalHours: number
  }> {
    return {
      events: [
        { type: 'Practice', day: 'Mon', time: '3:00-6:00', hours: 3 },
        { type: 'Practice', day: 'Tue', time: '3:00-6:00', hours: 3 },
        { type: 'Practice', day: 'Wed', time: '3:00-6:00', hours: 3 },
        { type: 'Practice', day: 'Thu', time: '3:00-6:00', hours: 3 },
        { type: 'Game', day: 'Sat', time: '1:00-5:00', hours: 4 },
      ],
      totalHours: 16,
    }
  }

  /**
   * Build advising prompt
   */
  private buildAdvisingPrompt(
    student: any,
    availableCourses: any[],
    degreeRequirements: any,
    athleticSchedule: any,
    term: string,
    options: any
  ): string {
    return AI_CONFIG.promptTemplates.courseRecommendation
      .replace('{studentName}', student.name)
      .replace('{major}', student.major)
      .replace('{gpa}', student.gpa.toString())
      .replace('{credits}', student.creditHours.toString())
      .replace('{sport}', student.sport)
      .replace(
        '{athleticSchedule}',
        JSON.stringify(athleticSchedule.events, null, 2)
      )
      .replace('{degreeRequirements}', JSON.stringify(degreeRequirements, null, 2))
      .replace('{availableCourses}', JSON.stringify(availableCourses, null, 2))
      .replace('{numCourses}', options.maxCredits ? '4-5' : '4')
      .replace('{term}', term)
  }

  async detectConflicts(
    studentId: string,
    proposedCourses: string[]
  ): Promise<ScheduleConflict[]> {
    const conflicts: ScheduleConflict[] = []

    for (const courseCode of proposedCourses) {
      if (courseCode.includes('MATH')) {
        conflicts.push({
          type: 'time_overlap',
          severity: 'warning',
          description: 'Course time overlaps with practice on Mondays',
          affectedCourse: courseCode,
          suggestion: 'Consider evening section if available',
        })
      }
    }

    return conflicts
  }

  async validatePrerequisites(
    studentId: string,
    courseCode: string
  ): Promise<{ met: boolean; missing: string[] }> {
    return {
      met: true,
      missing: [],
    }
  }

  calculateWorkload(
    creditHours: number,
    athleticHours: number
  ): {
    total: number
    assessment: 'light' | 'moderate' | 'heavy' | 'overload'
    recommendation: string
  } {
    const academicHours = creditHours * 3
    const total = academicHours + athleticHours

    let assessment: 'light' | 'moderate' | 'heavy' | 'overload'
    let recommendation: string

    if (total < 40) {
      assessment = 'light'
      recommendation = 'Good balance. Consider additional credit hours if possible.'
    } else if (total <= 55) {
      assessment = 'moderate'
      recommendation = 'Balanced workload for a student-athlete.'
    } else if (total <= 65) {
      assessment = 'heavy'
      recommendation =
        'Challenging workload. Ensure adequate support services are in place.'
    } else {
      assessment = 'overload'
      recommendation =
        'Very high workload. Consider reducing credit hours or athletic commitments.'
    }

    return { total, assessment, recommendation }
  }
}

export const advisingAgent = new AdvisingAgent()
