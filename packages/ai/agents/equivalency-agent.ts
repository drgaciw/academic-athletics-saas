/**
 * Equivalency Agent
 *
 * Maps transfer courses to host catalog
 */

import { BaseAgent } from '../lib/base-agent'
import { globalToolRegistry } from '../lib/tool-registry'
import { EQUIVALENCY_AGENT_PROMPT } from '../lib/prompt-templates'
import type { AgentConfig, AgentRequest, ToolExecutionContext } from '../types/agent.types'
import type { CoreTool } from 'ai'

const EQUIVALENCY_AGENT_CONFIG: AgentConfig = {
  type: 'equivalency' as any,
  name: 'Equivalency Agent',
  description: 'Maps transfer courses to host institution catalog',
  systemPrompt: EQUIVALENCY_AGENT_PROMPT,
  tools: [],
  model: {
    provider: 'openai',
    name: 'gpt-4o',
    temperature: 0,
  },
  maxSteps: 5,
  streaming: true,
  memoryEnabled: true,
}

export class EquivalencyAgent extends BaseAgent {
  constructor() {
    super(EQUIVALENCY_AGENT_CONFIG)
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

export function createEquivalencyAgent(): EquivalencyAgent {
  return new EquivalencyAgent()
}
