const mockAuth = jest.fn()
const mockCurrentUser = jest.fn()

jest.mock('@clerk/nextjs/server', () => ({
  auth: () => mockAuth(),
  currentUser: () => mockCurrentUser(),
}))

const mockFetch = jest.fn()
global.fetch = mockFetch as typeof fetch

import { GET } from '../app/api/support/[...path]/route'

describe('/api/support/[...path] student BFF', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockAuth.mockResolvedValue({ userId: null, getToken: jest.fn() })
    mockCurrentUser.mockResolvedValue(null)
  })

  it('forwards the Clerk bearer token required by the support service', async () => {
    const getToken = jest.fn().mockResolvedValue('session-token')
    mockAuth.mockResolvedValue({ userId: 'user_123', getToken })
    mockCurrentUser.mockResolvedValue({ publicMetadata: { role: 'STUDENT' } })
    mockFetch.mockResolvedValue({
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ tutors: [] }),
    })

    const req = new Request('http://localhost/api/support/tutoring/availability?courseId=CS101')
    const res = await GET(req as never, {
      params: Promise.resolve({ path: ['tutoring', 'availability'] }),
    })

    expect(res.status).toBe(200)
    expect(getToken).toHaveBeenCalled()
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3005/api/support/tutoring/availability?courseId=CS101',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer session-token',
          'X-User-Id': 'user_123',
          'X-User-Role': 'STUDENT',
        }),
      })
    )
  })
})
