const mockExecuteSmartWorkflow = jest.fn();

jest.mock('@aah/ai', () => ({
  globalOrchestrator: {
    executeSmartWorkflow: mockExecuteSmartWorkflow,
  },
  classifyIntent: jest.fn(async () => ({ agentType: 'compliance', confidence: 1 })),
  globalStateManager: {
    getActiveWorkflows: jest.fn(() => []),
  },
  getRelevantMemories: jest.fn(async () => [{ content: 'Student is eligible today' }]),
  extractAndSaveFacts: jest.fn(async () => undefined),
  logAgentResponse: jest.fn(async () => undefined),
  isTransferCreditWorkflow: jest.fn(() => false),
  TRANSFER_CREDIT_AGENT_SEQUENCE: [],
}));

jest.mock('../../services/agentEligibilityGuard', () => ({
  applyAgentEligibilityGuard: jest.fn(async () => 'guarded eligibility response'),
}));

import { agentRouter } from '../agent';

function workflowResult() {
  return {
    success: true,
    agentsUsed: ['compliance'],
    response: {
      content: 'raw eligibility response',
      steps: [{ toolResults: [{ eligible: true }] }],
      toolInvocations: [
        {
          toolName: 'checkEligibility',
          parameters: { studentId: 'student-1' },
          result: { eligible: true, explanation: 'Student meets eligibility rules' },
          latency: 12,
        },
      ],
      usage: { totalTokens: 10 },
    },
    totalCost: 0.01,
    totalDuration: 25,
  };
}

describe('agent routes', () => {
  beforeEach(() => {
    mockExecuteSmartWorkflow.mockReset();
    mockExecuteSmartWorkflow.mockResolvedValue(workflowResult());
  });

  it.each(['STUDENT', 'STUDENT_ATHLETE'])(
    'omits raw tool and step payloads from %s execute responses',
    async (role) => {
      const response = await agentRouter.request('/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': 'user_1',
          'X-User-Role': role,
        },
        body: JSON.stringify({
          message: 'Am I eligible?',
          userId: 'user_1',
          agentType: 'compliance',
        }),
      });

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.response).toBe('guarded eligibility response');
      expect(body.steps).toBeUndefined();
      expect(body.toolInvocations).toEqual([
        {
          toolName: 'checkEligibility',
          latency: 12,
        },
      ]);
    }
  );
});
