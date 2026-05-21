import { auth } from '@clerk/nextjs/server';
import { prisma, type UserRole } from '@aah/database';
import { NextResponse } from 'next/server';

const EVAL_API_ROLES = new Set<UserRole>(['ADMIN', 'COMPLIANCE']);

export async function requireEvalApiAccess(): Promise<NextResponse | null> {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { role: true },
  });

  if (!user || !EVAL_API_ROLES.has(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return null;
}
