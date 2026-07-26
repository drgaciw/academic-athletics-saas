const mockQueryRawUnsafe = jest.fn()
const mockEmbed = jest.fn()

jest.mock('@aah/database', () => ({
  prisma: {
    $queryRawUnsafe: (...args: unknown[]) => mockQueryRawUnsafe(...args),
    agentMemory: {
      updateMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
  },
}))

jest.mock('ai', () => ({
  embed: (...args: unknown[]) => mockEmbed(...args),
  generateText: jest.fn(),
}))

jest.mock('@ai-sdk/openai', () => ({
  openai: {
    embedding: jest.fn(() => 'mock-embedding-model'),
  },
}))

import { AgentMemoryStore } from '../agent-memory'

describe('AgentMemoryStore SQL safety', () => {
  const memory = new AgentMemoryStore()

  beforeEach(() => {
    jest.clearAllMocks()
    mockEmbed.mockResolvedValue({ embedding: [0.1, 0.2, 0.3] })
    mockQueryRawUnsafe.mockResolvedValue([])
  })

  it('parameterizes userId and rejects SQL interpolation of attacker-controlled ids', async () => {
    const maliciousUserId = "victim' OR '1'='1"

    await memory.getRelevantMemories(maliciousUserId, 'eligibility question', {
      memoryType: 'long_term',
      limit: 3,
      minImportance: 0.2,
      minConfidence: 0.5,
    })

    expect(mockQueryRawUnsafe).toHaveBeenCalledTimes(1)
    const [sql, ...params] = mockQueryRawUnsafe.mock.calls[0]

    expect(sql).toContain('WHERE user_id = $1')
    expect(sql).not.toContain(maliciousUserId)
    expect(params[0]).toBe(maliciousUserId)
    expect(params[1]).toBe(0.2)
    expect(params[2]).toBe(0.5)
    expect(params[3]).toBe(3)
    expect(params).toContain('long_term')
  })
})
