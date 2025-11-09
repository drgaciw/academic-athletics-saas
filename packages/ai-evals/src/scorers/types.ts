/**
 * AI Evaluation Framework - Scorer Types
 *
 * Defines interfaces and types for all scorer implementations
 */

/**
 * Base interface for all scorers
 */
export interface Scorer {
  /**
   * Name of the scorer (e.g., "ExactMatch", "SemanticSimilarity")
   */
  name: string;

  /**
   * Score a single output against expected value
   *
   * @param output - The actual output from the AI system
   * @param expected - The expected output
   * @param context - Optional context for scoring (input, metadata, etc.)
   * @returns Score result with value and optional metadata
   */
  score(
    output: unknown,
    expected: unknown,
    context?: ScoringContext
  ): Promise<ScorerResult> | ScorerResult;
}

/**
 * Context provided to scorers for evaluation
 */
export interface ScoringContext {
  /** The input that generated this output */
  input?: unknown;

  /** Test case metadata */
  metadata?: Record<string, unknown>;

  /** Category or tag for this test case */
  category?: string;

  /** Additional context-specific data */
  [key: string]: unknown;
}

/**
 * Result from a scorer evaluation
 */
export interface ScorerResult {
  /** Score value (0-1 for normalized scores, can be other ranges) */
  score: number;

  /** Whether this result passes the scorer's criteria */
  passed: boolean;

  /** Human-readable reason for the score */
  reason?: string;

  /** Detailed breakdown of scoring components */
  breakdown?: Record<string, number>;

  /** Additional metadata about the scoring */
  metadata?: Record<string, unknown>;
}

/**
 * Configuration for ExactMatchScorer
 */
export interface ExactMatchScorerConfig {
  /** Whether to ignore key ordering in objects */
  ignoreKeyOrder?: boolean;

  /** Whether to perform case-insensitive string comparison */
  caseInsensitive?: boolean;

  /** Whether to trim whitespace from strings */
  trimWhitespace?: boolean;

  /** Paths to ignore in comparison (e.g., ["metadata.timestamp"]) */
  ignorePaths?: string[];
}

/**
 * Configuration for SemanticSimilarityScorer
 */
export interface SemanticSimilarityScorerConfig {
  /** OpenAI API key for embeddings */
  apiKey: string;

  /** Embedding model to use */
  model?: string;

  /** Minimum similarity threshold for passing (0-1) */
  threshold?: number;

  /** Cache embeddings to reduce API calls */
  cacheEmbeddings?: boolean;
}

/**
 * Configuration for LLMJudgeScorer
 */
export interface LLMJudgeScorerConfig {
  /** OpenAI or Anthropic API key */
  apiKey: string;

  /** LLM provider */
  provider?: 'openai' | 'anthropic';

  /** Model to use for judging */
  model?: string;

  /** Evaluation rubric/criteria */
  rubric?: EvaluationRubric;

  /** Temperature for LLM sampling */
  temperature?: number;

  /** Whether to use structured output */
  useStructuredOutput?: boolean;
}

/**
 * Evaluation rubric for LLM judging
 */
export interface EvaluationRubric {
  /** Criteria to evaluate */
  criteria: RubricCriterion[];

  /** Overall scoring instructions */
  instructions?: string;

  /** Whether to provide reasoning */
  includeReasoning?: boolean;
}

/**
 * Single criterion in evaluation rubric
 */
export interface RubricCriterion {
  /** Name of the criterion */
  name: string;

  /** Description of what to evaluate */
  description: string;

  /** Weight of this criterion (default: 1.0) */
  weight?: number;

  /** Scale for this criterion (default: 1-5) */
  scale?: { min: number; max: number };
}

/**
 * Configuration for PrecisionRecallScorer
 */
export interface PrecisionRecallScorerConfig {
  /** Metric to calculate: precision, recall, or f1 */
  metric: 'precision' | 'recall' | 'f1';

  /** Threshold for binary classification */
  threshold?: number;

  /** Whether to compute per-class metrics */
  perClass?: boolean;

  /** Minimum F1 score to pass */
  minScore?: number;
}

/**
 * Configuration for RecallAtKScorer
 */
export interface RecallAtKScorerConfig {
  /** Number of top results to consider */
  k: number;

  /** Minimum recall@k to pass */
  minRecall?: number;

  /** Whether to normalize scores */
  normalize?: boolean;
}

/**
 * Aggregated metrics across multiple test cases
 */
export interface AggregatedMetrics {
  /** Total number of test cases */
  totalCases: number;

  /** Number of passed cases */
  passedCases: number;

  /** Number of failed cases */
  failedCases: number;

  /** Overall pass rate */
  passRate: number;

  /** Average score across all cases */
  averageScore: number;

  /** Median score */
  medianScore: number;

  /** Standard deviation of scores */
  stdDevScore: number;

  /** 95% confidence interval for average score */
  confidenceInterval?: [number, number];

  /** Metrics broken down by category */
  byCategory?: Record<string, CategoryMetrics>;

  /** Metrics broken down by scorer */
  byScorer?: Record<string, ScorerMetrics>;

  /** Additional custom metrics */
  customMetrics?: Record<string, number>;
}

/**
 * Metrics for a specific category
 */
export interface CategoryMetrics {
  /** Number of test cases in this category */
  count: number;

  /** Pass rate for this category */
  passRate: number;

  /** Average score for this category */
  averageScore: number;

  /** Median score for this category */
  medianScore: number;
}

/**
 * Metrics for a specific scorer
 */
export interface ScorerMetrics {
  /** Number of times this scorer was used */
  count: number;

  /** Pass rate for this scorer */
  passRate: number;

  /** Average score for this scorer */
  averageScore: number;

  /** Median score for this scorer */
  medianScore: number;
}

/**
 * Input for metric aggregation
 */
export interface TestCaseResult {
  /** Test case identifier */
  id: string;

  /** Category or tag */
  category?: string;

  /** Results from each scorer */
  scorerResults: {
    scorerName: string;
    result: ScorerResult;
  }[];

  /** Whether this test case passed overall */
  passed: boolean;

  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Deep equality comparison result
 */
export interface DeepEqualityResult {
  /** Whether values are equal */
  equal: boolean;

  /** Differences found (if not equal) */
  differences?: Difference[];

  /** Similarity score (0-1) */
  similarity?: number;
}

/**
 * A single difference in deep comparison
 */
export interface Difference {
  /** Path to the difference (e.g., "user.profile.age") */
  path: string;

  /** Expected value */
  expected: unknown;

  /** Actual value */
  actual: unknown;

  /** Type of difference */
  type: 'missing' | 'extra' | 'different' | 'type-mismatch';
}
