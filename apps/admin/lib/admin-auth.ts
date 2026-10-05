import { auth } from '@clerk/nextjs/server';
import { prisma, type UserRole } from '@aah/database';
import { redirect } from 'next/navigation';

const ADMIN_ROLES = new Set<UserRole>(['ADMIN', 'STAFF']);

async function getAdminAccessStatus(): Promise<'unauthenticated' | 'forbidden' | 'authorized'> {
  const { userId } = await auth();

  if (!userId) {
    return 'unauthenticated';
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { role: true },
  });

  return user && ADMIN_ROLES.has(user.role) ? 'authorized' : 'forbidden';
}

export async function requireAdminPageAccess(): Promise<void> {
  const status = await getAdminAccessStatus();

  if (status === 'unauthenticated') {
    redirect('/sign-in');
  }

  if (status === 'forbidden') {
    redirect('/');
  }
}

export async function requireAdminActionAccess(): Promise<void> {
  const status = await getAdminAccessStatus();

  if (status === 'unauthenticated') {
    throw new Error('Unauthorized');
  }

  if (status === 'forbidden') {
    throw new Error('Forbidden');
  }
}
