// Alert engine - generates alerts based on performance thresholds
import { PrismaClient, AlertSeverity } from '@aah/database'
import { AlertData } from '../types'
import { DEFAULT_THRESHOLDS } from '../lib/thresholds'
import { sendAlertNotification } from '../lib/pusher'

const prisma = new PrismaClient()

export async function generateAlertsForStudent(
  studentId: string
): Promise<AlertData[]> {
  const alerts: AlertData[] = []

  // Get student performance metrics
  const student = await prisma.studentProfile.findUnique({
    where: { id: studentId },
    include: {
      performanceMetrics: {
        orderBy: { recordedAt: 'desc' },
        take: 5,
      },
      complianceRecords: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
      progressReports: {
        where: { concerns: { isEmpty: false } },
        orderBy: { submittedAt: 'desc' },
        take: 3,
      },
    },
  })

  if (!student) {
    throw new Error('Student not found')
  }

  // Check GPA alerts
  const gpaMetric = student.performanceMetrics.find((m) => m.metricType === 'GPA')
  if (gpaMetric) {
    const gpaAlert = checkGpaThreshold(studentId, gpaMetric.value)
    if (gpaAlert) alerts.push(gpaAlert)
  }

  // Check attendance alerts
  const attendanceMetric = student.performanceMetrics.find(
    (m) => m.metricType === 'ATTENDANCE'
  )
  if (attendanceMetric) {
    const attendanceAlert = checkAttendanceThreshold(
      studentId,
      attendanceMetric.value
    )
    if (attendanceAlert) alerts.push(attendanceAlert)
  }

  // Check credit hours alerts
  const creditHoursAlert = checkCreditHoursThreshold(
    studentId,
    student.creditHours
  )
  if (creditHoursAlert) alerts.push(creditHoursAlert)

  // Check eligibility alerts
  if (student.eligibilityStatus !== 'ELIGIBLE') {
    alerts.push({
      studentId,
      alertType: 'ELIGIBILITY',
      severity: 'CRITICAL',
      title: 'Eligibility Status Alert',
      message: `Student eligibility status is ${student.eligibilityStatus}. Immediate review required.`,
      metadata: {
        eligibilityStatus: student.eligibilityStatus,
        gpa: student.gpa,
        creditHours: student.creditHours,
      },
      triggeredBy: 'SYSTEM',
    })
  }

  // Check for multiple faculty concerns
  if (student.progressReports.length >= 2) {
    const totalConcerns = student.progressReports.reduce(
      (sum, report) => sum + report.concerns.length,
      0
    )

    if (totalConcerns >= 3) {
      alerts.push({
        studentId,
        alertType: 'ACADEMIC',
        severity: 'HIGH',
        title: 'Multiple Faculty Concerns',
        message: `${totalConcerns} concerns reported across ${student.progressReports.length} courses. Student may need intervention.`,
        metadata: {
          totalConcerns,
          affectedCourses: student.progressReports.length,
          concerns: student.progressReports.flatMap((r) => r.concerns),
        },
        triggeredBy: 'SYSTEM',
      })
    }
  }

  return alerts
}

export async function createAlert(alertData: AlertData) {
  const alert = await prisma.alert.create({
    data: {
      studentId: alertData.studentId,
      alertType: alertData.alertType,
      severity: alertData.severity,
      title: alertData.title,
      message: alertData.message,
      metadata: alertData.metadata || {},
      triggeredBy: alertData.triggeredBy || 'SYSTEM',
      ...(alertData.assignedTo && { assignedTo: alertData.assignedTo }),
    },
  })

  // Send real-time notification via Pusher
  await sendAlertNotification(alertData.studentId, {
    id: alert.id,
    type: alert.alertType,
    severity: alert.severity,
    title: alert.title,
    message: alert.message,
    metadata: alert.metadata,
  })

  return alert
}

export async function getActiveAlerts(studentId: string) {
  const alerts = await prisma.alert.findMany({
    where: {
      studentId,
      status: 'ACTIVE',
    },
    orderBy: [{ severity: 'asc' }, { createdAt: 'desc' }],
  })

  return alerts
}

export async function acknowledgeAlert(alertId: string, userId: string) {
  const alert = await prisma.alert.update({
    where: { id: alertId },
    data: {
      status: 'ACKNOWLEDGED',
      acknowledgedAt: new Date(),
      assignedTo: userId,
    },
  })

  return alert
}

export async function resolveAlert(
  alertId: string,
  resolution: string,
  userId: string
) {
  const alert = await prisma.alert.update({
    where: { id: alertId },
    data: {
      status: 'RESOLVED',
      resolvedAt: new Date(),
      resolution,
      assignedTo: userId,
    },
  })

  return alert
}

// Helper functions for threshold checking
function checkGpaThreshold(
  studentId: string,
  gpa: number
): AlertData | null {
  const thresholds = DEFAULT_THRESHOLDS.gpa

  if (gpa < thresholds.critical) {
    return {
      studentId,
      alertType: 'ACADEMIC',
      severity: 'CRITICAL',
      title: 'Critical GPA Alert',
      message: `GPA of ${gpa.toFixed(2)} is below NCAA minimum requirement of ${thresholds.critical}. Immediate intervention required.`,
      metadata: { gpa, threshold: thresholds.critical },
      triggeredBy: 'SYSTEM',
    }
  }

  if (gpa < thresholds.high) {
    return {
      studentId,
      alertType: 'ACADEMIC',
      severity: 'HIGH',
      title: 'Low GPA Alert',
      message: `GPA of ${gpa.toFixed(2)} is at NCAA minimum requirement. Monitor closely.`,
      metadata: { gpa, threshold: thresholds.high },
      triggeredBy: 'SYSTEM',
    }
  }

  if (gpa < thresholds.medium) {
    return {
      studentId,
      alertType: 'ACADEMIC',
      severity: 'MEDIUM',
      title: 'GPA Watch',
      message: `GPA of ${gpa.toFixed(2)} is below initial eligibility standard. Consider academic support.`,
      metadata: { gpa, threshold: thresholds.medium },
      triggeredBy: 'SYSTEM',
    }
  }

  return null
}

function checkAttendanceThreshold(
  studentId: string,
  attendance: number
): AlertData | null {
  const thresholds = DEFAULT_THRESHOLDS.attendance

  if (attendance < thresholds.critical) {
    return {
      studentId,
      alertType: 'ATTENDANCE',
      severity: 'CRITICAL',
      title: 'Critical Attendance Alert',
      message: `Attendance at ${attendance.toFixed(1)}% is critically low. Immediate action required.`,
      metadata: { attendance, threshold: thresholds.critical },
      triggeredBy: 'SYSTEM',
    }
  }

  if (attendance < thresholds.high) {
    return {
      studentId,
      alertType: 'ATTENDANCE',
      severity: 'HIGH',
      title: 'Low Attendance Alert',
      message: `Attendance at ${attendance.toFixed(1)}% needs improvement.`,
      metadata: { attendance, threshold: thresholds.high },
      triggeredBy: 'SYSTEM',
    }
  }

  if (attendance < thresholds.medium) {
    return {
      studentId,
      alertType: 'ATTENDANCE',
      severity: 'MEDIUM',
      title: 'Attendance Watch',
      message: `Attendance at ${attendance.toFixed(1)}% is below target.`,
      metadata: { attendance, threshold: thresholds.medium },
      triggeredBy: 'SYSTEM',
    }
  }

  return null
}

function checkCreditHoursThreshold(
  studentId: string,
  creditHours: number
): AlertData | null {
  const thresholds = DEFAULT_THRESHOLDS.creditHours

  if (creditHours < thresholds.critical) {
    return {
      studentId,
      alertType: 'ELIGIBILITY',
      severity: 'CRITICAL',
      title: 'Critical Credit Hours Alert',
      message: `Only ${creditHours} credit hours enrolled. Below minimum requirement for eligibility.`,
      metadata: { creditHours, threshold: thresholds.critical },
      triggeredBy: 'SYSTEM',
    }
  }

  if (creditHours < thresholds.high) {
    return {
      studentId,
      alertType: 'ACADEMIC',
      severity: 'HIGH',
      title: 'Low Credit Hours Alert',
      message: `Only ${creditHours} credit hours enrolled. Below recommended pace for degree completion.`,
      metadata: { creditHours, threshold: thresholds.high },
      triggeredBy: 'SYSTEM',
    }
  }

  return null
}

export async function dismissAlert(alertId: string) {
  const alert = await prisma.alert.update({
    where: { id: alertId },
    data: {
      status: 'DISMISSED',
    },
  })

  return alert
}
