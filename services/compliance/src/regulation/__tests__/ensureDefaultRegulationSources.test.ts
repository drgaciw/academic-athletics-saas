import { prisma } from '@aah/database'
import { ensureDefaultRegulationSources } from '../service'

jest.mock('@aah/database', () => ({
  prisma: {
    regulationSource: {
      upsert: jest.fn(),
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
  DEFAULT_REGULATION_SOURCES: [
    {
      sourceType: 'NCAA',
      name: 'ncaa-news-rss',
      feedUrl: 'https://default.example.com/rss',
      pollCronMinutes: 360,
    },
  ],
}))

const prismaMock = prisma as unknown as {
  regulationSource: {
    upsert: jest.Mock
    update: jest.Mock
  }
}

function sourceRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'source_1',
    sourceType: 'NCAA',
    name: 'ncaa-news-rss',
    feedUrl: 'https://default.example.com/rss',
    pollCronMinutes: 360,
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
    ...overrides,
  }
}

describe('ensureDefaultRegulationSources', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('creates missing rows from the defaults without touching the update branch', async () => {
    prismaMock.regulationSource.upsert.mockResolvedValue(sourceRow())

    await ensureDefaultRegulationSources()

    expect(prismaMock.regulationSource.upsert).toHaveBeenCalledTimes(1)
    const call = prismaMock.regulationSource.upsert.mock.calls[0][0]
    expect(call.where).toEqual({
      sourceType_name: { sourceType: 'NCAA', name: 'ncaa-news-rss' },
    })
    expect(call.create).toMatchObject({
      feedUrl: 'https://default.example.com/rss',
      pollCronMinutes: 360,
      parserVersion: '1',
    })
    // The upsert's update must be a no-op so operator values survive re-seeds.
    expect(call.update).toEqual({})
    expect(prismaMock.regulationSource.update).not.toHaveBeenCalled()
  })

  it('preserves operator-managed feedUrl and pollCronMinutes on re-seed', async () => {
    prismaMock.regulationSource.upsert.mockResolvedValue(
      sourceRow({
        feedUrl: 'https://operator.example.edu/custom-feed',
        pollCronMinutes: 15,
      })
    )

    await ensureDefaultRegulationSources()

    expect(prismaMock.regulationSource.update).not.toHaveBeenCalled()
  })

  it('fills only the fields that are null or empty on an existing row', async () => {
    prismaMock.regulationSource.upsert.mockResolvedValue(
      sourceRow({
        feedUrl: '',
        pollCronMinutes: null,
      })
    )

    await ensureDefaultRegulationSources()

    expect(prismaMock.regulationSource.update).toHaveBeenCalledTimes(1)
    expect(prismaMock.regulationSource.update).toHaveBeenCalledWith({
      where: { id: 'source_1' },
      data: {
        feedUrl: 'https://default.example.com/rss',
        pollCronMinutes: 360,
      },
    })
  })

  it('bumps a stale parserVersion but leaves operator values alone', async () => {
    prismaMock.regulationSource.upsert.mockResolvedValue(
      sourceRow({
        feedUrl: 'https://operator.example.edu/custom-feed',
        pollCronMinutes: 15,
        parserVersion: '0',
      })
    )

    await ensureDefaultRegulationSources()

    expect(prismaMock.regulationSource.update).toHaveBeenCalledWith({
      where: { id: 'source_1' },
      data: { parserVersion: '1' },
    })
  })
})
