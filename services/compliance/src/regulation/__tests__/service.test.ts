import {
  ensureDefaultRegulationSources,
  runRegulationCheckForSource,
} from '../service'
import { DEFAULT_REGULATION_SOURCES } from '../default-sources'
import { prisma } from '@aah/database'

jest.mock('@aah/database', () => ({
  prisma: {
    $transaction: jest.fn(),
    regulationSource: {
      upsert: jest.fn(),
      update: jest.fn(),
    },
    regulationCheckRun: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
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
  },
}))

jest.mock('../fetch-rss', () => ({
  fetchText: jest.fn().mockResolvedValue('<rss />'),
  parseRssItems: jest.fn().mockReturnValue([
    {
      title: 'Updated rule',
      link: 'https://example.test/rule',
      pubDate: 'Mon, 01 Jan 2024 00:00:00 GMT',
    },
  ]),
  normalizeFeedForHash: jest.fn().mockReturnValue('new normalized content'),
}))

const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('ensureDefaultRegulationSources', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockPrisma.regulationSource.upsert.mockResolvedValue({} as never)
  })

  it('does not overwrite existing source feed configuration', async () => {
    await ensureDefaultRegulationSources()

    expect(mockPrisma.regulationSource.upsert).toHaveBeenCalledTimes(
      DEFAULT_REGULATION_SOURCES.length
    )
    expect(mockPrisma.regulationSource.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: {
          parserVersion: '1',
        },
      })
    )
  })
})

describe('runRegulationCheckForSource', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockPrisma.regulationCheckRun.findUnique.mockResolvedValue(null)
    mockPrisma.regulationCheckRun.upsert.mockResolvedValue({ id: 'run-1' } as never)
  })

  it('creates snapshot, change, audience, and success marker in one transaction', async () => {
    const tx = {
      regulationDocumentSnapshot: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'snapshot-old',
          contentHash: 'old-content',
        }),
        create: jest.fn().mockResolvedValue({ id: 'snapshot-new' }),
      },
      regulationSource: {
        update: jest.fn().mockResolvedValue({}),
      },
      regulationChange: {
        create: jest.fn().mockResolvedValue({ id: 'change-1' }),
      },
      regulationAudienceMapping: {
        create: jest.fn().mockResolvedValue({}),
      },
      regulationCheckRun: {
        update: jest.fn().mockResolvedValue({}),
      },
    }
    mockPrisma.$transaction.mockImplementation(async (callback) =>
      callback(tx as never)
    )

    const result = await runRegulationCheckForSource(
      {
        id: 'source-1',
        sourceType: 'NCAA',
        name: 'NCAA',
        feedUrl: 'https://example.test/feed.xml',
        pollCronMinutes: 1440,
        isActive: true,
        lastFetchedAt: null,
        lastSuccessAt: null,
        lastErrorAt: null,
        lastErrorSummary: null,
        consecutiveFailures: 0,
        circuitBreakerOpenUntil: null,
        parserVersion: '1',
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      'source-1:2026-05-09T11'
    )

    expect(result).toBe(1)
    expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1)
    expect(tx.regulationDocumentSnapshot.create).toHaveBeenCalled()
    expect(tx.regulationChange.create).toHaveBeenCalled()
    expect(tx.regulationAudienceMapping.create).toHaveBeenCalledWith({
      data: { changeId: 'change-1', audience: 'COMPLIANCE' },
    })
    expect(tx.regulationCheckRun.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'run-1' },
        data: expect.objectContaining({
          status: 'success',
          changesDetected: 1,
        }),
      })
    )
  })
})
