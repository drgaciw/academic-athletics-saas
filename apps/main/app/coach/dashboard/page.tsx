import { auth } from '@clerk/nextjs/server';
import { prisma } from '@aah/database';
import {
  CoachDashboardClient,
  type RegulationDigestItem,
} from './coach-dashboard-client';

export default async function CoachDashboardPage() {
  const { userId } = await auth();

  let regulationDigest: RegulationDigestItem[] = [];

  if (userId) {
    const rows = await prisma.regulationChange.findMany({
      where: { coachVisible: true },
      orderBy: { detectedAt: 'desc' },
      take: 5,
      include: {
        source: { select: { sourceType: true } },
      },
    });

    regulationDigest = rows.map((r) => ({
      id: r.id,
      title: r.title,
      summary: r.summary,
      detectedAt: r.detectedAt.toISOString(),
      severity: r.severity,
      sourceType: r.source.sourceType,
    }));
  }

  return <CoachDashboardClient regulationDigest={regulationDigest} />;
}
