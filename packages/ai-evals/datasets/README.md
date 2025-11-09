# AI Evaluation Test Datasets

This directory contains comprehensive test datasets for evaluating AI-powered features in the Athletic Academics Hub platform. All datasets follow a consistent schema and include realistic test cases covering edge cases, boundary conditions, and common scenarios.

## Dataset Organization

```
datasets/
├── compliance/          # NCAA compliance checking tests
│   └── eligibility-checks.json
├── advising/           # Course recommendation and scheduling tests
│   └── course-recommendations.json
├── conversational/     # Conversational AI response quality tests
│   └── policy-questions.json
├── risk-prediction/    # Academic risk prediction tests
│   └── historical-outcomes.json
└── rag/               # RAG retrieval quality tests
    └── retrieval-quality.json
```

## Dataset Schema

All datasets follow this common structure:

```typescript
interface Dataset {
  id: string;                    // Unique dataset identifier
  name: string;                  // Human-readable dataset name
  description: string;           // Purpose and scope of the dataset
  version: string;               // Semantic version (e.g., "1.0.0")
  testCases: TestCase[];         // Array of test cases
}

interface TestCase {
  id: string;                    // Unique test case identifier
  input: any;                    // Input data (structure varies by feature)
  expected: any;                 // Expected output (structure varies by feature)
  metadata: {
    difficulty: 'easy' | 'medium' | 'hard';
    category: string;            // Test case category
    tags: string[];              // Searchable tags
    createdAt: string;           // ISO 8601 timestamp
    source: 'production' | 'synthetic' | 'edge-case';
  };
}
```

## Dataset Summaries

### 1. NCAA Compliance Eligibility Checks
**File**: `compliance/eligibility-checks.json`
**Test Cases**: 22
**Purpose**: Validate NCAA Division I eligibility determination accuracy

**Categories**:
- Initial eligibility (GPA, core courses, test scores, 10/7 rule)
- Continuing eligibility (24/18 rule, 40-60-80 rule, GPA requirements)
- Boundary conditions (minimum thresholds, sliding scale edge cases)
- Complex scenarios (transfer credits, major changes)

**Key Test Scenarios**:
- ✅ Passing cases: Students meeting all requirements
- ❌ Failing cases: GPA too low, insufficient credits, missing core courses
- ⚠️ Edge cases: Exact threshold values, sliding scale boundaries
- 🔄 Complex cases: Transfer students, repeat courses, major changes

### 2. Course Recommendations
**File**: `advising/course-recommendations.json`
**Test Cases**: 15
**Purpose**: Evaluate course scheduling and prerequisite management

**Categories**:
- Standard scheduling (no conflicts, prerequisites satisfied)
- Schedule conflicts (lab times, practice conflicts, travel impact)
- Academic planning (degree progress, graduation requirements)
- Crisis scenarios (low GPA, credit shortages, impossible conflicts)

**Key Test Scenarios**:
- 📅 Standard scheduling: Clean schedules with no conflicts
- ⚡ Minor conflicts: Manageable scheduling challenges
- 🚨 Critical conflicts: Nursing clinical hours, music ensembles
- 🎓 Graduation planning: Senior year, degree completion
- ⚠️ At-risk students: Low GPA, behind on credits

### 3. Conversational AI Policy Questions
**File**: `conversational/policy-questions.json`
**Test Cases**: 16
**Purpose**: Test conversational AI response quality and safety

**Categories**:
- Policy questions (NCAA rules, eligibility requirements)
- Support services (tutoring, study halls, resources)
- Edge cases (empty input, gibberish, off-topic)
- Safety tests (academic dishonesty requests, inappropriate content)
- Sensitive issues (compliance violations, student welfare)

**Key Test Scenarios**:
- 📚 Informational: Straightforward policy questions
- 🆘 Support seeking: Requests for academic help
- 🚫 Safety tests: Inappropriate or dangerous requests
- ⚠️ Sensitive topics: Compliance violations, welfare concerns
- 🤔 Edge cases: Unclear or malformed inputs

### 4. Risk Prediction Historical Outcomes
**File**: `risk-prediction/historical-outcomes.json`
**Test Cases**: 11
**Purpose**: Evaluate academic risk scoring accuracy

**Categories**:
- High risk: Students likely to struggle (low GPA, poor attendance)
- Low risk: Students likely to succeed (strong performance)
- Medium risk: Borderline cases requiring monitoring
- Critical risk: Imminent eligibility loss (GPA below 2.0)

**Key Test Scenarios**:
- 🔴 High risk (accurate): Correctly identified struggling students
- 🟢 Low risk (accurate): Correctly identified succeeding students
- 🟡 Medium risk: Borderline cases with mixed indicators
- ⚫ Critical risk: Emergency intervention needed
- 🔄 False alarms: Predicted risk but student improved

**Risk Factors Evaluated**:
- Academic performance (GPA, attendance, assignment completion)
- Trends (improving vs declining)
- Support engagement (tutoring usage, missed appointments)
- Athletic factors (injury status, travel impact)

### 5. RAG Retrieval Quality
**File**: `rag/retrieval-quality.json`
**Test Cases**: 15
**Purpose**: Measure document retrieval accuracy and answer quality

**Categories**:
- Direct factual (single-document answers)
- Multi-document (synthesizing multiple sources)
- Procedural (how-to questions)
- Complex policy (nuanced interpretations)
- Broad queries (multiple relevant documents)

**Key Test Scenarios**:
- 🎯 Precise retrieval: Query matches exactly one primary document
- 📚 Multi-source: Answer requires synthesizing multiple documents
- 🔍 Keyword search: Testing semantic vs keyword matching
- 🌐 Broad queries: Many potentially relevant documents
- 🔐 Sensitive topics: Compliance violations, student rights

**Retrieval Metrics**:
- Recall@3, Recall@5, Recall@10: Coverage of relevant documents
- Precision@3: Accuracy of top results
- MRR (Mean Reciprocal Rank): First relevant result position
- NDCG (Normalized Discounted Cumulative Gain): Ranking quality

## FERPA Compliance

**⚠️ IMPORTANT**: All datasets use **synthetic data only**. No real student information is included.

**Synthetic Data Characteristics**:
- Student IDs: Prefixed with "SA-TEST-", "SA-ADV-", "SA-RISK-", etc.
- Names: Not included (only IDs used)
- Grades/GPAs: Realistic but fabricated values
- Scenarios: Based on common patterns, not real students

**Privacy Protections**:
- ✅ No real student names, IDs, or PII
- ✅ All scenarios are composites or fictional
- ✅ No actual academic records used
- ✅ Safe for version control and sharing

## Usage Examples

### Loading a Dataset

```typescript
import eligibilityDataset from './datasets/compliance/eligibility-checks.json';

// Access dataset metadata
console.log(eligibilityDataset.name);
console.log(eligibilityDataset.description);
console.log(`Test cases: ${eligibilityDataset.testCases.length}`);

// Iterate through test cases
eligibilityDataset.testCases.forEach(testCase => {
  console.log(`Running test: ${testCase.id}`);
  const result = runEligibilityCheck(testCase.input);
  const passed = compareResults(result, testCase.expected);
  console.log(`Result: ${passed ? 'PASS' : 'FAIL'}`);
});
```

### Filtering Test Cases

```typescript
// Get only high-difficulty test cases
const hardTests = dataset.testCases.filter(
  tc => tc.metadata.difficulty === 'hard'
);

// Get test cases by category
const initialEligibility = dataset.testCases.filter(
  tc => tc.metadata.category === 'initial-eligibility'
);

// Get edge cases
const edgeCases = dataset.testCases.filter(
  tc => tc.metadata.source === 'edge-case'
);
```

## Dataset Maintenance

### Adding New Test Cases

1. **Source**: Derive from production failures, edge cases discovered, or new features
2. **Format**: Follow the exact schema structure
3. **Metadata**: Include accurate difficulty, category, tags, and source
4. **Privacy**: Ensure no real student data is included
5. **Documentation**: Update counts and categories in this README

### Versioning

Datasets follow semantic versioning:
- **Major version** (1.0.0 → 2.0.0): Breaking schema changes
- **Minor version** (1.0.0 → 1.1.0): New test cases added
- **Patch version** (1.0.0 → 1.0.1): Corrections to existing test cases

## Test Coverage Summary

| Feature | Dataset | Test Cases | Categories | Difficulty Mix |
|---------|---------|-----------|-----------|----------------|
| NCAA Compliance | eligibility-checks.json | 22 | 7 | 9 easy, 8 medium, 5 hard |
| Course Advising | course-recommendations.json | 15 | 10 | 4 easy, 6 medium, 5 hard |
| Conversational AI | policy-questions.json | 16 | 8 | 5 easy, 6 medium, 5 hard |
| Risk Prediction | historical-outcomes.json | 11 | 6 | 4 easy, 4 medium, 3 hard |
| RAG Retrieval | retrieval-quality.json | 15 | 8 | 5 easy, 5 medium, 5 hard |
| **TOTAL** | **5 datasets** | **79** | **39** | **27 easy, 29 medium, 23 hard** |

## Quality Standards

All datasets meet these quality criteria:

- ✅ **Realistic**: Based on actual NCAA rules and university policies
- ✅ **Comprehensive**: Cover common cases, edge cases, and failure modes
- ✅ **Diverse**: Multiple difficulty levels and scenario types
- ✅ **Well-documented**: Clear metadata and categorization
- ✅ **Privacy-compliant**: No real student data (FERPA compliant)
- ✅ **Maintainable**: Consistent schema and clear organization
- ✅ **Versioned**: Tracked changes and version control

## Future Enhancements

Planned dataset expansions:

1. **Adversarial Testing**: Prompt injection, jailbreak attempts, PII leakage tests
2. **Multi-language**: Test cases in Spanish and other languages
3. **Accessibility**: Tests for screen reader compatibility and accessibility features
4. **Performance**: Large-scale datasets for load testing
5. **Integration**: Cross-feature test scenarios (e.g., compliance + advising)

## Contributing

When adding new test cases:

1. Follow the existing schema exactly
2. Include all required metadata fields
3. Use synthetic data only (no real students)
4. Add realistic expected outputs
5. Update this README with new counts
6. Increment the dataset version appropriately

## License

These datasets are proprietary to Athletic Academics Hub and are for internal evaluation purposes only. Do not distribute outside the organization.

---

**Last Updated**: 2025-01-15
**Maintained By**: AI Evaluation Team
**Questions**: Contact ai-evals@athleticacademicshub.com
