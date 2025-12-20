import { NextResponse } from 'next/server';

// Mock data - replace with actual database queries
export async function GET(
  request: Request,
  { params }: { params: { runId: string } }
) {
  try {
    const { runId } = params;

    // TODO: Replace with actual database query
    // Mock report structure for UI development
    const mockReport = {
      jobId: runId,
      summary: {
        totalTests: 50,
        passed: 47,
        failed: 3,
        accuracy: 94.0,
        avgLatency: 1200,
        totalCost: 0.45,
        duration: 60000,
        status: 'completed',
      },
      runSummaries: [],
      scoringResults: [],
      metrics: {
        totalTests: 50,
        passed: 47,
        failed: 3,
        accuracy: 94.0,
        passRate: 94.0,
        avgScore: 0.94,
        avgLatency: 1200,
        totalCost: 0.45,
        breakdown: {
          'Initial Eligibility': {
            category: 'Initial Eligibility',
            totalTests: 20,
            passed: 19,
            accuracy: 95.0,
            avgScore: 0.95,
            avgLatency: 1100,
            avgCost: 0.009,
          },
          'Continuing Eligibility': {
            category: 'Continuing Eligibility',
            totalTests: 15,
            passed: 14,
            accuracy: 93.3,
            avgScore: 0.933,
            avgLatency: 1250,
            avgCost: 0.01,
          },
          'Progress Toward Degree': {
            category: 'Progress Toward Degree',
            totalTests: 15,
            passed: 14,
            accuracy: 93.3,
            avgScore: 0.933,
            avgLatency: 1250,
            avgCost: 0.01,
          },
        },
      },
      regressions: [],
      recommendations: [
        {
          type: 'accuracy',
          severity: 'medium',
          title: 'Review failed test cases',
          description: '3 test cases failed in this run. Review the results to identify patterns.',
          actionable: true,
          suggestedActions: [
            'Examine failed test cases in the "Continuing Eligibility" category',
            'Check if edge cases need better handling',
          ],
        },
      ],
      generatedAt: new Date(),
    };

    // Mock test results
    const mockResults = Array.from({ length: 50 }, (_, i) => ({
      testCaseId: `test-${i + 1}`,
      input: {
        studentId: `student-${i + 1}`,
        gpa: 2.5 + Math.random(),
        creditHours: 12 + Math.floor(Math.random() * 6),
      },
      expected: {
        eligible: i % 17 !== 0, // Make some fail
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
    return NextResponse.json(
      { error: 'Failed to fetch eval run' },
      { status: 500 }
    );
  }
}
