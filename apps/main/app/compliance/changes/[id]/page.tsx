import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
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
import { ArrowLeft } from 'lucide-react';
import { AcknowledgeForm } from './acknowledge-form';

interface PageProps {
  params: { id: string };
}

export default async function ComplianceChangeDetailPage({ params }: PageProps) {
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

  const change = await prisma.regulationChange.findUnique({
    where: { id: params.id },
    include: {
      source: true,
      snapshot: true,
      acknowledgements: {
        where: { userId: dbUser.id },
      },
    },
  });

  if (!change) {
    notFound();
  }

  const acked = change.acknowledgements.length > 0;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/compliance">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to list
        </Button>
      </Link>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{change.severity}</Badge>
            <Badge variant="outline">{change.source.sourceType}</Badge>
            {change.requiresManualReview && <Badge variant="destructive">Manual review</Badge>}
            {acked && <Badge>Acknowledged</Badge>}
          </div>
          <CardTitle className="mt-2">{change.title ?? 'Regulation change'}</CardTitle>
          <CardDescription>{change.detectedAt.toLocaleString()}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-relaxed">{change.summary}</p>
          <div className="rounded-md bg-muted/50 p-4 text-sm">
            <p>
              <span className="font-medium">Evidence URL:</span>{' '}
              <a
                href={change.evidenceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                {change.evidenceUrl}
              </a>
            </p>
            <p className="mt-2">
              <span className="font-medium">Classification:</span> {change.classification}
            </p>
            <p className="mt-1">
              <span className="font-medium">Domains:</span>{' '}
              {change.impactedDomains.join(', ') || '—'}
            </p>
            <p className="mt-1">
              <span className="font-medium">Coach-visible:</span>{' '}
              {change.coachVisible ? 'yes' : 'no'}
            </p>
          </div>

          {change.snapshot && (
            <div className="rounded-md border p-4 text-xs">
              <p className="font-semibold">Snapshot</p>
              <p className="mt-2 break-all text-muted-foreground">
                hash: {change.snapshot.contentHash}
              </p>
              <p className="mt-1 text-muted-foreground">
                parser v{change.snapshot.parserVersion} · fetched{' '}
                {change.snapshot.fetchedAt.toLocaleString()}
              </p>
              <pre className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap rounded bg-muted p-2">
                {change.snapshot.normalizedBody.slice(0, 4000)}
                {change.snapshot.normalizedBody.length > 4000 ? '…' : ''}
              </pre>
            </div>
          )}

          {!acked && (
            <AcknowledgeForm changeId={change.id} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
