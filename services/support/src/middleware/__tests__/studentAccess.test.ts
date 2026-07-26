const mockFindUnique = jest.fn()
const mockGetUser = jest.fn()

jest.mock('@aah/database', () => ({
  prisma: {
    user: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
    },
  },
}))

jest.mock('@aah/auth', () => ({
  getUser: (...args: unknown[]) => mockGetUser(...args),
  UserRole: {
    ADMIN: 'ADMIN',
    COMPLIANCE: 'COMPLIANCE',
    COACH: 'COACH',
    FACULTY: 'FACULTY',
    MENTOR: 'MENTOR',
    STUDENT_ATHLETE: 'STUDENT_ATHLETE',
  },
}))

import { assertStudentProfileAccess } from '../studentAccess'
import { AppError } from '../errorHandler'

describe('assertStudentProfileAccess', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('allows staff roles without a profile lookup', async () => {
    mockGetUser.mockReturnValue({
      clerkId: 'clerk_staff',
      role: 'COACH',
    })

    await expect(
      assertStudentProfileAccess({} as never, 'profile-any')
    ).resolves.toBeUndefined()
    expect(mockFindUnique).not.toHaveBeenCalled()
  })

  it('allows a student to access their own profile id', async () => {
    mockGetUser.mockReturnValue({
      clerkId: 'clerk_student',
      role: 'STUDENT_ATHLETE',
    })
    mockFindUnique.mockResolvedValue({
      studentProfile: { id: 'profile-own' },
    })

    await expect(
      assertStudentProfileAccess({} as never, 'profile-own')
    ).resolves.toBeUndefined()
  })

  it('rejects a student accessing another profile id', async () => {
    mockGetUser.mockReturnValue({
      clerkId: 'clerk_student',
      role: 'STUDENT_ATHLETE',
    })
    mockFindUnique.mockResolvedValue({
      studentProfile: { id: 'profile-own' },
    })

    await expect(
      assertStudentProfileAccess({} as never, 'profile-other')
    ).rejects.toMatchObject({
      statusCode: 403,
      code: 'FORBIDDEN',
    } satisfies Partial<AppError>)
  })
})
