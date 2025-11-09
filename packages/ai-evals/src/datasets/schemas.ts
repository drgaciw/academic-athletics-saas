/**
 * Zod Schema Definitions for Common Test Case Types
 *
 * Pre-defined schemas for common use cases in the Athletic Academics Hub.
 * These schemas provide type-safe validation for dataset inputs and outputs.
 */

import { z } from 'zod';

// ============================================================================
// Compliance Schemas
// ============================================================================

/**
 * Input schema for NCAA compliance checks
 */
export const ComplianceInputSchema = z.object({
  studentId: z.string(),
  gpa: z.number().min(0).max(4.0),
  creditHours: z.number().int().min(0),
  progressTowardDegree: z.number().min(0).max(1),
  semester: z.string(),
  additionalContext: z.record(z.any()).optional(),
});

/**
 * Output schema for NCAA compliance results
 */
export const ComplianceOutputSchema = z.object({
  eligible: z.boolean(),
  issues: z.array(z.string()),
  recommendations: z.array(z.string()),
  details: z.record(z.any()).optional(),
});

// ============================================================================
// Conversational AI Schemas
// ============================================================================

/**
 * Input schema for conversational AI queries
 */
export const ConversationalInputSchema = z.object({
  message: z.string(),
  context: z.object({
    userId: z.string(),
    role: z.string(),
    conversationHistory: z
      .array(
        z.object({
          role: z.string(),
          content: z.string(),
        })
      )
      .optional(),
  }),
});

/**
 * Output schema for conversational AI responses
 */
export const ConversationalOutputSchema = z.object({
  answer: z.string(),
  citations: z.array(z.string()).optional(),
  tone: z.string().optional(),
  followUpSuggestions: z.array(z.string()).optional(),
});

// ============================================================================
// Advising Schemas
// ============================================================================

/**
 * Input schema for course advising
 */
export const AdvisingInputSchema = z.object({
  studentId: z.string(),
  major: z.string(),
  completedCourses: z.array(z.string()),
  semester: z.string(),
  athleticSchedule: z
    .object({
      practices: z.array(z.string()),
      games: z.array(z.string()),
    })
    .optional(),
});

/**
 * Course recommendation schema
 */
export const CourseRecommendationSchema = z.object({
  courseId: z.string(),
  reason: z.string(),
  conflicts: z.array(z.string()),
  priority: z.number().optional(),
});

/**
 * Output schema for advising recommendations
 */
export const AdvisingOutputSchema = z.object({
  recommendations: z.array(CourseRecommendationSchema),
  warnings: z.array(z.string()),
});

// ============================================================================
// Risk Prediction Schemas
// ============================================================================

/**
 * Input schema for risk prediction
 */
export const RiskPredictionInputSchema = z.object({
  studentId: z.string(),
  academicMetrics: z.object({
    gpa: z.number().min(0).max(4.0),
    creditHours: z.number().int().min(0),
    attendanceRate: z.number().min(0).max(1),
  }),
  athleticMetrics: z.object({
    performanceScore: z.number().min(0).max(100),
    injuryHistory: z.number().int().min(0),
    travelHours: z.number().min(0),
  }),
  supportMetrics: z.object({
    tutoringHours: z.number().min(0),
    advisingMeetings: z.number().int().min(0),
  }),
});

/**
 * Output schema for risk predictions
 */
export const RiskPredictionOutputSchema = z.object({
  riskScore: z.number().min(0).max(100),
  riskLevel: z.enum(['low', 'medium', 'high']),
  factors: z.array(
    z.object({
      factor: z.string(),
      impact: z.number(),
      direction: z.enum(['positive', 'negative']),
    })
  ),
  recommendations: z.array(z.string()),
});

// ============================================================================
// RAG (Retrieval-Augmented Generation) Schemas
// ============================================================================

/**
 * Input schema for RAG queries
 */
export const RAGInputSchema = z.object({
  query: z.string(),
  context: z.record(z.any()).optional(),
  maxDocuments: z.number().int().positive().optional(),
});

/**
 * Output schema for RAG responses
 */
export const RAGOutputSchema = z.object({
  answer: z.string(),
  sources: z.array(
    z.object({
      documentId: z.string(),
      content: z.string(),
      relevanceScore: z.number().min(0).max(1),
    })
  ),
  confidence: z.number().min(0).max(1),
});

// ============================================================================
// Generic Test Case Schemas
// ============================================================================

/**
 * Test case metadata schema
 */
export const TestCaseMetadataSchema = z.object({
  difficulty: z.enum(['easy', 'medium', 'hard']),
  category: z.string(),
  tags: z.array(z.string()),
  createdAt: z.date(),
  source: z.enum(['production', 'synthetic', 'edge-case']),
  description: z.string().optional(),
  reference: z.string().optional(),
});

/**
 * Generic test case schema
 */
export const TestCaseSchema = z.object({
  id: z.string(),
  input: z.any(),
  expected: z.any(),
  metadata: TestCaseMetadataSchema,
});

/**
 * Dataset schema
 */
export const DatasetSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  version: z.string().regex(/^\d+\.\d+\.\d+$/), // Semantic versioning
  testCases: z.array(TestCaseSchema),
  createdAt: z.date(),
  updatedAt: z.date(),
  metadata: z.record(z.any()).optional(),
});

// ============================================================================
// Schema Registry
// ============================================================================

/**
 * Registry of all predefined schemas
 * Useful for dynamically selecting schemas by use case
 */
export const SchemaRegistry = {
  compliance: {
    input: ComplianceInputSchema,
    output: ComplianceOutputSchema,
  },
  conversational: {
    input: ConversationalInputSchema,
    output: ConversationalOutputSchema,
  },
  advising: {
    input: AdvisingInputSchema,
    output: AdvisingOutputSchema,
  },
  riskPrediction: {
    input: RiskPredictionInputSchema,
    output: RiskPredictionOutputSchema,
  },
  rag: {
    input: RAGInputSchema,
    output: RAGOutputSchema,
  },
} as const;

/**
 * Type-safe schema getter
 */
export type SchemaType = keyof typeof SchemaRegistry;

export function getSchema(type: SchemaType) {
  return SchemaRegistry[type];
}
