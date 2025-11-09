/**
 * Dataset Utility Functions
 *
 * Helper functions for working with datasets and test cases:
 * - Dataset creation helpers
 * - Test case builders
 * - Versioning utilities
 * - Metadata helpers
 */

import { nanoid } from 'nanoid';
import type { TestCase, TestCaseMetadata, Dataset } from '../types';

/**
 * Create a test case with automatic ID generation and defaults
 *
 * @param input - Test case input
 * @param expected - Expected output
 * @param metadata - Partial metadata (required fields will be filled with defaults)
 * @returns Complete test case with generated ID
 *
 * @example
 * ```typescript
 * const testCase = createTestCase(
 *   { studentId: 'SA001', gpa: 3.5 },
 *   { eligible: true },
 *   { category: 'gpa-check', difficulty: 'easy' }
 * );
 * ```
 */
export function createTestCase<TInput = any, TOutput = any>(
  input: TInput,
  expected: TOutput,
  metadata: Partial<TestCaseMetadata> & Pick<TestCaseMetadata, 'category' | 'difficulty'>
): TestCase<TInput, TOutput> {
  return {
    id: `test-${nanoid(10)}`,
    input,
    expected,
    metadata: {
      difficulty: metadata.difficulty,
      category: metadata.category,
      tags: metadata.tags || [],
      createdAt: metadata.createdAt || new Date(),
      source: metadata.source || 'synthetic',
      description: metadata.description,
      reference: metadata.reference,
    },
  };
}

/**
 * Create multiple test cases at once
 *
 * @param cases - Array of test case configurations
 * @param defaultMetadata - Default metadata for all test cases
 * @returns Array of complete test cases
 *
 * @example
 * ```typescript
 * const testCases = createTestCases([
 *   { input: { gpa: 3.5 }, expected: { eligible: true } },
 *   { input: { gpa: 2.0 }, expected: { eligible: false } }
 * ], {
 *   category: 'gpa-check',
 *   difficulty: 'easy',
 *   tags: ['ncaa', 'eligibility']
 * });
 * ```
 */
export function createTestCases<TInput = any, TOutput = any>(
  cases: Array<{
    input: TInput;
    expected: TOutput;
    metadata?: Partial<TestCaseMetadata>;
  }>,
  defaultMetadata: Partial<TestCaseMetadata> & Pick<TestCaseMetadata, 'category' | 'difficulty'>
): TestCase<TInput, TOutput>[] {
  return cases.map((testCase) =>
    createTestCase(testCase.input, testCase.expected, {
      ...defaultMetadata,
      ...testCase.metadata,
    })
  );
}

/**
 * Parse semantic version string
 *
 * @param version - Version string (e.g., "1.2.3")
 * @returns Parsed version components
 */
export function parseVersion(version: string): { major: number; minor: number; patch: number } {
  const [major, minor, patch] = version.split('.').map(Number);
  return { major, minor, patch };
}

/**
 * Increment semantic version
 *
 * @param version - Current version string
 * @param level - Which component to increment
 * @returns New version string
 *
 * @example
 * ```typescript
 * incrementVersion('1.2.3', 'minor') // '1.3.0'
 * incrementVersion('1.2.3', 'patch') // '1.2.4'
 * ```
 */
export function incrementVersion(version: string, level: 'major' | 'minor' | 'patch'): string {
  const { major, minor, patch } = parseVersion(version);

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
 * Compare two semantic versions
 *
 * @param a - First version
 * @param b - Second version
 * @returns -1 if a < b, 0 if a == b, 1 if a > b
 *
 * @example
 * ```typescript
 * compareVersions('1.2.3', '1.2.4') // -1
 * compareVersions('2.0.0', '1.9.9') // 1
 * ```
 */
export function compareVersions(a: string, b: string): -1 | 0 | 1 {
  const versionA = parseVersion(a);
  const versionB = parseVersion(b);

  if (versionA.major !== versionB.major) {
    return versionA.major > versionB.major ? 1 : -1;
  }
  if (versionA.minor !== versionB.minor) {
    return versionA.minor > versionB.minor ? 1 : -1;
  }
  if (versionA.patch !== versionB.patch) {
    return versionA.patch > versionB.patch ? 1 : -1;
  }
  return 0;
}

/**
 * Filter test cases by metadata
 *
 * @param testCases - Array of test cases
 * @param filters - Metadata filters
 * @returns Filtered test cases
 *
 * @example
 * ```typescript
 * const easyTests = filterTestCases(dataset.testCases, {
 *   difficulty: 'easy',
 *   category: 'gpa-check'
 * });
 * ```
 */
export function filterTestCases<TInput = any, TOutput = any>(
  testCases: TestCase<TInput, TOutput>[],
  filters: {
    difficulty?: TestCaseMetadata['difficulty'];
    category?: string;
    tags?: string[];
    source?: TestCaseMetadata['source'];
  }
): TestCase<TInput, TOutput>[] {
  return testCases.filter((testCase) => {
    if (filters.difficulty && testCase.metadata.difficulty !== filters.difficulty) {
      return false;
    }
    if (filters.category && testCase.metadata.category !== filters.category) {
      return false;
    }
    if (filters.source && testCase.metadata.source !== filters.source) {
      return false;
    }
    if (filters.tags && !filters.tags.every((tag) => testCase.metadata.tags.includes(tag))) {
      return false;
    }
    return true;
  });
}

/**
 * Group test cases by a metadata field
 *
 * @param testCases - Array of test cases
 * @param field - Metadata field to group by
 * @returns Map of field value to test cases
 *
 * @example
 * ```typescript
 * const byDifficulty = groupTestCases(dataset.testCases, 'difficulty');
 * console.log(byDifficulty.get('easy')); // All easy test cases
 * ```
 */
export function groupTestCases<TInput = any, TOutput = any>(
  testCases: TestCase<TInput, TOutput>[],
  field: keyof TestCaseMetadata
): Map<any, TestCase<TInput, TOutput>[]> {
  const groups = new Map();

  for (const testCase of testCases) {
    const value = testCase.metadata[field];
    const key = Array.isArray(value) ? JSON.stringify(value) : value;

    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push(testCase);
  }

  return groups;
}

/**
 * Calculate dataset statistics
 *
 * @param dataset - Dataset to analyze
 * @returns Statistics about the dataset
 *
 * @example
 * ```typescript
 * const stats = getDatasetStats(dataset);
 * console.log(`Dataset has ${stats.totalTests} tests with ${stats.passRate}% coverage`);
 * ```
 */
export function getDatasetStats(dataset: Dataset): {
  totalTests: number;
  byDifficulty: Record<string, number>;
  byCategory: Record<string, number>;
  bySource: Record<string, number>;
  uniqueTags: string[];
  avgTagsPerTest: number;
} {
  const stats = {
    totalTests: dataset.testCases.length,
    byDifficulty: { easy: 0, medium: 0, hard: 0 },
    byCategory: {} as Record<string, number>,
    bySource: { production: 0, synthetic: 0, 'edge-case': 0 },
    uniqueTags: new Set<string>(),
    avgTagsPerTest: 0,
  };

  let totalTags = 0;

  for (const testCase of dataset.testCases) {
    // Count by difficulty
    stats.byDifficulty[testCase.metadata.difficulty]++;

    // Count by category
    const category = testCase.metadata.category;
    stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;

    // Count by source
    stats.bySource[testCase.metadata.source]++;

    // Collect unique tags
    for (const tag of testCase.metadata.tags) {
      stats.uniqueTags.add(tag);
    }

    totalTags += testCase.metadata.tags.length;
  }

  stats.avgTagsPerTest = stats.totalTests > 0 ? totalTags / stats.totalTests : 0;

  return {
    ...stats,
    uniqueTags: Array.from(stats.uniqueTags),
  };
}

/**
 * Generate a unique dataset ID from a name
 *
 * @param name - Dataset name
 * @returns URL-safe dataset ID
 *
 * @example
 * ```typescript
 * generateDatasetId('Compliance Eligibility Checks') // 'compliance-eligibility-checks'
 * ```
 */
export function generateDatasetId(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Validate version string format
 *
 * @param version - Version string to validate
 * @returns True if valid semantic version
 *
 * @example
 * ```typescript
 * isValidVersion('1.2.3') // true
 * isValidVersion('1.2') // false
 * ```
 */
export function isValidVersion(version: string): boolean {
  return /^\d+\.\d+\.\d+$/.test(version);
}

/**
 * Merge multiple datasets into one
 *
 * Useful for combining related test suites or aggregating results.
 * The merged dataset will have a new ID and version.
 *
 * @param datasets - Datasets to merge
 * @param name - Name for the merged dataset
 * @param description - Description for the merged dataset
 * @returns Merged dataset
 *
 * @example
 * ```typescript
 * const merged = mergeDatasets(
 *   [gpaChecks, creditHourChecks],
 *   'All Compliance Checks',
 *   'Combined compliance test suite'
 * );
 * ```
 */
export function mergeDatasets<TInput = any, TOutput = any>(
  datasets: Dataset<TInput, TOutput>[],
  name: string,
  description: string
): Omit<Dataset<TInput, TOutput>, 'schema'> {
  if (datasets.length === 0) {
    throw new Error('Cannot merge zero datasets');
  }

  const allTestCases: TestCase<TInput, TOutput>[] = [];
  const seenIds = new Set<string>();

  for (const dataset of datasets) {
    for (const testCase of dataset.testCases) {
      // Skip duplicates
      if (seenIds.has(testCase.id)) {
        continue;
      }
      seenIds.add(testCase.id);
      allTestCases.push(testCase);
    }
  }

  return {
    id: generateDatasetId(name),
    name,
    description,
    version: '1.0.0',
    testCases: allTestCases,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Split dataset into train/test sets
 *
 * @param dataset - Dataset to split
 * @param trainRatio - Ratio of data to use for training (0-1)
 * @param shuffle - Whether to shuffle before splitting
 * @returns Train and test datasets
 *
 * @example
 * ```typescript
 * const { train, test } = splitDataset(dataset, 0.8, true);
 * console.log(`Train: ${train.length}, Test: ${test.length}`);
 * ```
 */
export function splitDataset<TInput = any, TOutput = any>(
  dataset: Dataset<TInput, TOutput>,
  trainRatio: number = 0.8,
  shuffle: boolean = true
): {
  train: TestCase<TInput, TOutput>[];
  test: TestCase<TInput, TOutput>[];
} {
  if (trainRatio < 0 || trainRatio > 1) {
    throw new Error('trainRatio must be between 0 and 1');
  }

  let testCases = [...dataset.testCases];

  if (shuffle) {
    testCases = shuffleArray(testCases);
  }

  const splitIndex = Math.floor(testCases.length * trainRatio);

  return {
    train: testCases.slice(0, splitIndex),
    test: testCases.slice(splitIndex),
  };
}

/**
 * Shuffle array in place (Fisher-Yates algorithm)
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
