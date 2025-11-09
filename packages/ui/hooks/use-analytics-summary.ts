'use client'

import { useQuery, type UseQueryOptions } from '@tanstack/react-query'
import { queryKeys } from '../lib/query-keys'

export interface AnalyticsSummary {
  totalStudents: number
  activeAlerts: number
  eligibilityPercentage: number
  activeInterventions: number
  trends: {
    studentsChange: number
    alertsChange: number
    eligibilityChange: number
  }
}

async function fetchAnalyticsSummary(): Promise<AnalyticsSummary> {
  const response = await fetch('/api/monitoring/analytics/summary')
  if (!response.ok) {
    throw new Error('Failed to fetch analytics summary')
  }
  return response.json()
}

export function useAnalyticsSummary(
  options?: Omit<UseQueryOptions<AnalyticsSummary, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.monitoring.summary(),
    queryFn: fetchAnalyticsSummary,
    refetchInterval: 30000, // Refetch every 30 seconds for dashboard
    ...options,
  })
}