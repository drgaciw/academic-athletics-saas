/**
 * AI Evaluation Framework - Scorers Module
 *
 * Exports all scorer implementations and utilities
 */

// Types
export type {
  Scorer,
  ScorerResult,
  ScoringContext,
  ExactMatchScorerConfig,
  SemanticSimilarityScorerConfig,
  LLMJudgeScorerConfig,
  PrecisionRecallScorerConfig,
  RecallAtKScorerConfig,
  EvaluationRubric,
  RubricCriterion,
  AggregatedMetrics,
  CategoryMetrics,
  ScorerMetrics,
  TestCaseResult,
  DeepEqualityResult,
  Difference,
} from './types';

// Exact Match Scorer
export { ExactMatchScorer, exactMatch } from './exact-match';

// Semantic Similarity Scorer
export {
  SemanticSimilarityScorer,
  semanticSimilarity,
} from './semantic-similarity';

// LLM Judge Scorer
export { LLMJudgeScorer, llmJudge, CommonRubrics } from './llm-judge';

// Precision/Recall/F1 Scorer
export {
  PrecisionRecallScorer,
  precisionScorer,
  recallScorer,
  f1Scorer,
} from './precision-recall';

// Recall@K Scorer
export {
  RecallAtKScorer,
  RecallAtKSuite,
  recallAtK,
  CommonRecallConfigs,
} from './recall-at-k';

// Metrics and Aggregation
export {
  calculateMetrics,
  formatMetricsReport,
  metricsToJSON,
  metricsToCSV,
} from './metrics';
