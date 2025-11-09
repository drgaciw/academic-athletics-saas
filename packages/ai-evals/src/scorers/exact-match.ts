/**
 * AI Evaluation Framework - Exact Match Scorer
 *
 * Task 4.1: Implements exact matching for structured outputs
 * - Deep equality checking with detailed diff reporting
 * - Configurable comparison options (case sensitivity, whitespace, key order)
 * - Ideal for compliance status, enums, and structured JSON validation
 */

import type {
  Scorer,
  ScorerResult,
  ScoringContext,
  ExactMatchScorerConfig,
  DeepEqualityResult,
  Difference,
} from './types';

/**
 * ExactMatchScorer - Validates exact equality of outputs
 *
 * Use cases:
 * - Compliance status validation (ELIGIBLE, INELIGIBLE, etc.)
 * - Enum classification tasks
 * - Structured JSON output validation
 * - Binary yes/no decisions
 */
export class ExactMatchScorer implements Scorer {
  public readonly name = 'ExactMatch';
  private config: Required<ExactMatchScorerConfig>;

  constructor(config: ExactMatchScorerConfig = {}) {
    this.config = {
      ignoreKeyOrder: config.ignoreKeyOrder ?? true,
      caseInsensitive: config.caseInsensitive ?? false,
      trimWhitespace: config.trimWhitespace ?? true,
      ignorePaths: config.ignorePaths ?? [],
    };
  }

  /**
   * Score output by checking exact match with expected value
   */
  score(
    output: unknown,
    expected: unknown,
    context?: ScoringContext
  ): ScorerResult {
    const comparison = this.deepEqual(output, expected);

    return {
      score: comparison.equal ? 1.0 : 0.0,
      passed: comparison.equal,
      reason: comparison.equal
        ? 'Output matches expected value exactly'
        : this.formatDifferences(comparison.differences || []),
      breakdown: {
        similarity: comparison.similarity ?? (comparison.equal ? 1.0 : 0.0),
        differenceCount: comparison.differences?.length ?? 0,
      },
      metadata: {
        differences: comparison.differences,
        config: this.config,
      },
    };
  }

  /**
   * Deep equality comparison with detailed diff reporting
   */
  private deepEqual(
    actual: unknown,
    expected: unknown,
    path: string = 'root'
  ): DeepEqualityResult {
    const differences: Difference[] = [];

    // Check if path should be ignored
    if (this.shouldIgnorePath(path)) {
      return { equal: true, differences: [] };
    }

    // Handle null/undefined
    if (actual === null || actual === undefined) {
      if (expected === null || expected === undefined) {
        return { equal: true, differences: [] };
      }
      differences.push({
        path,
        expected,
        actual,
        type: 'different',
      });
      return { equal: false, differences };
    }

    // Handle primitives
    if (typeof actual !== 'object' || typeof expected !== 'object') {
      const isEqual = this.comparePrimitives(actual, expected);
      if (!isEqual) {
        differences.push({
          path,
          expected,
          actual,
          type: 'different',
        });
      }
      return { equal: isEqual, differences };
    }

    // Handle arrays
    if (Array.isArray(actual) && Array.isArray(expected)) {
      return this.compareArrays(actual, expected, path);
    }

    // Type mismatch (array vs object)
    if (Array.isArray(actual) !== Array.isArray(expected)) {
      differences.push({
        path,
        expected,
        actual,
        type: 'type-mismatch',
      });
      return { equal: false, differences };
    }

    // Handle objects
    return this.compareObjects(
      actual as Record<string, unknown>,
      expected as Record<string, unknown>,
      path
    );
  }

  /**
   * Compare primitive values
   */
  private comparePrimitives(actual: unknown, expected: unknown): boolean {
    if (typeof actual === 'string' && typeof expected === 'string') {
      let actualStr = actual;
      let expectedStr = expected;

      if (this.config.trimWhitespace) {
        actualStr = actualStr.trim();
        expectedStr = expectedStr.trim();
      }

      if (this.config.caseInsensitive) {
        actualStr = actualStr.toLowerCase();
        expectedStr = expectedStr.toLowerCase();
      }

      return actualStr === expectedStr;
    }

    return actual === expected;
  }

  /**
   * Compare arrays with detailed diff tracking
   */
  private compareArrays(
    actual: unknown[],
    expected: unknown[],
    path: string
  ): DeepEqualityResult {
    const differences: Difference[] = [];

    if (actual.length !== expected.length) {
      differences.push({
        path: `${path}.length`,
        expected: expected.length,
        actual: actual.length,
        type: 'different',
      });
    }

    const maxLength = Math.max(actual.length, expected.length);
    for (let i = 0; i < maxLength; i++) {
      const itemPath = `${path}[${i}]`;

      if (i >= actual.length) {
        differences.push({
          path: itemPath,
          expected: expected[i],
          actual: undefined,
          type: 'missing',
        });
        continue;
      }

      if (i >= expected.length) {
        differences.push({
          path: itemPath,
          expected: undefined,
          actual: actual[i],
          type: 'extra',
        });
        continue;
      }

      const itemComparison = this.deepEqual(actual[i], expected[i], itemPath);
      if (!itemComparison.equal) {
        differences.push(...(itemComparison.differences || []));
      }
    }

    const similarity = 1 - differences.length / Math.max(actual.length, 1);

    return {
      equal: differences.length === 0,
      differences,
      similarity,
    };
  }

  /**
   * Compare objects with optional key order handling
   */
  private compareObjects(
    actual: Record<string, unknown>,
    expected: Record<string, unknown>,
    path: string
  ): DeepEqualityResult {
    const differences: Difference[] = [];

    const actualKeys = Object.keys(actual);
    const expectedKeys = Object.keys(expected);

    // Sort keys if ignoring order
    const getKeys = (obj: Record<string, unknown>) =>
      this.config.ignoreKeyOrder
        ? Object.keys(obj).sort()
        : Object.keys(obj);

    const sortedActualKeys = getKeys(actual);
    const sortedExpectedKeys = getKeys(expected);

    // Check for missing keys
    for (const key of sortedExpectedKeys) {
      const keyPath = `${path}.${key}`;

      if (!(key in actual)) {
        differences.push({
          path: keyPath,
          expected: expected[key],
          actual: undefined,
          type: 'missing',
        });
      }
    }

    // Check for extra keys
    for (const key of sortedActualKeys) {
      const keyPath = `${path}.${key}`;

      if (!(key in expected)) {
        differences.push({
          path: keyPath,
          expected: undefined,
          actual: actual[key],
          type: 'extra',
        });
      }
    }

    // Compare common keys
    const commonKeys = sortedActualKeys.filter((key) =>
      sortedExpectedKeys.includes(key)
    );

    for (const key of commonKeys) {
      const keyPath = `${path}.${key}`;
      const comparison = this.deepEqual(actual[key], expected[key], keyPath);

      if (!comparison.equal) {
        differences.push(...(comparison.differences || []));
      }
    }

    const totalKeys = new Set([...sortedActualKeys, ...sortedExpectedKeys])
      .size;
    const similarity = 1 - differences.length / Math.max(totalKeys, 1);

    return {
      equal: differences.length === 0,
      differences,
      similarity,
    };
  }

  /**
   * Check if a path should be ignored in comparison
   */
  private shouldIgnorePath(path: string): boolean {
    return this.config.ignorePaths.some((ignorePath) => {
      // Support wildcards
      const pattern = ignorePath.replace(/\*/g, '.*');
      const regex = new RegExp(`^${pattern}$`);
      return regex.test(path);
    });
  }

  /**
   * Format differences into human-readable message
   */
  private formatDifferences(differences: Difference[]): string {
    if (differences.length === 0) {
      return 'No differences found';
    }

    const grouped = this.groupDifferencesByType(differences);
    const parts: string[] = [];

    if (grouped.missing.length > 0) {
      parts.push(
        `Missing keys: ${grouped.missing.map((d) => d.path).join(', ')}`
      );
    }

    if (grouped.extra.length > 0) {
      parts.push(`Extra keys: ${grouped.extra.map((d) => d.path).join(', ')}`);
    }

    if (grouped.different.length > 0) {
      const diffDetails = grouped.different
        .slice(0, 3) // Show first 3 differences
        .map(
          (d) =>
            `${d.path}: expected ${JSON.stringify(d.expected)}, got ${JSON.stringify(d.actual)}`
        )
        .join('; ');

      parts.push(
        `Different values: ${diffDetails}${grouped.different.length > 3 ? ` (and ${grouped.different.length - 3} more)` : ''}`
      );
    }

    if (grouped.typeMismatch.length > 0) {
      parts.push(
        `Type mismatches: ${grouped.typeMismatch.map((d) => d.path).join(', ')}`
      );
    }

    return parts.join('; ');
  }

  /**
   * Group differences by type for reporting
   */
  private groupDifferencesByType(differences: Difference[]) {
    return {
      missing: differences.filter((d) => d.type === 'missing'),
      extra: differences.filter((d) => d.type === 'extra'),
      different: differences.filter((d) => d.type === 'different'),
      typeMismatch: differences.filter((d) => d.type === 'type-mismatch'),
    };
  }
}

/**
 * Convenience function to create and use ExactMatchScorer
 */
export function exactMatch(
  output: unknown,
  expected: unknown,
  config?: ExactMatchScorerConfig
): ScorerResult {
  const scorer = new ExactMatchScorer(config);
  return scorer.score(output, expected);
}
