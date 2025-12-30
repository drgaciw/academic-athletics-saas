/**
 * Data Aggregation Agent
 *
 * Responsible for normalizing transcript data
 */

import { BaseAgent } from '../lib/base-agent'
import { globalToolRegistry } from '../lib/tool-registry'
import { DATA_AGGREGATION_AGENT_PROMPT } from '../lib/prompt-templates'
import type { AgentConfig, AgentRequest, ToolExecutionContext } from '../types/agent.types'
import type { CoreTool } from 'ai'

const DATA_AGGREGATION_AGENT_CONFIG: AgentConfig = {
  type: 'data-aggregation' as any, // Cast to any until type is updated
  name: 'Data Aggregation Agent',
  description: 'Normalizes transcript data for NCAA compliance',
  systemPrompt: DATA_AGGREGATION_AGENT_PROMPT,
  tools: [], // Add relevant tools or leave empty if using generic/mock
  model: {
    provider: 'openai',
    name: 'gpt-4o',
    temperature: 0,
  },
  maxSteps: 5,
  streaming: true,
  memoryEnabled: false,
}

export class DataAggregationAgent extends BaseAgent {
  constructor() {
    super(DATA_AGGREGATION_AGENT_CONFIG)
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

export function createDataAggregationAgent(): DataAggregationAgent {
  return new DataAggregationAgent()
}
