import {
  TRANSFER_CREDIT_AGENT_SEQUENCE,
  buildTransferWorkflowContext,
  isTransferCreditWorkflow,
} from '../transfer-workflow'

describe('transfer workflow orchestration', () => {
  it('defines the NCAA transfer credit pipeline order', () => {
    expect(TRANSFER_CREDIT_AGENT_SEQUENCE).toEqual([
      'data-aggregation',
      'equivalency',
      'transfer-compliance',
      'revision',
    ])
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
