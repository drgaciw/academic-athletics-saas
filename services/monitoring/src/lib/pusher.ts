// Pusher real-time WebSocket integration
import Pusher from 'pusher'

const pusherConfig = {
  appId: process.env.PUSHER_APP_ID || '',
  key: process.env.PUSHER_KEY || '',
  secret: process.env.PUSHER_SECRET || '',
  cluster: process.env.PUSHER_CLUSTER || 'us2',
  useTLS: true,
}

let pusherInstance: Pusher | null = null

export function getPusherInstance(): Pusher {
  if (!pusherInstance) {
    pusherInstance = new Pusher(pusherConfig)
  }
  return pusherInstance
}

export async function sendAlertNotification(
  studentId: string,
  alert: {
    id: string
    type: string
    severity: string
    title: string
    message: string
    metadata?: any
  }
) {
  try {
    const pusher = getPusherInstance()

    // Send to student-specific channel
    await pusher.trigger(`student-${studentId}`, 'alert', {
      alertId: alert.id,
      type: alert.type,
      severity: alert.severity,
      title: alert.title,
      message: alert.message,
      metadata: alert.metadata,
      timestamp: new Date().toISOString(),
    })

    // Send to admin/staff monitoring channel based on severity
    if (alert.severity === 'CRITICAL' || alert.severity === 'HIGH') {
      await pusher.trigger('alerts-priority', 'new-alert', {
        studentId,
        alertId: alert.id,
        severity: alert.severity,
        title: alert.title,
        timestamp: new Date().toISOString(),
      })
    }

    return { success: true }
  } catch (error) {
    console.error('Failed to send Pusher notification:', error)
    return { success: false, error }
  }
}

export async function sendInterventionUpdate(
  studentId: string,
  intervention: {
    id: string
    planType: string
    status: string
    title: string
  }
) {
  try {
    const pusher = getPusherInstance()

    await pusher.trigger(`student-${studentId}`, 'intervention-update', {
      interventionId: intervention.id,
      planType: intervention.planType,
      status: intervention.status,
      title: intervention.title,
      timestamp: new Date().toISOString(),
    })

    return { success: true }
  } catch (error) {
    console.error('Failed to send intervention update:', error)
    return { success: false, error }
  }
}

export async function sendProgressReportNotification(
  studentId: string,
  report: {
    id: string
    courseName: string
    currentGrade?: string
    concerns: string[]
  }
) {
  try {
    const pusher = getPusherInstance()

    await pusher.trigger(`student-${studentId}`, 'progress-report', {
      reportId: report.id,
      courseName: report.courseName,
      currentGrade: report.currentGrade,
      hasConcerns: report.concerns.length > 0,
      timestamp: new Date().toISOString(),
    })

    return { success: true }
  } catch (error) {
    console.error('Failed to send progress report notification:', error)
    return { success: false, error }
  }
}
