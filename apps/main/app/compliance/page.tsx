import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { prisma } from '@aah/database';
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle, Button } from '@aah/ui';
import { ExternalLink, Shield } from 'lucide-react';

export default async function ComplianceRegulationPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect('/sign-in');
  }

  const dbUser = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { id: true, role: true },
  });

  if (!dbUser || (dbUser.role !== 'COMPLIANCE' && dbUser.role !== 'ADMIN')) {
    redirect('/');
  }

  const [changes, sources, unackedCount] = await Promise.all([
    prisma.regulationChange.findMany({
      orderBy: { detectedAt: 'desc' },
      take: 30,
      include: {
        source: { select: { name: true, sourceType: true, feedUrl: true } },
        ...(dbUser
          ? {
              acknowledgements: {
                where: { userId: dbUser.id },
                select: { id: true },
              },
            }
          : {}),
      },
    }),
    prisma.regulationSource.findMany({
      orderBy: [{ sourceType: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        sourceType: true,
        isActive: true,
        lastSuccessAt: true,
        lastErrorAt: true,
        consecutiveFailures: true,
      },
    }),
    dbUser
      ? prisma.regulationChange.count({
          where: {
            NOT: {
              acknowledgements: { some: { userId: dbUser.id } },
            },
          },
        })
      : Promise.resolve(0),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Regulation changes</h2>
          <p className="text-muted-foreground">
            Shadow ingestion records feed fingerprints; acknowledgements are audited per user.
          </p>
        </div>
        <div className="rounded-md border bg-card px-4 py-3 text-sm">
          <div className="flex items-center gap-2 font-medium">
            <Shield className="h-4 w-4" />
            Unacknowledged (you): {unackedCount}
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sources</CardTitle>
          <CardDescription>
            Polling cadence is enforced via Vercel cron hitting the compliance service (RSS/API first).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            {sources.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-lg border p-3 text-sm"
              >
                <div>
                  <div className="font-medium">
                    {s.name}{' '}
                    <Badge variant="outline" className="ml-2">
                      {s.sourceType}
                    </Badge>
                  </div>
                  <div className="text-muted-foreground">
                    Last OK: {s.lastSuccessAt?.toLocaleString() ?? '—'} · Fail streak:{' '}
                    {s.consecutiveFailures}
                  </div>
                </div>
                <Badge variant={s.isActive ? 'default' : 'secondary'}>
                  {s.isActive ? 'active' : 'off'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent changes</CardTitle>
          <CardDescription>
            Click through for evidence URLs, hashes, and acknowledgement.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {changes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No changes recorded yet. Run a cron cycle or use “check now” from the compliance API.
            </p>
          ) : (
            changes.map((c) => (
              <div
                key={c.id}
                className="flex flex-col gap-2 rounded-lg border p-4 md:flex-row md:items-center md:justify-between"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{c.severity}</Badge>
                    <Badge variant="outline">{c.source.sourceType}</Badge>
                    {c.requiresManualReview && (
                      <Badge variant="destructive">review</Badge>
                    )}
                    {dbUser &&
                    (c as { acknowledgements?: { id: string }[] }).acknowledgements
                      ?.length ? (
                      <Badge variant="default">acked</Badge>
                    ) : null}
                  </div>
                  <p className="font-medium">{c.title ?? 'Feed update'}</p>
                  <p className="line-clamp-2 text-sm text-muted-foreground">{c.summary}</p>
                  <p className="text-xs text-muted-foreground">
                    {c.detectedAt.toLocaleString()}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/compliance/changes/${c.id}`}>Details</Link>
                  </Button>
                  <Button variant="ghost" size="sm" asChild>
                    <a href={c.evidenceUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-1 h-4 w-4" />
                      Evidence
                    </a>
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
