import { NextResponse } from 'next/server';
import type { DatasetListItem } from '@/lib/types/evals';

// Mock data - replace with actual @aah/ai-evals DatasetManager
export async function GET() {
  try {
    // TODO: Use DatasetManager from @aah/ai-evals
    const mockDatasets: DatasetListItem[] = [
      {
        id: 'compliance-v1',
        name: 'NCAA Compliance Tests',
        description: 'Test cases for NCAA Division I eligibility validation',
        version: '1.0.0',
        testCaseCount: 50,
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'conversational-v1',
        name: 'Conversational AI Tests',
        description: 'Test cases for chat response quality and safety',
        version: '1.2.0',
        testCaseCount: 40,
        createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'advising-v1',
        name: 'Advising Tests',
        description: 'Test cases for course recommendations and scheduling',
        version: '1.0.0',
        testCaseCount: 35,
        createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];

    return NextResponse.json({ datasets: mockDatasets });
  } catch (error) {
    console.error('Error fetching datasets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch datasets' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // TODO: Use DatasetManager to create dataset
    const newDataset: DatasetListItem = {
      id: `dataset-${Date.now()}`,
      name: body.name,
      description: body.description,
      version: '1.0.0',
      testCaseCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({ dataset: newDataset });
  } catch (error) {
    console.error('Error creating dataset:', error);
    return NextResponse.json(
      { error: 'Failed to create dataset' },
      { status: 500 }
    );
  }
}
