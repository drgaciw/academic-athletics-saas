import { prisma } from '@aah/database'
import { ensureStudentProfileIfMissing } from '../clerkStudentProfile'

jest.mock('@aah/database', () => ({
  prisma: {
    studentProfile: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}))

describe('ensureStudentProfileIfMissing', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('does not overwrite an existing StudentProfile from Clerk metadata', async () => {
    const existing = {
      id: 'profile_1',
      userId: 'db_user_1',
      studentId: 'NEW456',
      sport: 'Soccer',
      gpa: 3.8,
      creditHours: 15,
    }
    ;(prisma.studentProfile.findUnique as jest.Mock).mockResolvedValue(existing)

    const result = await ensureStudentProfileIfMissing('db_user_1', 'STUDENT', {
      studentId: 'OLD123',
      sport: 'Basketball',
      gpa: 2.0,
      creditHours: 12,
    })

    expect(result).toEqual(existing)
    expect(prisma.studentProfile.create).not.toHaveBeenCalled()
    expect(prisma.studentProfile.update).not.toHaveBeenCalled()
  })

  it('creates a profile when the student has none and metadata includes studentId', async () => {
    const created = {
      id: 'profile_2',
      userId: 'db_user_2',
      studentId: 'S100',
      sport: 'Track',
      gpa: 3.1,
      creditHours: 12,
      eligibilityStatus: 'PENDING',
    }
    ;(prisma.studentProfile.findUnique as jest.Mock).mockResolvedValue(null)
    ;(prisma.studentProfile.create as jest.Mock).mockResolvedValue(created)

    const result = await ensureStudentProfileIfMissing('db_user_2', 'STUDENT', {
      studentId: 'S100',
      sport: 'Track',
      gpa: 3.1,
      creditHours: 12,
    })

    expect(prisma.studentProfile.create).toHaveBeenCalledWith({
      data: {
        userId: 'db_user_2',
        studentId: 'S100',
        sport: 'Track',
        gpa: 3.1,
        creditHours: 12,
        eligibilityStatus: 'PENDING',
      },
    })
    expect(result).toEqual(created)
  })

  it('skips non-students and metadata without studentId', async () => {
    await expect(
      ensureStudentProfileIfMissing('db_user_3', 'COACH', { studentId: 'S1' })
    ).resolves.toBeNull()
    await expect(
      ensureStudentProfileIfMissing('db_user_3', 'STUDENT', {})
    ).resolves.toBeNull()
    expect(prisma.studentProfile.findUnique).not.toHaveBeenCalled()
    expect(prisma.studentProfile.create).not.toHaveBeenCalled()
  })
})
