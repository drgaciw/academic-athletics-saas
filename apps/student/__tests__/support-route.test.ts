const mockAuth = jest.fn()
const mockCurrentUser = jest.fn()

jest.mock('@clerk/nextjs/server', () => ({
  auth: () => mockAuth(),
  currentUser: () => mockCurrentUser(),
}))

const mockFetch = jest.fn()
global.fetch = mockFetch as typeof fetch

import { GET, POST } from '../app/api/support/[...path]/route'

describe('/api/support/[...path] (student BFF)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.SUPPORT_SERVICE_URL = 'http://support.test'
    mockAuth.mockResolvedValue({ userId: null, getToken: jest.fn() })
    mockCurrentUser.mockResolvedValue(null)
    mockFetch.mockResolvedValue({
      status: 200,
      headers: new Headers({ 'Content-Type': 'application/json' }),
      json: async () => ({ success: true }),
    })
  })

  it('returns 401 when unauthenticated', async () => {
    const req = new Request('http://localhost/api/support/tutoring/availability')
    const res = await GET(req as never, {
      params: Promise.resolve({ path: ['tutoring', 'availability'] }),
    })

    expect(res.status).toBe(401)
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('mints and forwards a Clerk bearer token to the protected support service', async () => {
    const getToken = jest.fn().mockResolvedValue('clerk-token')
    mockAuth.mockResolvedValue({ userId: 'user_123', getToken })
    mockCurrentUser.mockResolvedValue({ publicMetadata: { role: 'STUDENT' } })

    const req = new Request('http://localhost/api/support/tutoring/availability?date=2026-06-10')
    const res = await GET(req as never, {
      params: Promise.resolve({ path: ['tutoring', 'availability'] }),
    })

    expect(res.status).toBe(200)
    expect(getToken).toHaveBeenCalled()
    expect(mockFetch).toHaveBeenCalledWith(
      'http://support.test/api/support/tutoring/availability?date=2026-06-10',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer clerk-token',
          'X-User-Id': 'user_123',
          'X-User-Role': 'STUDENT',
        }),
      })
    )
  })

  it('preserves an incoming Authorization header when one is already present', async () => {
    const getToken = jest.fn()
    mockAuth.mockResolvedValue({ userId: 'user_123', getToken })
    mockCurrentUser.mockResolvedValue({ publicMetadata: { role: 'STUDENT' } })

    const req = new Request('http://localhost/api/support/workshop/register', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer caller-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ workshopId: 'workshop-1' }),
    })
    const res = await POST(req as never, {
      params: Promise.resolve({ path: ['workshop', 'register'] }),
    })

    expect(res.status).toBe(200)
    expect(getToken).not.toHaveBeenCalled()
    expect(mockFetch).toHaveBeenCalledWith(
      'http://support.test/api/support/workshop/register',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ workshopId: 'workshop-1' }),
        headers: expect.objectContaining({
          Authorization: 'Bearer caller-token',
          'Content-Type': 'application/json',
        }),
      })
    )
  })
})
