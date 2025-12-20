/**
 * Tests for administrative tools
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateReport } from '../administrative-tools'
import { serviceClients } from '../../lib/service-client'

// Mock the service clients
vi.mock('../../lib/service-client', () => ({
  serviceClients: {
    monitoring: {
      getPerformanceMetrics: vi.fn(),
      getProgressReports: vi.fn(),
      getAttendance: vi.fn(),
      getTeamAnalytics: vi.fn(),
    },
    compliance: {
      checkEligibility: vi.fn(),
    },
  },
}))

describe('Administrative Tools - generateReport', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Clear environment variables
    delete process.env.REPORTS_BASE_URL
  })

  describe('Input Validation', () => {
    it('should throw error when neither studentId nor teamId is provided', async () => {
      const params = {
        reportType: 'performance' as const,
        format: 'pdf' as const,
      }

      await expect(
        generateReport.execute(params, undefined)
      ).rejects.toThrow('Either studentId or teamId must be provided to generate a report')
    })

    it('should not throw error when studentId is provided', async () => {
      vi.mocked(serviceClients.monitoring.getPerformanceMetrics).mockResolvedValue({
        gpa: 3.5,
        attendanceRate: 0.95,
      })

      const params = {
        reportType: 'performance' as const,
        studentId: 'S12345',
        format: 'pdf' as const,
      }

      const result = await generateReport.execute(params, undefined)
      expect(result).toBeDefined()
      expect(result.reportId).toBeDefined()
    })

    it('should not throw error when teamId is provided', async () => {
      vi.mocked(serviceClients.monitoring.getTeamAnalytics).mockResolvedValue({
        averageGpa: 3.2,
        eligibilityRate: 0.96,
        attendanceRate: 0.94,
        totalStudents: 25,
      })

      const params = {
        reportType: 'performance' as const,
        teamId: 'football',
        format: 'pdf' as const,
      }

      const result = await generateReport.execute(params, undefined)
      expect(result).toBeDefined()
      expect(result.reportId).toBeDefined()
    })
  })

  describe('Error Handling', () => {
    it('should handle service errors gracefully', async () => {
      vi.mocked(serviceClients.monitoring.getPerformanceMetrics).mockRejectedValue(
        new Error('Service unavailable')
      )

      const params = {
        reportType: 'performance' as const,
        studentId: 'S12345',
        format: 'pdf' as const,
      }

      await expect(
        generateReport.execute(params, undefined)
      ).rejects.toThrow('Failed to fetch report data: Service unavailable')
    })

    it('should handle unknown errors', async () => {
      vi.mocked(serviceClients.monitoring.getPerformanceMetrics).mockRejectedValue(
        'Unknown error'
      )

      const params = {
        reportType: 'performance' as const,
        studentId: 'S12345',
        format: 'pdf' as const,
      }

      await expect(
        generateReport.execute(params, undefined)
      ).rejects.toThrow('Failed to fetch report data: Unknown error occurred')
    })
  })

  describe('Type Safety', () => {
    it('should correctly handle performance metrics response', async () => {
      const mockMetrics = {
        gpa: 3.5,
        averageGpa: 3.6,
        attendanceRate: 0.95,
      }
      vi.mocked(serviceClients.monitoring.getPerformanceMetrics).mockResolvedValue(mockMetrics)

      const params = {
        reportType: 'performance' as const,
        studentId: 'S12345',
        format: 'pdf' as const,
      }

      const result = await generateReport.execute(params, undefined)
      expect(result.summary.keyMetrics.averageGPA).toBe(3.5)
      expect(result.summary.keyMetrics.attendanceRate).toBe(0.95)
    })

    it('should correctly handle progress reports response', async () => {
      const mockReports = {
        reports: [{ id: 1 }, { id: 2 }],
        count: 2,
      }
      vi.mocked(serviceClients.monitoring.getProgressReports).mockResolvedValue(mockReports)

      const params = {
        reportType: 'progress' as const,
        studentId: 'S12345',
        format: 'pdf' as const,
      }

      const result = await generateReport.execute(params, undefined)
      expect(result.reportId).toBeDefined()
    })

    it('should correctly handle eligibility check response', async () => {
      const mockEligibility = {
        isEligible: true,
        eligibilityRate: 1.0,
      }
      vi.mocked(serviceClients.compliance.checkEligibility).mockResolvedValue(mockEligibility)

      const params = {
        reportType: 'compliance' as const,
        studentId: 'S12345',
        format: 'pdf' as const,
      }

      const result = await generateReport.execute(params, undefined)
      expect(result.summary.keyMetrics.eligibilityRate).toBe(1.0)
    })

    it('should correctly handle team analytics response', async () => {
      const mockAnalytics = {
        averageGpa: 3.2,
        eligibilityRate: 0.96,
        attendanceRate: 0.94,
        totalStudents: 25,
      }
      vi.mocked(serviceClients.monitoring.getTeamAnalytics).mockResolvedValue(mockAnalytics)

      const params = {
        reportType: 'performance' as const,
        teamId: 'football',
        format: 'pdf' as const,
      }

      const result = await generateReport.execute(params, undefined)
      expect(result.summary.studentsIncluded).toBe(25)
      expect(result.summary.keyMetrics.averageGPA).toBe(3.2)
      expect(result.summary.keyMetrics.eligibilityRate).toBe(0.96)
    })
  })

  describe('Eligibility Rate Logic', () => {
    it('should use eligibilityRate when available', async () => {
      const mockEligibility = {
        eligibilityRate: 0.85,
      }
      vi.mocked(serviceClients.compliance.checkEligibility).mockResolvedValue(mockEligibility)

      const params = {
        reportType: 'compliance' as const,
        studentId: 'S12345',
        format: 'pdf' as const,
      }

      const result = await generateReport.execute(params, undefined)
      expect(result.summary.keyMetrics.eligibilityRate).toBe(0.85)
    })

    it('should default to 0 when eligibilityRate is not available', async () => {
      const mockEligibility = {
        isEligible: true,
      }
      vi.mocked(serviceClients.compliance.checkEligibility).mockResolvedValue(mockEligibility)

      const params = {
        reportType: 'compliance' as const,
        studentId: 'S12345',
        format: 'pdf' as const,
      }

      const result = await generateReport.execute(params, undefined)
      // Should use nullish coalescing, not boolean-to-number conversion
      expect(result.summary.keyMetrics.eligibilityRate).toBe(0)
    })

    it('should use 0 when eligibilityRate is explicitly 0', async () => {
      const mockEligibility = {
        eligibilityRate: 0,
      }
      vi.mocked(serviceClients.compliance.checkEligibility).mockResolvedValue(mockEligibility)

      const params = {
        reportType: 'compliance' as const,
        studentId: 'S12345',
        format: 'pdf' as const,
      }

      const result = await generateReport.execute(params, undefined)
      expect(result.summary.keyMetrics.eligibilityRate).toBe(0)
    })
  })

  describe('Environment-based URL Configuration', () => {
    it('should use REPORTS_BASE_URL when available', async () => {
      process.env.REPORTS_BASE_URL = 'https://reports.example.com'
      
      vi.mocked(serviceClients.monitoring.getPerformanceMetrics).mockResolvedValue({
        gpa: 3.5,
      })

      const params = {
        reportType: 'performance' as const,
        studentId: 'S12345',
        format: 'pdf' as const,
      }

      const result = await generateReport.execute(params, undefined)
      expect(result.downloadUrl).toContain('https://reports.example.com')
    })

    it('should remove trailing slashes from REPORTS_BASE_URL', async () => {
      process.env.REPORTS_BASE_URL = 'https://reports.example.com///'
      
      vi.mocked(serviceClients.monitoring.getPerformanceMetrics).mockResolvedValue({
        gpa: 3.5,
      })

      const params = {
        reportType: 'performance' as const,
        studentId: 'S12345',
        format: 'pdf' as const,
      }

      const result = await generateReport.execute(params, undefined)
      expect(result.downloadUrl).toContain('https://reports.example.com/')
      expect(result.downloadUrl).not.toContain('///')
    })

    it('should fallback to /reports when REPORTS_BASE_URL is not set', async () => {
      vi.mocked(serviceClients.monitoring.getPerformanceMetrics).mockResolvedValue({
        gpa: 3.5,
      })

      const params = {
        reportType: 'performance' as const,
        studentId: 'S12345',
        format: 'pdf' as const,
      }

      const result = await generateReport.execute(params, undefined)
      expect(result.downloadUrl).toMatch(/^\/reports\/rpt-\d+\.pdf$/)
    })

    it('should include format in download URL', async () => {
      vi.mocked(serviceClients.monitoring.getPerformanceMetrics).mockResolvedValue({
        gpa: 3.5,
      })

      const params = {
        reportType: 'performance' as const,
        studentId: 'S12345',
        format: 'xlsx' as const,
      }

      const result = await generateReport.execute(params, undefined)
      expect(result.downloadUrl).toContain('.xlsx')
    })
  })

  describe('Report Data Integration', () => {
    it('should generate report for student performance', async () => {
      const mockMetrics = {
        gpa: 3.5,
        attendanceRate: 0.95,
      }
      vi.mocked(serviceClients.monitoring.getPerformanceMetrics).mockResolvedValue(mockMetrics)

      const params = {
        reportType: 'performance' as const,
        studentId: 'S12345',
        format: 'pdf' as const,
        dateRange: {
          startDate: '2024-09-01',
          endDate: '2024-12-15',
        },
      }

      const result = await generateReport.execute(params, undefined)
      
      expect(result.reportId).toMatch(/^rpt-\d+$/)
      expect(result.reportType).toBe('performance')
      expect(result.format).toBe('pdf')
      expect(result.summary.studentsIncluded).toBe(1)
      expect(result.summary.dateRange).toEqual(params.dateRange)
      expect(result.summary.keyMetrics.averageGPA).toBe(3.5)
    })

    it('should generate report for team analytics', async () => {
      const mockAnalytics = {
        averageGpa: 3.2,
        eligibilityRate: 0.96,
        attendanceRate: 0.94,
        totalStudents: 25,
      }
      vi.mocked(serviceClients.monitoring.getTeamAnalytics).mockResolvedValue(mockAnalytics)

      const params = {
        reportType: 'performance' as const,
        teamId: 'football',
        format: 'pdf' as const,
      }

      const result = await generateReport.execute(params, undefined)
      
      expect(result.summary.studentsIncluded).toBe(25)
      expect(result.summary.keyMetrics.averageGPA).toBe(3.2)
      expect(result.summary.keyMetrics.eligibilityRate).toBe(0.96)
      expect(result.summary.keyMetrics.attendanceRate).toBe(0.94)
    })
  })
})
