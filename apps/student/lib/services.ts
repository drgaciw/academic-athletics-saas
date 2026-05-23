/**
 * Resolve AI microservice URL for the student BFF.
 */
export function getAiServiceUrl(): string {
  const url = process.env.AI_SERVICE_URL;
  if (url) {
    return url;
  }

  return 'http://localhost:3007';
}

/**
 * Map Clerk / Prisma roles to the AI service contract (PRD v2.2 uses STUDENT).
 */
export function toAiUserRole(role: string | undefined): string {
  if (!role || role === 'STUDENT' || role === 'STUDENT_ATHLETE') {
    return 'STUDENT';
  }
  return role;
}
