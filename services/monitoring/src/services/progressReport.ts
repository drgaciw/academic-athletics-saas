// Progress report service - faculty progress report management
import { PrismaClient } from '@aah/database'
import { ProgressReportData } from '../types'
import { sendProgressReportNotification } from '../lib/pusher'
import { generateAlertsForStudent } from './alertEngine'

const prisma = new PrismaClient()

export async function submitProgressReport(data: ProgressReportData) {
  // Create progress report
  const report = await prisma.progressReport.create({
    data: {
      studentId: data.studentId,
      courseId: data.courseId,
      courseName: data.courseName,
      instructor: data.instructor,
      term: data.term,
      academicYear: data.academicYear,
      currentGrade: data.currentGrade,
      attendance: data.attendance,
      effort: data.effort,
      comments: data.comments,
      concerns: data.concerns,
      recommendations: data.recommendations,
      submittedBy: data.submittedBy,
    },
  })

  // Send real-time notification
  await sendProgressReportNotification(data.studentId, {
    id: report.id,
    courseName: report.courseName,
    currentGrade: report.currentGrade,
    concerns: report.concerns,
  })

  // Generate alerts if there are concerns
  if (data.concerns.length > 0) {
    await generateAlertsForStudent(data.studentId)
  }

  return report
}

export async function getProgressReports(
  studentId: string,
  term?: string,
  academicYear?: string
) {
  const reports = await prisma.progressReport.findMany({
    where: {
      studentId,
      ...(term && { term }),
      ...(academicYear && { academicYear }),
    },
    include: {
      submitter: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
    orderBy: { submittedAt: 'desc' },
  })

  return reports
}

export async function getProgressReport(reportId: string) {
  const report = await prisma.progressReport.findUnique({
    where: { id: reportId },
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
      submitter: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      reviewer: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  })

  return report
}

export async function reviewProgressReport(
  reportId: string,
  reviewerId: string
) {
  const report = await prisma.progressReport.update({
    where: { id: reportId },
    data: {
      reviewedBy: reviewerId,
      reviewedAt: new Date(),
    },
  })

  return report
}

export async function getReportsByInstructor(
  instructorId: string,
  term?: string,
  academicYear?: string
) {
  const reports = await prisma.progressReport.findMany({
    where: {
      submittedBy: instructorId,
      ...(term && { term }),
      ...(academicYear && { academicYear }),
    },
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
    },
    orderBy: { submittedAt: 'desc' },
  })

  return reports
}

export async function getUnreviewedReports() {
  const reports = await prisma.progressReport.findMany({
    where: {
      reviewedBy: null,
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
      submitter: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: [{ concerns: 'desc' }, { submittedAt: 'desc' }],
  })

  return reports
}

export async function getReportSummary(
  studentId: string,
  term: string,
  academicYear: string
) {
  const reports = await prisma.progressReport.findMany({
    where: {
      studentId,
      term,
      academicYear,
    },
  })

  const totalReports = reports.length
  const reportsWithConcerns = reports.filter((r) => r.concerns.length > 0).length
  const totalConcerns = reports.reduce(
    (sum, r) => sum + r.concerns.length,
    0
  )

  const gradeDistribution = reports.reduce((acc, report) => {
    if (report.currentGrade) {
      acc[report.currentGrade] = (acc[report.currentGrade] || 0) + 1
    }
    return acc
  }, {} as Record<string, number>)

  const attendanceDistribution = reports.reduce((acc, report) => {
    if (report.attendance) {
      acc[report.attendance] = (acc[report.attendance] || 0) + 1
    }
    return acc
  }, {} as Record<string, number>)

  const effortDistribution = reports.reduce((acc, report) => {
    if (report.effort) {
      acc[report.effort] = (acc[report.effort] || 0) + 1
    }
    return acc
  }, {} as Record<string, number>)

  const allConcerns = reports.flatMap((r) => r.concerns)
  const concernFrequency = allConcerns.reduce((acc, concern) => {
    acc[concern] = (acc[concern] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return {
    totalReports,
    reportsWithConcerns,
    totalConcerns,
    gradeDistribution,
    attendanceDistribution,
    effortDistribution,
    concernFrequency,
    averageGrade: calculateAverageGrade(reports.map((r) => r.currentGrade)),
  }
}

function calculateAverageGrade(grades: (string | null)[]): number | null {
  const gradeValues: Record<string, number> = {
    'A': 4.0,
    'A-': 3.7,
    'B+': 3.3,
    'B': 3.0,
    'B-': 2.7,
    'C+': 2.3,
    'C': 2.0,
    'C-': 1.7,
    'D+': 1.3,
    'D': 1.0,
    'D-': 0.7,
    'F': 0.0,
  }

  const validGrades = grades
    .filter((g): g is string => g !== null && g in gradeValues)
    .map((g) => gradeValues[g])

  if (validGrades.length === 0) return null

  const sum = validGrades.reduce((acc, val) => acc + val, 0)
  return sum / validGrades.length
}
