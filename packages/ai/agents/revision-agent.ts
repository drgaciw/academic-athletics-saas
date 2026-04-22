/**
 * Revision Agent
 *
 * Final quality control and audit
 */

import { BaseAgent } from '../lib/base-agent'
import { globalToolRegistry } from '../lib/tool-registry'
import { REVISION_AGENT_PROMPT } from '../lib/prompt-templates'
import type { AgentConfig, AgentRequest, ToolExecutionContext } from '../types/agent.types'
import type { CoreTool } from 'ai'

const REVISION_AGENT_CONFIG: AgentConfig = {
  type: 'revision' as any,
  name: 'Revision Agent',
  description: 'Audits and verifies transfer evaluations',
  systemPrompt: REVISION_AGENT_PROMPT,
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

export class RevisionAgent extends BaseAgent {
  constructor() {
    super(REVISION_AGENT_CONFIG)
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

export function createRevisionAgent(): RevisionAgent {
  return new RevisionAgent()
}
