import { UserRole } from '@aah/database'

export async function isAdmin(userId: string): Promise<boolean> {
  // Dynamically import database to avoid initialization issues
  const { prisma } = await import('@aah/database')

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    })

    return user?.role === UserRole.ADMIN
  } catch (error) {
    console.error('Error checking admin status:', error)
    return false
  }
}

export async function isAdminOrStaff(userId: string): Promise<boolean> {
  // Dynamically import database to avoid initialization issues
  const { prisma } = await import('@aah/database')

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    })

    return user?.role === UserRole.ADMIN || user?.role === UserRole.STAFF
  } catch (error) {
    console.error('Error checking admin/staff status:', error)
    return false
  }
}
