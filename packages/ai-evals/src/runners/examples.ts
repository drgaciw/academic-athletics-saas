/**
 * Example usage of the AI evaluation runners
 *
 * This file demonstrates how to use the different runners to evaluate
 * AI features with various model configurations.
 */

import {
  ComplianceRunner,
  ConversationalRunner,
  AdvisingRunner,
  RiskPredictionRunner,
  RAGRunner,
  runModelComparison,
  runParallelComparison,
  formatComparisonReport,
} from './index';
import {
  TestCase,
  RunnerConfig,
  ComplianceInput,
  ComplianceOutput,
  ConversationalInput,
  ConversationalOutput,
  AdvisingInput,
  AdvisingOutput,
  RiskPredictionInput,
  RiskPredictionOutput,
  RAGInput,
  RAGOutput,
} from '../types';

/**
 * Example 1: Run a single test case with ComplianceRunner
 */
export async function exampleComplianceSingleTest() {
  const runner = new ComplianceRunner();

  const testCase: TestCase<ComplianceInput, ComplianceOutput> = {
    id: 'compliance-001',
    input: {
      studentId: 'SA12345',
      gpa: 2.8,
      creditHours: 24,
      progressTowardDegree: 0.35,
      semester: 'fall-2025',
    },
    expected: {
      eligible: true,
      issues: [],
      recommendations: [],
    },
    metadata: {
      difficulty: 'easy',
      category: 'gpa-check',
      tags: ['ncaa', 'eligibility', 'gpa'],
      createdAt: new Date(),
      source: 'synthetic',
    },
  };

  const config: RunnerConfig = {
    modelId: 'gpt-4',
    temperature: 0.1,
    maxTokens: 1000,
    timeout: 30000,
    retries: 3,
  };

  const result = await runner.runTestCase(testCase, config);

  console.log('Result:', JSON.stringify(result, null, 2));
  console.log('Latency:', result.metadata.latency, 'ms');
  console.log('Cost:', result.metadata.cost, 'USD');
  console.log('Tokens:', result.metadata.tokenUsage.total);

  return result;
}

/**
 * Example 2: Run multiple test cases with ConversationalRunner
 */
export async function exampleConversationalDataset() {
  const runner = new ConversationalRunner();

  const testCases: TestCase<ConversationalInput, ConversationalOutput>[] = [
    {
      id: 'chat-001',
      input: {
        message: 'What are the NCAA GPA requirements for freshman eligibility?',
        context: {
          userId: 'user123',
          role: 'student-athlete',
        },
      },
      expected: {
        answer:
          'NCAA Division I requires incoming freshmen to have a minimum 2.3 GPA in core courses.',
        citations: ['ncaa-manual-14.3'],
      },
      metadata: {
        difficulty: 'medium',
        category: 'policy-question',
        tags: ['ncaa', 'eligibility', 'gpa'],
        createdAt: new Date(),
        source: 'production',
      },
    },
    {
      id: 'chat-002',
      input: {
        message: 'How many credit hours do I need to complete each year?',
        context: {
          userId: 'user456',
          role: 'student-athlete',
        },
      },
      expected: {
        answer:
          'You must complete 24 semester hours between academic years, with at least 18 earned in the previous year.',
        citations: ['ncaa-manual-14.4'],
      },
      metadata: {
        difficulty: 'easy',
        category: 'policy-question',
        tags: ['ncaa', 'credit-hours'],
        createdAt: new Date(),
        source: 'synthetic',
      },
    },
  ];

  const config: RunnerConfig = {
    modelId: 'claude-sonnet-4',
    temperature: 0.7,
    maxTokens: 2000,
  };

  const results = await runner.runDataset(testCases, config, {
    parallel: false,
    onProgress: (completed, total) => {
      console.log(`Progress: ${completed}/${total}`);
    },
  });

  console.log(`Completed ${results.length} test cases`);
  console.log(
    'Total cost:',
    results.reduce((sum, r) => sum + r.metadata.cost, 0),
    'USD'
  );

  return results;
}

/**
 * Example 3: Compare multiple models on the same dataset
 */
export async function exampleModelComparison() {
  const runner = new AdvisingRunner();

  const testCases: TestCase<AdvisingInput, AdvisingOutput>[] = [
    {
      id: 'advising-001',
      input: {
        studentId: 'SA12345',
        major: 'Business Administration',
        completedCourses: ['ECON101', 'MATH110'],
        semester: 'spring-2026',
        athleticSchedule: {
          practices: ['MWF 2-5pm'],
          games: ['Sat 1pm'],
        },
      },
      expected: {
        recommendations: [
          {
            courseId: 'ECON201',
            reason: 'Required for major, prerequisite satisfied',
            conflicts: [],
          },
        ],
        warnings: [],
      },
      metadata: {
        difficulty: 'hard',
        category: 'schedule-conflict',
        tags: ['advising', 'scheduling', 'athletics'],
        createdAt: new Date(),
        source: 'edge-case',
      },
    },
  ];

  const configs: RunnerConfig[] = [
    {
      modelId: 'gpt-4',
      temperature: 0.3,
      maxTokens: 2000,
    },
    {
      modelId: 'gpt-4-turbo',
      temperature: 0.3,
      maxTokens: 2000,
    },
    {
      modelId: 'claude-sonnet-4',
      temperature: 0.3,
      maxTokens: 2000,
    },
    {
      modelId: 'claude-opus-4',
      temperature: 0.3,
      maxTokens: 2000,
    },
  ];

  const report = await runModelComparison(runner, testCases, configs, {
    parallel: true,
    concurrency: 2,
    scorerConfig: {
      strategy: 'exact',
    },
    onProgress: (completed, total) => {
      console.log(`Progress: ${completed}/${total}`);
    },
  });

  console.log(formatComparisonReport(report));

  return report;
}

/**
 * Example 4: Parallel comparison (all models run simultaneously)
 */
export async function exampleParallelComparison() {
  const runner = new RiskPredictionRunner();

  const testCases: TestCase<RiskPredictionInput, RiskPredictionOutput>[] = [
    {
      id: 'risk-001',
      input: {
        studentId: 'SA12345',
        academicMetrics: {
          gpa: 2.5,
          creditHours: 24,
          attendanceRate: 0.85,
        },
        athleticMetrics: {
          performanceScore: 85,
          injuryHistory: 2,
          travelHours: 10,
        },
        supportMetrics: {
          tutoringHours: 3,
          advisingMeetings: 2,
        },
      },
      expected: {
        riskScore: 45,
        riskLevel: 'medium',
        factors: [],
        recommendations: [],
      },
      metadata: {
        difficulty: 'medium',
        category: 'risk-assessment',
        tags: ['risk', 'prediction', 'intervention'],
        createdAt: new Date(),
        source: 'synthetic',
      },
    },
  ];

  const configs: RunnerConfig[] = [
    { modelId: 'gpt-4', temperature: 0.1 },
    { modelId: 'claude-sonnet-4', temperature: 0.1 },
  ];

  const report = await runParallelComparison(runner, testCases, configs, {
    scorerConfig: {
      strategy: 'custom',
      customScorer: async (expected, actual) => {
        // Custom scoring: check if risk level matches
        const levelMatch = expected.riskLevel === actual.riskLevel;
        // Check if risk score is within 10 points
        const scoreClose =
          Math.abs(expected.riskScore - actual.riskScore) <= 10;

        return {
          passed: levelMatch && scoreClose,
          score: levelMatch && scoreClose ? 1.0 : levelMatch ? 0.5 : 0.0,
          explanation: `Risk level: ${levelMatch ? 'match' : 'mismatch'}, Score difference: ${Math.abs(expected.riskScore - actual.riskScore)}`,
        };
      },
    },
    onProgress: (completed, total) => {
      console.log(`Progress: ${completed}/${total}`);
    },
  });

  console.log(formatComparisonReport(report));

  return report;
}

/**
 * Example 5: RAG evaluation with custom metrics
 */
export async function exampleRAGEvaluation() {
  const runner = new RAGRunner();

  const testCases: TestCase<RAGInput, RAGOutput>[] = [
    {
      id: 'rag-001',
      input: {
        query: 'What are the requirements for maintaining NCAA eligibility?',
        maxDocuments: 5,
      },
      expected: {
        answer:
          'To maintain NCAA eligibility, student-athletes must meet GPA requirements, complete minimum credit hours, and make satisfactory progress toward their degree.',
        sources: [
          {
            documentId: 'ncaa-manual-14',
            content: 'NCAA eligibility requirements...',
            relevanceScore: 0.95,
          },
        ],
        confidence: 0.9,
      },
      metadata: {
        difficulty: 'medium',
        category: 'retrieval-quality',
        tags: ['rag', 'retrieval', 'ncaa'],
        createdAt: new Date(),
        source: 'synthetic',
      },
    },
  ];

  const config: RunnerConfig = {
    modelId: 'gpt-4',
    temperature: 0.3,
    maxTokens: 3000,
  };

  const results = await runner.runDataset(testCases, config, {
    parallel: false,
  });

  // Analyze retrieval quality
  for (const result of results) {
    console.log(`\nTest Case: ${result.testCaseId}`);
    console.log(`Retrieved ${result.actual.sources.length} sources`);
    console.log(`Confidence: ${result.actual.confidence}`);

    // Calculate average relevance score
    const avgRelevance =
      result.actual.sources.reduce((sum, s) => sum + s.relevanceScore, 0) /
      result.actual.sources.length;
    console.log(`Average relevance: ${avgRelevance.toFixed(3)}`);
  }

  return results;
}

/**
 * Example 6: Batch evaluation with error handling
 */
export async function exampleBatchWithErrorHandling() {
  const runner = new ComplianceRunner();

  // Include some potentially problematic test cases
  const testCases: TestCase<ComplianceInput, ComplianceOutput>[] = [
    {
      id: 'compliance-valid',
      input: {
        studentId: 'SA001',
        gpa: 3.0,
        creditHours: 30,
        progressTowardDegree: 0.5,
        semester: 'fall-2025',
      },
      expected: {
        eligible: true,
        issues: [],
        recommendations: [],
      },
      metadata: {
        difficulty: 'easy',
        category: 'gpa-check',
        tags: ['ncaa'],
        createdAt: new Date(),
        source: 'synthetic',
      },
    },
    {
      id: 'compliance-edge-case',
      input: {
        studentId: 'SA002',
        gpa: 1.9,
        creditHours: 15,
        progressTowardDegree: 0.2,
        semester: 'spring-2026',
      },
      expected: {
        eligible: false,
        issues: ['GPA below minimum', 'Insufficient credit hours'],
        recommendations: ['Enroll in summer courses', 'Meet with advisor'],
      },
      metadata: {
        difficulty: 'hard',
        category: 'edge-case',
        tags: ['ncaa', 'low-gpa'],
        createdAt: new Date(),
        source: 'edge-case',
      },
    },
  ];

  const config: RunnerConfig = {
    modelId: 'gpt-4',
    temperature: 0.1,
    timeout: 10000, // Short timeout for demonstration
    retries: 2,
  };

  const results = await runner.runDataset(testCases, config, {
    parallel: true,
    concurrency: 2,
    onProgress: (completed, total) => {
      console.log(`Progress: ${completed}/${total}`);
    },
  });

  // Analyze results
  const successful = results.filter((r) => !r.metadata.error);
  const failed = results.filter((r) => r.metadata.error);

  console.log(`\nSuccessful: ${successful.length}`);
  console.log(`Failed: ${failed.length}`);

  if (failed.length > 0) {
    console.log('\nFailed tests:');
    for (const result of failed) {
      console.log(`- ${result.testCaseId}: ${result.metadata.error}`);
    }
  }

  return results;
}
