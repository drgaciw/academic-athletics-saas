/**
 * Authentication Middleware
 * Validates Clerk JWT tokens and extracts user context
 */

import { auth, currentUser } from '@clerk/nextjs';
import { NextRequest } from 'next/server';
import { RequestContext, UserRole } from '../types/services';

export class AuthenticationError extends Error {
  constructor(message: string, public statusCode: number = 401) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

/**
 * Validates authentication and returns request context
 * @throws {AuthenticationError} If authentication fails
 */
export async function validateAuth(request: NextRequest): Promise<RequestContext> {
  const { userId } = auth();

  if (!userId) {
    throw new AuthenticationError('No authentication token provided');
  }

  const user = await currentUser();

  if (!user) {
    throw new AuthenticationError('Invalid or expired token');
  }

  // Extract user role from Clerk metadata or default to STUDENT
  const role = (user.publicMetadata?.role as UserRole) || UserRole.STUDENT;

  return {
    userId: user.id,
    clerkId: userId,
    role,
    correlationId: generateCorrelationId(),
    timestamp: new Date(),
  };
}

/**
 * Validates authentication for optional auth routes
 * Returns null if no auth token provided
 */
export async function validateOptionalAuth(
  request: NextRequest
): Promise<RequestContext | null> {
  try {
    return await validateAuth(request);
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return null;
    }
    throw error;
  }
}

/**
 * Validates user has required role
 */
export function requireRole(
  context: RequestContext,
  allowedRoles: UserRole[]
): void {
  if (!allowedRoles.includes(context.role)) {
    throw new AuthenticationError(
      `Insufficient permissions. Required roles: ${allowedRoles.join(', ')}`,
      403
    );
  }
}

/**
 * Generates a unique correlation ID for request tracing
 */
function generateCorrelationId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Extracts bearer token from Authorization header
 */
export function extractBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  return authHeader.substring(7);
}
