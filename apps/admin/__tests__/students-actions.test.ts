const mockAuth = jest.fn()
const mockUserDelete = jest.fn()
const mockRevalidatePath = jest.fn()
const mockRedirect = jest.fn(() => {
  const error = new Error('NEXT_REDIRECT')
  ;(error as Error & { digest?: string }).digest = 'NEXT_REDIRECT;replace;/students;303'
  throw error
})

jest.mock('@clerk/nextjs/server', () => ({
  auth: () => mockAuth(),
}))

jest.mock('@aah/database', () => ({
  prisma: {
    user: {
      delete: (...args: unknown[]) => mockUserDelete(...args),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    studentProfile: {
      updateMany: jest.fn(),
    },
  },
  Prisma: {},
}))

jest.mock('next/cache', () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}))

jest.mock('next/navigation', () => ({
  redirect: (...args: unknown[]) => mockRedirect(...args),
}))

import { deleteStudent } from '../app/students/actions'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

describe('admin student actions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockAuth.mockResolvedValue({ userId: 'clerk_admin_1' })
    mockUserDelete.mockResolvedValue({ id: 'student_1' })
  })

  it('propagates redirect after a successful delete instead of returning failure', async () => {
    await expect(deleteStudent('student_1')).rejects.toThrow('NEXT_REDIRECT')

    expect(mockUserDelete).toHaveBeenCalledWith({ where: { id: 'student_1' } })
    expect(mockRevalidatePath).toHaveBeenCalledWith('/students')
    expect(mockRedirect).toHaveBeenCalledWith('/students')
  })

  it('returns failure when delete throws a real database error', async () => {
    mockUserDelete.mockRejectedValue(new Error('db down'))

    await expect(deleteStudent('student_1')).resolves.toEqual({
      success: false,
      error: 'Failed to delete student',
    })
    expect(mockRedirect).not.toHaveBeenCalled()
  })

  it('passes the updateStudent server action directly into StudentForm', () => {
    const source = readFileSync(
      join(__dirname, '../app/students/[id]/edit/page.tsx'),
      'utf8'
    )

    expect(source).toContain('onUpdate={updateStudent}')
    expect(source).not.toMatch(/const handleUpdate\s*=/)
  })
})
