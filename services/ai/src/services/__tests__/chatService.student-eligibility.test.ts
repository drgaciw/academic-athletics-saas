jest.mock('@ai-sdk/openai', () => ({
  openai: jest.fn(),
}))

jest.mock('@ai-sdk/anthropic', () => ({
  anthropic: jest.fn(),
}))

import { generateText } from 'ai'
import { ChatService } from '../chatService'
import { loadStudentEligibilityGate, resolveDbUserId } from '../studentEligibilityContext'
import { ragPipeline } from '../ragPipeline'

jest.mock('ai', () => ({
  generateText: jest.fn(),
  streamText: jest.fn(),
}))

jest.mock('../ragPipeline', () => ({
  ragPipeline: {
    query: jest.fn(),
  },
}))

jest.mock('../studentEligibilityContext', () => ({
  resolveDbUserId: jest.fn(),
  loadStudentEligibilityGate: jest.fn(),
}))

jest.mock('@aah/database', () => ({
  prisma: {
    conversation: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    message: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  },
}))

const { prisma } = jest.requireMock('@aah/database') as {
  prisma: {
    conversation: {
      findUnique: jest.Mock
      create: jest.Mock
      update: jest.Mock
    }
    message: {
      findMany: jest.Mock
      create: jest.Mock
    }
  }
}

const mockGenerateText = generateText as jest.MockedFunction<typeof generateText>
const mockRagQuery = ragPipeline.query as jest.Mock
const mockResolveDbUserId = resolveDbUserId as jest.MockedFunction<typeof resolveDbUserId>
const mockLoadGate = loadStudentEligibilityGate as jest.MockedFunction<typeof loadStudentEligibilityGate>

describe('ChatService student eligibility (PRD v2.2)', () => {
  const service = new ChatService()

  beforeEach(() => {
    jest.clearAllMocks()
    mockResolveDbUserId.mockResolvedValue('db-student-1')
    prisma.conversation.findUnique.mockResolvedValue(null)
    prisma.conversation.create.mockResolvedValue({ id: 'conv-1', userId: 'db-student-1' })
    prisma.conversation.update.mockResolvedValue({})
    prisma.message.findMany.mockResolvedValue([])
    prisma.message.create.mockResolvedValue({ id: 'msg-1' })
    mockRagQuery.mockResolvedValue({ sources: [], validation: { valid: true } })
    mockGenerateText.mockResolvedValue({
      text: 'Placeholder model output.',
      usage: { inputTokens: 10, outputTokens: 20, totalTokens: 30 },
    } as Awaited<ReturnType<typeof generateText>>)
  })

  it('STUDENT + missing GPA snapshot: response avoids definitive verdict and references data gaps', async () => {
    mockLoadGate.mockResolvedValue({
      hasRecordedComplianceReview: false,
      snapshotLines: [
        'Data gaps to highlight: cumulative GPA not on file.',
        'No compliance-reviewed eligibility record found yet for recent terms.',
      ],
    })
    mockGenerateText.mockResolvedValue({
      text: 'You are eligible to compete next semester based on your file.',
      usage: { inputTokens: 10, outputTokens: 20, totalTokens: 30 },
    } as Awaited<ReturnType<typeof generateText>>)

    const result = await service.chatSync('clerk-student', 'Am I eligible for NCAA competition?', {
      userRole: 'STUDENT',
    })

    const lower = result.response.toLowerCase()
    expect(lower).not.toMatch(/\byou are eligible\b/)
    expect(lower).not.toMatch(/\bcleared to compete\b/)
    expect(result.response).toMatch(/preliminary decision support|compliance office/i)
    expect(mockLoadGate).toHaveBeenCalledWith('db-student-1')
  })

  it('STUDENT + zero RAG sources: system guidance stresses uncertainty and compliance escalation', async () => {
    mockLoadGate.mockResolvedValue({
      hasRecordedComplianceReview: false,
      snapshotLines: ['Data gaps to highlight: cumulative GPA not on file.'],
    })
    mockRagQuery.mockResolvedValue({ sources: [], validation: { valid: false } })
    mockGenerateText.mockImplementation(async (opts) => {
      const system = opts.messages?.find((m) => m.role === 'system')
      const systemText =
        typeof system?.content === 'string' ? system.content : String(system?.content ?? '')
      expect(systemText).toMatch(/no relevant policy sources were retrieved/i)
      expect(systemText).toMatch(/compliance staff|athletics compliance/i)
      return {
        text: 'I cannot confirm eligibility without more information.',
        usage: { inputTokens: 5, outputTokens: 10, totalTokens: 15 },
      } as Awaited<ReturnType<typeof generateText>>
    })

    await service.chatSync('clerk-student', 'Am I eligible under NCAA rules?', {
      userRole: 'STUDENT',
    })
  })

  it('STUDENT: forbidden model phrasing is rewritten before returning to client', async () => {
    mockLoadGate.mockResolvedValue({
      hasRecordedComplianceReview: false,
      snapshotLines: [],
    })
    mockGenerateText.mockResolvedValue({
      text: 'Great news — you are cleared to compete this term!',
      usage: { inputTokens: 10, outputTokens: 20, totalTokens: 30 },
    } as Awaited<ReturnType<typeof generateText>>)

    const result = await service.chatSync('clerk-student', 'Can I play this season?', {
      userRole: 'STUDENT',
    })

    expect(result.response.toLowerCase()).not.toContain('cleared to compete')
    expect(result.response).toContain('preliminary decision support')
  })

  it('COACH: does not apply student forbidden-phrase guard', async () => {
    mockLoadGate.mockResolvedValue({
      hasRecordedComplianceReview: false,
      snapshotLines: [],
    })
    const coachText = 'You are eligible to compete this term per our review.'
    mockGenerateText.mockResolvedValue({
      text: coachText,
      usage: { inputTokens: 10, outputTokens: 20, totalTokens: 30 },
    } as Awaited<ReturnType<typeof generateText>>)

    const result = await service.chatSync('coach-1', 'Summarize eligibility for the roster.', {
      userRole: 'COACH',
    })

    expect(result.response).toBe(coachText)
    expect(mockLoadGate).not.toHaveBeenCalled()
  })
})
