/**
 * Resolve microservice URL for the student BFF.
 */
function getServiceUrl(envKey: string, defaultPort: number): string {
  const url = process.env[envKey];
  if (url) {
    return url;
  }

  return `http://localhost:${defaultPort}`;
}

/**
 * Resolve AI microservice URL for the student BFF.
 */
export function getAiServiceUrl(): string {
  return getServiceUrl('AI_SERVICE_URL', 3007);
}

/**
 * Resolve support microservice URL for the student BFF.
 */
export function getSupportServiceUrl(): string {
  return getServiceUrl('SUPPORT_SERVICE_URL', 3005);
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
