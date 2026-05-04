import { auth } from '@clerk/nextjs/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { prisma } from '@aah/database';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@aah/ui';
import { ArrowLeft, Scale } from 'lucide-react';

export default async function CoachUpdatesPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect('/sign-in');
  }

  const coach = await prisma.user.findFirst({
    where: { clerkId: userId, role: 'COACH' },
    select: { id: true },
  });

  if (!coach) {
    redirect('/');
  }

  const changes = await prisma.regulationChange.findMany({
    where: { coachVisible: true },
    orderBy: { detectedAt: 'desc' },
    take: 50,
    include: {
      source: { select: { sourceType: true, name: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/coach/dashboard">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Dashboard
          </Button>
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Regulation updates</h1>
        <p className="text-muted-foreground">
          Institution-approved highlights from NCAA, Oklahoma, federal, and Summit League feeds.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Feed changes
          </CardTitle>
          <CardDescription>
            {changes.length === 0
              ? 'No coach-visible updates yet. Compliance may still be reviewing sources.'
              : `Showing ${changes.length} update(s).`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {changes.map((c) => (
            <div
              key={c.id}
              className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm"
            >
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge variant="outline">{c.source.sourceType}</Badge>
                <Badge variant="secondary">{c.severity}</Badge>
                <span className="text-xs text-muted-foreground">
                  {c.detectedAt.toLocaleString()}
                </span>
              </div>
              <h3 className="font-semibold">{c.title ?? 'Update'}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{c.summary}</p>
              <a
                href={c.evidenceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-sm text-primary underline"
              >
                Source / evidence
              </a>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
