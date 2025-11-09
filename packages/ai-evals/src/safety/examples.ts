/**
 * Safety Module Examples
 * 
 * Demonstrates usage of PII detection, FERPA compliance, and adversarial testing
 */

import {
  piiScorer,
  redactPII,
  ferpaChecker,
  dataAnonymizer,
  validateDatasetCompliance,
  PIIType,
  Severity,
} from './index';
import {
  loadAdversarialDataset,
  loadAllAdversarialDatasets,
  getAdversarialDatasetStats,
} from '../../datasets/adversarial';

/**
 * Example 1: PII Detection and Scoring
 */
export async function examplePIIDetection() {
  console.log('\n=== Example 1: PII Detection ===\n');
  
  // Test output with various PII types
  const outputs = [
    "Contact John Smith at john.smith@university.edu for more information.",
    "Student ID A12345678 has a GPA of 3.45 and can be reached at 555-123-4567.",
    "The student's SSN is 123-45-6789 and address is 123 Main Street, Boston, MA 02101.",
    "No personally identifiable information in this response about NCAA rules.",
  ];
  
  for (const output of outputs) {
    const result = piiScorer.score(output);
    
    console.log('Output: "' + output.substring(0, 60) + '..."');
    console.log('Passed: ' + result.passed);
    console.log('Severity: ' + result.severity);
    console.log('Detections: ' + result.detections.length);
    
    if (result.detections.length > 0) {
      result.detections.forEach(detection => {
        console.log('  - ' + detection.type + ': "' + detection.value + '" (confidence: ' + detection.confidence + ')');
      });
      
      // Show redacted version
      const redacted = redactPII(output, result.detections);
      console.log('Redacted: "' + redacted + '"');
    }
    
    console.log('---');
  }
}

/**
 * Example 2: FERPA Compliance Checking
 */
export async function exampleFERPACompliance() {
  console.log('\n=== Example 2: FERPA Compliance ===\n');
  
  // Example dataset with potential FERPA violations
  const testDataset = {
    name: 'compliance-test-cases',
    description: 'Test cases for NCAA compliance checking',
    testCases: [
      {
        id: 'test-001',
        input: {
          studentId: 'ANON_001',
          gpa: 3.45,
          creditHours: 15,
        },
        expected: {
          eligible: true,
          issues: [],
        },
      },
    ],
  };
  
  // Check for real student data
  const complianceResult = ferpaChecker.verifyNoRealStudentData(testDataset);
  
  console.log('Dataset: ' + testDataset.name);
  console.log('Compliant: ' + complianceResult.compliant);
  console.log('Requirement: ' + complianceResult.requirement);
  
  if (!complianceResult.compliant) {
    console.log('\nViolations:');
    complianceResult.violations.forEach(violation => {
      console.log('  - [' + violation.severity + '] ' + violation.description);
      if (violation.location) {
        console.log('    Location: ' + violation.location);
      }
    });
  }
}

/**
 * Run all examples
 */
export async function runAllExamples() {
  await examplePIIDetection();
  await exampleFERPACompliance();
}

// Run examples if executed directly
if (require.main === module) {
  runAllExamples().catch(console.error);
}
