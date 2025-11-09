// Intervention service - create and track intervention plans
import { PrismaClient } from '@aah/database'
import { InterventionPlanData } from '../types'
import { sendInterventionUpdate } from '../lib/pusher'

const prisma = new PrismaClient()

export async function createInterventionPlan(data: InterventionPlanData) {
  const plan = await prisma.interventionPlan.create({
    data: {
      studentId: data.studentId,
      planType: data.planType,
      title: data.title,
      description: data.description,
      goals: data.goals,
      strategies: data.strategies,
      timeline: data.timeline,
      assignedTo: data.assignedTo,
      startDate: new Date(data.timeline.startDate),
      status: 'DRAFT',
    },
  })

  return plan
}

export async function activateInterventionPlan(planId: string) {
  const plan = await prisma.interventionPlan.update({
    where: { id: planId },
    data: {
      status: 'ACTIVE',
    },
    include: {
      student: true,
    },
  })

  // Send real-time notification
  await sendInterventionUpdate(plan.studentId, {
    id: plan.id,
    planType: plan.planType,
    status: plan.status,
    title: plan.title,
  })

  return plan
}

export async function getInterventionPlans(
  studentId: string,
  status?: string
) {
  const plans = await prisma.interventionPlan.findMany({
    where: {
      studentId,
      ...(status && { status }),
    },
    include: {
      assignee: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return plans
}

export async function getInterventionPlan(planId: string) {
  const plan = await prisma.interventionPlan.findUnique({
    where: { id: planId },
    include: {
      student: {
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      },
      assignee: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  })

  return plan
}

export async function updateInterventionPlan(
  planId: string,
  updates: {
    goals?: any
    strategies?: any
    timeline?: any
    status?: string
    outcomes?: string
    effectiveness?: string
  }
) {
  const plan = await prisma.interventionPlan.update({
    where: { id: planId },
    data: updates,
    include: {
      student: true,
    },
  })

  // Send real-time notification for status changes
  if (updates.status) {
    await sendInterventionUpdate(plan.studentId, {
      id: plan.id,
      planType: plan.planType,
      status: plan.status,
      title: plan.title,
    })
  }

  return plan
}

export async function completeInterventionPlan(
  planId: string,
  outcomes: string,
  effectiveness: string
) {
  const plan = await prisma.interventionPlan.update({
    where: { id: planId },
    data: {
      status: 'COMPLETED',
      endDate: new Date(),
      outcomes,
      effectiveness,
    },
    include: {
      student: true,
    },
  })

  await sendInterventionUpdate(plan.studentId, {
    id: plan.id,
    planType: plan.planType,
    status: plan.status,
    title: plan.title,
  })

  return plan
}

export async function cancelInterventionPlan(planId: string, reason: string) {
  const plan = await prisma.interventionPlan.update({
    where: { id: planId },
    data: {
      status: 'CANCELLED',
      outcomes: reason,
      endDate: new Date(),
    },
    include: {
      student: true,
    },
  })

  await sendInterventionUpdate(plan.studentId, {
    id: plan.id,
    planType: plan.planType,
    status: plan.status,
    title: plan.title,
  })

  return plan
}

export async function getInterventionsByAssignee(
  assigneeId: string,
  status?: string
) {
  const plans = await prisma.interventionPlan.findMany({
    where: {
      assignedTo: assigneeId,
      ...(status && { status }),
    },
    include: {
      student: {
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return plans
}

export async function getInterventionStats(planType?: string) {
  const where = planType ? { planType } : {}

  const [total, active, completed, draft, cancelled] = await Promise.all([
    prisma.interventionPlan.count({ where }),
    prisma.interventionPlan.count({ where: { ...where, status: 'ACTIVE' } }),
    prisma.interventionPlan.count({ where: { ...where, status: 'COMPLETED' } }),
    prisma.interventionPlan.count({ where: { ...where, status: 'DRAFT' } }),
    prisma.interventionPlan.count({ where: { ...where, status: 'CANCELLED' } }),
  ])

  // Get effectiveness distribution for completed plans
  const completedPlans = await prisma.interventionPlan.findMany({
    where: { ...where, status: 'COMPLETED', effectiveness: { not: null } },
    select: { effectiveness: true },
  })

  const effectivenessDistribution = completedPlans.reduce((acc, plan) => {
    if (plan.effectiveness) {
      acc[plan.effectiveness] = (acc[plan.effectiveness] || 0) + 1
    }
    return acc
  }, {} as Record<string, number>)

  return {
    total,
    byStatus: {
      active,
      completed,
      draft,
      cancelled,
    },
    effectivenessDistribution,
  }
}

export async function updateInterventionGoal(
  planId: string,
  goalId: string,
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'
) {
  const plan = await prisma.interventionPlan.findUnique({
    where: { id: planId },
  })

  if (!plan) {
    throw new Error('Intervention plan not found')
  }

  const goals = plan.goals as any[]
  const goalIndex = goals.findIndex((g) => g.id === goalId)

  if (goalIndex === -1) {
    throw new Error('Goal not found')
  }

  goals[goalIndex].status = status

  const updatedPlan = await prisma.interventionPlan.update({
    where: { id: planId },
    data: {
      goals,
    },
  })

  return updatedPlan
}
