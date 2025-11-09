export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp?: Date
}

export interface AIResponse {
  content: string
  model: string
  tokenCount: number
  latency: number
  sources?: string[]
}

export interface PredictionResult {
  studentId: string
  riskScore: number
  riskLevel: 'low' | 'medium' | 'high'
  confidence: number
  factors: Array<{
    factor: string
    impact: number
    direction: 'positive' | 'negative'
  }>
  recommendations: string[]
  explainability: string
}
