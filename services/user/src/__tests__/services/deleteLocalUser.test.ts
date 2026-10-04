import { prisma } from '@aah/database'
import { deleteLocalUserByClerkId } from '../../services/deleteLocalUser'

jest.mock('@aah/database', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    tutoringSession: {
      deleteMany: jest.fn(),
    },
    mentorMatch: {
      deleteMany: jest.fn(),
    },
    emailLog: {
      updateMany: jest.fn(),
    },
    alert: {
      updateMany: jest.fn(),
    },
    progressReport: {
      updateMany: jest.fn(),
    },
    studentProfile: {
      deleteMany: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}))

describe('deleteLocalUserByClerkId', () => {
  const user = {
    id: 'db_user_1',
    clerkId: 'user_clerk_1',
    email: 'athlete@example.edu',
    role: 'STUDENT',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(prisma.$transaction as jest.Mock).mockImplementation(async (fn) => fn(prisma))
  })

  it('returns null when no local user exists', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

    await expect(deleteLocalUserByClerkId('user_missing')).resolves.toBeNull()
    expect(prisma.$transaction).not.toHaveBeenCalled()
    expect(prisma.studentProfile.deleteMany).not.toHaveBeenCalled()
    expect(prisma.user.delete).not.toHaveBeenCalled()
  })

  it('deletes the user inside a transaction without pre-deleting StudentProfile', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(user)
    ;(prisma.user.delete as jest.Mock).mockResolvedValue(user)
    ;(prisma.emailLog.updateMany as jest.Mock).mockResolvedValue({ count: 0 })
    ;(prisma.alert.updateMany as jest.Mock).mockResolvedValue({ count: 0 })
    ;(prisma.progressReport.updateMany as jest.Mock).mockResolvedValue({ count: 0 })
    ;(prisma.tutoringSession.deleteMany as jest.Mock).mockResolvedValue({ count: 1 })
    ;(prisma.mentorMatch.deleteMany as jest.Mock).mockResolvedValue({ count: 0 })

    const result = await deleteLocalUserByClerkId('user_clerk_1')

    expect(result).toEqual(user)
    expect(prisma.$transaction).toHaveBeenCalledTimes(1)
    expect(prisma.studentProfile.deleteMany).not.toHaveBeenCalled()
    expect(prisma.studentProfile.delete).not.toHaveBeenCalled()
    expect(prisma.tutoringSession.deleteMany).toHaveBeenCalledWith({
      where: {
        OR: [{ studentId: 'db_user_1' }, { userId: 'db_user_1' }],
      },
    })
    expect(prisma.mentorMatch.deleteMany).toHaveBeenCalledWith({
      where: {
        OR: [{ mentorId: 'db_user_1' }, { menteeId: 'db_user_1' }],
      },
    })
    expect(prisma.user.delete).toHaveBeenCalledWith({
      where: { id: 'db_user_1' },
    })
  })

  it('does not leave a partial wipe when user.delete fails after FK cleanup', async () => {
    const deleteError = new Error('FK constraint on ProgressReport.submittedBy')
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(user)
    ;(prisma.emailLog.updateMany as jest.Mock).mockResolvedValue({ count: 0 })
    ;(prisma.alert.updateMany as jest.Mock).mockResolvedValue({ count: 0 })
    ;(prisma.progressReport.updateMany as jest.Mock).mockResolvedValue({ count: 0 })
    ;(prisma.tutoringSession.deleteMany as jest.Mock).mockResolvedValue({ count: 0 })
    ;(prisma.mentorMatch.deleteMany as jest.Mock).mockResolvedValue({ count: 0 })
    ;(prisma.user.delete as jest.Mock).mockRejectedValue(deleteError)

    await expect(deleteLocalUserByClerkId('user_clerk_1')).rejects.toThrow(deleteError)

    // Profile must never be deleted before/outside the failed user delete.
    expect(prisma.studentProfile.deleteMany).not.toHaveBeenCalled()
    expect(prisma.studentProfile.delete).not.toHaveBeenCalled()
  })
})
