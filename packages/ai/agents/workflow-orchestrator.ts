/**
 * Workflow Orchestrator Agent
 *
 * Coordinates the multi-agent transfer workflow
 */

import { BaseAgent } from '../lib/base-agent'
import { globalToolRegistry } from '../lib/tool-registry'
import { WORKFLOW_ORCHESTRATOR_PROMPT } from '../lib/prompt-templates'
import type { AgentConfig, AgentRequest, ToolExecutionContext } from '../types/agent.types'
import type { CoreTool } from 'ai'

const WORKFLOW_ORCHESTRATOR_CONFIG: AgentConfig = {
  type: 'orchestrator' as any,
  name: 'Workflow Orchestrator',
  description: 'Coordinates the NCAA transfer credit workflow',
  systemPrompt: WORKFLOW_ORCHESTRATOR_PROMPT,
  tools: [], // Should have tools to call other agents if implemented via tools, or logic in execute
  model: {
    provider: 'openai',
    name: 'gpt-4o',
    temperature: 0,
  },
  maxSteps: 20,
  streaming: true,
  memoryEnabled: true,
}

export class WorkflowOrchestrator extends BaseAgent {
  constructor() {
    super(WORKFLOW_ORCHESTRATOR_CONFIG)
  }

  protected getSystemPrompt(): string {
    return this.config.systemPrompt
  }

  protected getTools(): Record<string, CoreTool> {
     const context: ToolExecutionContext = {
      userId: '',
      userRoles: [],
      agentState: {} as any,
    }
    return globalToolRegistry.toAISDKTools(this.config.tools, context)
  }
}

export function createWorkflowOrchestrator(): WorkflowOrchestrator {
  return new WorkflowOrchestrator()
}
