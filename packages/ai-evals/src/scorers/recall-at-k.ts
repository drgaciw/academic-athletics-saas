/**
 * AI Evaluation Framework - Recall@K Scorer
 *
 * Task 4.4: Implements Recall@K for RAG retrieval quality evaluation
 * - Measures how often relevant documents appear in top-K results
 * - Configurable K value for different retrieval depths
 * - Normalization options for consistent scoring
 * - Use for RAG pipeline evaluation and search quality assessment
 */

import type {
  Scorer,
  ScorerResult,
  ScoringContext,
  RecallAtKScorerConfig,
} from './types';

/**
 * RecallAtKScorer - Evaluates retrieval quality using Recall@K metric
 *
 * Use cases:
 * - RAG retrieval quality evaluation
 * - Document ranking assessment
 * - Search result relevance
 * - Recommendation system evaluation
 */
export class RecallAtKScorer implements Scorer {
  public readonly name: string;
  private config: Required<RecallAtKScorerConfig>;

  constructor(config: RecallAtKScorerConfig) {
    this.config = {
      k: config.k,
      minRecall: config.minRecall ?? 0.8,
      normalize: config.normalize ?? true,
    };

    this.name = `RecallAt${this.config.k}`;
  }

  /**
   * Score retrieval results using Recall@K
   */
  score(
    output: unknown,
    expected: unknown,
    context?: ScoringContext
  ): ScorerResult {
    try {
      const { retrieved, relevant } = this.parseInputs(output, expected);

      if (relevant.length === 0) {
        throw new Error('No relevant documents provided for evaluation');
      }

      // Calculate Recall@K
      const topK = retrieved.slice(0, this.config.k);
      const relevantInTopK = topK.filter((doc) => relevant.includes(doc)).length;
      const recall = relevantInTopK / relevant.length;

      // Normalize to 0-1 if requested
      const score = this.config.normalize ? recall : recall * 100;
      const passed = recall >= this.config.minRecall;

      return {
        score,
        passed,
        reason: passed
          ? `Recall@${this.config.k} of ${(recall * 100).toFixed(1)}% meets threshold ${(this.config.minRecall * 100).toFixed(1)}%`
          : `Recall@${this.config.k} of ${(recall * 100).toFixed(1)}% below threshold ${(this.config.minRecall * 100).toFixed(1)}%`,
        breakdown: {
          recall,
          relevantInTopK,
          totalRelevant: relevant.length,
          k: this.config.k,
          retrievedCount: retrieved.length,
        },
        metadata: {
          retrievedDocuments: topK,
          relevantDocuments: relevant,
          missedDocuments: relevant.filter((doc) => !topK.includes(doc)),
        },
      };
    } catch (error) {
      return {
        score: 0.0,
        passed: false,
        reason: `Error computing Recall@K: ${error instanceof Error ? error.message : 'Unknown error'}`,
        breakdown: {},
        metadata: {
          error: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }

  /**
   * Parse inputs into retrieved and relevant document lists
   */
  private parseInputs(
    output: unknown,
    expected: unknown
  ): { retrieved: string[]; relevant: string[] } {
    // Case 1: Output is object with retrieved and relevant fields
    if (
      typeof output === 'object' &&
      output !== null &&
      'retrieved' in output &&
      'relevant' in output
    ) {
      const obj = output as { retrieved: unknown; relevant: unknown };
      return {
        retrieved: this.normalizeToStringArray(obj.retrieved),
        relevant: this.normalizeToStringArray(obj.relevant),
      };
    }

    // Case 2: Output is retrieved array, expected is relevant array
    if (Array.isArray(output) && Array.isArray(expected)) {
      return {
        retrieved: this.normalizeToStringArray(output),
        relevant: this.normalizeToStringArray(expected),
      };
    }

    // Case 3: Both are objects with document IDs
    if (
      typeof output === 'object' &&
      output !== null &&
      typeof expected === 'object' &&
      expected !== null
    ) {
      return {
        retrieved: this.extractDocumentIds(output),
        relevant: this.extractDocumentIds(expected),
      };
    }

    throw new Error('Invalid input format for RecallAtKScorer');
  }

  /**
   * Normalize input to string array
   */
  private normalizeToStringArray(input: unknown): string[] {
    if (!Array.isArray(input)) {
      throw new Error('Expected array input');
    }

    return input.map((item) => {
      if (typeof item === 'string') {
        return item;
      }

      if (typeof item === 'number') {
        return String(item);
      }

      if (typeof item === 'object' && item !== null) {
        // Try to extract ID from object
        if ('id' in item) {
          return String((item as { id: unknown }).id);
        }
        if ('docId' in item) {
          return String((item as { docId: unknown }).docId);
        }
        if ('documentId' in item) {
          return String((item as { documentId: unknown }).documentId);
        }
        // Fallback to JSON stringification
        return JSON.stringify(item);
      }

      return String(item);
    });
  }

  /**
   * Extract document IDs from object
   */
  private extractDocumentIds(obj: object): string[] {
    if ('documents' in obj && Array.isArray((obj as { documents: unknown }).documents)) {
      return this.normalizeToStringArray((obj as { documents: unknown }).documents);
    }

    if ('ids' in obj && Array.isArray((obj as { ids: unknown }).ids)) {
      return this.normalizeToStringArray((obj as { ids: unknown }).ids);
    }

    if ('results' in obj && Array.isArray((obj as { results: unknown }).results)) {
      return this.normalizeToStringArray((obj as { results: unknown }).results);
    }

    throw new Error('Could not extract document IDs from object');
  }
}

/**
 * RecallAtKSuite - Evaluate multiple K values at once
 */
export class RecallAtKSuite {
  private kValues: number[];
  private config: Omit<RecallAtKScorerConfig, 'k'>;

  constructor(kValues: number[], config?: Omit<RecallAtKScorerConfig, 'k'>) {
    this.kValues = kValues.sort((a, b) => a - b);
    this.config = config ?? {};
  }

  /**
   * Score using multiple K values
   */
  score(
    output: unknown,
    expected: unknown,
    context?: ScoringContext
  ): ScorerResult {
    const results: Record<string, number> = {};
    let totalScore = 0;
    let passedCount = 0;

    for (const k of this.kValues) {
      const scorer = new RecallAtKScorer({ ...this.config, k });
      const result = scorer.score(output, expected, context);

      results[`recall@${k}`] = result.score;
      totalScore += result.score;

      if (result.passed) {
        passedCount++;
      }
    }

    const avgScore = totalScore / this.kValues.length;
    const allPassed = passedCount === this.kValues.length;

    return {
      score: avgScore,
      passed: allPassed,
      reason: allPassed
        ? `All Recall@K metrics passed (${this.kValues.join(', ')})`
        : `${passedCount}/${this.kValues.length} Recall@K metrics passed`,
      breakdown: results,
      metadata: {
        kValues: this.kValues,
        passedCount,
        totalCount: this.kValues.length,
      },
    };
  }
}

/**
 * Convenience function to create RecallAtKScorer
 */
export function recallAtK(
  k: number,
  config?: Omit<RecallAtKScorerConfig, 'k'>
): RecallAtKScorer {
  return new RecallAtKScorer({ ...config, k });
}

/**
 * Common Recall@K configurations
 */
export const CommonRecallConfigs = {
  /**
   * RAG evaluation (check top 5 results)
   */
  rag: () => new RecallAtKScorer({ k: 5, minRecall: 0.8 }),

  /**
   * Search quality (check top 10 results)
   */
  search: () => new RecallAtKScorer({ k: 10, minRecall: 0.7 }),

  /**
   * Recommendation (check top 3 results)
   */
  recommendation: () => new RecallAtKScorer({ k: 3, minRecall: 0.9 }),

  /**
   * Multi-level evaluation (1, 3, 5, 10)
   */
  multiLevel: () => new RecallAtKSuite([1, 3, 5, 10], { minRecall: 0.7 }),
};
