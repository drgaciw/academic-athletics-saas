import { z } from 'zod';

/**
 * Core type definitions for the AI Evaluation Framework
 */

// Test Case and Dataset Types
export interface TestCaseMetadata {
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  tags: string[];
  createdAt: Date;
  source: 'production' | 'synthetic' | 'edge-case';
  description?: string;
  reference?: string;
}

export interface TestCase<TInput = any, TOutput = any> {
  id: string;
  input: TInput;
  expected: TOutput;
  metadata: TestCaseMetadata;
}

export interface DatasetSchema<TInput = any, TOutput = any> {
  input: z.ZodSchema<TInput>;
  output: z.ZodSchema<TOutput>;
}

export interface Dataset<TInput = any, TOutput = any> {
  id: string;
  name: string;
  description: string;
  version: string;
  testCases: TestCase<TInput, TOutput>[];
  schema: DatasetSchema<TInput, TOutput>;
  createdAt: Date;
  updatedAt: Date;
  metadata?: {
    author?: string;
    purpose?: string;
    relatedDatasets?: string[];
    [key: string]: any;
  };
}

export interface DatasetConfig<TInput = any, TOutput = any> {
  name: string;
  description: string;
  schema: DatasetSchema<TInput, TOutput>;
  version?: string;
  metadata?: Dataset['metadata'];
}

export interface ValidationError {
  type: 'schema' | 'duplicate' | 'missing' | 'invalid';
  message: string;
  path?: string;
  testCaseId?: string;
}

export interface ValidationWarning {
  type: 'coverage' | 'balance' | 'quality';
  message: string;
  suggestion?: string;
}

export interface LoadOptions {
  validate?: boolean;
  lazy?: boolean;
  version?: string;
}

export interface ExportOptions {
  format: 'json' | 'csv' | 'yaml';
  includeMetadata?: boolean;
  pretty?: boolean;
}

export interface DatasetFile<TInput = any, TOutput = any> {
  dataset: Omit<Dataset<TInput, TOutput>, 'schema' | 'testCases'>;
  schemas: {
    input: Record<string, any>;
    output: Record<string, any>;
  };
  testCases: TestCase<TInput, TOutput>[];
}

// Runner Types
export interface RunnerConfig {
  modelId: string; // e.g., 'openai/gpt-4', 'anthropic/claude-sonnet-4'
  temperature?: number;
  maxTokens?: number;
  timeout?: number; // milliseconds
  retries?: number;
  additionalParams?: Record<string, any>;
}

export interface TokenUsage {
  prompt: number;
  completion: number;
  total: number;
}

export interface RunResult<TOutput = any> {
  testCaseId: string;
  input: any;
  expected: TOutput;
  actual: TOutput;
  metadata: {
    modelId: string;
    latency: number; // milliseconds
    tokenUsage: TokenUsage;
    cost: number; // USD
    timestamp: Date;
    error?: string;
  };
}

export interface RunSummary {
  datasetId: string;
  runId: string;
  config: RunnerConfig;
  results: RunResult[];
  startTime: Date;
  endTime: Date;
  totalDuration: number; // milliseconds
  totalCost: number; // USD
  totalTokens: number;
}

// Scorer Types
export interface ScorerConfig {
  strategy: 'exact' | 'semantic' | 'llm-judge' | 'custom';
  threshold?: number;
  judgeModelId?: string; // For LLM-as-judge
  customScorer?: (expected: any, actual: any) => Promise<Score>;
}

export interface ScoreBreakdown {
  accuracy?: number;
  completeness?: number;
  relevance?: number;
  helpfulness?: number;
  [dimension: string]: number | undefined;
}

export interface Score {
  passed: boolean;
  score: number; // 0.0 to 1.0
  confidence?: number;
  explanation?: string;
  breakdown?: ScoreBreakdown;
}

export interface ScoringResult {
  testCaseId: string;
  score: Score;
  scorerConfig: ScorerConfig;
}

// Comparison Types
export interface ComparisonResult {
  testCaseId: string;
  models: {
    [modelId: string]: {
      result: RunResult;
      score?: Score;
    };
  };
  winner?: string; // modelId of best performing model
  metrics: {
    [modelId: string]: {
      latency: number;
      cost: number;
      score: number;
    };
  };
}

export interface ComparisonReport {
  datasetId: string;
  comparisonId: string;
  configs: RunnerConfig[];
  results: ComparisonResult[];
  summary: {
    [modelId: string]: {
      avgLatency: number;
      totalCost: number;
      avgScore: number;
      winRate: number; // percentage of cases where this model won
    };
  };
  startTime: Date;
  endTime: Date;
  totalDuration: number;
}

// Error Types
export interface EvalError {
  type: 'execution' | 'scoring' | 'system';
  severity: 'fatal' | 'error' | 'warning';
  message: string;
  testCaseId?: string;
  stack?: string;
  retryable: boolean;
}

// Feature-Specific Types

// Compliance Types
export interface ComplianceInput {
  studentId: string;
  gpa: number;
  creditHours: number;
  progressTowardDegree: number;
  semester: string;
  additionalContext?: Record<string, any>;
}

export interface ComplianceOutput {
  eligible: boolean;
  issues: string[];
  recommendations: string[];
  details?: Record<string, any>;
}

// Conversational Types
export interface ConversationalInput {
  message: string;
  context: {
    userId: string;
    role: string;
    conversationHistory?: Array<{ role: string; content: string }>;
  };
}

export interface ConversationalOutput {
  answer: string;
  citations?: string[];
  tone?: string;
  followUpSuggestions?: string[];
}

// Advising Types
export interface AdvisingInput {
  studentId: string;
  major: string;
  completedCourses: string[];
  semester: string;
  athleticSchedule?: {
    practices: string[];
    games: string[];
  };
}

export interface CourseRecommendation {
  courseId: string;
  reason: string;
  conflicts: string[];
  priority?: number;
}

export interface AdvisingOutput {
  recommendations: CourseRecommendation[];
  warnings: string[];
}

// Risk Prediction Types
export interface RiskPredictionInput {
  studentId: string;
  academicMetrics: {
    gpa: number;
    creditHours: number;
    attendanceRate: number;
  };
  athleticMetrics: {
    performanceScore: number;
    injuryHistory: number;
    travelHours: number;
  };
  supportMetrics: {
    tutoringHours: number;
    advisingMeetings: number;
  };
}

export interface RiskPredictionOutput {
  riskScore: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high';
  factors: Array<{
    factor: string;
    impact: number;
    direction: 'positive' | 'negative';
  }>;
  recommendations: string[];
}

// RAG Types
export interface RAGInput {
  query: string;
  context?: Record<string, any>;
  maxDocuments?: number;
}

export interface RAGOutput {
  answer: string;
  sources: Array<{
    documentId: string;
    content: string;
    relevanceScore: number;
  }>;
  confidence: number;
}

// ============================================================================
// Orchestrator Types (Task 5.1-5.4)
// ============================================================================

// Job Management Types (Task 5.1)
export type JobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface EvalJob {
  id: string;
  datasetIds: string[];
  runnerConfigs: RunnerConfig[];
  scorerConfig: ScorerConfig;
  baseline?: string; // Baseline run ID for comparison
  parallel?: boolean;
  concurrency?: number; // Max parallel executions
  createdAt: Date;
  updatedAt: Date;
  status: JobStatus;
  error?: string;
}

export interface JobProgress {
  jobId: string;
  status: JobStatus;
  totalTests: number;
  completedTests: number;
  failedTests: number;
  progress: number; // 0-100
  currentTest?: string;
  estimatedTimeRemaining?: number; // milliseconds
  errors: EvalError[];
}

// Parallel Execution Types (Task 5.2)
export interface WorkerConfig {
  maxWorkers?: number; // CPU cores for parallel execution
  concurrency?: number; // Max concurrent API calls
  rateLimit?: {
    requestsPerMinute: number;
    tokensPerMinute?: number;
  };
}

export interface ExecutionMetrics {
  totalExecutionTime: number; // milliseconds
  avgExecutionTime: number; // milliseconds
  parallelEfficiency: number; // 0-1, actual vs theoretical speedup
  throttleTime: number; // time spent waiting for rate limits
  workerUtilization: number; // 0-1, average worker usage
}

// Baseline and Regression Types (Task 5.3)
export interface Baseline {
  id: string;
  name: string;
  description: string;
  runId: string;
  metrics: Metrics;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type RegressionSeverity = 'critical' | 'major' | 'minor';

export interface Regression {
  testCaseId: string;
  metric: string;
  baseline: number;
  current: number;
  percentChange: number;
  absoluteChange: number;
  severity: RegressionSeverity;
  category?: string;
}

export interface Improvement {
  testCaseId: string;
  metric: string;
  baseline: number;
  current: number;
  percentChange: number;
  magnitude: 'significant' | 'moderate' | 'minor';
}

export interface ComparisonMetrics {
  accuracyDelta: number;
  passRateDelta: number;
  latencyDelta: number;
  costDelta: number;
  regressionCount: number;
  improvementCount: number;
}

export interface BaselineComparison {
  baselineId: string;
  currentRunId: string;
  metrics: {
    baseline: Metrics;
    current: Metrics;
  };
  regressions: Regression[];
  improvements: Improvement[];
  summary: {
    totalRegressions: number;
    criticalRegressions: number;
    majorRegressions: number;
    minorRegressions: number;
    totalImprovements: number;
    overallChange: number; // percentage
  };
}

// Metrics Types
export interface EvalMetrics {
  totalTests: number;
  passed: number;
  failed: number;
  accuracy: number; // percentage
  passRate: number; // percentage
  avgScore: number; // 0-1
  avgLatency: number; // milliseconds
  totalCost: number; // USD
  byCategory?: Record<string, CategoryMetrics>;
  byDifficulty?: Record<string, DifficultyMetrics>;
}

export interface Metrics {
  totalTests: number;
  passed: number;
  failed: number;
  accuracy: number; // percentage
  passRate: number; // percentage
  avgScore: number; // 0-1
  avgLatency: number; // milliseconds
  totalCost: number; // USD
  breakdown: Record<string, CategoryMetrics>;
}

export interface CategoryMetrics {
  category: string;
  totalTests: number;
  passed: number;
  accuracy: number;
  avgScore: number;
  avgLatency: number;
  avgCost: number;
}

export interface DifficultyMetrics {
  difficulty: 'easy' | 'medium' | 'hard';
  totalTests: number;
  passed: number;
  failed: number;
  passRate: number;
  avgScore: number;
}

// Report Types (Task 5.4)
export interface EvalReport {
  jobId: string;
  summary: {
    totalTests: number;
    passed: number;
    failed: number;
    accuracy: number;
    avgLatency: number;
    totalCost: number;
    duration: number;
    status: JobStatus;
  };
  runSummaries: RunSummary[];
  scoringResults: ScoringResult[];
  metrics: Metrics;
  regressions: Regression[];
  recommendations: Recommendation[];
  executionMetrics?: ExecutionMetrics;
  generatedAt: Date;
}

export interface Recommendation {
  type: 'performance' | 'accuracy' | 'cost' | 'regression';
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  actionable: boolean;
  suggestedActions?: string[];
}

// Export Types (Task 5.4)
export type ExportFormat = 'json' | 'csv' | 'html';

export interface ExportOptions {
  format: ExportFormat;
  includeDetails?: boolean;
  includeScoringBreakdown?: boolean;
  includeRawResults?: boolean;
  includeRecommendations?: boolean;
}

// Validation Types
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// ============================================================================
// Safety and Compliance Types (Task 10.1-10.3)
// ============================================================================

/**
 * Severity levels for security and compliance issues
 */
export enum Severity {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
  INFO = 'INFO',
}

/**
 * Types of adversarial attacks to test against
 */
export enum AdversarialAttackType {
  PROMPT_INJECTION = 'PROMPT_INJECTION',
  DATA_EXFILTRATION = 'DATA_EXFILTRATION',
  JAILBREAK = 'JAILBREAK',
  PII_EXTRACTION = 'PII_EXTRACTION',
  PROMPT_LEAKING = 'PROMPT_LEAKING',
  ROLE_CONFUSION = 'ROLE_CONFUSION',
  INSTRUCTION_OVERRIDE = 'INSTRUCTION_OVERRIDE',
}

/**
 * Types of PII that must be detected and protected per FERPA
 */
export enum PIIType {
  NAME = 'NAME',
  EMAIL = 'EMAIL',
  PHONE = 'PHONE',
  SSN = 'SSN',
  STUDENT_ID = 'STUDENT_ID',
  ADDRESS = 'ADDRESS',
  DATE_OF_BIRTH = 'DATE_OF_BIRTH',
  MEDICAL_INFO = 'MEDICAL_INFO',
  FINANCIAL_INFO = 'FINANCIAL_INFO',
  ACADEMIC_RECORD = 'ACADEMIC_RECORD',
}

/**
 * FERPA compliance requirements
 */
export enum FERPARequirement {
  NO_REAL_STUDENT_DATA = 'NO_REAL_STUDENT_DATA',
  DATA_ANONYMIZATION = 'DATA_ANONYMIZATION',
  ACCESS_AUDIT_LOG = 'ACCESS_AUDIT_LOG',
  CONSENT_REQUIRED = 'CONSENT_REQUIRED',
  SECURE_STORAGE = 'SECURE_STORAGE',
}

/**
 * Test case for adversarial testing (Task 10.1)
 */
export interface AdversarialTestCase {
  id: string;
  name: string;
  description: string;
  attackType: AdversarialAttackType;
  severity: Severity;
  input: string;
  expectedBehavior: 'REJECT' | 'SANITIZE' | 'FILTER' | 'ALERT';
  expectedOutput?: string;
  metadata: {
    source: string;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
    tags: string[];
    references?: string[];
  };
}

/**
 * Dataset containing adversarial test cases (Task 10.1)
 */
export interface AdversarialDataset {
  name: string;
  version: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  testCases: AdversarialTestCase[];
  metadata: {
    totalTests: number;
    attackTypeBreakdown: Record<AdversarialAttackType, number>;
    severityBreakdown: Record<Severity, number>;
  };
}

/**
 * PII detection result (Task 10.2)
 */
export interface PIIDetection {
  type: PIIType;
  value: string;
  confidence: number;
  position: {
    start: number;
    end: number;
  };
  context: string;
}

/**
 * PII scorer result (Task 10.2)
 */
export interface PIIScoreResult {
  passed: boolean;
  detections: PIIDetection[];
  severity: Severity;
  message: string;
  recommendations: string[];
}

/**
 * FERPA compliance check result (Task 10.3)
 */
export interface FERPAComplianceResult {
  compliant: boolean;
  requirement: FERPARequirement;
  violations: Array<{
    description: string;
    severity: Severity;
    location?: string;
  }>;
  recommendations: string[];
}

/**
 * Audit log entry for dataset access (Task 10.3)
 */
export interface DatasetAuditLog {
  id: string;
  timestamp: string;
  action: 'READ' | 'WRITE' | 'DELETE' | 'EXPORT' | 'ANONYMIZE';
  datasetName: string;
  userId: string;
  userRole: string;
  ipAddress: string;
  success: boolean;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

/**
 * Anonymization configuration (Task 10.3)
 */
export interface AnonymizationConfig {
  preserveFormat: boolean;
  consistentMapping: boolean;
  piiTypes: PIIType[];
  customPatterns?: Array<{
    name: string;
    pattern: RegExp;
    replacement: string;
  }>;
}

/**
 * Adversarial test result
 */
export interface AdversarialTestResult {
  testCaseId: string;
  passed: boolean;
  actualBehavior: 'REJECT' | 'SANITIZE' | 'FILTER' | 'ALERT' | 'FAIL';
  actualOutput: string;
  piiDetected: PIIDetection[];
  vulnerabilities: Array<{
    type: AdversarialAttackType;
    severity: Severity;
    description: string;
  }>;
  latencyMs: number;
  timestamp: string;
}

/**
 * Safety evaluation report
 */
export interface SafetyEvalReport {
  runId: string;
  timestamp: string;
  dataset: string;
  totalTests: number;
  passed: number;
  failed: number;
  criticalVulnerabilities: number;
  highVulnerabilities: number;
  piiLeakages: number;
  ferpaCompliant: boolean;
  results: AdversarialTestResult[];
  summary: {
    overallSafetyScore: number;
    attackTypeResults: Record<AdversarialAttackType, { passed: number; failed: number }>;
    severityDistribution: Record<Severity, number>;
    recommendations: string[];
  };
}

/**
 * Zod schemas for runtime validation
 */
export const AdversarialTestCaseSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  attackType: z.nativeEnum(AdversarialAttackType),
  severity: z.nativeEnum(Severity),
  input: z.string(),
  expectedBehavior: z.enum(['REJECT', 'SANITIZE', 'FILTER', 'ALERT']),
  expectedOutput: z.string().optional(),
  metadata: z.object({
    source: z.string(),
    difficulty: z.enum(['EASY', 'MEDIUM', 'HARD', 'EXPERT']),
    tags: z.array(z.string()),
    references: z.array(z.string()).optional(),
  }),
});

export const AdversarialDatasetSchema = z.object({
  name: z.string(),
  version: z.string(),
  description: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  testCases: z.array(AdversarialTestCaseSchema),
  metadata: z.object({
    totalTests: z.number(),
    attackTypeBreakdown: z.record(z.nativeEnum(AdversarialAttackType), z.number()),
    severityBreakdown: z.record(z.nativeEnum(Severity), z.number()),
  }),
});

export const DatasetAuditLogSchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  action: z.enum(['READ', 'WRITE', 'DELETE', 'EXPORT', 'ANONYMIZE']),
  datasetName: z.string(),
  userId: z.string(),
  userRole: z.string(),
  ipAddress: z.string(),
  success: z.boolean(),
  errorMessage: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});
