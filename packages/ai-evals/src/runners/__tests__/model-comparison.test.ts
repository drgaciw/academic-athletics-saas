/**
 * Unit tests for model comparison functionality
 */

import {
  compareTestCaseResults,
  calculateComparisonSummary,
  formatComparisonReport,
} from '../model-comparison';
import { RunResult, Score, ComparisonResult } from '../../types';

describe('Model Comparison', () => {
  describe('compareTestCaseResults', () => {
    it('should create comparison result with multiple models', () => {
      const modelResults = new Map<string, RunResult>([
        [
          'gpt-4',
          {
            testCaseId: 'test-001',
            input: { value: 5 },
            expected: { result: 10 },
            actual: { result: 10 },
            metadata: {
              modelId: 'gpt-4',
              latency: 1000,
              tokenUsage: { prompt: 50, completion: 25, total: 75 },
              cost: 0.005,
              timestamp: new Date(),
            },
          },
        ],
        [
          'claude-sonnet-4',
          {
            testCaseId: 'test-001',
            input: { value: 5 },
            expected: { result: 10 },
            actual: { result: 10 },
            metadata: {
              modelId: 'claude-sonnet-4',
              latency: 800,
              tokenUsage: { prompt: 45, completion: 20, total: 65 },
              cost: 0.003,
              timestamp: new Date(),
            },
          },
        ],
      ]);

      const scores = new Map<string, Score>([
        ['gpt-4', { passed: true, score: 1.0 }],
        ['claude-sonnet-4', { passed: true, score: 0.95 }],
      ]);

      const result = compareTestCaseResults('test-001', modelResults, scores);

      expect(result.testCaseId).toBe('test-001');
      expect(result.winner).toBe('gpt-4');
      expect(result.models['gpt-4']).toBeDefined();
      expect(result.models['claude-sonnet-4']).toBeDefined();
      expect(result.metrics['gpt-4'].score).toBe(1.0);
      expect(result.metrics['claude-sonnet-4'].score).toBe(0.95);
    });

    it('should handle results without scores', () => {
      const modelResults = new Map<string, RunResult>([
        [
          'gpt-4',
          {
            testCaseId: 'test-001',
            input: { value: 5 },
            expected: { result: 10 },
            actual: { result: 10 },
            metadata: {
              modelId: 'gpt-4',
              latency: 1000,
              tokenUsage: { prompt: 50, completion: 25, total: 75 },
              cost: 0.005,
              timestamp: new Date(),
            },
          },
        ],
      ]);

      const result = compareTestCaseResults('test-001', modelResults);

      expect(result.winner).toBeUndefined();
      expect(result.models['gpt-4'].score).toBeUndefined();
      expect(result.metrics['gpt-4'].score).toBe(0);
    });

    it('should correctly identify the winner', () => {
      const modelResults = new Map<string, RunResult>([
        [
          'gpt-4',
          {
            testCaseId: 'test-001',
            input: {},
            expected: {},
            actual: {},
            metadata: {
              modelId: 'gpt-4',
              latency: 1000,
              tokenUsage: { prompt: 50, completion: 25, total: 75 },
              cost: 0.005,
              timestamp: new Date(),
            },
          },
        ],
        [
          'claude-sonnet-4',
          {
            testCaseId: 'test-001',
            input: {},
            expected: {},
            actual: {},
            metadata: {
              modelId: 'claude-sonnet-4',
              latency: 800,
              tokenUsage: { prompt: 45, completion: 20, total: 65 },
              cost: 0.003,
              timestamp: new Date(),
            },
          },
        ],
        [
          'gpt-3.5-turbo',
          {
            testCaseId: 'test-001',
            input: {},
            expected: {},
            actual: {},
            metadata: {
              modelId: 'gpt-3.5-turbo',
              latency: 600,
              tokenUsage: { prompt: 40, completion: 15, total: 55 },
              cost: 0.001,
              timestamp: new Date(),
            },
          },
        ],
      ]);

      const scores = new Map<string, Score>([
        ['gpt-4', { passed: true, score: 0.95 }],
        ['claude-sonnet-4', { passed: true, score: 0.98 }], // Winner
        ['gpt-3.5-turbo', { passed: true, score: 0.85 }],
      ]);

      const result = compareTestCaseResults('test-001', modelResults, scores);

      expect(result.winner).toBe('claude-sonnet-4');
    });
  });

  describe('calculateComparisonSummary', () => {
    it('should calculate accurate summary statistics', () => {
      const results: ComparisonResult[] = [
        {
          testCaseId: 'test-001',
          winner: 'gpt-4',
          models: {},
          metrics: {
            'gpt-4': { latency: 1000, cost: 0.005, score: 1.0 },
            'claude-sonnet-4': { latency: 800, cost: 0.003, score: 0.95 },
          },
        },
        {
          testCaseId: 'test-002',
          winner: 'claude-sonnet-4',
          models: {},
          metrics: {
            'gpt-4': { latency: 1200, cost: 0.006, score: 0.90 },
            'claude-sonnet-4': { latency: 900, cost: 0.004, score: 0.98 },
          },
        },
        {
          testCaseId: 'test-003',
          winner: 'gpt-4',
          models: {},
          metrics: {
            'gpt-4': { latency: 1100, cost: 0.005, score: 0.95 },
            'claude-sonnet-4': { latency: 850, cost: 0.003, score: 0.93 },
          },
        },
      ];

      const summary = calculateComparisonSummary(results, [
        'gpt-4',
        'claude-sonnet-4',
      ]);

      expect(summary['gpt-4']).toMatchObject({
        avgLatency: 1100, // (1000 + 1200 + 1100) / 3
        totalCost: 0.016, // 0.005 + 0.006 + 0.005
        avgScore: 0.95, // (1.0 + 0.90 + 0.95) / 3
        winRate: expect.closeTo(66.67, 0.1), // 2 wins out of 3
      });

      expect(summary['claude-sonnet-4']).toMatchObject({
        avgLatency: 850, // (800 + 900 + 850) / 3
        totalCost: 0.01, // 0.003 + 0.004 + 0.003
        avgScore: expect.closeTo(0.953, 0.01), // (0.95 + 0.98 + 0.93) / 3
        winRate: expect.closeTo(33.33, 0.1), // 1 win out of 3
      });
    });

    it('should handle missing data gracefully', () => {
      const results: ComparisonResult[] = [
        {
          testCaseId: 'test-001',
          winner: 'gpt-4',
          models: {},
          metrics: {
            'gpt-4': { latency: 1000, cost: 0.005, score: 1.0 },
            // claude-sonnet-4 missing
          },
        },
        {
          testCaseId: 'test-002',
          winner: 'claude-sonnet-4',
          models: {},
          metrics: {
            'gpt-4': { latency: 1200, cost: 0.006, score: 0.90 },
            'claude-sonnet-4': { latency: 900, cost: 0.004, score: 0.98 },
          },
        },
      ];

      const summary = calculateComparisonSummary(results, [
        'gpt-4',
        'claude-sonnet-4',
      ]);

      expect(summary['gpt-4'].avgLatency).toBe(1100); // Only 2 results
      expect(summary['claude-sonnet-4'].avgLatency).toBe(900); // Only 1 result
      expect(summary['claude-sonnet-4'].winRate).toBe(100); // 1 win out of 1
    });

    it('should handle no results', () => {
      const summary = calculateComparisonSummary([], ['gpt-4']);

      expect(summary['gpt-4']).toMatchObject({
        avgLatency: 0,
        totalCost: 0,
        avgScore: 0,
        winRate: 0,
      });
    });
  });

  describe('formatComparisonReport', () => {
    it('should format report as readable text', () => {
      const report = {
        datasetId: 'dataset-123',
        comparisonId: 'comparison-456',
        configs: [
          { modelId: 'gpt-4', temperature: 0.3 },
          { modelId: 'claude-sonnet-4', temperature: 0.3 },
        ],
        results: [
          {
            testCaseId: 'test-001',
            winner: 'gpt-4',
            models: {
              'gpt-4': {
                result: {
                  testCaseId: 'test-001',
                  input: {},
                  expected: {},
                  actual: {},
                  metadata: {
                    modelId: 'gpt-4',
                    latency: 1000,
                    tokenUsage: { prompt: 50, completion: 25, total: 75 },
                    cost: 0.005,
                    timestamp: new Date(),
                  },
                },
                score: { passed: true, score: 1.0, explanation: 'Perfect match' },
              },
              'claude-sonnet-4': {
                result: {
                  testCaseId: 'test-001',
                  input: {},
                  expected: {},
                  actual: {},
                  metadata: {
                    modelId: 'claude-sonnet-4',
                    latency: 800,
                    tokenUsage: { prompt: 45, completion: 20, total: 65 },
                    cost: 0.003,
                    timestamp: new Date(),
                  },
                },
                score: { passed: true, score: 0.95, explanation: 'Close match' },
              },
            },
            metrics: {
              'gpt-4': { latency: 1000, cost: 0.005, score: 1.0 },
              'claude-sonnet-4': { latency: 800, cost: 0.003, score: 0.95 },
            },
          },
        ],
        summary: {
          'gpt-4': {
            avgLatency: 1000,
            totalCost: 0.005,
            avgScore: 1.0,
            winRate: 100,
          },
          'claude-sonnet-4': {
            avgLatency: 800,
            totalCost: 0.003,
            avgScore: 0.95,
            winRate: 0,
          },
        },
        startTime: new Date('2025-01-08T12:00:00Z'),
        endTime: new Date('2025-01-08T12:05:00Z'),
        totalDuration: 300000,
      };

      const formatted = formatComparisonReport(report);

      expect(formatted).toContain('MODEL COMPARISON REPORT');
      expect(formatted).toContain('Summary by Model:');
      expect(formatted).toContain('gpt-4');
      expect(formatted).toContain('claude-sonnet-4');
      expect(formatted).toContain('1.000'); // gpt-4 score
      expect(formatted).toContain('0.950'); // claude-sonnet-4 score
      expect(formatted).toContain('100.0%'); // gpt-4 win rate
      expect(formatted).toContain('0.0%'); // claude-sonnet-4 win rate
      expect(formatted).toContain('Test Cases: 1');
      expect(formatted).toContain('Models Compared: 2');
      expect(formatted).toContain('Winner: gpt-4');
      expect(formatted).toContain('Perfect match');
      expect(formatted).toContain('Close match');
    });

    it('should sort models by average score', () => {
      const report = {
        datasetId: 'dataset-123',
        comparisonId: 'comparison-456',
        configs: [],
        results: [],
        summary: {
          'gpt-3.5-turbo': {
            avgLatency: 600,
            totalCost: 0.001,
            avgScore: 0.85,
            winRate: 0,
          },
          'gpt-4': {
            avgLatency: 1000,
            totalCost: 0.005,
            avgScore: 1.0,
            winRate: 50,
          },
          'claude-sonnet-4': {
            avgLatency: 800,
            totalCost: 0.003,
            avgScore: 0.95,
            winRate: 50,
          },
        },
        startTime: new Date(),
        endTime: new Date(),
        totalDuration: 0,
      };

      const formatted = formatComparisonReport(report);

      // Verify that gpt-4 (highest score) appears before claude-sonnet-4
      // which appears before gpt-3.5-turbo
      const gpt4Index = formatted.indexOf('gpt-4');
      const claudeIndex = formatted.indexOf('claude-sonnet-4');
      const gpt35Index = formatted.indexOf('gpt-3.5-turbo');

      expect(gpt4Index).toBeLessThan(claudeIndex);
      expect(claudeIndex).toBeLessThan(gpt35Index);
    });
  });
});
