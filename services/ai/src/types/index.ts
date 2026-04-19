import { z } from 'zod'

// ============================================================================
// CORE AI TYPES
// ============================================================================

export type LLMProvider = 'openai' | 'anthropic'
export type OpenAIModel = 'gpt-4' | 'gpt-4-turbo' | 'gpt-4o' | 'gpt-4o-mini' | 'gpt-3.5-turbo' | 'gpt-5.1-codex-max'
export type AnthropicModel = 'claude-3-5-sonnet-20241022' | 'claude-3-5-haiku-20241022' | 'claude-3-opus-20240229'
export type AIModel = OpenAIModel | AnthropicModel

export interface AIMessage {
  role: 'system' | 'user' | 'assistant' | 'function'
  content: string
  name?: string
  functionCall?: {
    name: string
    arguments: string
  }
}

export interface StreamChunk {
  id: string
  delta: string
  tokenCount?: number
  finishReason?: 'stop' | 'length' | 'function_call' | 'content_filter'
}

// ============================================================================
// RAG PIPELINE TYPES
// ============================================================================

export interface QueryIntent {
  originalQuery: string
  rewrittenQuery: string
  intent: 'academic_advising' | 'compliance' | 'support' | 'general' | 'administrative'
  entities: Array<{
    type: string
    value: string
    confidence: number
  }>
  isConversational: boolean
  requiresContext: boolean
}

export interface RetrievedDocument {
  id: string
  content: string
  metadata: {
    source: string
    title?: string
    type: 'ncaa_rule' | 'course_catalog' | 'policy' | 'faq' | 'document'
    section?: string
    lastUpdated?: Date
  }
  score: number
  embedding?: number[]
}

export interface RAGContext {
  documents: RetrievedDocument[]
  totalRetrieved: number
  reranked: boolean
  avgScore: number
  tokens: number
}

export interface RAGResponse {
  answer: string
  sources: Array<{
    id: string
    title: string
    excerpt: string
    url?: string
    confidence: number
  }>
  confidence: number
  factChecked: boolean
  warnings?: string[]
  tokens: {
    prompt: number
    completion: number
    total: number
  }
  latency: number
}

export interface ValidationResult {
  isValid: boolean
  hasHallucination: boolean
  hasPII: boolean
  hasPromptInjection: boolean
  issues: Array<{
    type: 'hallucination' | 'pii' | 'injection' | 'inappropriate'
    severity: 'low' | 'medium' | 'high' | 'critical'
    description: string
    location?: string
  }>
}

// ============================================================================
// AGENT TYPES
// ============================================================================

export interface AgentTask {
  id: string
  type: 'advising' | 'compliance' | 'research' | 'report' | 'analysis'
  status: 'pending' | 'running' | 'completed' | 'failed'
  input: Record<string, unknown>
  output?: unknown
  steps: AgentStep[]
  startedAt?: Date
  completedAt?: Date
  error?: string
}

export interface AgentStep {
  id: string
  action: string
  input: Record<string, unknown>
  output?: unknown
  toolCalls: ToolCall[]
  thinking?: string
  timestamp: Date
  durationMs: number
}

export interface ToolCall {
  id: string
  name: string
  input: Record<string, unknown>
  output?: unknown
  success: boolean
  error?: string
  latency: number
}

export interface AgentTool {
  name: string
  description: string
  parameters: z.ZodSchema
  execute: (input: unknown) => Promise<unknown>
}

// ============================================================================
// ADVISING AGENT TYPES
// ============================================================================

export interface CourseRecommendation {
  courseId: string
  courseCode: string
  courseName: string
  credits: number
  reason: string
  priority: 'required' | 'recommended' | 'elective'
  conflicts: ScheduleConflict[]
  prerequisites: {
    met: boolean
    missing: string[]
  }
  confidence: number
}

export interface ScheduleConflict {
  type: 'athletic_event' | 'travel' | 'time_overlap' | 'workload'
  severity: 'blocking' | 'warning' | 'info'
  description: string
  affectedCourse?: string
  affectedEvent?: string
  suggestion?: string
}

export interface AdvisingRecommendation {
  studentId: string
  term: string
  recommendations: CourseRecommendation[]
  totalCredits: number
  workloadAssessment: {
    athleticHours: number
    academicHours: number
    totalHours: number
    recommendation: 'light' | 'moderate' | 'heavy' | 'overload'
  }
  reasoning: string
  alternatives: CourseRecommendation[][]
}

// ============================================================================
// COMPLIANCE AGENT TYPES
// ============================================================================

export interface ComplianceQuery {
  question: string
  context?: {
    studentId?: string
    scenario?: string
    ruleSection?: string
  }
}

export interface ComplianceAnalysis {
  query: string
  interpretation: string
  applicableRules: Array<{
    ruleId: string
    section: string
    text: string
    relevance: number
  }>
  recommendations: string[]
  warnings: string[]
  references: Array<{
    source: string
    section: string
    url?: string
  }>
  confidence: number
}

// ============================================================================
// PREDICTIVE ANALYTICS TYPES
// ============================================================================

export interface RiskPrediction {
  studentId: string
  overallRisk: 'low' | 'medium' | 'high' | 'critical'
  riskScore: number
  factors: Array<{
    category: 'academic' | 'attendance' | 'compliance' | 'behavioral' | 'athletic'
    factor: string
    impact: number
    trend: 'improving' | 'stable' | 'declining'
  }>
  predictions: {
    graduationLikelihood: number
    eligibilityRisk: number
    academicSuccessProbability: number
  }
  recommendations: Array<{
    priority: 'high' | 'medium' | 'low'
    action: string
    expectedImpact: string
  }>
  generatedAt: Date
}

// ============================================================================
// EMBEDDING TYPES
// ============================================================================

export interface EmbeddingRequest {
  texts: string[]
  model?: 'text-embedding-3-small' | 'text-embedding-3-large'
  dimensions?: number
}

export interface EmbeddingResponse {
  embeddings: number[][]
  model: string
  dimensions: number
  tokens: number
}

export interface SemanticSearchRequest {
  query: string
  filters?: {
    contentType?: string[]
    source?: string[]
    dateRange?: {
      start: Date
      end: Date
    }
  }
  limit?: number
  minScore?: number
}

export interface SemanticSearchResult {
  results: RetrievedDocument[]
  totalFound: number
  queryEmbedding?: number[]
  searchTime: number
}

// ============================================================================
// FEEDBACK TYPES
// ============================================================================

export interface AIFeedbackRequest {
  messageId: string
  conversationId: string
  rating: 1 | 2 | 3 | 4 | 5
  feedbackType: 'helpful' | 'unhelpful' | 'incorrect' | 'inappropriate' | 'other'
  comment?: string
  expectedResponse?: string
}

// ============================================================================
// TOKEN AND COST TRACKING
// ============================================================================

export interface TokenUsage {
  promptTokens: number
  completionTokens: number
  totalTokens: number
  estimatedCost: number
  model: string
}

export interface AIMetrics {
  requestId: string
  userId: string
  endpoint: string
  model: string
  provider: LLMProvider
  tokenUsage: TokenUsage
  latency: number
  cacheHit: boolean
  timestamp: Date
  success: boolean
  error?: string
}

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

export const ChatMessageSchema = z.object({
  message: z.string().min(1).max(10000),
  conversationId: z.string().optional(),
  userId: z.string(),
  model: z.enum(['gpt-4', 'gpt-4o-mini', 'claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'gpt-5.1-codex-max']).optional(),
  stream: z.boolean().optional().default(true),
  context: z.record(z.unknown()).optional(),
})

export const AdvisingRequestSchema = z.object({
  studentId: z.string(),
  term: z.string(),
  preferredCourses: z.array(z.string()).optional(),
  constraints: z.object({
    maxCredits: z.number().optional(),
    preferredDays: z.array(z.string()).optional(),
    avoidMornings: z.boolean().optional(),
  }).optional(),
})

export const ComplianceQuerySchema = z.object({
  question: z.string().min(10).max(2000),
  studentId: z.string().optional(),
  scenario: z.string().optional(),
  ruleSection: z.string().optional(),
})

export const RiskAssessmentSchema = z.object({
  studentId: z.string(),
  includeRecommendations: z.boolean().optional().default(true),
  timeframe: z.enum(['current', 'semester', 'year']).optional().default('current'),
})

export const SemanticSearchSchema = z.object({
  query: z.string().min(3).max(1000),
  filters: z.object({
    contentType: z.array(z.string()).optional(),
    source: z.array(z.string()).optional(),
    dateRange: z.object({
      start: z.coerce.date(),
      end: z.coerce.date(),
    }).optional(),
  }).optional(),
  limit: z.number().min(1).max(50).optional().default(10),
  minScore: z.number().min(0).max(1).optional().default(0.7),
})

export const EmbeddingGenerationSchema = z.object({
  texts: z.array(z.string()).min(1).max(100),
  model: z.enum(['text-embedding-3-small', 'text-embedding-3-large']).optional().default('text-embedding-3-large'),
  dimensions: z.number().optional(),
})

export const FeedbackSchema = z.object({
  messageId: z.string(),
  conversationId: z.string(),
  rating: z.number().min(1).max(5),
  feedbackType: z.enum(['helpful', 'unhelpful', 'incorrect', 'inappropriate', 'other']),
  comment: z.string().optional(),
  expectedResponse: z.string().optional(),
})

export const AgentTaskSchema = z.object({
  type: z.enum(['advising', 'compliance', 'research', 'report', 'analysis']),
  input: z.record(z.unknown()),
  userId: z.string(),
  priority: z.enum(['low', 'normal', 'high']).optional().default('normal'),
})
