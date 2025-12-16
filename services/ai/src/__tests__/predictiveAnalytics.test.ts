/**
 * Predictive Analytics Service Tests
 * Tests for student risk prediction and recommendations
 */

import { describe, it, expect, beforeEach, vi, Mock } from 'vitest'
import { PredictiveAnalyticsService } from '../services/predictiveAnalytics'
import { prisma } from '@aah/database'
import { ChatOpenAI } from '@langchain/openai'

// Mock dependencies
vi.mock('@aah/database', () => ({
  prisma: {
    studentProfile: {
      findUnique: vi.fn(),
    },
    studentPrediction: {
      create: vi.fn(),
    },
  },
}))

vi.mock('@langchain/openai', () => ({
  ChatOpenAI: vi.fn().mockImplementation(() => ({
    invoke: vi.fn().mockResolvedValue({
      content: `Based on the analysis, here are recommendations:
1. Schedule immediate tutoring sessions
2. Implement mandatory study hall attendance
3. Meet with academic advisor weekly
4. Join peer study groups
5. Consider time management workshop`,
    }),
  })),
}))

vi.mock('../config', () => ({
  AI_CONFIG: {
    models: {
      advanced: 'gpt-4',
    },
    openai: {
      apiKey: 'test-key',
    },
    promptTemplates: {
      riskAssessment: 'Analyze {academicData} {attendanceData} {complianceData} {supportData}',
    },
  },
}))

describe('PredictiveAnalyticsService', () => {
  let service: PredictiveAnalyticsService

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset ChatOpenAI mock to default successful implementation
    ;(ChatOpenAI as Mock).mockImplementation(() => ({
      invoke: vi.fn().mockResolvedValue({
        content: `Based on the analysis, here are recommendations:
1. Schedule immediate tutoring sessions
2. Implement mandatory study hall attendance
3. Meet with academic advisor weekly
4. Join peer study groups
5. Consider time management workshop`,
      }),
    }))
    service = new PredictiveAnalyticsService()
  })

  // Helper to create mock student data
  const createMockStudentProfile = (overrides = {}) => ({
    userId: 'user-123',
    studentId: 'student-123',
    sport: 'Basketball',
    gpa: 3.0,
    creditHours: 15,
    eligibilityStatus: 'ELIGIBLE',
    academicStanding: 'GOOD_STANDING',
    user: { firstName: 'John', lastName: 'Doe' },
    complianceRecords: [],
    performanceMetrics: [],
    alerts: [],
    progressReports: [],
    ...overrides,
  })

  describe('predictRisk', () => {
    it('should return low risk for high-performing student', async () => {
      const mockProfile = createMockStudentProfile({
        gpa: 3.8,
        creditHours: 16,
        eligibilityStatus: 'ELIGIBLE',
        performanceMetrics: [
          { attendanceRate: 95, recordedAt: new Date() },
          { attendanceRate: 98, recordedAt: new Date() },
        ],
      })

      ;(prisma.studentProfile.findUnique as Mock).mockResolvedValue(mockProfile)
      ;(prisma.studentPrediction.create as Mock).mockResolvedValue({ id: 'pred-1' })

      const result = await service.predictRisk('student-123')

      expect(result.overallRisk).toBe('low')
      expect(result.riskScore).toBeLessThan(0.4)
      expect(result.studentId).toBe('student-123')
    })

    it('should return high risk for student with GPA below 2.5', async () => {
      // GPA 2.3 -> impact 0.6 -> riskScore 0.6 -> 'high' (>= 0.6 threshold)
      const mockProfile = createMockStudentProfile({
        gpa: 2.3,
        creditHours: 15,
      })

      ;(prisma.studentProfile.findUnique as Mock).mockResolvedValue(mockProfile)
      ;(prisma.studentPrediction.create as Mock).mockResolvedValue({ id: 'pred-1' })

      const result = await service.predictRisk('student-123')

      expect(result.overallRisk).toBe('high')
      expect(result.factors.some((f) => f.factor === 'Below average GPA')).toBe(true)
    })

    it('should return high risk for student with low GPA', async () => {
      const mockProfile = createMockStudentProfile({
        gpa: 1.8,
        creditHours: 15,
      })

      ;(prisma.studentProfile.findUnique as Mock).mockResolvedValue(mockProfile)
      ;(prisma.studentPrediction.create as Mock).mockResolvedValue({ id: 'pred-1' })

      const result = await service.predictRisk('student-123')

      expect(['high', 'critical']).toContain(result.overallRisk)
      expect(result.factors.some((f) => f.factor === 'Low GPA')).toBe(true)
    })

    it('should return critical risk for student with multiple risk factors', async () => {
      // To achieve critical (>= 0.8), need high average impact
      // GPA < 2.0: 0.9, AT_RISK: 0.95, 4 alerts: 0.8 = avg 0.883
      const mockProfile = createMockStudentProfile({
        gpa: 1.5,
        creditHours: 15, // Above 12 to avoid adding another factor
        eligibilityStatus: 'AT_RISK',
        alerts: [
          { id: 'alert-1', status: 'ACTIVE' },
          { id: 'alert-2', status: 'ACTIVE' },
          { id: 'alert-3', status: 'ACTIVE' },
          { id: 'alert-4', status: 'ACTIVE' },
        ],
        progressReports: [],
        performanceMetrics: [
          { attendanceRate: 95, recordedAt: new Date() }, // High attendance
        ],
      })

      ;(prisma.studentProfile.findUnique as Mock).mockResolvedValue(mockProfile)
      ;(prisma.studentPrediction.create as Mock).mockResolvedValue({ id: 'pred-1' })

      const result = await service.predictRisk('student-123')

      expect(result.overallRisk).toBe('critical')
      expect(result.riskScore).toBeGreaterThanOrEqual(0.8)
      expect(result.factors.length).toBeGreaterThanOrEqual(3)
    })

    it('should include recommendations by default', async () => {
      const mockProfile = createMockStudentProfile({
        gpa: 2.3,
      })

      ;(prisma.studentProfile.findUnique as Mock).mockResolvedValue(mockProfile)
      ;(prisma.studentPrediction.create as Mock).mockResolvedValue({ id: 'pred-1' })

      const result = await service.predictRisk('student-123')

      expect(result.recommendations).toBeDefined()
      expect(result.recommendations.length).toBeGreaterThan(0)
    })

    it('should exclude recommendations when option is false', async () => {
      const mockProfile = createMockStudentProfile()

      ;(prisma.studentProfile.findUnique as Mock).mockResolvedValue(mockProfile)
      ;(prisma.studentPrediction.create as Mock).mockResolvedValue({ id: 'pred-1' })

      const result = await service.predictRisk('student-123', {
        includeRecommendations: false,
      })

      expect(result.recommendations).toHaveLength(0)
    })

    it('should store prediction in database', async () => {
      const mockProfile = createMockStudentProfile()

      ;(prisma.studentProfile.findUnique as Mock).mockResolvedValue(mockProfile)
      ;(prisma.studentPrediction.create as Mock).mockResolvedValue({ id: 'pred-1' })

      await service.predictRisk('student-123')

      expect(prisma.studentPrediction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-123',
          predictionType: 'risk_assessment',
          result: expect.objectContaining({
            overallRisk: expect.any(String),
            riskScore: expect.any(Number),
          }),
        }),
      })
    })

    it('should throw error when student not found', async () => {
      ;(prisma.studentProfile.findUnique as Mock).mockResolvedValue(null)

      await expect(service.predictRisk('nonexistent')).rejects.toThrow(
        'Student not found'
      )
    })

    it('should include generatedAt timestamp', async () => {
      const mockProfile = createMockStudentProfile()

      ;(prisma.studentProfile.findUnique as Mock).mockResolvedValue(mockProfile)
      ;(prisma.studentPrediction.create as Mock).mockResolvedValue({ id: 'pred-1' })

      const beforeTest = new Date()
      const result = await service.predictRisk('student-123')
      const afterTest = new Date()

      expect(result.generatedAt).toBeDefined()
      expect(result.generatedAt.getTime()).toBeGreaterThanOrEqual(beforeTest.getTime())
      expect(result.generatedAt.getTime()).toBeLessThanOrEqual(afterTest.getTime())
    })
  })

  describe('Risk Factor Calculation', () => {
    it('should detect insufficient credit hours', async () => {
      const mockProfile = createMockStudentProfile({
        creditHours: 9,
      })

      ;(prisma.studentProfile.findUnique as Mock).mockResolvedValue(mockProfile)
      ;(prisma.studentPrediction.create as Mock).mockResolvedValue({ id: 'pred-1' })

      const result = await service.predictRisk('student-123')

      const creditFactor = result.factors.find((f) =>
        f.factor.includes('credit hours')
      )
      expect(creditFactor).toBeDefined()
      expect(creditFactor?.category).toBe('academic')
    })

    it('should detect low attendance', async () => {
      // Average must be < 70 for 'declining' trend (implementation: avgAttendance < 70)
      const mockProfile = createMockStudentProfile({
        performanceMetrics: [
          { attendanceRate: 65, recordedAt: new Date() },
          { attendanceRate: 60, recordedAt: new Date() },
          { attendanceRate: 68, recordedAt: new Date() },
        ],
      })

      ;(prisma.studentProfile.findUnique as Mock).mockResolvedValue(mockProfile)
      ;(prisma.studentPrediction.create as Mock).mockResolvedValue({ id: 'pred-1' })

      const result = await service.predictRisk('student-123')

      const attendanceFactor = result.factors.find(
        (f) => f.category === 'attendance'
      )
      expect(attendanceFactor).toBeDefined()
      expect(attendanceFactor?.trend).toBe('declining')
    })

    it('should detect eligibility risk status', async () => {
      const mockProfile = createMockStudentProfile({
        eligibilityStatus: 'AT_RISK',
      })

      ;(prisma.studentProfile.findUnique as Mock).mockResolvedValue(mockProfile)
      ;(prisma.studentPrediction.create as Mock).mockResolvedValue({ id: 'pred-1' })

      const result = await service.predictRisk('student-123')

      const complianceFactor = result.factors.find(
        (f) => f.category === 'compliance'
      )
      expect(complianceFactor).toBeDefined()
      expect(complianceFactor?.impact).toBe(0.95)
    })

    it('should scale active alerts impact appropriately', async () => {
      const mockProfile = createMockStudentProfile({
        alerts: [
          { id: 'alert-1', status: 'ACTIVE' },
          { id: 'alert-2', status: 'ACTIVE' },
        ],
      })

      ;(prisma.studentProfile.findUnique as Mock).mockResolvedValue(mockProfile)
      ;(prisma.studentPrediction.create as Mock).mockResolvedValue({ id: 'pred-1' })

      const result = await service.predictRisk('student-123')

      const alertsFactor = result.factors.find(
        (f) => f.factor.includes('active alerts')
      )
      expect(alertsFactor).toBeDefined()
      expect(alertsFactor?.impact).toBe(0.4) // 2 * 0.2
    })

    it('should cap alerts impact at 0.8', async () => {
      const mockProfile = createMockStudentProfile({
        alerts: Array(10).fill({ id: 'alert', status: 'ACTIVE' }),
      })

      ;(prisma.studentProfile.findUnique as Mock).mockResolvedValue(mockProfile)
      ;(prisma.studentPrediction.create as Mock).mockResolvedValue({ id: 'pred-1' })

      const result = await service.predictRisk('student-123')

      const alertsFactor = result.factors.find(
        (f) => f.factor.includes('active alerts')
      )
      expect(alertsFactor?.impact).toBe(0.8)
    })

    it('should detect negative progress reports', async () => {
      const mockProfile = createMockStudentProfile({
        progressReports: [
          { status: 'NEEDS_IMPROVEMENT', submittedAt: new Date() },
        ],
      })

      ;(prisma.studentProfile.findUnique as Mock).mockResolvedValue(mockProfile)
      ;(prisma.studentPrediction.create as Mock).mockResolvedValue({ id: 'pred-1' })

      const result = await service.predictRisk('student-123')

      const reportFactor = result.factors.find((f) =>
        f.factor.includes('progress reports')
      )
      expect(reportFactor).toBeDefined()
    })
  })

  describe('Predictions Generation', () => {
    it('should generate graduation likelihood', async () => {
      // Must include good performanceMetrics to avoid 0 attendance triggering risk
      const mockProfile = createMockStudentProfile({
        gpa: 3.5,
        performanceMetrics: [
          { attendanceRate: 95, recordedAt: new Date() },
        ],
      })

      ;(prisma.studentProfile.findUnique as Mock).mockResolvedValue(mockProfile)
      ;(prisma.studentPrediction.create as Mock).mockResolvedValue({ id: 'pred-1' })

      const result = await service.predictRisk('student-123')

      expect(result.predictions.graduationLikelihood).toBeDefined()
      expect(result.predictions.graduationLikelihood).toBeGreaterThan(0.5)
    })

    it('should generate eligibility risk prediction', async () => {
      const mockProfile = createMockStudentProfile()

      ;(prisma.studentProfile.findUnique as Mock).mockResolvedValue(mockProfile)
      ;(prisma.studentPrediction.create as Mock).mockResolvedValue({ id: 'pred-1' })

      const result = await service.predictRisk('student-123')

      expect(result.predictions.eligibilityRisk).toBeDefined()
      expect(result.predictions.eligibilityRisk).toBeGreaterThanOrEqual(0)
      expect(result.predictions.eligibilityRisk).toBeLessThanOrEqual(1)
    })

    it('should generate academic success probability', async () => {
      const mockProfile = createMockStudentProfile()

      ;(prisma.studentProfile.findUnique as Mock).mockResolvedValue(mockProfile)
      ;(prisma.studentPrediction.create as Mock).mockResolvedValue({ id: 'pred-1' })

      const result = await service.predictRisk('student-123')

      expect(result.predictions.academicSuccessProbability).toBeDefined()
      expect(result.predictions.academicSuccessProbability).toBeGreaterThanOrEqual(0)
      expect(result.predictions.academicSuccessProbability).toBeLessThanOrEqual(1)
    })

    it('should reflect higher risk in lower predictions', async () => {
      // Both profiles need performanceMetrics to avoid 0 attendance triggering risk
      const highRiskProfile = createMockStudentProfile({
        gpa: 1.5,
        eligibilityStatus: 'AT_RISK',
        alerts: [{ id: 'alert-1', status: 'ACTIVE' }],
        performanceMetrics: [
          { attendanceRate: 60, recordedAt: new Date() },
        ],
      })

      ;(prisma.studentProfile.findUnique as Mock).mockResolvedValue(highRiskProfile)
      ;(prisma.studentPrediction.create as Mock).mockResolvedValue({ id: 'pred-1' })

      const highRiskResult = await service.predictRisk('student-123')

      const lowRiskProfile = createMockStudentProfile({
        gpa: 3.8,
        creditHours: 16,
        performanceMetrics: [
          { attendanceRate: 95, recordedAt: new Date() },
        ],
      })

      ;(prisma.studentProfile.findUnique as Mock).mockResolvedValue(lowRiskProfile)

      const lowRiskResult = await service.predictRisk('student-456')

      expect(highRiskResult.predictions.graduationLikelihood).toBeLessThan(
        lowRiskResult.predictions.graduationLikelihood
      )
    })
  })

  describe('Recommendations', () => {
    it('should parse AI-generated recommendations', async () => {
      const mockProfile = createMockStudentProfile({
        gpa: 2.0,
      })

      ;(prisma.studentProfile.findUnique as Mock).mockResolvedValue(mockProfile)
      ;(prisma.studentPrediction.create as Mock).mockResolvedValue({ id: 'pred-1' })

      const result = await service.predictRisk('student-123')

      expect(result.recommendations.length).toBeGreaterThan(0)
      expect(result.recommendations[0]).toHaveProperty('priority')
      expect(result.recommendations[0]).toHaveProperty('action')
      expect(result.recommendations[0]).toHaveProperty('expectedImpact')
    })

    it('should limit recommendations to 5', async () => {
      const mockProfile = createMockStudentProfile()

      ;(prisma.studentProfile.findUnique as Mock).mockResolvedValue(mockProfile)
      ;(prisma.studentPrediction.create as Mock).mockResolvedValue({ id: 'pred-1' })

      const result = await service.predictRisk('student-123')

      expect(result.recommendations.length).toBeLessThanOrEqual(5)
    })

    it('should return default recommendations on AI error', async () => {
      const mockProfile = createMockStudentProfile({
        gpa: 1.8,
      })

      ;(prisma.studentProfile.findUnique as Mock).mockResolvedValue(mockProfile)
      ;(prisma.studentPrediction.create as Mock).mockResolvedValue({ id: 'pred-1' })

      // Make the LLM throw an error
      const mockLLM = (ChatOpenAI as Mock).mockImplementation(() => ({
        invoke: vi.fn().mockRejectedValue(new Error('API error')),
      }))

      const errorService = new PredictiveAnalyticsService()
      const result = await errorService.predictRisk('student-123')

      expect(result.recommendations.length).toBeGreaterThan(0)
      expect(result.recommendations.some((r) => r.action.includes('tutoring'))).toBe(true)
    })

    it('should assign correct priority based on risk factors', async () => {
      const mockProfile = createMockStudentProfile({
        gpa: 1.5,
        eligibilityStatus: 'AT_RISK',
      })

      ;(prisma.studentProfile.findUnique as Mock).mockResolvedValue(mockProfile)
      ;(prisma.studentPrediction.create as Mock).mockResolvedValue({ id: 'pred-1' })

      const result = await service.predictRisk('student-123')

      const highPriorityRecs = result.recommendations.filter(
        (r) => r.priority === 'high'
      )
      expect(highPriorityRecs.length).toBeGreaterThan(0)
    })
  })

  describe('Risk Score Calculation', () => {
    it('should return 0 for no risk factors', async () => {
      const mockProfile = createMockStudentProfile({
        gpa: 3.8,
        creditHours: 16,
        eligibilityStatus: 'ELIGIBLE',
        performanceMetrics: [{ attendanceRate: 95, recordedAt: new Date() }],
      })

      ;(prisma.studentProfile.findUnique as Mock).mockResolvedValue(mockProfile)
      ;(prisma.studentPrediction.create as Mock).mockResolvedValue({ id: 'pred-1' })

      const result = await service.predictRisk('student-123')

      expect(result.riskScore).toBe(0)
      expect(result.factors).toHaveLength(0)
    })

    it('should cap risk score at 1.0', async () => {
      const mockProfile = createMockStudentProfile({
        gpa: 1.0,
        creditHours: 3,
        eligibilityStatus: 'AT_RISK',
        alerts: Array(10).fill({ id: 'alert', status: 'ACTIVE' }),
        performanceMetrics: [{ attendanceRate: 40, recordedAt: new Date() }],
        progressReports: Array(5).fill({ status: 'FAILING', submittedAt: new Date() }),
      })

      ;(prisma.studentProfile.findUnique as Mock).mockResolvedValue(mockProfile)
      ;(prisma.studentPrediction.create as Mock).mockResolvedValue({ id: 'pred-1' })

      const result = await service.predictRisk('student-123')

      expect(result.riskScore).toBeLessThanOrEqual(1)
    })
  })

  describe('Data Gathering', () => {
    it('should include proper relations in query', async () => {
      const mockProfile = createMockStudentProfile()

      ;(prisma.studentProfile.findUnique as Mock).mockResolvedValue(mockProfile)
      ;(prisma.studentPrediction.create as Mock).mockResolvedValue({ id: 'pred-1' })

      await service.predictRisk('student-123')

      expect(prisma.studentProfile.findUnique).toHaveBeenCalledWith({
        where: { studentId: 'student-123' },
        include: expect.objectContaining({
          user: true,
          complianceRecords: expect.any(Object),
          performanceMetrics: expect.any(Object),
          alerts: expect.any(Object),
          progressReports: expect.any(Object),
        }),
      })
    })

    it('should limit compliance records to last 5', async () => {
      const mockProfile = createMockStudentProfile()

      ;(prisma.studentProfile.findUnique as Mock).mockResolvedValue(mockProfile)
      ;(prisma.studentPrediction.create as Mock).mockResolvedValue({ id: 'pred-1' })

      await service.predictRisk('student-123')

      expect(prisma.studentProfile.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            complianceRecords: expect.objectContaining({
              take: 5,
            }),
          }),
        })
      )
    })

    it('should only include active alerts', async () => {
      const mockProfile = createMockStudentProfile()

      ;(prisma.studentProfile.findUnique as Mock).mockResolvedValue(mockProfile)
      ;(prisma.studentPrediction.create as Mock).mockResolvedValue({ id: 'pred-1' })

      await service.predictRisk('student-123')

      expect(prisma.studentProfile.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            alerts: expect.objectContaining({
              where: { status: 'ACTIVE' },
            }),
          }),
        })
      )
    })
  })
})
