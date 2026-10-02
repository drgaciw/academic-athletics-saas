/**
 * Tiered Memory Store Interface
 */

import {
  AgentMemoryRecord,
  MemoryQuery,
  WorkingMemoryContext,
} from "../types/memory.types.js";

export interface IMemoryStore {
  // 1. Working Memory (Active task scratchpad)
  saveWorkingState(
    taskId: string,
    context: WorkingMemoryContext,
  ): Promise<void>;
  getWorkingState(taskId: string): Promise<WorkingMemoryContext | null>;
  clearWorkingState(taskId: string): Promise<void>;

  // 2. Session Memory (Thread conversations)
  saveSessionMessage(
    sessionId: string,
    message: { role: string; content: string },
  ): Promise<void>;
  getSessionHistory(
    sessionId: string,
  ): Promise<Array<{ role: string; content: string; timestamp: string }>>;
  clearSession(sessionId: string): Promise<void>;

  // 3. Long-Term Semantic Vector Memory
  saveLongTermMemory(
    record: Omit<AgentMemoryRecord, "id" | "createdAt">,
  ): Promise<AgentMemoryRecord>;
  queryLongTermMemory(query: MemoryQuery): Promise<AgentMemoryRecord[]>;
  deleteLongTermMemory(id: string): Promise<boolean>;
}
