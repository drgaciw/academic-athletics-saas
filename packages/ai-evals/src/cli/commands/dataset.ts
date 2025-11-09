import { Command } from 'commander';
import {
  section,
  success,
  error,
  info,
  warning,
  formatTable,
  logError,
} from '../utils';

/**
 * Dataset command - Manage test datasets
 */
export function createDatasetCommand(): Command {
  const command = new Command('dataset')
    .description('Manage test datasets');

  // List datasets
  command
    .command('list')
    .description('List all available datasets')
    .option('-v, --verbose', 'Show detailed information', false)
    .action(handleListDatasets);

  // Show dataset details
  command
    .command('show <id>')
    .description('Show dataset details')
    .action(handleShowDataset);

  // Validate dataset
  command
    .command('validate <id>')
    .description('Validate dataset schema')
    .action(handleValidateDataset);

  // Create dataset
  command
    .command('create')
    .description('Create a new dataset')
    .option('-n, --name <name>', 'Dataset name')
    .option('-d, --description <description>', 'Dataset description')
    .option('-f, --file <path>', 'Import from file')
    .action(handleCreateDataset);

  return command;
}

/**
 * List datasets
 */
async function handleListDatasets(options: { verbose: boolean }) {
  try {
    section('Available Datasets');

    // Mock dataset list
    const datasets = [
      {
        id: 'compliance-eligibility',
        name: 'NCAA Eligibility Checks',
        category: 'compliance',
        testCases: 45,
        version: '1.0.0',
      },
      {
        id: 'compliance-gpa',
        name: 'GPA Calculations',
        category: 'compliance',
        testCases: 32,
        version: '1.0.0',
      },
      {
        id: 'chat-general',
        name: 'General Chat Queries',
        category: 'conversational',
        testCases: 28,
        version: '1.0.0',
      },
      {
        id: 'chat-policy',
        name: 'Policy Questions',
        category: 'conversational',
        testCases: 19,
        version: '1.0.0',
      },
      {
        id: 'advising-recommendations',
        name: 'Course Recommendations',
        category: 'advising',
        testCases: 36,
        version: '1.0.0',
      },
      {
        id: 'rag-retrieval',
        name: 'RAG Retrieval Quality',
        category: 'rag',
        testCases: 24,
        version: '1.0.0',
      },
    ];

    const tableData = [
      ['ID', 'Name', 'Category', 'Test Cases', 'Version'],
      ...datasets.map((ds) => [
        ds.id,
        ds.name,
        ds.category,
        ds.testCases.toString(),
        ds.version,
      ]),
    ];

    console.log(formatTable(tableData));

    info(`Total datasets: ${datasets.length}`);
    info(`Total test cases: ${datasets.reduce((sum, ds) => sum + ds.testCases, 0)}`);
  } catch (err) {
    error('Failed to list datasets');
    logError(err as Error);
    process.exit(1);
  }
}

/**
 * Show dataset details
 */
async function handleShowDataset(id: string) {
  try {
    section(`Dataset: ${id}`);

    // Mock dataset details
    const dataset = {
      id,
      name: 'NCAA Eligibility Checks',
      description: 'Test cases for NCAA Division I eligibility validation',
      category: 'compliance',
      version: '1.0.0',
      testCases: 45,
      tags: ['ncaa', 'eligibility', 'compliance'],
      createdAt: new Date('2025-01-15'),
      updatedAt: new Date('2025-01-20'),
      schema: {
        input: 'StudentEligibilityInput',
        output: 'EligibilityResult',
      },
    };

    console.log('ID:', dataset.id);
    console.log('Name:', dataset.name);
    console.log('Description:', dataset.description);
    console.log('Category:', dataset.category);
    console.log('Version:', dataset.version);
    console.log('Test Cases:', dataset.testCases);
    console.log('Tags:', dataset.tags.join(', '));
    console.log('Created:', dataset.createdAt.toISOString());
    console.log('Updated:', dataset.updatedAt.toISOString());
    console.log('\nSchema:');
    console.log('  Input:', dataset.schema.input);
    console.log('  Output:', dataset.schema.output);

    // Sample test cases
    section('Sample Test Cases');

    const sampleCases = [
      {
        id: 'test-001',
        difficulty: 'easy',
        tags: ['gpa', 'basic'],
      },
      {
        id: 'test-002',
        difficulty: 'medium',
        tags: ['credits', 'progress'],
      },
      {
        id: 'test-003',
        difficulty: 'hard',
        tags: ['edge-case', 'transfer'],
      },
    ];

    const tableData = [
      ['Test ID', 'Difficulty', 'Tags'],
      ...sampleCases.map((tc) => [tc.id, tc.difficulty, tc.tags.join(', ')]),
    ];

    console.log(formatTable(tableData));
  } catch (err) {
    error(`Failed to load dataset: ${id}`);
    logError(err as Error);
    process.exit(1);
  }
}

/**
 * Validate dataset
 */
async function handleValidateDataset(id: string) {
  try {
    section(`Validating Dataset: ${id}`);

    info('Checking schema compliance...');
    info('Validating test cases...');
    info('Checking for duplicates...');

    // Mock validation
    const validationResults = {
      valid: true,
      errors: [],
      warnings: [
        'Test case test-042: Missing metadata.source field',
        'Test case test-089: Description is empty',
      ],
    };

    if (validationResults.valid) {
      success('Dataset validation passed');
    } else {
      error('Dataset validation failed');
    }

    if (validationResults.warnings.length > 0) {
      section('Warnings');
      validationResults.warnings.forEach((w) => warning(w));
    }

    if (validationResults.errors.length > 0) {
      section('Errors');
      validationResults.errors.forEach((e) => error(e));
    }
  } catch (err) {
    error(`Failed to validate dataset: ${id}`);
    logError(err as Error);
    process.exit(1);
  }
}

/**
 * Create dataset
 */
async function handleCreateDataset(options: any) {
  try {
    section('Create Dataset');

    if (!options.name) {
      throw new Error('Dataset name is required (--name)');
    }

    info(`Creating dataset: ${options.name}`);

    if (options.file) {
      info(`Importing from: ${options.file}`);
    }

    // Mock creation
    const datasetId = options.name.toLowerCase().replace(/\s+/g, '-');

    success(`Dataset created: ${datasetId}`);
    info('Use "ai-evals dataset show" to view details');
  } catch (err) {
    error('Failed to create dataset');
    logError(err as Error);
    process.exit(1);
  }
}
