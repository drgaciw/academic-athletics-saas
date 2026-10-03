import { prisma } from '@aah/database'
import { runRegulationCheckForSource } from '../service'
import { fetchText } from '../fetch-rss'

jest.mock('@aah/database', () => ({
  prisma: {
    $transaction: jest.fn(),
    regulationCheckRun: {
      upsert: jest.fn(),
      update: jest.fn(),
    },
    regulationSource: {
      update: jest.fn(),
    },
  },
}))

jest.mock('../fetch-rss', () => ({
  fetchText: jest.fn(),
  normalizeFeedForHash: jest.fn(() => 'normalized'),
  parseRssItems: jest.fn(() => []),
}))

jest.mock('../default-sources', () => ({
  DEFAULT_REGULATION_SOURCES: [],
}))

const prismaMock = prisma as unknown as {
  $transaction: jest.Mock
  regulationCheckRun: {
    upsert: jest.Mock
    update: jest.Mock
  }
}

describe('runRegulationCheckForSource', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('does not start a duplicate fetch while a same-hour run is already pending', async () => {
    prismaMock.$transaction.mockImplementation(async (callback) =>
      callback({
        $queryRaw: jest.fn(),
        regulationCheckRun: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'run_1',
            sourceId: 'source_1',
            runKey: 'source_1:2026-05-05T11',
            status: 'pending',
            startedAt: new Date(),
            completedAt: null,
          }),
          upsert: jest.fn(),
        },
      })
    )

    const result = await runRegulationCheckForSource(
      {
        id: 'source_1',
        sourceType: 'NCAA',
        name: 'NCAA',
        feedUrl: 'https://example.com/rss',
        pollCronMinutes: 60,
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
      'source_1:2026-05-05T11'
    )

    expect(result).toBe(0)
    expect(fetchText).not.toHaveBeenCalled()
    expect(prismaMock.regulationCheckRun.update).not.toHaveBeenCalled()
  })
})
