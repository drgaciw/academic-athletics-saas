'use server'

import { auth as clerkAuth } from '@clerk/nextjs/server'
import { prisma } from '@aah/database'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export type StudentFormData = {
  email: string
  firstName: string
  lastName: string
  studentId: string
  sport: string
  team?: string
  gpa?: number
  creditHours?: number
  eligibilityStatus?: string
  academicStanding?: string
  enrollmentStatus?: string
  major?: string
  minor?: string
  advisor?: string
  expectedGradDate?: string
}

export async function getStudents(filters?: {
  sport?: string
  eligibilityStatus?: string
  search?: string
}) {
  const { userId } = await clerkAuth()

  if (!userId) {
    throw new Error('Unauthorized')
  }

  const where: any = {
    role: 'STUDENT',
  }

  // Apply search filter
  if (filters?.search) {
    where.OR = [
      { firstName: { contains: filters.search, mode: 'insensitive' } },
      { lastName: { contains: filters.search, mode: 'insensitive' } },
      { email: { contains: filters.search, mode: 'insensitive' } },
      {
        studentProfile: {
          studentId: { contains: filters.search, mode: 'insensitive' },
        },
      },
    ]
  }

  // Apply sport filter
  if (filters?.sport) {
    where.studentProfile = {
      ...(where.studentProfile || {}),
      sport: filters.sport,
    }
  }

  // Apply eligibility filter
  if (filters?.eligibilityStatus) {
    where.studentProfile = {
      ...(where.studentProfile || {}),
      eligibilityStatus: filters.eligibilityStatus,
    }
  }

  const students = await prisma.user.findMany({
    where,
    include: {
      studentProfile: {
        include: {
          complianceRecords: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      },
    },
    orderBy: { lastName: 'asc' },
  })

  return students
}

export async function getStudent(id: string) {
  const { userId } = await clerkAuth()

  if (!userId) {
    throw new Error('Unauthorized')
  }

  const student = await prisma.user.findUnique({
    where: { id },
    include: {
      studentProfile: {
        include: {
          complianceRecords: {
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
          alerts: {
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
          performanceMetrics: {
            orderBy: { recordedAt: 'desc' },
            take: 10,
          },
        },
      },
    },
  })

  if (!student || student.role !== 'STUDENT') {
    throw new Error('Student not found')
  }

  return student
}

export async function createStudent(data: StudentFormData) {
  const { userId } = await clerkAuth()

  if (!userId) {
    throw new Error('Unauthorized')
  }

  try {
    const user = await prisma.user.create({
      data: {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        role: 'STUDENT',
        clerkId: `temp_${Date.now()}`, // Temporary - should be set by Clerk webhook
        studentProfile: {
          create: {
            studentId: data.studentId,
            sport: data.sport,
            team: data.team,
            gpa: data.gpa,
            creditHours: data.creditHours || 0,
            eligibilityStatus: data.eligibilityStatus || 'PENDING',
            academicStanding: data.academicStanding,
            enrollmentStatus: data.enrollmentStatus || 'FULL_TIME',
            major: data.major,
            minor: data.minor,
            advisor: data.advisor,
            expectedGradDate: data.expectedGradDate ? new Date(data.expectedGradDate) : null,
          },
        },
      },
    })

    revalidatePath('/students')
    return { success: true, id: user.id }
  } catch (error) {
    console.error('Error creating student:', error)
    return { success: false, error: 'Failed to create student' }
  }
}

export async function updateStudent(id: string, data: Partial<StudentFormData>) {
  const { userId } = await clerkAuth()

  if (!userId) {
    throw new Error('Unauthorized')
  }

  try {
    const studentProfile = data.studentId ? {
      studentId: data.studentId,
      sport: data.sport,
      team: data.team,
      gpa: data.gpa,
      creditHours: data.creditHours,
      eligibilityStatus: data.eligibilityStatus,
      academicStanding: data.academicStanding,
      enrollmentStatus: data.enrollmentStatus,
      major: data.major,
      minor: data.minor,
      advisor: data.advisor,
      expectedGradDate: data.expectedGradDate ? new Date(data.expectedGradDate) : undefined,
    } : undefined

    await prisma.user.update({
      where: { id },
      data: {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        ...(studentProfile && {
          studentProfile: {
            update: studentProfile,
          },
        }),
      },
    })

    revalidatePath('/students')
    revalidatePath(`/students/${id}`)
    return { success: true }
  } catch (error) {
    console.error('Error updating student:', error)
    return { success: false, error: 'Failed to update student' }
  }
}

export async function deleteStudent(id: string) {
  const { userId } = await clerkAuth()

  if (!userId) {
    throw new Error('Unauthorized')
  }

  try {
    await prisma.user.delete({
      where: { id },
    })

    revalidatePath('/students')
    redirect('/students')
  } catch (error) {
    console.error('Error deleting student:', error)
    return { success: false, error: 'Failed to delete student' }
  }
}

export async function bulkUpdateEligibility(studentIds: string[], eligibilityStatus: string) {
  const { userId } = await clerkAuth()

  if (!userId) {
    throw new Error('Unauthorized')
  }

  try {
    await prisma.studentProfile.updateMany({
      where: {
        userId: { in: studentIds },
      },
      data: {
        eligibilityStatus,
      },
    })

    revalidatePath('/students')
    return { success: true, count: studentIds.length }
  } catch (error) {
    console.error('Error bulk updating students:', error)
    return { success: false, error: 'Failed to update students' }
  }
}

export async function exportStudents(format: 'csv' | 'json') {
  const { userId } = await clerkAuth()

  if (!userId) {
    throw new Error('Unauthorized')
  }

  const students = await getStudents()

  if (format === 'json') {
    return JSON.stringify(students, null, 2)
  }

  // CSV export
  const headers = [
    'Name',
    'Email',
    'Student ID',
    'Sport',
    'GPA',
    'Credits',
    'Eligibility',
    'Academic Standing',
  ]

  const rows = students.map(s => [
    `${s.firstName} ${s.lastName}`,
    s.email,
    s.studentProfile?.studentId || '',
    s.studentProfile?.sport || '',
    s.studentProfile?.gpa?.toFixed(2) || '',
    s.studentProfile?.creditHours || 0,
    s.studentProfile?.eligibilityStatus || '',
    s.studentProfile?.academicStanding || '',
  ])

  const csv = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n')

  return csv
}
