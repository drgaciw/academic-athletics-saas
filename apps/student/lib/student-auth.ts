import { auth } from '@clerk/nextjs/server';
import { prisma } from '@aah/database';
import { redirect } from 'next/navigation';

async function getStudentAccessStatus(): Promise<'unauthenticated' | 'forbidden' | 'authorized'> {
  const { userId } = await auth();

  if (!userId) {
    return 'unauthenticated';
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { role: true },
  });

  return user?.role === 'STUDENT' ? 'authorized' : 'forbidden';
}

export async function requireStudentPageAccess(): Promise<void> {
  const status = await getStudentAccessStatus();

  if (status === 'unauthenticated') {
    redirect('/sign-in');
  }

  if (status === 'forbidden') {
    redirect('/');
  }
}
