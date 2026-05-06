import syncRoutes from '../sync'
import { prisma, UserRole } from '@aah/database'
import { createHmac } from 'node:crypto'

jest.mock('@aah/config/env', () => ({
  userServiceEnvSchema: {},
  validateEnv: jest.fn(() => ({
    CLERK_WEBHOOK_SECRET: 'whsec_dGVzdF9zZWNyZXQ=',
  })),
}))

jest.mock('@aah/database', () => ({
  UserRole: {
    STUDENT: 'STUDENT',
    ADMIN: 'ADMIN',
    COACH: 'COACH',
    FACULTY: 'FACULTY',
    STAFF: 'STAFF',
    COMPLIANCE: 'COMPLIANCE',
  },
  prisma: {
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    studentProfile: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
}))

describe('Clerk sync route', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(prisma.user.create as jest.Mock).mockImplementation(async ({ data }) => ({
      id: 'db_user_123',
      ...data,
    }))
  })

  it('defaults Clerk-created users to the schema-backed STUDENT role', async () => {
    const body = JSON.stringify({
      type: 'user.created',
      data: {
        id: 'user_123',
        email_addresses: [
          { id: 'email_123', email_address: 'student@example.com' },
        ],
        primary_email_address_id: 'email_123',
        first_name: 'Sam',
        last_name: 'Student',
        public_metadata: {},
      },
    })
    const messageId = 'msg_123'
    const timestamp = String(Math.floor(Date.now() / 1000))
    const signature = createHmac('sha256', 'test_secret')
      .update(`${messageId}.${timestamp}.${body}`)
      .digest('base64')

    const response = await syncRoutes.request('/sync-clerk', {
      method: 'POST',
      body,
      headers: {
        'svix-id': messageId,
        'svix-timestamp': timestamp,
        'svix-signature': `v1,${signature}`,
      },
    })

    expect(response.status).toBe(200)
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        clerkId: 'user_123',
        email: 'student@example.com',
        role: UserRole.STUDENT,
      }),
    })
  })
})
