// Alert threshold configurations
import { AlertThresholds } from '../types'

export const DEFAULT_THRESHOLDS: AlertThresholds = {
  gpa: {
    critical: 1.8, // Below NCAA minimum
    high: 2.0, // At NCAA minimum
    medium: 2.3, // Below initial eligibility standard
  },
  attendance: {
    critical: 60, // Below 60% attendance
    high: 75, // Below 75% attendance
    medium: 85, // Below 85% attendance
  },
  creditHours: {
    critical: 6, // Below minimum for eligibility
    high: 9, // Below recommended pace
  },
}

export const METRIC_BENCHMARKS = {
  gpa: {
    excellent: 3.5,
    good: 3.0,
    satisfactory: 2.5,
    atRisk: 2.0,
  },
  attendance: {
    excellent: 95,
    good: 90,
    satisfactory: 85,
    atRisk: 75,
  },
  creditHours: {
    fullTime: 12,
    recommended: 15,
    partTime: 9,
  },
  studyHours: {
    recommended: 20, // Hours per week
    minimum: 10,
  },
}

export function determineMetricStatus(
  metricType: 'GPA' | 'ATTENDANCE' | 'CREDIT_HOURS',
  value: number
): 'ABOVE_TARGET' | 'ON_TARGET' | 'BELOW_TARGET' | 'AT_RISK' {
  switch (metricType) {
    case 'GPA':
      if (value >= METRIC_BENCHMARKS.gpa.excellent) return 'ABOVE_TARGET'
      if (value >= METRIC_BENCHMARKS.gpa.good) return 'ON_TARGET'
      if (value >= METRIC_BENCHMARKS.gpa.satisfactory) return 'BELOW_TARGET'
      return 'AT_RISK'

    case 'ATTENDANCE':
      if (value >= METRIC_BENCHMARKS.attendance.excellent) return 'ABOVE_TARGET'
      if (value >= METRIC_BENCHMARKS.attendance.good) return 'ON_TARGET'
      if (value >= METRIC_BENCHMARKS.attendance.satisfactory)
        return 'BELOW_TARGET'
      return 'AT_RISK'

    case 'CREDIT_HOURS':
      if (value >= METRIC_BENCHMARKS.creditHours.recommended)
        return 'ABOVE_TARGET'
      if (value >= METRIC_BENCHMARKS.creditHours.fullTime) return 'ON_TARGET'
      if (value >= METRIC_BENCHMARKS.creditHours.partTime) return 'BELOW_TARGET'
      return 'AT_RISK'

    default:
      return 'ON_TARGET'
  }
}

export function calculateTrend(
  current: number,
  previous: number,
  threshold: number = 0.1
): 'IMPROVING' | 'STABLE' | 'DECLINING' {
  const change = ((current - previous) / previous) * 100

  if (Math.abs(change) < threshold) return 'STABLE'
  return change > 0 ? 'IMPROVING' : 'DECLINING'
}
