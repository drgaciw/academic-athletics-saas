/**
 * Profile Routes
 * Handles user profile management endpoints
 */

import { Hono } from 'hono'
import { getUser, checkPermission } from '@aah/auth'
import {
  successResponse,
  errorResponse,
  validateRequest,
  CommonSchemas,
  NotFoundError,
  ForbiddenError,
} from '@aah/api-utils'
import { prisma } from '@aah/database'
import { z } from 'zod'

const profile = new Hono()

// =============================================================================
// SCHEMAS
// =============================================================================

const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  email: CommonSchemas.email.optional(),
})

type UpdateProfileInput = z.infer<typeof updateProfileSchema>

// =============================================================================
// ROUTES
// =============================================================================

/**
 * GET /api/user/profile/:id
 * Get user profile by ID
 * 
 * Authorization:
 * - Users can access their own profile
 * - Admins can access any profile
 */
profile.get('/:id', async (c) => {
  const userId = c.req.param('id')
  const currentUser = getUser(c)
  const correlationId = c.get('correlationId')

  // Check if user is accessing their own profile or has permission
  if (currentUser.userId !== userId) {
    try {
      checkPermission(c, 'user:read')
    } catch (error) {
      throw new ForbiddenError(
        'You do not have permission to access this profile'
      )
    }
  }

  // Fetch user profile from database
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      studentProfile: true,
    },
  })

  if (!user) {
    throw new NotFoundError('User profile not found', 'user')
  }

  // Return user profile (exclude sensitive data)
  const { clerkId, ...userProfile } = user

  return c.json(successResponse(userProfile, correlationId))
})

/**
 * PUT /api/user/profile/:id
 * Update user profile
 * 
 * Authorization:
 * - Users can update their own profile
 * - Admins can update any profile
 */
profile.put(
  '/:id',
  validateRequest(updateProfileSchema, 'json'),
  async (c) => {
    const userId = c.req.param('id')
    const currentUser = getUser(c)
    const correlationId = c.get('correlationId')
    const validatedData = c.get('validated_json') as UpdateProfileInput

    // Check if user is updating their own profile or has permission
    if (currentUser.userId !== userId) {
      try {
        checkPermission(c, 'user:write')
      } catch (error) {
        throw new ForbiddenError(
          'You do not have permission to update this profile'
        )
      }
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!existingUser) {
      throw new NotFoundError('User not found', 'user')
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: validatedData,
      include: {
        studentProfile: true,
      },
    })

    // Return updated profile (exclude sensitive data)
    const { clerkId, ...userProfile } = updatedUser

    return c.json(successResponse(userProfile, correlationId))
  }
)

/**
 * GET /api/user/profile
 * Get current user's profile
 */
profile.get('/', async (c) => {
  const currentUser = getUser(c)
  const correlationId = c.get('correlationId')

  // Fetch current user's profile
  const user = await prisma.user.findUnique({
    where: { id: currentUser.userId },
    include: {
      studentProfile: true,
    },
  })

  if (!user) {
    throw new NotFoundError('User profile not found', 'user')
  }

  // Return user profile (exclude sensitive data)
  const { clerkId, ...userProfile } = user

  return c.json(successResponse(userProfile, correlationId))
})

export default profile
