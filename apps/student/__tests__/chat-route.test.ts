const mockAuth = jest.fn()
const mockCurrentUser = jest.fn()

jest.mock('@clerk/nextjs/server', () => ({
  auth: () => mockAuth(),
  currentUser: () => mockCurrentUser(),
}))

const mockFetch = jest.fn()
global.fetch = mockFetch as typeof fetch

import { POST } from '../app/api/ai/chat/route'

describe('POST /api/ai/chat (student BFF)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockAuth.mockResolvedValue({ userId: null })
    mockCurrentUser.mockResolvedValue(null)
  })

  it('returns 401 when unauthenticated', async () => {
    const req = new Request('http://localhost/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'hello' }),
    })
    const res = await POST(req as never)
    expect(res.status).toBe(401)
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('returns 400 when message is missing', async () => {
    mockAuth.mockResolvedValue({ userId: 'user_123' })
    mockCurrentUser.mockResolvedValue({ publicMetadata: { role: 'STUDENT' } })

    const req = new Request('http://localhost/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    const res = await POST(req as never)
    expect(res.status).toBe(400)
  })

  it('proxies to AI service with STUDENT role and stream false', async () => {
    mockAuth.mockResolvedValue({ userId: 'user_123' })
    mockCurrentUser.mockResolvedValue({ publicMetadata: { role: 'STUDENT' } })
    mockFetch.mockResolvedValue({
      status: 200,
      json: async () => ({ response: 'ok', conversationId: 'c1' }),
    })

    const req = new Request('http://localhost/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Am I eligible?' }),
    })
    const res = await POST(req as never)
    expect(res.status).toBe(200)
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3007/api/ai/chat',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'X-User-Id': 'user_123',
          'X-User-Role': 'STUDENT',
        }),
      })
    )
    const callBody = JSON.parse((mockFetch.mock.calls[0][1] as RequestInit).body as string)
    expect(callBody.stream).toBe(false)
    expect(callBody.message).toBe('Am I eligible?')
  })
})
