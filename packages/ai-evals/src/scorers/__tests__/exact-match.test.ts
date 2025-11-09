/**
 * Tests for ExactMatchScorer
 */

import { describe, it, expect } from '@jest/globals';
import { ExactMatchScorer } from '../exact-match';

describe('ExactMatchScorer', () => {
  describe('primitive values', () => {
    it('should match identical strings', () => {
      const scorer = new ExactMatchScorer();
      const result = scorer.score('hello', 'hello');

      expect(result.score).toBe(1.0);
      expect(result.passed).toBe(true);
    });

    it('should handle case-insensitive comparison', () => {
      const scorer = new ExactMatchScorer({ caseInsensitive: true });
      const result = scorer.score('HELLO', 'hello');

      expect(result.score).toBe(1.0);
      expect(result.passed).toBe(true);
    });

    it('should trim whitespace', () => {
      const scorer = new ExactMatchScorer({ trimWhitespace: true });
      const result = scorer.score('  hello  ', 'hello');

      expect(result.score).toBe(1.0);
      expect(result.passed).toBe(true);
    });

    it('should detect differences in strings', () => {
      const scorer = new ExactMatchScorer();
      const result = scorer.score('hello', 'world');

      expect(result.score).toBe(0.0);
      expect(result.passed).toBe(false);
      expect(result.metadata?.differences).toHaveLength(1);
    });

    it('should match numbers', () => {
      const scorer = new ExactMatchScorer();
      const result = scorer.score(42, 42);

      expect(result.score).toBe(1.0);
      expect(result.passed).toBe(true);
    });

    it('should match booleans', () => {
      const scorer = new ExactMatchScorer();
      const result = scorer.score(true, true);

      expect(result.score).toBe(1.0);
      expect(result.passed).toBe(true);
    });
  });

  describe('arrays', () => {
    it('should match identical arrays', () => {
      const scorer = new ExactMatchScorer();
      const result = scorer.score([1, 2, 3], [1, 2, 3]);

      expect(result.score).toBe(1.0);
      expect(result.passed).toBe(true);
    });

    it('should detect length differences', () => {
      const scorer = new ExactMatchScorer();
      const result = scorer.score([1, 2], [1, 2, 3]);

      expect(result.score).toBe(0.0);
      expect(result.passed).toBe(false);
      expect(result.metadata?.differences).toBeDefined();
    });

    it('should detect element differences', () => {
      const scorer = new ExactMatchScorer();
      const result = scorer.score([1, 2, 3], [1, 5, 3]);

      expect(result.score).toBe(0.0);
      expect(result.passed).toBe(false);
    });

    it('should handle nested arrays', () => {
      const scorer = new ExactMatchScorer();
      const result = scorer.score(
        [[1, 2], [3, 4]],
        [[1, 2], [3, 4]]
      );

      expect(result.score).toBe(1.0);
      expect(result.passed).toBe(true);
    });
  });

  describe('objects', () => {
    it('should match identical objects', () => {
      const scorer = new ExactMatchScorer();
      const result = scorer.score(
        { name: 'John', age: 30 },
        { name: 'John', age: 30 }
      );

      expect(result.score).toBe(1.0);
      expect(result.passed).toBe(true);
    });

    it('should ignore key order by default', () => {
      const scorer = new ExactMatchScorer({ ignoreKeyOrder: true });
      const result = scorer.score(
        { age: 30, name: 'John' },
        { name: 'John', age: 30 }
      );

      expect(result.score).toBe(1.0);
      expect(result.passed).toBe(true);
    });

    it('should detect missing keys', () => {
      const scorer = new ExactMatchScorer();
      const result = scorer.score(
        { name: 'John' },
        { name: 'John', age: 30 }
      );

      expect(result.score).toBe(0.0);
      expect(result.passed).toBe(false);
      expect(result.metadata?.differences).toBeDefined();
    });

    it('should detect extra keys', () => {
      const scorer = new ExactMatchScorer();
      const result = scorer.score(
        { name: 'John', age: 30, city: 'NYC' },
        { name: 'John', age: 30 }
      );

      expect(result.score).toBe(0.0);
      expect(result.passed).toBe(false);
    });

    it('should handle nested objects', () => {
      const scorer = new ExactMatchScorer();
      const result = scorer.score(
        { user: { name: 'John', profile: { age: 30 } } },
        { user: { name: 'John', profile: { age: 30 } } }
      );

      expect(result.score).toBe(1.0);
      expect(result.passed).toBe(true);
    });
  });

  describe('compliance status example', () => {
    it('should validate exact compliance status', () => {
      const scorer = new ExactMatchScorer();

      const actual = {
        status: 'ELIGIBLE',
        category: 'CONTINUING',
        violations: [],
      };

      const expected = {
        status: 'ELIGIBLE',
        category: 'CONTINUING',
        violations: [],
      };

      const result = scorer.score(actual, expected);

      expect(result.score).toBe(1.0);
      expect(result.passed).toBe(true);
    });

    it('should detect status mismatch', () => {
      const scorer = new ExactMatchScorer();

      const actual = {
        status: 'INELIGIBLE',
        category: 'CONTINUING',
        violations: ['GPA_LOW'],
      };

      const expected = {
        status: 'ELIGIBLE',
        category: 'CONTINUING',
        violations: [],
      };

      const result = scorer.score(actual, expected);

      expect(result.score).toBe(0.0);
      expect(result.passed).toBe(false);
      expect(result.reason).toContain('status');
    });
  });

  describe('path ignoring', () => {
    it('should ignore specified paths', () => {
      const scorer = new ExactMatchScorer({
        ignorePaths: ['root.metadata.timestamp'],
      });

      const actual = {
        data: 'test',
        metadata: { timestamp: 1234567890 },
      };

      const expected = {
        data: 'test',
        metadata: { timestamp: 9999999999 },
      };

      const result = scorer.score(actual, expected);

      expect(result.score).toBe(1.0);
      expect(result.passed).toBe(true);
    });

    it('should support wildcard path ignoring', () => {
      const scorer = new ExactMatchScorer({
        ignorePaths: ['root.*.timestamp'],
      });

      const actual = {
        user: { timestamp: 1 },
        data: { timestamp: 2 },
      };

      const expected = {
        user: { timestamp: 999 },
        data: { timestamp: 999 },
      };

      const result = scorer.score(actual, expected);

      expect(result.score).toBe(1.0);
      expect(result.passed).toBe(true);
    });
  });
});
