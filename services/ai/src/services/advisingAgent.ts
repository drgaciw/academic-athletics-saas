import { ChatOpenAI } from '@langchain/openai'
import { StructuredOutputParser } from 'langchain/output_parsers'
import { PromptTemplate } from '@langchain/core/prompts'
import { z } from 'zod'
import { prisma } from '@aah/database'
import {
  CourseRecommendation,
  AdvisingRecommendation,
  ScheduleConflict,
} from '../types'
import { AI_CONFIG } from '../config'

// Define structured output schema
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
  private llm: ChatOpenAI
  private parser: StructuredOutputParser<z.infer<typeof CourseRecommendationSchema>>

  constructor() {
    this.llm = new ChatOpenAI({
      modelName: AI_CONFIG.models.advanced,
      temperature: 0.2,
      openAIApiKey: AI_CONFIG.openai.apiKey,
    })

    this.parser = StructuredOutputParser.fromZodSchema(CourseRecommendationSchema)
  }

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
    // Fetch student data
    const student = await this.getStudentData(studentId)
    if (!student) {
      throw new Error('Student not found')
    }

    // Fetch available courses for the term
    const availableCourses = await this.getAvailableCourses(term, student.major)

    // Get degree requirements
    const degreeRequirements = await this.getDegreeRequirements(
      studentId,
      student.major
    )

    // Get athletic schedule
    const athleticSchedule = await this.getAthleticSchedule(studentId, term)

    // Build prompt
    const prompt = this.buildAdvisingPrompt(
      student,
      availableCourses,
      degreeRequirements,
      athleticSchedule,
      term,
      options
    )

    // Get LLM recommendation
    try {
      const formatInstructions = this.parser.getFormatInstructions()
      const fullPrompt = `${prompt}\n\n${formatInstructions}`

      const result = await this.llm.invoke(fullPrompt)
      const parsed = await this.parser.parse(result.content.toString())

      // Build recommendation object
      const recommendations: CourseRecommendation[] = parsed.courses.map((course) => ({
        courseId: course.courseCode,
        courseCode: course.courseCode,
        courseName: course.courseName,
        credits: course.credits,
        reason: course.reason,
        priority: course.priority,
        conflicts: course.conflicts as ScheduleConflict[],
        prerequisites: { met: true, missing: [] }, // Would validate in production
        confidence: course.confidence,
      }))

      return {
        studentId,
        term,
        recommendations,
        totalCredits: parsed.totalCredits,
        workloadAssessment: {
          athleticHours: athleticSchedule.totalHours,
          academicHours: parsed.totalCredits * 3, // Estimate 3 hours per credit
          totalHours:
            athleticSchedule.totalHours + parsed.totalCredits * 3,
          recommendation: parsed.workloadAssessment.recommendation,
        },
        reasoning: parsed.reasoning,
        alternatives: [], // Would generate alternatives in production
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
    // In production, this would query course catalog
    // For now, return mock data
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
    const progress = await prisma.degreeProgress.findFirst({
      where: { studentProfileId: studentId },
      orderBy: { assessedAt: 'desc' },
    })

    return {
      totalRequired: progress?.totalRequired || 120,
      completed: progress?.completed || 0,
      remaining: progress?.remaining || 120,
      requirementsMet: progress?.requirementsMet || [],
      requirementsPending: progress?.requirementsPending || [],
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
    const profile = await prisma.studentProfile.findUnique({
      where: { studentId },
    })

    // In production, parse athleticSchedule JSON
    // For now, return mock data
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

  /**
   * Detect schedule conflicts
   */
  async detectConflicts(
    studentId: string,
    proposedCourses: string[]
  ): Promise<ScheduleConflict[]> {
    const conflicts: ScheduleConflict[] = []

    // Get student's athletic schedule
    const athleticSchedule = await this.getAthleticSchedule(studentId, 'current')

    // Check each course for conflicts
    for (const courseCode of proposedCourses) {
      // In production, fetch actual course times and check against athletic schedule
      // For now, return mock conflicts
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

  /**
   * Validate course prerequisites
   */
  async validatePrerequisites(
    studentId: string,
    courseCode: string
  ): Promise<{ met: boolean; missing: string[] }> {
    // In production, check student's completed courses against prerequisites
    // For now, return mock data
    return {
      met: true,
      missing: [],
    }
  }

  /**
   * Calculate academic workload
   */
  calculateWorkload(
    creditHours: number,
    athleticHours: number
  ): {
    total: number
    assessment: 'light' | 'moderate' | 'heavy' | 'overload'
    recommendation: string
  } {
    const academicHours = creditHours * 3 // Rule of thumb: 3 hours per credit
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
