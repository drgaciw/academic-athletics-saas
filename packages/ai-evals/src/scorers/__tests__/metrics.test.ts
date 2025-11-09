/**
 * Tests for Metric Aggregation System
 */

import { describe, it, expect } from '@jest/globals';
import {
  calculateMetrics,
  formatMetricsReport,
  metricsToJSON,
  metricsToCSV,
} from '../metrics';
import type { TestCaseResult } from '../types';

describe('Metric Aggregation System', () => {
  describe('calculateMetrics', () => {
    it('should calculate basic statistics', () => {
      const results: TestCaseResult[] = [
        {
          id: 'test1',
          category: 'compliance',
          scorerResults: [
            {
              scorerName: 'ExactMatch',
              result: { score: 1.0, passed: true },
            },
          ],
          passed: true,
        },
        {
          id: 'test2',
          category: 'compliance',
          scorerResults: [
            {
              scorerName: 'ExactMatch',
              result: { score: 0.0, passed: false },
            },
          ],
          passed: false,
        },
        {
          id: 'test3',
          category: 'rag',
          scorerResults: [
            {
              scorerName: 'RecallAt5',
              result: { score: 0.8, passed: true },
            },
          ],
          passed: true,
        },
      ];

      const metrics = calculateMetrics(results);

      expect(metrics.totalCases).toBe(3);
      expect(metrics.passedCases).toBe(2);
      expect(metrics.failedCases).toBe(1);
      expect(metrics.passRate).toBeCloseTo(0.667, 2);
      expect(metrics.averageScore).toBeCloseTo(0.6, 1);
    });

    it('should calculate median and standard deviation', () => {
      const results: TestCaseResult[] = [
        {
          id: 'test1',
          scorerResults: [
            { scorerName: 'S1', result: { score: 0.5, passed: true } },
          ],
          passed: true,
        },
        {
          id: 'test2',
          scorerResults: [
            { scorerName: 'S1', result: { score: 0.7, passed: true } },
          ],
          passed: true,
        },
        {
          id: 'test3',
          scorerResults: [
            { scorerName: 'S1', result: { score: 0.9, passed: true } },
          ],
          passed: true,
        },
      ];

      const metrics = calculateMetrics(results);

      expect(metrics.medianScore).toBe(0.7);
      expect(metrics.stdDevScore).toBeGreaterThan(0);
    });

    it('should calculate confidence intervals', () => {
      const results: TestCaseResult[] = Array.from({ length: 10 }, (_, i) => ({
        id: `test${i}`,
        scorerResults: [
          { scorerName: 'S1', result: { score: 0.5 + i * 0.05, passed: true } },
        ],
        passed: true,
      }));

      const metrics = calculateMetrics(results);

      expect(metrics.confidenceInterval).toBeDefined();
      expect(metrics.confidenceInterval![0]).toBeLessThan(
        metrics.averageScore
      );
      expect(metrics.confidenceInterval![1]).toBeGreaterThan(
        metrics.averageScore
      );
    });
  });

  describe('category-specific metrics', () => {
    it('should calculate metrics by category', () => {
      const results: TestCaseResult[] = [
        {
          id: 'test1',
          category: 'compliance',
          scorerResults: [
            { scorerName: 'S1', result: { score: 1.0, passed: true } },
          ],
          passed: true,
        },
        {
          id: 'test2',
          category: 'compliance',
          scorerResults: [
            { scorerName: 'S1', result: { score: 0.5, passed: false } },
          ],
          passed: false,
        },
        {
          id: 'test3',
          category: 'rag',
          scorerResults: [
            { scorerName: 'S1', result: { score: 0.9, passed: true } },
          ],
          passed: true,
        },
      ];

      const metrics = calculateMetrics(results);

      expect(metrics.byCategory).toBeDefined();
      expect(metrics.byCategory!['compliance'].count).toBe(2);
      expect(metrics.byCategory!['compliance'].passRate).toBe(0.5);
      expect(metrics.byCategory!['compliance'].averageScore).toBe(0.75);
      expect(metrics.byCategory!['rag'].count).toBe(1);
      expect(metrics.byCategory!['rag'].passRate).toBe(1.0);
    });

    it('should handle uncategorized tests', () => {
      const results: TestCaseResult[] = [
        {
          id: 'test1',
          scorerResults: [
            { scorerName: 'S1', result: { score: 1.0, passed: true } },
          ],
          passed: true,
        },
      ];

      const metrics = calculateMetrics(results);

      expect(metrics.byCategory!['uncategorized']).toBeDefined();
      expect(metrics.byCategory!['uncategorized'].count).toBe(1);
    });
  });

  describe('scorer-specific metrics', () => {
    it('should calculate metrics by scorer', () => {
      const results: TestCaseResult[] = [
        {
          id: 'test1',
          scorerResults: [
            { scorerName: 'ExactMatch', result: { score: 1.0, passed: true } },
            { scorerName: 'LLMJudge', result: { score: 0.9, passed: true } },
          ],
          passed: true,
        },
        {
          id: 'test2',
          scorerResults: [
            { scorerName: 'ExactMatch', result: { score: 0.0, passed: false } },
          ],
          passed: false,
        },
      ];

      const metrics = calculateMetrics(results);

      expect(metrics.byScorer).toBeDefined();
      expect(metrics.byScorer!['ExactMatch'].count).toBe(2);
      expect(metrics.byScorer!['ExactMatch'].passRate).toBe(0.5);
      expect(metrics.byScorer!['ExactMatch'].averageScore).toBe(0.5);
      expect(metrics.byScorer!['LLMJudge'].count).toBe(1);
      expect(metrics.byScorer!['LLMJudge'].averageScore).toBe(0.9);
    });
  });

  describe('custom metrics', () => {
    it('should aggregate breakdown metrics', () => {
      const results: TestCaseResult[] = [
        {
          id: 'test1',
          scorerResults: [
            {
              scorerName: 'S1',
              result: {
                score: 1.0,
                passed: true,
                breakdown: { precision: 0.8, recall: 0.9 },
              },
            },
          ],
          passed: true,
        },
        {
          id: 'test2',
          scorerResults: [
            {
              scorerName: 'S1',
              result: {
                score: 0.5,
                passed: false,
                breakdown: { precision: 0.6, recall: 0.7 },
              },
            },
          ],
          passed: false,
        },
      ];

      const metrics = calculateMetrics(results);

      expect(metrics.customMetrics).toBeDefined();
      expect(metrics.customMetrics!['avg_precision']).toBeCloseTo(0.7, 1);
      expect(metrics.customMetrics!['avg_recall']).toBeCloseTo(0.8, 1);
    });

    it('should calculate percentiles', () => {
      const results: TestCaseResult[] = Array.from({ length: 100 }, (_, i) => ({
        id: `test${i}`,
        scorerResults: [
          { scorerName: 'S1', result: { score: i / 100, passed: true } },
        ],
        passed: true,
      }));

      const metrics = calculateMetrics(results);

      expect(metrics.customMetrics!.p25).toBeCloseTo(0.25, 1);
      expect(metrics.customMetrics!.p50).toBeCloseTo(0.50, 1);
      expect(metrics.customMetrics!.p75).toBeCloseTo(0.75, 1);
      expect(metrics.customMetrics!.p95).toBeCloseTo(0.95, 1);
    });
  });

  describe('formatMetricsReport', () => {
    it('should format metrics as human-readable report', () => {
      const results: TestCaseResult[] = [
        {
          id: 'test1',
          category: 'compliance',
          scorerResults: [
            { scorerName: 'ExactMatch', result: { score: 1.0, passed: true } },
          ],
          passed: true,
        },
        {
          id: 'test2',
          category: 'compliance',
          scorerResults: [
            { scorerName: 'ExactMatch', result: { score: 0.0, passed: false } },
          ],
          passed: false,
        },
      ];

      const metrics = calculateMetrics(results);
      const report = formatMetricsReport(metrics);

      expect(report).toContain('EVALUATION METRICS REPORT');
      expect(report).toContain('Total Test Cases: 2');
      expect(report).toContain('Passed: 1');
      expect(report).toContain('BY CATEGORY:');
      expect(report).toContain('compliance');
      expect(report).toContain('ExactMatch');
    });
  });

  describe('metricsToJSON', () => {
    it('should convert metrics to JSON string', () => {
      const results: TestCaseResult[] = [
        {
          id: 'test1',
          scorerResults: [
            { scorerName: 'S1', result: { score: 1.0, passed: true } },
          ],
          passed: true,
        },
      ];

      const metrics = calculateMetrics(results);
      const json = metricsToJSON(metrics);

      expect(() => JSON.parse(json)).not.toThrow();

      const parsed = JSON.parse(json);
      expect(parsed.totalCases).toBe(1);
      expect(parsed.passRate).toBe(1.0);
    });
  });

  describe('metricsToCSV', () => {
    it('should convert results to CSV format', () => {
      const results: TestCaseResult[] = [
        {
          id: 'test1',
          category: 'compliance',
          scorerResults: [
            {
              scorerName: 'ExactMatch',
              result: { score: 1.0, passed: true, reason: 'Perfect match' },
            },
          ],
          passed: true,
        },
        {
          id: 'test2',
          category: 'rag',
          scorerResults: [
            {
              scorerName: 'RecallAt5',
              result: { score: 0.8, passed: true, reason: 'Good recall' },
            },
          ],
          passed: true,
        },
      ];

      const csv = metricsToCSV(results);

      expect(csv).toContain('test_id,category,passed,scorer,score,reason');
      expect(csv).toContain('test1,compliance,true,ExactMatch,1,Perfect match');
      expect(csv).toContain('test2,rag,true,RecallAt5,0.8,Good recall');
    });

    it('should escape CSV special characters', () => {
      const results: TestCaseResult[] = [
        {
          id: 'test1',
          scorerResults: [
            {
              scorerName: 'S1',
              result: {
                score: 1.0,
                passed: true,
                reason: 'Contains, comma and "quotes"',
              },
            },
          ],
          passed: true,
        },
      ];

      const csv = metricsToCSV(results);

      expect(csv).toContain('"Contains, comma and ""quotes"""');
    });
  });

  describe('edge cases', () => {
    it('should handle empty results', () => {
      const metrics = calculateMetrics([]);

      expect(metrics.totalCases).toBe(0);
      expect(metrics.passedCases).toBe(0);
      expect(metrics.passRate).toBe(0);
      expect(metrics.averageScore).toBe(0);
    });

    it('should handle results with no scorers', () => {
      const results: TestCaseResult[] = [
        {
          id: 'test1',
          scorerResults: [],
          passed: false,
        },
      ];

      const metrics = calculateMetrics(results);

      expect(metrics.totalCases).toBe(1);
      expect(metrics.averageScore).toBe(0);
    });
  });
});
