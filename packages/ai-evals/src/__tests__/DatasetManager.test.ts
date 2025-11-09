/**
 * Tests for DatasetManager
 *
 * Verifies dataset CRUD operations, versioning, and validation
 */

import { DatasetManager } from '../datasets/DatasetManager';
import { createTestCase } from '../datasets/utils';
import { getSchema } from '../datasets/schemas';
import type { Dataset, TestCase } from '../types';
import { join } from 'path';
import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';

describe('DatasetManager', () => {
  let manager: DatasetManager;
  let testDir: string;

  beforeEach(async () => {
    // Create temporary directory for test datasets
    testDir = await mkdtemp(join(tmpdir(), 'ai-evals-test-'));
    manager = new DatasetManager(testDir);
  });

  afterEach(async () => {
    // Clean up test directory
    await rm(testDir, { recursive: true, force: true });
  });

  describe('createDataset', () => {
    it('should create a new dataset with valid config', async () => {
      const dataset = await manager.createDataset({
        name: 'Test Dataset',
        description: 'A test dataset',
        schema: getSchema('compliance'),
      });

      expect(dataset.id).toBe('test-dataset');
      expect(dataset.name).toBe('Test Dataset');
      expect(dataset.description).toBe('A test dataset');
      expect(dataset.version).toBe('1.0.0');
      expect(dataset.testCases).toHaveLength(0);
    });

    it('should throw error if dataset already exists', async () => {
      await manager.createDataset({
        name: 'Test Dataset',
        description: 'A test dataset',
        schema: getSchema('compliance'),
      });

      await expect(
        manager.createDataset({
          name: 'Test Dataset',
          description: 'Another dataset',
          schema: getSchema('compliance'),
        })
      ).rejects.toThrow('Dataset already exists');
    });

    it('should allow custom version', async () => {
      const dataset = await manager.createDataset({
        name: 'Custom Version Dataset',
        description: 'Dataset with custom version',
        schema: getSchema('compliance'),
        version: '2.5.3',
      });

      expect(dataset.version).toBe('2.5.3');
    });
  });

  describe('loadDataset', () => {
    it('should load an existing dataset', async () => {
      const created = await manager.createDataset({
        name: 'Load Test',
        description: 'Test loading',
        schema: getSchema('compliance'),
      });

      const loaded = await manager.loadDataset(created.id);

      expect(loaded.id).toBe(created.id);
      expect(loaded.name).toBe(created.name);
      expect(loaded.version).toBe(created.version);
    });

    it('should throw error for non-existent dataset', async () => {
      await expect(manager.loadDataset('non-existent')).rejects.toThrow('Dataset not found');
    });

    it('should validate dataset when requested', async () => {
      const dataset = await manager.createDataset({
        name: 'Validation Test',
        description: 'Test validation',
        schema: getSchema('compliance'),
      });

      // Should not throw
      await manager.loadDataset(dataset.id, { validate: true });
    });
  });

  describe('addTestCase', () => {
    it('should add test case and increment version', async () => {
      const dataset = await manager.createDataset({
        name: 'Add Test Case',
        description: 'Test adding test cases',
        schema: getSchema('compliance'),
      });

      const testCase = createTestCase(
        {
          studentId: 'SA001',
          gpa: 3.5,
          creditHours: 30,
          progressTowardDegree: 0.25,
          semester: 'fall-2025',
        },
        {
          eligible: true,
          issues: [],
          recommendations: [],
        },
        {
          difficulty: 'easy',
          category: 'test',
        }
      );

      const updated = await manager.addTestCase(dataset.id, testCase);

      expect(updated.testCases).toHaveLength(1);
      expect(updated.version).toBe('1.0.1'); // Patch increment
      expect(updated.testCases[0].id).toBeDefined();
    });

    it('should generate ID if not provided', async () => {
      const dataset = await manager.createDataset({
        name: 'Auto ID',
        description: 'Test auto ID generation',
        schema: getSchema('compliance'),
      });

      const testCase = {
        input: {
          studentId: 'SA001',
          gpa: 3.5,
          creditHours: 30,
          progressTowardDegree: 0.25,
          semester: 'fall-2025',
        },
        expected: {
          eligible: true,
          issues: [],
          recommendations: [],
        },
        metadata: {
          difficulty: 'easy' as const,
          category: 'test',
          tags: [],
          createdAt: new Date(),
          source: 'synthetic' as const,
        },
      };

      const updated = await manager.addTestCase(dataset.id, testCase);

      expect(updated.testCases[0].id).toMatch(/^auto-001-/);
    });

    it('should reject duplicate test case IDs', async () => {
      const dataset = await manager.createDataset({
        name: 'Duplicate ID Test',
        description: 'Test duplicate ID rejection',
        schema: getSchema('compliance'),
      });

      const testCase = createTestCase(
        { studentId: 'SA001', gpa: 3.5, creditHours: 30, progressTowardDegree: 0.25, semester: 'fall-2025' },
        { eligible: true, issues: [], recommendations: [] },
        { difficulty: 'easy', category: 'test' }
      );

      await manager.addTestCase(dataset.id, testCase);

      await expect(manager.addTestCase(dataset.id, testCase)).rejects.toThrow(
        'Test case ID already exists'
      );
    });
  });

  describe('validateDataset', () => {
    it('should validate empty dataset with warning', async () => {
      const dataset = await manager.createDataset({
        name: 'Empty Dataset',
        description: 'Empty dataset for validation',
        schema: getSchema('compliance'),
      });

      const result = await manager.validateDataset(dataset);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0].message).toContain('no test cases');
    });

    it('should detect duplicate IDs', async () => {
      const dataset = await manager.createDataset({
        name: 'Duplicate Detection',
        description: 'Test duplicate ID detection',
        schema: getSchema('compliance'),
      });

      // Manually add duplicates (bypass normal validation)
      const testCase = createTestCase(
        { studentId: 'SA001', gpa: 3.5, creditHours: 30, progressTowardDegree: 0.25, semester: 'fall-2025' },
        { eligible: true, issues: [], recommendations: [] },
        { difficulty: 'easy', category: 'test' }
      );

      (dataset as any).testCases = [testCase, testCase];

      const result = await manager.validateDataset(dataset);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].type).toBe('duplicate');
    });

    it('should warn about missing metadata', async () => {
      const dataset = await manager.createDataset({
        name: 'Metadata Test',
        description: 'Test metadata validation',
        schema: getSchema('compliance'),
      });

      const testCase = createTestCase(
        { studentId: 'SA001', gpa: 3.5, creditHours: 30, progressTowardDegree: 0.25, semester: 'fall-2025' },
        { eligible: true, issues: [], recommendations: [] },
        { difficulty: 'easy', category: '' } // Empty category
      );

      await manager.addTestCase(dataset.id, testCase);

      const loaded = await manager.loadDataset(dataset.id, { validate: false });
      const result = await manager.validateDataset(loaded);

      expect(result.warnings.some(w => w.message.includes('missing category'))).toBe(true);
    });
  });

  describe('listDatasets', () => {
    it('should list all datasets', async () => {
      await manager.createDataset({
        name: 'Dataset 1',
        description: 'First dataset',
        schema: getSchema('compliance'),
      });

      await manager.createDataset({
        name: 'Dataset 2',
        description: 'Second dataset',
        schema: getSchema('conversational'),
      });

      const datasets = await manager.listDatasets();

      expect(datasets).toHaveLength(2);
      expect(datasets.map(d => d.name)).toContain('Dataset 1');
      expect(datasets.map(d => d.name)).toContain('Dataset 2');
    });

    it('should return empty array for no datasets', async () => {
      const datasets = await manager.listDatasets();
      expect(datasets).toHaveLength(0);
    });
  });

  describe('exportDataset', () => {
    it('should export dataset to JSON', async () => {
      const dataset = await manager.createDataset({
        name: 'Export Test',
        description: 'Test export functionality',
        schema: getSchema('compliance'),
      });

      const testCase = createTestCase(
        { studentId: 'SA001', gpa: 3.5, creditHours: 30, progressTowardDegree: 0.25, semester: 'fall-2025' },
        { eligible: true, issues: [], recommendations: [] },
        { difficulty: 'easy', category: 'test' }
      );

      await manager.addTestCase(dataset.id, testCase);

      const exportPath = await manager.exportDataset(dataset.id, {
        format: 'json',
        pretty: true,
      });

      expect(exportPath).toContain('export-test');
      expect(exportPath).toContain('.json');
    });

    it('should export dataset to CSV', async () => {
      const dataset = await manager.createDataset({
        name: 'CSV Export',
        description: 'Test CSV export',
        schema: getSchema('compliance'),
      });

      const exportPath = await manager.exportDataset(dataset.id, {
        format: 'csv',
      });

      expect(exportPath).toContain('csv-export');
      expect(exportPath).toContain('.csv');
    });
  });
});
