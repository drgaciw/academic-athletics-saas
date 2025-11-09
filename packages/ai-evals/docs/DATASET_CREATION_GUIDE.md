# Dataset Creation Guide

Complete guide to creating and managing test datasets for the AI Evaluation Framework.

## Table of Contents

- [Overview](#overview)
- [Dataset Structure](#dataset-structure)
- [Creating Datasets](#creating-datasets)
- [Writing Effective Test Cases](#writing-effective-test-cases)
- [Schema Design](#schema-design)
- [Dataset Organization](#dataset-organization)
- [Quality Assurance](#quality-assurance)
- [Best Practices](#best-practices)
- [Advanced Topics](#advanced-topics)

## Overview

Datasets are collections of test cases used to evaluate AI model performance. A well-designed dataset is crucial for accurate, reliable evaluation.

### What Makes a Good Dataset?

- **Comprehensive Coverage**: Tests all important scenarios
- **Balanced Distribution**: Mix of easy, medium, and hard cases
- **Real-World Relevance**: Reflects actual use cases
- **Clear Expected Outputs**: Unambiguous correct answers
- **Maintainable**: Easy to update and extend
- **Version Controlled**: Track changes over time

## Dataset Structure

### Anatomy of a Dataset

```typescript
{
  // Metadata
  "id": "compliance-eligibility-v1",
  "name": "NCAA Compliance Eligibility Tests",
  "description": "Test cases for initial and continuing eligibility",
  "version": "1.0.0",

  // Test cases
  "testCases": [
    {
      "id": "test-001",
      "input": { /* ... */ },
      "expected": { /* ... */ },
      "metadata": { /* ... */ }
    }
  ],

  // Schema validation
  "schema": {
    "input": { /* Zod schema */ },
    "output": { /* Zod schema */ }
  },

  // Additional metadata
  "metadata": {
    "createdAt": "2025-01-08T00:00:00Z",
    "updatedAt": "2025-01-08T00:00:00Z",
    "author": "QA Team",
    "purpose": "Regression testing"
  }
}
```

### Test Case Components

1. **ID**: Unique identifier (e.g., `compliance-001`)
2. **Input**: Data passed to the AI model
3. **Expected**: Correct output from the model
4. **Metadata**: Additional information about the test

```typescript
{
  "id": "compliance-001",
  "input": {
    "studentId": "STU123",
    "gpa": 2.5,
    "creditHours": 24,
    "progressTowardDegree": 42
  },
  "expected": {
    "eligible": true,
    "issues": [],
    "recommendations": []
  },
  "metadata": {
    "difficulty": "easy",
    "category": "continuing-eligibility",
    "tags": ["gpa", "credits"],
    "createdAt": "2025-01-08T00:00:00Z",
    "source": "synthetic",
    "description": "Student meeting minimum requirements"
  }
}
```

## Creating Datasets

### Step 1: Define Your Schema

Start by defining the structure of inputs and outputs using Zod:

```typescript
import { z } from 'zod';

// Input schema
const ComplianceInputSchema = z.object({
  studentId: z.string(),
  gpa: z.number().min(0).max(4.0),
  creditHours: z.number().min(0),
  progressTowardDegree: z.number().min(0).max(100),
  semester: z.string(),
});

// Output schema
const ComplianceOutputSchema = z.object({
  eligible: z.boolean(),
  issues: z.array(z.string()),
  recommendations: z.array(z.string()),
  details: z.record(z.any()).optional(),
});
```

### Step 2: Create the Dataset

```typescript
import { DatasetManager } from '@aah/ai-evals';

const manager = new DatasetManager();
await manager.initialize();

const dataset = await manager.createDataset({
  name: 'compliance-eligibility',
  description: 'Test cases for NCAA eligibility validation',
  schema: {
    input: ComplianceInputSchema,
    output: ComplianceOutputSchema,
  },
  version: '1.0.0',
  metadata: {
    author: 'QA Team',
    purpose: 'Regression testing for compliance service',
    tags: ['compliance', 'ncaa', 'eligibility'],
  },
});

console.log(`Dataset created: ${dataset.id}`);
```

### Step 3: Add Test Cases

```typescript
// Add test cases one by one
await manager.addTestCase(dataset.id, {
  input: {
    studentId: 'STU001',
    gpa: 2.5,
    creditHours: 24,
    progressTowardDegree: 42,
    semester: 'Fall 2024',
  },
  expected: {
    eligible: true,
    issues: [],
    recommendations: [],
  },
  metadata: {
    difficulty: 'easy',
    category: 'baseline',
    tags: ['passing'],
    createdAt: new Date(),
    source: 'synthetic',
  },
});

// Or add multiple at once
const testCases = [/* ... */];
for (const testCase of testCases) {
  await manager.addTestCase(dataset.id, testCase);
}
```

## Writing Effective Test Cases

### Categories of Test Cases

#### 1. Baseline Tests (Easy)

Test standard, expected scenarios:

```typescript
{
  id: 'baseline-001',
  input: {
    studentId: 'STU001',
    gpa: 3.0,
    creditHours: 30,
    progressTowardDegree: 50,
  },
  expected: {
    eligible: true,
    issues: [],
  },
  metadata: {
    difficulty: 'easy',
    category: 'baseline',
    description: 'Student well above all requirements',
  },
}
```

#### 2. Boundary Tests (Medium)

Test edge cases at requirement boundaries:

```typescript
{
  id: 'boundary-001',
  input: {
    studentId: 'STU002',
    gpa: 2.3, // Exact minimum
    creditHours: 24, // Exact minimum
    progressTowardDegree: 40, // Exact minimum
  },
  expected: {
    eligible: true,
    issues: [],
  },
  metadata: {
    difficulty: 'medium',
    category: 'boundary',
    tags: ['edge-case', 'minimum-requirements'],
    description: 'Student exactly at all minimums',
  },
}
```

```typescript
{
  id: 'boundary-002',
  input: {
    studentId: 'STU003',
    gpa: 2.299, // Just below minimum
    creditHours: 24,
    progressTowardDegree: 40,
  },
  expected: {
    eligible: false,
    issues: ['GPA below 2.3 threshold'],
  },
  metadata: {
    difficulty: 'hard',
    category: 'boundary',
    tags: ['edge-case', 'failing'],
    description: 'GPA just below threshold',
  },
}
```

#### 3. Error Cases (Medium-Hard)

Test invalid or error conditions:

```typescript
{
  id: 'error-001',
  input: {
    studentId: 'STU004',
    gpa: 1.5,
    creditHours: 15,
    progressTowardDegree: 20,
  },
  expected: {
    eligible: false,
    issues: [
      'GPA below 2.3 threshold',
      'Insufficient credit hours',
      'Insufficient progress toward degree',
    ],
    recommendations: [
      'Meet with academic advisor immediately',
      'Consider reduced athletic schedule',
      'Enroll in additional courses',
    ],
  },
  metadata: {
    difficulty: 'medium',
    category: 'violations',
    tags: ['failing', 'multiple-issues'],
    description: 'Multiple eligibility violations',
  },
}
```

#### 4. Complex Scenarios (Hard)

Test nuanced, multi-faceted situations:

```typescript
{
  id: 'complex-001',
  input: {
    studentId: 'STU005',
    gpa: 2.8,
    creditHours: 23, // Just below
    progressTowardDegree: 58,
    semester: 'Spring 2025',
  },
  expected: {
    eligible: false,
    issues: ['Insufficient credit hours (24 required)'],
    recommendations: [
      'Enroll in 1 additional credit hour',
      'Otherwise eligible for competition',
    ],
  },
  metadata: {
    difficulty: 'hard',
    category: 'complex',
    tags: ['partial-compliance', 'credit-hours'],
    description: 'Good GPA but missing one credit hour',
  },
}
```

### Test Case Template

Use this template for consistency:

```typescript
const testCaseTemplate = {
  id: 'CATEGORY-NNN', // e.g., compliance-001
  input: {
    // All required fields
    // Use realistic values
  },
  expected: {
    // Exact expected output
    // Be specific and complete
  },
  metadata: {
    difficulty: 'easy' | 'medium' | 'hard',
    category: 'baseline' | 'boundary' | 'error' | 'complex',
    tags: ['tag1', 'tag2'], // Searchable tags
    createdAt: new Date(),
    source: 'production' | 'synthetic' | 'edge-case',
    description: 'Clear description of what this tests',
    reference: 'Optional link to docs or ticket',
  },
};
```

## Schema Design

### Input Schema Best Practices

```typescript
// ✅ Good: Specific types and validation
const GoodInputSchema = z.object({
  studentId: z.string().regex(/^STU\d{3,6}$/),
  gpa: z.number().min(0).max(4.0),
  creditHours: z.number().int().min(0).max(200),
  semester: z.enum(['Fall', 'Spring', 'Summer']),
});

// ❌ Bad: Too loose
const BadInputSchema = z.object({
  studentId: z.string(), // No format validation
  gpa: z.number(), // No bounds
  creditHours: z.any(), // Not type-safe
  semester: z.string(), // Should be enum
});
```

### Output Schema Best Practices

```typescript
// ✅ Good: Clear structure
const GoodOutputSchema = z.object({
  eligible: z.boolean(),
  issues: z.array(z.string()),
  recommendations: z.array(z.string()),
  confidence: z.number().min(0).max(1).optional(),
});

// ❌ Bad: Unclear structure
const BadOutputSchema = z.object({
  result: z.any(), // What is this?
  data: z.record(z.any()), // Too generic
});
```

### Schema Versioning

When schemas change, version your datasets:

```typescript
// v1.0.0: Initial schema
const SchemaV1 = z.object({
  gpa: z.number(),
});

// v2.0.0: Added new field
const SchemaV2 = z.object({
  gpa: z.number(),
  qualityPoints: z.number(), // New field
});

// Create new dataset version
const datasetV2 = await manager.createDataset({
  name: 'compliance-eligibility',
  version: '2.0.0',
  schema: {
    input: InputSchemaV2,
    output: OutputSchemaV2,
  },
});
```

## Dataset Organization

### Naming Conventions

```
datasets/
├── compliance/
│   ├── compliance-initial-eligibility-v1.json
│   ├── compliance-continuing-eligibility-v1.json
│   └── compliance-gpa-validation-v1.json
├── conversational/
│   ├── conversational-ncaa-rules-v1.json
│   ├── conversational-academic-support-v1.json
│   └── conversational-edge-cases-v1.json
├── advising/
│   ├── advising-course-recommendations-v1.json
│   └── advising-conflict-detection-v1.json
├── risk-prediction/
│   └── risk-prediction-academic-v1.json
└── rag/
    └── rag-retrieval-quality-v1.json
```

### Dataset Categorization

Use clear, hierarchical categories:

```typescript
// Primary category: What feature/service
category: 'compliance' | 'conversational' | 'advising' | 'risk' | 'rag'

// Secondary category: What aspect
subcategory: 'initial-eligibility' | 'continuing-eligibility' | 'gpa'

// Tags for detailed filtering
tags: ['gpa', 'credits', 'progress', 'edge-case', 'regression']
```

### Metadata Standards

Consistent metadata helps with organization:

```typescript
{
  metadata: {
    // Required
    difficulty: 'easy' | 'medium' | 'hard',
    category: string,
    tags: string[],
    createdAt: Date,
    source: 'production' | 'synthetic' | 'edge-case',

    // Optional but recommended
    description: string,
    reference: string, // Link to docs, ticket, etc.
    author: string,
    reviewedBy: string,
    reviewedAt: Date,

    // Optional for tracking
    lastUpdated: Date,
    deprecatedAt: Date,
    replacedBy: string, // ID of replacement test
  }
}
```

## Quality Assurance

### Dataset Validation Checklist

Before finalizing a dataset, verify:

- [ ] All test cases have unique IDs
- [ ] Inputs match schema exactly
- [ ] Expected outputs match schema exactly
- [ ] All required metadata fields present
- [ ] Difficulty distribution is balanced
- [ ] Categories cover all important scenarios
- [ ] Edge cases are included
- [ ] No duplicate test cases
- [ ] Clear descriptions for all tests
- [ ] Schema validation passes

### Automated Validation

```typescript
async function validateDataset(datasetId: string) {
  const manager = new DatasetManager();
  const dataset = await manager.loadDataset(datasetId);

  // Run validation
  const result = manager.validateDataset(dataset);

  if (!result.valid) {
    console.error('❌ Validation failed:');
    result.errors.forEach(error => {
      console.error(`  - ${error.message}`);
    });
    return false;
  }

  if (result.warnings.length > 0) {
    console.warn('⚠️  Warnings:');
    result.warnings.forEach(warning => {
      console.warn(`  - ${warning.message}`);
    });
  }

  // Check distribution
  const difficulties = dataset.testCases.reduce((acc, tc) => {
    acc[tc.metadata.difficulty] = (acc[tc.metadata.difficulty] || 0) + 1;
    return acc;
  }, {});

  console.log('Difficulty distribution:', difficulties);

  // Check coverage
  const categories = new Set(dataset.testCases.map(tc => tc.metadata.category));
  console.log('Categories covered:', Array.from(categories));

  return true;
}
```

### Review Process

1. **Create**: Author creates test cases
2. **Validate**: Automated validation runs
3. **Review**: Peer review by team member
4. **Test**: Run against models to verify
5. **Approve**: Final approval and merge

## Best Practices

### 1. Start with Real Scenarios

Base test cases on actual production data (anonymized):

```typescript
// ✅ Good: Based on real scenario
{
  description: 'Actual case from Fall 2024 where student was 1 credit short',
  source: 'production',
  input: { /* anonymized real data */ },
}

// ❌ Bad: Arbitrary values
{
  description: 'Random test',
  source: 'synthetic',
  input: { gpa: 2.5 }, // Why 2.5? What does this test?
}
```

### 2. Use Descriptive IDs

```typescript
// ✅ Good: Clear what it tests
id: 'compliance-continuing-gpa-below-threshold-001'

// ❌ Bad: Non-descriptive
id: 'test-001'
```

### 3. Include Context in Descriptions

```typescript
// ✅ Good: Full context
description: 'Student in year 3 with 2.2 GPA (below 2.3 threshold). ' +
             'Tests that system correctly flags GPA violation and provides ' +
             'appropriate recommendations for academic support.'

// ❌ Bad: Minimal description
description: 'Low GPA test'
```

### 4. Balance Your Dataset

Aim for distribution:
- **40% Easy**: Baseline tests
- **40% Medium**: Boundary and error cases
- **20% Hard**: Complex scenarios

### 5. Version Control

Commit datasets to Git:

```bash
git add datasets/compliance-eligibility-v1.json
git commit -m "Add initial compliance eligibility dataset

- 25 test cases covering initial eligibility
- Mix of baseline, boundary, and error cases
- Validated against schema"
```

### 6. Document Assumptions

```typescript
{
  metadata: {
    description: 'Tests 40/60/80 rule for year 2 student',
    assumptions: [
      'Student is in year 2 (sophomore)',
      'Total degree requires 120 credits',
      '40% progress = 48 credits required',
    ],
  },
}
```

## Advanced Topics

### Generating Test Cases from Production Data

```typescript
async function generateFromProduction() {
  // 1. Export anonymized production data
  const productionData = await fetchProductionData();

  // 2. Anonymize
  const anonymizer = new DataAnonymizer({
    preserveFormat: true,
    consistentMapping: true,
  });

  // 3. Convert to test cases
  for (const record of productionData) {
    const anonymized = anonymizer.anonymize(record);

    await manager.addTestCase(dataset.id, {
      input: anonymized.input,
      expected: anonymized.output,
      metadata: {
        difficulty: classifyDifficulty(record),
        category: 'production',
        tags: extractTags(record),
        createdAt: new Date(),
        source: 'production',
        description: `Anonymized production case from ${record.date}`,
      },
    });
  }
}
```

### Synthetic Data Generation

```typescript
function generateSyntheticCases(count: number) {
  const cases = [];

  for (let i = 0; i < count; i++) {
    // Generate random but valid inputs
    const gpa = Math.random() * 4.0;
    const creditHours = Math.floor(Math.random() * 30);
    const progress = Math.floor(Math.random() * 100);

    // Calculate expected output based on rules
    const eligible = gpa >= 2.3 && creditHours >= 24 && progress >= 40;
    const issues = [];
    if (gpa < 2.3) issues.push('GPA below threshold');
    if (creditHours < 24) issues.push('Insufficient credits');
    if (progress < 40) issues.push('Insufficient progress');

    cases.push({
      input: { gpa, creditHours, progressTowardDegree: progress },
      expected: { eligible, issues },
      metadata: {
        difficulty: classifyDifficulty(gpa, creditHours, progress),
        category: 'synthetic',
        tags: ['generated'],
        createdAt: new Date(),
        source: 'synthetic',
      },
    });
  }

  return cases;
}
```

### Dataset Splitting

Split datasets for different purposes:

```typescript
async function splitDataset(datasetId: string) {
  const full = await manager.loadDataset(datasetId);

  // 70% training/validation, 30% test
  const shuffled = shuffle(full.testCases);
  const splitIndex = Math.floor(shuffled.length * 0.7);

  const trainCases = shuffled.slice(0, splitIndex);
  const testCases = shuffled.slice(splitIndex);

  // Create split datasets
  await manager.createDataset({
    name: `${full.name}-train`,
    description: 'Training/validation split',
    schema: full.schema,
    testCases: trainCases,
  });

  await manager.createDataset({
    name: `${full.name}-test`,
    description: 'Test split (holdout)',
    schema: full.schema,
    testCases: testCases,
  });
}
```

---

**Last Updated**: 2025-01-08
**Framework Version**: 1.0.0
