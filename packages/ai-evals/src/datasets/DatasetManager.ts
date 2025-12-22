/**
 * Dataset Manager
 *
 * Manages test case collections with versioning, metadata tracking, and file-based storage.
 * Provides CRUD operations for datasets and test cases with automatic validation.
 *
 * Features:
 * - File-based JSON storage for datasets
 * - Automatic versioning using semantic versioning
 * - Zod schema validation for type safety
 * - Metadata tracking (source, difficulty, tags)
 * - Load/save/export operations
 */

import { readFile, writeFile, mkdir, readdir, stat } from 'fs/promises';
import { join, dirname } from 'path';
import { existsSync } from 'fs';
import { nanoid } from 'nanoid';
import { format as formatDate, parseISO } from 'date-fns';
import { z } from 'zod';
import type {
  Dataset,
  DatasetConfig,
  TestCase,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  ExportOptions,
  LoadOptions,
} from '../types';

/**
 * Default base directory for dataset storage
 * Relative to the package root
 */
const DEFAULT_DATASETS_DIR = join(__dirname, '../../datasets');

/**
 * DatasetManager class
 *
 * Manages dataset storage, loading, and validation with file-based persistence.
 */
export class DatasetManager {
  private datasetsDir: string;

  /**
   * Create a new DatasetManager
   *
   * @param datasetsDir - Base directory for storing datasets (defaults to packages/ai-evals/datasets/)
   */
  constructor(datasetsDir: string = DEFAULT_DATASETS_DIR) {
    this.datasetsDir = datasetsDir;
  }

  /**
   * Load a dataset by ID
   *
   * @param id - Unique dataset identifier
   * @param options - Loading options
   * @returns The loaded dataset
   * @throws Error if dataset doesn't exist or validation fails
   *
   * @example
   * ```typescript
   * const manager = new DatasetManager();
   * const dataset = await manager.loadDataset('compliance-eligibility-checks');
   * ```
   */
  async loadDataset<TInput = any, TOutput = any>(
    id: string,
    options: LoadOptions = {}
  ): Promise<Dataset<TInput, TOutput>> {
    const { validate = true, version } = options;

    // Find dataset file
    const filePath = await this.findDatasetFile(id, version);
    if (!filePath) {
      throw new Error(`Dataset not found: ${id}${version ? ` (version ${version})` : ''}`);
    }

    // Read and parse dataset file
    const fileContent = await readFile(filePath, 'utf-8');
    const data = JSON.parse(fileContent);

    // Reconstruct dataset object
    const dataset: Dataset<TInput, TOutput> = {
      id: data.id,
      name: data.name,
      description: data.description,
      version: data.version,
      createdAt: parseISO(data.createdAt),
      updatedAt: parseISO(data.updatedAt),
      metadata: data.metadata,
      schema: {
        // Reconstruct Zod schemas from stored schema definitions
        input: this.reconstructZodSchema(data.schemas.input),
        output: this.reconstructZodSchema(data.schemas.output),
      },
      testCases: data.testCases.map((tc: any) => ({
        ...tc,
        metadata: {
          ...tc.metadata,
          createdAt: parseISO(tc.metadata.createdAt),
        },
      })),
    };

    // Validate if requested
    if (validate) {
      const validationResult = await this.validateDataset(dataset);
      if (!validationResult.valid) {
        throw new Error(
          `Dataset validation failed: ${validationResult.errors.map((e) => e.message).join(', ')}`
        );
      }
    }

    return dataset;
  }

  /**
   * Create a new dataset
   *
   * @param config - Dataset configuration
   * @returns The created dataset
   * @throws Error if dataset ID already exists
   *
   * @example
   * ```typescript
   * const dataset = await manager.createDataset({
   *   name: 'Compliance Eligibility Checks',
   *   description: 'Test cases for NCAA eligibility validation',
   *   schema: {
   *     input: z.object({ studentId: z.string(), gpa: z.number() }),
   *     output: z.object({ eligible: z.boolean() })
   *   }
   * });
   * ```
   */
  async createDataset<TInput = any, TOutput = any>(
    config: DatasetConfig<TInput, TOutput>
  ): Promise<Dataset<TInput, TOutput>> {
    const { name, description, schema, version = '1.0.0', metadata = {} } = config;

    // Generate unique ID from name
    const id = this.generateDatasetId(name);

    // Check if dataset already exists
    const existingFile = await this.findDatasetFile(id);
    if (existingFile) {
      throw new Error(`Dataset already exists: ${id}`);
    }

    // Create dataset object
    const now = new Date();
    const dataset: Dataset<TInput, TOutput> = {
      id,
      name,
      description,
      version,
      testCases: [],
      schema,
      createdAt: now,
      updatedAt: now,
      metadata,
    };

    // Save to file
    await this.saveDataset(dataset);

    return dataset;
  }

  /**
   * Add a test case to a dataset
   *
   * Automatically increments the patch version of the dataset.
   *
   * @param datasetId - ID of the dataset
   * @param testCase - Test case to add (without ID if not provided)
   * @returns Updated dataset
   *
   * @example
   * ```typescript
   * await manager.addTestCase('compliance-eligibility', {
   *   input: { studentId: 'SA001', gpa: 3.5 },
   *   expected: { eligible: true },
   *   metadata: {
   *     difficulty: 'easy',
   *     category: 'gpa-check',
   *     tags: ['ncaa', 'eligibility'],
   *     createdAt: new Date(),
   *     source: 'synthetic'
   *   }
   * });
   * ```
   */
  async addTestCase<TInput = any, TOutput = any>(
    datasetId: string,
    testCase: Omit<TestCase<TInput, TOutput>, 'id'> & { id?: string }
  ): Promise<Dataset<TInput, TOutput>> {
    // Load existing dataset
    const dataset = await this.loadDataset<TInput, TOutput>(datasetId);

    // Generate ID if not provided
    const id = testCase.id || this.generateTestCaseId(dataset);

    // Check for duplicate ID
    if (dataset.testCases.some((tc) => tc.id === id)) {
      throw new Error(`Test case ID already exists: ${id}`);
    }

    // Add test case
    const newTestCase: TestCase<TInput, TOutput> = {
      id,
      input: testCase.input,
      expected: testCase.expected,
      metadata: testCase.metadata,
    };

    dataset.testCases.push(newTestCase);

    // Increment patch version
    dataset.version = this.incrementVersion(dataset.version, 'patch');
    dataset.updatedAt = new Date();

    // Validate test case against schema
    try {
      dataset.schema.input.parse(newTestCase.input);
      dataset.schema.output.parse(newTestCase.expected);
    } catch (error) {
      throw new Error(`Test case validation failed: ${error}`);
    }

    // Save updated dataset
    await this.saveDataset(dataset);

    return dataset;
  }

  /**
   * Validate a dataset
   *
   * Checks:
   * - All test cases conform to the schema
   * - No duplicate test case IDs
   * - Metadata is complete
   * - Dataset has reasonable coverage
   *
   * @param dataset - Dataset to validate
   * @returns Validation result with errors and warnings
   */
  async validateDataset<TInput = any, TOutput = any>(
    dataset: Dataset<TInput, TOutput>
  ): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Check for empty dataset
    if (dataset.testCases.length === 0) {
      warnings.push({
        type: 'coverage',
        message: 'Dataset has no test cases',
        suggestion: 'Add test cases to the dataset',
      });
    }

    // Check for duplicate IDs
    const ids = new Set<string>();
    for (const testCase of dataset.testCases) {
      if (ids.has(testCase.id)) {
        errors.push({
          type: 'duplicate',
          message: `Duplicate test case ID: ${testCase.id}`,
          testCaseId: testCase.id,
        });
      }
      ids.add(testCase.id);
    }

    // Validate each test case against schema
    for (const testCase of dataset.testCases) {
      // Validate input
      try {
        dataset.schema.input.parse(testCase.input);
      } catch (error) {
        errors.push({
          type: 'schema',
          message: `Input validation failed for test case ${testCase.id}`,
          path: 'input',
          testCaseId: testCase.id,
        });
      }

      // Validate output
      try {
        dataset.schema.output.parse(testCase.expected);
      } catch (error) {
        errors.push({
          type: 'schema',
          message: `Output validation failed for test case ${testCase.id}`,
          path: 'expected',
          testCaseId: testCase.id,
        });
      }

      // Check metadata completeness
      if (!testCase.metadata.category) {
        warnings.push({
          type: 'quality',
          message: `Test case ${testCase.id} missing category`,
          suggestion: 'Add a category for better organization',
        });
      }

      if (testCase.metadata.tags.length === 0) {
        warnings.push({
          type: 'quality',
          message: `Test case ${testCase.id} has no tags`,
          suggestion: 'Add tags for better discoverability',
        });
      }
    }

    // Check difficulty balance
    const difficultyCounts = dataset.testCases.reduce(
      (acc, tc) => {
        acc[tc.metadata.difficulty]++;
        return acc;
      },
      { easy: 0, medium: 0, hard: 0 }
    );

    const totalTests = dataset.testCases.length;
    if (totalTests > 10) {
      // Only check balance if we have enough test cases
      if (difficultyCounts.easy < totalTests * 0.2) {
        warnings.push({
          type: 'balance',
          message: 'Dataset has too few easy test cases',
          suggestion: 'Add more easy test cases for baseline validation',
        });
      }
      if (difficultyCounts.hard < totalTests * 0.1) {
        warnings.push({
          type: 'balance',
          message: 'Dataset has too few hard test cases',
          suggestion: 'Add challenging edge cases',
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Export dataset to a file
   *
   * @param datasetId - ID of the dataset to export
   * @param options - Export options
   * @returns Path to the exported file
   *
   * @example
   * ```typescript
   * const exportPath = await manager.exportDataset('compliance-eligibility', {
   *   format: 'json',
   *   pretty: true
   * });
   * ```
   */
  async exportDataset(datasetId: string, options: ExportOptions): Promise<string> {
    const { format, includeMetadata = true, pretty = false } = options;

    const dataset = await this.loadDataset(datasetId);

    // Prepare export data
    const exportData = {
      ...(includeMetadata && {
        id: dataset.id,
        name: dataset.name,
        description: dataset.description,
        version: dataset.version,
        createdAt: dataset.createdAt,
        updatedAt: dataset.updatedAt,
      }),
      testCases: dataset.testCases,
    };

    // Generate export path
    const timestamp = formatDate(new Date(), 'yyyy-MM-dd-HHmmss');
    const exportDir = join(this.datasetsDir, 'exports');
    await mkdir(exportDir, { recursive: true });

    let exportPath: string;
    let content: string;

    switch (format) {
      case 'json':
        exportPath = join(exportDir, `${datasetId}-${timestamp}.json`);
        content = pretty ? JSON.stringify(exportData, null, 2) : JSON.stringify(exportData);
        await writeFile(exportPath, content, 'utf-8');
        break;

      case 'csv':
        exportPath = join(exportDir, `${datasetId}-${timestamp}.csv`);
        content = this.convertToCSV(dataset);
        await writeFile(exportPath, content, 'utf-8');
        break;

      case 'yaml':
        // YAML export would require yaml library
        throw new Error('YAML export not yet implemented');

      default:
        throw new Error(`Unsupported export format: ${format}`);
    }

    return exportPath;
  }

  /**
   * List all datasets in the storage directory
   *
   * @returns Array of dataset metadata
   */
  async listDatasets(): Promise<Array<Pick<Dataset, 'id' | 'name' | 'version' | 'description'>>> {
    const datasets: Array<Pick<Dataset, 'id' | 'name' | 'version' | 'description'>> = [];

    // Recursively find all dataset files
    const files = await this.findAllDatasetFiles();

    for (const file of files) {
      try {
        const content = await readFile(file, 'utf-8');
        const data = JSON.parse(content);
        datasets.push({
          id: data.id,
          name: data.name,
          version: data.version,
          description: data.description,
        });
      } catch (error) {
        // Skip invalid files
        console.warn(`Failed to load dataset from ${file}:`, error);
      }
    }

    return datasets;
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Save dataset to file
   */
  private async saveDataset<TInput = any, TOutput = any>(
    dataset: Dataset<TInput, TOutput>
  ): Promise<void> {
    // Determine file path based on dataset ID
    const categoryDir = this.getCategoryFromId(dataset.id);
    const dir = join(this.datasetsDir, categoryDir);
    await mkdir(dir, { recursive: true });

    const filePath = join(dir, `${dataset.id}.json`);

    // Prepare data for storage (convert Zod schemas to JSON)
    const data = {
      id: dataset.id,
      name: dataset.name,
      description: dataset.description,
      version: dataset.version,
      createdAt: dataset.createdAt.toISOString(),
      updatedAt: dataset.updatedAt.toISOString(),
      metadata: dataset.metadata,
      schemas: {
        // Store schema definitions as plain objects
        // Note: This is a simplified approach; full Zod schema serialization
        // would require a more sophisticated solution
        input: this.serializeZodSchema(dataset.schema.input),
        output: this.serializeZodSchema(dataset.schema.output),
      },
      testCases: dataset.testCases.map((tc) => ({
        ...tc,
        metadata: {
          ...tc.metadata,
          createdAt: tc.metadata.createdAt.toISOString(),
        },
      })),
    };

    await writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
  }

  /**
   * Find dataset file by ID and optional version
   */
  private async findDatasetFile(id: string, version?: string): Promise<string | null> {
    const categoryDir = this.getCategoryFromId(id);
    const filePath = join(this.datasetsDir, categoryDir, `${id}.json`);

    if (existsSync(filePath)) {
      return filePath;
    }

    return null;
  }

  /**
   * Find all dataset files recursively
   */
  private async findAllDatasetFiles(): Promise<string[]> {
    const files: string[] = [];

    const scanDir = async (dir: string): Promise<void> => {
      if (!existsSync(dir)) {
        return;
      }

      const entries = await readdir(dir);

      for (const entry of entries) {
        const fullPath = join(dir, entry);
        const stats = await stat(fullPath);

        if (stats.isDirectory()) {
          await scanDir(fullPath);
        } else if (entry.endsWith('.json')) {
          files.push(fullPath);
        }
      }
    };

    await scanDir(this.datasetsDir);
    return files;
  }

  /**
   * Generate dataset ID from name
   */
  private generateDatasetId(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Generate test case ID
   */
  private generateTestCaseId(dataset: Dataset): string {
    const prefix = dataset.id.split('-')[0] || 'test';
    const count = dataset.testCases.length + 1;
    return `${prefix}-${String(count).padStart(3, '0')}-${nanoid(6)}`;
  }

  /**
   * Increment semantic version
   */
  private incrementVersion(version: string, level: 'major' | 'minor' | 'patch'): string {
    const [major, minor, patch] = version.split('.').map(Number);

    switch (level) {
      case 'major':
        return `${major + 1}.0.0`;
      case 'minor':
        return `${major}.${minor + 1}.0`;
      case 'patch':
        return `${major}.${minor}.${patch + 1}`;
    }
  }

  /**
   * Get category directory from dataset ID
   */
  private getCategoryFromId(id: string): string {
    // Map dataset ID prefixes to categories
    if (id.startsWith('compliance')) return 'compliance';
    if (id.startsWith('advising')) return 'advising';
    if (id.startsWith('chat') || id.startsWith('conversational')) return 'conversational';
    if (id.startsWith('risk')) return 'risk-prediction';
    if (id.startsWith('rag')) return 'rag';
    return 'general';
  }

  /**
   * Serialize Zod schema to JSON
   * Note: This is a simplified implementation
   */
  private serializeZodSchema(schema: z.ZodSchema): any {
    // For now, just store the schema description
    // A full implementation would serialize the entire Zod schema
    return {
      description: schema.description || 'Schema',
      // Store schema as JSON Schema for better portability
      // In a real implementation, use zod-to-json-schema library
    };
  }

  /**
   * Reconstruct Zod schema from JSON
   * Note: This is a simplified implementation
   */
  private reconstructZodSchema(data: any): z.ZodSchema {
    // For now, return a permissive schema
    // A full implementation would reconstruct the actual Zod schema
    return z.any();
  }

  /**
   * Convert dataset to CSV format
   */
  private convertToCSV(dataset: Dataset): string {
    const rows: string[] = [];

    // Header
    rows.push('id,difficulty,category,tags,source,input,expected');

    // Test cases
    for (const tc of dataset.testCases) {
      const row = [
        tc.id,
        tc.metadata.difficulty,
        tc.metadata.category,
        tc.metadata.tags.join(';'),
        tc.metadata.source,
        JSON.stringify(tc.input),
        JSON.stringify(tc.expected),
      ];
      rows.push(row.join(','));
    }

    return rows.join('\n');
  }
}

/**
 * Default export: singleton instance
 */
export const datasetManager = new DatasetManager();
