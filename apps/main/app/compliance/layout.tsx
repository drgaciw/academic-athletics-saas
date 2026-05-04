import { auth } from '@clerk/nextjs/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { prisma } from '@aah/database';

export default async function ComplianceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { role: true },
  });

  if (!user || (user.role !== 'COMPLIANCE' && user.role !== 'ADMIN')) {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-muted/10">
      <header className="border-b bg-background">
        <div className="container mx-auto flex flex-col gap-4 px-4 py-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Compliance — Regulation watch</h1>
            <p className="text-sm text-muted-foreground">
              NCAA, federal, Oklahoma, and Summit League feed monitoring
            </p>
          </div>
          <nav className="flex gap-4 text-sm font-medium">
            <Link href="/compliance" className="text-primary hover:underline">
              Dashboard
            </Link>
            <Link href="/" className="text-muted-foreground hover:text-foreground">
              Home
            </Link>
          </nav>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
