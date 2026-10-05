jest.mock('@ai-sdk/openai', () => ({
  openai: jest.fn(),
}))

jest.mock('@ai-sdk/anthropic', () => ({
  anthropic: jest.fn(),
}))

jest.mock('ai', () => ({
  generateText: jest.fn(),
  streamText: jest.fn(),
}))

jest.mock('../ragPipeline', () => ({
  ragPipeline: {
    query: jest.fn(),
  },
}))

jest.mock('../studentEligibilityContext', () => ({
  resolveDbUserId: jest.fn(),
  loadStudentEligibilityGate: jest.fn(),
}))

jest.mock('@aah/database', () => ({
  prisma: {
    conversation: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
  },
}))

import { ChatService } from '../chatService'
import { resolveDbUserId } from '../studentEligibilityContext'

const { prisma } = jest.requireMock('@aah/database') as {
  prisma: {
    conversation: {
      findUnique: jest.Mock
      findMany: jest.Mock
      update: jest.Mock
    }
  }
}

const mockResolveDbUserId = resolveDbUserId as jest.MockedFunction<typeof resolveDbUserId>

/**
 * Routes authenticate with the Clerk id (X-User-Id) while conversations are
 * stored against the Prisma user id. list/delete must resolve the DB id before
 * comparing ownership, exactly as the chat/history paths already do.
 */
describe('ChatService conversation ownership (Clerk id -> DB id)', () => {
  const service = new ChatService()

  beforeEach(() => {
    jest.clearAllMocks()
    prisma.conversation.update.mockResolvedValue({})
    prisma.conversation.findMany.mockResolvedValue([])
  })

  describe('getUserConversations', () => {
    it('queries by the resolved DB user id, not the raw Clerk id', async () => {
      mockResolveDbUserId.mockResolvedValue('db-user-1')

      await service.getUserConversations('clerk-user-1', 10)

      expect(mockResolveDbUserId).toHaveBeenCalledWith('clerk-user-1')
      expect(prisma.conversation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'db-user-1', status: 'active' },
          take: 10,
        })
      )
    })

    it('falls back to the caller id when no DB user is resolved', async () => {
      mockResolveDbUserId.mockResolvedValue(null)

      await service.getUserConversations('db-user-direct')

      expect(prisma.conversation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'db-user-direct', status: 'active' },
        })
      )
    })
  })

  describe('deleteConversation', () => {
    it('soft-deletes a conversation owned by the resolved DB user', async () => {
      mockResolveDbUserId.mockResolvedValue('db-user-1')
      prisma.conversation.findUnique.mockResolvedValue({ id: 'conv-1', userId: 'db-user-1' })

      await expect(service.deleteConversation('conv-1', 'clerk-user-1')).resolves.toBeUndefined()

      expect(prisma.conversation.update).toHaveBeenCalledWith({
        where: { id: 'conv-1' },
        data: { status: 'deleted' },
      })
    })

    it('rejects deleting a conversation owned by a different DB user', async () => {
      mockResolveDbUserId.mockResolvedValue('db-user-1')
      prisma.conversation.findUnique.mockResolvedValue({ id: 'conv-1', userId: 'db-user-2' })

      await expect(service.deleteConversation('conv-1', 'clerk-user-1')).rejects.toThrow(
        'Conversation not found or access denied'
      )
      expect(prisma.conversation.update).not.toHaveBeenCalled()
    })

    it('rejects when the raw Clerk id happens to match but the DB id does not', async () => {
      // Regression: before the fix, ownership compared conversation.userId to the
      // raw caller id, so a row keyed by the DB id never matched the Clerk id and
      // (conversely) a Clerk-id-keyed row could match the wrong caller.
      mockResolveDbUserId.mockResolvedValue('db-user-1')
      prisma.conversation.findUnique.mockResolvedValue({ id: 'conv-1', userId: 'clerk-user-1' })

      await expect(service.deleteConversation('conv-1', 'clerk-user-1')).rejects.toThrow(
        'Conversation not found or access denied'
      )
      expect(prisma.conversation.update).not.toHaveBeenCalled()
    })
  })
})
