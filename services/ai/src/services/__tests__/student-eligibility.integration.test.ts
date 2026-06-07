import { Hono } from 'hono'
import { chatRouter } from '../../routes/chat'
import { chatService } from '../chatService'

jest.mock('../chatService', () => ({
  chatService: {
    chat: jest.fn(),
    chatSync: jest.fn(),
  },
}))

const mockChatSync = chatService.chatSync as jest.Mock

describe('POST /api/ai/chat student eligibility (G3)', () => {
  const app = new Hono().route('/', chatRouter)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('STUDENT non-streaming: returns guard-rewritten text, not raw forbidden finals', async () => {
    mockChatSync.mockResolvedValue({
      conversationId: 'conv-int-1',
      response:
        'This is preliminary decision support only. Contact your athletics compliance office for an official determination.',
      model: 'gpt-4o-mini',
      tokenUsage: { prompt: 1, completion: 2, total: 3 },
      cost: 0.001,
    })

    const res = await app.request('/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': 'student-clerk-id',
        'X-User-Role': 'STUDENT',
        'X-Correlation-Id': 'corr-test-1',
      },
      body: JSON.stringify({
        message: 'Am I eligible to compete?',
        userId: 'student-clerk-id',
        stream: false,
      }),
    })

    expect(res.status).toBe(200)
    const body = (await res.json()) as { response: string }
    expect(body.response.toLowerCase()).not.toMatch(/\byou are eligible\b/)
    expect(body.response.toLowerCase()).not.toMatch(/\bcleared to compete\b/)
    expect(mockChatSync).toHaveBeenCalledWith(
      'student-clerk-id',
      'Am I eligible to compete?',
      expect.objectContaining({ userRole: 'STUDENT', correlationId: 'corr-test-1' })
    )
  })

  it('STUDENT stream=false path uses chatSync (buffered) not streaming chat', async () => {
    mockChatSync.mockResolvedValue({
      conversationId: 'conv-int-2',
      response: 'Preliminary guidance only.',
      model: 'gpt-4o-mini',
      tokenUsage: { prompt: 1, completion: 1, total: 2 },
      cost: 0,
    })

    await app.request('/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': 'student-clerk-id',
        'X-User-Role': 'STUDENT',
      },
      body: JSON.stringify({
        message: 'What are my NCAA requirements?',
        userId: 'student-clerk-id',
        stream: false,
      }),
    })

    expect(mockChatSync).toHaveBeenCalled()
    expect(chatService.chat).not.toHaveBeenCalled()
  })
})
