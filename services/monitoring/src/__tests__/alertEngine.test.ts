/**
 * Alert Engine Tests
 * Tests for student performance alert generation and management
 */

import { describe, it, expect, beforeEach, vi, Mock } from 'vitest'
import {
  generateAlertsForStudent,
  createAlert,
  getActiveAlerts,
  acknowledgeAlert,
  resolveAlert,
  dismissAlert,
} from '../services/alertEngine'
import { PrismaClient } from '@aah/database'
import { sendAlertNotification } from '../lib/pusher'
import type { AlertData } from '../types'

// Mock dependencies
vi.mock('@aah/database', () => {
  const mockPrisma = {
    studentProfile: {
      findUnique: vi.fn(),
    },
    alert: {
      create: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
  }
  return {
    PrismaClient: vi.fn(() => mockPrisma),
    AlertSeverity: {
      CRITICAL: 'CRITICAL',
      HIGH: 'HIGH',
      MEDIUM: 'MEDIUM',
      LOW: 'LOW',
    },
  }
})

vi.mock('../lib/pusher', () => ({
  sendAlertNotification: vi.fn().mockResolvedValue(undefined),
}))

const prisma = new PrismaClient()

describe('Alert Engine - generateAlertsForStudent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const createMockStudent = (overrides = {}) => ({
    id: 'student-123',
    userId: 'user-123',
    gpa: 3.0,
    creditHours: 15,
    eligibilityStatus: 'ELIGIBLE',
    performanceMetrics: [],
    complianceRecords: [],
    progressReports: [],
    ...overrides,
  })

  describe('GPA Alerts', () => {
    it('should generate CRITICAL alert for GPA below 1.8', async () => {
      const mockStudent = createMockStudent({
        performanceMetrics: [
          { metricType: 'GPA', value: 1.5, recordedAt: new Date() },
        ],
      })
      ;(prisma.studentProfile.findUnique as Mock).mockResolvedValue(mockStudent)

      const alerts = await generateAlertsForStudent('student-123')

      const gpaAlert = alerts.find(
        (a) => a.alertType === 'ACADEMIC' && a.severity === 'CRITICAL'
      )
      expect(gpaAlert).toBeDefined()
      expect(gpaAlert?.title).toContain('Critical GPA')
      expect(gpaAlert?.message).toContain('1.50')
    })

    it('should generate HIGH alert for GPA between 1.8 and 2.0', async () => {
      const mockStudent = createMockStudent({
        performanceMetrics: [
          { metricType: 'GPA', value: 1.9, recordedAt: new Date() },
        ],
      })
      ;(prisma.studentProfile.findUnique as Mock).mockResolvedValue(mockStudent)

      const alerts = await generateAlertsForStudent('student-123')

      const gpaAlert = alerts.find(
        (a) => a.alertType === 'ACADEMIC' && a.severity === 'HIGH'
      )
      expect(gpaAlert).toBeDefined()
      expect(gpaAlert?.message).toContain('NCAA minimum')
    })

    it('should generate MEDIUM alert for GPA between 2.0 and 2.3', async () => {
      const mockStudent = createMockStudent({
        performanceMetrics: [
          { metricType: 'GPA', value: 2.1, recordedAt: new Date() },
        ],
      })
      ;(prisma.studentProfile.findUnique as Mock).mockResolvedValue(mockStudent)

      const alerts = await generateAlertsForStudent('student-123')

      const gpaAlert = alerts.find(
        (a) => a.alertType === 'ACADEMIC' && a.severity === 'MEDIUM'
      )
      expect(gpaAlert).toBeDefined()
      expect(gpaAlert?.title).toContain('GPA Watch')
    })

    it('should not generate GPA alert for 2.3 or above', async () => {
      const mockStudent = createMockStudent({
        performanceMetrics: [
          { metricType: 'GPA', value: 2.5, recordedAt: new Date() },
        ],
      })
      ;(prisma.studentProfile.findUnique as Mock).mockResolvedValue(mockStudent)

      const alerts = await generateAlertsForStudent('student-123')

      const gpaAlert = alerts.find((a) => a.alertType === 'ACADEMIC')
      expect(gpaAlert).toBeUndefined()
    })
  })

  describe('Attendance Alerts', () => {
    it('should generate CRITICAL alert for attendance below 60%', async () => {
      const mockStudent = createMockStudent({
        performanceMetrics: [
          { metricType: 'ATTENDANCE', value: 55, recordedAt: new Date() },
        ],
      })
      ;(prisma.studentProfile.findUnique as Mock).mockResolvedValue(mockStudent)

      const alerts = await generateAlertsForStudent('student-123')

      const attendanceAlert = alerts.find(
        (a) => a.alertType === 'ATTENDANCE' && a.severity === 'CRITICAL'
      )
      expect(attendanceAlert).toBeDefined()
      expect(attendanceAlert?.message).toContain('55.0%')
    })

    it('should generate HIGH alert for attendance between 60% and 75%', async () => {
      const mockStudent = createMockStudent({
        performanceMetrics: [
          { metricType: 'ATTENDANCE', value: 70, recordedAt: new Date() },
        ],
      })
      ;(prisma.studentProfile.findUnique as Mock).mockResolvedValue(mockStudent)

      const alerts = await generateAlertsForStudent('student-123')

      const attendanceAlert = alerts.find(
        (a) => a.alertType === 'ATTENDANCE' && a.severity === 'HIGH'
      )
      expect(attendanceAlert).toBeDefined()
    })

    it('should generate MEDIUM alert for attendance between 75% and 85%', async () => {
      const mockStudent = createMockStudent({
        performanceMetrics: [
          { metricType: 'ATTENDANCE', value: 80, recordedAt: new Date() },
        ],
      })
      ;(prisma.studentProfile.findUnique as Mock).mockResolvedValue(mockStudent)

      const alerts = await generateAlertsForStudent('student-123')

      const attendanceAlert = alerts.find(
        (a) => a.alertType === 'ATTENDANCE' && a.severity === 'MEDIUM'
      )
      expect(attendanceAlert).toBeDefined()
    })

    it('should not generate attendance alert for 85% or above', async () => {
      const mockStudent = createMockStudent({
        performanceMetrics: [
          { metricType: 'ATTENDANCE', value: 90, recordedAt: new Date() },
        ],
      })
      ;(prisma.studentProfile.findUnique as Mock).mockResolvedValue(mockStudent)

      const alerts = await generateAlertsForStudent('student-123')

      const attendanceAlert = alerts.find((a) => a.alertType === 'ATTENDANCE')
      expect(attendanceAlert).toBeUndefined()
    })
  })

  describe('Credit Hours Alerts', () => {
    it('should generate CRITICAL alert for credit hours below 6', async () => {
      const mockStudent = createMockStudent({
        creditHours: 3,
      })
      ;(prisma.studentProfile.findUnique as Mock).mockResolvedValue(mockStudent)

      const alerts = await generateAlertsForStudent('student-123')

      const creditAlert = alerts.find(
        (a) => a.alertType === 'ELIGIBILITY' && a.severity === 'CRITICAL'
      )
      expect(creditAlert).toBeDefined()
      expect(creditAlert?.message).toContain('3 credit hours')
    })

    it('should generate HIGH alert for credit hours between 6 and 9', async () => {
      const mockStudent = createMockStudent({
        creditHours: 7,
      })
      ;(prisma.studentProfile.findUnique as Mock).mockResolvedValue(mockStudent)

      const alerts = await generateAlertsForStudent('student-123')

      const creditAlert = alerts.find(
        (a) => a.alertType === 'ACADEMIC' && a.severity === 'HIGH'
      )
      expect(creditAlert).toBeDefined()
      expect(creditAlert?.message).toContain('7 credit hours')
    })

    it('should not generate credit hours alert for 9 or above', async () => {
      const mockStudent = createMockStudent({
        creditHours: 12,
      })
      ;(prisma.studentProfile.findUnique as Mock).mockResolvedValue(mockStudent)

      const alerts = await generateAlertsForStudent('student-123')

      const creditAlert = alerts.find(
        (a) => a.message && a.message.includes('credit hours')
      )
      expect(creditAlert).toBeUndefined()
    })
  })

  describe('Eligibility Status Alerts', () => {
    it('should generate CRITICAL alert for non-eligible status', async () => {
      const mockStudent = createMockStudent({
        eligibilityStatus: 'INELIGIBLE',
        gpa: 1.5,
        creditHours: 15,
      })
      ;(prisma.studentProfile.findUnique as Mock).mockResolvedValue(mockStudent)

      const alerts = await generateAlertsForStudent('student-123')

      const eligibilityAlert = alerts.find(
        (a) => a.alertType === 'ELIGIBILITY' && a.title === 'Eligibility Status Alert'
      )
      expect(eligibilityAlert).toBeDefined()
      expect(eligibilityAlert?.severity).toBe('CRITICAL')
      expect(eligibilityAlert?.message).toContain('INELIGIBLE')
    })

    it('should not generate eligibility alert when status is ELIGIBLE', async () => {
      const mockStudent = createMockStudent({
        eligibilityStatus: 'ELIGIBLE',
      })
      ;(prisma.studentProfile.findUnique as Mock).mockResolvedValue(mockStudent)

      const alerts = await generateAlertsForStudent('student-123')

      const eligibilityAlert = alerts.find(
        (a) => a.title === 'Eligibility Status Alert'
      )
      expect(eligibilityAlert).toBeUndefined()
    })

    it('should alert for PROBATION status', async () => {
      const mockStudent = createMockStudent({
        eligibilityStatus: 'PROBATION',
      })
      ;(prisma.studentProfile.findUnique as Mock).mockResolvedValue(mockStudent)

      const alerts = await generateAlertsForStudent('student-123')

      const eligibilityAlert = alerts.find(
        (a) => a.alertType === 'ELIGIBILITY' && a.message.includes('PROBATION')
      )
      expect(eligibilityAlert).toBeDefined()
    })
  })

  describe('Faculty Concerns Alerts', () => {
    it('should generate alert for multiple faculty concerns', async () => {
      const mockStudent = createMockStudent({
        progressReports: [
          { concerns: ['Poor attendance', 'Missing assignments'], submittedAt: new Date() },
          { concerns: ['Late submissions'], submittedAt: new Date() },
        ],
      })
      ;(prisma.studentProfile.findUnique as Mock).mockResolvedValue(mockStudent)

      const alerts = await generateAlertsForStudent('student-123')

      const concernsAlert = alerts.find(
        (a) => a.title === 'Multiple Faculty Concerns'
      )
      expect(concernsAlert).toBeDefined()
      expect(concernsAlert?.severity).toBe('HIGH')
      expect(concernsAlert?.message).toContain('3 concerns')
    })

    it('should not generate alert for less than 3 concerns', async () => {
      const mockStudent = createMockStudent({
        progressReports: [
          { concerns: ['Minor issue'], submittedAt: new Date() },
        ],
      })
      ;(prisma.studentProfile.findUnique as Mock).mockResolvedValue(mockStudent)

      const alerts = await generateAlertsForStudent('student-123')

      const concernsAlert = alerts.find(
        (a) => a.title === 'Multiple Faculty Concerns'
      )
      expect(concernsAlert).toBeUndefined()
    })
  })

  describe('Error Handling', () => {
    it('should throw error when student not found', async () => {
      ;(prisma.studentProfile.findUnique as Mock).mockResolvedValue(null)

      await expect(generateAlertsForStudent('nonexistent')).rejects.toThrow(
        'Student not found'
      )
    })
  })
})

describe('Alert Engine - createAlert', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should create alert and send notification', async () => {
    const mockCreatedAlert = {
      id: 'alert-123',
      studentId: 'student-123',
      alertType: 'ACADEMIC',
      severity: 'HIGH',
      title: 'Test Alert',
      message: 'Test message',
      metadata: {},
      triggeredBy: 'SYSTEM',
    }
    ;(prisma.alert.create as Mock).mockResolvedValue(mockCreatedAlert)

    const alertData: AlertData = {
      studentId: 'student-123',
      alertType: 'ACADEMIC',
      severity: 'HIGH',
      title: 'Test Alert',
      message: 'Test message',
      triggeredBy: 'SYSTEM',
    }

    const result = await createAlert(alertData)

    expect(result).toEqual(mockCreatedAlert)
    expect(prisma.alert.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        studentId: 'student-123',
        alertType: 'ACADEMIC',
        severity: 'HIGH',
      }),
    })
    expect(sendAlertNotification).toHaveBeenCalledWith(
      'student-123',
      expect.objectContaining({
        id: 'alert-123',
        type: 'ACADEMIC',
      })
    )
  })

  it('should include metadata when provided', async () => {
    const mockCreatedAlert = {
      id: 'alert-123',
      studentId: 'student-123',
      metadata: { gpa: 1.8 },
    }
    ;(prisma.alert.create as Mock).mockResolvedValue(mockCreatedAlert)

    const alertData: AlertData = {
      studentId: 'student-123',
      alertType: 'ACADEMIC',
      severity: 'CRITICAL',
      title: 'GPA Alert',
      message: 'Low GPA',
      metadata: { gpa: 1.8 },
      triggeredBy: 'SYSTEM',
    }

    await createAlert(alertData)

    expect(prisma.alert.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        metadata: { gpa: 1.8 },
      }),
    })
  })

  it('should include assignedTo when provided', async () => {
    const mockCreatedAlert = { id: 'alert-123' }
    ;(prisma.alert.create as Mock).mockResolvedValue(mockCreatedAlert)

    const alertData: AlertData = {
      studentId: 'student-123',
      alertType: 'ACADEMIC',
      severity: 'HIGH',
      title: 'Alert',
      message: 'Message',
      triggeredBy: 'SYSTEM',
      assignedTo: 'advisor-456',
    }

    await createAlert(alertData)

    expect(prisma.alert.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        assignedTo: 'advisor-456',
      }),
    })
  })
})

describe('Alert Engine - getActiveAlerts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return active alerts for student', async () => {
    const mockAlerts = [
      { id: 'alert-1', severity: 'CRITICAL', status: 'ACTIVE' },
      { id: 'alert-2', severity: 'HIGH', status: 'ACTIVE' },
    ]
    ;(prisma.alert.findMany as Mock).mockResolvedValue(mockAlerts)

    const result = await getActiveAlerts('student-123')

    expect(result).toEqual(mockAlerts)
    expect(prisma.alert.findMany).toHaveBeenCalledWith({
      where: {
        studentId: 'student-123',
        status: 'ACTIVE',
      },
      orderBy: [{ severity: 'asc' }, { createdAt: 'desc' }],
    })
  })

  it('should return empty array when no active alerts', async () => {
    ;(prisma.alert.findMany as Mock).mockResolvedValue([])

    const result = await getActiveAlerts('student-123')

    expect(result).toEqual([])
  })
})

describe('Alert Engine - acknowledgeAlert', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should acknowledge alert and assign to user', async () => {
    const mockUpdatedAlert = {
      id: 'alert-123',
      status: 'ACKNOWLEDGED',
      assignedTo: 'user-456',
      acknowledgedAt: new Date(),
    }
    ;(prisma.alert.update as Mock).mockResolvedValue(mockUpdatedAlert)

    const result = await acknowledgeAlert('alert-123', 'user-456')

    expect(result.status).toBe('ACKNOWLEDGED')
    expect(result.assignedTo).toBe('user-456')
    expect(prisma.alert.update).toHaveBeenCalledWith({
      where: { id: 'alert-123' },
      data: expect.objectContaining({
        status: 'ACKNOWLEDGED',
        assignedTo: 'user-456',
      }),
    })
  })
})

describe('Alert Engine - resolveAlert', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should resolve alert with resolution notes', async () => {
    const mockUpdatedAlert = {
      id: 'alert-123',
      status: 'RESOLVED',
      resolution: 'Student met with advisor',
      resolvedAt: new Date(),
    }
    ;(prisma.alert.update as Mock).mockResolvedValue(mockUpdatedAlert)

    const result = await resolveAlert('alert-123', 'Student met with advisor', 'user-456')

    expect(result.status).toBe('RESOLVED')
    expect(result.resolution).toBe('Student met with advisor')
    expect(prisma.alert.update).toHaveBeenCalledWith({
      where: { id: 'alert-123' },
      data: expect.objectContaining({
        status: 'RESOLVED',
        resolution: 'Student met with advisor',
        assignedTo: 'user-456',
      }),
    })
  })
})

describe('Alert Engine - dismissAlert', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should dismiss alert', async () => {
    const mockUpdatedAlert = {
      id: 'alert-123',
      status: 'DISMISSED',
    }
    ;(prisma.alert.update as Mock).mockResolvedValue(mockUpdatedAlert)

    const result = await dismissAlert('alert-123')

    expect(result.status).toBe('DISMISSED')
    expect(prisma.alert.update).toHaveBeenCalledWith({
      where: { id: 'alert-123' },
      data: { status: 'DISMISSED' },
    })
  })
})
