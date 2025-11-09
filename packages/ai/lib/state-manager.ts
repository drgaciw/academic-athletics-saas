/**
 * State Manager
 * 
 * Manages agent workflow state persistence and recovery
 * Enables resumption of interrupted workflows
 */

import type {
  AgentState,
  AgentStatus,
  AgentStep,
  ToolResult,
} from '../types/agent.types'
import type { CoreMessage } from 'ai'

/**
 * State storage interface (can be implemented with different backends)
 */
export interface StateStorage {
  save(state: AgentState): Promise<void>
  load(stateId: string): Promise<AgentState | null>
  delete(stateId: string): Promise<void>
  list(userId: string): Promise<AgentState[]>
}

/**
 * In-memory state storage (for development/testing)
 */
export class InMemoryStateStorage implements StateStorage {
  private states: Map<string, AgentState> = new Map()

  async save(state: AgentState): Promise<void> {
    this.states.set(state.id, { ...state, updatedAt: new Date() })
  }

  async load(stateId: string): Promise<AgentState | null> {
    return this.states.get(stateId) || null
  }

  async delete(stateId: string): Promise<void> {
    this.states.delete(stateId)
  }

  async list(userId: string): Promise<AgentState[]> {
    return Array.from(this.states.values()).filter((s) => s.userId === userId)
  }
}

/**
 * Database state storage (for production)
 */
export class DatabaseStateStorage implements StateStorage {
  async save(state: AgentState): Promise<void> {
    // In production, this would use Prisma to save to AgentTask model
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()

    try {
      await prisma.agentTask.upsert({
        where: { id: state.id },
        create: {
          id: state.id,
          agentType: state.agentType,
          status: state.status,
          priority: 3,
          inputParams: JSON.parse(JSON.stringify({
            userId: state.userId,
            messages: state.messages,
            metadata: state.metadata,
          })),
          outputResult: state.status === 'completed' ? JSON.parse(JSON.stringify({
            toolResults: state.toolResults,
            stepHistory: state.stepHistory,
          })) : null,
          startedAt: state.createdAt,
          completedAt: state.completedAt,
        },
        update: {
          status: state.status,
          outputResult: state.status === 'completed' ? JSON.parse(JSON.stringify({
            toolResults: state.toolResults,
            stepHistory: state.stepHistory,
          })) : null,
          completedAt: state.completedAt,
        },
      })
    } finally {
      await prisma.$disconnect()
    }
  }

  async load(stateId: string): Promise<AgentState | null> {
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()

    try {
      const task = await prisma.agentTask.findUnique({
        where: { id: stateId },
      })

      if (!task) return null

      const inputParams = task.inputParams as any
      const outputResult = task.outputResult as any

      return {
        id: task.id,
        userId: inputParams.userId,
        agentType: task.agentType as any,
        status: task.status as AgentStatus,
        currentStep: outputResult?.stepHistory?.length || 0,
        maxSteps: 10,
        messages: inputParams.messages || [],
        toolResults: outputResult?.toolResults || [],
        stepHistory: outputResult?.stepHistory || [],
        metadata: inputParams.metadata || {},
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
        completedAt: task.completedAt || undefined,
      }
    } finally {
      await prisma.$disconnect()
    }
  }

  async delete(stateId: string): Promise<void> {
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()

    try {
      await prisma.agentTask.delete({
        where: { id: stateId },
      })
    } finally {
      await prisma.$disconnect()
    }
  }

  async list(userId: string): Promise<AgentState[]> {
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()

    try {
      const tasks = await prisma.agentTask.findMany({
        where: {
          inputParams: {
            path: ['userId'],
            equals: userId,
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      })

      return tasks.map((task) => {
        const inputParams = task.inputParams as any
        const outputResult = task.outputResult as any

        return {
          id: task.id,
          userId: inputParams.userId,
          agentType: task.agentType as any,
          status: task.status as AgentStatus,
          currentStep: outputResult?.stepHistory?.length || 0,
          maxSteps: 10,
          messages: inputParams.messages || [],
          toolResults: outputResult?.toolResults || [],
          stepHistory: outputResult?.stepHistory || [],
          metadata: inputParams.metadata || {},
          createdAt: task.createdAt,
          updatedAt: task.updatedAt,
          completedAt: task.completedAt || undefined,
        }
      })
    } finally {
      await prisma.$disconnect()
    }
  }
}

/**
 * State Manager Class
 */
export class StateManager {
  private storage: StateStorage

  constructor(storage?: StateStorage) {
    // Use database storage in production, in-memory for development
    this.storage = storage || (
      process.env.NODE_ENV === 'production'
        ? new DatabaseStateStorage()
        : new InMemoryStateStorage()
    )
  }

  /**
   * Initialize new agent state
   */
  async initialize(params: {
    userId: string
    agentType: string
    messages: CoreMessage[]
    maxSteps?: number
    metadata?: Record<string, any>
  }): Promise<AgentState> {
    const state: AgentState = {
      id: `state-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      userId: params.userId,
      agentType: params.agentType as any,
      status: 'pending',
      currentStep: 0,
      maxSteps: params.maxSteps || 10,
      messages: params.messages,
      toolResults: [],
      stepHistory: [],
      metadata: params.metadata || {},
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    await this.storage.save(state)
    return state
  }

  /**
   * Save state
   */
  async saveState(state: AgentState): Promise<void> {
    await this.storage.save({
      ...state,
      updatedAt: new Date(),
    })
  }

  /**
   * Load state
   */
  async loadState(stateId: string): Promise<AgentState | null> {
    return await this.storage.load(stateId)
  }

  /**
   * Update state status
   */
  async updateStatus(stateId: string, status: AgentStatus): Promise<void> {
    const state = await this.loadState(stateId)
    if (!state) throw new Error(`State ${stateId} not found`)

    state.status = status
    state.updatedAt = new Date()

    if (status === 'completed' || status === 'failed' || status === 'cancelled') {
      state.completedAt = new Date()
    }

    await this.saveState(state)
  }

  /**
   * Add step to state
   */
  async addStep(stateId: string, step: AgentStep): Promise<void> {
    const state = await this.loadState(stateId)
    if (!state) throw new Error(`State ${stateId} not found`)

    state.stepHistory.push(step)
    state.currentStep = step.stepNumber
    state.updatedAt = new Date()

    await this.saveState(state)
  }

  /**
   * Add tool result to state
   */
  async addToolResult(stateId: string, result: ToolResult): Promise<void> {
    const state = await this.loadState(stateId)
    if (!state) throw new Error(`State ${stateId} not found`)

    state.toolResults.push(result)
    state.updatedAt = new Date()

    await this.saveState(state)
  }

  /**
   * Resume workflow from saved state
   */
  async resumeWorkflow(stateId: string): Promise<AgentState> {
    const state = await this.loadState(stateId)
    if (!state) throw new Error(`State ${stateId} not found`)

    if (state.status === 'completed') {
      throw new Error('Cannot resume completed workflow')
    }

    // Update status to running
    state.status = 'running'
    state.updatedAt = new Date()
    await this.saveState(state)

    return state
  }

  /**
   * Pause workflow
   */
  async pauseWorkflow(stateId: string): Promise<void> {
    await this.updateStatus(stateId, 'paused')
  }

  /**
   * Cancel workflow
   */
  async cancelWorkflow(stateId: string): Promise<void> {
    await this.updateStatus(stateId, 'cancelled')
  }

  /**
   * Delete state
   */
  async deleteState(stateId: string): Promise<void> {
    await this.storage.delete(stateId)
  }

  /**
   * List user states
   */
  async listUserStates(userId: string): Promise<AgentState[]> {
    return await this.storage.list(userId)
  }

  /**
   * Clean up old states
   */
  async cleanupOldStates(maxAgeMs: number = 7 * 24 * 60 * 60 * 1000): Promise<number> {
    // Clean up states older than maxAge (default 7 days)
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()

    try {
      const cutoffDate = new Date(Date.now() - maxAgeMs)

      const result = await prisma.agentTask.deleteMany({
        where: {
          status: {
            in: ['completed', 'failed', 'cancelled'],
          },
          completedAt: {
            lt: cutoffDate,
          },
        },
      })

      return result.count
    } finally {
      await prisma.$disconnect()
    }
  }
}

/**
 * Global state manager instance
 */
export const globalStateManager = new StateManager()

/**
 * Convenience functions
 */
export async function saveState(state: AgentState): Promise<void> {
  return globalStateManager.saveState(state)
}

export async function loadState(stateId: string): Promise<AgentState | null> {
  return globalStateManager.loadState(stateId)
}

export async function resumeWorkflow(stateId: string): Promise<AgentState> {
  return globalStateManager.resumeWorkflow(stateId)
}
