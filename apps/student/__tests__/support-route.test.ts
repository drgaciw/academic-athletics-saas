const mockAuth = jest.fn()
const mockCurrentUser = jest.fn()
const mockGetStudentByClerkId = jest.fn()

jest.mock('@clerk/nextjs/server', () => ({
  auth: () => mockAuth(),
  currentUser: () => mockCurrentUser(),
}))

jest.mock('@/lib/student-data', () => ({
  getStudentByClerkId: (...args: unknown[]) => mockGetStudentByClerkId(...args),
}))

const mockFetch = jest.fn()
global.fetch = mockFetch as typeof fetch

import { NextRequest } from 'next/server'
import { GET, POST } from '../app/api/support/[...path]/route'

describe('GET /api/support/* (student BFF)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockAuth.mockResolvedValue({
      userId: 'user_123',
      getToken: jest.fn().mockResolvedValue('clerk-token'),
    })
    mockCurrentUser.mockResolvedValue({ publicMetadata: { role: 'STUDENT' } })
    mockGetStudentByClerkId.mockResolvedValue({
      studentProfile: { id: 'profile-own' },
    })
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

  it('rejects path-based studentId IDOR attempts', async () => {
    const req = new NextRequest(
      'http://localhost/api/support/study-hall/stats/profile-other'
    )

    const res = await GET(req, {
      params: Promise.resolve({ path: ['study-hall', 'stats', 'profile-other'] }),
    })

    expect(res.status).toBe(403)
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('rejects body studentId IDOR attempts', async () => {
    const req = new NextRequest('http://localhost/api/support/tutoring/book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId: 'profile-other',
        tutorId: 'tutor-1',
        subject: 'Math',
        startTime: '2026-07-26T12:00:00.000Z',
        endTime: '2026-07-26T13:00:00.000Z',
      }),
    })

    const res = await POST(req, {
      params: Promise.resolve({ path: ['tutoring', 'book'] }),
    })

    expect(res.status).toBe(403)
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('allows requests scoped to the authenticated student profile', async () => {
    const req = new NextRequest(
      'http://localhost/api/support/study-hall/stats/profile-own'
    )

    const res = await GET(req, {
      params: Promise.resolve({ path: ['study-hall', 'stats', 'profile-own'] }),
    })

    expect(res.status).toBe(200)
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })
})
