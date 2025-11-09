// Type definitions for Monitoring Service

import { AlertSeverity } from '@aah/database'

export interface PerformanceMetrics {
  studentId: string
  termGpa: number
  cumulativeGpa: number
  creditHours: number
  attendance: number
  studyHours: number
  academicStanding: string
  status: {
    gpa: 'ABOVE_TARGET' | 'ON_TARGET' | 'BELOW_TARGET' | 'AT_RISK'
    creditHours: 'ABOVE_TARGET' | 'ON_TARGET' | 'BELOW_TARGET' | 'AT_RISK'
    attendance: 'ABOVE_TARGET' | 'ON_TARGET' | 'BELOW_TARGET' | 'AT_RISK'
  }
  trends: {
    gpa: 'IMPROVING' | 'STABLE' | 'DECLINING'
    attendance: 'IMPROVING' | 'STABLE' | 'DECLINING'
  }
}

export interface AlertThresholds {
  gpa: {
    critical: number
    high: number
    medium: number
  }
  attendance: {
    critical: number
    high: number
    medium: number
  }
  creditHours: {
    critical: number
    high: number
  }
}

export interface AlertData {
  studentId: string
  alertType: 'ACADEMIC' | 'ELIGIBILITY' | 'ATTENDANCE' | 'BEHAVIORAL'
  severity: AlertSeverity
  title: string
  message: string
  metadata?: Record<string, any>
  triggeredBy?: string
  assignedTo?: string
}

export interface InterventionPlanData {
  studentId: string
  planType: 'ACADEMIC' | 'BEHAVIORAL' | 'ELIGIBILITY' | 'COMPREHENSIVE'
  title: string
  description: string
  goals: Array<{
    id: string
    description: string
    deadline: string
    status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'
  }>
  strategies: Array<{
    id: string
    type: string
    description: string
    assignedTo: string
  }>
  timeline: {
    startDate: string
    checkpoints: Array<{ date: string; description: string }>
    endDate: string
  }
  assignedTo: string
}

export interface ProgressReportData {
  studentId: string
  courseId: string
  courseName: string
  instructor: string
  term: string
  academicYear: string
  currentGrade?: string
  attendance?: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR'
  effort?: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR'
  comments?: string
  concerns: string[]
  recommendations?: string
  submittedBy: string
}

export interface TeamAnalytics {
  teamId: string
  teamName: string
  totalStudents: number
  metrics: {
    averageGpa: number
    averageCreditHours: number
    averageAttendance: number
    eligibilityRate: number
  }
  riskDistribution: {
    critical: number
    high: number
    medium: number
    low: number
  }
  trends: {
    gpa: {
      current: number
      previous: number
      change: number
    }
    eligibility: {
      current: number
      previous: number
      change: number
    }
  }
  alerts: {
    total: number
    bySeverity: {
      critical: number
      high: number
      medium: number
      low: number
    }
  }
  topConcerns: Array<{
    type: string
    count: number
    percentage: number
  }>
}

export interface RiskAssessmentRequest {
  studentId: string
  includeRecommendations?: boolean
}

export interface RiskAssessmentResponse {
  studentId: string
  riskScore: number
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  confidence: number
  factors: Array<{
    factor: string
    impact: 'POSITIVE' | 'NEGATIVE'
    weight: number
    value: any
  }>
  recommendations?: string[]
  generatedAt: string
}
