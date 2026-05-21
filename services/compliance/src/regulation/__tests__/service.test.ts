import { prisma } from '@aah/database'
import { fetchText } from '../fetch-rss'
import { runRegulationCheckForSource } from '../service'

jest.mock('@aah/database', () => ({
  prisma: {
    regulationCheckRun: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
    },
    regulationSource: {
      update: jest.fn(),
      upsert: jest.fn(),
      findMany: jest.fn(),
    },
    regulationDocumentSnapshot: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    regulationChange: {
      create: jest.fn(),
    },
    regulationAudienceMapping: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  },
  Prisma: {
    PrismaClientKnownRequestError: class PrismaClientKnownRequestError extends Error {
      code: string

      constructor(message: string, { code }: { code: string }) {
        super(message)
        this.code = code
      }
    },
  },
}))

jest.mock('../fetch-rss', () => ({
  ...jest.requireActual('../fetch-rss'),
  fetchText: jest.fn(),
}))

const source = {
  id: 'source_1',
  sourceType: 'NCAA',
  name: 'NCAA',
  feedUrl: 'https://example.com/feed.xml',
  pollCronMinutes: 60,
  isActive: true,
  parserVersion: '1',
  lastFetchedAt: null,
  lastSuccessAt: null,
  lastErrorAt: null,
  lastErrorSummary: null,
  consecutiveFailures: 0,
  circuitBreakerOpenUntil: null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
} as const

function mockTransaction() {
  const tx = {
    regulationDocumentSnapshot: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    regulationSource: {
      update: jest.fn(),
    },
    regulationCheckRun: {
      update: jest.fn(),
    },
    regulationChange: {
      create: jest.fn(),
    },
    regulationAudienceMapping: {
      create: jest.fn(),
    },
  }

  ;(prisma.$transaction as jest.Mock).mockImplementation((callback) => callback(tx))
  return tx
}

describe('runRegulationCheckForSource', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(fetchText as jest.Mock).mockResolvedValue(`<?xml version="1.0"?>
      <rss><channel><item><title>New rule</title><link>https://example.com/rule</link></item></channel></rss>`)
  })

  it('does not run a duplicate check while the same source/run key is already pending', async () => {
    ;(prisma.regulationCheckRun.findUnique as jest.Mock).mockResolvedValue({
      id: 'run_1',
      status: 'pending',
      completedAt: null,
    })

    await expect(
      runRegulationCheckForSource(source, 'source_1:2026-05-21T11')
    ).resolves.toBe(0)

    expect(fetchText).not.toHaveBeenCalled()
    expect(prisma.regulationCheckRun.upsert).not.toHaveBeenCalled()
    expect(prisma.regulationDocumentSnapshot.create).not.toHaveBeenCalled()
  })

  it('writes snapshots and change records inside the success transaction', async () => {
    const tx = mockTransaction()
    ;(prisma.regulationCheckRun.findUnique as jest.Mock).mockResolvedValue(null)
    ;(prisma.regulationCheckRun.create as jest.Mock).mockResolvedValue({ id: 'run_1' })
    tx.regulationDocumentSnapshot.findFirst.mockResolvedValue({
      id: 'snapshot_0',
      contentHash: 'previous-hash',
    })
    tx.regulationDocumentSnapshot.create.mockResolvedValue({ id: 'snapshot_1' })
    tx.regulationChange.create.mockResolvedValue({ id: 'change_1' })

    await expect(
      runRegulationCheckForSource(source, 'source_1:2026-05-21T11')
    ).resolves.toBe(1)

    expect(prisma.$transaction).toHaveBeenCalledTimes(1)
    expect(tx.regulationDocumentSnapshot.create).toHaveBeenCalled()
    expect(tx.regulationChange.create).toHaveBeenCalled()
    expect(tx.regulationCheckRun.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'run_1' },
        data: expect.objectContaining({ status: 'success', changesDetected: 1 }),
      })
    )
    expect(prisma.regulationDocumentSnapshot.create).not.toHaveBeenCalled()
  })
})
