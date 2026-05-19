import { generateText, tool } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'

export const runtime = 'edge'

const BLOCKED_ELIGIBILITY_PATTERNS = [
  /\byou are eligible\b/gi,
  /\byou'?re eligible\b/gi,
  /\byou are ineligible\b/gi,
  /\byou'?re ineligible\b/gi,
  /\bcleared to compete\b/gi,
  /\byou are cleared\b/gi,
  /\bcleared for competition\b/gi,
]

const STUDENT_ELIGIBILITY_REPLACEMENT =
  'I cannot provide an official eligibility determination. Please contact your athletics compliance office for confirmed eligibility status.'

const STUDENT_ELIGIBILITY_DISCLAIMER =
  '\n\n---\nThis is preliminary decision support only. Institutional compliance staff make official eligibility determinations. Contact your athletics compliance office for an authoritative answer.'

function guardStudentEligibilityResponse(text: string): string {
  let guardedText = text
  let wasModified = false

  for (const pattern of BLOCKED_ELIGIBILITY_PATTERNS) {
    const nextText = guardedText.replace(pattern, STUDENT_ELIGIBILITY_REPLACEMENT)
    if (nextText !== guardedText) {
      guardedText = nextText
      wasModified = true
    }
  }

  const lower = guardedText.toLowerCase()
  const referencesEligibility =
    lower.includes('eligib') ||
    lower.includes('ncaa') ||
    lower.includes('progress toward') ||
    (lower.includes('compliance') && lower.includes('elig'))

  if ((wasModified || referencesEligibility) && !lower.includes('preliminary decision support')) {
    guardedText = guardedText.trimEnd() + STUDENT_ELIGIBILITY_DISCLAIMER
  }

  return guardedText
}

export async function POST(req: Request) {
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
        description:
          'Explain that official NCAA eligibility status must be confirmed by athletics compliance staff',
        parameters: z.object({
          studentId: z.string().optional().describe('Student ID to check'),
        }),
        // @ts-ignore - AI SDK tool execute type compatibility
        execute: async ({ studentId }: { studentId?: string }): Promise<any> => {
          // Student-facing chat must never return a final eligibility determination.
          return {
            officialDeterminationAvailable: false,
            message:
              'I cannot provide an official eligibility determination. Please contact your athletics compliance office for confirmed eligibility status.',
            nextSteps: [
              'Ask your compliance office to review your current academic and athletics record.',
              'Use AAH guidance as preliminary decision support only.',
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

Be helpful, accurate, and supportive. Always cite sources when providing information about NCAA rules or academic policies. Do not tell a student-athlete that they are eligible, ineligible, cleared to compete, or cleared for competition; direct them to athletics compliance staff for official determinations.`,
  })

  return new Response(guardStudentEligibilityResponse(result.text), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  })
}
