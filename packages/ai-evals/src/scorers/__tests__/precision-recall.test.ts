/**
 * Tests for PrecisionRecallScorer
 */

import { describe, it, expect } from '@jest/globals';
import {
  PrecisionRecallScorer,
  precisionScorer,
  recallScorer,
  f1Scorer,
} from '../precision-recall';

describe('PrecisionRecallScorer', () => {
  describe('binary classification', () => {
    it('should calculate perfect precision', () => {
      const scorer = precisionScorer({ minScore: 0.9 });

      const predictions = [1, 1, 1, 0, 0];
      const labels = [1, 1, 1, 0, 0];

      const result = scorer.score(predictions, labels);

      expect(result.score).toBe(1.0);
      expect(result.passed).toBe(true);
      expect(result.breakdown?.precision).toBe(1.0);
    });

    it('should calculate precision with false positives', () => {
      const scorer = precisionScorer({ minScore: 0.5 });

      const predictions = [1, 1, 1, 1];
      const labels = [1, 1, 0, 0];

      const result = scorer.score(predictions, labels);

      expect(result.score).toBe(0.5);
      expect(result.breakdown?.precision).toBe(0.5);
      expect(result.breakdown?.truePositives).toBe(2);
      expect(result.breakdown?.falsePositives).toBe(2);
    });

    it('should calculate perfect recall', () => {
      const scorer = recallScorer({ minScore: 0.9 });

      const predictions = [1, 1, 1, 0, 0];
      const labels = [1, 1, 1, 0, 0];

      const result = scorer.score(predictions, labels);

      expect(result.score).toBe(1.0);
      expect(result.passed).toBe(true);
      expect(result.breakdown?.recall).toBe(1.0);
    });

    it('should calculate recall with false negatives', () => {
      const scorer = recallScorer({ minScore: 0.5 });

      const predictions = [1, 1, 0, 0];
      const labels = [1, 1, 1, 1];

      const result = scorer.score(predictions, labels);

      expect(result.score).toBe(0.5);
      expect(result.breakdown?.recall).toBe(0.5);
      expect(result.breakdown?.truePositives).toBe(2);
      expect(result.breakdown?.falseNegatives).toBe(2);
    });

    it('should calculate F1 score', () => {
      const scorer = f1Scorer({ minScore: 0.6 });

      const predictions = [1, 1, 1, 0];
      const labels = [1, 1, 0, 1];

      const result = scorer.score(predictions, labels);

      // Precision = 2/3, Recall = 2/3, F1 = 2/3
      expect(result.score).toBeCloseTo(0.667, 2);
      expect(result.breakdown?.precision).toBeCloseTo(0.667, 2);
      expect(result.breakdown?.recall).toBeCloseTo(0.667, 2);
      expect(result.breakdown?.f1).toBeCloseTo(0.667, 2);
    });
  });

  describe('risk prediction use case', () => {
    it('should evaluate student risk prediction', () => {
      const scorer = f1Scorer({ minScore: 0.7 });

      // Predicted risk levels (1 = high risk, 0 = low risk)
      const predictions = [1, 1, 0, 0, 1, 0, 1];
      // Actual outcomes
      const labels = [1, 1, 1, 0, 0, 0, 1];

      const result = scorer.score(predictions, labels);

      expect(result.breakdown?.truePositives).toBe(3);
      expect(result.breakdown?.falsePositives).toBe(1);
      expect(result.breakdown?.falseNegatives).toBe(1);
      expect(result.breakdown?.trueNegatives).toBe(2);
    });
  });

  describe('input formats', () => {
    it('should handle boolean arrays', () => {
      const scorer = f1Scorer();

      const predictions = [true, true, false, false];
      const labels = [true, true, true, false];

      const result = scorer.score(predictions, labels);

      expect(result.breakdown?.truePositives).toBe(2);
      expect(result.breakdown?.falseNegatives).toBe(1);
    });

    it('should handle probability threshold', () => {
      const scorer = new PrecisionRecallScorer({
        metric: 'f1',
        threshold: 0.7,
      });

      const predictions = [0.9, 0.8, 0.6, 0.3];
      const labels = [1, 1, 0, 0];

      const result = scorer.score(predictions, labels);

      // 0.9 and 0.8 >= 0.7 -> 1, 0.6 and 0.3 < 0.7 -> 0
      expect(result.breakdown?.truePositives).toBe(2);
      expect(result.breakdown?.trueNegatives).toBe(2);
    });

    it('should handle string inputs', () => {
      const scorer = f1Scorer();

      const predictions = ['true', 'true', 'false', 'false'];
      const labels = ['yes', 'yes', 'no', 'no'];

      const result = scorer.score(predictions, labels);

      expect(result.breakdown?.truePositives).toBe(2);
      expect(result.breakdown?.trueNegatives).toBe(2);
    });

    it('should handle object format', () => {
      const scorer = f1Scorer();

      const input = {
        predictions: [1, 1, 0, 0],
        labels: [1, 1, 1, 0],
      };

      const result = scorer.score(input, null);

      expect(result.breakdown?.truePositives).toBe(2);
    });
  });

  describe('pass/fail determination', () => {
    it('should pass when F1 meets threshold', () => {
      const scorer = f1Scorer({ minScore: 0.8 });

      const predictions = [1, 1, 1, 0, 0];
      const labels = [1, 1, 1, 0, 0];

      const result = scorer.score(predictions, labels);

      expect(result.score).toBe(1.0);
      expect(result.passed).toBe(true);
    });

    it('should fail when F1 below threshold', () => {
      const scorer = f1Scorer({ minScore: 0.9 });

      const predictions = [1, 1, 0, 0];
      const labels = [1, 0, 1, 0];

      const result = scorer.score(predictions, labels);

      expect(result.score).toBe(0.5);
      expect(result.passed).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle all zeros', () => {
      const scorer = precisionScorer();

      const predictions = [0, 0, 0, 0];
      const labels = [0, 0, 0, 0];

      const result = scorer.score(predictions, labels);

      expect(result.breakdown?.precision).toBe(0);
      expect(result.breakdown?.trueNegatives).toBe(4);
    });

    it('should handle empty arrays error', () => {
      const scorer = f1Scorer();

      const result = scorer.score([], []);

      expect(result.passed).toBe(false);
      expect(result.reason).toContain('empty');
    });

    it('should handle length mismatch error', () => {
      const scorer = f1Scorer();

      const result = scorer.score([1, 0], [1, 0, 1]);

      expect(result.passed).toBe(false);
      expect(result.reason).toContain('same length');
    });
  });
});
