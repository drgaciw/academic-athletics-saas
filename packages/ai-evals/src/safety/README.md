# Safety and Compliance Module

## Overview

This module provides comprehensive security testing and FERPA compliance validation for AI systems in the Athletic Academics Hub platform. It implements Tasks 10.1, 10.2, and 10.3 from the AI evaluation framework.

## Features

### 1. PII Detection (Task 10.2)

Zero-tolerance PII detection scorer that identifies and flags personally identifiable information in AI outputs.

**Supported PII Types:**
- Email addresses
- Phone numbers
- Social Security Numbers (SSN)
- Student IDs
- Physical addresses
- Dates of birth
- Names (with context analysis)
- Medical information
- Financial information
- Academic records (GPAs, grades)

**Detection Methods:**
- Regex pattern matching for structured data
- Context analysis for ambiguous patterns
- Confidence scoring based on pattern specificity

**OWASP Reference:** A03:2021 - Injection  
**Compliance:** FERPA 34 CFR Part 99

### 2. FERPA Compliance (Task 10.3)

Ensures all test datasets and evaluation processes comply with the Family Educational Rights and Privacy Act.

**Key Features:**
- Verification that test datasets contain no real student data
- Data anonymization for production-derived test cases
- Audit logging for all dataset access and modifications
- Secure storage requirements validation

**FERPA Requirements Checked:**
- `NO_REAL_STUDENT_DATA`: Datasets must not contain actual student information
- `DATA_ANONYMIZATION`: Production data must be anonymized before use
- `ACCESS_AUDIT_LOG`: All dataset operations must be logged
- `CONSENT_REQUIRED`: User authorization verification
- `SECURE_STORAGE`: Encryption and access control validation

### 3. Adversarial Testing (Task 10.1)

Comprehensive test datasets for adversarial attacks targeting AI systems.

**Attack Types Covered:**
- **Prompt Injection**: System instruction override attempts
- **Data Exfiltration**: Unauthorized access to protected information
- **Jailbreak**: Attempts to bypass safety guardrails
- **PII Extraction**: Direct and indirect PII extraction
- **Prompt Leaking**: System prompt exposure attempts
- **Role Confusion**: Authority impersonation attacks
- **Instruction Override**: Malicious instruction injection

**Test Dataset Structure:**
- 30+ test cases across 3 datasets
- Severity ratings (CRITICAL, HIGH, MEDIUM, LOW)
- Difficulty levels (EASY, MEDIUM, HARD, EXPERT)
- Expected behaviors (REJECT, SANITIZE, FILTER, ALERT)

## Usage

### PII Detection

```typescript
import { piiScorer, redactPII } from '@aah/ai-evals/safety';

// Score output for PII leakage
const output = "Contact John Smith at john.smith@university.edu or 555-123-4567";
const result = piiScorer.score(output);

console.log(result.passed); // false
console.log(result.severity); // "HIGH"
console.log(result.detections.length); // 2 (email + phone)

// Redact PII from output
const redacted = redactPII(output, result.detections);
console.log(redacted); 
// "Contact [REDACTED_NAME] at [REDACTED_EMAIL] or [REDACTED_PHONE]"
```

### FERPA Compliance Checking

```typescript
import { ferpaChecker, validateDatasetCompliance } from '@aah/ai-evals/safety';

// Verify dataset has no real student data
const dataset = loadDataset('advising-test-cases');
const complianceResult = ferpaChecker.verifyNoRealStudentData(dataset);

if (!complianceResult.compliant) {
  console.error('FERPA Violation:', complianceResult.violations);
  complianceResult.recommendations.forEach(rec => console.log('- ' + rec));
}

// Log dataset access
ferpaChecker.logAccess({
  action: 'READ',
  datasetName: 'advising-test-cases',
  userId: 'user_123',
  userRole: 'developer',
  ipAddress: '192.168.1.1',
  success: true,
});

// Get audit logs
const logs = ferpaChecker.getAuditLogs('advising-test-cases', 50);
```

### Data Anonymization

```typescript
import { dataAnonymizer } from '@aah/ai-evals/safety';

// Anonymize production data before using in tests
const productionData = {
  name: "John Smith",
  email: "john.smith@university.edu",
  studentId: "A12345678",
  phone: "555-123-4567",
  gpa: 3.45
};

const anonymized = dataAnonymizer.anonymize(productionData);
console.log(anonymized);
// {
//   name: "Person4a7c",
//   email: "user8f3d2a1b@example.com",
//   studentId: "S87654321",
//   phone: "555-234-5678",
//   gpa: 3.45
// }
```

### Adversarial Testing

```typescript
import { loadAdversarialDataset } from '@aah/ai-evals/datasets';

// Load adversarial test cases
const promptInjectionTests = loadAdversarialDataset('prompt-injection');
const dataExfiltrationTests = loadAdversarialDataset('data-exfiltration');
const jailbreakTests = loadAdversarialDataset('jailbreak');

// Run adversarial tests
for (const testCase of promptInjectionTests.testCases) {
  const response = await aiSystem.process(testCase.input);
  const piiResult = piiScorer.score(response);
  
  if (!piiResult.passed) {
    console.error(`FAILED ${testCase.id}: PII leakage detected`);
    console.error(`Severity: ${piiResult.severity}`);
    console.error(`Detections:`, piiResult.detections);
  }
}
```

## Test Datasets

### 1. Prompt Injection Dataset
**Location:** `packages/ai-evals/datasets/adversarial/prompt-injection.json`  
**Tests:** 8 test cases  
**Focus:** System instruction override, delimiter confusion, role-play attacks

### 2. Data Exfiltration Dataset
**Location:** `packages/ai-evals/datasets/adversarial/data-exfiltration.json`  
**Tests:** 10 test cases  
**Focus:** PII extraction, academic record access, FERPA violations

### 3. Jailbreak Dataset
**Location:** `packages/ai-evals/datasets/adversarial/jailbreak.json`  
**Tests:** 12 test cases  
**Focus:** Safety guardrail bypass, DAN attacks, prompt leaking

## Security Best Practices

### Defense in Depth
1. **Input Validation**: Validate and sanitize all user inputs
2. **Output Filtering**: Scan all AI outputs for PII before display
3. **Access Control**: Enforce RBAC on all data access
4. **Audit Logging**: Log all sensitive operations
5. **Regular Testing**: Run adversarial tests in CI/CD pipeline

### Zero-Trust Architecture
- Never trust user input
- Always verify authorization
- Assume breach mentality
- Encrypt sensitive data at rest and in transit

### FERPA Compliance Checklist
- [ ] Test datasets contain only synthetic/anonymized data
- [ ] PII detection enabled on all AI outputs
- [ ] Audit logging enabled for dataset operations
- [ ] Access controls enforce least privilege principle
- [ ] Regular compliance audits scheduled
- [ ] Incident response plan documented

## Integration with CI/CD

```yaml
# .github/workflows/safety-tests.yml
name: Safety and Compliance Tests

on: [pull_request]

jobs:
  safety-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      
      - name: Run PII Detection Tests
        run: npm run test:pii
        
      - name: Run Adversarial Tests
        run: npm run test:adversarial
        
      - name: Verify FERPA Compliance
        run: npm run test:ferpa
        
      - name: Block on Critical Failures
        if: failure()
        run: exit 1
```

## Performance Considerations

**PII Detection:**
- Average latency: ~10ms per output
- Memory usage: ~5MB
- Scales linearly with text length

**FERPA Compliance:**
- Dataset validation: ~50ms per 100 test cases
- Audit log writes: ~5ms per operation

**Adversarial Testing:**
- Run time: ~2-5 minutes for all 30 test cases
- Parallelizable across multiple workers

## References

- [OWASP Top 10 for LLMs](https://owasp.org/www-project-top-10-for-large-language-model-applications/)
- [FERPA Regulations (34 CFR Part 99)](https://www.ecfr.gov/current/title-34/subtitle-A/part-99)
- [NCAA Privacy Policy](https://www.ncaa.org/sports/2023/6/14/privacy-policy.aspx)
- [NIST AI Risk Management Framework](https://www.nist.gov/itl/ai-risk-management-framework)

## Support

For questions or issues, contact the security team or file an issue in the repository.
