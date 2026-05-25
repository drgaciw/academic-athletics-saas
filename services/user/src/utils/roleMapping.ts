import { UserRole as AuthUserRole, getPermissionsForRole } from '@aah/auth'
import { UserRole as PrismaUserRole } from '@aah/database'

const PRISMA_TO_AUTH_ROLE: Record<PrismaUserRole, AuthUserRole> = {
  [PrismaUserRole.STUDENT]: AuthUserRole.STUDENT_ATHLETE,
  [PrismaUserRole.ADMIN]: AuthUserRole.ADMIN,
  [PrismaUserRole.COACH]: AuthUserRole.COACH,
  [PrismaUserRole.FACULTY]: AuthUserRole.FACULTY,
  [PrismaUserRole.STAFF]: AuthUserRole.MENTOR,
  [PrismaUserRole.COMPLIANCE]: AuthUserRole.COMPLIANCE,
}

export function getPermissionsForPrismaRole(role: PrismaUserRole) {
  return getPermissionsForRole(PRISMA_TO_AUTH_ROLE[role])
}
