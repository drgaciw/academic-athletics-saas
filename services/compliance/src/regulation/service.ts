import {
  prisma,
  type RegulationSource,
  type RegulationSourceType,
} from '@aah/database'
import { sha256Hex } from './hash'
import {
  fetchText,
  normalizeFeedForHash,
  parseRssItems,
} from './fetch-rss'
import { DEFAULT_REGULATION_SOURCES } from './default-sources'

const PARSER_VERSION = '1'
const PENDING_RUN_STALE_MS = 30 * 60 * 1000

function hourlyRunKey(sourceId: string): string {
  const d = new Date()
  return `${sourceId}:${d.toISOString().slice(0, 13)}`
}

async function claimRegulationRun(
  sourceId: string,
  runKey: string,
  startedAt: Date
) {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "RegulationSource" WHERE id = ${sourceId} FOR UPDATE`

    const priorRun = await tx.regulationCheckRun.findUnique({
      where: { sourceId_runKey: { sourceId, runKey } },
    })

    if (priorRun?.status === 'success') {
      return null
    }

    const pendingStartedAt = priorRun?.startedAt.getTime()
    const pendingIsFresh =
      priorRun?.status === 'pending' &&
      pendingStartedAt !== undefined &&
      Date.now() - pendingStartedAt < PENDING_RUN_STALE_MS

    if (pendingIsFresh) {
      return null
    }

    return tx.regulationCheckRun.upsert({
      where: { sourceId_runKey: { sourceId, runKey } },
      create: {
        sourceId,
        runKey,
        status: 'pending',
        startedAt,
      },
      update: {
        startedAt,
        status: 'pending',
        errorSummary: null,
        completedAt: null,
      },
    })
  })
}

export async function ensureDefaultRegulationSources(): Promise<void> {
  for (const def of DEFAULT_REGULATION_SOURCES) {
    await prisma.regulationSource.upsert({
      where: {
        sourceType_name: {
          sourceType: def.sourceType,
          name: def.name,
        },
      },
      create: {
        sourceType: def.sourceType,
        name: def.name,
        feedUrl: def.feedUrl,
        pollCronMinutes: def.pollCronMinutes,
        isActive: true,
        parserVersion: PARSER_VERSION,
      },
      update: {
        feedUrl: def.feedUrl,
        pollCronMinutes: def.pollCronMinutes,
        parserVersion: PARSER_VERSION,
      },
    })
  }
}

function classifySummary(source: RegulationSource, itemCount: number): string {
  return `${source.name} feed updated — ${itemCount} item(s) in normalized window`
}

function inferSeverity(
  sourceType: RegulationSourceType
): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  if (sourceType === 'NCAA' || sourceType === 'FEDERAL') return 'HIGH'
  if (sourceType === 'STATE_OK') return 'MEDIUM'
  return 'MEDIUM'
}

function shouldCoachSee(
  sourceType: RegulationSourceType,
  materiality: number
): boolean {
  if (materiality < 0.35) return false
  return (
    sourceType === 'NCAA' ||
    sourceType === 'SUMMIT_LEAGUE' ||
    sourceType === 'STATE_OK'
  )
}

export interface RunAllResult {
  sourcesChecked: number
  changesCreated: number
  errors: { sourceId: string; message: string }[]
}

/**
 * Run regulation checks for all active sources (idempotent per source per hour).
 */
export async function runAllRegulationChecks(): Promise<RunAllResult> {
  await ensureDefaultRegulationSources()

  const sources = await prisma.regulationSource.findMany({
    where: { isActive: true },
  })

  const errors: { sourceId: string; message: string }[] = []
  let changesCreated = 0

  for (const source of sources) {
    const runKey = hourlyRunKey(source.id)
    const existing = await prisma.regulationCheckRun.findUnique({
      where: { sourceId_runKey: { sourceId: source.id, runKey } },
    })
    if (existing?.status === 'success') {
      continue
    }

    try {
      const n = await runRegulationCheckForSource(source, runKey)
      changesCreated += n
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e)
      errors.push({ sourceId: source.id, message })
    }
  }

  return {
    sourcesChecked: sources.length,
    changesCreated,
    errors,
  }
}

export async function runRegulationCheckForSource(
  source: RegulationSource,
  runKey: string
): Promise<number> {
  const startedAt = new Date()
  let changesCreated = 0

  if (
    source.circuitBreakerOpenUntil &&
    source.circuitBreakerOpenUntil > new Date()
  ) {
    await prisma.regulationCheckRun.upsert({
      where: { sourceId_runKey: { sourceId: source.id, runKey } },
      create: {
        sourceId: source.id,
        runKey,
        status: 'failure',
        errorSummary: 'Circuit breaker open',
        completedAt: new Date(),
      },
      update: {
        status: 'failure',
        errorSummary: 'Circuit breaker open',
        completedAt: new Date(),
      },
    })
    return 0
  }

  const runRow = await claimRegulationRun(source.id, runKey, startedAt)
  if (!runRow) {
    return 0
  }

  try {
    const body = await fetchText(source.feedUrl)
    const items = parseRssItems(body)
    const normalized = items.length
      ? normalizeFeedForHash(items.slice(0, 200))
      : sha256Hex(body)
    const contentHash = sha256Hex(normalized)

    changesCreated = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "RegulationSource" WHERE id = ${source.id} FOR UPDATE`

      const lastSnapshot = await tx.regulationDocumentSnapshot.findFirst({
        where: { sourceId: source.id },
        orderBy: { fetchedAt: 'desc' },
      })

      const snapshot = await tx.regulationDocumentSnapshot.create({
        data: {
          sourceId: source.id,
          contentHash,
          rawUrl: source.feedUrl,
          title: items[0]?.title ?? null,
          effectiveDate: null,
          normalizedBody: normalized.slice(0, 50_000),
          parserVersion: PARSER_VERSION,
          previousSnapshotId: lastSnapshot?.id ?? null,
        },
      })

      await tx.regulationSource.update({
        where: { id: source.id },
        data: {
          lastFetchedAt: new Date(),
          lastSuccessAt: new Date(),
          lastErrorAt: null,
          lastErrorSummary: null,
          consecutiveFailures: 0,
          circuitBreakerOpenUntil: null,
        },
      })

      let transactionChangesCreated = 0
      const hasChange = lastSnapshot && lastSnapshot.contentHash !== contentHash

      if (hasChange) {
        const materiality = Math.min(1, items.length / 50)
        const coachVisible = shouldCoachSee(source.sourceType, materiality)
        const summary = classifySummary(source, items.length)
        const change = await tx.regulationChange.create({
          data: {
            sourceId: source.id,
            snapshotId: snapshot.id,
            severity: inferSeverity(source.sourceType),
            summary,
            classification: 'FEED_UPDATE',
            impactedDomains: ['GOVERNANCE', 'PUBLICATION'],
            materialityScore: materiality,
            confidenceScore: items.length > 0 ? 0.9 : 0.6,
            requiresManualReview: items.length === 0,
            coachVisible,
            evidenceUrl: source.feedUrl,
            retrievalDate: new Date(),
            title: items[0]?.title ?? source.name,
            diffMetadata: {
              previousHash: lastSnapshot?.contentHash,
              newHash: contentHash,
              topTitles: items.slice(0, 5).map((i) => i.title),
            },
          },
        })

        await tx.regulationAudienceMapping.create({
          data: { changeId: change.id, audience: 'COMPLIANCE' },
        })
        if (coachVisible) {
          await tx.regulationAudienceMapping.create({
            data: { changeId: change.id, audience: 'COACH' },
          })
        }

        transactionChangesCreated = 1
      }

      await tx.regulationCheckRun.update({
        where: { id: runRow.id },
        data: {
          status: 'success',
          completedAt: new Date(),
          itemsFetched: items.length,
          changesDetected: transactionChangesCreated,
          errorSummary: null,
        },
      })

      return transactionChangesCreated
    })

    return changesCreated
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    const fails = source.consecutiveFailures + 1
    const openBreaker =
      fails >= 5
        ? new Date(Date.now() + 60 * 60 * 1000)
        : null

    await prisma.regulationSource.update({
      where: { id: source.id },
      data: {
        lastFetchedAt: new Date(),
        lastErrorAt: new Date(),
        lastErrorSummary: message.slice(0, 2000),
        consecutiveFailures: fails,
        circuitBreakerOpenUntil: openBreaker,
      },
    })

    await prisma.regulationCheckRun.update({
      where: { id: runRow.id },
      data: {
        status: 'failure',
        completedAt: new Date(),
        errorSummary: message.slice(0, 2000),
      },
    })

    throw e
  }
}
