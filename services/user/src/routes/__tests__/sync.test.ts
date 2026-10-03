import { prisma, UserRole } from '@aah/database'
import { verifyWebhook } from '@clerk/backend/webhooks'
import syncRoutes from '../sync'
import { parseUserRole, resolveUserRole } from '../clerkUserSync'

jest.mock('@aah/config/env', () => ({
  userServiceEnvSchema: {},
  validateEnv: jest.fn(() => ({
    CLERK_WEBHOOK_SECRET: 'whsec_dGVzdF9zZWNyZXQ=',
  })),
}))

// Svix verification itself is Clerk's library; we only assert how the route
// behaves on either side of it.
jest.mock('@clerk/backend/webhooks', () => ({
  verifyWebhook: jest.fn(),
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

const mockVerifyWebhook = verifyWebhook as jest.Mock

function clerkUser(publicMetadata: Record<string, unknown>) {
  return {
    id: 'user_123',
    email_addresses: [{ id: 'email_123', email_address: 'student@example.com' }],
    primary_email_address_id: 'email_123',
    first_name: 'Sam',
    last_name: 'Student',
    public_metadata: publicMetadata,
  }
}

function postWebhook(body: unknown) {
  return syncRoutes.request('/sync-clerk', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'content-type': 'application/json',
      'svix-id': 'msg_123',
      'svix-timestamp': String(Math.floor(Date.now() / 1000)),
      'svix-signature': 'v1,mocked',
    },
  })
}

describe('resolveUserRole', () => {
  it('returns a known UserRole unchanged', () => {
    expect(resolveUserRole('ADMIN')).toBe(UserRole.ADMIN)
    expect(resolveUserRole('COMPLIANCE')).toBe(UserRole.COMPLIANCE)
  })

  it('falls back to STUDENT for missing, non-string, or unknown roles', () => {
    expect(resolveUserRole(undefined)).toBe(UserRole.STUDENT)
    expect(resolveUserRole(null)).toBe(UserRole.STUDENT)
    expect(resolveUserRole(42)).toBe(UserRole.STUDENT)
    expect(resolveUserRole('STUDENT_ATHLETE')).toBe(UserRole.STUDENT)
    expect(resolveUserRole('admin')).toBe(UserRole.STUDENT)
  })
})

describe('parseUserRole', () => {
  it('returns a known role and undefined for anything else', () => {
    expect(parseUserRole('COACH')).toBe(UserRole.COACH)
    expect(parseUserRole('superuser')).toBeUndefined()
    expect(parseUserRole(undefined)).toBeUndefined()
    expect(parseUserRole(7)).toBeUndefined()
  })
})

describe('POST /sync-clerk', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(console, 'error').mockImplementation(() => undefined)
    ;(prisma.user.create as jest.Mock).mockImplementation(async ({ data }) => ({
      id: 'db_user_123',
      ...data,
    }))
    ;(prisma.user.update as jest.Mock).mockImplementation(async ({ data }) => ({
      id: 'db_user_123',
      clerkId: 'user_123',
      ...data,
    }))
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('rejects an unverifiable webhook without touching the database', async () => {
    mockVerifyWebhook.mockRejectedValue(new Error('bad signature'))

    const response = await postWebhook({ type: 'user.created', data: clerkUser({}) })

    expect(response.status).toBe(500)
    expect(prisma.user.create).not.toHaveBeenCalled()
  })

  it('creates users with STUDENT when Clerk metadata carries an unknown role', async () => {
    const data = clerkUser({ role: 'STUDENT_ATHLETE' })
    mockVerifyWebhook.mockResolvedValue({ type: 'user.created', data })

    const response = await postWebhook({ type: 'user.created', data })

    expect(response.status).toBe(200)
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        clerkId: 'user_123',
        email: 'student@example.com',
        role: UserRole.STUDENT,
      }),
    })
  })

  it('keeps a valid enum role from Clerk metadata on create', async () => {
    const data = clerkUser({ role: 'ADMIN' })
    mockVerifyWebhook.mockResolvedValue({ type: 'user.created', data })

    await postWebhook({ type: 'user.created', data })

    expect(prisma.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ role: UserRole.ADMIN }),
    })
  })

  it('preserves the stored role on update when Clerk sends no role', async () => {
    const data = clerkUser({})
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'db_user_123',
      clerkId: 'user_123',
      role: UserRole.COACH,
    })
    mockVerifyWebhook.mockResolvedValue({ type: 'user.updated', data })

    await postWebhook({ type: 'user.updated', data })

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { clerkId: 'user_123' },
      data: expect.objectContaining({ role: UserRole.COACH }),
    })
  })

  it('keeps the stored role on update when Clerk sends an unknown role', async () => {
    const data = clerkUser({ role: 'superuser' })
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'db_user_123',
      clerkId: 'user_123',
      role: UserRole.COACH,
    })
    mockVerifyWebhook.mockResolvedValue({ type: 'user.updated', data })

    await postWebhook({ type: 'user.updated', data })

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { clerkId: 'user_123' },
      data: expect.objectContaining({ role: UserRole.COACH }),
    })
  })
})
