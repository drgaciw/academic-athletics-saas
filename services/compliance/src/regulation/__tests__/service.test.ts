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

const RUN_KEY = 'source_1:2026-05-05T11'

function makeSource() {
  return {
    id: 'source_1',
    sourceType: 'NCAA' as const,
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
  }
}

/**
 * Build a transaction client that serves both the claim transaction
 * (findUnique/upsert on RegulationCheckRun) and the completion transaction
 * (snapshot/source/run writes).
 */
function makeTx(priorRun: Record<string, unknown> | null) {
  const tx = {
    $queryRaw: jest.fn().mockResolvedValue([{ id: 'source_1' }]),
    regulationCheckRun: {
      findUnique: jest.fn().mockResolvedValue(priorRun),
      upsert: jest.fn().mockResolvedValue({
        id: 'run_claimed',
        sourceId: 'source_1',
        runKey: RUN_KEY,
        status: 'pending',
      }),
      update: jest.fn(),
    },
    regulationDocumentSnapshot: {
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ id: 'snap_1' }),
    },
    regulationSource: {
      update: jest.fn(),
    },
    regulationChange: {
      create: jest.fn(),
    },
    regulationAudienceMapping: {
      create: jest.fn(),
    },
  }
  return tx
}

describe('runRegulationCheckForSource', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('skips when a prior run for the same hour already succeeded', async () => {
    const tx = makeTx({
      id: 'run_done',
      sourceId: 'source_1',
      runKey: RUN_KEY,
      status: 'success',
      startedAt: new Date(Date.now() - 5 * 60 * 1000),
      completedAt: new Date(),
    })
    prismaMock.$transaction.mockImplementation(async (callback) => callback(tx))

    const result = await runRegulationCheckForSource(makeSource(), RUN_KEY)

    expect(result).toBe(0)
    expect(tx.regulationCheckRun.upsert).not.toHaveBeenCalled()
    expect(fetchText).not.toHaveBeenCalled()
    expect(prismaMock.regulationCheckRun.update).not.toHaveBeenCalled()
  })

  it('re-claims a stale pending run (older than 30 minutes) and performs the fetch', async () => {
    const tx = makeTx({
      id: 'run_stale',
      sourceId: 'source_1',
      runKey: RUN_KEY,
      status: 'pending',
      startedAt: new Date(Date.now() - 31 * 60 * 1000),
      completedAt: null,
    })
    prismaMock.$transaction.mockImplementation(async (callback) => callback(tx))
    ;(fetchText as jest.Mock).mockResolvedValue('<rss></rss>')

    const result = await runRegulationCheckForSource(makeSource(), RUN_KEY)

    expect(result).toBe(0)
    // Claim happened under the row lock and reset the stale row to pending.
    expect(tx.$queryRaw).toHaveBeenCalled()
    expect(tx.regulationCheckRun.upsert).toHaveBeenCalledTimes(1)
    expect(tx.regulationCheckRun.upsert.mock.calls[0][0].update).toMatchObject({
      status: 'pending',
      errorSummary: null,
      completedAt: null,
    })
    expect(fetchText).toHaveBeenCalledWith('https://example.com/rss')
    // Completion is recorded against the claimed run row.
    expect(tx.regulationCheckRun.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'run_claimed' },
        data: expect.objectContaining({ status: 'success' }),
      })
    )
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
