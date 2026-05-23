import { NextResponse } from 'next/server';
import type { EvalRunDetailsReport, EvalRunDetailsResult } from '@/lib/types/evals';

export async function GET(
  _request: Request,
  props: { params: Promise<{ runId: string }> },
) {
  const params = await props.params;
  try {
    const { runId } = params;

    // TODO: Replace with actual database query
    const mockReport: EvalRunDetailsReport = {
      id: runId,
      metrics: {
        totalTests: 50,
        passedTests: 47,
        failedTests: 3,
        passRate: 0.94,
        totalCost: 0.45,
        categoryBreakdown: {
          'Initial Eligibility': {
            totalTests: 20,
            passedTests: 19,
            failedTests: 1,
            passRate: 0.95,
            averageScore: 0.95,
            averageLatencyMs: 1100,
          },
          'Continuing Eligibility': {
            totalTests: 15,
            passedTests: 14,
            failedTests: 1,
            passRate: 0.933,
            averageScore: 0.933,
            averageLatencyMs: 1250,
          },
          'Progress Toward Degree': {
            totalTests: 15,
            passedTests: 14,
            failedTests: 1,
            passRate: 0.933,
            averageScore: 0.933,
            averageLatencyMs: 1250,
          },
        },
      },
    };

    const mockResults: EvalRunDetailsResult[] = Array.from({ length: 50 }, (_, i) => ({
      testCaseId: `test-${i + 1}`,
      input: {
        studentId: `student-${i + 1}`,
        gpa: 2.5 + Math.random(),
        creditHours: 12 + Math.floor(Math.random() * 6),
      },
      expected: {
        eligible: i % 17 !== 0,
        issues: i % 17 === 0 ? ['GPA below minimum'] : [],
      },
      actual: {
        eligible: i % 17 !== 0,
        issues: i % 17 === 0 ? ['GPA below minimum'] : [],
      },
      score: {
        passed: i % 17 !== 0,
        score: i % 17 !== 0 ? 1.0 : 0.0,
      },
      metadata: {
        modelId: 'gpt-4',
        latency: 1000 + Math.random() * 500,
        cost: 0.009,
        timestamp: new Date(),
      },
    }));

    return NextResponse.json({
      report: mockReport,
      results: mockResults,
    });
  } catch (error) {
    console.error('Error fetching eval run:', error);
    return NextResponse.json({ error: 'Failed to fetch eval run' }, { status: 500 });
  }
}
