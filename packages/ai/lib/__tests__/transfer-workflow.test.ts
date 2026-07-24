jest.mock('../../agents', () => ({
  createAgent: jest.fn(),
  createGeneralAssistant: jest.fn(),
}))

import { AgentOrchestrator } from '../agent-orchestrator'
import {
  TRANSFER_CREDIT_AGENT_SEQUENCE,
  buildTransferWorkflowContext,
  isTransferCreditWorkflow,
} from '../transfer-workflow'
import type { AgentRequest, AgentResponse } from '../../types/agent.types'

describe('transfer workflow orchestration', () => {
  it('defines the NCAA transfer credit pipeline order', () => {
    expect(TRANSFER_CREDIT_AGENT_SEQUENCE).toEqual([
      'data-aggregation',
      'equivalency',
      'transfer-compliance',
      'revision',
    ])
  })

  const baseResponse = (
    overrides: Partial<AgentResponse> & Pick<AgentResponse, 'agentType' | 'status' | 'content'>
  ): AgentResponse => ({
    requestId: 'req-1',
    steps: [],
    toolInvocations: [],
    usage: { promptTokens: 1, completionTokens: 1, totalTokens: 2 },
    cost: 0.01,
    duration: 10,
    ...overrides,
  })

  it('allows the full transfer-credit agent sequence by default', async () => {
    const orchestrator = new AgentOrchestrator()
    jest
      .spyOn(orchestrator, 'executeSingleAgent')
      .mockImplementation(async (agentType) =>
        baseResponse({
          agentType,
          status: 'completed',
          content: `${agentType} ok`,
        })
      )

    const request: AgentRequest = {
      message: 'Evaluate transfer credits',
      userId: 'user-1',
      agentType: 'orchestrator',
      context: { workflow: 'transfer-credit' },
    }

    await expect(orchestrator.executeTransferCreditWorkflow(request)).resolves.toMatchObject({
      success: true,
      agentsUsed: TRANSFER_CREDIT_AGENT_SEQUENCE,
    })
  })

  it('does not report success when a transfer agent fails', async () => {
    const orchestrator = new AgentOrchestrator()
    jest
      .spyOn(orchestrator, 'executeSingleAgent')
      .mockResolvedValueOnce(
        baseResponse({
          agentType: 'data-aggregation',
          status: 'failed',
          content: 'aggregation failed',
        })
      )

    const request: AgentRequest = {
      message: 'Evaluate transfer credits',
      userId: 'user-1',
      agentType: 'orchestrator',
      context: { workflow: 'transfer-credit' },
    }

    const result = await orchestrator.executeTransferCreditWorkflow(request)

    expect(result.success).toBe(false)
    expect(result.workflowState?.status).toBe('failed')
    expect(result.response.status).toBe('failed')
  })

  it('detects transfer workflow intent from message keywords', () => {
    expect(
      isTransferCreditWorkflow('Please evaluate transfer credits for this transcript')
    ).toBe(true)
    expect(isTransferCreditWorkflow('What courses should I take next semester?')).toBe(false)
  })

  it('detects transfer workflow from explicit context flag', () => {
    expect(
      isTransferCreditWorkflow('Evaluate', { workflow: 'transfer-credit' })
    ).toBe(true)
  })

  it('builds shared pipeline context for orchestrator handoff', () => {
    const context = buildTransferWorkflowContext(
      { studentId: 'stu-1' },
      'Normalize transcript'
    )

    expect(context.workflow).toBe('transfer-credit')
    expect(context.studentId).toBe('stu-1')
    expect(context.pipeline).toEqual(TRANSFER_CREDIT_AGENT_SEQUENCE)
    expect(context.originalMessage).toBe('Normalize transcript')
  })
})
