'use server';

import { auth } from '@clerk/nextjs/server';
import { prisma } from '@aah/database';
import { revalidatePath } from 'next/cache';

export async function acknowledgeRegulationChange(
  changeId: string,
  notes?: string
): Promise<{ ok: boolean; error?: string }> {
  const { userId } = await auth();
  if (!userId) {
    return { ok: false, error: 'Not signed in' };
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { id: true, role: true },
  });

  if (!user || (user.role !== 'COMPLIANCE' && user.role !== 'ADMIN')) {
    return { ok: false, error: 'Forbidden' };
  }

  const change = await prisma.regulationChange.findUnique({
    where: { id: changeId },
  });
  if (!change) {
    return { ok: false, error: 'Change not found' };
  }

  await prisma.regulationAcknowledgement.upsert({
    where: {
      changeId_userId: { changeId, userId: user.id },
    },
    create: {
      changeId,
      userId: user.id,
      notes: notes?.slice(0, 2000) ?? null,
    },
    update: {
      notes: notes?.slice(0, 2000) ?? null,
      acknowledgedAt: new Date(),
    },
  });

  revalidatePath('/compliance');
  revalidatePath(`/compliance/changes/${changeId}`);
  return { ok: true };
}
