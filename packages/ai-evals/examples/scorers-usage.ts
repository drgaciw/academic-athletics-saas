/**
 * AI Evaluation Framework - Scorers Usage Examples
 *
 * Comprehensive examples showing how to use all scorer types
 */

import {
  ExactMatchScorer,
  SemanticSimilarityScorer,
  LLMJudgeScorer,
  CommonRubrics,
  f1Scorer,
  recallAtK,
  CommonRecallConfigs,
  calculateMetrics,
  formatMetricsReport,
  type TestCaseResult,
} from '@aah/ai-evals';

// ============================================================================
// Example 1: Compliance Status Validation with ExactMatchScorer
// ============================================================================

async function exampleComplianceValidation() {
  console.log('=== Compliance Status Validation ===\n');

  const exactMatch = new ExactMatchScorer({
    ignoreKeyOrder: true,
    ignorePaths: ['root.metadata.timestamp', 'root.metadata.calculatedAt'],
  });

  // Test Case 1: Perfect match
  const actual1 = {
    status: 'ELIGIBLE',
    category: 'CONTINUING',
    violations: [],
    recommendations: [],
    metadata: {
      timestamp: 1234567890,
      calculatedAt: '2024-01-01T00:00:00Z',
    },
  };

  const expected1 = {
    status: 'ELIGIBLE',
    category: 'CONTINUING',
    violations: [],
    recommendations: [],
    metadata: {
      timestamp: 9999999999, // Different timestamp (ignored)
      calculatedAt: '2024-12-31T23:59:59Z', // Different time (ignored)
    },
  };

  const result1 = exactMatch.score(actual1, expected1);
  console.log('Test 1 - Perfect Match:');
  console.log(`  Score: ${result1.score}`);
  console.log(`  Passed: ${result1.passed}`);
  console.log(`  Reason: ${result1.reason}\n`);

  // Test Case 2: Status mismatch
  const actual2 = {
    status: 'INELIGIBLE',
    category: 'CONTINUING',
    violations: ['GPA_LOW'],
  };

  const expected2 = {
    status: 'ELIGIBLE',
    category: 'CONTINUING',
    violations: [],
  };

  const result2 = exactMatch.score(actual2, expected2);
  console.log('Test 2 - Status Mismatch:');
  console.log(`  Score: ${result2.score}`);
  console.log(`  Passed: ${result2.passed}`);
  console.log(`  Reason: ${result2.reason}\n`);
}

// ============================================================================
// Example 2: Conversational AI Evaluation with SemanticSimilarityScorer
// ============================================================================

async function exampleConversationalEvaluation() {
  console.log('=== Conversational AI Evaluation ===\n');

  const semanticScorer = new SemanticSimilarityScorer({
    apiKey: process.env.OPENAI_API_KEY!,
    threshold: 0.85,
    cacheEmbeddings: true,
  });

  const testCases = [
    {
      actual: 'The student is currently eligible to compete in NCAA Division I athletics.',
      expected: 'Student meets all eligibility requirements for competition.',
    },
    {
      actual: 'Your current GPA is below the minimum requirement of 2.3 for NCAA eligibility.',
      expected: 'Unfortunately, your GPA does not meet NCAA eligibility standards.',
    },
    {
      actual: 'I recommend taking MATH 101 next semester to fulfill your core requirements.',
      expected: 'You should enroll in Introduction to Calculus for your math requirement.',
    },
  ];

  for (let i = 0; i < testCases.length; i++) {
    const { actual, expected } = testCases[i];
    const result = await semanticScorer.score(actual, expected);

    console.log(`Test Case ${i + 1}:`);
    console.log(`  Actual: "${actual}"`);
    console.log(`  Expected: "${expected}"`);
    console.log(`  Similarity: ${(result.score * 100).toFixed(1)}%`);
    console.log(`  Passed: ${result.passed}\n`);
  }

  // Show cache stats
  const cacheStats = semanticScorer.getCacheStats();
  console.log('Cache Statistics:');
  console.log(`  Size: ${cacheStats.size} embeddings`);
  console.log(`  Enabled: ${cacheStats.enabled}\n`);
}

// ============================================================================
// Example 3: Response Quality Assessment with LLMJudgeScorer
// ============================================================================

async function exampleResponseQualityEvaluation() {
  console.log('=== Response Quality Assessment ===\n');

  const llmJudge = new LLMJudgeScorer({
    apiKey: process.env.OPENAI_API_KEY!,
    provider: 'openai',
    model: 'gpt-4o',
    rubric: CommonRubrics.conversationQuality(),
    temperature: 0.0,
  });

  const userQuery = 'Am I eligible to play this season?';

  const actualResponse = `Based on your current academic standing, you are eligible to compete this season.
Your GPA of 3.2 meets the minimum requirement of 2.3, and you've completed all necessary credit hours.`;

  const expectedResponse = `You are eligible for competition. Your academic progress meets NCAA requirements.`;

  const result = await llmJudge.score(actualResponse, expectedResponse, {
    input: userQuery,
  });

  console.log('LLM Judge Evaluation:');
  console.log(`  Overall Score: ${(result.score * 100).toFixed(1)}%`);
  console.log(`  Passed: ${result.passed}`);
  console.log(`  Reasoning: ${result.reason}\n`);
  console.log('  Criteria Breakdown:');
  for (const [criterion, score] of Object.entries(result.breakdown ?? {})) {
    console.log(`    ${criterion}: ${(score * 100).toFixed(1)}%`);
  }
  console.log();
}

// ============================================================================
// Example 4: Risk Prediction Evaluation with PrecisionRecallScorer
// ============================================================================

async function exampleRiskPredictionEvaluation() {
  console.log('=== Risk Prediction Evaluation ===\n');

  const f1 = f1Scorer({ minScore: 0.7 });

  // Student risk predictions (1 = high risk, 0 = low risk)
  const predictions = [1, 1, 0, 0, 1, 0, 1, 0, 0, 1];
  const actualOutcomes = [1, 1, 1, 0, 0, 0, 1, 0, 0, 0];

  const result = f1.score(predictions, actualOutcomes);

  console.log('Risk Prediction Metrics:');
  console.log(`  F1 Score: ${(result.score * 100).toFixed(1)}%`);
  console.log(`  Passed: ${result.passed}`);
  console.log('\n  Confusion Matrix:');
  console.log(`    True Positives: ${result.breakdown?.truePositives}`);
  console.log(`    True Negatives: ${result.breakdown?.trueNegatives}`);
  console.log(`    False Positives: ${result.breakdown?.falsePositives}`);
  console.log(`    False Negatives: ${result.breakdown?.falseNegatives}`);
  console.log('\n  Detailed Metrics:');
  console.log(`    Precision: ${(result.breakdown?.precision! * 100).toFixed(1)}%`);
  console.log(`    Recall: ${(result.breakdown?.recall! * 100).toFixed(1)}%`);
  console.log(`    Accuracy: ${(result.breakdown?.accuracy! * 100).toFixed(1)}%`);
  console.log();
}

// ============================================================================
// Example 5: RAG Retrieval Quality with RecallAtKScorer
// ============================================================================

async function exampleRAGEvaluation() {
  console.log('=== RAG Retrieval Quality Evaluation ===\n');

  const recall = CommonRecallConfigs.rag(); // k=5, minRecall=0.8

  // Documents retrieved by RAG system
  const retrieved = [
    'ncaa_eligibility_rule_14.2.1',
    'gpa_requirements_continuing',
    'course_requirements_core',
    'academic_progress_40_60_80',
    'unrelated_scholarship_doc',
  ];

  // Relevant documents for the query
  const relevant = [
    'ncaa_eligibility_rule_14.2.1',
    'gpa_requirements_continuing',
    'course_requirements_core',
  ];

  const result = recall.score(retrieved, relevant);

  console.log('RAG Retrieval Evaluation:');
  console.log(`  Recall@5: ${(result.score * 100).toFixed(1)}%`);
  console.log(`  Passed: ${result.passed}`);
  console.log(`  Relevant in Top 5: ${result.breakdown?.relevantInTopK}/${result.breakdown?.totalRelevant}`);
  console.log('\n  Retrieved Documents:');
  result.metadata?.retrievedDocuments.forEach((doc: string, i: number) => {
    const isRelevant = relevant.includes(doc);
    console.log(`    ${i + 1}. ${doc} ${isRelevant ? '✓' : ''}`);
  });

  if ((result.metadata?.missedDocuments as string[])?.length > 0) {
    console.log('\n  Missed Relevant Documents:');
    (result.metadata?.missedDocuments as string[]).forEach((doc: string) => {
      console.log(`    - ${doc}`);
    });
  }
  console.log();
}

// ============================================================================
// Example 6: Multi-Scorer Test Suite with Metric Aggregation
// ============================================================================

async function exampleMultiScorerSuite() {
  console.log('=== Multi-Scorer Test Suite ===\n');

  // Initialize scorers
  const exactMatch = new ExactMatchScorer();
  const semantic = new SemanticSimilarityScorer({
    apiKey: process.env.OPENAI_API_KEY!,
    threshold: 0.85,
  });
  const f1 = f1Scorer({ minScore: 0.7 });

  // Build test results
  const results: TestCaseResult[] = [];

  // Compliance tests
  for (let i = 0; i < 10; i++) {
    const passed = Math.random() > 0.2; // 80% pass rate
    results.push({
      id: `compliance_test_${i}`,
      category: 'compliance',
      scorerResults: [
        {
          scorerName: 'ExactMatch',
          result: {
            score: passed ? 1.0 : 0.0,
            passed,
            reason: passed ? 'Exact match' : 'Status mismatch',
          },
        },
      ],
      passed,
    });
  }

  // Conversational tests
  for (let i = 0; i < 10; i++) {
    const score = 0.7 + Math.random() * 0.3; // 0.7-1.0
    const passed = score >= 0.85;
    results.push({
      id: `conversational_test_${i}`,
      category: 'conversational',
      scorerResults: [
        {
          scorerName: 'SemanticSimilarity',
          result: {
            score,
            passed,
            breakdown: { similarity: score },
          },
        },
      ],
      passed,
    });
  }

  // Risk prediction tests
  for (let i = 0; i < 10; i++) {
    const precision = 0.6 + Math.random() * 0.3;
    const recall = 0.6 + Math.random() * 0.3;
    const f1Score = (2 * precision * recall) / (precision + recall);
    const passed = f1Score >= 0.7;
    results.push({
      id: `risk_prediction_test_${i}`,
      category: 'risk_prediction',
      scorerResults: [
        {
          scorerName: 'F1Scorer',
          result: {
            score: f1Score,
            passed,
            breakdown: { precision, recall, f1: f1Score },
          },
        },
      ],
      passed,
    });
  }

  // Calculate aggregated metrics
  const metrics = calculateMetrics(results);

  // Print formatted report
  const report = formatMetricsReport(metrics);
  console.log(report);

  // Additional insights
  console.log('\nAdditional Insights:');
  console.log(`\nBest Performing Category: ${getBestCategory(metrics)}`);
  console.log(`Best Performing Scorer: ${getBestScorer(metrics)}`);
  console.log(
    `\nPercentile Distribution:\n  P25: ${metrics.customMetrics?.p25?.toFixed(3)}\n  P50: ${metrics.customMetrics?.p50?.toFixed(3)}\n  P75: ${metrics.customMetrics?.p75?.toFixed(3)}\n  P95: ${metrics.customMetrics?.p95?.toFixed(3)}`
  );
}

// Helper functions
function getBestCategory(metrics: any): string {
  let best = { name: '', passRate: 0 };
  for (const [name, cat] of Object.entries(metrics.byCategory ?? {})) {
    const categoryMetrics = cat as any;
    if (categoryMetrics.passRate > best.passRate) {
      best = { name, passRate: categoryMetrics.passRate };
    }
  }
  return `${best.name} (${(best.passRate * 100).toFixed(1)}%)`;
}

function getBestScorer(metrics: any): string {
  let best = { name: '', averageScore: 0 };
  for (const [name, scorer] of Object.entries(metrics.byScorer ?? {})) {
    const scorerMetrics = scorer as any;
    if (scorerMetrics.averageScore > best.averageScore) {
      best = { name, averageScore: scorerMetrics.averageScore };
    }
  }
  return `${best.name} (${best.averageScore.toFixed(3)})`;
}

// ============================================================================
// Run All Examples
// ============================================================================

async function main() {
  console.log('AI EVALUATION FRAMEWORK - SCORERS EXAMPLES\n');
  console.log('='.repeat(80));
  console.log();

  try {
    await exampleComplianceValidation();
    console.log('='.repeat(80));
    console.log();

    await exampleConversationalEvaluation();
    console.log('='.repeat(80));
    console.log();

    await exampleResponseQualityEvaluation();
    console.log('='.repeat(80));
    console.log();

    await exampleRiskPredictionEvaluation();
    console.log('='.repeat(80));
    console.log();

    await exampleRAGEvaluation();
    console.log('='.repeat(80));
    console.log();

    await exampleMultiScorerSuite();
    console.log('='.repeat(80));
  } catch (error) {
    console.error('Error running examples:', error);
    process.exit(1);
  }
}

// Run examples if executed directly
if (require.main === module) {
  main();
}

export {
  exampleComplianceValidation,
  exampleConversationalEvaluation,
  exampleResponseQualityEvaluation,
  exampleRiskPredictionEvaluation,
  exampleRAGEvaluation,
  exampleMultiScorerSuite,
};
