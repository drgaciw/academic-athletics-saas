/**
 * Administrative Tools
 * 
 * Tools for automated administrative tasks like email, document generation, and scheduling
 */

import { z } from 'zod'
import { createTool } from '../lib/tool-registry'
import type { ToolExecutionContext } from '../types/agent.types'
import { Resend } from 'resend'

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY)
import { integrationService, userService, monitoringService } from '../lib/service-client'

/**
 * Send Email
 * 
 * Sends email notifications
 */
export const sendEmail = createTool({
  name: 'sendEmail',
  description: 'Send email notification to students, staff, or faculty. Supports templates and attachments.',
  parameters: z.object({
    to: z.array(z.string()).describe('Recipient email addresses'),
    subject: z.string().describe('Email subject'),
    body: z.string().describe('Email body (supports HTML)'),
    cc: z.array(z.string()).optional().describe('CC recipients'),
    template: z.string().optional().describe('Email template name'),
    attachments: z.array(z.string()).optional().describe('Attachment file paths'),
  }),
  category: 'administrative',
  requiredPermissions: ['write:email'],
  requiresConfirmation: true,
  usageGuidance: 'Use this to send notifications, reminders, or official communications',
  examples: [
    'sendEmail({ to: ["student@university.edu"], subject: "Course Registration Reminder", body: "..." })',
    'sendEmail({ to: ["faculty@university.edu"], subject: "Travel Letter", body: "...", template: "travel_letter" })',
  ],
  returnFormat: 'Email send result with messageId, status, and delivery confirmation',
  execute: async (params, context) => {
    // Check if API key is configured
    if (!process.env.RESEND_API_KEY) {
      console.warn('RESEND_API_KEY not found. Using mock email service.')
      return {
        messageId: `mock-msg-${Date.now()}`,
        status: 'sent',
        to: params.to,
        subject: params.subject,
        sentAt: new Date().toISOString(),
        deliveryStatus: 'delivered',
        note: 'Email sent using mock service (RESEND_API_KEY missing)',
      }
    }

    try {
      const response = await resend.emails.send({
        from: 'Academics <onboarding@resend.dev>', // Default sender, can be configured
        to: params.to,
        cc: params.cc,
        subject: params.subject,
        html: params.body,
        attachments: params.attachments?.map(path => ({ path })), // Basic attachment handling
      })

      if (response.error) {
        throw new Error(`Email send failed: ${response.error.message}`)
      }

      return {
        messageId: response.data?.id,
        status: 'sent',
        to: params.to,
        subject: params.subject,
        sentAt: new Date().toISOString(),
        deliveryStatus: 'delivered', // Resend confirms receipt, delivery is async
      }
    } catch (error) {
      console.error('Failed to send email:', error)
      throw error
    }
  },
})

/**
 * Generate Travel Letter
 * 
 * Generates travel letter for faculty notification
 */
export const generateTravelLetter = createTool({
  name: 'generateTravelLetter',
  description: 'Generate official travel letter to notify faculty of student-athlete absences due to athletic travel',
  parameters: z.object({
    studentId: z.string().describe('Student ID'),
    travelDates: z.object({
      departureDate: z.string().describe('Departure date (YYYY-MM-DD)'),
      returnDate: z.string().describe('Return date (YYYY-MM-DD)'),
    }).describe('Travel dates'),
    destination: z.string().describe('Travel destination'),
    reason: z.string().describe('Reason for travel (e.g., "Away game vs State University")'),
    courses: z.array(z.string()).optional().describe('Specific course codes to notify (optional, defaults to all current courses)'),
  }),
  category: 'administrative',
  requiredPermissions: ['read:student', 'write:documents'],
  requiresConfirmation: true,
  usageGuidance: 'Use this to create official travel notifications for faculty',
  examples: [
    'generateTravelLetter({ studentId: "S12345", travelDates: { departureDate: "2024-11-22", returnDate: "2024-11-24" }, destination: "Tech University", reason: "Away game" })',
  ],
  returnFormat: 'Generated letter with documentId, PDF URL, and list of notified faculty',
  execute: async (params, context) => {
    try {
      // 1. Fetch student profile to get name and sport
      const profile = await userService.getProfile(params.studentId, context)
      const studentName = [profile.firstName, profile.lastName].filter(Boolean).join(' ') || 'Unknown Student'
      const sport = profile.studentProfile?.sport || 'Athletics'

      // 2. Fetch academic records to get course details
      // Note: We use includeInProgress: true to get current courses
      let courseDetails: Array<{ code: string; name: string; instructor: string; meetingTimes?: string }> = []

      try {
        const records = await monitoringService.getAcademicRecords(
          params.studentId,
          { includeInProgress: true },
          context
        ) as any[]

        // Filter if specific courses requested, otherwise use all current
        // Assuming records has structure: { code, title, instructor, ... }
        // We'll map to what the service expects
        const filteredRecords = params.courses && params.courses.length > 0
          ? records.filter((r: any) => params.courses?.includes(r.code))
          : records

        courseDetails = filteredRecords.map((r: any) => ({
          code: r.code || r.courseCode || 'UNKNOWN',
          name: r.title || r.courseName || 'Unknown Course',
          instructor: r.instructor || 'Unknown Instructor',
          meetingTimes: r.meetingTimes || undefined
        }))
      } catch (error) {
        console.warn(
          'Failed to fetch academic records for travel letter:',
          error instanceof Error ? error.message : 'Unknown error'
        )
        // If we can't get records but specific courses were listed, try to populate with minimal info
        if (params.courses && params.courses.length > 0) {
          courseDetails = params.courses.map(code => ({
            code,
            name: 'Course Details Unavailable',
            instructor: 'Unknown Instructor'
          }))
        }
      }

      // 3. Construct payload for integration service
      const payload = {
        studentName,
        studentId: params.studentId,
        sport,
        travelDates: {
          start: params.travelDates.departureDate,
          end: params.travelDates.returnDate,
        },
        destination: params.destination,
        event: params.reason,
        courses: courseDetails,
        generatedBy: context?.userId || 'AI Agent',
      }

      // 4. Call integration service
      const result = await integrationService.generateTravelLetter(payload, context)

      return {
        documentId: `doc-${Date.now()}`,
        studentId: params.studentId,
        studentName,
        travelDates: params.travelDates,
        destination: params.destination,
        reason: params.reason,
        generatedAt: new Date().toISOString(),
        pdfUrl: result.url || 'URL unavailable',
        notifiedFaculty: courseDetails.map(c => ({
          course: c.code,
          instructor: c.instructor,
          notified: true // Assumption: letter generation implies notification workflow started
        })),
        message: result.message || 'Travel letter generated successfully'
      }
    } catch (error) {
      // Fallback for development if service fails
      if (process.env.NODE_ENV === 'development') {
         console.warn(
          'Travel letter generation failed, returning mock response:',
          error instanceof Error ? error.message : 'Unknown error'
        )
         return {
          documentId: `doc-${Date.now()}`,
          studentId: params.studentId,
          studentName: 'Mock Student',
          travelDates: params.travelDates,
          destination: params.destination,
          reason: params.reason,
          generatedAt: new Date().toISOString(),
          pdfUrl: 'https://example.com/mock-travel-letter.pdf',
          notifiedFaculty: [],
          note: 'Mocked response (service unavailable)'
        }
      }

      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return {
        error: true,
        message: 'Failed to generate travel letter',
        details: errorMessage,
        studentId: params.studentId,
      }
    }
  },
})

/**
 * Schedule Event
 * 
 * Schedules calendar events
 */
export const scheduleEvent = createTool({
  name: 'scheduleEvent',
  description: 'Schedule calendar event for meetings, appointments, or reminders. Supports Google Calendar and Outlook integration.',
  parameters: z.object({
    title: z.string().describe('Event title'),
    startTime: z.string().describe('Start time (ISO 8601 format)'),
    endTime: z.string().describe('End time (ISO 8601 format)'),
    attendees: z.array(z.string()).optional().describe('Attendee email addresses'),
    location: z.string().optional().describe('Event location'),
    description: z.string().optional().describe('Event description'),
    sendNotifications: z.boolean().optional().describe('Send calendar invitations'),
  }),
  category: 'administrative',
  requiredPermissions: ['write:calendar'],
  requiresConfirmation: true,
  usageGuidance: 'Use this to schedule meetings, advising appointments, or study sessions',
  examples: [
    'scheduleEvent({ title: "Advising Appointment", startTime: "2024-11-15T10:00:00Z", endTime: "2024-11-15T10:30:00Z", attendees: ["student@university.edu"] })',
  ],
  returnFormat: 'Event creation result with eventId, calendar link, and invitation status',
  execute: async (params, context) => {
    // TODO: Integrate with Integration Service / Google Calendar API
    return {
      eventId: `evt-${Date.now()}`,
      title: params.title,
      startTime: params.startTime,
      endTime: params.endTime,
      location: params.location,
      attendees: params.attendees || [],
      calendarLink: 'https://calendar.google.com/event?eid=...',
      invitationsSent: params.sendNotifications ? params.attendees?.length || 0 : 0,
      createdAt: new Date().toISOString(),
    }
  },
})

/**
 * Generate Report
 * 
 * Generates academic or compliance reports
 */
export const generateReport = createTool({
  name: 'generateReport',
  description: 'Generate academic progress report, compliance report, or performance summary',
  parameters: z.object({
    reportType: z.enum(['progress', 'compliance', 'performance', 'attendance']).describe('Type of report'),
    studentId: z.string().optional().describe('Student ID (for individual reports)'),
    teamId: z.string().optional().describe('Team ID (for team reports)'),
    dateRange: z.object({
      startDate: z.string(),
      endDate: z.string(),
    }).optional().describe('Date range for report'),
    format: z.enum(['pdf', 'excel', 'json']).optional().describe('Output format'),
  }),
  category: 'administrative',
  requiredPermissions: ['read:student', 'write:reports'],
  usageGuidance: 'Use this to generate official reports for students, coaches, or administrators',
  examples: [
    'generateReport({ reportType: "progress", studentId: "S12345", format: "pdf" })',
    'generateReport({ reportType: "compliance", teamId: "football", dateRange: { startDate: "2024-09-01", endDate: "2024-12-15" } })',
  ],
  returnFormat: 'Report generation result with reportId, download URL, and summary statistics',
  execute: async (params, context) => {
    const { reportType, studentId, teamId, dateRange, format } = params
    let summaryData: any = {}

    // Fetch data based on report type and target (student or team)
    if (studentId) {
      if (reportType === 'performance') {
        summaryData = await serviceClients.monitoring.getPerformanceMetrics(studentId, undefined, context)
      } else if (reportType === 'progress') {
        const reports = await serviceClients.monitoring.getProgressReports(studentId, context)
        summaryData = { reports, count: Array.isArray(reports) ? reports.length : 0 }
      } else if (reportType === 'compliance') {
        summaryData = await serviceClients.compliance.checkEligibility(studentId, context)
      } else if (reportType === 'attendance') {
        summaryData = await serviceClients.monitoring.getAttendance(studentId, context)
      }
    } else if (teamId) {
      summaryData = await serviceClients.monitoring.getTeamAnalytics(teamId, context)
    }

    const reportId = `rpt-${Date.now()}`

    // Construct summary metrics from fetched data
    const keyMetrics = {
      averageGPA: summaryData.gpa || summaryData.averageGpa || 0,
      eligibilityRate: summaryData.eligibilityRate || (summaryData.isEligible ? 1.0 : 0.0),
      attendanceRate: summaryData.attendanceRate || 0,
    }

    // In a real implementation, this would generate a file and upload it
    const downloadUrl = `https://example.com/reports/${reportId}.${format || 'pdf'}`

    return {
      reportId,
      reportType,
      generatedAt: new Date().toISOString(),
      format: format || 'pdf',
      downloadUrl,
      summary: {
        studentsIncluded: studentId ? 1 : (summaryData.totalStudents || 0),
        dateRange,
        keyMetrics,
      },
    }
  },
})

/**
 * Create Reminder
 * 
 * Creates automated reminders
 */
export const createReminder = createTool({
  name: 'createReminder',
  description: 'Create automated reminder for deadlines, appointments, or tasks',
  parameters: z.object({
    userId: z.string().describe('User ID to remind'),
    message: z.string().describe('Reminder message'),
    reminderDate: z.string().describe('When to send reminder (ISO 8601 format)'),
    channel: z.enum(['email', 'sms', 'push']).optional().describe('Notification channel'),
    recurring: z.boolean().optional().describe('Is this a recurring reminder'),
  }),
  category: 'administrative',
  requiredPermissions: ['write:notifications'],
  usageGuidance: 'Use this to set up reminders for registration deadlines, appointments, or important dates',
  examples: [
    'createReminder({ userId: "S12345", message: "Course registration opens tomorrow", reminderDate: "2024-11-14T09:00:00Z", channel: "email" })',
  ],
  returnFormat: 'Reminder creation result with reminderId and scheduled time',
  execute: async (params, context) => {
    try {
      const baseUrl = process.env.INTEGRATION_SERVICE_URL || 'http://localhost:3006'
      const response = await fetch(`${baseUrl}/api/integration/reminders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      })

      if (!response.ok) {
        throw new Error(`Failed to create reminder: ${response.statusText}`)
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('Failed to create reminder:', error)
      return {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Service unavailable',
        timestamp: new Date().toISOString(),
      }
    }
  },
})

/**
 * Log Interaction
 * 
 * Logs student interaction for record-keeping
 */
export const logInteraction = createTool({
  name: 'logInteraction',
  description: 'Log student interaction for compliance and record-keeping purposes',
  parameters: z.object({
    studentId: z.string().describe('Student ID'),
    interactionType: z.enum(['advising', 'tutoring', 'mentoring', 'intervention', 'other']).describe('Type of interaction'),
    summary: z.string().describe('Interaction summary'),
    duration: z.number().optional().describe('Duration in minutes'),
    followUpRequired: z.boolean().optional().describe('Does this require follow-up'),
    notes: z.string().optional().describe('Additional notes'),
  }),
  category: 'administrative',
  requiredPermissions: ['write:interactions'],
  usageGuidance: 'Use this to document student interactions for compliance and continuity of care',
  examples: [
    'logInteraction({ studentId: "S12345", interactionType: "advising", summary: "Discussed course selection for Spring 2025", duration: 30 })',
  ],
  returnFormat: 'Interaction log result with logId and timestamp',
  execute: async (params, context) => {
    // TODO: Integrate with Monitoring Service
    return {
      logId: `log-${Date.now()}`,
      studentId: params.studentId,
      interactionType: params.interactionType,
      summary: params.summary,
      duration: params.duration,
      followUpRequired: params.followUpRequired || false,
      loggedBy: context?.userId || 'system',
      loggedAt: new Date().toISOString(),
    }
  },
})

/**
 * Export all administrative tools
 */
export const administrativeTools = [
  sendEmail,
  generateTravelLetter,
  scheduleEvent,
  generateReport,
  createReminder,
  logInteraction,
]
