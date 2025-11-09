/**
 * Sync Routes
 * Handles Clerk webhook synchronization
 */

import { Hono } from 'hono'
import { Webhook } from '@clerk/backend'
import {
  successResponse,
  errorResponse,
  ServerError,
  AuthError,
} from '@aah/api-utils'
import { prisma } from '@aah/database'
import { validateEnv, userServiceEnvSchema } from '@aah/config/env'

const sync = new Hono()
const env = validateEnv(userServiceEnvSchema)

// =============================================================================
// WEBHOOK HANDLERS
// =============================================================================

/**
 * Handle user.created webhook event
 */
async function handleUserCreated(data: any) {
  const { id, email_addresses, first_name, last_name, public_metadata } = data

  // Get primary email
  const primaryEmail = email_addresses.find((e: any) => e.id === data.primary_email_address_id)
  const email = primaryEmail?.email_address || email_addresses[0]?.email_address

  // Create user in database
  const user = await prisma.user.create({
    data: {
      clerkId: id,
      email,
      firstName: first_name || null,
      lastName: last_name || null,
      role: public_metadata?.role || 'STUDENT_ATHLETE',
    },
  })

  // If user is a student athlete, create student profile
  if (user.role === 'STUDENT_ATHLETE' && public_metadata?.studentId) {
    await prisma.studentProfile.create({
      data: {
        userId: user.id,
        studentId: public_metadata.studentId,
        sport: public_metadata.sport || '',
        gpa: public_metadata.gpa || null,
        creditHours: public_metadata.creditHours || 0,
        eligibilityStatus: 'PENDING',
      },
    })
  }

  return user
}

/**
 * Handle user.updated webhook event
 */
async function handleUserUpdated(data: any) {
  const { id, email_addresses, first_name, last_name, public_metadata } = data

  // Get primary email
  const primaryEmail = email_addresses.find((e: any) => e.id === data.primary_email_address_id)
  const email = primaryEmail?.email_address || email_addresses[0]?.email_address

  // Find user by Clerk ID
  const existingUser = await prisma.user.findUnique({
    where: { clerkId: id },
  })

  if (!existingUser) {
    // User doesn't exist, create it
    return handleUserCreated(data)
  }

  // Update user in database
  const user = await prisma.user.update({
    where: { clerkId: id },
    data: {
      email,
      firstName: first_name || null,
      lastName: last_name || null,
      role: public_metadata?.role || existingUser.role,
    },
  })

  // Update student profile if exists
  if (user.role === 'STUDENT_ATHLETE' && public_metadata?.studentId) {
    const existingProfile = await prisma.studentProfile.findUnique({
      where: { userId: user.id },
    })

    if (existingProfile) {
      await prisma.studentProfile.update({
        where: { userId: user.id },
        data: {
          studentId: public_metadata.studentId,
          sport: public_metadata.sport || existingProfile.sport,
          gpa: public_metadata.gpa || existingProfile.gpa,
          creditHours: public_metadata.creditHours || existingProfile.creditHours,
        },
      })
    } else {
      await prisma.studentProfile.create({
        data: {
          userId: user.id,
          studentId: public_metadata.studentId,
          sport: public_metadata.sport || '',
          gpa: public_metadata.gpa || null,
          creditHours: public_metadata.creditHours || 0,
          eligibilityStatus: 'PENDING',
        },
      })
    }
  }

  return user
}

/**
 * Handle user.deleted webhook event
 */
async function handleUserDeleted(data: any) {
  const { id } = data

  // Find user by Clerk ID
  const user = await prisma.user.findUnique({
    where: { clerkId: id },
  })

  if (!user) {
    // User doesn't exist, nothing to delete
    return null
  }

  // Delete student profile if exists
  await prisma.studentProfile.deleteMany({
    where: { userId: user.id },
  })

  // Delete user
  await prisma.user.delete({
    where: { id: user.id },
  })

  return user
}

// =============================================================================
// ROUTES
// =============================================================================

/**
 * POST /api/user/sync-clerk
 * Webhook endpoint for Clerk user synchronization
 * 
 * This endpoint receives webhooks from Clerk when users are created, updated, or deleted.
 * It synchronizes the user data with our local database.
 * 
 * Security:
 * - Webhook signature verification using Clerk's Webhook class
 * - Requires CLERK_WEBHOOK_SECRET environment variable
 */
sync.post('/sync-clerk', async (c) => {
  const correlationId = c.get('correlationId')

  try {
    // Get the raw body and headers for webhook verification
    const payload = await c.req.text()
    const headers = {
      'svix-id': c.req.header('svix-id') || '',
      'svix-timestamp': c.req.header('svix-timestamp') || '',
      'svix-signature': c.req.header('svix-signature') || '',
    }

    // Verify the webhook signature
    const webhookSecret = env.CLERK_WEBHOOK_SECRET

    if (!webhookSecret) {
      throw new ServerError('Webhook secret not configured')
    }

    let webhookData: any

    try {
      const wh = new Webhook(webhookSecret)
      webhookData = wh.verify(payload, headers)
    } catch (error) {
      console.error('Webhook verification failed:', error)
      throw new AuthError('Invalid webhook signature', 'INVALID_SIGNATURE')
    }

    // Process the webhook based on event type
    const { type, data } = webhookData

    let result: any

    switch (type) {
      case 'user.created':
        result = await handleUserCreated(data)
        break

      case 'user.updated':
        result = await handleUserUpdated(data)
        break

      case 'user.deleted':
        result = await handleUserDeleted(data)
        break

      default:
        console.warn(`Unhandled webhook event type: ${type}`)
        return c.json(successResponse({
          message: 'Webhook event type not handled',
          type,
        }, correlationId))
    }

    return c.json(successResponse({
      message: 'Webhook processed successfully',
      type,
      userId: result?.id,
    }, correlationId))

  } catch (error) {
    console.error('Webhook processing error:', error)
    return c.json(errorResponse(error, correlationId, c.req.path), 500)
  }
})

export default sync
