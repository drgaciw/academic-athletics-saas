/**
 * NCAA transfer credit multi-agent workflow definitions.
 */

import type { AgentType } from '../types/agent.types'

/** Sequential pipeline for transfer credit evaluation (see docs/plans/transfer-credit-system/). */
export const TRANSFER_CREDIT_AGENT_SEQUENCE: AgentType[] = [
  'data-aggregation',
  'equivalency',
  'transfer-compliance',
  'revision',
]

const TRANSFER_KEYWORDS =
  /\b(transfer credit|transfer credits|transcript|articulation|equivalency|course equivalency|transfer eligibility|host institution|incoming transfer)\b/i

/**
 * Detect whether a request should run the transfer credit workflow.
 */
export function isTransferCreditWorkflow(
  message: string,
  context?: Record<string, unknown>
): boolean {
  if (context?.workflow === 'transfer-credit') {
    return true
  }

  if (context?.transcriptData || context?.transferProfile) {
    return true
  }

  return TRANSFER_KEYWORDS.test(message)
}

/**
 * Build shared context passed through each agent in the pipeline.
 */
export function buildTransferWorkflowContext(
  baseContext: Record<string, unknown> | undefined,
  message: string
): Record<string, unknown> {
  return {
    ...baseContext,
    workflow: 'transfer-credit',
    pipeline: TRANSFER_CREDIT_AGENT_SEQUENCE,
    originalMessage: message,
  }
}
