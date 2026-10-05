const mockAuth = jest.fn()
const mockFindUnique = jest.fn()
const mockWrite = jest.fn()

jest.mock('@clerk/nextjs/server', () => ({
  auth: () => mockAuth(),
}))

// Every prisma call other than the role lookup is tracked via mockWrite so we
// can assert nothing touches the DB when the guard rejects.
jest.mock('@aah/database', () => ({
  prisma: {
    user: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      findMany: (...args: unknown[]) => mockWrite(...args),
      create: (...args: unknown[]) => mockWrite(...args),
      update: (...args: unknown[]) => mockWrite(...args),
      delete: (...args: unknown[]) => mockWrite(...args),
    },
    studentProfile: { updateMany: (...args: unknown[]) => mockWrite(...args) },
  },
  Prisma: {},
}))

jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }))
jest.mock('next/navigation', () => ({
  redirect: (url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`)
  },
}))

import {
  getStudents,
  getStudent,
  createStudent,
  updateStudent,
  deleteStudent,
  bulkUpdateEligibility,
  exportStudents,
} from '../app/students/actions'

const actions: Array<[string, () => Promise<unknown>]> = [
  ['getStudents', () => getStudents()],
  ['getStudent', () => getStudent('s1')],
  ['createStudent', () => createStudent({} as never)],
  ['updateStudent', () => updateStudent('s1', {})],
  ['deleteStudent', () => deleteStudent('s1')],
  ['bulkUpdateEligibility', () => bulkUpdateEligibility(['s1'], 'ELIGIBLE')],
  ['exportStudents', () => exportStudents('json')],
]

describe('admin student server actions DB-backed guard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it.each(actions)('%s rejects with Unauthorized when unauthenticated', async (_name, run) => {
    mockAuth.mockResolvedValue({ userId: null })
    await expect(run()).rejects.toThrow('Unauthorized')
    expect(mockWrite).not.toHaveBeenCalled()
  })

  it.each(actions)(
    '%s rejects with Forbidden when DB role is STUDENT even if Clerk claims say ADMIN',
    async (_name, run) => {
      mockAuth.mockResolvedValue({ userId: 'u1', sessionClaims: { metadata: { role: 'ADMIN' } } })
      mockFindUnique.mockResolvedValue({ role: 'STUDENT' })
      await expect(run()).rejects.toThrow('Forbidden')
      expect(mockWrite).not.toHaveBeenCalled()
    }
  )
})
