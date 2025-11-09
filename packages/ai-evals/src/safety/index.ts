/**
 * Safety and Compliance Module
 * 
 * This module provides comprehensive security testing and FERPA compliance
 * validation for AI systems in the Athletic Academics Hub platform.
 * 
 * Features:
 * - PII detection and scoring with zero-tolerance policy
 * - FERPA compliance checking for datasets
 * - Data anonymization for production-derived test cases
 * - Audit logging for dataset access
 * - Adversarial attack testing
 */

export {
  PIIDetector,
  PIIScorer,
  piiScorer,
  redactPII,
} from './pii-detector';

export {
  FERPAComplianceChecker,
  DataAnonymizer,
  ferpaChecker,
  dataAnonymizer,
  validateDatasetCompliance,
} from './ferpa-compliance';

export type {
  PIIDetection,
  PIIScoreResult,
  FERPAComplianceResult,
  DatasetAuditLog,
  AnonymizationConfig,
  AdversarialTestCase,
  AdversarialDataset,
  AdversarialTestResult,
  SafetyEvalReport,
} from '../types';

export {
  PIIType,
  Severity,
  AdversarialAttackType,
  FERPARequirement,
} from '../types';
