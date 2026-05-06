import { prisma } from '@aah/database'
import { ensureDefaultRegulationSources } from '../service'

jest.mock('@aah/database', () => ({
  prisma: {
    regulationSource: {
      upsert: jest.fn(),
    },
  },
}))

describe('ensureDefaultRegulationSources', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('does not overwrite feed configuration for existing sources', async () => {
    await ensureDefaultRegulationSources()

    expect(prisma.regulationSource.upsert).toHaveBeenCalled()
    for (const call of (prisma.regulationSource.upsert as jest.Mock).mock
      .calls) {
      expect(call[0].update).toEqual({ parserVersion: '1' })
    }
  })
})
