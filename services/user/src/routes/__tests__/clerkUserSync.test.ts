import { prisma } from '@aah/database'
import {
  createOrLinkUserFromClerk,
  isTemporaryClerkId,
} from '../clerkUserSync'

jest.mock('@aah/database', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    studentProfile: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}))

describe('isTemporaryClerkId', () => {
  it('detects admin temp placeholders', () => {
    expect(isTemporaryClerkId('temp_1710000000000')).toBe(true)
    expect(isTemporaryClerkId('user_2abcRealClerk')).toBe(false)
  })
})

describe('createOrLinkUserFromClerk', () => {
  const clerkPayload = {
    id: 'user_real_clerk_123',
    email_addresses: [
      { id: 'email_1', email_address: 'athlete@example.edu' },
    ],
    primary_email_address_id: 'email_1',
    first_name: 'Alex',
    last_name: 'Runner',
    public_metadata: { role: 'STUDENT' },
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('links an admin-precreated temp_* user by email instead of creating a duplicate', async () => {
    const existing = {
      id: 'db_user_1',
      email: 'athlete@example.edu',
      clerkId: 'temp_1710000000000',
      firstName: 'Alex',
      lastName: 'Runner',
      role: 'STUDENT',
    }
    const linked = {
      ...existing,
      clerkId: 'user_real_clerk_123',
    }

    ;(prisma.user.findUnique as jest.Mock)
      .mockResolvedValueOnce(null) // by clerkId
      .mockResolvedValueOnce(existing) // by email
    ;(prisma.user.update as jest.Mock).mockResolvedValue(linked)
    ;(prisma.studentProfile.findUnique as jest.Mock).mockResolvedValue({
      id: 'profile_1',
      userId: 'db_user_1',
    })

    const result = await createOrLinkUserFromClerk(clerkPayload)

    expect(prisma.user.create).not.toHaveBeenCalled()
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'db_user_1' },
      data: {
        clerkId: 'user_real_clerk_123',
        firstName: 'Alex',
        lastName: 'Runner',
        role: 'STUDENT',
      },
    })
    expect(prisma.studentProfile.create).not.toHaveBeenCalled()
    expect(result).toEqual(linked)
  })

  it('creates a new user when no email match exists', async () => {
    const created = {
      id: 'db_user_2',
      email: 'athlete@example.edu',
      clerkId: 'user_real_clerk_123',
      firstName: 'Alex',
      lastName: 'Runner',
      role: 'STUDENT',
    }

    ;(prisma.user.findUnique as jest.Mock)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
    ;(prisma.user.create as jest.Mock).mockResolvedValue(created)

    const result = await createOrLinkUserFromClerk(clerkPayload)

    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        clerkId: 'user_real_clerk_123',
        email: 'athlete@example.edu',
        firstName: 'Alex',
        lastName: 'Runner',
        role: 'STUDENT',
      },
    })
    expect(result).toEqual(created)
  })

  it('is idempotent when the Clerk id is already linked', async () => {
    const existing = {
      id: 'db_user_3',
      clerkId: 'user_real_clerk_123',
      email: 'athlete@example.edu',
      role: 'STUDENT',
    }
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(existing)

    const result = await createOrLinkUserFromClerk(clerkPayload)

    expect(result).toEqual(existing)
    expect(prisma.user.create).not.toHaveBeenCalled()
    expect(prisma.user.update).not.toHaveBeenCalled()
  })

  it('rejects linking when email belongs to a different real Clerk account', async () => {
    ;(prisma.user.findUnique as jest.Mock)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 'db_other',
        email: 'athlete@example.edu',
        clerkId: 'user_someone_else',
        role: 'STUDENT',
      })

    await expect(createOrLinkUserFromClerk(clerkPayload)).rejects.toMatchObject({
      statusCode: 409,
      code: 'CONFLICT_DUPLICATE',
    })
    expect(prisma.user.update).not.toHaveBeenCalled()
    expect(prisma.user.create).not.toHaveBeenCalled()
  })

  it('rejects Clerk payloads with no email', async () => {
    await expect(
      createOrLinkUserFromClerk({
        id: 'user_no_email',
        email_addresses: [],
      })
    ).rejects.toMatchObject({
      statusCode: 500,
      code: 'SERVER_ERROR',
    })
  })
})
