/**
 * FERPA Compliance Checker (Task 10.3)
 * 
 * Ensures all test datasets and evaluation processes comply with the Family
 * Educational Rights and Privacy Act (FERPA) and NCAA data protection requirements.
 * 
 * Key Requirements:
 * - No real student data in test datasets
 * - Data anonymization for production-derived test cases
 * - Audit logging for all dataset access and modifications
 * 
 * FERPA Reference: 34 CFR Part 99
 * NCAA Reference: Privacy and Data Security Policy
 */

import { randomBytes, createHash } from 'crypto';
import {
  FERPAComplianceResult,
  FERPARequirement,
  Severity,
  DatasetAuditLog,
  AnonymizationConfig,
  PIIType,
  AdversarialDataset,
} from '../types';
import { PIIDetector } from './pii-detector';

/**
 * FERPA Compliance Checker
 */
export class FERPAComplianceChecker {
  private piiDetector: PIIDetector;
  private auditLogs: DatasetAuditLog[] = [];

  constructor() {
    this.piiDetector = new PIIDetector();
  }

  /**
   * Verify that test dataset contains no real student data
   * 
   * @param dataset - Dataset to verify
   * @returns Compliance result
   */
  public verifyNoRealStudentData(dataset: any): FERPAComplianceResult {
    const violations: Array<{
      description: string;
      severity: Severity;
      location?: string;
    }> = [];

    // Check dataset name and description for PII
    const nameDetections = this.piiDetector.detect(dataset.name || '');
    const descDetections = this.piiDetector.detect(dataset.description || '');

    if (nameDetections.length > 0) {
      violations.push({
        description: 'PII detected in dataset name: ' + nameDetections.map(d => d.type).join(', '),
        severity: Severity.HIGH,
        location: 'dataset.name',
      });
    }

    if (descDetections.length > 0) {
      violations.push({
        description: 'PII detected in dataset description: ' + descDetections.map(d => d.type).join(', '),
        severity: Severity.MEDIUM,
        location: 'dataset.description',
      });
    }

    // Check each test case for PII
    if (dataset.testCases && Array.isArray(dataset.testCases)) {
      dataset.testCases.forEach((testCase: any, index: number) => {
        const inputStr = typeof testCase.input === 'string' 
          ? testCase.input 
          : JSON.stringify(testCase.input);
        
        const expectedStr = typeof testCase.expected === 'string'
          ? testCase.expected
          : JSON.stringify(testCase.expected);

        const inputDetections = this.piiDetector.detect(inputStr);
        const expectedDetections = this.piiDetector.detect(expectedStr);

        if (inputDetections.length > 0) {
          violations.push({
            description: 'PII detected in test case #' + (index + 1) + ' input: ' + inputDetections.map(d => d.type).join(', '),
            severity: Severity.CRITICAL,
            location: 'testCases[' + index + '].input',
          });
        }

        if (expectedDetections.length > 0) {
          violations.push({
            description: 'PII detected in test case #' + (index + 1) + ' expected output: ' + expectedDetections.map(d => d.type).join(', '),
            severity: Severity.CRITICAL,
            location: 'testCases[' + index + '].expected',
          });
        }
      });
    }

    const compliant = violations.length === 0;

    return {
      compliant,
      requirement: FERPARequirement.NO_REAL_STUDENT_DATA,
      violations,
      recommendations: compliant
        ? ['Dataset is FERPA compliant - no real student data detected']
        : [
            'Remove all real student data from the dataset',
            'Use anonymized or synthetic data for test cases',
            'Review data collection processes to prevent PII contamination',
            'Consider using data anonymization tools before importing production data',
          ],
    };
  }

  /**
   * Verify that test datasets have proper audit logging
   * 
   * @param datasetName - Name of the dataset
   * @returns Compliance result
   */
  public verifyAuditLogging(datasetName: string): FERPAComplianceResult {
    const recentLogs = this.auditLogs.filter(
      (log) => log.datasetName === datasetName
    );

    const violations: Array<{
      description: string;
      severity: Severity;
      location?: string;
    }> = [];

    if (recentLogs.length === 0) {
      violations.push({
        description: 'No audit logs found for dataset: ' + datasetName,
        severity: Severity.MEDIUM,
        location: 'audit_logs',
      });
    }

    // Check for required actions
    const requiredActions = ['READ', 'WRITE', 'ANONYMIZE'];
    const loggedActions = new Set(recentLogs.map((log) => log.action));

    for (const action of requiredActions) {
      if (!loggedActions.has(action as any)) {
        violations.push({
          description: 'Missing audit log for ' + action + ' action on dataset: ' + datasetName,
          severity: Severity.LOW,
          location: 'audit_logs',
        });
      }
    }

    const compliant = violations.length === 0;

    return {
      compliant,
      requirement: FERPARequirement.ACCESS_AUDIT_LOG,
      violations,
      recommendations: compliant
        ? ['Audit logging is properly configured']
        : [
            'Enable audit logging for all dataset operations',
            'Store audit logs in a secure, tamper-proof location',
            'Implement automatic log retention and archival policies',
            'Set up alerts for suspicious access patterns',
          ],
    };
  }

  /**
   * Log dataset access for FERPA compliance
   * 
   * @param log - Audit log entry
   */
  public logAccess(log: Omit<DatasetAuditLog, 'id' | 'timestamp'>): void {
    const auditLog: DatasetAuditLog = {
      id: this.generateLogId(),
      timestamp: new Date().toISOString(),
      ...log,
    };

    this.auditLogs.push(auditLog);

    // In production, persist to database
    // await prisma.datasetAuditLog.create({ data: auditLog });
  }

  /**
   * Get audit logs for a specific dataset
   * 
   * @param datasetName - Name of the dataset
   * @param limit - Maximum number of logs to return
   * @returns Array of audit logs
   */
  public getAuditLogs(datasetName: string, limit: number = 100): DatasetAuditLog[] {
    return this.auditLogs
      .filter((log) => log.datasetName === datasetName)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  /**
   * Generate unique log ID
   */
  private generateLogId(): string {
    return 'log_' + Date.now() + '_' + randomBytes(8).toString('hex');
  }
}

/**
 * Data Anonymizer for production-derived test cases
 */
export class DataAnonymizer {
  private consistentMappings: Map<string, string>;
  private config: AnonymizationConfig;

  constructor(config?: Partial<AnonymizationConfig>) {
    this.consistentMappings = new Map();
    this.config = {
      preserveFormat: true,
      consistentMapping: true,
      piiTypes: Object.values(PIIType),
      ...config,
    };
  }

  /**
   * Anonymize dataset by replacing PII with synthetic data
   * 
   * @param data - Data to anonymize (string or object)
   * @returns Anonymized data
   */
  public anonymize(data: any): any {
    if (typeof data === 'string') {
      return this.anonymizeString(data);
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.anonymize(item));
    }

    if (typeof data === 'object' && data !== null) {
      const anonymized: any = {};
      for (const [key, value] of Object.entries(data)) {
        anonymized[key] = this.anonymize(value);
      }
      return anonymized;
    }

    return data;
  }

  /**
   * Anonymize a string value
   */
  private anonymizeString(text: string): string {
    let anonymized = text;

    // Anonymize emails
    if (this.config.piiTypes.includes(PIIType.EMAIL)) {
      anonymized = anonymized.replace(
        /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
        (match) => this.getAnonymizedValue(match, 'email')
      );
    }

    // Anonymize names with titles
    if (this.config.piiTypes.includes(PIIType.NAME)) {
      anonymized = anonymized.replace(
        /\b(?:Mr\.|Mrs\.|Ms\.|Dr\.|Prof\.)\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b/g,
        (match) => this.getAnonymizedValue(match, 'name')
      );
    }

    // Anonymize student IDs
    if (this.config.piiTypes.includes(PIIType.STUDENT_ID)) {
      anonymized = anonymized.replace(
        /\b[A-Z]\d{8}\b/g,
        (match) => this.getAnonymizedValue(match, 'student_id')
      );
    }

    // Anonymize phone numbers
    if (this.config.piiTypes.includes(PIIType.PHONE)) {
      anonymized = anonymized.replace(
        /\b(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b/g,
        (match) => this.getAnonymizedValue(match, 'phone')
      );
    }

    // Anonymize SSN
    if (this.config.piiTypes.includes(PIIType.SSN)) {
      anonymized = anonymized.replace(
        /\b(?!000|666|9\d{2})\d{3}-(?!00)\d{2}-(?!0000)\d{4}\b/g,
        (match) => this.getAnonymizedValue(match, 'ssn')
      );
    }

    return anonymized;
  }

  /**
   * Get anonymized value with optional consistent mapping
   */
  private getAnonymizedValue(original: string, type: string): string {
    if (this.config.consistentMapping && this.consistentMappings.has(original)) {
      return this.consistentMappings.get(original)!;
    }

    const anonymized = this.generateAnonymizedValue(type, original);

    if (this.config.consistentMapping) {
      this.consistentMappings.set(original, anonymized);
    }

    return anonymized;
  }

  /**
   * Generate synthetic anonymized value
   */
  private generateAnonymizedValue(type: string, original: string): string {
    switch (type) {
      case 'email':
        const hash = this.hashValue(original).substring(0, 8);
        return 'user' + hash + '@example.com';

      case 'name':
        const nameHash = this.hashValue(original).substring(0, 4);
        return original.replace(/[A-Z][a-z]+/g, () => 'Person' + nameHash);

      case 'student_id':
        if (this.config.preserveFormat && /^[A-Z]\d{8}$/.test(original)) {
          const digits = this.hashValue(original).substring(0, 8);
          return 'S' + digits;
        }
        return 'S' + this.hashValue(original).substring(0, 8);

      case 'phone':
        const phoneDigits = this.hashValue(original).substring(0, 10);
        return '555-' + phoneDigits.substring(0, 3) + '-' + phoneDigits.substring(3, 7);

      case 'ssn':
        const ssnDigits = this.hashValue(original).substring(0, 9);
        return ssnDigits.substring(0, 3) + '-' + ssnDigits.substring(3, 5) + '-' + ssnDigits.substring(5, 9);

      default:
        return '[ANON_' + type.toUpperCase() + ']';
    }
  }

  /**
   * Hash a value for consistent anonymization
   */
  private hashValue(value: string): string {
    return createHash('sha256')
      .update(value)
      .digest('hex')
      .replace(/[a-f]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 49)); // Convert to digits
  }

  /**
   * Clear mapping cache
   */
  public clearMappings(): void {
    this.consistentMappings.clear();
  }
}

/**
 * Utility function to validate dataset FERPA compliance
 * 
 * @param dataset - Dataset to validate
 * @returns Compliance results for all requirements
 */
export async function validateDatasetCompliance(
  dataset: any
): Promise<FERPAComplianceResult[]> {
  const checker = new FERPAComplianceChecker();

  const results: FERPAComplianceResult[] = [];

  // Check for real student data
  results.push(checker.verifyNoRealStudentData(dataset));

  // Check audit logging
  results.push(checker.verifyAuditLogging(dataset.name || 'unknown'));

  return results;
}

/**
 * Export singleton instances
 */
export const ferpaChecker = new FERPAComplianceChecker();
export const dataAnonymizer = new DataAnonymizer();
