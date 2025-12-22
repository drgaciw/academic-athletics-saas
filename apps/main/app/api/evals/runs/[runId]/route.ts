import { NextResponse } from "next/server";
import type { EvalReport } from "@aah/ai-evals";

// Mock data - replace with actual database queries
export async function GET(
  request: Request,
  { params }: { params: { runId: string } },
) {
  try {
    const { runId } = params;

    // TODO: Replace with actual database query
    const mockReport: EvalReport = {
      id: runId,
      dataset: {
        id: "dataset-1",
        name: "NCAA Compliance Test Suite",
        description: "Comprehensive test cases for NCAA eligibility rules",
        version: "1.0.0",
        testCases: [],
      },
      modelConfig: {
        provider: "openai",
        model: "gpt-4",
        temperature: 0.7,
        maxTokens: 1000,
      },
      scorerConfig: {
        type: "llm-judge",
        threshold: 0.8,
      },
      results: [],
      metrics: {
        totalTests: 50,
        passedTests: 47,
        failedTests: 3,
        passRate: 0.94,
        averageScore: 0.94,
        medianScore: 0.94,
        minScore: 0.85,
        maxScore: 1.0,
        standardDeviation: 0.08,
        confidenceInterval: {
          lower: 0.92,
          upper: 0.96,
        },
        categoryBreakdown: {
          "Initial Eligibility": {
            totalTests: 20,
            passedTests: 19,
            failedTests: 1,
            passRate: 0.95,
            averageScore: 0.95,
            averageLatencyMs: 1100,
          },
          "Continuing Eligibility": {
            totalTests: 15,
            passedTests: 14,
            failedTests: 1,
            passRate: 0.933,
            averageScore: 0.933,
            averageLatencyMs: 1250,
          },
          "Progress Toward Degree": {
            totalTests: 15,
            passedTests: 14,
            failedTests: 1,
            passRate: 0.933,
            averageScore: 0.933,
            averageLatencyMs: 1250,
          },
        },
        totalLatencyMs: 60000,
        averageLatencyMs: 1200,
        totalTokens: {
          input: 25000,
          output: 15000,
          total: 40000,
        },
        totalCost: 0.45,
      },
      timestamp: new Date().toISOString(),
      duration: 60000,
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
        issues: i % 17 === 0 ? ["GPA below minimum"] : [],
      },
      actual: {
        eligible: i % 17 !== 0,
        issues: i % 17 === 0 ? ["GPA below minimum"] : [],
      },
      score: {
        passed: i % 17 !== 0,
        score: i % 17 !== 0 ? 1.0 : 0.0,
      },
      metadata: {
        modelId: "gpt-4",
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
    console.error("Error fetching eval run:", error);
    return NextResponse.json(
      { error: "Failed to fetch eval run" },
      { status: 500 },
    );
  }
}
