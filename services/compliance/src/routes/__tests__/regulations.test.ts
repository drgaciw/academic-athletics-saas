import { Hono } from 'hono'
import { prisma } from '@aah/database'
import { getUser, UserRole } from '@aah/auth'
import regulationsRoutes from '../regulations'

jest.mock('@aah/database', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    regulationChange: {
      findUnique: jest.fn(),
    },
    regulationAcknowledgement: {
      upsert: jest.fn(),
    },
  },
}))

jest.mock('@aah/auth', () => ({
  getUser: jest.fn(),
  checkPermission: jest.fn(),
  UserRole: {
    ADMIN: 'ADMIN',
    COMPLIANCE: 'COMPLIANCE',
    COACH: 'COACH',
  },
}))

const mockPrisma = prisma as jest.Mocked<typeof prisma>
const mockGetUser = getUser as jest.Mock

describe('regulation acknowledgement routes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('resolves Clerk users to database user IDs before acknowledging changes', async () => {
    mockGetUser.mockReturnValue({
      userId: 'user_clerk_123',
      clerkId: 'user_clerk_123',
      role: UserRole.COMPLIANCE,
      permissions: ['compliance:write'],
    })
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'db-user-1' } as never)
    mockPrisma.regulationChange.findUnique.mockResolvedValue({
      id: 'change-1',
    } as never)
    mockPrisma.regulationAcknowledgement.upsert.mockResolvedValue({} as never)

    const app = new Hono()
    app.route('/api/compliance', regulationsRoutes)

    const response = await app.request('/api/compliance/regulations/acknowledge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ changeId: 'change-1' }),
    })

    expect(response.status).toBe(200)
    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { clerkId: 'user_clerk_123' },
      select: { id: true },
    })
    expect(mockPrisma.regulationAcknowledgement.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          changeId_userId: { changeId: 'change-1', userId: 'db-user-1' },
        },
        create: expect.objectContaining({
          changeId: 'change-1',
          userId: 'db-user-1',
        }),
      })
    )
  })
})
