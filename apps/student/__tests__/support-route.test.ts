const mockAuth = jest.fn()
const mockCurrentUser = jest.fn()

jest.mock('@clerk/nextjs/server', () => ({
  auth: () => mockAuth(),
  currentUser: () => mockCurrentUser(),
}))

const mockFetch = jest.fn()
global.fetch = mockFetch as typeof fetch

import { NextRequest } from 'next/server'
import { GET } from '../app/api/support/[...path]/route'

describe('GET /api/support/* (student BFF)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockAuth.mockResolvedValue({
      userId: 'user_123',
      getToken: jest.fn().mockResolvedValue('clerk-token'),
    })
    mockCurrentUser.mockResolvedValue({ publicMetadata: { role: 'STUDENT' } })
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    )
  })

  it('forwards the Clerk bearer token and query string to the support service', async () => {
    const req = new NextRequest(
      'http://localhost/api/support/tutoring/availability?startDate=2026-01-01'
    )

    const res = await GET(req, {
      params: Promise.resolve({ path: ['tutoring', 'availability'] }),
    })

    expect(res.status).toBe(200)
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3005/api/support/tutoring/availability?startDate=2026-01-01',
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
})
