import { NextResponse } from 'next/server';
import { prisma } from '@aah/database';
import type { EvalRunListItem } from '@/lib/types/evals';

// Revalidate every 30 seconds
export const revalidate = 30;

export async function GET() {
  try {
    const runs = await prisma.evalRun.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        metrics: true,
      },
      take: 100, // Limit to recent 100 runs for now
    });

    const formattedRuns: EvalRunListItem[] = runs.map((run) => {
      return {
        id: run.id,
        datasetId: run.datasetId,
        datasetName: run.datasetName || 'Unknown Dataset',
        modelId: run.modelId,
        // Cast status to match the union type.
        // In a real scenario, we might want to validate this matches expected values.
        status: run.status as EvalRunListItem['status'],
        accuracy: run.metrics?.accuracy ?? 0,
        passRate: run.metrics?.passRate ?? 0,
        totalTests: run.metrics?.totalTests ?? 0,
        totalCost: run.metrics?.totalCost ?? 0,
        avgLatency: run.metrics?.avgLatencyMs ?? 0,
        createdAt: run.createdAt.toISOString(),
        // TODO: Implement regression detection logic
        hasRegressions: false,
        regressionCount: 0,
      };
    });

    return NextResponse.json({ runs: formattedRuns });
  } catch (error) {
    console.error('Error fetching eval runs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch eval runs' },
      { status: 500 }
    );
  }
}
