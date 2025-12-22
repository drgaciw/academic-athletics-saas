import { NextResponse } from 'next/server';
import type { TrendDataPoint } from '@/lib/types/evals';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

// Mock data - replace with actual database queries
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const datasetId = searchParams.get('datasetId');
    const days = parseInt(searchParams.get('days') || '30');

    // TODO: Replace with actual database query
    const mockTrends: TrendDataPoint[] = Array.from({ length: days }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (days - i - 1));

      return {
        date: date.toISOString().split('T')[0],
        accuracy: 85 + Math.random() * 10,
        passRate: 83 + Math.random() * 12,
        avgLatency: 1000 + Math.random() * 500,
        cost: 0.3 + Math.random() * 0.3,
      };
    });

    return NextResponse.json({ trends: mockTrends });
  } catch (error) {
    console.error('Error fetching trends:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trends' },
      { status: 500 }
    );
  }
}
