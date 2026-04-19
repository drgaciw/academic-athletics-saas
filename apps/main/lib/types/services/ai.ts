/**
 * AI Service Types
 */

export interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
}

export interface ChatRequest {
  conversationId?: string;
  message: string;
  context?: ChatContext;
  stream?: boolean;
  model?: 'gpt-4' | 'gpt-4-mini' | 'claude-3-5-sonnet' | 'gpt-5.1-codex-max';
}

export interface ChatContext {
  studentId?: string;
  pageContext?: string;
  relatedDocuments?: string[];
  previousQuery?: string;
}

export interface ChatResponse {
  conversationId: string;
  messageId: string;
  content: string;
  sources?: Source[];
  suggestedFollowUps?: string[];
  tokenCount?: number;
  model: string;
}

export interface Source {
  id: string;
  title: string;
  content: string;
  relevanceScore: number;
  metadata?: Record<string, any>;
}

export interface ConversationHistory {
  id: string;
  userId: string;
  title?: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
  status: 'active' | 'archived';
}

export interface AdvisingRecommendationRequest {
  studentId: string;
  termId: string;
  major?: string;
  academicHistory?: AcademicHistory;
  preferences?: string[];
}

export interface AcademicHistory {
  completedCourses: string[];
  currentCourses: string[];
  gpa: number;
  creditHours: number;
}

export interface AIAdvisingResponse {
  recommendations: AIRecommendation[];
  reasoning: string;
  confidence: number;
  alternatives?: AIRecommendation[];
}

export interface AIRecommendation {
  courseId: string;
  courseName: string;
  priority: number;
  reasoning: string;
  expectedDifficulty?: 'LOW' | 'MEDIUM' | 'HIGH';
  timeCommitment?: number;
}

export interface ComplianceAnalysisRequest {
  query: string;
  studentId?: string;
  contextType?: 'INITIAL' | 'CONTINUING' | 'GENERAL';
}

export interface ComplianceAnalysisResponse {
  answer: string;
  relevantRules: RelevantRule[];
  confidence: number;
  sources: Source[];
  requiresHumanReview: boolean;
}

export interface RelevantRule {
  ruleId: string;
  ruleName: string;
  ruleText: string;
  relevanceScore: number;
}

export interface ReportGenerationRequest {
  reportType: 'STUDENT_SUMMARY' | 'TEAM_ANALYTICS' | 'COMPLIANCE_AUDIT' | 'PROGRESS_REPORT';
  parameters: Record<string, any>;
  format?: 'MARKDOWN' | 'HTML' | 'PDF';
}

export interface GeneratedReport {
  id: string;
  reportType: string;
  content: string;
  format: string;
  generatedAt: string;
  documentUrl?: string;
}

export interface RiskPredictionRequest {
  studentId: string;
  timeframe?: 'CURRENT_TERM' | 'NEXT_TERM' | 'ACADEMIC_YEAR';
  includeFactors?: boolean;
}

export interface RiskPredictionResponse {
  studentId: string;
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  riskScore: number;
  predictions: Prediction[];
  recommendations: string[];
  confidence: number;
  modelVersion: string;
}

export interface Prediction {
  metric: string;
  predictedValue: number;
  currentValue: number;
  trend: 'IMPROVING' | 'DECLINING' | 'STABLE';
  confidence: number;
}

export interface AgenticTaskRequest {
  taskType: 'SCHEDULE_OPTIMIZATION' | 'COMPLIANCE_CHECK' | 'RESEARCH' | 'DATA_ANALYSIS';
  parameters: Record<string, any>;
  priority?: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface AgenticTaskResponse {
  taskId: string;
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  estimatedCompletion?: string;
}

export interface AgenticTaskStatus {
  taskId: string;
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  progress: number;
  steps: TaskStep[];
  result?: any;
  error?: string;
}

export interface TaskStep {
  step: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  startedAt?: string;
  completedAt?: string;
  details?: string;
}

export interface KnowledgeSearchRequest {
  query: string;
  filters?: {
    category?: string[];
    dateRange?: {
      start: string;
      end: string;
    };
  };
  limit?: number;
}

export interface KnowledgeSearchResponse {
  results: SearchResult[];
  totalCount: number;
  query: string;
}

export interface SearchResult {
  id: string;
  title: string;
  content: string;
  category: string;
  relevanceScore: number;
  metadata: Record<string, any>;
  highlights?: string[];
}

export interface FeedbackRequest {
  messageId: string;
  conversationId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  feedback?: string;
  helpful: boolean;
}

export interface EmbeddingRequest {
  texts: string[];
  model?: 'text-embedding-3-large' | 'text-embedding-3-small';
}

export interface EmbeddingResponse {
  embeddings: number[][];
  model: string;
  tokenCount: number;
}
