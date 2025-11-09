/**
 * Roles Routes
 * Handles user roles and permissions endpoints
 */

import { Hono } from 'hono'
import { getUser, checkPermission, ROLE_PERMISSIONS } from '@aah/auth'
import {
  successResponse,
  NotFoundError,
  ForbiddenError,
} from '@aah/api-utils'
import { prisma } from '@aah/database'

const roles = new Hono()

// =============================================================================
// ROUTES
// =============================================================================

/**
 * GET /api/user/roles/:id
 * Get user roles and permissions
 * 
 * Authorization:
 * - Users can access their own roles
 * - Admins can access any user's roles
 */
roles.get('/:id', async (c) => {
  const userId = c.req.param('id')
  const currentUser = getUser(c)
  const correlationId = c.get('correlationId')

  // Check if user is accessing their own roles or has permission
  if (currentUser.userId !== userId) {
    try {
      checkPermission(c, 'user:read')
    } catch (error) {
      throw new ForbiddenError(
        'You do not have permission to access this information'
      )
    }
  }

  // Fetch user from database
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      email: true,
      firstName: true,
      lastName: true,
    },
  })

  if (!user) {
    throw new NotFoundError('User not found', 'user')
  }

  // Get permissions for user's role
  const permissions = ROLE_PERMISSIONS[user.role] || []

  return c.json(successResponse({
    userId: user.id,
    role: user.role,
    permissions,
    user: {
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    },
  }, correlationId))
})

/**
 * GET /api/user/roles
 * Get current user's roles and permissions
 */
roles.get('/', async (c) => {
  const currentUser = getUser(c)
  const correlationId = c.get('correlationId')

  // Fetch current user from database
  const user = await prisma.user.findUnique({
    where: { id: currentUser.userId },
    select: {
      id: true,
      role: true,
      email: true,
      firstName: true,
      lastName: true,
    },
  })

  if (!user) {
    throw new NotFoundError('User not found', 'user')
  }

  // Get permissions for user's role
  const permissions = ROLE_PERMISSIONS[user.role] || []

  return c.json(successResponse({
    userId: user.id,
    role: user.role,
    permissions,
    user: {
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    },
  }, correlationId))
})

export default roles
