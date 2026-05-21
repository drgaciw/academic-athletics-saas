import { generateText, tool } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@aah/database'

export const runtime = 'nodejs'

const BLOCKED_ELIGIBILITY_PHRASES = [
  /\byou are eligible\b/gi,
  /\byou'?re eligible\b/gi,
  /\byou are ineligible\b/gi,
  /\byou'?re ineligible\b/gi,
  /\bcleared to compete\b/gi,
  /\byou are cleared\b/gi,
  /\bcleared for competition\b/gi,
]

const STUDENT_ELIGIBILITY_DISCLAIMER =
  '\n\n---\nThis is preliminary decision support only. Institutional compliance staff make official eligibility determinations. Contact your athletics compliance office for an authoritative answer.'

const STUDENT_ELIGIBILITY_REPLACEMENT =
  'Based on the information available here, I cannot provide a final competition eligibility determination. Your athletics compliance office must confirm official status.'

function guardStudentEligibilityText(text: string): string {
  let out = text
  let wasModified = false

  for (const pattern of BLOCKED_ELIGIBILITY_PHRASES) {
    const next = out.replace(pattern, STUDENT_ELIGIBILITY_REPLACEMENT)
    if (next !== out) {
      out = next
      wasModified = true
    }
  }

  const lower = out.toLowerCase()
  const shouldAddDisclaimer =
    wasModified ||
    lower.includes('eligib') ||
    lower.includes('ncaa') ||
    (lower.includes('compliance') && lower.includes('elig')) ||
    lower.includes('progress toward')

  if (shouldAddDisclaimer && !out.includes('preliminary decision support')) {
    return out.trimEnd() + STUDENT_ELIGIBILITY_DISCLAIMER
  }

  return out
}

function toTextStreamResponse(text: string): Response {
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(text))
      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  })
}

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { role: true },
  })

  if (!user || user.role !== 'STUDENT') {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { messages } = await req.json()

  const result = await generateText({
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

  return toTextStreamResponse(guardStudentEligibilityText(result.text))
}