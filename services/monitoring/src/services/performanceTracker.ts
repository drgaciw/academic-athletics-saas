// Performance tracking service - calculates GPA, credit hours, attendance metrics
import { PrismaClient } from '@aah/database'
import { PerformanceMetrics } from '../types'
import { determineMetricStatus, calculateTrend } from '../lib/thresholds'

const prisma = new PrismaClient()

export async function getPerformanceMetrics(
  studentId: string,
  term?: string,
  academicYear?: string
): Promise<PerformanceMetrics> {
  // Get student profile
  const student = await prisma.studentProfile.findUnique({
    where: { id: studentId },
    include: {
      performanceMetrics: {
        where: term && academicYear ? { term, academicYear } : {},
        orderBy: { recordedAt: 'desc' },
        take: 10,
      },
      complianceRecords: {
        where: term && academicYear ? { term, academicYear } : {},
        orderBy: { createdAt: 'desc' },
        take: 2,
      },
      progressReports: {
        where: term && academicYear ? { term, academicYear } : {},
      },
    },
  })

  if (!student) {
    throw new Error('Student not found')
  }

  // Calculate current metrics
  const currentTerm = term || getCurrentTerm()
  const currentYear = academicYear || getCurrentAcademicYear()

  // Get GPA metrics
  const gpaMetrics = student.performanceMetrics.filter(
    (m) => m.metricType === 'GPA'
  )
  const currentGpa = gpaMetrics[0]?.value || student.gpa || 0
  const previousGpa = gpaMetrics[1]?.value || currentGpa

  // Get credit hours
  const creditHoursMetric = student.performanceMetrics.find(
    (m) => m.metricType === 'CREDIT_HOURS'
  )
  const currentCreditHours =
    creditHoursMetric?.value || student.creditHours || 0

  // Calculate attendance percentage
  const attendanceMetric = student.performanceMetrics.find(
    (m) => m.metricType === 'ATTENDANCE'
  )
  const attendancePercentage = attendanceMetric?.value || 100

  // Calculate study hours
  const studyHoursMetric = student.performanceMetrics.find(
    (m) => m.metricType === 'STUDY_HOURS'
  )
  const studyHours = studyHoursMetric?.value || 0

  // Get cumulative GPA from compliance records
  const latestCompliance = student.complianceRecords[0]
  const cumulativeGpa = latestCompliance?.cumulativeGpa || currentGpa

  // Calculate previous term GPA for trend analysis
  const previousCompliance = student.complianceRecords[1]
  const previousTermGpa = previousCompliance?.termGpa || currentGpa

  // Get attendance trend
  const attendanceMetrics = student.performanceMetrics.filter(
    (m) => m.metricType === 'ATTENDANCE'
  )
  const previousAttendance =
    attendanceMetrics[1]?.value || attendancePercentage

  return {
    studentId,
    termGpa: currentGpa,
    cumulativeGpa,
    creditHours: currentCreditHours,
    attendance: attendancePercentage,
    studyHours,
    academicStanding: student.academicStanding || 'GOOD_STANDING',
    status: {
      gpa: determineMetricStatus('GPA', currentGpa),
      creditHours: determineMetricStatus('CREDIT_HOURS', currentCreditHours),
      attendance: determineMetricStatus('ATTENDANCE', attendancePercentage),
    },
    trends: {
      gpa: calculateTrend(currentGpa, previousTermGpa),
      attendance: calculateTrend(attendancePercentage, previousAttendance),
    },
  }
}

export async function recordPerformanceMetric(
  studentId: string,
  metricType: 'GPA' | 'ATTENDANCE' | 'CREDIT_HOURS' | 'STUDY_HOURS',
  value: number,
  term: string,
  academicYear: string,
  benchmark?: number,
  notes?: string
) {
  const status = determineMetricStatus(metricType, value)

  const metric = await prisma.performanceMetric.create({
    data: {
      studentId,
      metricType,
      value,
      term,
      academicYear,
      benchmark,
      status,
      notes,
    },
  })

  return metric
}

export async function getPerformanceHistory(
  studentId: string,
  metricType?: string,
  limit: number = 20
) {
  const metrics = await prisma.performanceMetric.findMany({
    where: {
      studentId,
      ...(metricType && { metricType }),
    },
    orderBy: { recordedAt: 'desc' },
    take: limit,
  })

  return metrics
}

export async function calculateAttendanceRate(studentId: string) {
  // Get all progress reports for the student
  const reports = await prisma.progressReport.findMany({
    where: { studentId },
    select: { attendance: true },
  })

  if (reports.length === 0) return 100

  const attendanceScores = {
    EXCELLENT: 100,
    GOOD: 90,
    FAIR: 75,
    POOR: 60,
  }

  const totalScore = reports.reduce((sum, report) => {
    if (!report.attendance) return sum + 100
    return sum + (attendanceScores[report.attendance] || 100)
  }, 0)

  return Math.round(totalScore / reports.length)
}

// Helper functions
function getCurrentTerm(): string {
  const month = new Date().getMonth()
  if (month >= 0 && month < 5) return 'SPRING'
  if (month >= 5 && month < 8) return 'SUMMER'
  return 'FALL'
}

function getCurrentAcademicYear(): string {
  const year = new Date().getFullYear()
  const month = new Date().getMonth()
  return month >= 8 ? `${year}-${year + 1}` : `${year - 1}-${year}`
}
