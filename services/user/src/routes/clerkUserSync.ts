/**
 * Clerk → local User sync helpers used by the webhook route.
 * Admin pre-create uses temp_* clerkIds that must be rekeyed on first real signup.
 */

import { prisma } from '@aah/database'
import { ConflictError, ServerError } from '@aah/api-utils'

export function isTemporaryClerkId(clerkId: string): boolean {
  return clerkId.startsWith('temp_')
}

type ClerkEmailAddress = {
  id?: string
  email_address?: string
}

export type ClerkUserWebhookData = {
  id: string
  email_addresses?: ClerkEmailAddress[]
  primary_email_address_id?: string | null
  first_name?: string | null
  last_name?: string | null
  public_metadata?: {
    role?: string
    studentId?: string
    sport?: string
    gpa?: number
    creditHours?: number
  } | null
}

function resolvePrimaryEmail(data: ClerkUserWebhookData): string | undefined {
  const emailAddresses = data.email_addresses ?? []
  const primaryEmail = emailAddresses.find((e) => e.id === data.primary_email_address_id)
  return primaryEmail?.email_address || emailAddresses[0]?.email_address
}

async function ensureStudentProfileFromMetadata(
  userId: string,
  role: string,
  publicMetadata: ClerkUserWebhookData['public_metadata']
) {
  if (role !== 'STUDENT' || !publicMetadata?.studentId) {
    return
  }

  const existingProfile = await prisma.studentProfile.findUnique({
    where: { userId },
  })

  if (existingProfile) {
    return
  }

  await prisma.studentProfile.create({
    data: {
      userId,
      studentId: publicMetadata.studentId,
      sport: publicMetadata.sport || '',
      gpa: publicMetadata.gpa || null,
      creditHours: publicMetadata.creditHours || 0,
      eligibilityStatus: 'PENDING',
    },
  })
}

/**
 * Create a local user from a Clerk user.created payload, or link an
 * admin-precreated row that still has a temp_* clerkId for the same email.
 */
export async function createOrLinkUserFromClerk(data: ClerkUserWebhookData) {
  const { id, first_name, last_name, public_metadata } = data
  const email = resolvePrimaryEmail(data)

  if (!email) {
    throw new ServerError('Clerk user has no email address')
  }

  const existingByClerkId = await prisma.user.findUnique({
    where: { clerkId: id },
  })
  if (existingByClerkId) {
    return existingByClerkId
  }

  const existingByEmail = await prisma.user.findUnique({
    where: { email },
  })

  if (existingByEmail) {
    if (!isTemporaryClerkId(existingByEmail.clerkId)) {
      throw new ConflictError(
        `User with email ${email} already exists with a different Clerk id`
      )
    }

    const linkedUser = await prisma.user.update({
      where: { id: existingByEmail.id },
      data: {
        clerkId: id,
        firstName: first_name || existingByEmail.firstName,
        lastName: last_name || existingByEmail.lastName,
        // Preserve admin-assigned role unless Clerk metadata explicitly sets one
        role: public_metadata?.role || existingByEmail.role,
      },
    })

    await ensureStudentProfileFromMetadata(
      linkedUser.id,
      linkedUser.role,
      public_metadata
    )

    return linkedUser
  }

  const user = await prisma.user.create({
    data: {
      clerkId: id,
      email,
      firstName: first_name || null,
      lastName: last_name || null,
      role: public_metadata?.role || 'STUDENT',
    },
  })

  await ensureStudentProfileFromMetadata(user.id, user.role, public_metadata)

  return user
}
