/**
 * Transfer Compliance Agent
 *
 * Specialized compliance agent for transfer workflows
 */

import { BaseAgent } from '../lib/base-agent'
import { globalToolRegistry } from '../lib/tool-registry'
import { TRANSFER_COMPLIANCE_AGENT_PROMPT } from '../lib/prompt-templates'
import type { AgentConfig, AgentRequest, ToolExecutionContext } from '../types/agent.types'
import type { CoreTool } from 'ai'

const TRANSFER_COMPLIANCE_AGENT_CONFIG: AgentConfig = {
  type: 'transfer-compliance' as any,
  name: 'Transfer Compliance Agent',
  description: 'Validates transfer eligibility against NCAA rules',
  systemPrompt: TRANSFER_COMPLIANCE_AGENT_PROMPT,
  tools: [],
  model: {
    provider: 'openai',
    name: 'gpt-4o',
    temperature: 0,
  },
  maxSteps: 10,
  streaming: true,
  memoryEnabled: true,
}

export class TransferComplianceAgent extends BaseAgent {
  constructor() {
    super(TRANSFER_COMPLIANCE_AGENT_CONFIG)
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

export function createTransferComplianceAgent(): TransferComplianceAgent {
  return new TransferComplianceAgent()
}
