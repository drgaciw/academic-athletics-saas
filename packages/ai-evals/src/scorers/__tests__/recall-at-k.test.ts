/**
 * Tests for RecallAtKScorer
 */

import { describe, it, expect } from '@jest/globals';
import {
  RecallAtKScorer,
  RecallAtKSuite,
  recallAtK,
  CommonRecallConfigs,
} from '../recall-at-k';

describe('RecallAtKScorer', () => {
  describe('basic recall@k calculation', () => {
    it('should calculate perfect recall@3', () => {
      const scorer = recallAtK(3, { minRecall: 0.8 });

      const retrieved = ['doc1', 'doc2', 'doc3', 'doc4', 'doc5'];
      const relevant = ['doc1', 'doc2', 'doc3'];

      const result = scorer.score(retrieved, relevant);

      expect(result.score).toBe(1.0);
      expect(result.passed).toBe(true);
      expect(result.breakdown?.relevantInTopK).toBe(3);
      expect(result.breakdown?.totalRelevant).toBe(3);
    });

    it('should calculate partial recall@5', () => {
      const scorer = recallAtK(5, { minRecall: 0.5 });

      const retrieved = ['doc1', 'doc2', 'doc3', 'doc4', 'doc5'];
      const relevant = ['doc1', 'doc3', 'doc6', 'doc7'];

      const result = scorer.score(retrieved, relevant);

      // 2 out of 4 relevant docs in top 5
      expect(result.score).toBe(0.5);
      expect(result.passed).toBe(true);
      expect(result.breakdown?.relevantInTopK).toBe(2);
      expect(result.breakdown?.totalRelevant).toBe(4);
    });

    it('should fail when recall below threshold', () => {
      const scorer = recallAtK(3, { minRecall: 0.8 });

      const retrieved = ['doc1', 'doc2', 'doc3', 'doc4'];
      const relevant = ['doc1', 'doc5', 'doc6', 'doc7'];

      const result = scorer.score(retrieved, relevant);

      // Only 1 out of 4 relevant docs in top 3
      expect(result.score).toBe(0.25);
      expect(result.passed).toBe(false);
    });
  });

  describe('RAG retrieval use case', () => {
    it('should evaluate RAG document retrieval', () => {
      const scorer = CommonRecallConfigs.rag();

      const retrieved = [
        'ncaa_eligibility_rule_1',
        'gpa_requirements',
        'course_requirements',
        'academic_progress',
        'unrelated_doc',
      ];

      const relevant = [
        'ncaa_eligibility_rule_1',
        'gpa_requirements',
        'course_requirements',
      ];

      const result = scorer.score(retrieved, relevant);

      expect(result.score).toBe(1.0);
      expect(result.passed).toBe(true);
    });

    it('should identify missed relevant documents', () => {
      const scorer = recallAtK(3);

      const retrieved = ['doc1', 'doc2', 'doc3', 'doc4'];
      const relevant = ['doc1', 'doc2', 'doc5'];

      const result = scorer.score(retrieved, relevant);

      expect(result.metadata?.missedDocuments).toEqual(['doc5']);
    });
  });

  describe('input formats', () => {
    it('should handle array inputs directly', () => {
      const scorer = recallAtK(5);

      const retrieved = [1, 2, 3, 4, 5];
      const relevant = [1, 3, 5];

      const result = scorer.score(retrieved, relevant);

      expect(result.score).toBe(1.0);
    });

    it('should handle object with retrieved and relevant fields', () => {
      const scorer = recallAtK(3);

      const input = {
        retrieved: ['a', 'b', 'c', 'd'],
        relevant: ['a', 'c', 'e'],
      };

      const result = scorer.score(input, null);

      expect(result.score).toBeCloseTo(0.667, 2);
    });

    it('should extract IDs from document objects', () => {
      const scorer = recallAtK(2);

      const retrieved = [{ id: 'doc1' }, { id: 'doc2' }, { id: 'doc3' }];
      const relevant = [{ id: 'doc1' }, { id: 'doc2' }];

      const result = scorer.score(retrieved, relevant);

      expect(result.score).toBe(1.0);
    });

    it('should handle docId field', () => {
      const scorer = recallAtK(2);

      const retrieved = [
        { docId: 'doc1' },
        { docId: 'doc2' },
        { docId: 'doc3' },
      ];
      const relevant = [{ docId: 'doc1' }, { docId: 'doc3' }];

      const result = scorer.score(retrieved, relevant);

      expect(result.score).toBe(0.5); // Only doc1 in top 2
    });
  });

  describe('k value behavior', () => {
    it('should only consider top K results', () => {
      const scorer = recallAtK(3);

      const retrieved = ['doc1', 'doc2', 'doc3', 'doc4', 'doc5'];
      const relevant = ['doc4', 'doc5'];

      const result = scorer.score(retrieved, relevant);

      // Neither relevant doc is in top 3
      expect(result.score).toBe(0.0);
      expect(result.breakdown?.relevantInTopK).toBe(0);
    });

    it('should handle k larger than retrieved count', () => {
      const scorer = recallAtK(10);

      const retrieved = ['doc1', 'doc2'];
      const relevant = ['doc1', 'doc2', 'doc3'];

      const result = scorer.score(retrieved, relevant);

      expect(result.score).toBeCloseTo(0.667, 2);
    });
  });

  describe('RecallAtKSuite', () => {
    it('should evaluate multiple k values', () => {
      const suite = new RecallAtKSuite([1, 3, 5]);

      const retrieved = ['doc1', 'doc2', 'doc3', 'doc4', 'doc5'];
      const relevant = ['doc1', 'doc3', 'doc5'];

      const result = suite.score(retrieved, relevant);

      expect(result.breakdown?.['recall@1']).toBeCloseTo(0.333, 2);
      expect(result.breakdown?.['recall@3']).toBeCloseTo(0.667, 2);
      expect(result.breakdown?.['recall@5']).toBe(1.0);
    });

    it('should pass only if all k values pass', () => {
      const suite = new RecallAtKSuite([1, 3], { minRecall: 0.9 });

      const retrieved = ['doc1', 'doc2', 'doc3'];
      const relevant = ['doc1', 'doc2'];

      const result = suite.score(retrieved, relevant);

      // recall@1 = 0.5, recall@3 = 1.0
      expect(result.passed).toBe(false); // Not all pass
    });
  });

  describe('normalization', () => {
    it('should normalize scores to 0-1 by default', () => {
      const scorer = recallAtK(5, { normalize: true });

      const retrieved = ['doc1', 'doc2', 'doc3'];
      const relevant = ['doc1', 'doc2'];

      const result = scorer.score(retrieved, relevant);

      expect(result.score).toBe(1.0);
      expect(result.score).toBeLessThanOrEqual(1.0);
    });

    it('should return percentage when normalize is false', () => {
      const scorer = recallAtK(5, { normalize: false });

      const retrieved = ['doc1', 'doc2', 'doc3'];
      const relevant = ['doc1', 'doc2'];

      const result = scorer.score(retrieved, relevant);

      expect(result.score).toBe(100.0);
    });
  });

  describe('edge cases', () => {
    it('should handle empty relevant documents error', () => {
      const scorer = recallAtK(5);

      const result = scorer.score(['doc1', 'doc2'], []);

      expect(result.passed).toBe(false);
      expect(result.reason).toContain('No relevant documents');
    });

    it('should handle no retrieved documents', () => {
      const scorer = recallAtK(5);

      const retrieved: string[] = [];
      const relevant = ['doc1', 'doc2'];

      const result = scorer.score(retrieved, relevant);

      expect(result.score).toBe(0.0);
      expect(result.breakdown?.relevantInTopK).toBe(0);
    });
  });

  describe('common configurations', () => {
    it('should use RAG config', () => {
      const scorer = CommonRecallConfigs.rag();
      expect(scorer.name).toBe('RecallAt5');
    });

    it('should use search config', () => {
      const scorer = CommonRecallConfigs.search();
      expect(scorer.name).toBe('RecallAt10');
    });

    it('should use recommendation config', () => {
      const scorer = CommonRecallConfigs.recommendation();
      expect(scorer.name).toBe('RecallAt3');
    });

    it('should use multi-level config', () => {
      const suite = CommonRecallConfigs.multiLevel();

      const retrieved = ['doc1', 'doc2', 'doc3', 'doc4', 'doc5'];
      const relevant = ['doc1', 'doc2'];

      const result = suite.score(retrieved, relevant);

      expect(result.breakdown?.['recall@1']).toBe(0.5);
      expect(result.breakdown?.['recall@10']).toBe(1.0);
    });
  });
});
