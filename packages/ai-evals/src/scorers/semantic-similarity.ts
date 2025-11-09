/**
 * AI Evaluation Framework - Semantic Similarity Scorer
 *
 * Task 4.2: Implements embedding-based semantic similarity comparison
 * - Uses OpenAI embeddings API for vector generation
 * - Calculates cosine similarity between expected and actual outputs
 * - Configurable similarity threshold for pass/fail
 * - Optional embedding caching to reduce API costs
 */

import type {
  Scorer,
  ScorerResult,
  ScoringContext,
  SemanticSimilarityScorerConfig,
} from './types';

/**
 * Embedding cache entry
 */
interface EmbeddingCacheEntry {
  text: string;
  embedding: number[];
  timestamp: number;
}

/**
 * SemanticSimilarityScorer - Evaluates semantic similarity using embeddings
 *
 * Use cases:
 * - Evaluating paraphrased or rephrased responses
 * - Comparing answers where exact match is too strict
 * - Assessing conceptual similarity in free-form text
 * - RAG response quality evaluation
 */
export class SemanticSimilarityScorer implements Scorer {
  public readonly name = 'SemanticSimilarity';
  private config: Required<SemanticSimilarityScorerConfig>;
  private embeddingCache: Map<string, EmbeddingCacheEntry>;
  private cacheMaxAge: number = 24 * 60 * 60 * 1000; // 24 hours

  constructor(config: SemanticSimilarityScorerConfig) {
    if (!config.apiKey) {
      throw new Error('OpenAI API key is required for SemanticSimilarityScorer');
    }

    this.config = {
      apiKey: config.apiKey,
      model: config.model ?? 'text-embedding-3-large',
      threshold: config.threshold ?? 0.8,
      cacheEmbeddings: config.cacheEmbeddings ?? true,
    };

    this.embeddingCache = new Map();
  }

  /**
   * Score output by calculating semantic similarity with expected value
   */
  async score(
    output: unknown,
    expected: unknown,
    context?: ScoringContext
  ): Promise<ScorerResult> {
    // Convert inputs to strings
    const outputText = this.normalizeToString(output);
    const expectedText = this.normalizeToString(expected);

    // Handle empty strings
    if (!outputText || !expectedText) {
      return {
        score: 0.0,
        passed: false,
        reason: 'Cannot compute similarity for empty text',
        breakdown: {
          similarity: 0.0,
        },
      };
    }

    // Handle exact matches (optimization)
    if (outputText === expectedText) {
      return {
        score: 1.0,
        passed: true,
        reason: 'Texts are identical',
        breakdown: {
          similarity: 1.0,
        },
      };
    }

    try {
      // Get embeddings
      const [outputEmbedding, expectedEmbedding] = await Promise.all([
        this.getEmbedding(outputText),
        this.getEmbedding(expectedText),
      ]);

      // Calculate cosine similarity
      const similarity = this.cosineSimilarity(outputEmbedding, expectedEmbedding);

      const passed = similarity >= this.config.threshold;

      return {
        score: similarity,
        passed,
        reason: passed
          ? `Semantic similarity ${(similarity * 100).toFixed(1)}% meets threshold ${(this.config.threshold * 100).toFixed(1)}%`
          : `Semantic similarity ${(similarity * 100).toFixed(1)}% below threshold ${(this.config.threshold * 100).toFixed(1)}%`,
        breakdown: {
          similarity,
          threshold: this.config.threshold,
        },
        metadata: {
          model: this.config.model,
          outputLength: outputText.length,
          expectedLength: expectedText.length,
        },
      };
    } catch (error) {
      return {
        score: 0.0,
        passed: false,
        reason: `Error computing semantic similarity: ${error instanceof Error ? error.message : 'Unknown error'}`,
        breakdown: {
          similarity: 0.0,
        },
        metadata: {
          error: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }

  /**
   * Get embedding for text (with caching)
   */
  private async getEmbedding(text: string): Promise<number[]> {
    // Check cache first
    if (this.config.cacheEmbeddings) {
      const cached = this.getCachedEmbedding(text);
      if (cached) {
        return cached;
      }
    }

    // Call OpenAI API
    const embedding = await this.fetchEmbedding(text);

    // Cache the result
    if (this.config.cacheEmbeddings) {
      this.cacheEmbedding(text, embedding);
    }

    return embedding;
  }

  /**
   * Fetch embedding from OpenAI API
   */
  private async fetchEmbedding(text: string): Promise<number[]> {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        input: text,
        model: this.config.model,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} ${error}`);
    }

    const data = await response.json();
    return data.data[0].embedding;
  }

  /**
   * Get cached embedding if available and not expired
   */
  private getCachedEmbedding(text: string): number[] | null {
    const cached = this.embeddingCache.get(text);
    if (!cached) {
      return null;
    }

    // Check if cache entry is expired
    if (Date.now() - cached.timestamp > this.cacheMaxAge) {
      this.embeddingCache.delete(text);
      return null;
    }

    return cached.embedding;
  }

  /**
   * Cache an embedding
   */
  private cacheEmbedding(text: string, embedding: number[]): void {
    this.embeddingCache.set(text, {
      text,
      embedding,
      timestamp: Date.now(),
    });

    // Limit cache size (keep last 1000 entries)
    if (this.embeddingCache.size > 1000) {
      const firstKey = this.embeddingCache.keys().next().value;
      this.embeddingCache.delete(firstKey);
    }
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same length');
    }

    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      magnitudeA += a[i] * a[i];
      magnitudeB += b[i] * b[i];
    }

    magnitudeA = Math.sqrt(magnitudeA);
    magnitudeB = Math.sqrt(magnitudeB);

    if (magnitudeA === 0 || magnitudeB === 0) {
      return 0;
    }

    return dotProduct / (magnitudeA * magnitudeB);
  }

  /**
   * Normalize input to string for embedding
   */
  private normalizeToString(input: unknown): string {
    if (typeof input === 'string') {
      return input.trim();
    }

    if (typeof input === 'number' || typeof input === 'boolean') {
      return String(input);
    }

    if (input === null || input === undefined) {
      return '';
    }

    if (typeof input === 'object') {
      return JSON.stringify(input, null, 2);
    }

    return String(input);
  }

  /**
   * Clear the embedding cache
   */
  clearCache(): void {
    this.embeddingCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.embeddingCache.size,
      maxAge: this.cacheMaxAge,
      enabled: this.config.cacheEmbeddings,
    };
  }
}

/**
 * Convenience function to create and use SemanticSimilarityScorer
 */
export async function semanticSimilarity(
  output: unknown,
  expected: unknown,
  config: SemanticSimilarityScorerConfig
): Promise<ScorerResult> {
  const scorer = new SemanticSimilarityScorer(config);
  return await scorer.score(output, expected);
}
