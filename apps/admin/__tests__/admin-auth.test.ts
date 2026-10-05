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

import { requireAdminPageAccess, requireAdminActionAccess } from '../lib/admin-auth'

describe('admin DB-backed role guards', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('requireAdminPageAccess', () => {
    it('redirects unauthenticated users to /sign-in without a DB lookup', async () => {
      mockAuth.mockResolvedValue({ userId: null })
      await expect(requireAdminPageAccess()).rejects.toThrow('NEXT_REDIRECT:/sign-in')
      expect(mockFindUnique).not.toHaveBeenCalled()
    })

    it('redirects to / when DB role is STUDENT even if Clerk claims say ADMIN', async () => {
      mockAuth.mockResolvedValue({ userId: 'u1', sessionClaims: { metadata: { role: 'ADMIN' } } })
      mockFindUnique.mockResolvedValue({ role: 'STUDENT' })
      await expect(requireAdminPageAccess()).rejects.toThrow('NEXT_REDIRECT:/')
      expect(mockFindUnique).toHaveBeenCalledWith({ where: { clerkId: 'u1' }, select: { role: true } })
    })

    it('redirects to / when the user has no DB record', async () => {
      mockAuth.mockResolvedValue({ userId: 'u1' })
      mockFindUnique.mockResolvedValue(null)
      await expect(requireAdminPageAccess()).rejects.toThrow('NEXT_REDIRECT:/')
    })

    it.each(['ADMIN', 'STAFF'])('allows DB role %s', async (role) => {
      mockAuth.mockResolvedValue({ userId: 'u1' })
      mockFindUnique.mockResolvedValue({ role })
      await expect(requireAdminPageAccess()).resolves.toBeUndefined()
      expect(mockRedirect).not.toHaveBeenCalled()
    })
  })

  describe('requireAdminActionAccess', () => {
    it('throws Unauthorized when unauthenticated', async () => {
      mockAuth.mockResolvedValue({ userId: null })
      await expect(requireAdminActionAccess()).rejects.toThrow('Unauthorized')
    })

    it('throws Forbidden when DB role is STUDENT even if Clerk claims say ADMIN', async () => {
      mockAuth.mockResolvedValue({ userId: 'u1', sessionClaims: { metadata: { role: 'ADMIN' } } })
      mockFindUnique.mockResolvedValue({ role: 'STUDENT' })
      await expect(requireAdminActionAccess()).rejects.toThrow('Forbidden')
    })

    it.each(['ADMIN', 'STAFF'])('allows DB role %s', async (role) => {
      mockAuth.mockResolvedValue({ userId: 'u1' })
      mockFindUnique.mockResolvedValue({ role })
      await expect(requireAdminActionAccess()).resolves.toBeUndefined()
    })
  })
})
