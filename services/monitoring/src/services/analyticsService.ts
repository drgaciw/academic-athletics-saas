// Analytics service - team-wide analytics aggregation
import { PrismaClient } from '@aah/database'
import { TeamAnalytics } from '../types'

const prisma = new PrismaClient()

export async function getTeamAnalytics(
  teamId: string,
  term?: string,
  academicYear?: string
): Promise<TeamAnalytics> {
  // Get all students for the team
  const students = await prisma.studentProfile.findMany({
    where: { team: teamId },
    include: {
      performanceMetrics: {
        where: term && academicYear ? { term, academicYear } : {},
        orderBy: { recordedAt: 'desc' },
        take: 1,
      },
      complianceRecords: {
        where: term && academicYear ? { term, academicYear } : {},
        orderBy: { createdAt: 'desc' },
        take: 2,
      },
      alerts: {
        where: { status: 'ACTIVE' },
      },
    },
  })

  const totalStudents = students.length

  // Calculate average metrics
  let totalGpa = 0
  let totalCreditHours = 0
  let totalAttendance = 0
  let eligibleCount = 0
  let studentsWithMetrics = 0

  students.forEach((student) => {
    const gpaMetric = student.performanceMetrics.find(
      (m) => m.metricType === 'GPA'
    )
    if (gpaMetric) {
      totalGpa += gpaMetric.value
      studentsWithMetrics++
    } else if (student.gpa) {
      totalGpa += student.gpa
      studentsWithMetrics++
    }

    const creditHoursMetric = student.performanceMetrics.find(
      (m) => m.metricType === 'CREDIT_HOURS'
    )
    if (creditHoursMetric) {
      totalCreditHours += creditHoursMetric.value
    } else {
      totalCreditHours += student.creditHours
    }

    const attendanceMetric = student.performanceMetrics.find(
      (m) => m.metricType === 'ATTENDANCE'
    )
    if (attendanceMetric) {
      totalAttendance += attendanceMetric.value
    }

    if (student.eligibilityStatus === 'ELIGIBLE') {
      eligibleCount++
    }
  })

  const averageGpa = studentsWithMetrics > 0 ? totalGpa / studentsWithMetrics : 0
  const averageCreditHours = totalStudents > 0 ? totalCreditHours / totalStudents : 0
  const averageAttendance = totalStudents > 0 ? totalAttendance / totalStudents : 0
  const eligibilityRate = totalStudents > 0 ? (eligibleCount / totalStudents) * 100 : 0

  // Calculate risk distribution
  const riskDistribution = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  }

  students.forEach((student) => {
    const criticalAlerts = student.alerts.filter(
      (a) => a.severity === 'CRITICAL'
    ).length
    const highAlerts = student.alerts.filter((a) => a.severity === 'HIGH').length
    const mediumAlerts = student.alerts.filter(
      (a) => a.severity === 'MEDIUM'
    ).length

    if (criticalAlerts > 0) {
      riskDistribution.critical++
    } else if (highAlerts > 0) {
      riskDistribution.high++
    } else if (mediumAlerts > 0) {
      riskDistribution.medium++
    } else {
      riskDistribution.low++
    }
  })

  // Calculate trends (compare current to previous term)
  let previousGpaTotal = 0
  let previousEligibleCount = 0
  let studentsWithPreviousData = 0

  students.forEach((student) => {
    if (student.complianceRecords.length >= 2) {
      const previousRecord = student.complianceRecords[1]
      previousGpaTotal += previousRecord.termGpa
      if (previousRecord.isEligible) previousEligibleCount++
      studentsWithPreviousData++
    }
  })

  const previousAverageGpa =
    studentsWithPreviousData > 0 ? previousGpaTotal / studentsWithPreviousData : averageGpa
  const previousEligibilityRate =
    studentsWithPreviousData > 0
      ? (previousEligibleCount / studentsWithPreviousData) * 100
      : eligibilityRate

  // Count alerts by severity
  const allAlerts = students.flatMap((s) => s.alerts)
  const alertsBySeverity = {
    critical: allAlerts.filter((a) => a.severity === 'CRITICAL').length,
    high: allAlerts.filter((a) => a.severity === 'HIGH').length,
    medium: allAlerts.filter((a) => a.severity === 'MEDIUM').length,
    low: allAlerts.filter((a) => a.severity === 'LOW').length,
  }

  // Identify top concerns
  const concernTypes: Record<string, number> = {}
  allAlerts.forEach((alert) => {
    concernTypes[alert.alertType] = (concernTypes[alert.alertType] || 0) + 1
  })

  const topConcerns = Object.entries(concernTypes)
    .map(([type, count]) => ({
      type,
      count,
      percentage: (count / allAlerts.length) * 100,
    }))
    .sort((a, b) => b.count - a.count)

  return {
    teamId,
    teamName: teamId, // In a real system, you'd look up the team name
    totalStudents,
    metrics: {
      averageGpa: Number(averageGpa.toFixed(2)),
      averageCreditHours: Number(averageCreditHours.toFixed(1)),
      averageAttendance: Number(averageAttendance.toFixed(1)),
      eligibilityRate: Number(eligibilityRate.toFixed(1)),
    },
    riskDistribution,
    trends: {
      gpa: {
        current: Number(averageGpa.toFixed(2)),
        previous: Number(previousAverageGpa.toFixed(2)),
        change: Number((averageGpa - previousAverageGpa).toFixed(2)),
      },
      eligibility: {
        current: Number(eligibilityRate.toFixed(1)),
        previous: Number(previousEligibilityRate.toFixed(1)),
        change: Number((eligibilityRate - previousEligibilityRate).toFixed(1)),
      },
    },
    alerts: {
      total: allAlerts.length,
      bySeverity: alertsBySeverity,
    },
    topConcerns,
  }
}

export async function getStudentComparison(studentId: string, teamId: string) {
  const teamAnalytics = await getTeamAnalytics(teamId)

  const student = await prisma.studentProfile.findUnique({
    where: { id: studentId },
    include: {
      performanceMetrics: {
        orderBy: { recordedAt: 'desc' },
        take: 1,
      },
    },
  })

  if (!student) {
    throw new Error('Student not found')
  }

  const studentGpa =
    student.performanceMetrics.find((m) => m.metricType === 'GPA')?.value ||
    student.gpa ||
    0

  const studentCreditHours = student.creditHours
  const studentAttendance =
    student.performanceMetrics.find((m) => m.metricType === 'ATTENDANCE')
      ?.value || 100

  return {
    student: {
      gpa: studentGpa,
      creditHours: studentCreditHours,
      attendance: studentAttendance,
    },
    team: {
      averageGpa: teamAnalytics.metrics.averageGpa,
      averageCreditHours: teamAnalytics.metrics.averageCreditHours,
      averageAttendance: teamAnalytics.metrics.averageAttendance,
    },
    comparison: {
      gpa:
        ((studentGpa - teamAnalytics.metrics.averageGpa) /
          teamAnalytics.metrics.averageGpa) *
        100,
      creditHours:
        ((studentCreditHours - teamAnalytics.metrics.averageCreditHours) /
          teamAnalytics.metrics.averageCreditHours) *
        100,
      attendance:
        ((studentAttendance - teamAnalytics.metrics.averageAttendance) /
          teamAnalytics.metrics.averageAttendance) *
        100,
    },
  }
}

export async function getTeamTrends(
  teamId: string,
  numberOfTerms: number = 4
) {
  const students = await prisma.studentProfile.findMany({
    where: { team: teamId },
    include: {
      complianceRecords: {
        orderBy: { createdAt: 'desc' },
        take: numberOfTerms,
      },
    },
  })

  // Group by term
  const termData: Record<string, any> = {}

  students.forEach((student) => {
    student.complianceRecords.forEach((record) => {
      const key = `${record.term}-${record.academicYear}`
      if (!termData[key]) {
        termData[key] = {
          term: record.term,
          academicYear: record.academicYear,
          totalGpa: 0,
          totalCreditHours: 0,
          eligibleCount: 0,
          studentCount: 0,
        }
      }

      termData[key].totalGpa += record.termGpa
      termData[key].totalCreditHours += record.creditHours
      if (record.isEligible) termData[key].eligibleCount++
      termData[key].studentCount++
    })
  })

  // Calculate averages for each term
  const trends = Object.values(termData).map((data: any) => ({
    term: data.term,
    academicYear: data.academicYear,
    averageGpa: data.totalGpa / data.studentCount,
    averageCreditHours: data.totalCreditHours / data.studentCount,
    eligibilityRate: (data.eligibleCount / data.studentCount) * 100,
    studentCount: data.studentCount,
  }))

  return trends.sort((a, b) => {
    // Sort by academic year and term
    if (a.academicYear !== b.academicYear) {
      return a.academicYear.localeCompare(b.academicYear)
    }
    const termOrder = { FALL: 1, SPRING: 2, SUMMER: 3 }
    return (
      (termOrder[a.term as keyof typeof termOrder] || 0) -
      (termOrder[b.term as keyof typeof termOrder] || 0)
    )
  })
}
