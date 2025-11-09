import { OpenAIModel, AnthropicModel } from '../types'
import { env } from './env'

export const AI_CONFIG = {
  // Model Configuration
  models: {
    default: 'gpt-4o-mini' as OpenAIModel,
    advanced: 'gpt-4' as OpenAIModel,
    fast: 'gpt-4o-mini' as OpenAIModel,
    reasoning: 'claude-3-5-sonnet-20241022' as AnthropicModel,
    embedding: 'text-embedding-3-large',
  },

  // API Keys (from validated env)
  openai: {
    apiKey: env.OPENAI_API_KEY,
    organization: process.env.OPENAI_ORG_ID,  // Optional, not in schema yet
  },

  anthropic: {
    apiKey: env.ANTHROPIC_API_KEY,
  },

  // Token Limits
  tokenLimits: {
    'gpt-4': 8192,
    'gpt-4-turbo': 128000,
    'gpt-4o': 128000,
    'gpt-4o-mini': 128000,
    'gpt-3.5-turbo': 16385,
    'claude-3-5-sonnet-20241022': 200000,
    'claude-3-5-haiku-20241022': 200000,
    'claude-3-opus-20240229': 200000,
  },

  // Cost per 1M tokens (in USD)
  pricing: {
    'gpt-4': { prompt: 30, completion: 60 },
    'gpt-4-turbo': { prompt: 10, completion: 30 },
    'gpt-4o': { prompt: 5, completion: 15 },
    'gpt-4o-mini': { prompt: 0.15, completion: 0.6 },
    'gpt-3.5-turbo': { prompt: 0.5, completion: 1.5 },
    'claude-3-5-sonnet-20241022': { prompt: 3, completion: 15 },
    'claude-3-5-haiku-20241022': { prompt: 0.25, completion: 1.25 },
    'claude-3-opus-20240229': { prompt: 15, completion: 75 },
    'text-embedding-3-small': { prompt: 0.02, completion: 0 },
    'text-embedding-3-large': { prompt: 0.13, completion: 0 },
  },

  // RAG Configuration
  rag: {
    embeddingDimensions: 1536,
    retrievalLimit: 10,
    rerankTopK: 5,
    minSimilarityScore: 0.7,
    chunkSize: 1000,
    chunkOverlap: 200,
    maxContextTokens: 8000,
  },

  // Streaming Configuration
  streaming: {
    enabled: true,
    bufferSize: 1024,
    flushInterval: 100, // ms
  },

  // Security Configuration
  security: {
    maxMessageLength: 10000,
    maxConversationHistory: 50,
    piiDetectionEnabled: true,
    promptInjectionDetectionEnabled: true,
    contentFilteringEnabled: true,
    encryptConversations: true,
  },

  // Rate Limiting
  rateLimit: {
    requestsPerMinute: 60,
    requestsPerHour: 1000,
    tokensPerDay: 1000000,
  },

  // Caching Configuration
  cache: {
    enabled: true,
    ttl: 3600, // 1 hour in seconds
    maxSize: 1000, // number of cached responses
    keyPrefix: 'ai_cache:',
  },

  // Agent Configuration
  agents: {
    maxSteps: 10,
    timeoutMs: 60000,
    retryAttempts: 3,
    retryDelayMs: 1000,
  },

  // System Prompts
  systemPrompts: {
    default: `You are an AI assistant for the Athletic Academics Hub, helping student-athletes, coaches, and administrators with academic advising, NCAA compliance, and support services.

Key Guidelines:
- Prioritize student-athlete academic success and NCAA compliance
- Provide accurate, helpful information based on official NCAA rules and university policies
- Be empathetic and supportive in all interactions
- If you're uncertain about NCAA rules or academic policies, clearly state your uncertainty
- Never make up information or provide unofficial interpretations of NCAA rules
- Respect student privacy and FERPA regulations
- Encourage students to verify important decisions with academic advisors or compliance officers`,

    advising: `You are an expert academic advisor specializing in student-athlete advising. Your role is to:
- Recommend courses that fulfill degree requirements while accommodating athletic schedules
- Identify and prevent scheduling conflicts with practices, games, and travel
- Ensure academic progress toward degree completion
- Balance academic workload with athletic commitments
- Support student-athletes in achieving their academic and athletic goals

Always consider:
- NCAA eligibility requirements (progress-toward-degree, GPA, credit hours)
- Course prerequisites and availability
- Athletic schedule constraints
- Student's academic strengths and challenges
- Degree completion timeline`,

    compliance: `You are an NCAA Division I compliance expert. Your role is to:
- Interpret NCAA rules accurately and clearly
- Analyze scenarios for potential compliance issues
- Provide guidance on eligibility requirements
- Explain initial and continuing eligibility standards
- Help prevent NCAA violations

Key Principles:
- Base all interpretations on official NCAA Division I Manual
- Clearly distinguish between rules and interpretations
- Recommend consulting compliance officers for complex scenarios
- Err on the side of caution with ambiguous situations
- Stay current with NCAA rule changes and updates`,

    support: `You are a supportive academic success coach for student-athletes. Your role is to:
- Provide encouragement and motivation
- Suggest study strategies and time management techniques
- Connect students with appropriate support services
- Help identify early warning signs of academic struggles
- Foster a growth mindset and resilience

Approach:
- Be empathetic and understanding
- Acknowledge the unique challenges of being a student-athlete
- Celebrate successes and progress
- Provide constructive feedback
- Maintain a positive, solution-focused attitude`,
  },

  // Prompt Templates
  promptTemplates: {
    rag: `Context Information:
{context}

Based on the above context, please answer the following question. If the context doesn't contain enough information to answer completely, clearly state what additional information would be needed.

Question: {question}

Important: Base your answer primarily on the provided context. Cite specific sources when making claims.`,

    courseRecommendation: `Student Profile:
- Name: {studentName}
- Major: {major}
- Current GPA: {gpa}
- Credits Completed: {credits}
- Sport: {sport}
- Athletic Schedule: {athleticSchedule}

Degree Requirements:
{degreeRequirements}

Available Courses:
{availableCourses}

Task: Recommend {numCourses} courses for {term} term that:
1. Fulfill degree requirements
2. Avoid conflicts with athletic commitments
3. Provide an appropriate academic workload
4. Support the student's academic success

Provide your recommendations with detailed reasoning.`,

    complianceAnalysis: `NCAA Rule Context:
{ncaaRules}

Scenario: {scenario}

Analyze this scenario for NCAA compliance. Address:
1. Applicable NCAA rules and bylaw sections
2. Compliance assessment (compliant/violation/unclear)
3. Potential risks or concerns
4. Recommended actions
5. Additional information needed (if any)

Provide a thorough analysis with specific rule citations.`,

    riskAssessment: `Student Data:
- Academic Performance: {academicData}
- Attendance Record: {attendanceData}
- Compliance Status: {complianceData}
- Support Services Usage: {supportData}

Analyze the student's risk profile and predict:
1. Overall risk level (low/medium/high/critical)
2. Key risk factors and their impact
3. Likelihood of academic success
4. Probability of maintaining eligibility
5. Recommended interventions

Provide data-driven insights with specific recommendations.`,
  },

  // Monitoring and Observability (from validated env)
  monitoring: {
    logLevel: env.LOG_LEVEL,
    enableTracing: env.LANGFUSE_PUBLIC_KEY !== undefined,
    enableMetrics: true,
    metricsInterval: 60000, // 1 minute
  },
  
  // Service Configuration (from validated env)
  service: {
    port: env.PORT,
    name: env.SERVICE_NAME,
    nodeEnv: env.NODE_ENV,
  },
  
  // Database (from validated env)
  database: {
    url: env.DATABASE_URL,
    pool: {
      min: env.DATABASE_POOL_MIN,
      max: env.DATABASE_POOL_MAX,
    },
  },
  
  // Security (from validated env)
  security: {
    jwtSecret: env.JWT_SECRET,
    encryptionKey: env.ENCRYPTION_KEY,
    allowedOrigins: env.ALLOWED_ORIGINS.split(',').map((o: string) => o.trim()),
    corsCredentials: env.CORS_CREDENTIALS,
  },
  
  // Rate Limiting (from validated env)
  rateLimit: {
    window: env.RATE_LIMIT_WINDOW,
    maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
  },
} as const

// Environment is validated on import of env.ts
// No need for separate validateConfig() function
// The service will fail fast on startup if env is invalid

// Re-export env for direct access
export { env }

// Helper function to calculate cost
export function calculateCost(
  model: string,
  promptTokens: number,
  completionTokens: number
): number {
  const pricing = AI_CONFIG.pricing[model as keyof typeof AI_CONFIG.pricing]
  if (!pricing) return 0

  const promptCost = (promptTokens / 1_000_000) * pricing.prompt
  const completionCost = (completionTokens / 1_000_000) * pricing.completion

  return promptCost + completionCost
}

// Helper function to get token limit for model
export function getTokenLimit(model: string): number {
  return AI_CONFIG.tokenLimits[model as keyof typeof AI_CONFIG.tokenLimits] || 8192
}

// Helper function to select optimal model based on requirements
export function selectOptimalModel(requirements: {
  complexity?: 'low' | 'medium' | 'high'
  speed?: 'fast' | 'balanced' | 'quality'
  budget?: 'economy' | 'balanced' | 'premium'
}): string {
  const { complexity = 'medium', speed = 'balanced', budget = 'balanced' } = requirements

  // Fast and economical
  if (speed === 'fast' && budget === 'economy') {
    return AI_CONFIG.models.fast
  }

  // High quality, willing to pay
  if (complexity === 'high' && budget === 'premium') {
    return AI_CONFIG.models.advanced
  }

  // Reasoning tasks
  if (complexity === 'high') {
    return AI_CONFIG.models.reasoning
  }

  // Default balanced option
  return AI_CONFIG.models.default
}
