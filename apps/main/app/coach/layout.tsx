import { auth } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import { prisma } from '@aah/database';

export default async function CoachLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = auth();

  if (!userId) {
    redirect('/sign-in');
  }

  // Verify user has COACH role
  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { role: true },
  });

  if (!user || user.role !== 'COACH') {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-6">
        {children}
      </div>
    </div>
  );
}
