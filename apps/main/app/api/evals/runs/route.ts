import { NextResponse } from 'next/server';
import type { EvalRunListItem } from '@/lib/types/evals';

// Mock data - replace with actual database queries
export async function GET() {
  try {
    // TODO: Replace with actual database query from @aah/database
    const mockRuns: EvalRunListItem[] = [
      {
        id: 'run-001',
        datasetId: 'compliance-v1',
        datasetName: 'NCAA Compliance Tests',
        modelId: 'gpt-4',
        status: 'completed',
        accuracy: 94.5,
        passRate: 92.0,
        totalTests: 50,
        totalCost: 0.45,
        avgLatency: 1200,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        hasRegressions: false,
        regressionCount: 0,
      },
      {
        id: 'run-002',
        datasetId: 'conversational-v1',
        datasetName: 'Conversational AI Tests',
        modelId: 'claude-sonnet-4',
        status: 'completed',
        accuracy: 88.3,
        passRate: 85.0,
        totalTests: 40,
        totalCost: 0.32,
        avgLatency: 980,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        hasRegressions: true,
        regressionCount: 2,
      },
      {
        id: 'run-003',
        datasetId: 'advising-v1',
        datasetName: 'Advising Tests',
        modelId: 'gpt-4',
        status: 'running',
        accuracy: 0,
        passRate: 0,
        totalTests: 35,
        totalCost: 0,
        avgLatency: 0,
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        hasRegressions: false,
        regressionCount: 0,
      },
    ];

    return NextResponse.json({ runs: mockRuns });
  } catch (error) {
    console.error('Error fetching eval runs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch eval runs' },
      { status: 500 }
    );
  }
}
