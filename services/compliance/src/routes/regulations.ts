/**
 * Regulation Watch API routes
 */

import { Hono } from 'hono'
import { z } from 'zod'
import {
  getUser,
  checkPermission,
  UserRole,
  type UserContext,
} from '@aah/auth'
import {
  successResponse,
  validateRequest,
  ForbiddenError,
  NotFoundError,
} from '@aah/api-utils'
import { prisma, type Prisma } from '@aah/database'
import { runAllRegulationChecks } from '../regulation/service'

const routes = new Hono()

const listQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  unacknowledgedOnly: z
    .string()
    .optional()
    .transform((v) => v === 'true'),
})

const acknowledgeSchema = z.object({
  changeId: z.string().min(1),
  notes: z.string().max(2000).optional(),
})

function canViewRegulations(role: UserRole): boolean {
  return (
    role === UserRole.ADMIN ||
    role === UserRole.COMPLIANCE ||
    role === UserRole.COACH
  )
}

async function resolveAcknowledgementUserId(user: UserContext): Promise<string> {
  const dbUser = await prisma.user.findUnique({
    where: { clerkId: user.clerkId },
    select: { id: true },
  })

  if (dbUser) {
    return dbUser.id
  }

  if (user.userId && user.userId !== user.clerkId) {
    return user.userId
  }

  throw new ForbiddenError('Authenticated user is not synced')
}

/**
 * GET /api/compliance/regulations/changes
 */
routes.get('/regulations/changes', async (c) => {
  const user = getUser(c)
  const correlationId = c.get('correlationId')

  if (!canViewRegulations(user.role)) {
    throw new ForbiddenError('You cannot view regulation updates')
  }

  try {
    checkPermission(c, 'compliance:read')
  } catch {
    throw new ForbiddenError('Missing compliance:read permission')
  }

  const q = listQuerySchema.parse({
    page: c.req.query('page'),
    limit: c.req.query('limit'),
    unacknowledgedOnly: c.req.query('unacknowledgedOnly'),
  })

  const where: Prisma.RegulationChangeWhereInput = {}
  const acknowledgementUserId =
    user.role === UserRole.COACH
      ? null
      : await resolveAcknowledgementUserId(user)

  if (user.role === UserRole.COACH) {
    where.coachVisible = true
  }

  if (q.unacknowledgedOnly && acknowledgementUserId) {
    where.NOT = {
      acknowledgements: {
        some: { userId: acknowledgementUserId },
      },
    }
  }

  const skip = (q.page - 1) * q.limit

  const [total, rows] = await prisma.$transaction([
    prisma.regulationChange.count({ where }),
    prisma.regulationChange.findMany({
      where,
      orderBy: { detectedAt: 'desc' },
      skip,
      take: q.limit,
      include: {
        source: {
          select: { id: true, name: true, sourceType: true, feedUrl: true },
        },
        acknowledgements: {
          where: acknowledgementUserId
            ? { userId: acknowledgementUserId }
            : { userId: '' },
          select: { id: true },
        },
      },
    }),
  ])

  const data = rows.map((r) => ({
    id: r.id,
    detectedAt: r.detectedAt.toISOString(),
    severity: r.severity,
    summary: r.summary,
    classification: r.classification,
    impactedDomains: r.impactedDomains,
    coachVisible: r.coachVisible,
    evidenceUrl: r.evidenceUrl,
    retrievalDate: r.retrievalDate.toISOString(),
    title: r.title,
    requiresManualReview: r.requiresManualReview,
    source: r.source,
    acknowledged:
      user.role === UserRole.COACH
        ? undefined
        : r.acknowledgements.length > 0,
  }))

  return c.json(
    successResponse(
      {
        data,
        pagination: {
          page: q.page,
          limit: q.limit,
          total,
          totalPages: Math.ceil(total / q.limit),
        },
      },
      correlationId
    )
  )
})

/**
 * GET /api/compliance/regulations/changes/:id
 */
routes.get('/regulations/changes/:id', async (c) => {
  const user = getUser(c)
  const correlationId = c.get('correlationId')
  const id = c.req.param('id')

  if (!canViewRegulations(user.role)) {
    throw new ForbiddenError('You cannot view regulation updates')
  }

  try {
    checkPermission(c, 'compliance:read')
  } catch {
    throw new ForbiddenError('Missing compliance:read permission')
  }

  const acknowledgementUserId =
    user.role === UserRole.COACH
      ? null
      : await resolveAcknowledgementUserId(user)

  const row = await prisma.regulationChange.findUnique({
    where: { id },
    include: {
      source: true,
      snapshot: {
        select: {
          id: true,
          fetchedAt: true,
          contentHash: true,
          rawUrl: true,
          normalizedBody: true,
          parserVersion: true,
        },
      },
      acknowledgements: {
        where: acknowledgementUserId
          ? { userId: acknowledgementUserId }
          : { userId: '' },
      },
      audienceMappings: true,
    },
  })

  if (!row) {
    throw new NotFoundError('Change not found', 'regulationChange')
  }

  if (user.role === UserRole.COACH && !row.coachVisible) {
    throw new ForbiddenError('Change not available for coach role')
  }

  return c.json(
    successResponse(
      {
        id: row.id,
        detectedAt: row.detectedAt.toISOString(),
        severity: row.severity,
        summary: row.summary,
        classification: row.classification,
        impactedDomains: row.impactedDomains,
        diffMetadata: row.diffMetadata,
        materialityScore: row.materialityScore,
        confidenceScore: row.confidenceScore,
        requiresManualReview: row.requiresManualReview,
        coachVisible: row.coachVisible,
        evidenceUrl: row.evidenceUrl,
        retrievalDate: row.retrievalDate.toISOString(),
        title: row.title,
        source: row.source,
        snapshot: row.snapshot,
        audiences: row.audienceMappings.map((a) => a.audience),
        acknowledged:
          user.role === UserRole.COACH
            ? undefined
            : row.acknowledgements.length > 0,
      },
      correlationId
    )
  )
})

/**
 * POST /api/compliance/regulations/acknowledge
 */
routes.post(
  '/regulations/acknowledge',
  validateRequest(acknowledgeSchema, 'json'),
  async (c) => {
    const user = getUser(c)
    const correlationId = c.get('correlationId')
    const { changeId, notes } = c.get('validated_json') as z.infer<
      typeof acknowledgeSchema
    >

    if (
      user.role !== UserRole.ADMIN &&
      user.role !== UserRole.COMPLIANCE
    ) {
      throw new ForbiddenError('Only compliance roles can acknowledge changes')
    }

    try {
      checkPermission(c, 'compliance:write')
    } catch {
      throw new ForbiddenError('Missing compliance:write permission')
    }

    const change = await prisma.regulationChange.findUnique({
      where: { id: changeId },
    })
    if (!change) {
      throw new NotFoundError('Change not found', 'regulationChange')
    }

    const acknowledgementUserId = await resolveAcknowledgementUserId(user)

    await prisma.regulationAcknowledgement.upsert({
      where: {
        changeId_userId: { changeId, userId: acknowledgementUserId },
      },
      create: {
        changeId,
        userId: acknowledgementUserId,
        notes: notes ?? null,
      },
      update: {
        notes: notes ?? null,
        acknowledgedAt: new Date(),
      },
    })

    return c.json(successResponse({ success: true }, correlationId))
  }
)

/**
 * GET /api/compliance/regulations/sources
 */
routes.get('/regulations/sources', async (c) => {
  const user = getUser(c)
  const correlationId = c.get('correlationId')

  if (
    user.role !== UserRole.ADMIN &&
    user.role !== UserRole.COMPLIANCE
  ) {
    throw new ForbiddenError('Insufficient permissions')
  }

  try {
    checkPermission(c, 'compliance:read')
  } catch {
    throw new ForbiddenError('Missing compliance:read permission')
  }

  const sources = await prisma.regulationSource.findMany({
    orderBy: [{ sourceType: 'asc' }, { name: 'asc' }],
    select: {
      id: true,
      sourceType: true,
      name: true,
      feedUrl: true,
      isActive: true,
      lastFetchedAt: true,
      lastSuccessAt: true,
      lastErrorAt: true,
      lastErrorSummary: true,
      consecutiveFailures: true,
      circuitBreakerOpenUntil: true,
      parserVersion: true,
    },
  })

  return c.json(successResponse({ data: sources }, correlationId))
})

/**
 * POST /api/compliance/regulations/check-now
 */
routes.post('/regulations/check-now', async (c) => {
  const user = getUser(c)
  const correlationId = c.get('correlationId')

  try {
    checkPermission(c, 'compliance:admin')
  } catch {
    throw new ForbiddenError('compliance:admin required')
  }

  const result = await runAllRegulationChecks()
  return c.json(successResponse(result, correlationId))
})

export default routes
