'use client'

import { useQuery, type UseQueryOptions } from '@tanstack/react-query'
import { queryKeys } from '../lib/query-keys'

export interface Alert {
  id: string
  type: 'critical' | 'warning' | 'info'
  title: string
  message: string
  studentId?: string
  studentName?: string
  timestamp: string
  acknowledged: boolean
}

export interface AlertsFilters {
  type?: 'critical' | 'warning' | 'info'
  acknowledged?: boolean
  studentId?: string
}

async function fetchAlerts(filters?: AlertsFilters): Promise<Alert[]> {
  const params = new URLSearchParams()
  
  if (filters?.type) params.append('type', filters.type)
  if (filters?.acknowledged !== undefined) params.append('acknowledged', filters.acknowledged.toString())
  if (filters?.studentId) params.append('studentId', filters.studentId)

  const response = await fetch(`/api/monitoring/alerts?${params.toString()}`)
  if (!response.ok) {
    throw new Error('Failed to fetch alerts')
  }
  return response.json()
}

export function useAlerts(
  filters?: AlertsFilters,
  options?: Omit<UseQueryOptions<Alert[], Error>, 'queryKey' | 'queryFn'>
) {
  const filterString = JSON.stringify(filters || {})
  
  return useQuery({
    queryKey: queryKeys.alerts.list(filterString),
    queryFn: () => fetchAlerts(filters),
    ...options,
  })
}