const mockAuth = jest.fn()
const mockFindUnique = jest.fn()
const mockRedirect = jest.fn((url: string): never => {
  throw new Error(`NEXT_REDIRECT:${url}`)
})

jest.mock('@clerk/nextjs/server', () => ({
  auth: () => mockAuth(),
}))

jest.mock('@aah/database', () => ({
  prisma: { user: { findUnique: (...args: unknown[]) => mockFindUnique(...args) } },
}))

jest.mock('next/navigation', () => ({
  redirect: (url: string) => mockRedirect(url),
}))

import { requireStudentPageAccess } from '../lib/student-auth'

describe('requireStudentPageAccess', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('redirects unauthenticated users to /sign-in without a DB lookup', async () => {
    mockAuth.mockResolvedValue({ userId: null })
    await expect(requireStudentPageAccess()).rejects.toThrow('NEXT_REDIRECT:/sign-in')
    expect(mockFindUnique).not.toHaveBeenCalled()
  })

  it.each(['ADMIN', 'STAFF', 'FACULTY'])(
    'redirects to / when DB role is %s even if Clerk claims say STUDENT',
    async (role) => {
      mockAuth.mockResolvedValue({ userId: 'u1', sessionClaims: { metadata: { role: 'STUDENT' } } })
      mockFindUnique.mockResolvedValue({ role })
      await expect(requireStudentPageAccess()).rejects.toThrow('NEXT_REDIRECT:/forbidden')
      expect(mockFindUnique).toHaveBeenCalledWith({ where: { clerkId: 'u1' }, select: { role: true } })
    }
  )

  it('redirects to / when the user has no DB record', async () => {
    mockAuth.mockResolvedValue({ userId: 'u1' })
    mockFindUnique.mockResolvedValue(null)
    await expect(requireStudentPageAccess()).rejects.toThrow('NEXT_REDIRECT:/forbidden')
  })

  it('allows DB role STUDENT', async () => {
    mockAuth.mockResolvedValue({ userId: 'u1' })
    mockFindUnique.mockResolvedValue({ role: 'STUDENT' })
    await expect(requireStudentPageAccess()).resolves.toBeUndefined()
    expect(mockRedirect).not.toHaveBeenCalled()
  })
})
