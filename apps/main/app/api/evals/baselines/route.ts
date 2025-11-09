import { NextResponse } from 'next/server';
import type { BaselineListItem } from '@/lib/types/evals';

// Mock data - replace with actual database queries
export async function GET() {
  try {
    // TODO: Replace with actual database query
    const mockBaselines: BaselineListItem[] = [
      {
        id: 'baseline-001',
        name: 'Compliance Baseline v1.0',
        description: 'Initial baseline for compliance testing',
        runId: 'run-001',
        datasetId: 'compliance-v1',
        datasetName: 'NCAA Compliance Tests',
        accuracy: 94.5,
        passRate: 92.0,
        isActive: true,
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'baseline-002',
        name: 'Conversational Baseline v1.0',
        description: 'Initial baseline for conversational AI',
        runId: 'run-002',
        datasetId: 'conversational-v1',
        datasetName: 'Conversational AI Tests',
        accuracy: 90.0,
        passRate: 88.0,
        isActive: true,
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];

    return NextResponse.json({ baselines: mockBaselines });
  } catch (error) {
    console.error('Error fetching baselines:', error);
    return NextResponse.json(
      { error: 'Failed to fetch baselines' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // TODO: Create baseline in database
    const newBaseline: BaselineListItem = {
      id: `baseline-${Date.now()}`,
      name: body.name,
      description: body.description,
      runId: body.runId,
      datasetId: body.datasetId,
      datasetName: body.datasetName || 'Unknown Dataset',
      accuracy: body.accuracy || 0,
      passRate: body.passRate || 0,
      isActive: body.isActive || false,
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({ baseline: newBaseline });
  } catch (error) {
    console.error('Error creating baseline:', error);
    return NextResponse.json(
      { error: 'Failed to create baseline' },
      { status: 500 }
    );
  }
}
