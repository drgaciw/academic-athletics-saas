/**
 * In-Memory Tiered Memory Store Implementation
 * Includes Cosine Similarity search for vector embeddings.
 */

import { IMemoryStore } from "./memory-store.interface.js";
import {
  AgentMemoryRecord,
  MemoryQuery,
  WorkingMemoryContext,
} from "../types/memory.types.js";

export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) return 0.0;
  let dotProduct = 0.0;
  let normA = 0.0;
  let normB = 0.0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) return 0.0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export class InMemoryStore implements IMemoryStore {
  private workingStore: Map<string, WorkingMemoryContext> = new Map();
  private sessionStore: Map<
    string,
    Array<{ role: string; content: string; timestamp: string }>
  > = new Map();
  private longTermStore: Map<string, AgentMemoryRecord> = new Map();

  // Working Memory
  public async saveWorkingState(
    taskId: string,
    context: WorkingMemoryContext,
  ): Promise<void> {
    this.workingStore.set(taskId, context);
  }

  public async getWorkingState(
    taskId: string,
  ): Promise<WorkingMemoryContext | null> {
    return this.workingStore.get(taskId) || null;
  }

  public async clearWorkingState(taskId: string): Promise<void> {
    this.workingStore.delete(taskId);
  }

  // Session Memory
  public async saveSessionMessage(
    sessionId: string,
    message: { role: string; content: string },
  ): Promise<void> {
    const list = this.sessionStore.get(sessionId) || [];
    list.push({
      role: message.role,
      content: message.content,
      timestamp: new Date().toISOString(),
    });
    this.sessionStore.set(sessionId, list);
  }

  public async getSessionHistory(
    sessionId: string,
  ): Promise<Array<{ role: string; content: string; timestamp: string }>> {
    return [...(this.sessionStore.get(sessionId) || [])];
  }

  public async clearSession(sessionId: string): Promise<void> {
    this.sessionStore.delete(sessionId);
  }

  // Long-Term Semantic Memory
  public async saveLongTermMemory(
    record: Omit<AgentMemoryRecord, "id" | "createdAt">,
  ): Promise<AgentMemoryRecord> {
    const id = `MEM-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const entry: AgentMemoryRecord = {
      ...record,
      id,
      createdAt: new Date().toISOString(),
    };
    this.longTermStore.set(id, entry);
    return entry;
  }

  public async queryLongTermMemory(
    query: MemoryQuery,
  ): Promise<AgentMemoryRecord[]> {
    let records = Array.from(this.longTermStore.values()).filter(
      (r) => r.userId === query.userId,
    );

    if (query.studentAthleteId) {
      records = records.filter(
        (r) =>
          !r.studentAthleteId || r.studentAthleteId === query.studentAthleteId,
      );
    }

    if (query.memoryType) {
      records = records.filter((r) => r.memoryType === query.memoryType);
    }

    // If query has vector embedding, rank by cosine similarity
    if (query.queryEmbedding && query.queryEmbedding.length > 0) {
      const minScore = query.minRelevanceScore || 0.0;
      const scored = records
        .map((r) => {
          const sim = r.embedding
            ? cosineSimilarity(query.queryEmbedding!, r.embedding)
            : 0.0;
          return { record: r, score: sim };
        })
        .filter((item) => item.score >= minScore)
        .sort((a, b) => b.score - a.score);

      const topK = query.topK || 5;
      return scored.slice(0, topK).map((item) => item.record);
    }

    // Fallback text match if queryText provided
    if (query.queryText) {
      const qLower = query.queryText.toLowerCase();
      records = records.filter((r) => r.content.toLowerCase().includes(qLower));
    }

    const topK = query.topK || 5;
    return records.slice(0, topK);
  }

  public async deleteLongTermMemory(id: string): Promise<boolean> {
    return this.longTermStore.delete(id);
  }
}
