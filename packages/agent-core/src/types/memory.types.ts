/**
 * Tiered Memory & Semantic Vector Types
 */

export type MemoryType = "working" | "session" | "long_term";

export interface AgentMemoryRecord {
  id: string;
  userId: string;
  studentAthleteId?: string;
  memoryType: MemoryType;
  content: string;
  embedding?: number[]; // 1536-dimensional vector
  metadata?: Record<string, unknown>;
  importance: number; // 0.0 to 1.0 scale
  confidence: number; // 0.0 to 1.0 scale
  createdAt: string;
  expiresAt?: string;
}

export interface MemoryQuery {
  userId: string;
  studentAthleteId?: string;
  queryText?: string;
  queryEmbedding?: number[];
  memoryType?: MemoryType;
  topK?: number;
  minRelevanceScore?: number;
}

export interface WorkingMemoryContext {
  activeTaskId?: string;
  activeStudentId?: string;
  scratchpad: Record<string, unknown>;
  executedToolSteps: Array<{
    toolName: string;
    input: unknown;
    output: unknown;
    timestamp: string;
  }>;
}
