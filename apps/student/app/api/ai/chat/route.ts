import { streamText, tool } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'

export const runtime = 'edge'

export async function POST(req: Request) {
  const { messages } = await req.json()

  const result = streamText({
    model: openai('gpt-5.1-codex-max') as any,
    messages,
    tools: {
      searchCourses: tool({
        description: 'Search for available courses by subject or course code',
        parameters: z.object({
          query: z.string().describe('The search query (subject or course code)'),
          semester: z.string().optional().describe('The semester to search in'),
        }),
        // @ts-ignore - AI SDK tool execute type compatibility
        execute: async ({ query, semester }: { query: string; semester?: string }): Promise<any> => {
          // Mock implementation - replace with actual API call
          return {
            courses: [
              {
                code: 'MATH 301',
                title: 'Advanced Calculus',
                credits: 3,
                available: true,
                prerequisites: ['MATH 201'],
              },
              {
                code: 'MATH 302',
                title: 'Linear Algebra',
                credits: 3,
                available: true,
                prerequisites: ['MATH 201'],
              },
            ],
          }
        },
      }),
      checkEligibility: tool({
        description: 'Check NCAA eligibility status and requirements',
        parameters: z.object({
          studentId: z.string().optional().describe('Student ID to check'),
        }),
        // @ts-ignore - AI SDK tool execute type compatibility
        execute: async ({ studentId }: { studentId?: string }): Promise<any> => {
          // Mock implementation - replace with actual API call
          return {
            status: 'eligible',
            gpa: 3.45,
            creditsEarned: 64,
            creditsRequired: 120,
            nextCheckDate: '2025-08-15',
            requirements: [
              { name: 'Minimum GPA', met: true, value: '3.45 / 2.0' },
              { name: 'Credit Hours', met: true, value: '64 / 60' },
              { name: 'Progress Toward Degree', met: true, value: '53%' },
            ],
          }
        },
      }),
      getSchedule: tool({
        description: 'Get student schedule for a specific week or month',
        parameters: z.object({
          startDate: z.string().describe('Start date in YYYY-MM-DD format'),
          endDate: z.string().describe('End date in YYYY-MM-DD format'),
        }),
        // @ts-ignore - AI SDK tool execute type compatibility
        execute: async ({ startDate, endDate }: { startDate: string; endDate: string }): Promise<any> => {
          // Mock implementation - replace with actual API call
          return {
            events: [
              {
                title: 'MATH 301 - Lecture',
                type: 'class',
                start: '2025-01-20T09:00:00',
                end: '2025-01-20T10:30:00',
                location: 'Science Hall 201',
              },
              {
                title: 'Basketball Practice',
                type: 'practice',
                start: '2025-01-20T15:00:00',
                end: '2025-01-20T17:00:00',
                location: 'Athletic Center',
              },
            ],
          }
        },
      }),
    },
    system: `You are an AI assistant for the Athletic Academics Hub, helping NCAA Division I student-athletes with their academic journey. 
    
You can help with:
- Course selection and prerequisites
- NCAA eligibility requirements
- Academic scheduling and planning
- Study resources and tutoring
- Academic policies and procedures

Be helpful, accurate, and supportive. Always cite sources when providing information about NCAA rules or academic policies.`,
  })

  return result.toTextStreamResponse()
}