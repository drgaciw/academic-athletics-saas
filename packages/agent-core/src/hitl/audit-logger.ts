/**
 * Standardized AI Audit Trail Logger
 */

import { AIAuditEntry, ActionTier } from "../types/hitl.types.js";

export interface AuditSink {
  persistEntry(entry: AIAuditEntry): Promise<void> | void;
}

export class AIAuditLogger {
  private inMemoryLogs: AIAuditEntry[] = [];
  private sink?: AuditSink;

  constructor(sink?: AuditSink) {
    this.sink = sink;
  }

  public async logEvent(params: {
    actor: { id: string; role: string; isAi: boolean };
    actionType: string;
    tier: ActionTier;
    studentAthleteId?: string;
    bylawCited?: string;
    details: Record<string, unknown>;
    outcome: "SUCCESS" | "PROPOSAL_STAGED" | "DENIED" | "ERROR";
  }): Promise<AIAuditEntry> {
    const entry: AIAuditEntry = {
      id: `AUDIT-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      timestamp: new Date().toISOString(),
      actor: params.actor,
      actionType: params.actionType,
      tier: params.tier,
      studentAthleteId: params.studentAthleteId,
      bylawCited: params.bylawCited,
      details: params.details,
      outcome: params.outcome,
    };

    this.inMemoryLogs.push(entry);

    if (this.sink) {
      await this.sink.persistEntry(entry);
    }

    return entry;
  }

  public getLogs(studentAthleteId?: string): AIAuditEntry[] {
    if (studentAthleteId) {
      return this.inMemoryLogs.filter(
        (l) => l.studentAthleteId === studentAthleteId,
      );
    }
    return [...this.inMemoryLogs];
  }
}
